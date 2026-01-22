// Path: ecosphere-backend/controllers/analyticsController.js
const { sqlcmdQuery } = require('../db/sqlcmdQuery');

// Hardcoded date range limits for the project scope
const MIN_DATE = '2019-02-13';
const MAX_DATE = '2020-11-08';

/**
 * Get available date range across all sensor tables
 * Returns the overall min/max dates from all sensors in the system
 */
exports.getAnalyticsDateRange = async (req, res) => {
    try {
        // List of all sensor tables to check
        const sensorTables = [
            'dbo.SaitSolarLab_20000_TL92',  // Outside Temp
            'dbo.SaitSolarLab_20016_TL5',   // CO2 Level
            'dbo.SaitSolarLab_20004_TL2',   // Basement East
            'dbo.SaitSolarLab_20005_TL2',   // Basement West
            'dbo.SaitSolarLab_20007_TL2',   // Level 1 West
            'dbo.SaitSolarLab_20009_TL2',   // Level 1 South
            'dbo.SaitSolarLab_30000_TL3',   // Total Solar Gen
            'dbo.SaitSolarLab_30000_TL253', // Rooftop Solar
            'dbo.SaitSolarLab_30000_TL252', // Carport Solar
            'dbo.SaitSolarLab_30000_TL342', // Total Site Cons
            'dbo.SaitSolarLab_30000_TL209', // Lighting
            'dbo.SaitSolarLab_30000_TL208', // HVAC
            'dbo.SaitSolarLab_30000_TL340', // Hourly Gen History
            'dbo.SaitSolarLab_30000_TL341'  // Hourly Cons History
        ];

        // Query each table for its min/max dates
        const dateRangePromises = sensorTables.map(async (table) => {
            const query = `
                SELECT 
                    MIN(CAST(ts AS DATE)) as minDate,
                    MAX(CAST(ts AS DATE)) as maxDate
                FROM ${table}
            `;
            try {
                const result = await sqlcmdQuery(query);
                return result[0] || { minDate: null, maxDate: null };
            } catch (err) {
                console.error(`Failed to get date range for ${table}:`, err);
                return { minDate: null, maxDate: null };
            }
        });

        const allRanges = await Promise.all(dateRangePromises);

        // Filter out null values and find overall min/max
        const validRanges = allRanges.filter(r => r.minDate && r.maxDate);

        if (validRanges.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No data available in any sensor table'
            });
        }

        let overallMinDate = validRanges
            .map(r => new Date(r.minDate))
            .reduce((min, date) => date < min ? date : min);

        let overallMaxDate = validRanges
            .map(r => new Date(r.maxDate))
            .reduce((max, date) => date > max ? date : max);

        // Enforce hardcoded limits
        const limitMin = new Date(MIN_DATE);
        const limitMax = new Date(MAX_DATE);

        if (overallMinDate < limitMin) overallMinDate = limitMin;
        if (overallMaxDate > limitMax) overallMaxDate = limitMax;

        // Validation: If adjusted min > adjusted max, it means we have no data in the valid window
        if (overallMinDate > overallMaxDate) {
            return res.status(404).json({
                success: false,
                error: 'No data available within the valid project timeframe (2019-2020)'
            });
        }

        // Format dates as YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        res.json({
            success: true,
            dateRange: {
                minDate: formatDate(overallMinDate),
                maxDate: formatDate(overallMaxDate)
            }
        });

    } catch (error) {
        console.error('Analytics Date Range Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve analytics date range'
        });
    }
};

/**
 * Handles manual sensor data retrieval.
 * Uses "Anchor Strategy" to find data relative to the table's latest timestamp.
 */
exports.getCustomAnalytics = async (req, res) => {
    try {
        const { sensors, startDate, endDate } = req.body;

        if (!sensors || !Array.isArray(sensors) || sensors.length === 0) {
            return res.status(400).json({ error: "No sensors selected" });
        }

        // Limit to 4 sensors to prevent timeout/overload
        const selectedSensors = sensors.slice(0, 4);

        // Execute queries in parallel
        const results = await Promise.all(selectedSensors.map(async (sensor) => {
            let query = "";

            if (startDate && endDate) {
                // Scenario A: Specific Date Range
                // Using TOP 2000 as Safety Cap
                query = `
                    SELECT TOP 2000 ts, value 
                    FROM ${sensor.table} 
                    WHERE ts >= '${startDate}' AND ts <= '${endDate}' 
                    ORDER BY ts ASC
                `;
            } else {
                // Scenario B: Anchor Strategy (Last 24h relative to data)
                // MODIFIED: Find MAX(ts) strictly within our allowed MAX_DATE window
                query = `
                    SELECT TOP 2000 ts, value 
                    FROM ${sensor.table} 
                    WHERE ts >= DATEADD(hour, -24, (
                        SELECT MAX(ts) FROM ${sensor.table} WHERE ts <= '${MAX_DATE} 23:59:59'
                    ))
                    AND ts <= '${MAX_DATE} 23:59:59'
                    ORDER BY ts ASC
                `;
            }

            try {
                const data = await sqlcmdQuery(query);
                return {
                    name: sensor.label,
                    unit: sensor.unit,
                    data: data
                };
            } catch (err) {
                console.error(`Query failed for ${sensor.table}:`, err);
                return { name: sensor.label, data: [], error: true };
            }
        }));

        res.json({ success: true, results });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: "Failed to retrieve analytics data" });
    }
};