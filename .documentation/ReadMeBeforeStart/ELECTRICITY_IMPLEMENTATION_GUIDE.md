# Electricity Report Implementation Guide

**Document Version**: 2026-01-28  
**Purpose**: Detailed implementation reference for Electricity Dashboard features  
**Target Audience**: Developers implementing Water/Thermal/Other dashboards  
**Reusable Patterns**: Chart configurations, forecast algorithms, UI components

---

## Table of Contents

1. [Overview](#1-overview)
2. [Chart Implementations](#2-chart-implementations)
3. [Forecast System](#3-forecast-system)
4. [Data Processing](#4-data-processing)
5. [UI Components](#5-ui-components)
6. [Reusable Patterns for Other Modules](#6-reusable-patterns-for-other-modules)

---

## 1. Overview

### 1.1 Electricity Dashboard Structure

**Location**: `ecosphere-frontend/src/pages/ElectricityDashboardPage.jsx`

**Four Main Tabs**:
1. **Overview Tab**: Metrics cards + overall trend chart
2. **Breakdown Tab**: Phase breakdown + equipment breakdown + solar source breakdown
3. **Comparison Tab**: Period comparison (day/week/month)
4. **Forecast Tab**: Historical pattern forecast + ML solar forecast

**Key Features**:
- ✅ Zoom and pan on all charts
- ✅ Data labels on hover
- ✅ Responsive design
- ✅ Consistent color scheme (SAIT Blue/Red)
- ✅ Loading states and error handling
- ✅ Date range selection with validation

---

## 2. Chart Implementations

### 2.1 Chart.js Configuration Standards

**Base Configuration** (applies to all charts):

```javascript
const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: {
                usePointStyle: true,
                padding: 15,
                font: { size: 12 }
            }
        },
        tooltip: {
            enabled: true,
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    label += Math.abs(context.parsed.y).toLocaleString() + ' Wh';
                    return label;
                }
            }
        },
        zoom: {
            pan: {
                enabled: true,
                mode: 'x',
                modifierKey: 'ctrl',
            },
            zoom: {
                wheel: {
                    enabled: true,
                    speed: 0.1,
                },
                pinch: {
                    enabled: true
                },
                mode: 'x',
            },
            limits: {
                x: { min: 'original', max: 'original' },
            }
        }
    },
    scales: {
        x: {
            display: true,
            title: {
                display: true,
                text: 'Date/Time'
            },
            grid: { display: false }
        },
        y: {
            display: true,
            title: {
                display: true,
                text: 'Energy (Wh)'
            },
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: {
                callback: function(value) {
                    return Math.abs(value).toLocaleString() + ' Wh';
                }
            }
        }
    }
};
```

**Key Features**:
- ✅ **Zoom**: Mouse wheel to zoom in/out
- ✅ **Pan**: Ctrl + drag to pan
- ✅ **Reset**: Double-click to reset zoom
- ✅ **Hover**: Show data labels on hover
- ✅ **Responsive**: Auto-resize with container

**Required Plugin**: `chartjs-plugin-zoom`

```bash
npm install chartjs-plugin-zoom
```

**Import**:
```javascript
import zoomPlugin from 'chartjs-plugin-zoom';
Chart.register(zoomPlugin);
```

---

### 2.2 Line Chart with Multiple Datasets

**Use Case**: Consumption vs Generation vs Net Energy

**Example**: `OverallTrendChart.jsx`

**Dataset Configuration**:

```javascript
const datasets = [
    {
        label: 'Consumption',
        data: consumptionData.map(d => ({ x: d.ts, y: Math.abs(d.value) })),
        borderColor: '#DA291C',  // SAIT Red
        backgroundColor: 'rgba(218, 41, 28, 0.1)',
        borderWidth: 2,
        pointRadius: 0,  // No points for cleaner look
        pointHoverRadius: 4,
        tension: 0.1,  // Slight curve
        fill: false
    },
    {
        label: 'Generation',
        data: generationData.map(d => ({ x: d.ts, y: d.value })),
        borderColor: '#4CAF50',  // Green
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: false
    },
    {
        label: 'Net Energy',
        data: netEnergyData.map(d => ({ x: d.ts, y: d.value })),
        borderColor: '#005EB8',  // SAIT Blue
        backgroundColor: 'rgba(0, 94, 184, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: false
    }
];
```

**Color Standards**:
- **Consumption**: `#DA291C` (SAIT Red) - Always use absolute values for display
- **Generation**: `#4CAF50` (Green)
- **Net Energy**: `#005EB8` (SAIT Blue)
- **Predicted**: Same colors with 50% opacity

---

### 2.3 Stacked Bar Chart

**Use Case**: Phase breakdown, Equipment breakdown

**Example**: `PhaseBreakdownChart.jsx`

**Configuration**:

```javascript
const options = {
    // ... base configuration
    scales: {
        x: {
            stacked: true,  // Enable stacking
            // ... other x-axis config
        },
        y: {
            stacked: true,  // Enable stacking
            // ... other y-axis config
        }
    }
};

const datasets = [
    {
        label: 'Phase A',
        data: phaseAData,
        backgroundColor: '#DA291C',  // SAIT Red
        borderColor: '#DA291C',
        borderWidth: 1
    },
    {
        label: 'Phase B',
        data: phaseBData,
        backgroundColor: '#005EB8',  // SAIT Blue
        borderColor: '#005EB8',
        borderWidth: 1
    },
    {
        label: 'Phase C',
        data: phaseCData,
        backgroundColor: '#4CAF50',  // Green
        borderColor: '#4CAF50',
        borderWidth: 1
    }
];
```

**Tooltip for Stacked Charts**:

```javascript
tooltip: {
    callbacks: {
        footer: function(tooltipItems) {
            let total = 0;
            tooltipItems.forEach(item => {
                total += Math.abs(item.parsed.y);
            });
            return 'Total: ' + total.toLocaleString() + ' Wh';
        }
    }
}
```

---

### 2.4 Comparison Chart (Side-by-Side Bars)

**Use Case**: Period comparison (This Week vs Last Week)

**Example**: `ComparisonChart.jsx`

**Configuration**:

```javascript
const datasets = [
    {
        label: 'This Week',
        data: thisWeekData,
        backgroundColor: '#005EB8',  // SAIT Blue
        borderColor: '#005EB8',
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9
    },
    {
        label: 'Last Week',
        data: lastWeekData,
        backgroundColor: '#DA291C',  // SAIT Red
        borderColor: '#DA291C',
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9
    }
];
```

**Important**: Do NOT set `stacked: true` for side-by-side comparison

---

## 3. Forecast System

### 3.1 Forecast Tab Structure

**Location**: `ecosphere-frontend/src/components/Forecast/ForecastTab.jsx`

**Two Forecast Types**:
1. **Historical Pattern**: Multi-tier consumption/generation forecast
2. **ML Solar Forecast**: AI-powered solar generation prediction

**Toggle Implementation**:

```javascript
const [forecastType, setForecastType] = useState(FORECAST_UI_TYPES.HISTORICAL);

<ToggleButtonGroup
    value={forecastType}
    exclusive
    onChange={(e, newType) => {
        if (newType) setForecastType(newType);
    }}
>
    <ToggleButton value={FORECAST_UI_TYPES.HISTORICAL}>
        📊 Historical Pattern
    </ToggleButton>
    <ToggleButton value={FORECAST_UI_TYPES.ML_SOLAR}>
        🤖 AI Solar Forecast
    </ToggleButton>
</ToggleButtonGroup>
```

---

### 3.2 Historical Forecast Configuration

**Default Settings**:
- **Forecast Type**: Historical Pattern (`FORECAST_UI_TYPES.HISTORICAL`)
- **Forecast Period**: 7 days (168 hours)
- **Auto-generation**: Enabled on component mount

**Auto-generation Logic**:

```javascript
const [hasAutoGenerated, setHasAutoGenerated] = useState(false);

useEffect(() => {
    if (!hasAutoGenerated && dateTo && forecastType === FORECAST_UI_TYPES.HISTORICAL) {
        console.log('🚀 Auto-generating historical forecast on mount');
        setHasAutoGenerated(true);
        handleGenerateForecast();
    }
}, [dateTo, forecastType, hasAutoGenerated]);
```

**Why Auto-generate?**
- Better UX: Users see results immediately
- Demonstrates functionality without user action
- Uses cached data for fast response

---

### 3.3 Forecast Algorithm Tier Display

**Component**: `AlgorithmTiersGrid.jsx`

**Tier Card Structure**:

```javascript
<Box sx={{
    p: 2,
    borderRadius: 1,
    border: '2px solid',
    borderColor: isActive ? 'success.main' : 'grey.300',
    bgcolor: isActive ? 'success.light' : 'grey.50',
    opacity: isActive ? 1 : 0.6
}}>
    <Chip label={`Tier ${tier}`} color={isActive ? 'success' : 'default'} />
    <Typography variant="body2" fontWeight="bold">{name}</Typography>
    <Typography variant="caption">{stars}</Typography>
    
    {/* Features */}
    {features.map(feature => (
        <Typography variant="caption">• {feature}</Typography>
    ))}
    
    {/* Requirements */}
    <Typography variant="caption" fontWeight="bold">Requirements:</Typography>
    {requirements.map(req => (
        <Typography variant="caption">• {req}</Typography>
    ))}
</Box>
```

**Active Tier Highlighting**:
- Green border and background for active tier
- Full opacity for active, 60% for inactive
- Success chip color for active tier

---

### 3.4 Data Availability Display

**Component**: `DataAvailabilityCard.jsx`

**Sub-components**:
1. **DataCompletenessSection**: Progress bar showing completeness percentage
2. **AvailableDataChecks**: Checkmarks for data requirements
3. **MissingPeriodsSection**: List of missing data periods
4. **AlgorithmSelectionSection**: Selected algorithm info
5. **AlgorithmTiersGrid**: All tiers with active highlighting

**Completeness Calculation Display**:

```javascript
<LinearProgress
    variant="determinate"
    value={completenessScore}
    sx={{ height: 8, borderRadius: 1 }}
/>
<Typography variant="caption">
    Calculated as: (Actual data points / Expected hourly data points) × 100.
    Expected points = total hours between first and last data point.
</Typography>
<Typography variant="caption" fontStyle="italic">
    Example: {totalDataPoints.toLocaleString()} actual points / 
    {expectedDataPoints.toLocaleString()} expected points = {completenessScore}%
</Typography>
```

---

### 3.5 Forecast Chart Configuration

**Component**: `ForecastChart.jsx`

**Dual Y-Axis Support** (for consumption + generation):

```javascript
const datasets = [
    {
        label: 'Consumption Forecast',
        data: consumptionData.predictions.map(p => p.value),
        borderColor: '#DA291C',
        yAxisID: 'y',  // Left axis
        // ... other config
    },
    {
        label: 'Generation Forecast',
        data: generationData.predictions.map(p => p.value),
        borderColor: '#4CAF50',
        yAxisID: 'y',  // Same axis for comparison
        // ... other config
    }
];

const options = {
    scales: {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Daily Energy (Wh/day)' }
        }
    }
};
```

**Data Labels on Points**:

```javascript
import ChartDataLabels from 'chartjs-plugin-datalabels';

const datasets = [{
    // ... other config
    datalabels: {
        display: true,
        align: 'top',
        anchor: 'end',
        formatter: (value) => Math.round(value),
        font: { size: 10, weight: 'bold' },
        color: '#DA291C'
    }
}];

<Line data={chartData} options={options} plugins={[ChartDataLabels]} />
```

---

## 4. Data Processing

### 4.1 Sign Handling (Critical!)

**Database Storage**:
- **Consumption**: NEGATIVE values (e.g., -85000 Wh)
- **Generation**: POSITIVE values (e.g., +15000 Wh)
- **Net Energy**: Can be positive or negative

**Display Rules**:
1. **Charts**: Always show ABSOLUTE values for consumption
   ```javascript
   data: consumptionData.map(d => ({ x: d.ts, y: Math.abs(d.value) }))
   ```

2. **Calculations**: Preserve signs for accuracy
   ```javascript
   netEnergy = generation + consumption  // consumption is negative
   selfSufficiency = Math.abs(generation) / Math.abs(consumption) * 100
   ```

3. **Forecast Algorithms**: Convert to absolute before processing
   ```javascript
   const tsData = data.map(d => [new Date(d.ts).getTime(), Math.abs(d.value)]);
   ```

**Why This Matters**:
- Incorrect sign handling causes negative charts
- Forecast algorithms fail with negative inputs
- Self-sufficiency calculations become meaningless

---

### 4.2 Date Handling (Timezone Safety)

**Problem**: JavaScript Date objects are timezone-sensitive

**Solution**: Always use T12:00:00 pattern

**Examples**:

```javascript
// ❌ WRONG: Timezone-dependent
const date = new Date('2025-12-30');  // Might be Dec 29 or Dec 30 depending on timezone

// ✅ CORRECT: Timezone-safe
const date = new Date('2025-12-30T12:00:00');  // Always Dec 30 at noon

// ✅ CORRECT: Format for API
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

**Date Picker Configuration**:

```javascript
<DatePicker
    value={dateFrom}
    onChange={(newValue) => setDateFrom(newValue)}
    format="YYYY-MM-DD"
    slotProps={{
        textField: {
            fullWidth: true,
            helperText: 'Select start date'
        }
    }}
/>
```

---

### 4.3 Data Aggregation

**Hourly Aggregation** (from 1-minute data):

**Backend** (SQL Server):
```javascript
const query = `
    SELECT 
        DATEPART(YEAR, ts) AS year,
        DATEPART(MONTH, ts) AS month,
        DATEPART(DAY, ts) AS day,
        DATEPART(HOUR, ts) AS hour,
        SUM(value) AS hourly_total
    FROM ${tableName}
    WHERE ts BETWEEN @start AND @end
    GROUP BY 
        DATEPART(YEAR, ts),
        DATEPART(MONTH, ts),
        DATEPART(DAY, ts),
        DATEPART(HOUR, ts)
    ORDER BY year, month, day, hour
`;
```

**Frontend** (JavaScript):
```javascript
function aggregateToHourly(minuteData) {
    const hourlyMap = {};
    
    minuteData.forEach(point => {
        const hour = point.ts.substring(0, 13); // 'YYYY-MM-DD HH'
        if (!hourlyMap[hour]) {
            hourlyMap[hour] = 0;
        }
        hourlyMap[hour] += point.value;
    });
    
    return Object.entries(hourlyMap).map(([hour, value]) => ({
        ts: hour + ':00:00',
        value: value
    }));
}
```

**Daily Aggregation** (from hourly data):

```javascript
function aggregateToDaily(hourlyData) {
    const dailyMap = {};
    
    hourlyData.forEach(point => {
        const date = point.ts.substring(0, 10); // 'YYYY-MM-DD'
        if (!dailyMap[date]) {
            dailyMap[date] = 0;
        }
        dailyMap[date] += point.value;
    });
    
    return Object.entries(dailyMap).map(([date, value]) => ({
        date: date,
        value: value
    }));
}
```

---

## 5. UI Components

### 5.1 Metrics Cards

**Component**: `MetricsCards.jsx`

**Card Structure**:

```javascript
<Grid container spacing={2}>
    <Grid item xs={12} sm={6} md={3}>
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ElectricBoltIcon sx={{ mr: 1, color: '#DA291C' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                        Total Consumption
                    </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                    {totalConsumption.toLocaleString()} Wh
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {dateRange}
                </Typography>
            </CardContent>
        </Card>
    </Grid>
    {/* Repeat for other metrics */}
</Grid>
```

**Metrics to Display**:
1. Total Consumption (absolute value)
2. Total Generation
3. Net Energy (can be negative)
4. Self-Sufficiency Rate (percentage)

---

### 5.2 Loading States

**Skeleton Loading**:

```javascript
import { Skeleton } from '@mui/material';

{loading ? (
    <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
    </Box>
) : (
    <ActualContent />
)}
```

**Circular Progress**:

```javascript
{loading && (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading data...</Typography>
    </Box>
)}
```

---

### 5.3 Error Handling

**Error Alert**:

```javascript
{error && (
    <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
    </Alert>
)}
```

**Empty State**:

```javascript
{!loading && data.length === 0 && (
    <Card>
        <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                    No data available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Try selecting a different date range
                </Typography>
            </Box>
        </CardContent>
    </Card>
)}
```

---

## 6. Reusable Patterns for Other Modules

### 6.1 Water Dashboard Reuse

**What to Reuse**:
- ✅ `MetricsCards` component (change metrics)
- ✅ `OverallTrendChart` component (change data source)
- ✅ Chart.js configuration (zoom, pan, tooltips)
- ✅ Date range selection logic
- ✅ Loading/error states
- ✅ Forecast tab structure (adapt algorithms)

**What to Adapt**:
- Metrics: Rainwater level (%), Hot water consumption (L)
- Colors: Blue for rainwater, Red for hot water
- Units: Liters instead of Wh
- Forecast algorithms: Weather-based for rainwater

**Example Adaptation**:

```javascript
// Electricity
<MetricsCards
    totalConsumption={consumption}
    totalGeneration={generation}
    unit="Wh"
    consumptionColor="#DA291C"
    generationColor="#4CAF50"
/>

// Water
<MetricsCards
    totalRainwater={rainwater}
    totalHotWater={hotWater}
    unit="L"
    rainwaterColor="#005EB8"
    hotWaterColor="#DA291C"
/>
```

---

### 6.2 Thermal Dashboard Reuse

**What to Reuse**:
- ✅ Line chart configuration
- ✅ Multi-sensor aggregation logic
- ✅ Forecast tab structure
- ✅ Date range selection

**What to Adapt**:
- Metrics: Temperature (°C) instead of energy (Wh)
- Chart type: Line chart (not stacked bars)
- Forecast: Hybrid model (historical + weather)
- Sensors: Multiple sensors per floor

---

### 6.3 Common Patterns Checklist

When implementing a new dashboard, reuse these patterns:

- [ ] Chart.js base configuration with zoom/pan
- [ ] Metrics cards layout (Grid 4 columns)
- [ ] Date range selection with validation
- [ ] Loading states (Skeleton + CircularProgress)
- [ ] Error handling (Alert + empty state)
- [ ] Tab navigation (Overview, Breakdown, Comparison, Forecast)
- [ ] Forecast tier system (if applicable)
- [ ] Data availability display
- [ ] Export functionality (PDF)
- [ ] Responsive design (mobile-friendly)

---

## 7. Performance Optimization

### 7.1 Data Caching

**Backend Caching**:

```javascript
const cache = require('../utils/cache');
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Check cache
const cacheKey = `electricity_${startDate}_${endDate}`;
const cached = cache.get(cacheKey);
if (cached) {
    return cached;
}

// Fetch and cache
const data = await fetchFromDatabase();
cache.set(cacheKey, data, CACHE_TTL);
return data;
```

**Frontend Caching**:

```javascript
const [cachedData, setCachedData] = useState(null);

useEffect(() => {
    if (cachedData && isSameDateRange(dateFrom, dateTo)) {
        // Use cached data
        setData(cachedData);
        return;
    }
    
    // Fetch new data
    fetchData().then(newData => {
        setData(newData);
        setCachedData(newData);
    });
}, [dateFrom, dateTo]);
```

---

### 7.2 Lazy Loading

**Component Lazy Loading**:

```javascript
import { lazy, Suspense } from 'react';

const ForecastTab = lazy(() => import('./ForecastTab'));

<Suspense fallback={<CircularProgress />}>
    <ForecastTab dateTo={dateTo} />
</Suspense>
```

**Chart Lazy Rendering**:

```javascript
const [activeTab, setActiveTab] = useState(0);

// Only render active tab's chart
{activeTab === 0 && <OverviewChart />}
{activeTab === 1 && <BreakdownChart />}
{activeTab === 2 && <ComparisonChart />}
{activeTab === 3 && <ForecastChart />}
```

---

## 8. Testing Checklist

### 8.1 Functionality Testing

- [ ] Date range selection works correctly
- [ ] Charts display data accurately
- [ ] Zoom and pan work on all charts
- [ ] Forecast generation completes successfully
- [ ] Tier selection is correct based on data availability
- [ ] Export to PDF works
- [ ] Loading states display correctly
- [ ] Error handling works for API failures
- [ ] Empty state displays when no data

### 8.2 Data Accuracy Testing

- [ ] Consumption values are positive in charts
- [ ] Net energy calculation is correct
- [ ] Self-sufficiency rate is accurate
- [ ] Forecast predictions are reasonable
- [ ] Date ranges match user selection
- [ ] Aggregation (hourly/daily) is correct

### 8.3 UI/UX Testing

- [ ] Responsive on mobile devices
- [ ] Colors match SAIT brand guidelines
- [ ] Tooltips show correct information
- [ ] Loading indicators are visible
- [ ] Error messages are clear
- [ ] Navigation is intuitive

---

## 9. Common Issues and Solutions

### 9.1 Negative Values in Charts

**Problem**: Consumption shows as negative bars

**Solution**: Use `Math.abs()` when mapping data

```javascript
// ❌ WRONG
data: consumptionData.map(d => d.value)

// ✅ CORRECT
data: consumptionData.map(d => Math.abs(d.value))
```

---

### 9.2 Forecast Returns Null Values

**Problem**: All forecast predictions are `null`

**Causes**:
1. Incorrect data format passed to algorithm
2. Sign not converted to absolute value
3. Aggregation function returns wrong format

**Solution**: Check data format and use absolute values

```javascript
// Ensure data format is correct
const tsData = data.map(d => [
    new Date(d.ts).getTime(),  // Timestamp in milliseconds
    Math.abs(d.value)          // Absolute value
]);
```

---

### 9.3 Chart Not Zooming

**Problem**: Zoom plugin not working

**Solution**: Register plugin and check configuration

```javascript
import { Chart } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register plugin globally
Chart.register(zoomPlugin);

// Or pass to Line component
<Line data={data} options={options} plugins={[zoomPlugin]} />
```

---

### 9.4 Date Range Validation Fails

**Problem**: "End date must be after start date" error

**Solution**: Use defensive date parsing

```javascript
function parseDateSafely(dateInput) {
    if (!dateInput) return null;
    
    if (typeof dateInput === 'string') {
        // Add T12:00:00 for timezone safety
        let date = new Date(dateInput + 'T12:00:00');
        return isNaN(date.getTime()) ? null : date;
    }
    
    if (dateInput instanceof Date) {
        return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    return null;
}
```

---

## 10. Summary

### Key Takeaways

1. **Chart Configuration**: Use consistent zoom/pan/tooltip settings across all charts
2. **Sign Handling**: Always use `Math.abs()` for consumption display
3. **Date Handling**: Always use `T12:00:00` pattern for timezone safety
4. **Forecast System**: Multi-tier system with graceful degradation
5. **Reusable Components**: `MetricsCards`, `OverallTrendChart`, `ForecastTab`
6. **Performance**: Cache data, lazy load components
7. **Testing**: Verify data accuracy, UI responsiveness, error handling

### Next Steps for Water Dashboard

1. Copy `MetricsCards` and adapt for water metrics
2. Reuse `OverallTrendChart` with water data
3. Adapt forecast algorithms for rainwater (weather-based)
4. Use same chart configurations (zoom, pan, tooltips)
5. Follow same date handling patterns
6. Implement same loading/error states

---

**Document Maintenance**: Update this guide when adding new features or patterns to Electricity Dashboard.
