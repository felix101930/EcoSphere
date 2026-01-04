import { Box, Grid, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import NoDataMessage from '../Common/NoDataMessage';
import { DATA_RANGES, SECTION_COLORS, FLOOR_LABELS } from '../../lib/constants/overview';

function FloorSection({ title, data, color }) {
    if (!data || !data.data || data.data.length === 0) {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {title}
                </Typography>
                <NoDataMessage
                    moduleName="Thermal"
                    availableRange={DATA_RANGES.thermal}
                    redirectPath="/thermal"
                />
            </Box>
        );
    }

    const chartData = {
        labels: data.data.map(item => item.timestamp || item.ts),
        datasets: [{
            label: title,
            data: data.data.map(item => item.value),
            borderColor: color,
            backgroundColor: `${color}20`,
            tension: 0.4,
            fill: true
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 15,
                max: 30,
                title: {
                    display: true,
                    text: '°C'
                }
            },
            x: {
                display: true,
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {title}
            </Typography>
            <Box sx={{ height: 250 }}>
                <Line data={chartData} options={chartOptions} />
            </Box>
        </Box>
    );
}

export default function ThermalOverview({ data }) {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <FloorSection
                    title={FLOOR_LABELS.basement}
                    data={data.basement}
                    color={SECTION_COLORS.thermal.basement}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <FloorSection
                    title={FLOOR_LABELS.first}
                    data={data.first}
                    color={SECTION_COLORS.thermal.first}
                />
            </Grid>
            <Grid item xs={12}>
                <FloorSection
                    title={FLOOR_LABELS.second}
                    data={data.second}
                    color={SECTION_COLORS.thermal.second}
                />
            </Grid>
        </Grid>
    );
}
