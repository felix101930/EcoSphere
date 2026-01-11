// Electricity Calculations Utility
// Handle all electricity-related calculations with proper sign handling

/**
 * Calculate net energy from consumption and generation data
 * Net Energy = Generation + Consumption (since consumption is negative)
 * 
 * @param {Array} consumptionData - Array of {ts, value} (negative values)
 * @param {Array} generationData - Array of {ts, value} (positive values)
 * @returns {Array} Array of {ts, value} where value is net energy
 */
export const calculateNetEnergyFromData = (consumptionData, generationData) => {
    if (!consumptionData || !generationData || consumptionData.length === 0 || generationData.length === 0) {
        return [];
    }

    // Create a map of generation data by timestamp
    const generationMap = new Map(generationData.map(d => [d.ts, d.value]));

    const netEnergyData = [];

    // For each consumption data point, find matching generation by timestamp
    consumptionData.forEach((consumptionItem) => {
        const timestamp = consumptionItem.ts;
        const generationValue = generationMap.get(timestamp);

        if (generationValue !== undefined) {
            // Net Energy = Generation + Consumption (consumption is negative)
            // Negative result = consuming more (grid dependent)
            // Positive result = generating more (grid exporter)
            const netEnergy = generationValue + consumptionItem.value;

            netEnergyData.push({
                ts: timestamp,
                value: netEnergy
            });
        }
    });

    return netEnergyData;
};

/**
 * Calculate net energy metrics
 * Net Energy = Generation - Consumption
 * Negative = consuming more (grid dependent)
 * Positive = generating more (grid exporter)
 * 
 * @param {Array} netEnergyData - Array of {ts, value} objects
 * @returns {Object} Metrics object with total, average, peak, min
 */
export const calculateNetEnergyMetrics = (netEnergyData) => {
    if (!netEnergyData || netEnergyData.length === 0) {
        return {
            total: 0,
            average: 0,
            peak: 0,
            min: 0
        };
    }

    const values = netEnergyData.map(d => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);

    return {
        total: total,                           // Keep sign: negative = deficit, positive = surplus
        average: total / values.length,         // Keep sign
        peak: Math.max(...values),              // Most positive (max surplus)
        min: Math.min(...values)                // Most negative (max deficit)
    };
};

/**
 * Calculate self-sufficiency rate for each time point
 * Self-Sufficiency Rate = (Generation / Consumption) × 100%
 * 
 * Important: 
 * - Consumption values are NEGATIVE in database
 * - Generation values are POSITIVE in database
 * - Use absolute values for calculation
 * - Match data by TIMESTAMP, not by index
 * 
 * @param {Array} consumptionData - Array of {ts, value} (negative values)
 * @param {Array} generationData - Array of {ts, value} (positive values)
 * @returns {Array} Array of {ts, value} where value is percentage
 */
export const calculateSelfSufficiencyRate = (consumptionData, generationData) => {
    if (!consumptionData || !generationData || consumptionData.length === 0 || generationData.length === 0) {
        return [];
    }

    // Create a map of generation data by timestamp for fast lookup
    const generationMap = new Map();
    generationData.forEach(item => {
        generationMap.set(item.ts, item.value);
    });

    const selfSufficiencyRateData = [];

    // For each consumption data point, find matching generation by timestamp
    consumptionData.forEach((consumptionItem) => {
        const timestamp = consumptionItem.ts;
        const generationValue = generationMap.get(timestamp);

        if (generationValue !== undefined) {
            const consumptionValue = consumptionItem.value;

            // Consumption is NEGATIVE in database, generation is POSITIVE
            // Use absolute values for both
            const consumption = Math.abs(consumptionValue);
            const generation = Math.abs(generationValue);

            // Self-sufficiency rate = (generation / consumption) * 100
            const rate = consumption > 0 ? (generation / consumption) * 100 : 0;

            selfSufficiencyRateData.push({
                ts: timestamp,
                value: rate
            });
        }
    });

    return selfSufficiencyRateData;
};

/**
 * Calculate average self-sufficiency rate
 * 
 * @param {Array} selfSufficiencyRateData - Array of {ts, value} where value is percentage
 * @returns {Number} Average percentage
 */
export const calculateAverageSelfSufficiencyRate = (selfSufficiencyRateData) => {
    if (!selfSufficiencyRateData || selfSufficiencyRateData.length === 0) {
        return 0;
    }

    const total = selfSufficiencyRateData.reduce((sum, d) => sum + d.value, 0);
    return total / selfSufficiencyRateData.length;
};
