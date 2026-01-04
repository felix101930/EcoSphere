import { Box, Grid, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import CompactMetrics from '../Common/CompactMetrics';
import NoDataMessage from '../Common/NoDataMessage';
import { DATA_RANGES, SECTION_COLORS } from '../../lib/constants/overview';

function SubSection({ title, data, color, unit }) {
    if (!data || !data.data || data.data.length === 0) {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {title}
                </Typography>
                <NoDataMessage
                    moduleName="Electricity"
                    availableRange={DATA_RANGES.electricity}
                    redirectPath="/electricity"
                />
            </Box>
        );
    }

    const metrics = [
        { label: 'Total', value: data.metrics?.total },
        { label: 'Average', value: data.metrics?.average },
        { label: 'Peak', value: data.metrics?.peak },
        { label: 'Min', value: data.metrics?.min }
    ];

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
                beginAtZero: true,
                title: {
                    display: true,
                    text: unit
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
            <CompactMetrics metrics={metrics} unit={unit} />
            <Box sx={{ height: 200 }}>
                <Line data={chartData} options={chartOptions} />
            </Box>
        </Box>
    );
}

export default function ElectricityOverview({ data }) {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <SubSection
                    title="Consumption"
                    data={data.consumption}
                    color={SECTION_COLORS.electricity.consumption}
                    unit="kWh"
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <SubSection
                    title="Generation"
                    data={data.generation}
                    color={SECTION_COLORS.electricity.generation}
                    unit="kWh"
                />
            </Grid>
            <Grid item xs={12}>
                <SubSection
                    title="Net Energy"
                    data={data.netEnergy}
                    color={SECTION_COLORS.electricity.netEnergy}
                    unit="kWh"
                />
            </Grid>
        </Grid>
    );
}
