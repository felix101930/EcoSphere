// Generic Time Filter Component - Reusable across modules
import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    ToggleButtonGroup,
    ToggleButton,
    Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const TIME_PRESETS = {
    LAST_7_DAYS: 'last7days',
    LAST_30_DAYS: 'last30days',
    LAST_3_MONTHS: 'last3months',
    CUSTOM: 'custom'
};

const TimeFilter = ({
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    onApply,
    dateRange,
    loading
}) => {
    const [preset, setPreset] = useState(TIME_PRESETS.LAST_7_DAYS);

    // Handle preset change
    const handlePresetChange = (_event, newPreset) => {
        if (newPreset === null) return;

        setPreset(newPreset);

        if (!dateRange) return;

        // Use date strings with noon time to avoid timezone shifts
        const maxDateStr = dateRange.maxDate;
        const maxDate = new Date(maxDateStr + 'T12:00:00');
        let fromDate = new Date(maxDate);

        switch (newPreset) {
            case TIME_PRESETS.LAST_7_DAYS:
                fromDate.setDate(fromDate.getDate() - 7);
                break;
            case TIME_PRESETS.LAST_30_DAYS:
                fromDate.setDate(fromDate.getDate() - 30);
                break;
            case TIME_PRESETS.LAST_3_MONTHS:
                fromDate.setMonth(fromDate.getMonth() - 3);
                break;
            case TIME_PRESETS.CUSTOM:
                return;
            default:
                break;
        }

        // Ensure fromDate is not before minDate
        const minDateStr = dateRange.minDate;
        const minDate = new Date(minDateStr + 'T12:00:00');
        if (fromDate < minDate) {
            fromDate = minDate;
        }

        onDateFromChange(fromDate);
        onDateToChange(maxDate);
    };

    // Should disable dates outside available range
    const shouldDisableDate = (date) => {
        if (!dateRange) return false;

        const minDateStr = dateRange.minDate;
        const maxDateStr = dateRange.maxDate;
        const minDate = new Date(minDateStr + 'T12:00:00');
        const maxDate = new Date(maxDateStr + 'T12:00:00');

        return date < minDate || date > maxDate;
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Time Range
            </Typography>

            {/* Preset Buttons */}
            <Box sx={{ mb: 3 }}>
                <ToggleButtonGroup
                    value={preset}
                    exclusive
                    onChange={handlePresetChange}
                    size="small"
                    sx={{ flexWrap: 'wrap' }}
                >
                    <ToggleButton value={TIME_PRESETS.LAST_7_DAYS}>
                        Last 7 Days
                    </ToggleButton>
                    <ToggleButton value={TIME_PRESETS.LAST_30_DAYS}>
                        Last 30 Days
                    </ToggleButton>
                    <ToggleButton value={TIME_PRESETS.LAST_3_MONTHS}>
                        Last 3 Months
                    </ToggleButton>
                    <ToggleButton value={TIME_PRESETS.CUSTOM}>
                        Custom
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Date Pickers */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <DatePicker
                        label="From Date"
                        value={dateFrom}
                        onChange={(newValue) => {
                            onDateFromChange(newValue);
                            setPreset(TIME_PRESETS.CUSTOM);
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
                            setPreset(TIME_PRESETS.CUSTOM);
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

            {/* Available Range Info */}
            {dateRange && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Available Range: {dateRange.minDate} to {dateRange.maxDate}
                </Alert>
            )}
        </Paper>
    );
};

export default TimeFilter;
