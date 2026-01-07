// Algorithm Selection Section - Shows recommended algorithm with confidence
import { Box, Typography, Chip, Alert } from '@mui/material';
import { getConfidenceLevel } from '../../lib/utils/forecastUtils';

const AlgorithmSelectionSection = ({ strategyName, confidence, accuracy, warning }) => {
    const confidenceLevel = getConfidenceLevel(confidence);

    return (
        <>
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
                    Note: Due to some missing historical data, the system is using {strategyName}.
                    The prediction results are still reliable, but accuracy may be slightly lower than with complete data.
                </Alert>
            )}
        </>
    );
};

export default AlgorithmSelectionSection;
