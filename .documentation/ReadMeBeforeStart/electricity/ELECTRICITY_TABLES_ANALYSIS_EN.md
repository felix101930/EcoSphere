# GBTAC Electricity Database Tables - Analysis Document

**Date**: 2025-12-23  
**Database**: TestSlimDB  
**Schema**: SaitSolarLab_*  
**Language**: English

---

## Table Status Summary

| Status | Count | Tables |
|--------|-------|--------|
| ✅ USABLE - Primary (Long-term Data) | 3 | TL341, TL340, TL339 |
| ⚠️ USABLE - Secondary (Limited/Cumulative) | 15 | TL337, TL336, TL338, TL342, TL343, TL344, TL345, TL335, TL252, TL253, TL213, TL212, TL211, TL209, TL4 |
| 📊 USABLE - Historical Only (Replaced System) | 1 | TL3 |
| ❌ UNUSABLE - Invalid Data | 2 | TL208, TL388 |
| **Total** | **21** | |

**Note**: 
- TL342-345 reclassified as Secondary due to limited time span (only 7 days)
- TL212, TL211, TL209, TL4 are valid equipment classification data (2019 and 2020)
- TL3 is a replaced measurement system (replaced by TL340)

---

## Table Hierarchy Structure

```
Building Energy System
│
├─ Consumption
│  │
│  ├─ Overall Measurement - Long-term Data Group (594 days: 2019-03-25 -> 2020-11-08)
│  │  ├─ 30000_TL337 - Consumption Cumulative ⭐ (594 days)
│  │  │  └─ 30000_TL341 - Consumption Hourly Increment ⭐ (594 days + extra 40 days from 2019-02-13)
│  │  │     [TL337 = -46.4M Wh + sum(TL341)] ← Verified, ratio 1.0027
│  │  │     [TL341 starts 40 days earlier than TL337, both measure the same quantity]
│  │  │     [Measures total building or major portion consumption]
│  │
│  ├─ By Power Phase - Three-Phase Power (Nov 2020, 7 days)
│  │  ├─ 30000_TL342 - Site Consumption (TOTAL) (2020-11-01 -> 2020-11-08)
│  │  │  ├─ 30000_TL343 - Mains PA (Phase A) 41.2% (2020-11-01 -> 2020-11-08)
│  │  │  ├─ 30000_TL344 - Mains PB (Phase B) 42.3% (2020-11-01 -> 2020-11-08)
│  │  │  └─ 30000_TL345 - Mains PC (Phase C) 16.5% (2020-11-01 -> 2020-11-08)
│  │  │     [TL342 = TL343 + TL344 + TL345] ← Verified
│  │  │     [Monitors from power system perspective, for load balancing]
│  │
│  └─ By Equipment/Function - Equipment Classification
│     ├─ 30000_TL208 - Heating/Cooling consumption ❌ INVALID (overflow error, 2019-11)
│     ├─ 30000_TL209 - Lighting consumption (2019-11-07 -> 2019-11-14, 7 days)
│     ├─ 30000_TL211 - Equipment/R&D consumption (2019-11-07 -> 2019-11-14, 7 days)
│     ├─ 30000_TL212 - Appliances consumption (2019-11-07 -> 2019-11-14, 7 days)
│     ├─ 30000_TL213 - Panel2A-1 Total Usage (2020-02-15 -> 2020-11-08, 9 months)
│     └─ 30000_TL4 - Ventilation System (2020-11-01 -> 2020-11-08, 7 days)
│     [Same classification method, different time periods]
│     [TL213/TL4 have 2020 data, TL208-212 have 2019 data]
│
├─ Generation
│  │
│  ├─ Overall Measurement - Long-term Data Group (594 days: 2019-03-25 -> 2020-11-08)
│  │  ├─ 30000_TL336 - Generation Cumulative ⭐ (594 days)
│  │  │  └─ 30000_TL340 - Generation Hourly Increment ⭐ (594 days + extra 40 days from 2019-02-13)
│  │  │     [TL336 = base + sum(TL340)] ← Similar to TL337/TL341
│  │  │     [TL340 starts 40 days earlier than TL336, both measure the same quantity]
│  │  │     [Measures total building generation]
│  │
│  ├─ By Generation Source - Solar Panels (Nov 2020, 7 days)
│  │  ├─ 30000_TL252 - Carport Solar (2020-11-01 -> 2020-11-08, 7 days, in W)
│  │  └─ 30000_TL253 - Rooftop Solar (2020-11-01 -> 2020-11-08, 7 days, in W)
│  │     [TL252 + TL253 < TL340, only measures partial solar panels]
│  │     [TL340 may include other generation sources or more solar panels]
│  │
│  └─ Historical Data
│     └─ 30000_TL3 - Total Generation (2019-11-07 -> 2019-11-14, 7 days, discontinued)
│        [Old generation monitoring system, **replaced by TL340** (not TL336)]
│        [TL3 measured total generation, TL340 is the new system for same purpose]
│
│  Note: No "by phase" classification for generation (not needed for generation monitoring)
│
└─ Net Energy
   │
   ├─ PRIMARY - Long-term Data Group (594 days: 2019-03-25 -> 2020-11-08)
   │  ├─ 30000_TL338 - Net Energy Cumulative ⭐ (594 days)
   │  │  └─ 30000_TL339 - Net Energy Hourly Increment ⭐ (594 days + extra 40 days from 2019-02-13)
   │  │     [TL338 = base + sum(TL339)] ← Similar to TL337/TL341
   │  │     [TL339 starts 40 days earlier than TL338, both measure the same quantity]
   │
   └─ SECONDARY - Limited Time Span
      └─ 30000_TL335 - Net Energy (Alternative) (2020-11-01 -> 2020-11-08, 7 days)
```

