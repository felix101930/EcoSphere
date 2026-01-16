// Water Report Page - Main water dashboard
import { useState, useEffect } from 'react';
import { Box, Tabs, Tab, CircularProgress, Alert } from '@mui/material';
import PageHeader from '../components/Common/PageHeader';
import ExportReportDialog from '../components/Common/ExportReportDialog';
import TimeFilter from '../components/Common/TimeFilter';
import Disclaimer from '../components/Common/Disclaimer';
import RainwaterTab from '../components/Water/RainwaterTab';
import HotWaterTab from '../components/Water/HotWaterTab';
import { TAB_TYPES } from '../lib/constants/water';
import { useWaterData } from '../lib/hooks/useWaterData';

const WaterReportPage = () => {
    // Tab state
    const [activeTab, setActiveTab] = useState(TAB_TYPES.RAINWATER);

    // Date filter state
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);

    // Export dialog state
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    // Custom hook for data management
    const {
        loading,
        error,
        dateRange,
        rainwaterData,
        hotWaterData,
        hotWaterForecast,
        rainwaterForecast,
        loadRainwaterData,
        loadHotWaterData,
        loadHotWaterForecast,
        loadRainwaterForecast
    } = useWaterData();

    // Set default date range when dateRange is loaded
    useEffect(() => {
        if (dateRange && !dateFrom && !dateTo) {
            // Determine which date range to use based on active tab
            const relevantRange = activeTab === TAB_TYPES.RAINWATER
                ? dateRange.rainwater
                : dateRange.hotWater;

            if (relevantRange) {
                // Set default to last 7 days of available data
                const maxDateStr = relevantRange.maxDate;
                const maxDate = new Date(maxDateStr + 'T12:00:00');
                const minDate = new Date(maxDate);
                minDate.setDate(minDate.getDate() - 7);

                setDateFrom(minDate);
                setDateTo(maxDate);
            }
        }
    }, [dateRange, dateFrom, dateTo, activeTab]);

    // Handle tab change
    const handleTabChange = (_event, newValue) => {
        setActiveTab(newValue);
    };

    // Handle apply filter
    const handleApplyFilter = async () => {
        if (!dateFrom || !dateTo) {
            return;
        }

        try {
            // Load data based on active tab
            switch (activeTab) {
                case TAB_TYPES.RAINWATER:
                    await loadRainwaterData(dateFrom, dateTo);
                    break;
                case TAB_TYPES.HOT_WATER:
                    await loadHotWaterData(dateFrom, dateTo);
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error('Error loading data:', err);
        }
    };

    // Auto-load data when dates are set (only on initial load)
    useEffect(() => {
        if (dateFrom && dateTo && !rainwaterData && !hotWaterData) {
            handleApplyFilter();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFrom, dateTo]);

    // Auto-load data when tab changes
    useEffect(() => {
        if (!dateFrom || !dateTo) return;

        const loadDataForTab = async () => {
            try {
                switch (activeTab) {
                    case TAB_TYPES.RAINWATER:
                        if (!rainwaterData) {
                            await loadRainwaterData(dateFrom, dateTo);
                        }
                        break;
                    case TAB_TYPES.HOT_WATER:
                        if (!hotWaterData) {
                            await loadHotWaterData(dateFrom, dateTo);
                        }
                        break;
                    default:
                        break;
                }
            } catch (err) {
                console.error('Error loading data for tab:', err);
            }
        };

        loadDataForTab();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, dateFrom, dateTo]);

    // Get current date range for TimeFilter
    const getCurrentDateRange = () => {
        if (!dateRange) return null;
        return activeTab === TAB_TYPES.RAINWATER
            ? dateRange.rainwater
            : dateRange.hotWater;
    };

    // Loading state
    if (!dateRange && loading) {
        return (
            <>
                <PageHeader
                    title="Water Report"
                    subtitle="Monitor and analyze water consumption and rainwater harvesting"
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', px: 4 }}>
                    <CircularProgress />
                </Box>
            </>
        );
    }

    // Error state
    if (error && !dateRange) {
        return (
            <>
                <PageHeader
                    title="Water Report"
                    subtitle="Monitor and analyze water consumption and rainwater harvesting"
                />
                <Box sx={{ px: 4, mt: 4 }}>
                    <Alert severity="error">Error loading data: {error}</Alert>
                </Box>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Water Report"
                subtitle="Monitor and analyze water consumption and rainwater harvesting"
                showExportButton={true}
                onExport={() => setExportDialogOpen(true)}
            />

            {/* Export Report Dialog */}
            <ExportReportDialog
                open={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                reportType="Water"
                reportTitle="Water Report"
            />

            <Box data-export-content sx={{ px: 4, py: 3 }}>
                {/* Disclaimer */}
                <Disclaimer />

                {/* Time Filter */}
                <TimeFilter
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    onApply={handleApplyFilter}
                    dateRange={getCurrentDateRange()}
                    loading={loading}
                />

                {/* Main Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab
                            label="Rainwater Harvesting"
                            value={TAB_TYPES.RAINWATER}
                        />
                        <Tab
                            label="Hot Water Consumption"
                            value={TAB_TYPES.HOT_WATER}
                        />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                {activeTab === TAB_TYPES.RAINWATER && (
                    <RainwaterTab
                        data={rainwaterData}
                        loading={loading}
                        dateTo={dateTo}
                        forecast={rainwaterForecast}
                        forecastLoading={loading}
                        forecastError={error}
                        onLoadForecast={loadRainwaterForecast}
                    />
                )}
                {activeTab === TAB_TYPES.HOT_WATER && (
                    <HotWaterTab
                        data={hotWaterData}
                        loading={loading}
                        dateTo={dateTo}
                        forecast={hotWaterForecast}
                        forecastLoading={loading}
                        forecastError={error}
                        onLoadForecast={loadHotWaterForecast}
                    />
                )}
            </Box>
        </>
    );
};

export default WaterReportPage;
