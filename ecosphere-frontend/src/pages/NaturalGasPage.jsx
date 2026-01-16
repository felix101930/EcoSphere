import { useState } from 'react';
import { Box, Tabs, Tab, Alert } from '@mui/material';
import PageHeader from '../components/Common/PageHeader';
import ExportReportDialog from '../components/Common/ExportReportDialog';
import Disclaimer from '../components/Common/Disclaimer';
import NaturalGasTimeFilter from '../components/NaturalGas/NaturalGasTimeFilter';
import ConsumptionTab from '../components/NaturalGas/ConsumptionTab';
import ForecastTab from '../components/NaturalGas/ForecastTab';
import { TAB_TYPES, TIME_PRESETS, TIME_PRESET_LABELS, getPresetDateRange, DATA_CONFIG } from '../lib/constants/naturalGas';
import { useNaturalGasData } from '../lib/hooks/useNaturalGasData';

function NaturalGasPage() {
    const [activeTab, setActiveTab] = useState(TAB_TYPES.CONSUMPTION);
    const [selectedPreset, setSelectedPreset] = useState(TIME_PRESETS.ALL_DATA);
    const [customDateFrom, setCustomDateFrom] = useState(null);
    const [customDateTo, setCustomDateTo] = useState(null);

    // Export dialog state
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

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
        <>
            <PageHeader
                title="Natural Gas Report"
                subtitle={`Monthly natural gas consumption data`}
                showExportButton={true}
                onExport={() => setExportDialogOpen(true)}
            />

            {/* Export Report Dialog */}
            <ExportReportDialog
                open={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                reportType="NaturalGas"
                reportTitle="Natural Gas Report"
            />

            <Box data-export-content sx={{ px: 4, py: 3 }}>
                {/* Disclaimer */}
                <Disclaimer />

                {/* Time Filter - Hide in export */}
                <Box data-hide-in-export="true">
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
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Main Tabs - Hide in export */}
                <Box data-hide-in-export="true" sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Consumption" value={TAB_TYPES.CONSUMPTION} />
                        <Tab label="Forecast" value={TAB_TYPES.FORECAST} />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                {activeTab === TAB_TYPES.CONSUMPTION && (
                    <ConsumptionTab
                        data={consumptionData}
                        isLoading={isLoading}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                    />
                )}

                {activeTab === TAB_TYPES.FORECAST && (
                    <ForecastTab />
                )}
            </Box>
        </>
    );
}

export default NaturalGasPage;