---

## Understanding Consumption Classification

The consumption data is organized in **three different perspectives**:

### 1. Overall Measurement (TL337/TL341)
- **What**: Total building or major portion consumption
- **Purpose**: Track overall energy usage trends
- **Time span**: 594 days (longest historical data)
- **Relationship**: TL337 (cumulative) = base + sum(TL341 hourly increments)

### 2. By Power Phase (TL342-345)
- **What**: Same consumption broken down by three-phase power system
- **Purpose**: Monitor electrical load balancing across phases
- **Time span**: 7 days (Nov 2020, new installation)
- **Relationship**: TL342 (total) = TL343 (Phase A) + TL344 (Phase B) + TL345 (Phase C)
- **Note**: Phase C (16.5%) is significantly lower than A (41.2%) and B (42.3%), indicating load imbalance

### 3. By Equipment/Function (TL208, TL209, TL211, TL212, TL213, TL4)
- **What**: Consumption broken down by specific equipment or functional areas
- **Purpose**: Understand which systems/equipment consume energy
- **Classification method**: Same across all time periods
- **Available data**:
  - TL208: HVAC (data corrupted, 2019-11)
  - TL209: Lighting (7 days, 2019-11)
  - TL211: Equipment/R&D (7 days, 2019-11)
  - TL212: Appliances (7 days, 2019-11)
  - TL213: Panel2A-1 (9 months, 2020-02 to 2020-11)
  - TL4: Ventilation system (7 days, 2020-11)
- **Note**: This is a valid classification dimension; tables just have data from different time periods

### Ideal Relationship
```
TL341 (Overall) ≈ TL342 (Phase Total) ≈ TL213 + TL4 + Other Equipment
```

However, they don't match exactly because:
- Different time periods
- Different measurement points
- TL341 may only measure ~20% of total consumption
- Equipment classification is incomplete

### Multi-dimensional Monitoring
This is a **multi-dimensional monitoring system** that views the same building's energy consumption from different angles:
- **Temporal**: Overall trends over time
- **Electrical**: Power system perspective (phases)
- **Functional**: Equipment/usage perspective

---

## Understanding Generation Classification

The generation data is organized in **two different perspectives**:

### 1. Overall Measurement (TL336/TL340)
- **What**: Total building generation
- **Purpose**: Track overall generation trends and self-sufficiency rate
- **Time span**: 594 days (corresponding to consumption data)
- **Relationship**: TL336 (cumulative) = base + sum(TL340 hourly increments)
- **Pattern**: Exactly the same as consumption's TL337/TL341

