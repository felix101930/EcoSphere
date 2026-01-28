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
    const [validationError, setValidationError] = useState('');

    // Internal temporary state - initialized with Last 7 Days default or props
    const [tempDateFrom, setTempDateFrom] = useState(() => {
        if (dateFrom) return dateFrom;
        // Calculate Last 7 Days as default
        if (dateRange) {
            const maxDate = new Date(dateRange.maxDate + 'T12:00:00');
            const fromDate = new Date(maxDate);
            fromDate.setDate(fromDate.getDate() - 7);
            const minDate = new Date(dateRange.minDate + 'T12:00:00');
            return fromDate < minDate ? minDate : fromDate;
        }
        return null;
    });

    const [tempDateTo, setTempDateTo] = useState(() => {
        if (dateTo) return dateTo;
        // Use max date as default
        if (dateRange) {
            return new Date(dateRange.maxDate + 'T12:00:00');
        }
        return null;
    });

    // Handle preset change - update temp dates only
    const handlePresetChange = (_event, newPreset) => {
        if (newPreset === null) return;

        setPreset(newPreset);

        if (newPreset === TIME_PRESETS.CUSTOM) {
            return;
        }

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
            default:
                break;
        }

        // Ensure fromDate is not before minDate
        const minDateStr = dateRange.minDate;
        const minDate = new Date(minDateStr + 'T12:00:00');
        if (fromDate < minDate) {
            fromDate = minDate;
        }

        // Update temp dates only (not parent)
        setTempDateFrom(fromDate);
        setTempDateTo(maxDate);
    };

    // Handle Apply button - validate dates before updating parent
    const handleApply = () => {
        // Clear previous validation error
        setValidationError('');

        // Validation 1: Check if dates exist
        if (!tempDateFrom || !tempDateTo) {
            setValidationError('Please select both From Date and To Date.');
            return;
        }

        // Validation 2: Check if From Date is not after To Date
        if (tempDateFrom > tempDateTo) {
            setValidationError('From Date cannot be after To Date.');
            return;
        }

        // Validation 3: Check if dates are within available database range
        if (dateRange) {
            const minDate = new Date(dateRange.minDate + 'T12:00:00');
            const maxDate = new Date(dateRange.maxDate + 'T12:00:00');

            if (tempDateFrom < minDate || tempDateFrom > maxDate) {
                setValidationError(`From Date must be between ${dateRange.minDate} and ${dateRange.maxDate}.`);
                return;
            }

            if (tempDateTo < minDate || tempDateTo > maxDate) {
                setValidationError(`To Date must be between ${dateRange.minDate} and ${dateRange.maxDate}.`);
                return;
            }
        }

        // Validation 4: Check if dates are not in the future
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today

        if (tempDateFrom > today) {
            setValidationError('From Date cannot be in the future.');
            return;
        }

        if (tempDateTo > today) {
            setValidationError('To Date cannot be in the future.');
            return;
        }

        // All validations passed - update parent and trigger data load
        onDateFromChange(tempDateFrom);
        onDateToChange(tempDateTo);

        // Use setTimeout to ensure state is updated before calling onApply
        setTimeout(() => {
            onApply();
        }, 0);
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
                        value={tempDateFrom}
                        onChange={(newValue) => {
                            setTempDateFrom(newValue);
                            setPreset(TIME_PRESETS.CUSTOM);
                            setValidationError(''); // Clear error when user changes date
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
                        value={tempDateTo}
                        onChange={(newValue) => {
                            setTempDateTo(newValue);
                            setPreset(TIME_PRESETS.CUSTOM);
                            setValidationError(''); // Clear error when user changes date
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
                        onClick={handleApply}
                        disabled={!tempDateFrom || !tempDateTo || loading}
                    >
                        Apply
                    </Button>
                </Box>

                {/* Validation Error Message */}
                {validationError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {validationError}
                    </Alert>
                )}
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
