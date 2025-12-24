# organize_data.py - Create systematic dataset structure
print("📊 ORGANIZING ELECTRICITY DATA SYSTEMATICALLY")
print("=" * 70)

import pandas as pd
import numpy as np
from datetime import datetime
import os
import json

# Configuration - Group your tables logically
TABLE_GROUPS = {
    "total_consumption": {
        "tables": ["SaitSolarLab_30000_TL342"],
        "description": "Total Building Consumption",
        "priority": 1
    },
    
    "generation": {
        "tables": [
            "SaitSolarLab_30000_TL3",      # Total Generation
            "SaitSolarLab_30000_TL252",    # PV-Carport
            "SaitSolarLab_30000_TL253",    # PV-Rooftop
            "SaitSolarLab_30000_TL340",    # Generation Hourly
            "SaitSolarLab_30000_TL336"     # Generation Wh
        ],
        "description": "Energy Generation",
        "priority": 1
    },
    
    "consumption_breakdown": {
        "tables": [
            "SaitSolarLab_30000_TL212",    # Appliances
            "SaitSolarLab_30000_TL209",    # Lighting
            "SaitSolarLab_30000_TL208",    # HVAC
            "SaitSolarLab_30000_TL4",      # Ventilation
            "SaitSolarLab_30000_TL211"     # Equipment/R&D
        ],
        "description": "Consumption Components",
        "priority": 2
    },
    
    "net_energy": {
        "tables": [
            "SaitSolarLab_30000_TL335",    # Net Energy
            "SaitSolarLab_30000_TL339",    # Net Hourly
            "SaitSolarLab_30000_TL338"     # Net Wh
        ],
        "description": "Grid Interaction",
        "priority": 2
    },
    
    "mains": {
        "tables": [
            "SaitSolarLab_30000_TL343",    # Mains PA
            "SaitSolarLab_30000_TL344",    # Mains PB
            "SaitSolarLab_30000_TL345"     # Mains PC
        ],
        "description": "Mains Power",
        "priority": 3
    }
}

# Database connection
CONNECTION_STRING = (
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=(localdb)\\MSSQLLocalDB;'
    'DATABASE=TestSlimDB;'
    'Trusted_Connection=yes;'
)

def fetch_and_save_group(group_name, group_config):
    """Fetch and save data for a specific group"""
    print(f"\n📁 Processing: {group_config['description']}")
    print(f"   Tables: {len(group_config['tables'])}")
    
    group_data = {}
    
    for table_name in group_config['tables']:
        try:
            import pyodbc
            conn = pyodbc.connect(CONNECTION_STRING)
            
            # Fetch data
            query = f"""
            SELECT TOP (50000) 
                [ts] as timestamp,
                [value] as value
            FROM [dbo].[{table_name}]
            WHERE [ts] IS NOT NULL
            ORDER BY [ts] ASC
            """
            
            df = pd.read_sql_query(query, conn, parse_dates=['timestamp'])
            conn.close()
            
            if len(df) > 0:
                # Create descriptive column name
                col_name = table_name.replace('SaitSolarLab_30000_', '').lower()
                
                # Save individual table
                df.set_index('timestamp', inplace=True)
                df = df.rename(columns={'value': col_name})
                
                # Save to CSV
                filename = f"data/individual/{col_name}.csv"
                os.makedirs('data/individual', exist_ok=True)
                df.to_csv(filename)
                
                group_data[col_name] = df
                
                print(f"   ✅ {table_name}: {len(df):,} records saved to {filename}")
            else:
                print(f"   ⚠️  {table_name}: No data")
                
        except Exception as e:
            print(f"   ❌ {table_name}: Error - {str(e)[:100]}")
    
    return group_data

def create_combined_dataset():
    """Create combined datasets for different forecasting purposes"""
    print("\n" + "=" * 70)
    print("🔗 CREATING COMBINED DATASETS FOR FORECASTING")
    
    datasets_to_create = {
        # 1. MAIN FORECASTING DATASET (Total + Generation)
        "forecast_main.csv": {
            "description": "Main forecasting dataset (Total + Generation)",
            "required_tables": ["tl342", "tl3", "tl252", "tl253"],
            "frequency": "h"  # hourly
        },
        
        # 2. CONSUMPTION BREAKDOWN DATASET
        "forecast_components.csv": {
            "description": "Consumption component breakdown",
            "required_tables": ["tl212", "tl209", "tl208", "tl4", "tl211"],
            "frequency": "h"
        },
        
        # 3. NET ENERGY DATASET
        "forecast_net_energy.csv": {
            "description": "Net energy and grid interaction",
            "required_tables": ["tl335", "tl343", "tl344", "tl345"],
            "frequency": "h"
        }
    }
    
    # Check what individual files we have
    individual_dir = "data/individual"
    if os.path.exists(individual_dir):
        available_files = os.listdir(individual_dir)
        print(f"\n📋 Available individual datasets: {len(available_files)}")
        
        for dataset_name, config in datasets_to_create.items():
            print(f"\nCreating {dataset_name}...")
            print(f"  Purpose: {config['description']}")
            
            # Try to load required tables
            combined_df = None
            
            for table_code in config["required_tables"]:
                file_path = f"{individual_dir}/{table_code}.csv"
                
                if os.path.exists(file_path):
                    df = pd.read_csv(file_path, parse_dates=['timestamp'])
                    df.set_index('timestamp', inplace=True)
                    
                    if combined_df is None:
                        combined_df = df
                    else:
                        # Merge on timestamp
                        combined_df = pd.merge(
                            combined_df, df,
                            left_index=True, right_index=True,
                            how='outer'
                        )
                    
                    print(f"  ✓ Added: {table_code}")
                else:
                    print(f"  ✗ Missing: {table_code}")
            
            if combined_df is not None:
                # Resample to consistent frequency
                combined_df = combined_df.resample(config["frequency"]).mean()
                
                # Forward fill for missing values
                combined_df = combined_df.ffill().bfill()
                
                # Save combined dataset
                output_path = f"data/{dataset_name}"
                combined_df.to_csv(output_path)
                
                print(f"  ✅ Saved: {output_path}")
                print(f"  📊 Shape: {combined_df.shape}")
                print(f"  📅 Range: {combined_df.index.min()} to {combined_df.index.max()}")
            else:
                print(f"  ❌ Could not create {dataset_name}")
    else:
        print(f"❌ Individual data directory not found: {individual_dir}")

def main():
    print("Starting systematic data organization...")
    
    # Create directory structure
    os.makedirs('data', exist_ok=True)
    os.makedirs('data/individual', exist_ok=True)
    os.makedirs('data/forecasting', exist_ok=True)
    
    # Save configuration
    with open('data/table_config.json', 'w') as f:
        json.dump(TABLE_GROUPS, f, indent=2)
    print("💾 Saved configuration: data/table_config.json")
    
    # Process each group
    all_data = {}
    for group_name, group_config in TABLE_GROUPS.items():
        group_data = fetch_and_save_group(group_name, group_config)
        all_data[group_name] = group_data
    
    # Create combined datasets
    create_combined_dataset()
    
    print("\n" + "=" * 70)
    print("🎉 DATA ORGANIZATION COMPLETE!")
    print("\n📁 Created folder structure:")
    print("  data/")
    print("  ├── individual/       # Individual sensor CSVs")
    print("  ├── forecasting/      # Combined datasets")
    print("  └── table_config.json # Table grouping configuration")
    print("\n🎯 Ready for systematic model training!")

if __name__ == "__main__":
    main()