### 2. By Generation Source (TL252, TL253)
- **What**: Generation power broken down by solar panel location
- **Purpose**: Monitor performance of solar panels at different locations
- **Time span**: 7 days (Nov 2020, new installation)
- **Unit**: W (power), not Wh (energy)
- **Relationship**: TL252 (Carport) + TL253 (Rooftop) < TL340
  - Only measures partial solar panels
  - TL340 may include other generation sources or more solar panels
  - Average difference ~73%, indicating TL252/253 only covers ~27% of generation

### 3. Historical Data (TL3)
- **What**: Old generation monitoring system from Nov 2019
- **Time**: Same period as TL208-212 (consumption classification)
- **Status**: Discontinued, **replaced by TL340** (not TL336)
- **Note**: TL3 measured total generation, TL340 is the new system for the same purpose

### Comparison with Consumption Classification

| Dimension | Consumption | Generation |
|-----------|-------------|------------|
| **Overall Measurement** | TL337/TL341 ✓ | TL336/TL340 ✓ |
| **By Phase** | TL342-345 (Three-phase) ✓ | None ✗ |
| **By Source/Usage** | TL213, TL4 (Equipment) ✓ | TL252, TL253 (Solar panels) ✓ |
| **Historical System** | TL208-212 ✓ | TL3 ✓ |

**Why no phase classification for generation?**
- Generation systems (like solar inverters) typically auto-balance three-phase output
- Monitoring focus is on generation source (which solar panel), not power distribution
- Consumption needs phase monitoring for load balancing, generation doesn't

**System Replacement History:**
- **Old System (2019-11)**: TL3 (total generation) + TL208-212 (consumption by equipment)
- **New System (2019-02 onwards)**: TL340 (total generation) + TL341 (total consumption)
- **TL3 → TL340**: Both measure total generation, TL340 is the replacement
- **TL336**: Cumulative form of TL340, not a replacement for TL3

### Ideal Relationship
```
TL340 (Total Generation) ≈ TL252 (Carport) + TL253 (Rooftop) + Other Solar Panels/Sources
```

But in reality:
```
TL340 ≈ 108 Wh
TL252 + TL253 ≈ 29 W (~27%)
Difference ≈ 79 Wh (~73%)
```

This indicates:
- TL252/253 only monitor partial solar panels
- There may be other solar panels not monitored by TL252/253
- Or there are other generation sources (but GBTAC is primarily solar)

---

## Understanding Net Energy Classification

The net energy data is organized in **the simplest structure** among all three categories:

### 1. Overall Measurement (TL338/TL339)
- **What**: Total building net energy (Generation - Consumption)
- **Purpose**: Track overall energy balance and grid dependency
- **Time span**: 594 days (corresponding to consumption and generation data)
- **Relationship**: TL338 (cumulative) = base + sum(TL339 hourly increments)
- **Pattern**: Exactly the same as TL337/TL341 (consumption) and TL336/TL340 (generation)
- **Formula**: TL339 = TL340 (Generation) + TL342 (Consumption)
  - Note: Consumption values are negative, so this is effectively Generation - |Consumption|

### 2. Alternative Measurement (TL335)
- **What**: Alternative net energy measurement point
- **Purpose**: Different measurement point or calculation method
- **Time span**: 7 days (Nov 2020, same as TL342-345 and TL252-253)
- **Relationship**: Related to TL339 but NOT identical (average difference ~13.6%)
- **Note**: 
  - Values differ from TL339 by 10-30% at different times
  - Change direction correlation: 85.7% (moves together but different magnitude)
  - Possibly measures net energy at a different point in the building
  - Or uses a different calculation method

### Comparison with Other Categories

| Dimension | Consumption | Generation | Net Energy |
|-----------|-------------|------------|------------|
| **Overall Measurement** | TL337/TL341 ✓ | TL336/TL340 ✓ | TL338/TL339 ✓ |
| **By Phase** | TL342-345 (Three-phase) ✓ | None ✗ | None ✗ |
| **By Source/Usage** | TL208-213/TL4 (Equipment) ✓ | TL252-253 (Solar) ✓ | None ✗ |
| **Alternative/Backup** | None ✗ | None ✗ | TL335 ✓ |
| **Historical System** | None (same classification) | TL3 (replaced) ✓ | None ✗ |

**Why Net Energy is the simplest?**
- Net Energy is a **calculated result** (Generation - Consumption)
- No need for phase breakdown (already in consumption)
- No need for source breakdown (already in generation and consumption)
- Only needs overall measurement + backup for verification

