import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import { Water, Opacity } from '@mui/icons-material';
import MetricsCards from '../Electricity/MetricsCards';
import OverallTrendChart from '../Electricity/OverallTrendChart';
import NoDataMessage from '../Common/NoDataMessage';
import { DATA_RANGES, SECTION_COLORS } from '../../lib/constants/overview';

// eslint-disable-next-line no-unused-vars
function SectionCard({ title, icon: Icon, color, children }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Icon sx={{ color: color, fontSize: 22, mr: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {title}
                    </Typography>
                </Box>
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

export default function WaterOverview({ data }) {
    return (
        <Grid container spacing={2}>
            {/* Rainwater Card */}
            <Grid item xs={12} md={6}>
                <SectionCard
                    title="Rainwater Harvesting"
                    icon={Water}
                    color={SECTION_COLORS.water.rainwater}
                >
                    {!data.rainwater || !data.rainwater.data || data.rainwater.data.length === 0 ? (
                        <NoDataMessage
                            moduleName="Water"
                            availableRange={DATA_RANGES.rainwater}
                            redirectPath="/water"
                        />
                    ) : (
                        <Box sx={{
                            '& canvas': { maxHeight: '180px !important' },
                            '& .MuiPaper-root': { mb: 0 },
                            '& .MuiBox-root:has(canvas)': { height: '180px !important' }
                        }}>
                            <MetricsCards metrics={data.rainwater.metrics} unit="%" />
                            <OverallTrendChart
                                data={data.rainwater.data}
                                title="Rainwater Level Trend"
                                dataLabel="Water Level (%)"
                                color={SECTION_COLORS.water.rainwater}
                                unit="%"
                                yAxisLabel="Water Level (%)"
                            />
                        </Box>
                    )}
                </SectionCard>
            </Grid>

            {/* Hot Water Card */}
            <Grid item xs={12} md={6}>
                <SectionCard
                    title="Hot Water Consumption"
                    icon={Opacity}
                    color={SECTION_COLORS.water.hotWater}
                >
                    {!data.hotWater || !data.hotWater.data || data.hotWater.data.length === 0 ? (
                        <NoDataMessage
                            moduleName="Water"
                            availableRange={DATA_RANGES.hotWater}
                            redirectPath="/water"
                        />
                    ) : (
                        <Box sx={{
                            '& canvas': { maxHeight: '180px !important' },
                            '& .MuiPaper-root': { mb: 0 },
                            '& .MuiBox-root:has(canvas)': { height: '180px !important' }
                        }}>
                            <MetricsCards metrics={data.hotWater.metrics} unit="L/h" />
                            <OverallTrendChart
                                data={data.hotWater.data}
                                title="Hot Water Consumption Trend"
                                dataLabel="Consumption (L/h)"
                                color={SECTION_COLORS.water.hotWater}
                                unit="L/h"
                                yAxisLabel="Consumption (L/h)"
                            />
                        </Box>
                    )}
                </SectionCard>
            </Grid>
        </Grid>
    );
}
