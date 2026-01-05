import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { CHART_COLORS, CARBON_INTENSITY } from '../../lib/constants/carbonFootprint';
import NoDataMessage from '../Common/NoDataMessage';
import { DATA_RANGES } from '../../lib/constants/carbonFootprint';

export default function AutomaticCalculationView({ data, carbonIntensity }) {
    if (!data || !data.data || data.data.length === 0) {
        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Automatic Calculation
                    </Typography>
                    <NoDataMessage
                        moduleName="Carbon Footprint"
                        availableRange={DATA_RANGES.electricity}
                        redirectPath="/electricity"
                    />
                </CardContent>
            </Card>
        );
    }

    // Calculate carbon footprint for each day using its specific carbon intensity
    const carbonFootprintData = data.data.map(item => {
        // Extract date from timestamp (YYYY-MM-DD)
        const dateStr = (item.timestamp || item.ts).split('T')[0];

        // Get carbon intensity for this specific date
        const dayIntensity = carbonIntensity && carbonIntensity[dateStr]
            ? carbonIntensity[dateStr].carbonIntensity / 1000 // Convert g/kWh to kg/kWh
            : CARBON_INTENSITY.DEFAULT;

        // Use absolute value (consumption is negative in database)
        const energyConsumption = Math.abs(item.value);

        // Calculate carbon footprint for this day
        const carbonFootprint = energyConsumption * dayIntensity;

        return {
            date: dateStr,
            energy: energyConsumption,
            carbon: carbonFootprint,
            intensity: dayIntensity,
            isEstimated: carbonIntensity && carbonIntensity[dateStr]
                ? carbonIntensity[dateStr].isEstimated
                : true
        };
    });

    // Calculate total metrics
    const totalEnergy = carbonFootprintData.reduce((sum, item) => sum + item.energy, 0);
    const totalCarbon = carbonFootprintData.reduce((sum, item) => sum + item.carbon, 0);
    const avgEnergy = totalEnergy / carbonFootprintData.length;
    const avgCarbon = totalCarbon / carbonFootprintData.length;

    // Prepare chart data
    const chartData = {
        labels: carbonFootprintData.map(item => {
            const date = new Date(item.date + 'T12:00:00');
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Energy Consumption (kWh)',
                data: carbonFootprintData.map(item => item.energy),
                borderColor: CHART_COLORS.energy.border,
                backgroundColor: CHART_COLORS.energy.background,
                tension: 0.4,
                // Store intensity data for tooltip
                intensityData: carbonFootprintData.map(item => item.intensity)
            },
            {
                label: 'Carbon Footprint (kg CO₂)',
                data: carbonFootprintData.map(item => item.carbon),
                borderColor: CHART_COLORS.carbon.border,
                backgroundColor: CHART_COLORS.carbon.background,
                tension: 0.4,
                // Store intensity data for tooltip
                intensityData: carbonFootprintData.map(item => item.intensity)
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 40,
                    boxHeight: 4,
                    padding: 15
                }
            },
            tooltip: {
                callbacks: {
                    title: function (context) {
                        // Show date as title
                        return context[0].label;
                    },
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += context.parsed.y.toFixed(2);
                        return label;
                    },
                    afterBody: function (context) {
                        // Add carbon intensity info after the main data
                        const dataIndex = context[0].dataIndex;
                        const intensity = context[0].dataset.intensityData[dataIndex];
                        return [
                            '',
                            `Carbon Intensity: ${intensity.toFixed(3)} kg CO₂/kWh`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                display: true
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Energy (kWh) / Carbon (kg CO₂)'
                },
                beginAtZero: true
            }
        }
    };

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Automatic Calculation
                </Typography>

                {/* Metrics */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Energy Consumption
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {totalEnergy.toFixed(2)} kWh
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Carbon Footprint
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#DA291C' }}>
                                {totalCarbon.toFixed(2)} kg CO₂
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Avg Consumption/Day
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {avgEnergy.toFixed(2)} kWh
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Avg Footprint/Day
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#DA291C' }}>
                                {avgCarbon.toFixed(2)} kg CO₂
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Chart */}
                <Box sx={{ height: 400 }}>
                    <Line data={chartData} options={chartOptions} />
                </Box>

                {/* Carbon Intensity Info */}
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Note: Each day's carbon footprint is calculated using that day's actual carbon intensity from the grid. Hover over the chart to see the carbon intensity for each specific day.
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}
