import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { TIME_PRESETS, TIME_PRESET_LABELS } from '../../lib/constants/overview';

export default function TimePresetSelector({ value, onChange }) {
    const handleChange = (event, newValue) => {
        if (newValue !== null) {
            onChange(newValue);
        }
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <ToggleButtonGroup
                value={value}
                exclusive
                onChange={handleChange}
                aria-label="time preset"
                sx={{
                    '& .MuiToggleButton-root': {
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 500
                    }
                }}
            >
                <ToggleButton value={TIME_PRESETS.DEMO_DAY}>
                    {TIME_PRESET_LABELS[TIME_PRESETS.DEMO_DAY]}
                </ToggleButton>
                <ToggleButton value={TIME_PRESETS.TODAY}>
                    {TIME_PRESET_LABELS[TIME_PRESETS.TODAY]}
                </ToggleButton>
                <ToggleButton value={TIME_PRESETS.YESTERDAY}>
                    {TIME_PRESET_LABELS[TIME_PRESETS.YESTERDAY]}
                </ToggleButton>
                <ToggleButton value={TIME_PRESETS.LAST_7_DAYS}>
                    {TIME_PRESET_LABELS[TIME_PRESETS.LAST_7_DAYS]}
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );
}
