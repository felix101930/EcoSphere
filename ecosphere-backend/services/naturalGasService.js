// Natural Gas Service - Business logic for natural gas data
const fs = require('fs').promises;
const { NATURAL_GAS_CONFIG } = require('../utils/naturalGasConstants');
const cache = require('../utils/cache');

class NaturalGasService {
    /**
     * Read and parse JSON file with monthly usage data
     * @returns {Promise<Array>} Monthly usage data
     */
    static async readMonthlyUsageData() {
        // Check cache first
        const cacheKey = 'naturalGas:monthlyUsage:v1';
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        try {
            const jsonPath = NATURAL_GAS_CONFIG.CSV_FILE_PATH.replace('naturalGasReadings.csv', 'naturalGasMonthlyUsage.json');
            const fileContent = await fs.readFile(jsonPath, 'utf-8');
            const data = JSON.parse(fileContent);

            // Filter out 2022 data (we only want 2023 onwards)
            const filteredData = data.filter(item => item.year >= 2023);

            // Cache the data (static data, long TTL)
            cache.set(cacheKey, filteredData, NATURAL_GAS_CONFIG.CACHE_TTL);

            return filteredData;
        } catch (error) {
            console.error('Error reading JSON file:', error);
            throw new Error('Failed to read natural gas data');
        }
    }

    /**
     * Get consumption data for date range (monthly aggregation)
     * @param {string} dateFrom - Start date (YYYY-MM-DD)
     * @param {string} dateTo - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} Consumption data with metrics
     */
    static async getConsumptionData(dateFrom, dateTo) {
        const allData = await this.readMonthlyUsageData();

        // Parse date range
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        const fromYear = fromDate.getFullYear();
        const fromMonth = fromDate.getMonth() + 1; // 1-12
        const toYear = toDate.getFullYear();
        const toMonth = toDate.getMonth() + 1; // 1-12

        // Filter data by year and month
        const filteredData = allData.filter(item => {
            // Create comparable values: year * 12 + month
            const itemYearMonth = item.year * 12 + item.month;
            const fromYearMonth = fromYear * 12 + fromMonth;
            const toYearMonth = toYear * 12 + toMonth;

            return itemYearMonth >= fromYearMonth && itemYearMonth <= toYearMonth;
        });

        if (filteredData.length === 0) {
            return {
                data: [],
                metrics: {
                    total: 0,
                    average: 0,
                    peak: 0,
                    min: 0
                },
                count: 0,
                dateFrom,
                dateTo,
                dataSource: 'CSV File (Monthly Readings)'
            };
        }

        // Calculate metrics (only for non-zero usage values)
        const usageValues = filteredData.map(item => item.usage).filter(val => val > 0);
        const total = filteredData.reduce((sum, item) => sum + item.usage, 0);
        const average = usageValues.length > 0 ? total / usageValues.length : 0;
        const peak = usageValues.length > 0 ? Math.max(...usageValues) : 0;
        const min = usageValues.length > 0 ? Math.min(...usageValues) : 0;

        // Format data for chart
        const monthlyData = filteredData.map(item => {
            return {
                month: item.monthKey,
                monthLabel: item.monthLabel,
                value: item.usage
            };
        });

        return {
            data: monthlyData,
            metrics: {
                total: parseFloat(total.toFixed(2)),
                average: parseFloat(average.toFixed(2)),
                peak: parseFloat(peak.toFixed(2)),
                min: parseFloat(min.toFixed(2))
            },
            count: filteredData.length,
            dateFrom,
            dateTo,
            dataSource: 'CSV File (Monthly Readings)',
            unit: NATURAL_GAS_CONFIG.UNIT
        };
    }

    /**
     * Get available date range
     * @returns {Promise<Object>} Min and max dates
     */
    static async getDateRange() {
        // Fixed date range: 2023-01 to 2025-12
        return {
            minDate: '2023-01-01',
            maxDate: '2025-12-31'
        };
    }

    /**
     * Get all data for forecast training
     * @returns {Promise<Array>} All monthly data
     */
    static async getAllData() {
        const allData = await this.readMonthlyUsageData();

        // Format data for forecast service
        return allData.map(item => {
            return {
                month: item.monthKey,
                monthLabel: item.monthLabel,
                value: item.usage
            };
        });
    }
}

module.exports = NaturalGasService;
