# EcoSphere Algorithms Documentation

**Document Version**: 2026-01-07  
**Purpose**: Comprehensive documentation of all algorithms, calculations, and API integrations used in the EcoSphere system  
**Target Audience**: Development team, data scientists, and system maintainers

---

## Table of Contents

1. [Overview](#1-overview)
2. [Electricity Module Algorithms](#2-electricity-module-algorithms)
3. [Water Module Algorithms](#3-water-module-algorithms)
4. [Thermal Module Algorithms](#4-thermal-module-algorithms)
5. [Carbon Footprint Calculations](#5-carbon-footprint-calculations)
6. [External API Integrations](#6-external-api-integrations)
7. [Data Aggregation Methods](#7-data-aggregation-methods)
8. [Algorithm Performance Metrics](#8-algorithm-performance-metrics)

---

## 1. Overview

### 1.1 Algorithm Categories

The EcoSphere system employs various types of algorithms:

| Category | Purpose | Modules |
|----------|---------|---------|
| **Time Series Forecasting** | Predict future consumption/generation | Electricity, Water, Thermal |
| **Linear Regression** | Weather-based predictions | Electricity (Generation), Water (Rainwater), Thermal |
| **Statistical Calculations** | Metrics and aggregations | All modules |
| **Multi-Tier Systems** | Graceful degradation based on data availability | Electricity, Water |
| **Hybrid Models** | Combine multiple approaches | Thermal |

### 1.2 Key Design Principles

1. **Graceful Degradation**: Algorithms automatically adapt to available data quality
2. **Defensive Programming**: All calculations handle edge cases and missing data
3. **Timezone Safety**: All date handling uses defensive T12:00:00 pattern
4. **Sign Preservation**: Consumption (negative) and generation (positive) signs maintained
5. **Validation**: Input parameters validated before processing

---

## 2. Electricity Module Algorithms

### 2.1 Net Energy Calculation

**Purpose**: Calculate net energy from consumption and generation data

**Formula**:
```
Net Energy = Generation + Consumption
```
Note: Consumption values are NEGATIVE in database, so this is effectively: `Generation - |Consumption|`

**Sign Interpretation**:
- Negative result = Net Consumer (grid dependent)
- Positive result = Net Producer (grid exporter)

**Implementation**:
- **File**: `ecosphere-frontend/src/utils/electricityCalculations.js`
- **Function**: `calculateNetEnergyFromData(consumptionData, generationData)`

**Algorithm Details**:
1. Create timestamp-based map of generation data
2. For each consumption data point, find matching generation by timestamp
3. Calculate: `netEnergy = generationValue + consumptionValue`
4. Return array of `{ts, value}` objects

**Data Matching Strategy**:
- Uses timestamp-based matching (not index-based)
- Ensures accurate alignment even with missing data points
- Only includes data points where both consumption and generation exist

**Code Location**: `ecosphere-frontend/src/utils/electricityCalculations.js:14-48`


### 2.2 Self-Sufficiency Rate Calculation

**Purpose**: Calculate the percentage of energy demand met by on-site generation

**Formula**:
```
Self-Sufficiency Rate = (Generation / |Consumption|) × 100%
```

**Range**: 0% to ∞ (typically 0-200%)
- < 100%: Grid dependent (consuming more than generating)
- = 100%: Self-sufficient (generating exactly what's consumed)
- > 100%: Grid exporter (generating more than consuming)

**Implementation**:
- **File**: `ecosphere-frontend/src/utils/electricityCalculations.js`
- **Function**: `calculateSelfSufficiencyRate(consumptionData, generationData)`

**Algorithm Details**:
1. Create timestamp-based map of generation data for fast lookup
2. For each consumption data point:
   - Find matching generation by timestamp
   - Take absolute values of both (consumption is negative, generation is positive)
   - Calculate: `rate = (generation / consumption) × 100`
   - Handle division by zero: return 0 if consumption is 0
3. Return array of `{ts, value}` where value is percentage

**Important Notes**:
- Uses absolute values for both consumption and generation
- Timestamp-based matching ensures accuracy
- Handles edge cases (zero consumption, missing data)

**Code Location**: `ecosphere-frontend/src/utils/electricityCalculations.js:73-115`

---

### 2.3 Consumption Forecast (Multi-Tier System)

**Purpose**: Predict future electricity consumption with graceful degradation

**Tier System**: 4 tiers with automatic selection based on data availability

**Important Note**: All consumption values are converted to absolute values using `Math.abs()` before calculations to ensure positive consumption values, regardless of how the data is stored in the database.

#### Tier 1: Holt-Winters Seasonal Smoothing (Best)

**Confidence**: 90%  
**Accuracy**: ★★★★★  
**Requirements**:
- At least 1 year of historical data (365 days)
- Data completeness ≥ 70%

**Algorithm**: Exponential Smoothing with Seasonal Component

**Formula**:
```
Level:    L(t) = α × Y(t) + (1-α) × [L(t-1) + T(t-1)]
Trend:    T(t) = β × [L(t) - L(t-1)] + (1-β) × T(t-1)
Seasonal: S(t) = γ × [Y(t) - L(t)] + (1-γ) × S(t-s)
Forecast: F(t+h) = L(t) + h×T(t) + S(t+h-s)
```

**Parameters**:
- α (alpha) = 0.5 - Level smoothing factor
- β (beta) = 0.4 - Trend smoothing factor
- γ (gamma) = 0.3 - Seasonal smoothing factor
- s (season) = 168 hours (7 days × 24 hours) - Weekly seasonality

**Implementation**:
- **Library**: `timeseries-analysis` (npm package)
- **File**: `ecosphere-backend/services/forecastService.js`
- **Function**: `holtWintersForecast(data, forecastDays)`

**Process**:
1. Prepare hourly data: `[[timestamp, Math.abs(value)], ...]` (convert to absolute values)
2. Create time series object
3. Apply Holt-Winters smoothing with weekly seasonality
4. Generate hourly forecast
5. Aggregate to daily totals

**Code Location**: `ecosphere-backend/services/forecastService.js:265-281`

---

#### Tier 2: Seasonal Weighted Prediction (Good)

**Confidence**: 80%  
**Accuracy**: ★★★★☆  
**Requirements**:
- Last year same period data available
- Recent 30 days data available

**Algorithm**: Weighted average of seasonal patterns

**Formula**:
```
Prediction = 0.3 × LastYearSameDay + 0.5 × LastWeekSameDay + 0.2 × Recent30DayAvg
```

**Weights Rationale**:
- 30% Last Year: Captures annual seasonality
- 50% Last Week: Most relevant recent pattern
- 20% Recent Average: Smooths out anomalies

**Implementation**:
- **File**: `ecosphere-backend/services/forecastService.js`
- **Function**: `seasonalWeightedForecast(data, forecastDays, targetDate)`

**Process**:
1. For each forecast day:
   - Get last year same day total (using `Math.abs()` for all values)
   - Get last week same day total (using `Math.abs()` for all values)
   - Calculate 30-day average daily total (using `Math.abs()` for all values)
2. Apply weighted formula
3. Return daily predictions

**Code Location**: `ecosphere-backend/services/forecastService.js:286-323`

---

#### Tier 3: Trend-Based Prediction (Acceptable)

**Confidence**: 65%  
**Accuracy**: ★★★☆☆  
**Requirements**:
- Recent 30 days data available

**Algorithm**: Linear trend extrapolation

**Formula**:
```
Trend = Δy / Δx (slope of linear regression)
Prediction(day) = LastDayTotal + Trend × day
```

**Implementation**:
- **File**: `ecosphere-backend/services/forecastService.js`
- **Function**: `trendBasedForecast(data, forecastDays)`

**Process**:
1. Calculate daily totals for last 30 days (using `Math.abs()` for all values)
2. Compute linear trend from daily totals
3. Extrapolate: `prediction = lastDayTotal + trend × dayOffset`
4. Ensure non-negative values

**Fallback**: If insufficient data, use last complete day's total

**Code Location**: `ecosphere-backend/services/forecastService.js:328-356`

---

#### Tier 4: Moving Average (Basic)

**Confidence**: 50%  
**Accuracy**: ★★☆☆☆  
**Requirements**:
- Recent 7 days data available

**Algorithm**: Simple moving average

**Formula**:
```
Prediction = Average(Last 7 Days Daily Totals)
```

**Implementation**:
- **File**: `ecosphere-backend/services/forecastService.js`
- **Function**: `movingAverageForecast(data, forecastDays)`

**Process**:
1. Calculate average daily total from last 7 days (using `Math.abs()` for all values)
2. Use same value for all forecast days
3. Exclude incomplete last day from average

**Code Location**: `ecosphere-backend/services/forecastService.js:361-377`

---

### 2.4 Generation Forecast (Weather-Based Linear Regression)

**Purpose**: Predict solar generation based on weather forecast

**Algorithm**: Simple Linear Regression

**Formula**:
```
Generation = a × DirectRadiation + b

Where:
- a = coefficient (learned from historical data)
- b = intercept (learned from historical data)
- DirectRadiation = total daily direct solar radiation (Wh/m²)
```

**Why Direct Radiation Only?**
- Correlation analysis showed direct radiation has strongest correlation (r = 0.80)
- Temperature and cloud cover had weaker correlations
- Simpler model = more reliable predictions

**Training Process**:

1. **Data Preparation**:
   - Aggregate historical generation to daily totals
   - Match with daily weather data by date
   - Minimum 7 days required, 60 days recommended

2. **Linear Regression Calculation**:
   ```
   n = number of training days
   X = direct_radiation values
   Y = generation values
   
   meanX = Σ(X) / n
   meanY = Σ(Y) / n
   
   a = Σ[(Xi - meanX)(Yi - meanY)] / Σ[(Xi - meanX)²]
   b = meanY - a × meanX
   ```

3. **R-squared Calculation**:
   ```
   SSTotal = Σ(Yi - meanY)²
   SSResidual = Σ(Yi - predicted_Yi)²
   R² = 1 - (SSResidual / SSTotal)
   ```

**Confidence Levels**:
- R² > 0.7: High confidence
- R² > 0.5: Medium confidence
- R² ≤ 0.5: Low confidence

**Implementation**:
- **File**: `ecosphere-backend/services/forecastService.js`
- **Functions**: 
  - `generateGenerationForecast()` - Main entry point
  - `trainWeatherModel()` - Train regression model
  - `predictWithWeatherModel()` - Generate predictions

**Code Location**: `ecosphere-backend/services/forecastService.js:595-722`

**Weather API**: Open-Meteo API (see section 6.2)


---

## 3. Water Module Algorithms

### 3.1 Hot Water Consumption Forecast (Multi-Tier System)

**Purpose**: Predict future hot water consumption

**Algorithm**: Same 4-tier system as electricity consumption forecast

**Important Note**: All hot water consumption values are converted to absolute values using `Math.abs()` before calculations, same as electricity consumption forecast.

**Tiers**:
1. **Tier 1**: Holt-Winters (90% confidence) - Requires 1 year + 70% completeness
2. **Tier 2**: Seasonal Weighted (80% confidence) - Requires last year + 30 days
3. **Tier 3**: Trend-Based (65% confidence) - Requires 30 days
4. **Tier 4**: Moving Average (50% confidence) - Requires 7 days

**Implementation**: Reuses electricity forecast algorithms with hot water data

**Code Location**: `ecosphere-backend/services/forecastService.js` (same functions as electricity)

---

### 3.2 Rainwater Level Forecast (Weather-Based Linear Regression)

**Purpose**: Predict rainwater tank level based on precipitation forecast

**Algorithm**: Simple Linear Regression

**Formula**:
```
DailyAvgWaterLevel = a × Precipitation + b

Where:
- a = coefficient (can be positive or negative)
- b = intercept (baseline water level)
- Precipitation = total daily precipitation (mm)
- DailyAvgWaterLevel = predicted average water level (%)
```

**Why Precipitation?**
- Direct correlation between rainfall and water level
- Simple, interpretable model
- Precipitation is most reliable weather forecast variable

**Coefficient Interpretation**:
- **Positive coefficient**: Water level increases with rain (normal behavior)
- **Negative coefficient**: Water level decreases with rain (possible if:
  - Tank overflow causes drainage
  - Increased usage during rainy days
  - Measurement artifacts)

**Training Process**:

1. **Data Preparation**:
   - Aggregate rainwater level to daily averages (not totals, since it's percentage)
   - Match with daily precipitation data by date
   - Minimum 7 days required, 60 days recommended

2. **Linear Regression Calculation**:
   ```
   n = number of training days
   X = precipitation values (mm)
   Y = daily average water level values (%)
   
   meanX = Σ(X) / n
   meanY = Σ(Y) / n
   
   a = Σ[(Xi - meanX)(Yi - meanY)] / Σ[(Xi - meanX)²]
   b = meanY - a × meanX
   ```

3. **R-squared Calculation**: Same as generation forecast

**Output Constraints**:
- Water level clamped to 0-100% range
- Negative predictions set to 0%
- Predictions > 100% set to 100%

**Implementation**:
- **File**: `ecosphere-backend/services/forecastService.js`
- **Functions**:
  - `generateRainwaterForecast()` - Main entry point
  - `trainRainwaterModel()` - Train regression model
  - `predictWithRainwaterModel()` - Generate predictions

**Code Location**: `ecosphere-backend/services/forecastService.js:727-920`

**Weather API**: Open-Meteo API (see section 6.2)

---

## 4. Thermal Module Algorithms

### 4.1 Indoor Temperature Forecast (Hybrid Model)

**Purpose**: Predict indoor temperature using historical patterns and weather influence

**Algorithm**: Hybrid Model (80% Historical + 20% Weather)

**Formula**:
```
PredictedTemp = 0.8 × HistoricalBaseline + 0.2 × (HistoricalBaseline + WeatherAdjustment)

Where:
WeatherAdjustment = k × (OutdoorTemp - ComfortableTemp)

- k = weather influence coefficient (0.02 to 0.2)
- ComfortableTemp = average historical indoor temperature
- OutdoorTemp = forecast outdoor temperature
```

**Why Hybrid Model?**
- HVAC systems maintain stable indoor temperatures
- Historical patterns are strong predictors (80% weight)
- Weather has minor influence due to building insulation (20% weight)
- Combines reliability of historical data with weather awareness

**Model Components**:

#### 4.1.1 Historical Baseline Calculation

**Process**:
1. Aggregate hourly thermal data to daily averages
2. Calculate statistics:
   ```
   AvgTemp = Σ(DailyAvgTemp) / NumberOfDays
   AvgRange = Σ(DailyHigh - DailyLow) / NumberOfDays
   ```
3. Use last 60 days of data (recommended)

**Code Location**: `ecosphere-backend/services/forecastService.js:975-1020`

---

#### 4.1.2 Weather Influence Coefficient Training

**Purpose**: Learn how outdoor temperature affects indoor temperature

**Model**:
```
IndoorTemp = ComfortableTemp + k × (OutdoorTemp - ComfortableTemp)
```

**Training Process**:
1. Calculate comfortable temperature (average historical indoor temp)
2. For each day, calculate:
   - Y = IndoorTemp - ComfortableTemp
   - X = OutdoorTemp - ComfortableTemp
3. Linear regression to find k:
   ```
   k = Σ(Xi × Yi) / Σ(Xi²)
   ```
4. Apply constraints:
   - If |k| < 0.02: Use default k = 0.05 (for visibility)
   - If |k| > 0.2: Cap at 0.2 (reasonable limit)
   - Always use absolute value

**Coefficient Interpretation**:
- k = 0.05: 5% of outdoor temperature change affects indoor
- k = 0.1: 10% influence (moderate insulation)
- k = 0.2: 20% influence (poor insulation)

**Why Minimum 0.05?**
- HVAC systems maintain very stable temperatures
- Actual coefficient often < 0.02 (excellent insulation)
- Use 0.05 for demonstration purposes (makes weather influence visible)

**Code Location**: `ecosphere-backend/services/forecastService.js:1025-1095`

---

#### 4.1.3 Hybrid Prediction

**Process**:
1. Calculate historical component: `HistoricalBaseline × 0.8`
2. Calculate weather adjustment: `k × (OutdoorTemp - ComfortableTemp)`
3. Calculate weather component: `(HistoricalBaseline + WeatherAdjustment) × 0.2`
4. Combine: `PredictedTemp = HistoricalComponent + WeatherComponent`
5. Clamp to reasonable range: 15°C to 30°C

**Example Calculation**:
```
Given:
- HistoricalBaseline = 22°C
- ComfortableTemp = 22°C
- OutdoorTemp = 30°C
- k = 0.05

WeatherAdjustment = 0.05 × (30 - 22) = 0.4°C
HistoricalComponent = 22 × 0.8 = 17.6°C
WeatherComponent = (22 + 0.4) × 0.2 = 4.48°C
PredictedTemp = 17.6 + 4.48 = 22.08°C
```

**Implementation**:
- **File**: `ecosphere-backend/services/forecastService.js`
- **Functions**:
  - `generateThermalForecast()` - Main entry point
  - `calculateThermalBaseline()` - Calculate historical baseline
  - `trainThermalWeatherModel()` - Train weather influence model
  - `predictWithThermalModel()` - Generate predictions

**Code Location**: `ecosphere-backend/services/forecastService.js:925-1175`

**Weather API**: Open-Meteo API (see section 6.2)

---

### 4.2 Multi-Sensor Aggregation

**Purpose**: Calculate floor-level temperature from multiple sensors

**Algorithm**: Simple Average

**Formula**:
```
FloorTemp = Σ(SensorValues) / NumberOfSensors
```

**Sensor Distribution**:
- Basement: 3 sensors (20004, 20005, 20006)
- Level 1: 5 sensors (20007-20011)
- Level 2: 5 sensors (20012-20016)

**Process**:
1. For each timestamp, collect all sensor readings for the floor
2. Calculate average temperature
3. Use average for display and calculations

**Implementation**: Applied in both frontend and backend when aggregating thermal data

---

## 5. Carbon Footprint Calculations

### 5.1 Automatic Carbon Footprint Calculation

**Purpose**: Calculate CO2 emissions from electricity consumption

**Formula**:
```
CO2 Emissions = EnergyConsumption × CarbonIntensity

Where:
- EnergyConsumption = electricity used (kWh)
- CarbonIntensity = kg CO2 per kWh (from Electricity Maps API)
```

**Data Sources**:
- **Energy Consumption**: TL341 table (SQL Server)
- **Carbon Intensity**: Electricity Maps API (historical data for Alberta, CA-AB)

**Process**:
1. Fetch electricity consumption data for date range
2. For each date, fetch historical carbon intensity from API
3. Calculate: `CO2 = |Consumption| × CarbonIntensity`
4. Aggregate by time period (hourly for single day, daily for multiple days)

**Fallback Carbon Intensity**: 0.65 kg CO2/kWh (Alberta average)

**Implementation**:
- **Frontend**: `CarbonFootprintPage.jsx`, `AutomaticCalculationView.jsx`
- **Backend**: `electricityController.js`, `electricityService.js`
- **API Service**: `ElectricityMapsService.js`

---

### 5.2 Custom Calculator (User Upload)

**Purpose**: Calculate carbon footprint from user-provided electricity bills

**Formula**: Same as automatic calculation

**Process**:
1. User inputs: Year, Month, Electricity Usage (kWh)
2. Use average carbon intensity from historical data
3. Calculate: `CO2 = Usage × AvgCarbonIntensity`
4. Display results (not persisted)

**Features**:
- Dynamic add/remove bill entries
- Data validation (no duplicates, no future dates)
- Auto-sort by year and month
- Real-time calculation

**Implementation**: `CustomCalculator.jsx` (frontend only)

---

## 6. External API Integrations

### 6.1 Electricity Maps API

**Purpose**: Fetch historical carbon intensity data for Alberta

**API Provider**: Electricity Maps (https://api.electricitymaps.com)

**Endpoint**: `/v3/carbon-intensity/past-range`

**Parameters**:
- `zone`: CA-AB (Alberta, Canada)
- `start`: Start datetime (ISO 8601)
- `end`: End datetime (ISO 8601)

**Response Format**:
```json
{
  "zone": "CA-AB",
  "history": [
    {
      "datetime": "2020-11-07T00:00:00Z",
      "carbonIntensity": 650
    }
  ]
}
```

**Units**: kg CO2 per kWh

**Caching**: 1-hour cache to reduce API calls

**Rate Limiting**: Managed by API provider

**Implementation**:
- **File**: `ecosphere-frontend/src/services/ElectricityMapsService.js`
- **Environment Variable**: `ELECTRICITY_MAPS_API_KEY`

**Error Handling**: Falls back to default 0.65 kg CO2/kWh if API fails

---

### 6.2 Open-Meteo API

**Purpose**: Fetch weather data (historical and forecast) for Calgary

**API Provider**: Open-Meteo (https://open-meteo.com)

**Endpoints**:
- Historical: `https://archive-api.open-meteo.com/v1/archive`
- Forecast: `https://api.open-meteo.com/v1/forecast`

**Location**: Calgary, AB
- Latitude: 51.0947°N
- Longitude: -114.1094°W
- Timezone: America/Edmonton (MST/MDT)

**Weather Variables**:

#### For Solar Generation Forecast:
- `temperature_2m`: Temperature at 2m (°C)
- `cloud_cover`: Cloud cover (%)
- `shortwave_radiation`: Total solar radiation (W/m²)
- `direct_radiation`: Direct solar radiation (W/m²) ⭐ Primary predictor
- `diffuse_radiation`: Diffuse solar radiation (W/m²)

#### For Rainwater Forecast:
- `temperature_2m`: Temperature at 2m (°C)
- `precipitation`: Total precipitation (mm) ⭐ Primary predictor
- `rain`: Rain (mm)
- `showers`: Showers (mm)
- `weather_code`: Weather condition code

#### For Thermal Forecast:
- `temperature_2m`: Outdoor temperature (°C) ⭐ Primary predictor
- `shortwave_radiation`: Solar radiation (W/m²)

**Data Aggregation**: Hourly data aggregated to daily
- Temperature: Average
- Radiation: Sum (total daily)
- Precipitation: Sum (total daily)

**Training Period**: 60 days of historical data before forecast date

**Implementation**:
- **File**: `ecosphere-backend/services/weatherService.js`
- **Constants**: `ecosphere-backend/utils/weatherConstants.js`

**API Features**:
- Free tier available
- No API key required
- Historical data back to 1940
- 7-day forecast
- Hourly resolution

**Error Handling**: Returns error if API fails or data unavailable


---

## 7. Data Aggregation Methods

### 7.1 Hourly Aggregation (from 1-minute data)

**Purpose**: Convert high-frequency data to hourly intervals for consistent performance

**Method**: SQL Server DATEPART aggregation

**Formula**:
```sql
SELECT 
    DATEPART(YEAR, ts) AS year,
    DATEPART(MONTH, ts) AS month,
    DATEPART(DAY, ts) AS day,
    DATEPART(HOUR, ts) AS hour,
    SUM(value) AS hourly_total
FROM table
WHERE ts BETWEEN @start AND @end
GROUP BY 
    DATEPART(YEAR, ts),
    DATEPART(MONTH, ts),
    DATEPART(DAY, ts),
    DATEPART(HOUR, ts)
ORDER BY year, month, day, hour
```

**Performance**: 270x faster than row-by-row processing (35s → 130ms)

**Applied To**:
- Electricity phase breakdown (TL342-345): 1-min → hourly
- Electricity equipment breakdown (TL213, TL4, TL209-212): 1-min → hourly
- Solar source breakdown (TL252-253): 1-min → hourly
- Water hot water consumption (TL210): 1-min → hourly
- Water rainwater level (TL93): 10-min → hourly

**Implementation**: `ecosphere-backend/services/electricityService.js`, `waterService.js`

---

### 7.2 Daily Aggregation (from hourly data)

**Purpose**: Convert hourly data to daily totals for multi-day views and forecasts

**Method**: Sum hourly values by date

**Formula**:
```javascript
dailyTotal = Σ(hourlyValues for date)
```

**Complete Day Criteria**:
- Minimum 20 hours of data (out of 24)
- Defined by constant: `MIN_HOURS_FOR_COMPLETE_DAY = 20`

**Incomplete Day Handling**:
- Forecast algorithms: Exclude incomplete last day from training
- Display: Show incomplete days with warning or exclude

**Applied To**:
- All forecast algorithms (consumption, generation, rainwater, thermal)
- Multi-day chart displays
- Statistical calculations

**Implementation**: `ecosphere-backend/utils/forecastHelpers.js:aggregateHourlyToDaily()`

---

### 7.3 Weather Data Aggregation

**Purpose**: Convert hourly weather data to daily statistics

**Methods by Variable Type**:

| Variable | Aggregation Method | Rationale |
|----------|-------------------|-----------|
| Temperature | Average | Represents typical daily temperature |
| Radiation | Sum | Total daily energy received |
| Precipitation | Sum | Total daily rainfall |
| Cloud Cover | Average | Typical daily cloudiness |

**Formula Examples**:
```javascript
// Temperature
avgTemp = Σ(hourlyTemp) / 24

// Radiation (convert W/m² to Wh/m²)
totalRadiation = Σ(hourlyRadiation)

// Precipitation
totalPrecip = Σ(hourlyPrecip)
```

**Implementation**: `ecosphere-backend/services/weatherService.js:aggregateToDaily()`

---

## 8. Algorithm Performance Metrics

### 8.1 Forecast Algorithm Confidence Levels

| Tier | Algorithm | Confidence | Accuracy | Data Requirements |
|------|-----------|------------|----------|-------------------|
| 1 | Holt-Winters | 90% | ★★★★★ | 1 year + 70% complete |
| 2 | Seasonal Weighted | 80% | ★★★★☆ | Last year + 30 days |
| 3 | Trend-Based | 65% | ★★★☆☆ | 30 days |
| 4 | Moving Average | 50% | ★★☆☆☆ | 7 days |

**Confidence Score Interpretation**:
- 90%: Very reliable, suitable for planning
- 80%: Reliable, suitable for most decisions
- 65%: Moderate reliability, use with caution
- 50%: Low reliability, rough estimate only

---

### 8.2 Weather-Based Model Performance

#### Generation Forecast (Direct Radiation Model)

**Typical Performance**:
- R² = 0.60 to 0.85 (depending on training data quality)
- Correlation with direct radiation: r = 0.80

**Factors Affecting Accuracy**:
- Weather forecast accuracy (7-day forecast less accurate than 1-day)
- Seasonal variations (better in summer, worse in winter)
- Cloud cover variability (sudden changes reduce accuracy)

**Confidence Thresholds**:
- R² > 0.7: High confidence
- R² > 0.5: Medium confidence
- R² ≤ 0.5: Low confidence

---

#### Rainwater Forecast (Precipitation Model)

**Typical Performance**:
- R² = 0.40 to 0.70 (highly variable)
- Correlation with precipitation: r = 0.50 to 0.80

**Factors Affecting Accuracy**:
- Tank capacity and overflow behavior
- Usage patterns during rainy days
- Precipitation forecast accuracy
- Time lag between rain and level change

**Note**: Coefficient can be positive or negative depending on system behavior

---

#### Thermal Forecast (Hybrid Model)

**Typical Performance**:
- Weather coefficient k = 0.02 to 0.10 (actual)
- Weather coefficient k = 0.05 to 0.20 (used for visibility)
- Prediction accuracy: ±1-2°C

**Factors Affecting Accuracy**:
- HVAC system efficiency
- Building insulation quality
- Occupancy patterns
- Internal heat sources

**Model Weights Rationale**:
- 80% Historical: HVAC maintains stable temperatures
- 20% Weather: Minor influence due to insulation

---

### 8.3 Data Quality Metrics

#### Completeness Score

**Formula**:
```
Completeness = (ActualDataPoints / ExpectedDataPoints) × 100%
```

**Calculation**:
```javascript
expectedPoints = (lastDate - firstDate) / hourInterval
completeness = (actualPoints / expectedPoints) × 100
```

**Thresholds**:
- ≥ 70%: Good quality, Tier 1 algorithms available
- 50-70%: Moderate quality, Tier 2-3 algorithms
- < 50%: Poor quality, Tier 4 or insufficient

**Implementation**: `ecosphere-backend/services/forecastService.js:calculateCompleteness()`

---

#### Missing Period Detection

**Purpose**: Identify gaps in historical data

**Criteria**: Gap > 24 hours between consecutive data points

**Output**: Array of missing periods with start date, end date, and duration

**Limit**: Report up to 5 largest gaps

**Implementation**: `ecosphere-backend/services/forecastService.js:identifyMissingPeriods()`

---

### 8.4 Algorithm Selection Logic

**Decision Tree**:

```
START
  ↓
Has 1 year + 70% complete?
  ├─ YES → Tier 1: Holt-Winters (90% confidence)
  └─ NO
      ↓
    Has last year + 30 days?
      ├─ YES → Tier 2: Seasonal Weighted (80% confidence)
      └─ NO
          ↓
        Has 30 days?
          ├─ YES → Tier 3: Trend-Based (65% confidence)
          └─ NO
              ↓
            Has 7 days?
              ├─ YES → Tier 4: Moving Average (50% confidence)
              └─ NO → Insufficient Data (0% confidence)
```

**Implementation**: `ecosphere-backend/services/forecastService.js:selectPredictionStrategy()`

---

## 9. Algorithm Constants Reference

### 9.1 Forecast Constants

**File**: `ecosphere-backend/utils/forecastConstants.js`

```javascript
// Time periods
HOURS_PER_DAY: 24
DAYS_PER_WEEK: 7
DAYS_PER_MONTH: 30
DAYS_PER_YEAR: 365

// Data quality thresholds
MIN_HOURS_FOR_COMPLETE_DAY: 20
MIN_COMPLETENESS_SCORE: 70
MIN_DATA_AVAILABILITY: 0.5
GAP_THRESHOLD_HOURS: 24
MAX_MISSING_PERIODS: 5

// Holt-Winters parameters
ALPHA: 0.5    // Level smoothing
BETA: 0.4     // Trend smoothing
GAMMA: 0.3    // Seasonal smoothing

// Seasonal weights (Tier 2)
LAST_YEAR: 0.3
LAST_WEEK: 0.5
RECENT_AVERAGE: 0.2
```

---

### 9.2 Weather Constants

**File**: `ecosphere-backend/utils/weatherConstants.js`

```javascript
// Location (Calgary SAIT Solar Lab)
LATITUDE: 51.0947
LONGITUDE: -114.1094
TIMEZONE: 'America/Edmonton'

// Training period
TRAINING_DAYS: 60
MIN_DAYS_REQUIRED: 30

// Forecast constraints
MIN_DAYS: 1
MAX_DAYS: 30
DEFAULT_DAYS: 7
```

---

### 9.3 Thermal Constants

**File**: `ecosphere-backend/utils/thermalConstants.js`

```javascript
// Temperature ranges
MIN_INDOOR_TEMP: 15    // °C
MAX_INDOOR_TEMP: 30    // °C
COMFORTABLE_TEMP: 22   // °C (default)

// Weather influence
MIN_WEATHER_COEFFICIENT: 0.02
DEFAULT_WEATHER_COEFFICIENT: 0.05
MAX_WEATHER_COEFFICIENT: 0.2

// Model weights
HISTORICAL_WEIGHT: 0.8
WEATHER_WEIGHT: 0.2
```

---

## 10. Code Location Reference

### 10.1 Frontend Algorithms

| Algorithm | File | Function |
|-----------|------|----------|
| Net Energy Calculation | `utils/electricityCalculations.js` | `calculateNetEnergyFromData()` |
| Self-Sufficiency Rate | `utils/electricityCalculations.js` | `calculateSelfSufficiencyRate()` |
| Net Energy Metrics | `utils/electricityCalculations.js` | `calculateNetEnergyMetrics()` |

---

### 10.2 Backend Algorithms

| Algorithm | File | Function |
|-----------|------|----------|
| Consumption Forecast (All Tiers) | `services/forecastService.js` | `generateForecast()` |
| Holt-Winters | `services/forecastService.js` | `holtWintersForecast()` |
| Seasonal Weighted | `services/forecastService.js` | `seasonalWeightedForecast()` |
| Trend-Based | `services/forecastService.js` | `trendBasedForecast()` |
| Moving Average | `services/forecastService.js` | `movingAverageForecast()` |
| Generation Forecast | `services/forecastService.js` | `generateGenerationForecast()` |
| Rainwater Forecast | `services/forecastService.js` | `generateRainwaterForecast()` |
| Thermal Forecast | `services/forecastService.js` | `generateThermalForecast()` |
| Weather Data Fetch | `services/weatherService.js` | `getWeatherData()` |
| Weather Aggregation | `services/weatherService.js` | `aggregateToDaily()` |

---

### 10.3 Utility Functions

| Function | File | Purpose |
|----------|------|---------|
| `formatDate()` | `utils/forecastHelpers.js` | Format date to YYYY-MM-DD |
| `addDays()` | `utils/forecastHelpers.js` | Add days to date |
| `calculateAverage()` | `utils/forecastHelpers.js` | Calculate array average |
| `calculateLinearTrend()` | `utils/forecastHelpers.js` | Calculate linear trend |
| `aggregateHourlyToDaily()` | `utils/forecastHelpers.js` | Aggregate hourly to daily |

---

## 11. Future Algorithm Enhancements

### 11.1 Planned Improvements

1. **Machine Learning Models**:
   - Neural networks for consumption prediction
   - LSTM for time series forecasting
   - Ensemble methods combining multiple models

2. **Advanced Weather Integration**:
   - Multi-variable regression (temperature + radiation + cloud cover)
   - Weather pattern recognition
   - Seasonal adjustment factors

3. **Occupancy-Based Predictions**:
   - Integrate occupancy sensors
   - Weekday vs weekend patterns
   - Holiday adjustments

4. **Real-Time Adaptation**:
   - Online learning from recent data
   - Automatic model retraining
   - Anomaly detection and correction

---

### 11.2 Known Limitations

1. **Holt-Winters**:
   - Requires complete seasonal cycle (1 year)
   - Sensitive to outliers
   - Assumes consistent seasonality

2. **Weather-Based Models**:
   - Limited to 7-day forecast accuracy
   - Weather forecast errors propagate
   - Simple linear models may miss complex relationships

3. **Thermal Forecast**:
   - Assumes stable HVAC operation
   - Doesn't account for occupancy changes
   - Weather coefficient may be too small for visibility

4. **Data Quality**:
   - Missing data reduces accuracy
   - Incomplete days excluded from training
   - No interpolation for gaps

---

## 12. Testing and Validation

### 12.1 Algorithm Testing

**Test Scripts**:
- `scripts/test-forecast-service.js` - Test forecast algorithms
- `scripts/test-thermal-forecast.js` - Test thermal forecast
- `scripts/test-self-sufficiency.js` - Test self-sufficiency calculation

**Validation Methods**:
1. Historical backtesting (compare predictions to actual data)
2. Cross-validation (train on subset, test on holdout)
3. Error metrics (MAE, RMSE, MAPE)

---

### 12.2 Performance Benchmarks

**Query Performance**:
- Hourly aggregation: ~130ms (optimized with DATEPART)
- Daily aggregation: ~50ms
- Forecast generation: ~200-500ms (depending on tier)
- Weather API call: ~500-1000ms

**Memory Usage**:
- Forecast service: ~50MB per request
- Weather data cache: ~10MB
- Time series analysis: ~100MB for 1 year data

---

## Document Maintenance

**How to Update**:
1. Update when adding new algorithms
2. Update when modifying existing formulas
3. Update when changing constants or thresholds
4. Keep code locations accurate
5. Document performance characteristics

**Last Updated**: 2026-01-07  
**Next Review**: When implementing new forecast features

---

**End of Document**
