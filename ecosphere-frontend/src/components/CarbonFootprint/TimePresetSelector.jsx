import { Box, Paper, Typography, Button, ToggleButtonGroup, ToggleButton, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TIME_PRESETS, DATA_RANGES } from '../../lib/constants/carbonFootprint';

export default function TimePresetSelector({
    preset,
    onPresetChange,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    onApply,
    loading
}) {
    // Should disable dates outside available range
    const shouldDisableDate = (date) => {
        const minDate = new Date(DATA_RANGES.electricity.start + 'T12:00:00');
        const maxDate = new Date(DATA_RANGES.electricity.end + 'T12:00:00');
        return date < minDate || date > maxDate;
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Time Range (Last Available Date and Time for Demo)
            </Typography>

            {/* Preset Buttons */}
            <Box sx={{ mb: 3 }}>
                <ToggleButtonGroup
                    value={preset}
                    exclusive
                    onChange={(_event, newPreset) => {
                        if (newPreset !== null) {
                            onPresetChange(newPreset);
                        }
                    }}
                    size="small"
                    sx={{ flexWrap: 'wrap' }}
                >
                    <ToggleButton value={TIME_PRESETS.TODAY}>
                        Today
                    </ToggleButton>
                    <ToggleButton value={TIME_PRESETS.YESTERDAY}>
                        Yesterday
                    </ToggleButton>
                    <ToggleButton value={TIME_PRESETS.LAST_7_DAYS}>
                        Last 7 Days
                    </ToggleButton>
                    <ToggleButton value={TIME_PRESETS.LAST_30_DAYS}>
                        Last 30 Days
                    </ToggleButton>
                    <ToggleButton value={TIME_PRESETS.CUSTOM}>
                        Custom
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Date Pickers - Only show for Custom preset */}
            {preset === TIME_PRESETS.CUSTOM && (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <DatePicker
                            label="From Date"
                            value={dateFrom}
                            onChange={(newValue) => {
                                onDateFromChange(newValue);
                            }}
                            shouldDisableDate={shouldDisableDate}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: { minWidth: 200 }
                                }
                            }}
                        />

                        <Typography>to</Typography>

                        <DatePicker
                            label="To Date"
                            value={dateTo}
                            onChange={(newValue) => {
                                onDateToChange(newValue);
                            }}
                            shouldDisableDate={shouldDisableDate}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: { minWidth: 200 }
                                }
                            }}
                        />

                        <Button
                            variant="contained"
                            onClick={onApply}
                            disabled={!dateFrom || !dateTo || loading}
                        >
                            Apply
                        </Button>
                    </Box>
                </LocalizationProvider>
            )}

            {/* Available Range Info */}
            <Alert severity="info" sx={{ mt: 2 }}>
                Available Range: {DATA_RANGES.electricity.start} to {DATA_RANGES.electricity.end}
            </Alert>
        </Paper>
    );
}
