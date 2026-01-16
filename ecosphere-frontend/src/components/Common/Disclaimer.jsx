// Disclaimer - Educational purpose notice
import { Alert, AlertTitle } from '@mui/material';

const Disclaimer = () => {
    return (
        <Alert
            severity="error"
            sx={{
                mb: 3,
                backgroundColor: '#d32f2f',
                color: 'white',
                '& .MuiAlert-icon': {
                    color: 'white'
                },
                '& .MuiAlertTitle-root': {
                    color: 'white',
                    fontWeight: 600
                }
            }}
        >
            <AlertTitle>Educational Use Only</AlertTitle>
            This data visualization system is intended for educational and demonstration purposes only.<br />
            The data presented may not reflect real-time or current conditions and should not be used
            for operational decision-making or critical analysis.
        </Alert>
    );
};

export default Disclaimer;
