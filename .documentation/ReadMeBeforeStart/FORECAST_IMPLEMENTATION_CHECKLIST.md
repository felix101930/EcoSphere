# Forecast Implementation Checklist

**Purpose**: Ensure smooth implementation of forecast features for Water and Thermal modules
**Created**: 2026-01-04
**Based on**: Electricity Forecast implementation lessons learned

---

## Pre-Implementation Checklist

### 1. Review Reference Implementation

- [ ] Read Electricity Forecast implementation in `4.CURRENT_STATE.md`
- [ ] Review `react-nextjs-enterprise-standards.md` Section 4: Multi-Tab Data Management Pattern
- [ ] Study existing forecast components in `ecosphere-frontend/src/components/Forecast/`

### 2. Understand Data Requirements

- [ ] Identify data source tables (e.g., TL93 for water, TL2 sensors for thermal)
- [ ] Determine data granularity (hourly, daily, etc.)
- [ ] Check available date range in database
- [ ] Understand data completeness issues

### 3. Backend Preparation

- [ ] Verify backend service can fetch historical data
- [ ] Ensure date formatting uses `T12:00:00` pattern (timezone safety)
- [ ] Check if data aggregation is needed

---

## Implementation Steps

### Phase 1: Backend Implementation

#### Step 1.1: Install Dependencies (if not already installed)

```bash
cd ecosphere-backend
npm install timeseries-analysis
```

#### Step 1.2: Reuse Existing Services

- [ ] **DO NOT create new forecastService.js** - Reuse `services/forecastService.js`
- [ ] **DO NOT create new forecastHelpers.js** - Reuse `utils/forecastHelpers.js`
- [ ] Only create module-specific controller if needed

#### Step 1.3: Create Module-Specific Routes

- [ ] Create route file (e.g., `routes/waterForecastRoutes.js` or reuse `forecastRoutes.js`)
- [ ] Add endpoint: `GET /api/forecast/water/:targetDate/:forecastDays`
- [ ] Add endpoint: `GET /api/forecast/thermal/:targetDate/:forecastDays`

#### Step 1.4: Create Module-Specific Controller

- [ ] Create controller (e.g., `controllers/waterForecastController.js`)
- [ ] Validate inputs (targetDate, forecastDays)
- [ ] Fetch historical data using existing service
- [ ] Call `ForecastService.generateForecast()`
- [ ] Return response with predictions and metadata

#### Step 1.5: Register Routes in server.js

```javascript
const forecastRoutes = require('./routes/forecastRoutes');
app.use('/api/forecast', forecastRoutes);
```

---

### Phase 2: Frontend Implementation

#### Step 2.1: Reuse Existing Components

**CRITICAL: DO NOT recreate these components!**

- [ ] Reuse `components/Forecast/ForecastTab.jsx` (modify props)
- [ ] Reuse `components/Forecast/DataAvailabilityCard.jsx`
- [ ] Reuse `components/Forecast/ForecastChart.jsx`
- [ ] Reuse `components/Forecast/DataCompletenessSection.jsx`
- [ ] Reuse `components/Forecast/AvailableDataChecks.jsx`
- [ ] Reuse `components/Forecast/MissingPeriodsSection.jsx`
- [ ] Reuse `components/Forecast/AlgorithmSelectionSection.jsx`
- [ ] Reuse `components/Forecast/AlgorithmTiersGrid.jsx`

#### Step 2.2: Create Module-Specific Service

- [ ] Create `services/WaterForecastService.js` or `ThermalForecastService.js`
- [ ] Implement `getWaterForecast()` or `getThermalForecast()`
- [ ] Reuse `formatDate()` helper

#### Step 2.3: Create Module-Specific Hook

- [ ] Create `lib/hooks/useWaterForecastData.js` or `useThermalForecastData.js`
- [ ] Follow same pattern as `useForecastData.js`
- [ ] Include `clearForecast()` function

#### Step 2.4: Reuse Constants

- [ ] Reuse `lib/constants/forecast.js` (no changes needed)
- [ ] Reuse `lib/utils/forecastUtils.js` (no changes needed)

#### Step 2.5: Integrate into Module Page

- [ ] Add Forecast tab to Water/Thermal Report Page
- [ ] Pass `dateTo` prop to ForecastTab component
- [ ] Ensure tab switching works correctly

---

## Critical Issues to Avoid

### ❌ Issue 1: Multi-Tab Data Stale State

**Problem**: When user changes date filter, only current tab updates, other tabs show old data

**Solution**:

