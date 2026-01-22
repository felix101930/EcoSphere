// Path: ecosphere-backend/controllers/analyticsController.js
const { sqlcmdQuery } = require('../db/sqlcmdQuery');

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
                query = `
                    SELECT TOP 2000 ts, value 
                    FROM ${sensor.table} 
                    WHERE ts >= DATEADD(hour, -24, (SELECT MAX(ts) FROM ${sensor.table}))
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