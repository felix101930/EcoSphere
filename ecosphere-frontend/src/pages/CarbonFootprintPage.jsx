// Carbon Footprint Page - Main container for carbon footprint visualization
import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, TextField, Button } from '@mui/material';
import { Line } from 'react-chartjs-2';
import PageHeader from '../components/Common/PageHeader';
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
import ElectricityService from '../services/ElectricityService';
import ElectricityMapsService from '../services/ElectricityMapsService';

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

const CarbonFootprintPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carbonIntensity, setCarbonIntensity] = useState(null);
  const [realTimeData, setRealTimeData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [longTermData, setLongTermData] = useState([]);
  
  // Date range for Daily View
  const today = new Date();
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(today.getDate() - 10);
  
  const [fromDate, setFromDate] = useState(tenDaysAgo.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);

  // State for Daily View loading
  const [dailyLoading, setDailyLoading] = useState(false);

  // Function to load daily data by date range
  const loadDailyData = async () => {
    try {
      setDailyLoading(true);
      const daily = await ElectricityService.getDataByRange(fromDate, toDate);
      setDailyData(daily);
      setDailyLoading(false);
    } catch (err) {
      console.error('Error loading daily data:', err);
      setError(err.message);
      setDailyLoading(false);
    }
  };

  // Handle Generate button click
  const handleGenerateDailyReport = () => {
    loadDailyData();
  };

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate initial date range
        const today = new Date();
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(today.getDate() - 10);
        const initialFromDate = tenDaysAgo.toISOString().split('T')[0];
        const initialToDate = today.toISOString().split('T')[0];

        // Fetch carbon intensity from Electricity Maps API
        const intensity = await ElectricityMapsService.getCurrentCarbonIntensity();
        setCarbonIntensity(intensity);

        // Fetch electricity data
        const [realTime, daily, longTerm] = await Promise.all([
          ElectricityService.getRealTimeData(),
          ElectricityService.getDataByRange(initialFromDate, initialToDate),
          ElectricityService.getLongTermData()
        ]);

        setRealTimeData(realTime);
        setDailyData(daily);
        setLongTermData(longTerm);

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Only load once on mount

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting report...');
    alert('Export functionality coming soon!');
  };

  if (loading) {
    return (
      <>
        <PageHeader 
          title="Carbon Footprint Calculator" 
          subtitle="Monitor and analyze your carbon emissions"
          showExportButton={true}
          onExport={handleExport}
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
          subtitle="Monitor and analyze your carbon emissions"
          showExportButton={true}
          onExport={handleExport}
        />
        <Box sx={{ px: 4, mt: 4 }}>
          <Alert severity="error">Error loading data: {error}</Alert>
        </Box>
      </>
    );
  }

  const emissionFactor = carbonIntensity ? ElectricityMapsService.getCarbonIntensityInKg(carbonIntensity) : 0.65;

  // Helper function to aggregate data by day
  const aggregateByDay = (data) => {
    const dailyMap = new Map();
    
    data.forEach(record => {
      const date = new Date(record.ts.replace(' ', 'T'));
      const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, totalValue: 0 });
      }
      
      dailyMap.get(dateKey).totalValue += record.value;
    });
    
    return Array.from(dailyMap.values());
  };

  // Helper function to aggregate data by month
  const aggregateByMonth = (data) => {
    const monthlyMap = new Map();
    
    data.forEach(record => {
      const date = new Date(record.ts.replace(' ', 'T'));
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { date: monthKey, totalValue: 0 });
      }
      
      monthlyMap.get(monthKey).totalValue += record.value;
    });
    
    return Array.from(monthlyMap.values());
  };

  // Aggregate daily and long-term data
  const aggregatedDailyData = aggregateByDay(dailyData);
  const aggregatedLongTermData = aggregateByMonth(longTermData);

  // Prepare chart data for Real-time View
  const realTimeChartData = {
    labels: realTimeData.map(record => {
      const date = new Date(record.ts.replace(' ', 'T'));
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      {
        label: 'Energy Consumption (kWh)',
        data: realTimeData.map(record => ElectricityService.convertToKWh(record.value)),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Carbon Footprint (kg CO2)',
        data: realTimeData.map(record => ElectricityService.convertToKWh(record.value) * emissionFactor),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  };

  // Prepare chart data for Daily View (aggregated by day)
  const dailyChartData = {
    labels: aggregatedDailyData.map(record => record.date),
    datasets: [
      {
        label: 'Energy Consumption (kWh)',
        data: aggregatedDailyData.map(record => ElectricityService.convertToKWh(record.totalValue)),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Carbon Footprint (kg CO2)',
        data: aggregatedDailyData.map(record => ElectricityService.convertToKWh(record.totalValue) * emissionFactor),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  // Prepare chart data for Long-term View (aggregated by month)
  const longTermChartData = {
    labels: aggregatedLongTermData.map(record => record.date),
    datasets: [
      {
        label: 'Energy Consumption (kWh)',
        data: aggregatedLongTermData.map(record => ElectricityService.convertToKWh(record.totalValue)),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7
      },
      {
        label: 'Carbon Footprint (kg CO2)',
        data: aggregatedLongTermData.map(record => ElectricityService.convertToKWh(record.totalValue) * emissionFactor),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  // Chart options for Real-time and Daily views (no zoom)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
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
        beginAtZero: true
      }
    }
  };



  return (
    <>
      <PageHeader 
        title="Carbon Footprint Calculator" 
        subtitle="Monitor and analyze your carbon emissions"
        showExportButton={true}
        onExport={handleExport}
      />
      <Box sx={{ px: 4, py: 3 }}>
        {/* API Status Card */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          📊 Data Source
        </Typography>
        <Typography variant="body2">
          • Electricity Maps API
        </Typography>
        <Typography variant="body2">
          • Location: Alberta, Calgary
        </Typography>
        <Typography variant="body2">
          • Current Intensity: {carbonIntensity?.carbonIntensity || 'N/A'} g CO2/kWh
        </Typography>
        <Typography variant="body2">
          • Last Updated: {carbonIntensity?.fetchedAt ? new Date(carbonIntensity.fetchedAt).toLocaleTimeString() : 'N/A'}
        </Typography>
        <Typography variant="body2">
          • Status: {carbonIntensity?.isFallback ? '⚠️ Using Fallback' : '✅ Live Data'}
        </Typography>
      </Box>

      {/* Real-time View */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="h5" gutterBottom>
          Real-time View (Today)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Records: {realTimeData.length} | 
          Total Energy: {ElectricityService.calculateTotalEnergy(realTimeData).toFixed(2)} kWh | 
          Carbon Footprint: {(ElectricityService.calculateTotalEnergy(realTimeData) * emissionFactor).toFixed(2)} kg CO2
        </Typography>
        <Box sx={{ height: 300, mt: 2 }}>
          {realTimeData.length > 0 ? (
            <Line data={realTimeChartData} options={chartOptions} />
          ) : (
            <Typography variant="body2" color="text.secondary">No data available</Typography>
          )}
        </Box>
      </Box>

      {/* Daily View */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="h5" gutterBottom>
          Daily View
        </Typography>
        
        {/* Date Range Selector */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 2,
          p: 2,
          bgcolor: '#F5F5F5',
          borderRadius: 1
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              From
            </Typography>
            <TextField
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                sx: {
                  bgcolor: 'white',
                  fontFamily: 'DM Sans, sans-serif'
                }
              }}
            />
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              To
            </Typography>
            <TextField
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                sx: {
                  bgcolor: 'white',
                  fontFamily: 'DM Sans, sans-serif'
                }
              }}
            />
          </Box>
          
          <Box sx={{ alignSelf: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleGenerateDailyReport}
              disabled={dailyLoading}
              sx={{
                bgcolor: '#DA291C',
                color: 'white',
                px: 4,
                py: 1,
                fontFamily: 'Titillium Web, sans-serif',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#A6192E'
                },
                '&:disabled': {
                  bgcolor: '#CCC',
                  color: '#666'
                }
              }}
            >
              {dailyLoading ? 'Generating...' : 'Generate'}
            </Button>
          </Box>
        </Box>
        
        {/* Loading State for Daily View */}
        {dailyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, mt: 2 }}>
            <CircularProgress sx={{ color: '#DA291C' }} />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Records: {dailyData.length} | 
              Total Energy: {ElectricityService.calculateTotalEnergy(dailyData).toFixed(2)} kWh | 
              Carbon Footprint: {(ElectricityService.calculateTotalEnergy(dailyData) * emissionFactor).toFixed(2)} kg CO2
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              {dailyData.length > 0 ? (
                <Line data={dailyChartData} options={chartOptions} />
              ) : (
                <Typography variant="body2" color="text.secondary">No data available</Typography>
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Long-term View */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="h5" gutterBottom>
          Long-term View (Last 12 Months)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Records: {longTermData.length} | 
          Total Energy: {ElectricityService.calculateTotalEnergy(longTermData).toFixed(2)} kWh | 
          Carbon Footprint: {(ElectricityService.calculateTotalEnergy(longTermData) * emissionFactor).toFixed(2)} kg CO2
        </Typography>
        <Box sx={{ height: 300, mt: 2 }}>
          {longTermData.length > 0 ? (
            <Line data={longTermChartData} options={chartOptions} />
          ) : (
            <Typography variant="body2" color="text.secondary">No data available</Typography>
          )}
        </Box>
      </Box>
      </Box>
    </>
  );
};

export default CarbonFootprintPage;
