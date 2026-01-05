// Carbon Footprint Page - Main container for carbon footprint visualization
import { Box, CircularProgress, Alert } from '@mui/material';
import PageHeader from '../components/Common/PageHeader';
import TimePresetSelector from '../components/CarbonFootprint/TimePresetSelector';
import AutomaticCalculationView from '../components/CarbonFootprint/AutomaticCalculationView';
import CustomCalculator from '../components/CarbonFootprint/CustomCalculator';
import useCarbonFootprintData from '../lib/hooks/useCarbonFootprintData';
import { CARBON_INTENSITY, TIME_PRESETS } from '../lib/constants/carbonFootprint';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function CarbonFootprintPage() {
  // Use custom hook for data management
  const {
    timePreset,
    setTimePreset,
    dateRange,
    setDateRange,
    loading,
    error,
    consumptionData,
    carbonIntensity,
    isSingleDay,
    reload
  } = useCarbonFootprintData();

  // Handle custom date apply
  const handleApplyCustomDates = () => {
    reload();
  };

  // Handle date changes for custom preset
  const handleDateFromChange = (newDate) => {
    setDateRange({ ...dateRange, from: newDate });
  };

  const handleDateToChange = (newDate) => {
    setDateRange({ ...dateRange, to: newDate });
  };

  // Calculate average emission factor from carbon intensity data
  const getAverageEmissionFactor = () => {
    if (!carbonIntensity || Object.keys(carbonIntensity).length === 0) {
      return CARBON_INTENSITY.DEFAULT;
    }

    const intensities = Object.values(carbonIntensity);
    const avgIntensity = intensities.reduce((sum, item) => sum + item.carbonIntensity, 0) / intensities.length;
    return avgIntensity / 1000; // Convert g/kWh to kg/kWh
  };

  const emissionFactor = getAverageEmissionFactor();

  if (loading && !consumptionData) {
    return (
      <>
        <PageHeader
          title="Carbon Footprint Calculator"
          subtitle="Monitor and analyze your carbon emissions based on electricity consumption"
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', px: 4 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Carbon Footprint Calculator"
          subtitle="Monitor and analyze your carbon emissions based on electricity consumption"
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
        title="Carbon Footprint Calculator"
        subtitle="Monitor and analyze your carbon emissions based on electricity consumption"
      />

      <Box sx={{ px: 4, py: 3 }}>
        {/* Time Preset Selector */}
        <TimePresetSelector
          preset={timePreset}
          onPresetChange={setTimePreset}
          dateFrom={dateRange.from}
          dateTo={dateRange.to}
          onDateFromChange={handleDateFromChange}
          onDateToChange={handleDateToChange}
          onApply={handleApplyCustomDates}
          loading={loading}
        />

        {/* Automatic Calculation View (From Database) */}
        <AutomaticCalculationView
          data={consumptionData}
          carbonIntensity={carbonIntensity}
          isSingleDay={isSingleDay}
        />

        {/* Custom Calculator (User Input) */}
        <CustomCalculator
          emissionFactor={emissionFactor}
        />
      </Box>
    </>
  );
}
