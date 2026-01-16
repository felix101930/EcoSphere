import { Box, Container, Typography, Fab, CircularProgress, Alert } from '@mui/material';
import { KeyboardArrowUp, Bolt, Water, Thermostat } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import PageHeader from '../components/Common/PageHeader';
import CollapsibleSection from '../components/Common/CollapsibleSection';
import Disclaimer from '../components/Common/Disclaimer';
import TimePresetSelector from '../components/Overview/TimePresetSelector';
import ElectricityOverview from '../components/Overview/ElectricityOverview';
import WaterOverview from '../components/Overview/WaterOverview';
import ThermalOverview from '../components/Overview/ThermalOverview';
import useOverviewData from '../lib/hooks/useOverviewData';

export default function OverviewPage() {
    const {
        timePreset,
        setTimePreset,
        dateRange,
        loading,
        error,
        electricityData,
        waterData,
        thermalData
    } = useOverviewData();

    const [showScrollTop, setShowScrollTop] = useState(false);

    // Handle scroll to top button visibility
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDateRange = () => {
        if (!dateRange.from || !dateRange.to) return '';

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const from = formatDate(dateRange.from);
        const to = formatDate(dateRange.to);

        return from === to ? from : `${from} to ${to}`;
    };

    return (
        <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh', pb: 4 }}>
            <PageHeader
                title="Overview Dashboard"
                subtitle={`Building Performance Summary - ${formatDateRange()}`}
            />

            <Container maxWidth="xl" sx={{ mt: 3 }}>
                {/* Disclaimer */}
                <Disclaimer />

                {/* Time Preset Selector */}
                <TimePresetSelector value={timePreset} onChange={setTimePreset} />

                {/* Loading State */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={60} />
                    </Box>
                )}

                {/* Error State */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Content */}
                {!loading && !error && (
                    <>
                        {/* Electricity Section */}
                        <CollapsibleSection
                            title="Electricity"
                            icon={<Bolt sx={{ color: '#DA291C', fontSize: 28 }} />}
                            defaultExpanded={true}
                        >
                            <ElectricityOverview data={electricityData} />
                        </CollapsibleSection>

                        {/* Water Section */}
                        <CollapsibleSection
                            title="Water"
                            icon={<Water sx={{ color: '#005EB8', fontSize: 28 }} />}
                            defaultExpanded={true}
                        >
                            <WaterOverview data={waterData} />
                        </CollapsibleSection>

                        {/* Thermal Section */}
                        <CollapsibleSection
                            title="Thermal"
                            icon={<Thermostat sx={{ color: '#4CAF50', fontSize: 28 }} />}
                            defaultExpanded={true}
                        >
                            <ThermalOverview data={thermalData} />
                        </CollapsibleSection>
                    </>
                )}

                {/* Scroll to Top Button */}
                {showScrollTop && (
                    <Fab
                        color="primary"
                        size="medium"
                        onClick={scrollToTop}
                        sx={{
                            position: 'fixed',
                            bottom: 24,
                            right: 24,
                            zIndex: 1000
                        }}
                    >
                        <KeyboardArrowUp />
                    </Fab>
                )}
            </Container>
        </Box>
    );
}
