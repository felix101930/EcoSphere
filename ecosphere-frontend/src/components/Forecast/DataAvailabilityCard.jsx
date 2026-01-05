// Data Availability Card - Shows data status and algorithm selection
import { Box, Card, CardContent, Typography, LinearProgress, Alert, Chip, Grid } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

// Algorithm Tier Card Component
const AlgorithmTierCard = ({ tier, name, stars, features, requirements, isActive }) => {
    return (
        <Grid item xs={12} sm={6} md={3}>
            <Box
                sx={{
                    p: 2,
                    height: 270,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 1,
                    border: '2px solid',
                    borderColor: isActive ? 'success.main' : 'grey.300',
                    bgcolor: isActive ? 'success.light' : 'grey.50',
                    opacity: isActive ? 1 : 0.6,
                    transition: 'all 0.3s'
                }}
            >
                <Box sx={{ mb: 1.5 }}>
                    <Chip
                        label={`Tier ${tier}`}
                        size="small"
                        color={isActive ? 'success' : 'default'}
                        sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {stars}
                    </Typography>
                </Box>
                <Box sx={{ height: 72, mb: 1 }}>
                    {features.map((feature, index) => (
                        <Typography key={index} variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                            • {feature}
                        </Typography>
                    ))}
                </Box>
                <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Requirements:
                    </Typography>
                    {requirements.map((req, index) => (
                        <Typography key={index} variant="caption" display="block" color="text.secondary">
                            • {req}
                        </Typography>
                    ))}
                </Box>
            </Box>
        </Grid>
    );
};

const DataAvailabilityCard = ({ metadata }) => {
    if (!metadata) return null;

    const { dataAvailability, strategy, strategyName, confidence, accuracy, warning } = metadata;

    // Determine confidence level
    const getConfidenceLevel = (conf) => {
        if (conf >= 90) return { label: 'Excellent', color: 'success' };
        if (conf >= 75) return { label: 'Good', color: 'info' };
        if (conf >= 60) return { label: 'Acceptable', color: 'warning' };
        if (conf >= 50) return { label: 'Low', color: 'warning' };
        return { label: 'Insufficient', color: 'error' };
    };

    const confidenceLevel = getConfidenceLevel(confidence);

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📊 Data Availability Analysis
                </Typography>

                {/* Data Completeness */}
                <Box sx={{ mt: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Data Completeness
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                            {dataAvailability.completenessScore}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={dataAvailability.completenessScore}
                        sx={{ height: 8, borderRadius: 1 }}
                    />
                </Box>

                {/* Available Data Checks */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Available Data:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {dataAvailability.hasRecent7Days ? (
                                <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                                <ErrorIcon fontSize="small" color="error" />
                            )}
                            <Typography variant="body2">
                                Recent 7 days data
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {dataAvailability.hasRecent30Days ? (
                                <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                                <ErrorIcon fontSize="small" color="error" />
                            )}
                            <Typography variant="body2">
                                Recent 30 days data
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {dataAvailability.hasLastYearData ? (
                                <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                                <WarningIcon fontSize="small" color="warning" />
                            )}
                            <Typography variant="body2">
                                Last year same period data
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {dataAvailability.hasOneYearCycle ? (
                                <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                                <WarningIcon fontSize="small" color="warning" />
                            )}
                            <Typography variant="body2">
                                Complete 1-year cycle data
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Missing Periods */}
                {dataAvailability.missingPeriods && dataAvailability.missingPeriods.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Missing Data Periods:
                        </Typography>
                        <Box sx={{ ml: 2 }}>
                            {dataAvailability.missingPeriods.map((period, index) => (
                                <Typography key={index} variant="body2" color="text.secondary">
                                    • {period.start} to {period.end} ({period.days} days)
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Algorithm Selection */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Recommended Algorithm:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                        {strategyName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip
                            label={`Confidence: ${confidence}%`}
                            color={confidenceLevel.color}
                            size="small"
                        />
                        <Chip
                            label={`Accuracy: ${accuracy}`}
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            label={confidenceLevel.label}
                            color={confidenceLevel.color}
                            variant="outlined"
                            size="small"
                        />
                    </Box>
                </Box>

                {/* Warning Message */}
                {warning && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {warning}
                    </Alert>
                )}

                {/* Info Message */}
                {confidence < 90 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        ℹ️ Note: Due to some missing historical data, the system is using {strategyName}.
                        The prediction results are still reliable, but accuracy may be slightly lower than with complete data.
                    </Alert>
                )}

                {/* Algorithm Explanation */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        📚 Prediction Algorithm Tiers
                    </Typography>

                    <Grid container spacing={2}>
                        <AlgorithmTierCard
                            tier={1}
                            name="Holt-Winters"
                            stars="★★★★★"
                            features={[
                                'Industry standard method',
                                'Exponential smoothing',
                                'Weekly seasonality'
                            ]}
                            requirements={[
                                '1 year historical data',
                                '70% data completeness'
                            ]}
                            isActive={strategy === 'HOLT_WINTERS'}
                        />

                        <AlgorithmTierCard
                            tier={2}
                            name="Seasonal Weighted"
                            stars="★★★★☆"
                            features={[
                                '30% last year data',
                                '50% last week data',
                                '20% 30-day average'
                            ]}
                            requirements={[
                                'Last year same period',
                                'Recent 30 days data'
                            ]}
                            isActive={strategy === 'SEASONAL_WEIGHTED'}
                        />

                        <AlgorithmTierCard
                            tier={3}
                            name="Trend-Based"
                            stars="★★★☆☆"
                            features={[
                                'Linear trend analysis',
                                'No seasonality',
                                'Recent pattern only'
                            ]}
                            requirements={[
                                'Recent 30 days data'
                            ]}
                            isActive={strategy === 'TREND_BASED'}
                        />

                        <AlgorithmTierCard
                            tier={4}
                            name="Moving Average"
                            stars="★★☆☆☆"
                            features={[
                                'Simple average',
                                'Baseline method',
                                'No trend/seasonality'
                            ]}
                            requirements={[
                                'Recent 7 days data'
                            ]}
                            isActive={strategy === 'MOVING_AVERAGE'}
                        />
                    </Grid>
                </Box>
            </CardContent>
        </Card>
    );
};

export default DataAvailabilityCard;
