// Natural Gas Service - Business logic for natural gas data
const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');
const { NATURAL_GAS_CONFIG } = require('../utils/naturalGasConstants');
const cache = require('../utils/cache');

class NaturalGasService {
    /**
     * Read and parse CSV file
     * @returns {Promise<Array>} Parsed natural gas readings
     */
    static async readCSVData() {
        const cacheKey = 'naturalGas:csvData';
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        try {
            const fileContent = await fs.readFile(NATURAL_GAS_CONFIG.CSV_FILE_PATH, 'utf-8');

            // Parse CSV
            const records = parse(fileContent, {
                columns: false,
                skip_empty_lines: true,
                trim: true
            });

            // Skip header row and process data
            const data = records.slice(1)
                .filter(row => row[0] && row[1]) // Filter out rows with missing date or reading
                .map(row => ({
                    date: this.parseDate(row[0]),
                    cumulativeReading: parseFloat(row[1]) || 0,
                    usage: parseFloat(row[2]) || 0
                }))
                .filter(item => item.date); // Filter out invalid dates

            // Cache the data
            cache.set(cacheKey, data, NATURAL_GAS_CONFIG.CACHE_TTL);

            return data;
        } catch (error) {
            console.error('Error reading CSV file:', error);
            throw new Error('Failed to read natural gas data');
        }
    }

    /**
     * Parse date string to ISO format
     * @param {string} dateStr - Date string from CSV
     * @returns {string|null} ISO date string (YYYY-MM-DD)
     */
    static parseDate(dateStr) {
        try {
            // Remove quotes if present
            const cleanStr = dateStr.replace(/"/g, '').trim();

            // Parse date (e.g., "Wednesday, January 4, 2023")
            const date = new Date(cleanStr);

            if (isNaN(date.getTime())) {
                return null;
            }

            // Return ISO date string
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error parsing date:', dateStr, error);
            return null;
        }
    }

    /**
     * Get consumption data for date range (monthly aggregation)
     * @param {string} dateFrom - Start date (YYYY-MM-DD)
     * @param {string} dateTo - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} Consumption data with metrics
     */
    static async getConsumptionData(dateFrom, dateTo) {
        const allData = await this.readCSVData();

        // Filter data by date range
        const filteredData = allData.filter(item => {
            return item.date >= dateFrom && item.date <= dateTo;
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

        // Format data for chart - group by month
        const monthlyData = filteredData.map(item => {
            const date = new Date(item.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            return {
                timestamp: item.date,
                month: `${year}-${String(month).padStart(2, '0')}`,
                monthLabel: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
                value: item.usage,
                cumulativeReading: item.cumulativeReading
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
        const allData = await this.readCSVData();

        if (allData.length === 0) {
            return {
                minDate: null,
                maxDate: null
            };
        }

        const dates = allData.map(item => item.date).sort();

        return {
            minDate: dates[0],
            maxDate: dates[dates.length - 1]
        };
    }

    /**
     * Get all data for forecast training
     * @returns {Promise<Array>} All monthly data
     */
    static async getAllData() {
        const allData = await this.readCSVData();

        // Format data for forecast service
        return allData.map(item => {
            const date = new Date(item.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            return {
                month: `${year}-${String(month).padStart(2, '0')}`,
                monthLabel: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
                value: item.usage,
                timestamp: item.date
            };
        });
    }
}

module.exports = NaturalGasService;
