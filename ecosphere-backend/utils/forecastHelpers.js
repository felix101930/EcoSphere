// Forecast Helper Functions

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Add days to date
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Calculate average of data points
 */
function calculateAverage(data) {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + Math.abs(d.value), 0);
    return sum / data.length;
}

/**
 * Calculate linear trend using least squares method
 */
function calculateLinearTrend(data) {
    if (data.length < 2) return 0;

    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    data.forEach((d, i) => {
        const x = i;
        const y = Math.abs(d.value);
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
}

/**
 * Aggregate hourly predictions to daily
 */
function aggregateHourlyToDaily(hourlyData, forecastDays) {
    const dailyPredictions = [];

    for (let day = 0; day < forecastDays; day++) {
        const dayData = hourlyData.slice(day * 24, (day + 1) * 24);
        const avgValue = dayData.reduce((sum, point) => sum + point[1], 0) / dayData.length;

        const date = new Date(dayData[0][0]);
        dailyPredictions.push({
            date: formatDate(date),
            value: avgValue
        });
    }

    return dailyPredictions;
}

module.exports = {
    formatDate,
    addDays,
    calculateAverage,
    calculateLinearTrend,
    aggregateHourlyToDaily
};
