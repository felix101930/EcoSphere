// Forecast Utility Functions

/**
 * Determine confidence level based on confidence score
 * @param {number} confidence - Confidence score (0-100)
 * @returns {Object} Confidence level with label and color
 */
export const getConfidenceLevel = (confidence) => {
    if (confidence >= 90) return { label: 'Excellent', color: 'success' };
    if (confidence >= 75) return { label: 'Good', color: 'info' };
    if (confidence >= 60) return { label: 'Acceptable', color: 'warning' };
    if (confidence >= 50) return { label: 'Low', color: 'warning' };
    return { label: 'Insufficient', color: 'error' };
};
