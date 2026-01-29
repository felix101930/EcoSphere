# Code Comment Standards for EcoSphere

**Purpose**: Ensure all code is self-documenting and maintainable after months of not looking at it

**Last Updated**: 2026-01-16

---

## 📋 Comment Quality Checklist

### ✅ Every Function/Method Must Have:

1. **JSDoc header** explaining:
   - What it does (purpose)
   - What parameters it takes (with types)
   - What it returns (with type)
   - Any side effects or important notes

2. **Inline comments** for:
   - Complex logic or algorithms
   - Non-obvious calculations
   - Why certain values are used
   - Edge cases being handled

### ✅ Every Loop Must Explain:

- **What** is being iterated
- **Why** we're iterating
- **What** we're building/calculating

### ✅ Every Conditional Must Explain:

- **Why** this condition exists
- **What** happens in each branch
- **Edge cases** being handled

### ✅ Every Try-Catch Must Explain:

- **What** error we're catching
- **Why** we're catching it
- **How** we're handling it

---

## 🎯 Good vs Bad Examples

### ❌ BAD - Minimal Comments

```javascript
function calculate(data) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i] > 0) {
            result.push(data[i] * 2);
        }
    }
    return result;
}
```

**Problems**:
- No JSDoc
- No explanation of what we're calculating
- No explanation of why we multiply by 2
- No explanation of why we filter > 0

---

### ✅ GOOD - Self-Documenting

```javascript
/**
 * Calculate doubled values for positive data points
 * Used to convert half-hour readings to hourly totals
 * 
 * @param {Array<number>} data - Array of half-hour energy readings (kWh)
 * @returns {Array<number>} Array of hourly totals (doubled values)
 * 
 * @example
 * calculate([10, -5, 20]) // Returns [20, 40]
 * // Negative values are filtered out (sensor errors)
 */
function calculate(data) {
    const result = [];
    
    // Loop through each half-hour reading
    for (let i = 0; i < data.length; i++) {
        // Filter out negative values (sensor errors or missing data)
        if (data[i] > 0) {
            // Double the value to convert half-hour to hourly total
            // Formula: hourly_total = half_hour_reading × 2
            result.push(data[i] * 2);
        }
    }
    
    return result;
}
```

**Why it's good**:
- JSDoc explains purpose, parameters, return value
- Example shows usage
- Comments explain WHY, not just WHAT
- Future you will understand this in 2 months

---

## 📚 Specific Patterns

### Pattern 1: Data Filtering

```javascript
// ❌ BAD
const filtered = data.filter(item => item.year >= 2023);

// ✅ GOOD
// Filter out 2022 data because it's incomplete (only partial year available)
// We need full years for accurate seasonal analysis
const filtered = data.filter(item => item.year >= 2023);
```

---

### Pattern 2: Date Calculations

```javascript
// ❌ BAD
let nextMonth = lastMonth + 1;
if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
}

// ✅ GOOD
// Calculate next month after last data point
// This is where forecast should start
let nextMonth = lastMonth + 1;
let nextYear = lastYear;

// Handle year boundary crossing (e.g., Dec + 1 = Jan of next year)
if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
}
```

---

### Pattern 3: Cache Logic

```javascript
// ❌ BAD
const cached = cache.get(cacheKey);
if (cached) return cached;

// ✅ GOOD
// Check cache first to avoid expensive file read
// Cache TTL is 24 hours because data is static (historical)
const cached = cache.get(cacheKey);
if (cached) return cached;
```

---

### Pattern 4: Error Handling

```javascript
// ❌ BAD
try {
    const data = await readFile(path);
    return data;
} catch (error) {
    throw new Error('Failed');
}

// ✅ GOOD
try {
    // Read JSON file containing monthly natural gas usage
    // File format: [{year, month, usage}, ...]
    const data = await readFile(path);
    return data;
} catch (error) {
    // Log original error for debugging
    console.error('Error reading JSON file:', error);
    
    // Throw user-friendly error message
    // This will be caught by controller and returned as HTTP 500
    throw new Error('Failed to read natural gas data');
}
```

---

### Pattern 5: Complex Calculations

```javascript
// ❌ BAD
const prediction = 0.4 * lastYear + 0.4 * twoYearsAgo + 0.2 * recent;

// ✅ GOOD
// Apply weighted formula for seasonal prediction
// 40% last year: captures annual seasonality (heating patterns)
// 40% two years ago: validates pattern consistency
// 20% recent trend: accounts for recent changes
const prediction =
    SEASONAL_WEIGHTS.LAST_YEAR * lastYearValue +        // 0.4
    SEASONAL_WEIGHTS.TWO_YEARS_AGO * twoYearsAgoValue + // 0.4
    SEASONAL_WEIGHTS.RECENT_AVERAGE * recentAvg;        // 0.2
```

---

## 🔍 Self-Review Questions

Before committing code, ask yourself:

1. **Can I understand this code in 2 months without context?**
2. **Do I explain WHY, not just WHAT?**
3. **Are all magic numbers explained?**
4. **Are all edge cases documented?**
5. **Would a new team member understand this?**

If any answer is "No", add more comments!

---

## 📊 Comment Coverage Goals

| File Type | Minimum Comment Coverage |
|-----------|-------------------------|
| **Services** | Every method + complex logic |
| **Controllers** | Every endpoint + validation logic |
| **Components** | Every complex function + useEffect |
| **Utils** | Every function + algorithm explanation |
| **Constants** | Every constant group + why these values |

---

## 🎓 Remember

**Good comments answer**:
- **WHY** this code exists
- **WHAT** problem it solves
- **HOW** it handles edge cases
- **WHEN** it should be used

**Bad comments repeat**:
- What the code obviously does
- Variable names in English
- Obvious syntax

---

## 📝 Template for New Functions

```javascript
/**
 * [One-line description of what this function does]
 * [Optional: More detailed explanation if needed]
 * 
 * @param {Type} paramName - Description of parameter
 * @param {Type} paramName2 - Description of parameter
 * @returns {Type} Description of return value
 * 
 * @throws {Error} When [condition that causes error]
 * 
 * @example
 * functionName(param1, param2) // Returns expected result
 */
function functionName(paramName, paramName2) {
    // Step 1: [Explain what this section does]
    const step1 = doSomething();
    
    // Step 2: [Explain what this section does]
    // [Explain WHY if not obvious]
    const step2 = doSomethingElse();
    
    // Handle edge case: [Explain the edge case]
    if (edgeCase) {
        // [Explain how we handle it]
        return fallbackValue;
    }
    
    return result;
}
```

---

**End of Document**
