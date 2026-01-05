import { Box, Button, ButtonGroup } from '@mui/material';
import { TIME_PRESETS } from '../../lib/constants/carbonFootprint';

const PRESET_LABELS = {
    [TIME_PRESETS.DEMO_DAY]: 'Demo Day',
    [TIME_PRESETS.TODAY]: 'Today',
    [TIME_PRESETS.YESTERDAY]: 'Yesterday',
    [TIME_PRESETS.LAST_7_DAYS]: 'Last 7 Days',
    [TIME_PRESETS.LAST_30_DAYS]: 'Last 30 Days'
};

export default function TimePresetSelector({ value, onChange }) {
    return (
        <Box sx={{ mb: 3 }}>
            <ButtonGroup variant="outlined" size="small">
                {Object.entries(PRESET_LABELS).map(([preset, label]) => (
                    <Button
                        key={preset}
                        onClick={() => onChange(preset)}
                        variant={value === preset ? 'contained' : 'outlined'}
                        sx={{
                            backgroundColor: value === preset ? '#DA291C' : 'transparent',
                            color: value === preset ? 'white' : '#DA291C',
                            borderColor: '#DA291C',
                            '&:hover': {
                                backgroundColor: value === preset ? '#C01530' : 'rgba(218, 41, 28, 0.04)',
                                borderColor: '#DA291C'
                            }
                        }}
                    >
                        {label}
                    </Button>
                ))}
            </ButtonGroup>
        </Box>
    );
}
