/**
 * Natural Gas Overview Component
 * 
 * Displays natural gas consumption data in the Overview dashboard
 * Shows monthly usage statistics and trend chart for all available data (2023-2025)
 * 
 * Features:
 * - Total, average, peak, and minimum usage statistics
 * - Monthly usage trend bar chart
 * - Handles no data state with friendly message
 * - Uses orange fire theme color
 */

import { Box, Grid, Card, CardContent, Typography, Paper } from '@mui/material';
import { LocalFireDepartment } from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import { DATA_RANGES, SECTION_COLORS } from '../../lib/constants/overview';

/**
 * Section Card Component
 * 
 * Reusable card wrapper for overview sections
 * Provides consistent styling and icon display
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 * @param {Component} props.icon - MUI icon component
 * @param {string} props.color - Icon and theme color
 * @param {ReactNode} props.children - Card content
 */
function SectionCard({ title, icon, color, children }) {
    const IconComponent = icon;
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
                {/* Section header with icon and title */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <IconComponent sx={{ color: color, fontSize: 22, mr: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {title}
                    </Typography>
                </Box>
                {/* Content area with consistent typography sizing */}
                <Box sx={{
                    '& .MuiTypography-h6': { fontSize: '0.9rem' },
                    '& .MuiTypography-h4': { fontSize: '1.3rem' },
                    '& .MuiTypography-body2': { fontSize: '0.75rem' },
                    '& .MuiTypography-caption': { fontSize: '0.7rem' },
                    '& .MuiPaper-root': { p: 1.5 }
                }}>
                    {children}
                </Box>
            </CardContent>
        </Card>
    );
}

/**
 * Natural Gas Overview Component
 * 
 * Main component for displaying natural gas data in overview dashboard
 * Always shows all available monthly data (2023-01 to 2025-11)
 * Independent of overview page time range selector
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Natural gas data object
 * @param {Array} props.data.data - Array of monthly usage data
 * @param {Object} props.data.metrics - Calculated metrics (total, average, peak, min)
 * @returns {JSX.Element} Natural gas overview section
 */
export default function NaturalGasOverview({ data }) {
    // Handle no data state
    // Show friendly message with available date range
    if (!data || !data.data || data.data.length === 0) {
        return (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <SectionCard
                        title="Natural Gas Consumption"
                        icon={LocalFireDepartment}
                        color={SECTION_COLORS.naturalGas}
                    >
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No natural gas data available
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Available: {DATA_RANGES.naturalGas.start} to {DATA_RANGES.naturalGas.end}
                            </Typography>
                        </Box>
                    </SectionCard>
                </Grid>
            </Grid>
        );
    }

    // Calculate usage statistics from data
    // Data format: [{ month, monthLabel, value }, ...]
    const values = data.data.map(item => item.value);
    const totalUsage = values.reduce((sum, val) => sum + val, 0);
    const avgUsage = totalUsage / values.length;
    const maxUsage = Math.max(...values);
    const minUsage = Math.min(...values);

    // Prepare chart data for Chart.js Bar chart
    // Uses month labels (e.g., "Jan 2023") for x-axis
    // Uses usage values in GJ for y-axis
    const chartData = {
        labels: data.data.map(item => item.monthLabel),
        datasets: [{
            label: 'Natural Gas Usage (GJ)',
            data: values,
            backgroundColor: SECTION_COLORS.naturalGas,
            borderColor: SECTION_COLORS.naturalGas,
            borderWidth: 1,
            borderRadius: 4
        }]
    };

    // Chart configuration options
    // Optimized for compact display in overview dashboard
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }, // Hide legend to save space
            tooltip: {
                callbacks: {
                    // Format tooltip to show value with unit
                    label: function (context) {
                        return `${context.parsed.y.toFixed(1)} GJ`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Usage (GJ)',
                    font: { size: 11 }
                },
                ticks: {
                    font: { size: 10 },
                    // Add unit to y-axis labels
                    callback: function (value) {
                        return value + ' GJ';
                    }
                }
            },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: { size: 10 }
                }
            }
        }
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <SectionCard
                    title="Natural Gas Consumption"
                    icon={LocalFireDepartment}
                    color={SECTION_COLORS.naturalGas}
                >
                    <Box sx={{
                        '& canvas': { maxHeight: '220px !important' },
                        '& .MuiPaper-root': { mb: 0 },
                        '& .MuiBox-root:has(canvas)': { height: '220px !important' }
                    }}>
                        {/* Usage Statistics Cards */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            {/* Total Usage */}
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                    Total Usage
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                    {totalUsage.toFixed(1)} GJ
                                </Typography>
                            </Box>
                            {/* Average Usage */}
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                    Average
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                    {avgUsage.toFixed(1)} GJ
                                </Typography>
                            </Box>
                            {/* Peak Usage */}
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                    Peak
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                    {maxUsage.toFixed(1)} GJ
                                </Typography>
                            </Box>
                            {/* Minimum Usage */}
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                    Minimum
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                    {minUsage.toFixed(1)} GJ
                                </Typography>
                            </Box>
                        </Box>

                        {/* Monthly Usage Trend Chart */}
                        <Paper sx={{ p: 1.5, mb: 0 }}>
                            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 500 }}>
                                Monthly Usage Trend
                            </Typography>
                            <Box sx={{ height: 220 }}>
                                <Bar data={chartData} options={chartOptions} />
                            </Box>
                        </Paper>
                    </Box>
                </SectionCard>
            </Grid>
        </Grid>
    );
}
