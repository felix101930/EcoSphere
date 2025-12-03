// Carbon Footprint Page - Main container for carbon footprint visualization
import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, TextField, Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HistoryIcon from '@mui/icons-material/History';
import { Line } from 'react-chartjs-2';
import PageHeader from '../components/Common/PageHeader';
import CustomCalculator from '../components/CarbonFootprint/CustomCalculator';
import ExportReportDialog from '../components/CarbonFootprint/ExportReportDialog';
import ReportLogDialog from '../components/CarbonFootprint/ReportLogDialog';
import ReportPreviewDialog from '../components/CarbonFootprint/ReportPreviewDialog';
import CarbonFootprintReportService from '../services/CarbonFootprintReportService';
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
  
  // Date range for Daily View - use data's actual date range
  // Since our mock data ends at 2025-12-02, we'll use that as the default end date
  const dataEndDate = new Date('2025-12-02');
  const dataStartDate = new Date('2025-11-22'); // 10 days before end date
  
  // Format date as YYYY-MM-DD using local timezone
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [fromDate, setFromDate] = useState(formatLocalDate(dataStartDate));
  const [toDate, setToDate] = useState(formatLocalDate(dataEndDate));

  // State for Daily View loading
  const [dailyLoading, setDailyLoading] = useState(false);
  
  // State for Export Dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // State for Report Log Dialog
  const [reportLogOpen, setReportLogOpen] = useState(false);
  
  // State for Report Preview Dialog
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // State for Custom Calculator Data
  const [customCalculatorData, setCustomCalculatorData] = useState(null);

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

        // Use data's actual date range for initial load
        const dataEndDate = new Date('2025-12-02');
        const dataStartDate = new Date('2025-11-22');
        
        const formatLocalDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        const initialFromDate = formatLocalDate(dataStartDate);
        const initialToDate = formatLocalDate(dataEndDate);

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
    setExportDialogOpen(true);
  };

  // Memoize emission factor calculation
  const emissionFactor = useMemo(() => {
    return carbonIntensity ? ElectricityMapsService.getCarbonIntensityInKg(carbonIntensity) : 0.65;
  }, [carbonIntensity]);

  // Memoize aggregated daily data
  const aggregatedDailyData = useMemo(() => {
    const dailyMap = new Map();
    
    dailyData.forEach(record => {
      const date = new Date(record.ts.replace(' ', 'T'));
      const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, totalValue: 0 });
      }
      
      dailyMap.get(dateKey).totalValue += record.value;
    });
    
    return Array.from(dailyMap.values());
  }, [dailyData]);

  // Memoize aggregated long-term data
  const aggregatedLongTermData = useMemo(() => {
    const monthlyMap = new Map();
    
    longTermData.forEach(record => {
      const date = new Date(record.ts.replace(' ', 'T'));
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { date: monthKey, totalValue: 0 });
      }
      
      monthlyMap.get(monthKey).totalValue += record.value;
    });
    
    return Array.from(monthlyMap.values());
  }, [longTermData]);

  // Memoize real-time chart data
  const realTimeChartData = useMemo(() => ({
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
  }), [realTimeData, emissionFactor]);

  // Memoize daily chart data
  const dailyChartData = useMemo(() => ({
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
  }), [aggregatedDailyData, emissionFactor]);

  // Memoize long-term chart data
  const longTermChartData = useMemo(() => ({
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
  }), [aggregatedLongTermData, emissionFactor]);

  // Memoize chart options
  const chartOptions = useMemo(() => ({
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
  }), []);

  if (loading) {
    return (
      <>
        <PageHeader 
          title="Carbon Footprint Calculator" 
          subtitle="Monitor and analyze your carbon emissions"
          showReportLogButton={true}
          onReportLog={() => setReportLogOpen(true)}
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
          showReportLogButton={true}
          onReportLog={() => setReportLogOpen(true)}
          showExportButton={true}
          onExport={handleExport}
        />
        <Box sx={{ px: 4, mt: 4 }}>
          <Alert severity="error">Error loading data: {error}</Alert>
        </Box>
      </>
    );
  }

  return (
    <>
      {/* Export Report Dialog */}
      <ExportReportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        reportData={{
          parameters: {
            dateRange: {
              from: fromDate,
              to: toDate
            },
            emissionFactor,
            carbonIntensity
          },
          dataSnapshot: {
            realTimeData,
            dailyData,
            longTermData,
            customCalculation: customCalculatorData || {
              hasData: false
            }
          },
          metadata: {
            description: 'Carbon Footprint Report'
          }
        }}
        onReportSaved={(reportData) => {
          // Save report to database after export
          console.log('onReportSaved called with data:', reportData);
          CarbonFootprintReportService.createReport(reportData)
            .then((response) => {
              console.log('Report saved successfully:', response);
            })
            .catch(err => {
              console.error('Error saving report:', err);
              console.error('Error details:', err.response?.data);
            });
        }}
      />
      
      {/* Report Log Dialog */}
      <ReportLogDialog
        open={reportLogOpen}
        onClose={() => setReportLogOpen(false)}
        onPreviewReport={(report) => {
          setSelectedReport(report);
          setReportPreviewOpen(true);
          setReportLogOpen(false);
        }}
      />
      
      {/* Report Preview Dialog */}
      <ReportPreviewDialog
        open={reportPreviewOpen}
        onClose={() => {
          setReportPreviewOpen(false);
          setSelectedReport(null);
        }}
        reportData={selectedReport}
      />
      
      <PageHeader 
        title="Carbon Footprint Calculator" 
        subtitle="Monitor and analyze your carbon emissions"
        showReportLogButton={true}
        onReportLog={() => setReportLogOpen(true)}
        showExportButton={true}
        onExport={handleExport}
      />
      
      {/* Main content area for export */}
      <Box data-export-content sx={{ px: 4, py: 3 }}>
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
              inputProps={{
                max: formatLocalDate(new Date()) // Cannot select future dates
              }}
              slotProps={{
                input: {
                  sx: {
                    bgcolor: 'white',
                    fontFamily: 'DM Sans, sans-serif'
                  }
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
              inputProps={{
                max: formatLocalDate(new Date()) // Cannot select future dates
              }}
              slotProps={{
                input: {
                  sx: {
                    bgcolor: 'white',
                    fontFamily: 'DM Sans, sans-serif'
                  }
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

      {/* Custom Calculator */}
      <CustomCalculator 
        emissionFactor={emissionFactor} 
        onDataChange={setCustomCalculatorData}
      />
      </Box> {/* End of data-export-content */}
    </>
  );
};

export default CarbonFootprintPage;