```javascript
const handleApplyFilter = async () => {
  // CRITICAL: Clear ALL cached data first
  clearData(); // This clears consumption, generation, net energy, etc.
  
  // Then load current tab data
  switch (activeTab) {
    case 'TAB_1':
      await loadTab1Data(dateFrom, dateTo);
      break;
    // ...
  }
};
```

**Checklist**:

- [ ] Add `clearData()` function to custom hook
- [ ] Call `clearData()` in `handleApplyFilter()` BEFORE loading new data
- [ ] Verify tab switching triggers data reload when data is null

---

### ❌ Issue 2: Component Size Exceeds Standards

**Problem**: Components become too large (>150 lines)

**Solution**: Break into smaller components

**Checklist**:

- [ ] Keep main component < 150 lines
- [ ] Extract sections into separate components
- [ ] Use composition pattern
- [ ] Follow single responsibility principle

---

### ❌ Issue 3: Magic Numbers and Strings

**Problem**: Hardcoded values scattered throughout code

**Solution**: Centralize in constants file

**Checklist**:

- [ ] All dimensions in constants (CARD_HEIGHT, CHART_HEIGHT)
- [ ] All labels in constants (FORECAST_PERIOD_LABELS)
- [ ] All colors in constants (FORECAST_COLORS)
- [ ] All algorithm configs in constants (ALGORITHM_TIERS)

---

### ❌ Issue 4: Duplicate Code

**Problem**: Copying and pasting similar components

**Solution**: Create reusable components with props

**Checklist**:

- [ ] Identify repeated patterns
- [ ] Extract into reusable component
- [ ] Pass configuration via props
- [ ] Use array.map() for repeated elements

---

### ❌ Issue 5: Timezone Issues

**Problem**: Date objects shift dates due to timezone conversion

**Solution**: Always use `T12:00:00` pattern

**Checklist**:

- [ ] Add `T12:00:00` when creating Date from string
- [ ] Use local time methods (getFullYear, getMonth, getDate)
- [ ] Never use UTC methods for local database times
- [ ] Document timezone assumptions in comments

---

### ❌ Issue 6: Helper Functions in Wrong Place

**Problem**: Pure functions defined inside components or classes

**Solution**: Extract to utils files

**Checklist**:

- [ ] Pure functions → `lib/utils/`
- [ ] Backend helpers → `utils/`
- [ ] No business logic in components
- [ ] No helper functions in service classes

---

## Code Quality Checklist

### Component Standards

- [ ] Component < 150 lines (ideal < 100)
- [ ] All hooks at top (before any conditional logic)
- [ ] Single responsibility
- [ ] Props documented (or use PropTypes)
- [ ] No magic numbers/strings
- [ ] Reusable where possible

### Hook Standards

- [ ] Named with `use` prefix
- [ ] Returns object with clear properties
- [ ] Includes loading, error states
- [ ] Includes clear/reset functions
- [ ] Uses useCallback for functions

### Service Standards

- [ ] Static methods for API calls
- [ ] Error handling with try-catch
- [ ] Returns consistent response format
- [ ] No business logic (only API communication)

### Backend Standards

- [ ] Input validation
- [ ] Error handling
- [ ] Consistent response format
- [ ] Helper functions in utils/
- [ ] No magic numbers/strings

---

## Testing Checklist

### Manual Testing

- [ ] Test with different date ranges
- [ ] Test with missing data
- [ ] Test tab switching after date change
- [ ] Test all 4 algorithm tiers (by varying data availability)
- [ ] Test forecast period selector (7, 14, 30 days)
- [ ] Test loading states
- [ ] Test error states
- [ ] Test responsive design

### Edge Cases

- [ ] No historical data available
- [ ] Insufficient data (< 7 days)
- [ ] Data with large gaps
- [ ] Future dates (should show error)
- [ ] Invalid date ranges

---

## Post-Implementation Checklist

### Documentation

- [ ] Update `4.CURRENT_STATE.md` with new forecast implementation
- [ ] Add to "Completed Features" section
- [ ] Update progress percentages
- [ ] Document any module-specific differences

### Code Review

- [ ] All components < 150 lines
- [ ] No duplicate code
- [ ] No magic numbers/strings
- [ ] All helpers in utils/
- [ ] Consistent naming conventions
- [ ] English comments only

### Cleanup

- [ ] Remove console.logs
- [ ] Remove commented code
- [ ] Remove unused imports
- [ ] Remove unused variables

---

## Quick Reference: File Structure

### Reusable Files (DO NOT RECREATE)

