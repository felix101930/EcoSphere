// Algorithm Tiers Grid - Shows all 4 algorithm tiers with active highlighting
import { Box, Typography, Chip, Grid } from '@mui/material';
import { ALGORITHM_TIERS, CARD_HEIGHT } from '../../lib/constants/forecast';

// Algorithm Tier Card Component
const AlgorithmTierCard = ({ tier, name, stars, features, requirements, isActive }) => {
    return (
        <Grid item xs={12} sm={6} md={3}>
            <Box
                sx={{
                    p: 2,
                    height: CARD_HEIGHT,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 1,
                    border: '2px solid',
                    borderColor: isActive ? 'success.main' : 'grey.300',
                    bgcolor: isActive ? 'success.light' : 'grey.50',
                    opacity: isActive ? 1 : 0.6,
                    transition: 'all 0.3s'
                }}
            >
                <Box sx={{ mb: 1.5 }}>
                    <Chip
                        label={`Tier ${tier}`}
                        size="small"
                        color={isActive ? 'success' : 'default'}
                        sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {stars}
                    </Typography>
                </Box>
                <Box sx={{ height: 72, mb: 1 }}>
                    {features.map((feature, index) => (
                        <Typography key={index} variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                            • {feature}
                        </Typography>
                    ))}
                </Box>
                <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Requirements:
                    </Typography>
                    {requirements.map((req, index) => (
                        <Typography key={index} variant="caption" display="block" color="text.secondary">
                            • {req}
                        </Typography>
                    ))}
                </Box>
            </Box>
        </Grid>
    );
};

const AlgorithmTiersGrid = ({ activeStrategy }) => {
    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📚 Prediction Algorithm Tiers
            </Typography>

            <Grid container spacing={2}>
                {ALGORITHM_TIERS.map((tier) => (
                    <AlgorithmTierCard
                        key={tier.strategy}
                        tier={tier.tier}
                        name={tier.name}
                        stars={tier.stars}
                        features={tier.features}
                        requirements={tier.requirements}
                        isActive={activeStrategy === tier.strategy}
                    />
                ))}
            </Grid>
        </Box>
    );
};

export default AlgorithmTiersGrid;
