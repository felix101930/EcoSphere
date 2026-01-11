// Data Completeness Section - Shows completeness score with progress bar
import { Box, Typography, LinearProgress } from '@mui/material';

const DataCompletenessSection = ({ completenessScore, totalDataPoints }) => {
    // Calculate expected data points based on completeness score
    const expectedDataPoints = totalDataPoints > 0
        ? Math.round(totalDataPoints / (completenessScore / 100))
        : 0;

    return (
        <Box sx={{ mt: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    Data Completeness
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                    {completenessScore}%
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={completenessScore}
                sx={{ height: 8, borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Calculated as: (Actual data points / Expected hourly data points) × 100.
                Expected points = total hours between first and last data point.
            </Typography>
            {totalDataPoints > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                    Example: {totalDataPoints.toLocaleString()} actual points / {expectedDataPoints.toLocaleString()} expected points = {completenessScore}%
                </Typography>
            )}
        </Box>
    );
};

export default DataCompletenessSection;
