// Natural Gas Time Filter - Monthly data presets
import { Box, Paper, Typography, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function NaturalGasTimeFilter({
    selectedPreset,
    onPresetChange,
    customDateFrom,
    customDateTo,
    onCustomDateFromChange,
    onCustomDateToChange,
    onApply,
    presets,
    presetLabels,
    minDate,
    maxDate
}) {
    const shouldDisableDate = (date) => {
        if (!minDate || !maxDate) return false;
        return date < minDate || date > maxDate;
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }} data-hide-in-export="true">
            <Typography variant="h6" gutterBottom>
                Time Range
            </Typography>

            {/* Preset Buttons */}
            <Box sx={{ mb: 3 }}>
                <ToggleButtonGroup
                    value={selectedPreset}
                    exclusive
                    onChange={(_, newValue) => newValue && onPresetChange(newValue)}
                    size="small"
                    sx={{ flexWrap: 'wrap' }}
                >
                    {presets.map((preset) => (
                        <ToggleButton key={preset} value={preset}>
                            {presetLabels[preset]}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            {/* Date Pickers - Only show for custom */}
            {selectedPreset === 'custom' && (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <DatePicker
                            label="From Date"
                            value={customDateFrom}
                            onChange={onCustomDateFromChange}
                            shouldDisableDate={shouldDisableDate}
                            views={['year', 'month']}
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
                            value={customDateTo}
                            onChange={onCustomDateToChange}
                            shouldDisableDate={shouldDisableDate}
                            views={['year', 'month']}
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
                            disabled={!customDateFrom || !customDateTo}
                        >
                            Apply
                        </Button>
                    </Box>
                </LocalizationProvider>
            )}

            {/* Apply button for presets */}
            {selectedPreset !== 'custom' && (
                <Button
                    variant="contained"
                    onClick={onApply}
                    sx={{ mt: 2 }}
                >
                    Apply
                </Button>
            )}
        </Paper>
    );
}

export default NaturalGasTimeFilter;
