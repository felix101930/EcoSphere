// Generation Forecast Information Card - Shows model details and weather data source
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

const GenerationForecastInfo = ({ metadata }) => {
    if (!metadata) return null;

    const { model, trainingDays, strategyName } = metadata;

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🌤️ Generation Forecast Model
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
                            <div>Generation (Wh/day) = </div>
                            <div style={{ marginLeft: '20px' }}>
                                {model.coefficients.direct_radiation.toFixed(2)} × Direct_Radiation (Wh/m²)
                            </div>
                            <div style={{ marginLeft: '20px' }}>
                                + {model.intercept.toFixed(2)}
                            </div>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            <strong>Coefficient ({model.coefficients.direct_radiation.toFixed(2)}):</strong> Learned from historical data -
                            represents the solar panel conversion efficiency.
                            {model.coefficients.direct_radiation > 0
                                ? `For every 1 Wh/m² of direct solar radiation, the panels generate approximately ${model.coefficients.direct_radiation.toFixed(2)} Wh of electricity.`
                                : `The coefficient is unexpectedly negative, which may indicate data quality issues during the training period.`
                            }
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            <strong>Intercept ({model.intercept.toFixed(2)}):</strong> Baseline adjustment factor -
                            represents the generation when there is no direct solar radiation (typically close to zero for solar panels).
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            These values are calculated using Simple Linear Regression on {trainingDays} days of historical data.
                            The model learns the relationship between solar radiation and actual generation from your specific solar panel system.
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
                        <Chip label="Direct Solar Radiation" size="small" />
                        <Chip label="Temperature (2m)" size="small" />
                        <Chip label="Cloud Cover" size="small" />
                        <Chip label="Shortwave Radiation" size="small" />
                        <Chip label="Diffuse Radiation" size="small" />
                    </Box>
                </Box>

                {/* Training Information */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Training Data
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        Model trained on <strong>{trainingDays} days</strong> of historical generation and weather data
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        The system analyzes the relationship between past weather conditions (solar radiation, temperature, cloud cover)
                        and actual solar panel generation to learn how weather affects energy production. These learned patterns are
                        then applied to forecast weather data to predict future generation.
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default GenerationForecastInfo;
