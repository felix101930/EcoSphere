// Forecast Chart - Displays predicted values with data labels
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { FORECAST_COLORS } from '../../lib/constants/forecast';

const ForecastChart = ({ predictions, targetDate }) => {
    if (!predictions || predictions.length === 0) {
        return null;
    }

    // Prepare chart data
    const labels = predictions.map(p => p.date);

    const chartData = {
        labels,
        datasets: [
            // Predicted values
            {
                label: 'Predicted',
                data: predictions.map(p => p.value),
                borderColor: FORECAST_COLORS.PREDICTED,
                backgroundColor: FORECAST_COLORS.PREDICTED,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.1,
                datalabels: {
                    display: true,
                    align: 'top',
                    anchor: 'end',
                    formatter: (value) => Math.round(value * 10) / 10,
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    color: FORECAST_COLORS.PREDICTED
                }
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                enabled: false
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Date'
                },
                grid: {
                    display: false
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Electricity Consumption (Wh)'
                },
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            }
        }
    };

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    📊 Forecast Results
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Base Date: {targetDate} | Forecast Period: {predictions.length} days
                </Typography>

                <Box sx={{ height: 400, position: 'relative' }}>
                    <Line data={chartData} options={options} plugins={[ChartDataLabels]} />
                </Box>

                {/* Legend explanation */}
                <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 30,
                                height: 3,
                                bgcolor: FORECAST_COLORS.PREDICTED
                            }}
                        />
                        <Typography variant="caption">
                            Predicted values (based on historical data)
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ForecastChart;
