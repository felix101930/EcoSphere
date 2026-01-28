// Chart annotation utilities for peak/valley detection and display

/**
 * Detect daily peaks and valleys in time series data
 * Finds the highest and lowest value for each day
 * @param {Array} data - Array of {ts, value} objects
 * @returns {Object} - {peaks: [], valleys: []}
 */
export const detectDailyPeaksAndValleys = (data) => {
    if (!data || data.length === 0) return { peaks: [], valleys: [] };

    // Group data by date
    const dailyData = {};

    data.forEach((item, index) => {
        const date = item.ts.split(' ')[0]; // Extract date part (YYYY-MM-DD)
        const value = Math.abs(item.value);

        if (!dailyData[date]) {
            dailyData[date] = {
                peak: { value: -Infinity, timestamp: null, index: -1 },
                valley: { value: Infinity, timestamp: null, index: -1 }
            };
        }

        // Update peak
        if (value > dailyData[date].peak.value) {
            dailyData[date].peak = {
                value: value,
                timestamp: item.ts,
                index: index
            };
        }

        // Update valley
        if (value < dailyData[date].valley.value) {
            dailyData[date].valley = {
                value: value,
                timestamp: item.ts,
                index: index
            };
        }
    });

    // Convert to arrays
    const peaks = [];
    const valleys = [];

    Object.keys(dailyData).sort().forEach(date => {
        const dayData = dailyData[date];

        if (dayData.peak.timestamp) {
            peaks.push({
                date: date,
                value: dayData.peak.value,
                timestamp: dayData.peak.timestamp,
                index: dayData.peak.index
            });
        }

        if (dayData.valley.timestamp) {
            valleys.push({
                date: date,
                value: dayData.valley.value,
                timestamp: dayData.valley.timestamp,
                index: dayData.valley.index
            });
        }
    });

    return { peaks, valleys };
};

/**
 * Format time for annotation labels
 * @param {Date} timestamp - Date object
 * @returns {string} - Formatted time string (e.g., "3 p.m.")
 */
export const formatTimeLabel = (timestamp) => {
    const hour = timestamp.getHours();

    if (hour === 0) return '12 a.m.';
    if (hour < 12) return `${hour} a.m.`;
    if (hour === 12) return '12 p.m.';
    return `${hour - 12} p.m.`;
};

/**
 * Create peak annotation point marker
 * @param {Object} peak - Peak object with timestamp and value
 * @param {number} index - Index for unique key
 * @returns {Object} - Annotation object
 */
export const createPeakPointAnnotation = (peak, index) => {
    const timestamp = new Date(peak.timestamp);

    return {
        [`peakPoint${index}`]: {
            type: 'point',
            xValue: timestamp,
            yValue: peak.value,
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            radius: 5
        }
    };
};

/**
 * Create peak annotation label
 * @param {Object} peak - Peak object with timestamp and value
 * @param {number} index - Index for unique key
 * @param {string} unit - Unit for value display
 * @returns {Object} - Annotation object
 */
export const createPeakLabelAnnotation = (peak, index, unit) => {
    const timestamp = new Date(peak.timestamp);
    const timeLabel = formatTimeLabel(timestamp);

    return {
        [`peak${index}`]: {
            type: 'label',
            xValue: timestamp,
            yValue: peak.value,
            yAdjust: -25,
            backgroundColor: 'rgba(255, 99, 132, 0.9)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            borderRadius: 4,
            color: 'white',
            content: [`${timeLabel}`, `${peak.value.toFixed(0)} ${unit}`],
            font: {
                size: 10,
                weight: 'bold'
            },
            padding: 6
        }
    };
};

/**
 * Create valley annotation point marker
 * @param {Object} valley - Valley object with timestamp and value
 * @param {number} index - Index for unique key
 * @returns {Object} - Annotation object
 */
export const createValleyPointAnnotation = (valley, index) => {
    const timestamp = new Date(valley.timestamp);

    return {
        [`valleyPoint${index}`]: {
            type: 'point',
            xValue: timestamp,
            yValue: valley.value,
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 2,
            radius: 5
        }
    };
};

/**
 * Create valley annotation label
 * @param {Object} valley - Valley object with timestamp and value
 * @param {number} index - Index for unique key
 * @param {string} unit - Unit for value display
 * @returns {Object} - Annotation object
 */
export const createValleyLabelAnnotation = (valley, index, unit) => {
    const timestamp = new Date(valley.timestamp);
    const timeLabel = formatTimeLabel(timestamp);

    return {
        [`valley${index}`]: {
            type: 'label',
            xValue: timestamp,
            yValue: valley.value,
            yAdjust: 25,
            backgroundColor: 'rgba(54, 162, 235, 0.9)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 2,
            borderRadius: 4,
            color: 'white',
            content: [`${timeLabel}`, `${valley.value.toFixed(0)} ${unit}`],
            font: {
                size: 10,
                weight: 'bold'
            },
            padding: 6
        }
    };
};

/**
 * Create day view data point annotation (gray markers for non-peak/valley points)
 * @param {Object} point - Data point with ts and value
 * @param {number} index - Index for unique key
 * @param {boolean} preserveSign - Whether to preserve negative values
 * @param {string} unit - Unit for value display
 * @returns {Object} - Annotation objects (point and optionally label)
 */
export const createDayViewPointAnnotation = (point, index, preserveSign, unit) => {
    const timestamp = new Date(point.ts);
    const value = preserveSign ? point.value : Math.abs(point.value);
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();
    const timeLabel = formatTimeLabel(timestamp);

    const annotations = {};

    // Add gray point marker
    annotations[`dayPoint${index}`] = {
        type: 'point',
        xValue: timestamp,
        yValue: value,
        backgroundColor: 'rgba(128, 128, 128, 0.6)',
        borderColor: 'rgb(128, 128, 128)',
        borderWidth: 1,
        radius: 3
    };

    // Add gray label (only show on the hour to avoid clutter)
    if (minute === 0) {
        annotations[`dayLabel${index}`] = {
            type: 'label',
            xValue: timestamp,
            yValue: value,
            yAdjust: value > 0 ? -20 : 20,
            backgroundColor: 'rgba(128, 128, 128, 0.8)',
            borderColor: 'rgb(128, 128, 128)',
            borderWidth: 1,
            borderRadius: 3,
            color: 'white',
            content: [`${timeLabel}`, `${value.toFixed(0)} ${unit}`],
            font: {
                size: 9
            },
            padding: 4
        };
    }

    return annotations;
};
