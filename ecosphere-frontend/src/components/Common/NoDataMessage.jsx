import { Box, Typography, Button, Alert } from '@mui/material';
import { Info, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function NoDataMessage({
    moduleName,
    availableRange,
    redirectPath
}) {
    const navigate = useNavigate();

    return (
        <Alert
            severity="info"
            icon={<Info />}
            sx={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '200px'
            }}
        >
            <Box>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                    No data available for this period
                </Typography>
                {availableRange && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Available: {availableRange.start} to {availableRange.end}
                    </Typography>
                )}
                {redirectPath && (
                    <Button
                        variant="outlined"
                        size="small"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate(redirectPath)}
                    >
                        View in {moduleName} Report
                    </Button>
                )}
            </Box>
        </Alert>
    );
}
