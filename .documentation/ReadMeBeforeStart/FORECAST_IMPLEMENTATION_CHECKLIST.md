# Forecast Implementation Checklist

**Document Purpose**: Step-by-step guide for implementing forecast features in Water and Thermal modules
**Reference Implementation**: Electricity Report Forecast Tab
**Last Updated**: 2026-01-05
**Target Reader**: AI Assistants and Development Team

---

## Overview

This document provides a comprehensive checklist for implementing forecast functionality in Water and Thermal modules, based on the successful implementation in the Electricity module. The Electricity forecast serves as the reference implementation with proven patterns and best practices.

**Forecast Types**:
- **Consumption Forecast**: Multi-tier algorithm system (Holt-Winters, Seasonal Weighted, Trend-Based, Moving Average)
- **Generation Forecast** (Electricity only): Weather-based linear regression using Open-Meteo API

---

## 1. Prerequisites

### 1.1 Required Knowledge
- [ ] Understand the Electricity forecast implementation
- [ ] Review `services/forecastService.js` for algorithm implementations
- [ ] Review `components/Forecast/` directory for UI components
- [ ] Understand the 4-tier algorithm system

### 1.2 Data Requirements
- [ ] Identify primary data table (e.g., TL341 for electricity consumption)
- [ ] Verify data availability (minimum 7 days for basic forecast)
- [ ] Understand data structure (hourly vs daily intervals)
- [ ] Check for data gaps and completeness

### 1.3 Backend Standards
- [ ] Review `utils/controllerHelper.js` for reusable utilities
- [ ] Understand `asyncHandler`, `createDataFetcher` patterns
- [ ] Follow code standards (no magic numbers, DRY principle)
- [ ] Controllers < 150 lines, Functions < 50 lines

---

## 2. Backend Implementation

### 2.1 Create Forecast Routes

**File**: `routes/[module]ForecastRoutes.js` or add to existing `[module]Routes.js`

```javascript
// Example for Water module
const express = require('express');
const router = express.Router();
const { getWaterForecast } = require('../controllers/waterController');

// Get water consumption forecast
// Parameters:
//   - targetDate: YYYY-MM-DD (base date, forecast starts from day after)
//   - forecastDays: number of days to forecast (1-30)
router.get('/forecast/:targetDate/:forecastDays', getWaterForecast);

module.exports = router;
```

**Checklist**:
- [ ] Create or update routes file
- [ ] Define forecast endpoint with targetDate and forecastDays parameters
- [ ] Add route to server.js
- [ ] Test route accessibility

### 2.2 Implement Forecast Controller

**File**: `controllers/[module]Controller.js`

**Use Helper Functions**:
```javascript
const { asyncHandler, validateParams } = require('../utils/controllerHelper');

const getWaterForecast = asyncHandler(async (req, res) => {
    const { targetDate, forecastDays } = req.params;
    
    // Validate parameters
    validateParams({ targetDate, forecastDays });
    
    const days = parseInt(forecastDays);
    if (isNaN(days) || days < 1 || days > 30) {
        return res.status(400).json({
            success: false,
            error: 'forecastDays must be between 1 and 30'
        });
    }
    
    // Get historical data
    const historicalData = await WaterService.getConsumptionData(
        calculateStartDate(targetDate, 365),
        targetDate
    );
    
    // Generate forecast
    const forecastResult = await ForecastService.generateForecast(
        targetDate,
        days,
        historicalData
    );
    
    // Return response
    res.json({
        success: true,
        targetDate: targetDate,
        forecastDays: days,
        predictions: forecastResult.predictions,
        metadata: forecastResult.metadata
    });
});
```

**Checklist**:
- [ ] Use `asyncHandler` for automatic error handling
- [ ] Validate input parameters (targetDate, forecastDays)
- [ ] Fetch historical data (1 year recommended for Holt-Winters)
- [ ] Call `ForecastService.generateForecast()`
- [ ] Return standardized response format
- [ ] Keep controller < 150 lines

### 2.3 Update Forecast Service (if needed)

**File**: `services/forecastService.js`