```
Frontend:
├── components/Forecast/
│   ├── ForecastTab.jsx                    ✅ REUSE (modify props)
│   ├── DataAvailabilityCard.jsx          ✅ REUSE
│   ├── ForecastChart.jsx                 ✅ REUSE
│   ├── DataCompletenessSection.jsx       ✅ REUSE
│   ├── AvailableDataChecks.jsx           ✅ REUSE
│   ├── MissingPeriodsSection.jsx         ✅ REUSE
│   ├── AlgorithmSelectionSection.jsx     ✅ REUSE
│   └── AlgorithmTiersGrid.jsx            ✅ REUSE
├── lib/
│   ├── constants/forecast.js             ✅ REUSE
│   └── utils/forecastUtils.js            ✅ REUSE

Backend:
├── services/forecastService.js           ✅ REUSE
├── utils/forecastHelpers.js              ✅ REUSE
```

### New Files to Create

```
Frontend:
├── services/
│   ├── WaterForecastService.js           🆕 CREATE
│   └── ThermalForecastService.js         🆕 CREATE
├── lib/hooks/
│   ├── useWaterForecastData.js           🆕 CREATE
│   └── useThermalForecastData.js         🆕 CREATE

Backend:
├── controllers/
│   ├── waterForecastController.js        🆕 CREATE (optional, can extend forecastController)
│   └── thermalForecastController.js      🆕 CREATE (optional, can extend forecastController)
├── routes/
│   └── forecastRoutes.js                 🔧 EXTEND (add water/thermal endpoints)
```

---

## Common Patterns to Follow

### Pattern 1: Custom Hook

```javascript
export const useModuleForecastData = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [forecastData, setForecastData] = useState(null);

    const loadForecast = useCallback(async (targetDate, forecastDays) => {
        try {
            setLoading(true);
            setError(null);
            const formattedDate = ModuleForecastService.formatDate(targetDate);
            const response = await ModuleForecastService.getForecast(formattedDate, forecastDays);
            if (response.success) {
                setForecastData(response);
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

    const clearForecast = useCallback(() => {
        setForecastData(null);
        setError(null);
    }, []);

    return { loading, error, forecastData, loadForecast, clearForecast };
};
```

### Pattern 2: Frontend Service

```javascript
class ModuleForecastService {
    static async getForecast(targetDate, forecastDays) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/forecast/module/${targetDate}/${forecastDays}`
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch forecast');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error;
        }
    }

    static formatDate(date) {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
```

### Pattern 3: Backend Controller

```javascript
const getModuleForecast = async (req, res) => {
    try {
        const { targetDate, forecastDays } = req.params;

        // Validate inputs
        if (!targetDate || !forecastDays) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        const days = parseInt(forecastDays);
        if (isNaN(days) || days < 1 || days > 30) {
            return res.status(400).json({
                success: false,
                error: 'forecastDays must be between 1 and 30'
            });
        }

        // Get historical data
        const target = new Date(targetDate + 'T12:00:00');
        const startDate = new Date(target);
        startDate.setDate(startDate.getDate() - 365);

        const historicalData = await ModuleService.getData(
            formatDate(startDate),
            targetDate
        );

        if (!historicalData || historicalData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No historical data available'
            });
        }

        // Generate forecast (REUSE ForecastService)
        const forecastResult = await ForecastService.generateForecast(
            targetDate,
            days,
            historicalData
        );

        res.json({
            success: true,
            targetDate,
            forecastDays: days,
            predictions: forecastResult.predictions,
            metadata: forecastResult.metadata
        });

    } catch (error) {
        console.error('Error generating forecast:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate forecast'
        });
    }
};
```

---

## Summary

**Key Principles**:

1. ✅ **Reuse existing forecast components** - Don't recreate
2. ✅ **Clear all cached data** when filter changes
3. ✅ **Keep components small** (< 150 lines)
4. ✅ **Centralize constants** - No magic numbers/strings
5. ✅ **Extract helpers** to utils files
6. ✅ **Use T12:00:00** for timezone safety
7. ✅ **Follow existing patterns** from Electricity implementation

**Before Starting Tomorrow**:

- [ ] Read this checklist completely
- [ ] Review Electricity Forecast implementation
- [ ] Understand Multi-Tab Data Management pattern
- [ ] Prepare data source information (tables, date ranges)

**During Implementation**:

- [ ] Follow checklist step by step
- [ ] Test frequently
- [ ] Keep components small
- [ ] Reuse existing code

**After Implementation**:

- [ ] Update documentation
- [ ] Code review against checklist
- [ ] Clean up code

---

**Good luck with Water and Thermal forecast implementation! 🚀**
