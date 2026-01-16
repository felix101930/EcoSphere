import { Card, CardContent, Typography, Box, Chip, Alert, CircularProgress, Divider } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PsychologyIcon from '@mui/icons-material/Psychology';

const MLForecastCard = ({ forecast, loading }) => {
    if (loading) {
        return (
            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading AI forecast...
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (!forecast || !forecast.data) {
        return null;
    }

    const { summary, model_info, data } = forecast;
    
    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                {/* Header with Model Info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PsychologyIcon fontSize="small" />
                            🤖 AI Solar Forecast
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                            <Chip 
                                label={model_info?.name || 'ML Model'} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                            />
                            {model_info?.r2_score && (
                                <Chip 
                                    label={`R²: ${model_info.r2_score.toFixed(3)}`}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                />
                            )}
                            <Chip 
                                label="24h Forecast"
                                size="small"
                                sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                            />
                        </Box>
                    </Box>
                    <Chip 
                        icon={<WarningAmberIcon fontSize="small" />}
                        label="For Reference Only"
                        size="small"
                        color="warning"
                        variant="outlined"
                    />
                </Box>

                {/* Key Metrics */}
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
                    gap: 2,
                    mb: 3
                }}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Total Generation
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {summary?.total_kwh?.toFixed(1) || '0.0'} kWh
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Next 24 hours
                        </Typography>
                    </Box>
                    
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Peak Output
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {summary?.peak_kw?.toFixed(2) || '0.00'} kW
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Maximum power
                        </Typography>
                    </Box>
                    
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Predictions
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {data?.length || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Hourly intervals
                        </Typography>
                    </Box>
                </Box>

                {/* Model Details */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Model Details
                    </Typography>
                    <Typography variant="body2" paragraph>
                        This forecast uses a <strong>{model_info?.name || 'machine learning'}</strong> model trained on historical solar generation data.
                        The model analyzes weather patterns and time-based features to predict solar output.
                    </Typography>
                    {model_info?.features_used && (
                        <Typography variant="caption" color="text.secondary" display="block">
                            Using {model_info.features_used} weather and time features for prediction.
                        </Typography>
                    )}
                </Box>

                {/* Important Disclaimer */}
                <Alert 
                    severity="warning" 
                    icon={<WarningAmberIcon />}
                    sx={{ mt: 2 }}
                >
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        ⚠️ Important Notice
                    </Typography>
                    <Typography variant="body2">
                        This AI forecast is for <strong>reference purposes only</strong>. Actual solar generation may vary due to:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
                        <li><Typography variant="body2">Real-time weather conditions</Typography></li>
                        <li><Typography variant="body2">Equipment performance</Typography></li>
                        <li><Typography variant="body2">Panel maintenance status</Typography></li>
                        <li><Typography variant="body2">Environmental factors</Typography></li>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Forecast is limited to 24 hours for maximum accuracy.
                    </Typography>
                </Alert>

                {/* Sample Data Preview */}
                {data && data.length > 0 && (
                    <>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Sample Predictions (First 6 hours)
                        </Typography>
                        <Box sx={{ 
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            gap: 1,
                            mt: 1
                        }}>
                            {data.slice(0, 6).map((pred, index) => (
                                <Box 
                                    key={index} 
                                    sx={{ 
                                        p: 1.5, 
                                        bgcolor: pred.predicted_kw > 5 ? '#e8f5e9' : 
                                                pred.predicted_kw > 2 ? '#fff3e0' : '#f5f5f5',
                                        borderRadius: 1,
                                        borderLeft: `4px solid ${
                                            pred.predicted_kw > 5 ? '#4caf50' : 
                                            pred.predicted_kw > 2 ? '#ff9800' : '#9e9e9e'
                                        }`
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {new Date(pred.timestamp).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {pred.predicted_kw.toFixed(2)} kW
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {pred.predicted_kw > 5 ? 'Good ☀️' : 
                                         pred.predicted_kw > 2 ? 'Moderate ⛅' : 'Low 🌤️'}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default MLForecastCard;