**Note**: The existing `generateForecast()` method is generic and should work for most modules. Only create module-specific methods if special logic is needed.

**Checklist**:
- [ ] Review existing `generateForecast()` method
- [ ] Determine if module-specific logic is needed
- [ ] If needed, create new method (e.g., `generateWaterForecast()`)
- [ ] Follow existing patterns (4-tier algorithm system)
- [ ] Add appropriate comments and documentation

---

## 3. Frontend Implementation

### 3.1 Update Service Layer

**File**: `services/[Module]Service.js`

```javascript
class WaterService {
    /**
     * Get water consumption forecast
     * @param {string} targetDate - Base date (YYYY-MM-DD)
     * @param {number} forecastDays - Number of days to forecast
     * @returns {Promise<Object>} Forecast result
     */
    static async getWaterForecast(targetDate, forecastDays) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/water/forecast/${targetDate}/${forecastDays}`
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch forecast');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching water forecast:', error);
            throw error;
        }
    }
}
```

**Checklist**:
- [ ] Add forecast method to service class
- [ ] Use correct API endpoint
- [ ] Handle errors appropriately
- [ ] Return parsed JSON response

### 3.2 Create or Update Custom Hook

**File**: `lib/hooks/use[Module]Data.js`

```javascript
export const useWaterData = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [forecast, setForecast] = useState(null);
    
    const loadForecast = useCallback(async (targetDate, forecastDays) => {
        try {
            setLoading(true);
            setError(null);
            
            const formattedDate = formatDate(targetDate);
            const response = await WaterService.getWaterForecast(
                formattedDate,
                forecastDays
            );
            
            if (response.success) {
                setForecast(response);
            } else {
                throw new Error(response.error || 'Failed to load forecast');
            }
        } catch (err) {
            console.error('Error loading forecast:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);
    
    return {
        loading,
        error,
        forecast,
        loadForecast
    };
};
```

**Checklist**:
- [ ] Add forecast state variables
- [ ] Create `loadForecast` method
- [ ] Handle loading and error states
- [ ] Use `useCallback` for performance
- [ ] Return forecast data and methods

### 3.3 Create Forecast Tab Component

**File**: `components/[Module]/ForecastTab.jsx`

**Reusable Components** (from Electricity):
- `DataAvailabilityCard.jsx` - Shows data completeness and algorithm selection
- `AlgorithmTiersGrid.jsx` - Displays 4-tier algorithm system
- `ForecastChart.jsx` - Line chart for predictions (may need customization)

**Structure**:
```javascript
const ForecastTab = ({ dateTo }) => {
    const [forecastDays, setForecastDays] = useState(FORECAST_PERIODS.SEVEN_DAYS);
    const { loading, error, forecast, loadForecast } = useWaterData();
    
    const handleGenerateForecast = async () => {
        if (!dateTo) return;
        try {
            await loadForecast(dateTo, forecastDays);
        } catch (err) {
            console.error('Failed to generate forecast:', err);
        }
    };
    
    useEffect(() => {
        if (dateTo) {
            handleGenerateForecast();
        }
    }, [dateTo, forecastDays]);
    
    return (
        <Box>
            {/* Configuration Card */}
            {/* Data Availability Card */}
            {/* Forecast Chart */}
        </Box>
    );
};
```

**Checklist**:
- [ ] Create ForecastTab component
- [ ] Add forecast period selector (7, 14, 30 days)
- [ ] Implement auto-generate on date/period change
- [ ] Reuse DataAvailabilityCard component
- [ ] Reuse or customize ForecastChart component
- [ ] Add loading and error states
- [ ] Keep component < 150 lines

### 3.4 Update Constants

**File**: `lib/constants/[module].js`

```javascript
// Forecast periods
export const FORECAST_PERIODS = {
    SEVEN_DAYS: 7,
    FOURTEEN_DAYS: 14,
    THIRTY_DAYS: 30
};

// Forecast period labels
export const FORECAST_PERIOD_LABELS = {
    [FORECAST_PERIODS.SEVEN_DAYS]: '7 Days',
    [FORECAST_PERIODS.FOURTEEN_DAYS]: '14 Days',
    [FORECAST_PERIODS.THIRTY_DAYS]: '30 Days'
};

// Chart colors
export const FORECAST_COLORS = {
    PREDICTED: '#DA291C',  // SAIT Red
    CONFIDENCE_AREA: 'rgba(218, 41, 28, 0.1)'
};
```

**Checklist**:
- [ ] Add forecast-related constants
- [ ] Define forecast periods
- [ ] Define chart colors (use SAIT colors)
- [ ] Add any module-specific constants

### 3.5 Integrate into Main Page

**File**: `pages/[Module]Page.jsx`

```javascript
// Add Forecast tab to tab list
const TABS = {
    OVERVIEW: 'overview',
    FORECAST: 'forecast',  // Add this
    // ... other tabs
};

// Add Forecast tab panel
{activeTab === TABS.FORECAST && (
    <ForecastTab dateTo={dateTo} />
)}
```

**Checklist**:
- [ ] Add FORECAST to tab constants
- [ ] Add Forecast tab button to UI
- [ ] Add Forecast tab panel
- [ ] Pass dateTo prop to ForecastTab
- [ ] Test tab switching

---

## 4. Testing Checklist

### 4.1 Backend Testing
- [ ] Test forecast endpoint with valid parameters
- [ ] Test with different forecast periods (7, 14, 30 days)
- [ ] Test with insufficient data (should gracefully degrade to lower tier)
- [ ] Test with invalid parameters (should return 400 error)
- [ ] Test with missing data (should handle gracefully)
- [ ] Verify response format matches specification

### 4.2 Frontend Testing
- [ ] Test forecast generation with different periods
- [ ] Test auto-generate on date change
- [ ] Test auto-generate on period change
- [ ] Test loading states
- [ ] Test error handling
- [ ] Test chart rendering
- [ ] Test data availability card display
- [ ] Test algorithm tier visualization
- [ ] Test responsive design (mobile, tablet, desktop)

### 4.3 Integration Testing
- [ ] Test end-to-end flow (UI → API → Database → Response → UI)
- [ ] Test with real data from database
- [ ] Test with edge cases (first day, last day of data)
- [ ] Test performance with large datasets
- [ ] Test concurrent requests

---

## 5. Algorithm Tier System

### 5.1 Understanding the 4-Tier System

The forecast system uses a graceful degradation approach based on data availability:

**Tier 1: Holt-Winters Seasonal Smoothing** (Best)
- **Requirements**: 1 year of data + 70% completeness
- **Confidence**: 90%
- **Best for**: Long-term patterns with clear seasonality
- **Formula**: `Y(t+h) = L(t) + h×T(t) + S(t+h-m)`

**Tier 2: Seasonal Weighted Prediction** (Good)
- **Requirements**: Last year same period + 30 days recent data
- **Confidence**: 80%
- **Best for**: Seasonal patterns without full year
- **Formula**: `Y = 0.3×LastYear + 0.5×LastWeek + 0.2×Avg30Days`

**Tier 3: Trend-Based Prediction** (Acceptable)
- **Requirements**: 30 days of recent data
- **Confidence**: 65%
- **Best for**: Short-term trends
- **Formula**: `Y = a×t + b`

**Tier 4: Moving Average** (Fallback)
- **Requirements**: 7 days of recent data
- **Confidence**: 50%
- **Best for**: Baseline when insufficient data
- **Formula**: `Y = (Σ last 7 days) / 7`

### 5.2 Algorithm Selection Logic

The system automatically selects the best available algorithm:

```javascript
// Check data availability
const dataAvailability = analyzeDataAvailability(historicalData, targetDate);

// Select algorithm based on availability
if (dataAvailability.hasOneYearCycle && dataAvailability.completenessScore >= 70) {
    return HOLT_WINTERS;  // Tier 1
} else if (dataAvailability.hasLastYearData && dataAvailability.hasRecent30Days) {
    return SEASONAL_WEIGHTED;  // Tier 2
} else if (dataAvailability.hasRecent30Days) {
    return TREND_BASED;  // Tier 3
} else if (dataAvailability.hasRecent7Days) {
    return MOVING_AVERAGE;  // Tier 4
} else {
    return INSUFFICIENT_DATA;  // Cannot forecast
}
```

---

## 6. Common Pitfalls and Solutions

### 6.1 Data Format Issues
**Problem**: Hourly data vs daily data mismatch
**Solution**: Use `aggregateHourlyToDaily()` utility function

### 6.2 Date Handling
**Problem**: Timezone issues causing date shifts
**Solution**: Always use `T12:00:00` pattern (e.g., `2020-11-08T12:00:00`)

### 6.3 Missing Data
**Problem**: Gaps in historical data affect forecast quality
**Solution**: Implement data completeness check and show warnings

### 6.4 Performance
**Problem**: Large datasets slow down forecast generation
**Solution**: Limit historical data to 1 year, use daily aggregation

### 6.5 Error Handling
**Problem**: Unhandled errors crash the application
**Solution**: Use `asyncHandler` and try-catch blocks consistently

---

## 7. Code Standards Compliance

### 7.1 Backend Standards
- [ ] No magic numbers/strings (use constants)
- [ ] Controllers < 150 lines
- [ ] Functions < 50 lines
- [ ] Use `asyncHandler` for error handling
- [ ] Use helper functions (`createDataFetcher`, etc.)
- [ ] Consistent error response format
- [ ] Input validation for all parameters

### 7.2 Frontend Standards
- [ ] Components < 150 lines
- [ ] Hooks at top of component
- [ ] No magic numbers/strings (use constants)
- [ ] Reuse existing components when possible
- [ ] Consistent naming conventions
- [ ] Proper error handling and loading states
- [ ] Responsive design

---

## 8. Reference Files

### Backend Reference
- `services/forecastService.js` - Core forecast algorithms
- `controllers/electricityController.js` - Reference controller implementation
- `utils/controllerHelper.js` - Reusable helper functions
- `routes/forecastRoutes.js` - Forecast route definitions

### Frontend Reference
- `components/Forecast/ForecastTab.jsx` - Main forecast UI
- `components/Forecast/DataAvailabilityCard.jsx` - Data analysis display
- `components/Forecast/AlgorithmTiersGrid.jsx` - Algorithm visualization
- `components/Forecast/ForecastChart.jsx` - Chart component
- `lib/hooks/useForecastData.js` - Data fetching hook
- `lib/constants/forecast.js` - Forecast constants

### Documentation
- `4.CURRENT_STATE.md` - Current implementation status
- `FORECAST_IMPLEMENTATION_CHECKLIST.md` - This document

---

## 9. Module-Specific Considerations

### 9.1 Water Module
**Data Characteristics**:
- Two separate metrics: Rainwater level (%) and Hot water consumption (L/h)
- Different data intervals (10-min for rainwater, 1-min for hot water)
- May need separate forecasts for each metric

**Recommendations**:
- Create two forecast tabs or use selector
- Consider different algorithms for level vs consumption
- Rainwater level may have weather correlation (similar to generation)

### 9.2 Thermal Module
**Data Characteristics**:
- Multiple sensors per floor (3-5 sensors)
- Temperature data (°C)
- 15-minute intervals
- Strong seasonal patterns

**Recommendations**:
- Forecast average temperature per floor
- Holt-Winters likely to work well (strong seasonality)
- Consider external temperature correlation
- May need separate forecasts per floor

---

## 10. Future Enhancements

### Potential Improvements
- [ ] Add confidence intervals to predictions
- [ ] Implement ensemble methods (combine multiple algorithms)
- [ ] Add weather correlation for water/thermal (like generation)
- [ ] Implement automatic model retraining
- [ ] Add forecast accuracy tracking
- [ ] Implement A/B testing for algorithm selection
- [ ] Add export functionality for forecast data
- [ ] Implement forecast comparison (actual vs predicted)

---

## Document Maintenance

**How to Update This Document**:
1. Update after implementing forecast in a new module
2. Add lessons learned and new patterns discovered
3. Update reference files if structure changes
4. Keep checklist items current and accurate
5. Add module-specific sections as needed

---

**End of Document**