### Ideal Relationship
```
TL339 (Net Energy) = TL340 (Generation) + TL342 (Consumption)
                   = TL340 - |TL342|
```

In reality:
- When TL339 is negative: Building needs grid power (consumption > generation)
- When TL339 is positive: Building exports to grid (generation > consumption)
- GBTAC is typically negative (only ~5% self-sufficient)

---

## Detailed Table Information

### ✅ PRIMARY TABLES (3) - Long-term Data, Highly Recommended

#### 30000_TL341 - Consumption Hourly ⭐ RECOMMENDED FOR LONG-TERM DATA
- **Description**: Hourly consumption increment, approximately 20% of total site consumption
- **Unit**: Wh (per hour)
- **Time Span**: 2019-02-13 → 2020-11-08 (634 days, 21 months)
- **Latest Value**: -2,244.45 Wh
- **Relationship**: TL337 = (historical base ~-46M Wh) + sum(TL341), ratio ≈1.0027
- **Note**: Best long-term consumption data source, specific subsystem measurement
- **Usage**: Long-term consumption analysis, trend monitoring

#### 30000_TL340 - Generation Hourly
- **Description**: Total building generation (hourly)
- **Unit**: Wh
- **Time Span**: 2019-02-13 → 2020-11-08 (634 days, 21 months)
- **Latest Value**: 107.95 Wh
- **Usage**: Generation monitoring, self-sufficiency calculation

#### 30000_TL339 - Net Energy Hourly
- **Description**: Net Energy = Generation - Consumption (negative means grid power needed)
- **Unit**: Wh
- **Time Span**: 2019-02-13 → 2020-11-08 (634 days, 21 months)
- **Latest Value**: -11,438.51 Wh
- **Formula**: Net Energy ≈ TL340 + TL342
- **Usage**: Energy balance analysis, self-sufficiency calculation

---

### ⚠️ SECONDARY TABLES (11) - Limited Time Span or Cumulative Data

#### 30000_TL342 - Site Consumption (TOTAL)
- **Description**: Total building site consumption, equals sum of three-phase grid power
- **Unit**: Wh (Watt-hours)
- **Time Span**: 2020-11-01 → 2020-11-08 (7 days) ⚠️ SHORT-TERM DATA
- **Latest Value**: -10,879 Wh
- **Relationship**: TL342 = TL343 + TL344 + TL345
- **Note**: New sensor installed in Nov 2020, limited historical data
- **Usage**: Total consumption monitoring (recent data only)

#### 30000_TL343 - Mains PA (Phase A)
- **Description**: Phase A of three-phase power system
- **Unit**: Wh
- **Time Span**: 2020-11-01 → 2020-11-08 (7 days) ⚠️ SHORT-TERM DATA
- **Latest Value**: -4,481 Wh (41.2% of total)
- **Usage**: Three-phase load balancing monitoring (recent data only)

#### 30000_TL344 - Mains PB (Phase B)
- **Description**: Phase B of three-phase power system
- **Unit**: Wh
- **Time Span**: 2020-11-01 → 2020-11-08 (7 days) ⚠️ SHORT-TERM DATA
- **Latest Value**: -4,602 Wh (42.3% of total)
- **Usage**: Three-phase load balancing monitoring (recent data only)

#### 30000_TL345 - Mains PC (Phase C)
- **Description**: Phase C of three-phase power system
- **Unit**: Wh
- **Time Span**: 2020-11-01 → 2020-11-08 (7 days) ⚠️ SHORT-TERM DATA
- **Latest Value**: -1,796 Wh (16.5% of total)
- **Usage**: Three-phase load balancing monitoring (recent data only)

#### 30000_TL337 - Consumption Cumulative
- **Description**: Cumulative total consumption from before 2019-02-13
- **Unit**: Wh (cumulative total)
- **Time Span**: 2019-03-25 → 2020-11-08 (594 days, 19 months)
- **Latest Value**: -72,405,016 Wh
- **Relationship**: TL337 = (base ~-46.4M Wh) + sum(TL341 from 2019-02-13)
- **Note**: Includes historical data before TL341 started, hourly change matches TL341 with 1.0027 ratio
- **Usage**: Total cumulative consumption tracking, verify against TL341 accumulation

