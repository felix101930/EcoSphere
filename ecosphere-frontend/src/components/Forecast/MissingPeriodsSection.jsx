// Missing Periods Section - Shows gaps in historical data
import { Box, Typography } from '@mui/material';

const MissingPeriodsSection = ({ missingPeriods }) => {
    if (!missingPeriods || missingPeriods.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
                Missing Data Periods:
            </Typography>
            <Box sx={{ ml: 2 }}>
                {missingPeriods.map((period, index) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                        • {period.start} to {period.end} ({period.days} days)
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};

export default MissingPeriodsSection;
