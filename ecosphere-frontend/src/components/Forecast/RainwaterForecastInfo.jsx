// Rainwater Forecast Information Card - Shows model details and weather data source
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

const RainwaterForecastInfo = ({ metadata }) => {
    if (!metadata) return null;

    const { model, trainingDays, strategyName } = metadata;

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🌧️ Rainwater Forecast Model
                </Typography>

                {/* Model Description */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Algorithm
                    </Typography>
                    <Typography variant="body2">
                        {strategyName}
                    </Typography>
                </Box>

                {/* Model Formula */}
                {model && model.coefficients && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Prediction Formula
                        </Typography>
                        <Box sx={{
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            overflowX: 'auto'
                        }}>
                            <div>Daily Average Rainwater Level (%) = </div>
                            <div style={{ marginLeft: '20px' }}>
                                {model.coefficients.precipitation.toFixed(4)} × Precipitation (mm)
                            </div>
                            <div style={{ marginLeft: '20px' }}>
                                + {model.intercept.toFixed(2)}
                            </div>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            <strong>Coefficient ({model.coefficients.precipitation.toFixed(4)}):</strong> Learned from historical data -
                            represents the relationship between precipitation and water level changes.
                            {model.coefficients.precipitation > 0
                                ? `For every 1 mm of precipitation, the water level tends to increase by ${model.coefficients.precipitation.toFixed(4)}%.`
                                : `The coefficient is negative, which may indicate that water usage and evaporation exceed rainfall collection during the training period.`
                            }
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            <strong>Intercept ({model.intercept.toFixed(2)}):</strong> Baseline water level when there is no precipitation.
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            <strong>Note:</strong> The model predicts <strong>daily average water level</strong> based on daily precipitation.
                            These values are calculated using Simple Linear Regression on {trainingDays} days of historical data.
                        </Typography>
                    </Box>
                )}

                {/* Weather Data Source */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Weather Data Source
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        <strong>Provider:</strong> Open-Meteo API (open-meteo.com)
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        <strong>Location:</strong> Calgary, AB (51.0947°N, 114.1094°W)
                    </Typography>
                    <Typography variant="body2">
                        <strong>Variables:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip label="Precipitation" size="small" color="primary" />
                        <Chip label="Rain" size="small" />
                        <Chip label="Showers" size="small" />
                        <Chip label="Temperature (2m)" size="small" />
                    </Box>
                </Box>

                {/* Training Information */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Training Data
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        Model trained on <strong>{trainingDays} days</strong> of historical rainwater level and weather data
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        The system analyzes the relationship between past weather conditions (precipitation, rain, temperature)
                        and actual rainwater tank levels to learn how rainfall affects water collection. These learned patterns are
                        then applied to forecast weather data to predict future rainwater levels.
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default RainwaterForecastInfo;
