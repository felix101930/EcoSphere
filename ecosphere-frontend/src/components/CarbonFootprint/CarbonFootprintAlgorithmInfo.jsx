// Carbon Footprint Algorithm Info - Display calculation methodology
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import CloudIcon from '@mui/icons-material/Cloud';
import InfoIcon from '@mui/icons-material/Info';
import BoltIcon from '@mui/icons-material/Bolt';

const CarbonFootprintAlgorithmInfo = () => {
    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Carbon Footprint Calculation Methodology
                </Typography>

                {/* Main Formula */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        <InfoIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Calculation Formula
                    </Typography>
                    <Box sx={{
                        bgcolor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        mb: 1
                    }}>
                        Carbon Footprint (kg CO₂) = Energy Consumption (kWh) × Carbon Intensity (kg CO₂/kWh)
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Each hour's (or day's) carbon footprint is calculated by multiplying the electricity consumption
                        by the grid's carbon intensity for that specific time period.
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Data Sources */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        📊 Data Sources
                    </Typography>

                    {/* Energy Consumption */}
                    <Box sx={{ pl: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <BoltIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: '#FFA726' }} />
                            <strong>Energy Consumption Data</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                            <strong>Source:</strong> Building's electricity meter (Table TL341)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                            <strong>Measurement:</strong> Hourly electricity consumption in kilowatt-hours (kWh)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                            <strong>Data Range:</strong> February 2019 - November 2020
                        </Typography>
                    </Box>

                    {/* Carbon Intensity */}
                    <Box sx={{ pl: 2 }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <CloudIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: '#66BB6A' }} />
                            <strong>Carbon Intensity Data</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                            <strong>Source:</strong> Electricity Maps API
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                            <strong>Region:</strong> Alberta, Canada (CA-AB)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                            <strong>Measurement:</strong> Grams of CO₂ emitted per kilowatt-hour (g CO₂/kWh)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                            <strong>Note:</strong> Converted to kg CO₂/kWh for calculation (÷ 1000)
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Calculation Process */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        🔄 Calculation Process
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Step 1:</strong> Retrieve electricity consumption for the selected time period
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3, mb: 2 }}>
                            Example: 150 kWh consumed on November 1, 2020
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Step 2:</strong> Fetch carbon intensity from Electricity Maps API for that specific date
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3, mb: 2 }}>
                            Example: Alberta grid carbon intensity = 620 g CO₂/kWh = 0.620 kg CO₂/kWh
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Step 3:</strong> Calculate carbon footprint
                        </Typography>
                        <Box sx={{
                            bgcolor: 'grey.50',
                            p: 1.5,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            ml: 3,
                            mb: 2
                        }}>
                            Carbon Footprint = 150 kWh × 0.620 kg CO₂/kWh = 93.0 kg CO₂
                        </Box>

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Step 4:</strong> Aggregate results for the selected time range
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                            Sum all hourly/daily carbon footprints to get total emissions
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Why Carbon Intensity Varies */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        💡 Why Carbon Intensity Varies
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Alberta's electricity grid carbon intensity changes based on the energy mix:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            • <strong>High Carbon Intensity:</strong> More coal and natural gas power plants operating
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            • <strong>Low Carbon Intensity:</strong> More renewable energy (wind, hydro, solar) in the mix
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            • <strong>Time Variation:</strong> Intensity varies by hour, day, and season based on demand and supply
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Custom Calculator Note */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        📝 Custom Calculator
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        The custom calculator uses the <strong>average carbon intensity</strong> from all available historical data
                        to estimate carbon footprint from user-entered monthly electricity bills. This provides a simplified
                        calculation when specific date-based carbon intensity data is not available.
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default CarbonFootprintAlgorithmInfo;
