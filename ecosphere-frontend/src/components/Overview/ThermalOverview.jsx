import { Box, Grid, Card, CardContent, Typography, Paper } from '@mui/material';
import { Thermostat } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import NoDataMessage from '../Common/NoDataMessage';
import { DATA_RANGES, SECTION_COLORS, FLOOR_LABELS } from '../../lib/constants/overview';

function FloorCard({ title, data, color }) {
    if (!data || !data.data || data.data.length === 0) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Thermostat sx={{ color: color, fontSize: 22, mr: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {title}
                        </Typography>
                    </Box>
                    <NoDataMessage
                        moduleName="Thermal"
                        availableRange={DATA_RANGES.thermal}
                        redirectPath="/thermal"
                    />
                </CardContent>
            </Card>
        );
    }

    // Calculate temperature stats
    const temps = data.data.map(item => item.value);
    const avgTemp = temps.reduce((sum, val) => sum + val, 0) / temps.length;
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);

    const chartData = {
        labels: data.data.map(item => item.timestamp || item.ts),
        datasets: [{
            label: title,
            data: temps,
            borderColor: color,
            backgroundColor: `${color}20`,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (context) {
                        return `${context.parsed.y.toFixed(1)}°C`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 15,
                max: 30,
                title: {
                    display: true,
                    text: '°C',
                    font: { size: 11 }
                },
                ticks: {
                    font: { size: 10 },
                    callback: function (value) {
                        return value + '°C';
                    }
                }
            },
            x: {
                display: true,
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: { size: 10 }
                }
            }
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Thermostat sx={{ color: color, fontSize: 22, mr: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {title}
                    </Typography>
                </Box>

                {/* Temperature Stats */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                            Average
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                            {avgTemp.toFixed(1)}°C
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                            Max
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                            {maxTemp.toFixed(1)}°C
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                            Min
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                            {minTemp.toFixed(1)}°C
                        </Typography>
                    </Box>
                </Box>

                {/* Chart */}
                <Paper sx={{ p: 1.5, mb: 0 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 500 }}>
                        Temperature Trend
                    </Typography>
                    <Box sx={{ height: 180 }}>
                        <Line data={chartData} options={chartOptions} />
                    </Box>
                </Paper>
            </CardContent>
        </Card>
    );
}

export default function ThermalOverview({ data }) {
    return (
        <Grid container spacing={2}>
            {/* Basement */}
            <Grid item xs={12} md={6}>
                <FloorCard
                    title={FLOOR_LABELS.basement}
                    data={data.basement}
                    color={SECTION_COLORS.thermal.basement}
                />
            </Grid>

            {/* Level 1 */}
            <Grid item xs={12} md={6}>
                <FloorCard
                    title={FLOOR_LABELS.first}
                    data={data.first}
                    color={SECTION_COLORS.thermal.first}
                />
            </Grid>

            {/* Level 2 - Full Width */}
            <Grid item xs={12}>
                <FloorCard
                    title={FLOOR_LABELS.second}
                    data={data.second}
                    color={SECTION_COLORS.thermal.second}
                />
            </Grid>
        </Grid>
    );
}
