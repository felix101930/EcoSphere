# src/analysis/analyze_units.py
print("🔬 ANALYZING DATA UNITS AND SCALING")
print("=" * 70)

import json
import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(project_root)

DATA_DIR = os.path.join(project_root, "data", "processed", "hourly")

def load_all_components():
    """Load all hourly component data"""
    print("\n📂 Loading all component data...")
    
    components = {}
    
    # Map files to component names
    component_files = {
        'lighting': 'lighting_hourly.csv',
        'appliances': 'appliances_hourly.csv',
        'equipment_rd': 'equipment_rd_hourly.csv',
        'space_hvac': 'space_hvac_hourly.csv',
        'ventilation': 'ventilation_hourly.csv',
        'total_generation': 'total_generation_hourly.csv',
        'solar_carport': 'solar_carport_hourly.csv',
        'solar_rooftop': 'solar_rooftop_hourly.csv',
        'site_total': 'site_total_hourly.csv',
        'net_energy': 'net_energy_hourly.csv'
    }
    
    for name, filename in component_files.items():
        filepath = os.path.join(DATA_DIR, filename)
        if os.path.exists(filepath):
            df = pd.read_csv(filepath, parse_dates=['timestamp'])
            df.set_index('timestamp', inplace=True)
            components[name] = df
            print(f"   ✅ {name}: {len(df):,} records")
        else:
            print(f"   ❌ {name}: File not found")
    
    return components

def analyze_units(components):
    """Analyze units and scaling"""
    print("\n🔍 ANALYZING UNITS AND SCALING")
    print("=" * 70)
    
    analysis_results = {}
    
    for name, df in components.items():
        print(f"\n📊 {name.upper()}:")
        print("-" * 40)
        
        values = df['value']
        
        # Basic statistics
        stats = {
            'mean': values.mean(),
            'std': values.std(),
            'min': values.min(),
            'max': values.max(),
            'median': values.median(),
            'records': len(values)
        }
        
        # Detect likely unit
        unit_guess = detect_unit(values, name)
        
        # Check for negative values
        negative_pct = (values < 0).sum() / len(values) * 100
        
        print(f"   Mean: {stats['mean']:.2f}")
        print(f"   Std: {stats['std']:.2f}")
        print(f"   Range: {stats['min']:.2f} to {stats['max']:.2f}")
        print(f"   Negative values: {negative_pct:.1f}%")
        print(f"   Likely unit: {unit_guess}")
        
        # Store results
        analysis_results[name] = {
            'stats': stats,
            'unit_guess': unit_guess,
            'negative_pct': negative_pct
        }
    
    return analysis_results

def detect_unit(values, component_name):
    """Detect the most likely unit based on values and component name"""
    mean_val = abs(values.mean())
    
    # Component-specific logic
    if 'solar' in component_name or 'generation' in component_name:
        if mean_val > 1000:
            return "kWh (likely energy)"
        elif mean_val > 1:
            return "kW (likely power)"
        else:
            return "W (likely power)"
    
    elif any(x in component_name for x in ['lighting', 'appliances', 'equipment', 'hvac', 'ventilation']):
        if mean_val > 100:
            return "kW (likely power)"
        elif mean_val > 1:
            return "kW? (check)"
        else:
            return "kW? (very low)"
    
    elif 'site' in component_name or 'total' in component_name or 'net' in component_name:
        if mean_val > 1000:
            return "kWh (likely energy)"
        elif mean_val > 100:
            return "kW (likely power)"
        else:
            return "Unknown"
    
    else:
        if mean_val > 1000:
            return "kWh"
        elif mean_val > 100:
            return "kW"
        elif mean_val > 1:
            return "W"
        else:
            return "Unknown"

