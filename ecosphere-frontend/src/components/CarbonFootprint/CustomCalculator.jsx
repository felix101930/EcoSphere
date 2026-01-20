// Custom Calculator Component - Main container for custom calculations
import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import CustomEntryForm from './CustomEntryForm';
import CustomChart from './CustomChart';
import { prepareCustomChartData } from '../../utils/chartDataPreparation';

const CustomCalculator = ({ emissionFactor }) => {
  // Get current year and month for validation (user's local time)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Generate available years (only up to current year)
  const availableYears = [];
  for (let year = 2020; year <= currentYear; year++) {
    availableYears.push(year.toString());
  }

  // Get available months for a given year
  const getAvailableMonths = (selectedYear) => {
    const year = parseInt(selectedYear);
    if (year < currentYear) {
      return monthNames; // All months available for past years
    } else if (year === currentYear) {
      return monthNames.slice(0, currentMonth + 1); // Only up to current month for current year
    }
    return []; // No months for future years (shouldn't happen)
  };

  const [customEntries, setCustomEntries] = useState([
    { id: 1, year: currentYear.toString(), month: 'January', usage: '' }
  ]);
  const [showCustomChart, setShowCustomChart] = useState(false);
  const [chartData, setChartData] = useState(null); // Snapshot of data for chart

  const handleAddCustomEntry = () => {
    const newId = Math.max(...customEntries.map(e => e.id), 0) + 1;

    // Get the last entry to determine next month
    const lastEntry = customEntries[customEntries.length - 1];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthIndex = months.indexOf(lastEntry.month);

    let nextYear = lastEntry.year;
    let nextMonth = lastEntry.month;

    if (currentMonthIndex === 11) {
      nextMonth = 'January';
      nextYear = (parseInt(lastEntry.year) + 1).toString();
    } else {
      nextMonth = months[currentMonthIndex + 1];
    }

    setCustomEntries([...customEntries, { id: newId, year: nextYear, month: nextMonth, usage: '' }]);
  };

  // Check if a year-month combination is in the future
  const isFutureDate = (year, month) => {
    const selectedYear = parseInt(year);
    const selectedMonthIndex = monthNames.indexOf(month);

    if (selectedYear > currentYear) {
      return true;
    }

    if (selectedYear === currentYear && selectedMonthIndex > currentMonth) {
      return true;
    }

    return false;
  };

  const handleUpdateEntry = (id, field, value) => {
    let updatedEntries = customEntries.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    );

    // If year changed, reset month to first available month
    if (field === 'year') {
      const availableMonths = getAvailableMonths(value);
      if (availableMonths.length > 0) {
        updatedEntries = updatedEntries.map(entry =>
          entry.id === id ? { ...entry, month: availableMonths[0] } : entry
        );
      }
    }

    // Check for duplicates if year or month changed
    if (field === 'year' || field === 'month') {
      const currentEntry = updatedEntries.find(e => e.id === id);

      // Check if selected date is in the future (redundant now, but keep for safety)
      if (isFutureDate(currentEntry.year, currentEntry.month)) {
        alert(`Cannot select future date: ${currentEntry.month} ${currentEntry.year}`);
        return; // Don't update if future date
      }

      const duplicate = updatedEntries.find(e =>
        e.id !== id && e.year === currentEntry.year && e.month === currentEntry.month
      );

      if (duplicate) {
        alert(`${currentEntry.month} ${currentEntry.year} already exists. Please choose a different month or year.`);
        return; // Don't update if duplicate
      }

      // Auto-sort entries by year and month
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      updatedEntries.sort((a, b) => {
        if (a.year !== b.year) {
          return parseInt(a.year) - parseInt(b.year);
        }
        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
      });
    }

    setCustomEntries(updatedEntries);
  };

  const handleGenerateCustomReport = () => {
    const validEntries = customEntries.filter(e => e.usage && parseFloat(e.usage) > 0);
    if (validEntries.length === 0) {
      alert('Please enter at least one valid electricity usage');
      return;
    }

    // Create snapshot of current data for chart
    const chartDataSnapshot = prepareCustomChartData(validEntries, emissionFactor);
    setChartData(chartDataSnapshot);
    setShowCustomChart(true);
  };

  const handleClearCustomData = () => {
    setCustomEntries([{ id: 1, year: currentYear.toString(), month: 'January', usage: '' }]);
    setShowCustomChart(false);
    setChartData(null);
  };

  return (
    <Box
      data-custom-calculator
      data-has-content={showCustomChart ? 'true' : 'false'}
      sx={{ mb: 3, p: 3, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}
    >
      <Typography variant="h5" gutterBottom sx={{ color: '#666', mb: 3 }}>
        Custom Calculation (based on monthly electricity bills)
      </Typography>

      {/* Input Section - Hide in export */}
      <Box data-hide-in-export="true">
        <CustomEntryForm
          customEntries={customEntries}
          onUpdateEntry={handleUpdateEntry}
          onAddEntry={handleAddCustomEntry}
          availableYears={availableYears}
          getAvailableMonths={getAvailableMonths}
        />

        {/* Generate and Clear Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={handleGenerateCustomReport}
            sx={{
              bgcolor: '#DA291C',
              color: 'white',
              px: 8,
              py: 1.5,
              fontSize: '16px',
              fontFamily: 'Titillium Web, sans-serif',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '25px',
              '&:hover': { bgcolor: '#A6192E' }
            }}
          >
            Generate
          </Button>
          <Button
            onClick={handleClearCustomData}
            sx={{
              color: '#666',
              textTransform: 'none',
              textDecoration: 'underline',
              '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
            }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {/* Custom Chart */}
      {showCustomChart && <CustomChart chartData={chartData} />}
    </Box>
  );
};

export default CustomCalculator;
