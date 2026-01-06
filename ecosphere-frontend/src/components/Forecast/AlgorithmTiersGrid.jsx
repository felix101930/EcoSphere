// Algorithm Tiers Grid - Shows all 4 algorithm tiers with active highlighting
import { Box, Typography, Chip, Tooltip, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ALGORITHM_TIERS, CARD_HEIGHT } from '../../lib/constants/forecast';

// Algorithm Tier Card Component
const AlgorithmTierCard = ({ tier, name, stars, features, requirements, formula, description, isActive }) => {
    return (
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
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
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
                <Tooltip
                    title={
                        <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Formula
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1.5, bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1 }}>
                                {formula}
                            </Typography>
                            <Typography variant="caption" display="block">
                                {description}
                            </Typography>
                        </Box>
                    }
                    arrow
                    placement="top"
                    enterDelay={200}
                    leaveDelay={200}
                >
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                        <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
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
    );
};

const AlgorithmTiersGrid = ({ activeStrategy }) => {
    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📚 Prediction Algorithm Tiers
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {ALGORITHM_TIERS.map((tier) => (
                    <Box key={tier.strategy} sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '220px' }}>
                        <AlgorithmTierCard
                            tier={tier.tier}
                            name={tier.name}
                            stars={tier.stars}
                            features={tier.features}
                            requirements={tier.requirements}
                            formula={tier.formula}
                            description={tier.description}
                            isActive={activeStrategy === tier.strategy}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default AlgorithmTiersGrid;