def calculate_conversion_factors(components, analysis_results):
    """Calculate conversion factors to standardize units"""
    print("\n🔄 CALCULATING CONVERSION FACTORS")
    print("=" * 70)
    
    # Standardize to kWh for energy, kW for power
    conversion_factors = {}
    
    for name in components.keys():
        unit_guess = analysis_results[name]['unit_guess']
        mean_val = analysis_results[name]['stats']['mean']
        
        # Initial conversion factor
        if 'kWh' in unit_guess:
            # Already in kWh (energy)
            factor = 1.0
            target_unit = 'kWh'
        elif 'kW' in unit_guess:
            # kW to kWh (assuming hourly data: power * 1h = energy)
            factor = 1.0  # 1 kW * 1 hour = 1 kWh
            target_unit = 'kWh'
        elif 'W' in unit_guess:
            # W to kWh (W * 1h / 1000 = kWh)
            factor = 1/1000
            target_unit = 'kWh'
        else:
            # Unknown - try to infer
            if mean_val < 10:
                # Likely kW for small consumption
                factor = 1.0
                target_unit = 'kWh'
            else:
                factor = 1.0
                target_unit = 'kWh (assumed)'
        
        conversion_factors[name] = {
            'factor': factor,
            'target_unit': target_unit,
            'original_guess': unit_guess
        }
        
        print(f"{name:15} | {unit_guess:20} → {target_unit:10} | Factor: {factor:.4f}")
    
    return conversion_factors

def create_normalized_dataset(components, conversion_factors):
    """Create normalized dataset with consistent units"""
    print("\n📁 CREATING NORMALIZED DATASET")
    print("=" * 70)
    
    normalized_data = {}
    
    for name, df in components.items():
        if name in conversion_factors:
            factor = conversion_factors[name]['factor']
            
            # Apply conversion
            df_normalized = df.copy()
            df_normalized['value'] = df_normalized['value'] * factor
            
            # Rename column to include unit
            target_unit = conversion_factors[name]['target_unit']
            df_normalized = df_normalized.rename(columns={'value': f'{name}_{target_unit}'})
            
            normalized_data[name] = df_normalized
            
            print(f"   ✅ {name}: ×{factor:.4f} → {target_unit}")
    
    # Combine all data
    print("\n🔗 Combining all normalized data...")
    
    combined_df = None
    for name, df in normalized_data.items():
        if combined_df is None:
            combined_df = df
        else:
            combined_df = pd.merge(combined_df, df, left_index=True, right_index=True, how='outer')
    
    if combined_df is not None:
        # Sort by timestamp
        combined_df = combined_df.sort_index()
        
        # Save normalized dataset
        output_dir = os.path.join(project_root, "data", "processed", "normalized")
        os.makedirs(output_dir, exist_ok=True)
        
        output_file = os.path.join(output_dir, "components_normalized.csv")
        combined_df.to_csv(output_file)
        
        print(f"\n💾 Saved normalized dataset: {output_file}")
        print(f"   Shape: {combined_df.shape}")
        print(f"   Columns: {list(combined_df.columns)}")
        print(f"   Date range: {combined_df.index.min()} to {combined_df.index.max()}")
        
        return combined_df
    
    return None

