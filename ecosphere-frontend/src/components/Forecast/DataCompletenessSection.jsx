// Data Completeness Section - Shows completeness score with progress bar
import { Box, Typography, LinearProgress } from '@mui/material';

const DataCompletenessSection = ({ completenessScore }) => {
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
        </Box>
    );
};

export default DataCompletenessSection;