#### 30000_TL336 - Generation Cumulative
- **Description**: Cumulative total generation from before 2019-02-13
- **Unit**: Wh (cumulative total)
- **Time Span**: 2019-03-25 → 2020-11-08 (594 days, 19 months)
- **Latest Value**: 64,577,668 Wh
- **Relationship**: TL336 = (historical base) + sum(TL340 from 2019-02-13)
- **Note**: Similar to TL337, includes historical data before TL340 started
- **Usage**: Total cumulative generation tracking

#### 30000_TL338 - Net Energy Cumulative
- **Description**: Cumulative net energy
- **Unit**: Wh
- **Time Span**: 2019-03-25 → 2020-11-08 (approx. 19 months)
- **Latest Value**: -69,999,192 Wh
- **Usage**: Long-term trend analysis

#### 30000_TL335 - Net Energy (Alternative)
- **Description**: Alternative net energy measurement
- **Unit**: Wh
- **Time Span**: 2020-11-01 → 2020-11-08 (7 days)
- **Latest Value**: -11,095 Wh
- **Relationship**: Related to TL339 but NOT identical (avg difference ~13.6%, correlation 85.7%)
- **Note**: Different measurement point or calculation method, not a simple backup
- **Usage**: Comparison with TL339 for analysis

#### 30000_TL252 - Carport Solar
- **Description**: Carport solar panel power
- **Unit**: W (Power, not energy!)
- **Time Span**: 2020-11-01 → 2020-11-08 (7 days)
- **Latest Value**: 26 W
- **Note**: Requires conversion to Wh (for 1 hour: W = Wh)
- **Usage**: Solar breakdown monitoring

#### 30000_TL253 - Rooftop Solar
- **Description**: Rooftop solar panel power
- **Unit**: W (Power, not energy!)
- **Time Span**: 2020-11-01 → 2020-11-08 (7 days)
- **Latest Value**: 2 W
- **Note**: Requires conversion to Wh
- **Usage**: Solar breakdown monitoring

#### 30000_TL213 - Panel2A-1 Total Usage
- **Description**: Specific panel usage
- **Unit**: Wh
- **Time Span**: 2020-02-15 → 2020-11-08 (approx. 9 months)
- **Latest Value**: 1,178 Wh
- **Usage**: Panel-specific monitoring

#### 30000_TL209 - Lighting consumption
- **Description**: Lighting system consumption (equipment classification)
- **Unit**: Wh
- **Time Span**: 2019-11-07 → 2019-11-14 (7 days)
- **Latest Value**: 3.70 Wh
- **Note**: Valid equipment classification data from 2019
- **Usage**: Equipment-specific consumption analysis

#### 30000_TL211 - Equipment/R&D consumption
- **Description**: Equipment and R&D consumption (equipment classification)
- **Unit**: Wh
- **Time Span**: 2019-11-07 → 2019-11-14 (7 days)
- **Latest Value**: 3.21 Wh
- **Note**: Valid equipment classification data from 2019
- **Usage**: Equipment-specific consumption analysis

#### 30000_TL212 - Appliances consumption
- **Description**: Appliances consumption (equipment classification)
- **Unit**: Wh
- **Time Span**: 2019-11-07 → 2019-11-14 (7 days)
- **Latest Value**: 2.88 Wh
- **Note**: Valid equipment classification data from 2019
- **Usage**: Equipment-specific consumption analysis

#### 30000_TL213 - Panel2A-1 Total Usage
- **Description**: Specific panel usage
- **Unit**: Wh
- **Time Span**: 2020-02-15 → 2020-11-08 (approx. 9 months)
- **Latest Value**: 1,178 Wh
- **Usage**: Panel-specific monitoring

#### 30000_TL4 - Ventilation consumption
- **Description**: Ventilation system consumption
- **Unit**: Wh
- **Time Span**: 2020-11-01 → 2020-11-08 (7 days)
- **Latest Value**: 99.99 Wh
- **Usage**: Ventilation system monitoring

---

### 📊 HISTORICAL DATA TABLES (1) - Replaced System Only

#### 30000_TL3 - Total Generation (Historical)
- **Description**: Historical total generation
- **Unit**: Unknown
- **Time Span**: 2019-11-07 → 2019-11-14 (7 days)
- **Latest Value**: 3.16
- **Status**: Stopped collecting in 2019, **replaced by TL340**
- **Note**: Old generation monitoring system, TL340 serves the same purpose in new system
- **Usage**: 2019 historical data analysis

