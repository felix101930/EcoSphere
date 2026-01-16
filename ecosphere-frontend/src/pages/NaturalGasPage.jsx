import { useState } from 'react';
import { Box, Container, Tabs, Tab, Alert } from '@mui/material';
import PageHeader from '../components/Common/PageHeader';
import Disclaimer from '../components/Common/Disclaimer';
import NaturalGasTimeFilter from '../components/NaturalGas/NaturalGasTimeFilter';
import ConsumptionTab from '../components/NaturalGas/ConsumptionTab';
import { TAB_TYPES, TIME_PRESETS, TIME_PRESET_LABELS, getPresetDateRange, DATA_CONFIG } from '../lib/constants/naturalGas';
import { useNaturalGasData } from '../lib/hooks/useNaturalGasData';

function NaturalGasPage() {
    const [activeTab, setActiveTab] = useState(TAB_TYPES.CONSUMPTION);
    const [selectedPreset, setSelectedPreset] = useState(TIME_PRESETS.ALL_DATA);
    const [customDateFrom, setCustomDateFrom] = useState(null);
    const [customDateTo, setCustomDateTo] = useState(null);

    // Get initial date range for all data
    const initialRange = getPresetDateRange(TIME_PRESETS.ALL_DATA);
    const [dateFrom, setDateFrom] = useState(initialRange.dateFrom);
    const [dateTo, setDateTo] = useState(initialRange.dateTo);

    // Use natural gas data hook
    const {
        consumptionData,
        isLoading,
        error,
        fetchConsumptionData
    } = useNaturalGasData(dateFrom, dateTo);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handlePresetChange = (preset) => {
        setSelectedPreset(preset);

        if (preset !== TIME_PRESETS.CUSTOM) {
            const range = getPresetDateRange(preset);
            if (range) {
                setDateFrom(range.dateFrom);
                setDateTo(range.dateTo);
            }
        }
    };

    const handleApplyFilter = async () => {
        if (selectedPreset === TIME_PRESETS.CUSTOM) {
            if (customDateFrom && customDateTo) {
                setDateFrom(customDateFrom);
                setDateTo(customDateTo);
                await fetchConsumptionData(customDateFrom, customDateTo);
            }
        } else {
            const range = getPresetDateRange(selectedPreset);
            if (range) {
                setDateFrom(range.dateFrom);
                setDateTo(range.dateTo);
                await fetchConsumptionData(range.dateFrom, range.dateTo);
            }
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <PageHeader
                title="Natural Gas Report"
                subtitle={`Monthly natural gas consumption data | Available: ${DATA_CONFIG.DATE_RANGE_DISPLAY}`}
            />

            <Disclaimer />

            <NaturalGasTimeFilter
                selectedPreset={selectedPreset}
                onPresetChange={handlePresetChange}
                customDateFrom={customDateFrom}
                customDateTo={customDateTo}
                onCustomDateFromChange={setCustomDateFrom}
                onCustomDateToChange={setCustomDateTo}
                onApply={handleApplyFilter}
                presets={Object.values(TIME_PRESETS)}
                presetLabels={TIME_PRESET_LABELS}
                minDate={new Date(DATA_CONFIG.MIN_DATE)}
                maxDate={new Date(DATA_CONFIG.MAX_DATE)}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Consumption" value={TAB_TYPES.CONSUMPTION} />
                    <Tab label="Forecast" value={TAB_TYPES.FORECAST} disabled />
                </Tabs>
            </Box>

            {activeTab === TAB_TYPES.CONSUMPTION && (
                <ConsumptionTab
                    data={consumptionData}
                    isLoading={isLoading}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                />
            )}

            {activeTab === TAB_TYPES.FORECAST && (
                <Alert severity="info">
                    Forecast functionality coming soon
                </Alert>
            )}
        </Container>
    );
}

export default NaturalGasPage;
