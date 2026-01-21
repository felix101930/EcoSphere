// Thermal Forecast Info - Display thermal forecast model information
import { Card, CardContent, Typography, Box, Alert } from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CloudIcon from '@mui/icons-material/Cloud';
import InfoIcon from '@mui/icons-material/Info';

const ThermalForecastInfo = ({ metadata }) => {
    if (!metadata) return null;

    const { model, trainingDays, warning } = metadata;

    // Determine coefficient explanation based on sign
    const coefficientValue = model?.weather_coefficient || 0;
    const coefficientExplanation = coefficientValue > 0
        ? `For every 1°C increase in outdoor temperature above ${model?.comfortable_temp?.toFixed(1)}°C, indoor temperature increases by approximately ${coefficientValue.toFixed(3)}°C`
        : `For every 1°C increase in outdoor temperature above ${model?.comfortable_temp?.toFixed(1)}°C, indoor temperature decreases by approximately ${Math.abs(coefficientValue).toFixed(3)}°C`;

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    <ThermostatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Thermal Forecast Model Information
                </Typography>

                {warning && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {warning}
                    </Alert>
                )}

                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        <InfoIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Prediction Formula
                    </Typography>
                    <Box sx={{
                        bgcolor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                    }}>
                        Indoor Temperature = Historical Baseline × 0.8 + Weather Adjustment × 0.2
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        The model combines historical temperature patterns (80% weight) with weather-based adjustments (20% weight)
                        to predict indoor temperature.
                    </Typography>
                </Box>

                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Model Parameters
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Historical Baseline:</strong> {model?.baseline_temp?.toFixed(2)}°C
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2 }}>
                            Average indoor temperature from the last {trainingDays} days
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Weather Coefficient:</strong> {coefficientValue.toFixed(3)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2 }}>
                            {coefficientExplanation}
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Comfortable Temperature:</strong> {model?.comfortable_temp?.toFixed(1)}°C
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                            Target indoor temperature maintained by HVAC system
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        <CloudIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Weather Data Source
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Open-Meteo Weather API (Calgary, AB)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Variables: Outdoor temperature, Solar radiation
                    </Typography>
                </Box>

                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Training Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {trainingDays} days of historical indoor temperature and weather data
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ThermalForecastInfo;
