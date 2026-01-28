// Custom hook for chart zoom and day navigation functionality
import { useState, useCallback } from 'react';

/**
 * Custom hook to handle chart zoom and day navigation
 * @param {Object} chartRef - Reference to the chart instance
 * @param {Array} data - Chart data array with ts property
 * @returns {Object} - Zoom handlers and state
 */
export const useChartZoom = (chartRef, data) => {
    const [isInDayView, setIsInDayView] = useState(false);

    // Check if we're in day view after zoom
    const checkDayView = useCallback(() => {
        if (chartRef.current) {
            const xScale = chartRef.current.scales.x;
            const currentMin = xScale.min;
            const currentMax = xScale.max;
            const currentRange = currentMax - currentMin;
            const minRange = 26 * 60 * 60 * 1000; // 26 hours

            const inDayView = currentRange <= minRange + (60 * 60 * 1000);
            setIsInDayView(inDayView);
        }
    }, [chartRef]);

    // Zoom in handler
    const handleZoomIn = useCallback(() => {
        if (chartRef.current) {
            chartRef.current.zoom(1.2);
            setTimeout(checkDayView, 0);
        }
    }, [chartRef, checkDayView]);

    // Zoom out handler
    const handleZoomOut = useCallback(() => {
        if (chartRef.current) {
            chartRef.current.zoom(0.8);
            setTimeout(checkDayView, 0);
        }
    }, [chartRef, checkDayView]);

    // Reset zoom handler
    const handleResetZoom = useCallback(() => {
        if (chartRef.current) {
            chartRef.current.resetZoom();
            setIsInDayView(false);
        }
    }, [chartRef]);

    // Previous day navigation
    const handlePreviousDay = useCallback(() => {
        if (chartRef.current) {
            const xScale = chartRef.current.scales.x;
            const currentMin = xScale.min;
            const currentMax = xScale.max;
            const currentRange = currentMax - currentMin;

            // Get original data range
            const originalMin = data && data.length > 0 ? new Date(data[0].ts).getTime() : null;

            // 26 hours in milliseconds
            const minRange = 26 * 60 * 60 * 1000;

            // If we're at the 26-hour minimum range, shift by aligned days
            if (currentRange <= minRange + (60 * 60 * 1000)) {
                // Find current center date
                const centerTime = currentMin + (currentRange / 2);
                const centerDate = new Date(centerTime);

                // Move to previous day
                const targetDate = new Date(centerDate);
                targetDate.setDate(targetDate.getDate() - 1);
                targetDate.setHours(0, 0, 0, 0);

                // Calculate aligned range: previous day 23:00 to next day 01:00
                const alignedMin = new Date(targetDate);
                alignedMin.setHours(-1, 0, 0, 0);

                const alignedMax = new Date(targetDate);
                alignedMax.setDate(alignedMax.getDate() + 1);
                alignedMax.setHours(1, 0, 0, 0);

                // Don't go before the original data start
                if (!originalMin || alignedMin.getTime() >= originalMin) {
                    chartRef.current.zoomScale('x', { min: alignedMin.getTime(), max: alignedMax.getTime() }, 'none');
                }
            } else {
                // For larger ranges, just shift by 24 hours using pan
                const shiftAmount = 24 * 60 * 60 * 1000;

                if (!originalMin || (currentMin - shiftAmount) >= originalMin) {
                    chartRef.current.pan({ x: shiftAmount }, undefined, 'none');
                }
            }
        }
    }, [chartRef, data]);

    // Next day navigation
    const handleNextDay = useCallback(() => {
        if (chartRef.current) {
            const xScale = chartRef.current.scales.x;
            const currentMin = xScale.min;
            const currentMax = xScale.max;
            const currentRange = currentMax - currentMin;

            // Get original data range
            const originalMax = data && data.length > 0 ? new Date(data[data.length - 1].ts).getTime() : null;

            // 26 hours in milliseconds
            const minRange = 26 * 60 * 60 * 1000;

            // If we're at the 26-hour minimum range, shift by aligned days
            if (currentRange <= minRange + (60 * 60 * 1000)) {
                // Find current center date
                const centerTime = currentMin + (currentRange / 2);
                const centerDate = new Date(centerTime);

                // Move to next day
                const targetDate = new Date(centerDate);
                targetDate.setDate(targetDate.getDate() + 1);
                targetDate.setHours(0, 0, 0, 0);

                // Calculate aligned range: previous day 23:00 to next day 01:00
                const alignedMin = new Date(targetDate);
                alignedMin.setHours(-1, 0, 0, 0);

                const alignedMax = new Date(targetDate);
                alignedMax.setDate(alignedMax.getDate() + 1);
                alignedMax.setHours(1, 0, 0, 0);

                // Don't go beyond the original data end
                if (!originalMax || alignedMax.getTime() <= originalMax) {
                    chartRef.current.zoomScale('x', { min: alignedMin.getTime(), max: alignedMax.getTime() }, 'none');
                }
            } else {
                // For larger ranges, just shift by 24 hours using pan
                const shiftAmount = 24 * 60 * 60 * 1000;

                if (!originalMax || (currentMax + shiftAmount) <= originalMax) {
                    chartRef.current.pan({ x: -shiftAmount }, undefined, 'none');
                }
            }
        }
    }, [chartRef, data]);

    return {
        isInDayView,
        setIsInDayView,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        handlePreviousDay,
        handleNextDay
    };
};
