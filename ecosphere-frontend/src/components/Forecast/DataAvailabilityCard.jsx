// Data Availability Card - Shows data status and algorithm selection
import { Box, Card, CardContent, Typography, LinearProgress, Alert, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

const DataAvailabilityCard = ({ metadata }) => {
    if (!metadata) return null;

    const { dataAvailability, strategyName, confidence, accuracy, warning } = metadata;

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
                            {dataAvailability.hasTwoYearsCycle ? (
                                <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                                <WarningIcon fontSize="small" color="warning" />
                            )}
                            <Typography variant="body2">
                                Complete 2-year cycle data
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
            </CardContent>
        </Card>
    );
};

export default DataAvailabilityCard;