---

### ❌ INVALID TABLES (2) - Do Not Use

#### 30000_TL208 - Heating/Cooling consumption
- **Issue**: Data overflow error
- **Latest Value**: -3.40e+38 (invalid)
- **Reason**: Sensor malfunction or data error

#### 30000_TL388 - Total Generation kWh
- **Issue**: TABLE DOES NOT EXIST
- **Latest Value**: "Level 16" (SQL Server error message, not actual data)
- **Reason**: Table was never created or has been deleted

---

## Key Relationship Verification

### 1. Site Consumption = Sum of Three Phases
```
TL342 = TL343 + TL344 + TL345
-10,879 = -4,481 + -4,602 + -1,796 ✓ Verified
```

### 2. Net Energy Calculation
```
Net Energy ≈ Generation + Site Consumption
TL339 ≈ TL340 + TL342
-11,438.51 ≈ 107.95 + (-10,879) = -10,771.05
Difference: ~667 Wh (likely due to system losses or different measurement points)
```

### 3. Solar ≠ Total Generation
```
TL252 + TL253 = 26 + 2 = 28 W
TL340 = 107.95 Wh
Note: May have other generation sources, or solar tables measure only subset of panels
```

### 4. TL337 Accumulation Relationship ⭐ VERIFIED
```
TL337 (Cumulative) = (Historical Base) + sum(TL341 from 2019-02-13)

Verification Results:
- Hourly change ratio: TL337_change / TL341_value ≈ 1.0027
- Average difference per hour: ~9 Wh
- Historical base value: ~-46,364,789 Wh (before 2019-02-13)

Conclusion:
✓ TL337 and TL341 measure the SAME quantity
✓ TL337 is cumulative, TL341 is hourly increment
✓ TL337 includes historical data from before TL341 started
✓ Small ratio difference (1.0027) likely due to measurement precision or rounding

Formula:
TL337(t) = -46,364,789 + Σ TL341(2019-02-13 to t)
```

### 5. TL336 Accumulation Relationship (Similar to TL337)
```
TL336 (Generation Cumulative) = (Historical Base) + sum(TL340 from 2019-02-13)

Same pattern as consumption tables:
- TL336 is cumulative generation
- TL340 is hourly generation increment
- TL336 includes pre-2019-02-13 historical data
```

---

## Data Characteristics

### Sign Convention
- **Consumption**: Negative (energy outflow)
- **Generation**: Positive (energy inflow)
- **Net Energy**: Negative means deficit (grid power needed)

### Unit Attention
- Most tables: **Wh** (energy)
- TL252/253: **W** (power) ← Requires conversion
- TL388: **kWh** (different scale)

---

## Dashboard Implementation Recommendations

### For Long-Term Historical Analysis (2019-2020)
- **Consumption**: TL341 (hourly, 634 days) ⭐ RECOMMENDED
- **Generation**: TL340 (hourly, 634 days) ⭐ RECOMMENDED
- **Net Energy**: TL339 (hourly, 634 days) ⭐ RECOMMENDED
- **Cumulative Consumption**: TL337 (594 days, includes pre-2019 data)
- **Cumulative Generation**: TL336 (594 days, includes pre-2019 data)

### For Recent Detailed Analysis (Nov 2020 only)
- **Total Consumption**: TL342 (7 days)
- **Three-Phase Breakdown**: TL343, TL344, TL345 (7 days)
- **Solar Breakdown**: TL252, TL253 (7 days, in W not Wh)

### Data Limitations
- **TL342-345**: Only 7 days of data (2020-11-01 to 2020-11-08)
  - New sensors installed in November 2020
  - Cannot be used for long-term trend analysis
  - Good for recent three-phase load balancing only
  
- **TL341**: 634 days of data (2019-02-13 to 2020-11-08)
  - Best choice for long-term consumption analysis
  - Measures ~20% of total consumption (specific subsystem)
  - Reliable and consistent data

### Avoid Using
- TL208, TL388 (invalid data)
- TL3 (replaced by TL340)

---

**Document Status**: Based on actual database queries  
**Last Updated**: 2025-12-23  
**Author**: AI Assistant (Kiro)