def analyze_relationships(combined_df):
    """Analyze relationships between components"""
    print("\n🔗 ANALYZING COMPONENT RELATIONSHIPS")
    print("=" * 70)
    
    if combined_df is None:
        print("   No combined data available")
        return
    
    # Identify consumption columns
    consumption_cols = [col for col in combined_df.columns if any(x in col for x in [
        'lighting', 'appliances', 'equipment', 'hvac', 'ventilation'
    ])]
    
    # Identify generation columns
    generation_cols = [col for col in combined_df.columns if 'solar' in col or 'generation' in col]
    
    # Identify total columns
    total_cols = [col for col in combined_df.columns if 'site' in col or 'total' in col or 'net' in col]
    
    print(f"Consumption columns: {consumption_cols}")
    print(f"Generation columns: {generation_cols}")
    print(f"Total columns: {total_cols}")
    
    # Calculate total consumption from components
    if consumption_cols:
        consumption_sum = combined_df[consumption_cols].sum(axis=1)
        consumption_sum.name = 'total_consumption_kWh'
        
        print(f"\n📈 Total consumption from components:")
        print(f"   Mean: {consumption_sum.mean():.2f} kWh")
        print(f"   Min: {consumption_sum.min():.2f} kWh")
        print(f"   Max: {consumption_sum.max():.2f} kWh")
    
    # Compare with site total if available
    site_total_col = None
    for col in total_cols:
        if 'site' in col:
            site_total_col = col
            break
    
    if site_total_col and 'total_consumption_kWh' in locals():
        # Find common period
        comparison = pd.DataFrame({
            'components_total': consumption_sum,
            'site_total': combined_df[site_total_col]
        }).dropna()
        
        if len(comparison) > 0:
            print(f"\n🔬 COMPARISON: Components vs Site Total")
            print(f"   Common records: {len(comparison):,}")
            print(f"   Components mean: {comparison['components_total'].mean():.2f} kWh")
            print(f"   Site total mean: {comparison['site_total'].mean():.2f} kWh")
            
            # Calculate scaling factor needed
            scale_factor = comparison['site_total'].mean() / comparison['components_total'].mean()
            print(f"   Scaling factor needed: {scale_factor:.4f}x")
            
            # Correlation
            correlation = comparison['components_total'].corr(comparison['site_total'])
            print(f"   Correlation: {correlation:.3f}")
            
            if abs(scale_factor - 1.0) > 0.1:
                print(f"   ⚠️  Significant scaling difference detected!")
    
    # Analyze generation vs consumption
    if generation_cols and consumption_cols:
        print(f"\n⚡ GENERATION vs CONSUMPTION:")
        
        # Find common period for all columns
        all_cols = consumption_cols + generation_cols
        common_data = combined_df[all_cols].dropna()
        
        if len(common_data) > 0:
            total_generation = common_data[generation_cols].sum(axis=1)
            total_consumption = common_data[consumption_cols].sum(axis=1)
            
            net_energy = total_generation - total_consumption
            
            print(f"   Common period: {len(common_data):,} records")
            print(f"   Generation mean: {total_generation.mean():.2f} kWh")
            print(f"   Consumption mean: {total_consumption.mean():.2f} kWh")
            print(f"   Net energy mean: {net_energy.mean():.2f} kWh")
            
            # Check if net matches actual net energy column
            if 'net_energy_kWh' in combined_df.columns:
                actual_net = combined_df['net_energy_kWh'].dropna()
                common_net = pd.DataFrame({
                    'calculated': net_energy,
                    'actual': actual_net
                }).dropna()
                
                if len(common_net) > 0:
                    print(f"   Calculated vs Actual Net Energy:")
                    print(f"     Correlation: {common_net['calculated'].corr(common_net['actual']):.3f}")

def main():
    """Main analysis function"""
    print("Starting unit analysis...")
    
    # Load all components
    components = load_all_components()
    
    if not components:
        print("❌ No components loaded. Exiting.")
        return
    
    # Analyze units
    analysis_results = analyze_units(components)
    
    # Calculate conversion factors
    conversion_factors = calculate_conversion_factors(components, analysis_results)
    
    # Create normalized dataset
    combined_df = create_normalized_dataset(components, conversion_factors)
    
    # Analyze relationships
    analyze_relationships(combined_df)
    
    # Save conversion factors
    output_dir = os.path.join(project_root, "data", "processed", "normalized")
    os.makedirs(output_dir, exist_ok=True)
    
    factors_file = os.path.join(output_dir, "conversion_factors.json")
    with open(factors_file, 'w') as f:
        # Convert numpy types to Python types
        json_ready = {}
        for name, info in conversion_factors.items():
            json_ready[name] = {
                'factor': float(info['factor']),
                'target_unit': info['target_unit'],
                'original_guess': info['original_guess']
            }
        json.dump(json_ready, f, indent=2)
    
    print(f"\n💾 Conversion factors saved: {factors_file}")
    
    print(f"\n{'='*70}")
    print("🎯 RECOMMENDED NEXT STEPS:")
    print("=" * 70)
    print("1. Check the normalized dataset: data/processed/normalized/components_normalized.csv")
    print("2. Review conversion factors: data/processed/normalized/conversion_factors.json")
    print("3. Run component training with normalized data")
    print("4. Adjust scaling factors based on site total comparison")

if __name__ == "__main__":
    main()