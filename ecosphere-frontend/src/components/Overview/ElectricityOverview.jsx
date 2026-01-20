import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import { Bolt, TrendingUp, TrendingDown } from '@mui/icons-material';
import MetricsCards from '../Electricity/MetricsCards';
import NetEnergyMetricsCards from '../Electricity/NetEnergyMetricsCards';
import OverallTrendChart from '../Electricity/OverallTrendChart';
import NetEnergyWithSelfSufficiencyChart from '../Electricity/NetEnergyWithSelfSufficiencyChart';
import NoDataMessage from '../Common/NoDataMessage';
import { DATA_RANGES, SECTION_COLORS } from '../../lib/constants/overview';

function SectionCard({ title, icon, color, children }) {
    const IconComponent = icon;
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <IconComponent sx={{ color: color, fontSize: 22, mr: 1 }} />
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

export default function ElectricityOverview({ data }) {
    return (
        <Grid container spacing={2}>
            {/* Consumption Card */}
            <Grid item xs={12} md={6}>
                <SectionCard
                    title="Consumption"
                    icon={TrendingUp}
                    color={SECTION_COLORS.electricity.consumption}
                >
                    {!data.consumption || !data.consumption.data || data.consumption.data.length === 0 ? (
                        <NoDataMessage
                            moduleName="Electricity"
                            availableRange={DATA_RANGES.electricity}
                            redirectPath="/electricity"
                        />
                    ) : (
                        <Box sx={{
                            '& canvas': { maxHeight: '180px !important' },
                            '& .MuiPaper-root': { mb: 0 },
                            '& .MuiBox-root:has(canvas)': { height: '180px !important' }
                        }}>
                            <MetricsCards metrics={data.consumption.metrics} unit="Wh" metricType="Consumption" />
                            <OverallTrendChart
                                data={data.consumption.data}
                                title="Consumption Trend"
                                dataLabel="Consumption (Wh)"
                                color={SECTION_COLORS.electricity.consumption}
                                unit="Wh"
                                yAxisLabel="Consumption (Wh)"
                            />
                        </Box>
                    )}
                </SectionCard>
            </Grid>

            {/* Generation Card */}
            <Grid item xs={12} md={6}>
                <SectionCard
                    title="Generation"
                    icon={Bolt}
                    color={SECTION_COLORS.electricity.generation}
                >
                    {!data.generation || !data.generation.data || data.generation.data.length === 0 ? (
                        <NoDataMessage
                            moduleName="Electricity"
                            availableRange={DATA_RANGES.electricity}
                            redirectPath="/electricity"
                        />
                    ) : (
                        <Box sx={{
                            '& canvas': { maxHeight: '180px !important' },
                            '& .MuiPaper-root': { mb: 0 },
                            '& .MuiBox-root:has(canvas)': { height: '180px !important' }
                        }}>
                            <MetricsCards metrics={data.generation.metrics} unit="Wh" metricType="Generation" />
                            <OverallTrendChart
                                data={data.generation.data}
                                title="Generation Trend"
                                dataLabel="Generation (Wh)"
                                color={SECTION_COLORS.electricity.generation}
                                unit="Wh"
                                yAxisLabel="Generation (Wh)"
                            />
                        </Box>
                    )}
                </SectionCard>
            </Grid>

            {/* Net Energy Card - Full Width */}
            <Grid item xs={12}>
                <SectionCard
                    title="Net Energy & Self-Sufficiency"
                    icon={TrendingDown}
                    color={SECTION_COLORS.electricity.netEnergy}
                >
                    {!data.netEnergy || !data.netEnergy.data || data.netEnergy.data.length === 0 ? (
                        <NoDataMessage
                            moduleName="Electricity"
                            availableRange={DATA_RANGES.electricity}
                            redirectPath="/electricity"
                        />
                    ) : (
                        <Box sx={{
                            '& canvas': { maxHeight: '220px !important' },
                            '& .MuiPaper-root': { mb: 0 },
                            '& .MuiBox-root:has(canvas)': { height: '220px !important' }
                        }}>
                            <NetEnergyMetricsCards metrics={data.netEnergy.metrics} />
                            <NetEnergyWithSelfSufficiencyChart
                                netEnergyData={data.netEnergy.data}
                                selfSufficiencyData={data.netEnergy.selfSufficiencyRate}
                            />
                        </Box>
                    )}
                </SectionCard>
            </Grid>
        </Grid>
    );
}
