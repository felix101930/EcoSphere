// Custom Calculator Component - Isolated for better performance
import { useState } from 'react';
import { Box, Typography, TextField, Button, Select, MenuItem, FormControl } from '@mui/material';
import { Line } from 'react-chartjs-2';

const CustomCalculator = ({ emissionFactor }) => {
  // Get current year for default
  const currentYear = new Date().getFullYear();
  
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

  const handleUpdateEntry = (id, field, value) => {
    const updatedEntries = customEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    
    // Check for duplicates if year or month changed
    if (field === 'year' || field === 'month') {
      const currentEntry = updatedEntries.find(e => e.id === id);
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
    setChartData(prepareCustomChartData(validEntries));
    setShowCustomChart(true);
  };

  const handleClearCustomData = () => {
    setCustomEntries([{ id: 1, year: currentYear.toString(), month: 'January', usage: '' }]);
    setShowCustomChart(false);
    setChartData(null);
  };

  const prepareCustomChartData = (validEntries) => {
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const allData = validEntries.map(entry => {
      const monthIndex = monthOrder.indexOf(entry.month);
      const usage = parseFloat(entry.usage);
      return {
        label: `${entry.year.slice(2)}/${monthIndex + 1}`,
        sortKey: `${entry.year}-${String(monthIndex + 1).padStart(2, '0')}`,
        usage: usage,
        carbon: usage * emissionFactor
      };
    });

    allData.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return {
      labels: allData.map(d => d.label),
      datasets: [
        {
          label: 'Consumption (kWh)',
          data: allData.map(d => d.usage),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Carbon Footprint (kg CO₂e)',
          data: allData.map(d => d.carbon),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const customChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: false,
          boxWidth: 50,
          boxHeight: 2,
          padding: 15
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Consumption (kWh)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Carbon Footprint (kg CO₂e)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    }
  };



  return (
    <Box sx={{ mb: 3, p: 3, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#666', mb: 3 }}>
        Custom Calculation (based on monthly electricity bills)
      </Typography>

      {/* Input Section */}
      <Box sx={{ p: 3, bgcolor: '#F9F9F9', borderRadius: 1, mb: 3 }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120, fontWeight: 600 }}>Year</Typography>
          <Typography variant="body2" sx={{ minWidth: 150, fontWeight: 600 }}>Month</Typography>
          <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>Electricity usage</Typography>
          <Box sx={{ width: 80 }}></Box>
        </Box>

        {/* Input Rows */}
        {customEntries.map((entry, index) => (
          <Box key={entry.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={entry.year}
                onChange={(e) => handleUpdateEntry(entry.id, 'year', e.target.value)}
                sx={{ bgcolor: 'white' }}
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                  <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={entry.month}
                onChange={(e) => handleUpdateEntry(entry.id, 'month', e.target.value)}
                sx={{ bgcolor: 'white' }}
              >
                {['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                  <MenuItem key={month} value={month}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="number"
              value={entry.usage}
              onChange={(e) => handleUpdateEntry(entry.id, 'usage', e.target.value)}
              placeholder="0000"
              InputProps={{
                endAdornment: <Typography variant="body2" sx={{ color: '#999' }}>kWh</Typography>,
                sx: { 
                  bgcolor: 'white',
                  // Hide number input arrows
                  '& input[type=number]': {
                    MozAppearance: 'textfield'
                  },
                  '& input[type=number]::-webkit-outer-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                  }
                }
              }}
              sx={{ flex: 1 }}
            />

            <Button
              variant="contained"
              onClick={handleAddCustomEntry}
              disabled={index !== customEntries.length - 1}
              sx={{
                bgcolor: '#1976D2',
                color: 'white',
                minWidth: 80,
                textTransform: 'none',
                '&:hover': { bgcolor: '#1565C0' },
                '&:disabled': { bgcolor: '#E0E0E0', color: '#999' }
              }}
            >
              Add
            </Button>
          </Box>
        ))}
      </Box>

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

      {/* Custom Chart */}
      {showCustomChart && chartData && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#666' }}>
            Carbon Footprint (kg CO₂e) & Electricity Consumption (kWh)
          </Typography>
          <Box sx={{ height: 400, mt: 2 }}>
            <Line data={chartData} options={customChartOptions} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CustomCalculator;
