import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Line } from 'react-chartjs-2';

const ReportPreviewDialog = ({ open, onClose, reportData }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!reportData) return null;

  const { parameters, dataSnapshot, generatedAt } = reportData;

  // Prepare chart data from snapshot (for real-time view - hourly data)
  const prepareRealTimeChartData = (data, label1, label2, emissionFactor) => {
    if (!data || data.length === 0) return null;

    const labels = data.map(record => {
      const date = new Date(record.ts.replace(' ', 'T'));
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    });

    const values = data.map(record => record.value / 1000); // Convert to kWh
    const carbonValues = values.map(v => v * emissionFactor);

    return {
      labels,
      datasets: [
        {
          label: label1,
          data: values,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: label2,
          data: carbonValues,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    };
  };

  // Prepare aggregated daily chart data (aggregate by day)
  const prepareDailyChartData = (data, label1, label2, emissionFactor) => {
    if (!data || data.length === 0) return null;

    // Aggregate by day
    const dailyMap = new Map();
    data.forEach(record => {
      const date = new Date(record.ts.replace(' ', 'T'));
      const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, totalValue: 0 });
      }
      
      dailyMap.get(dateKey).totalValue += record.value;
    });

    const aggregatedData = Array.from(dailyMap.values());
    const labels = aggregatedData.map(d => d.date);
    const values = aggregatedData.map(d => d.totalValue / 1000); // Convert to kWh
    const carbonValues = values.map(v => v * emissionFactor);

    return {
      labels,
      datasets: [
        {
          label: label1,
          data: values,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: label2,
          data: carbonValues,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  };

  // Prepare aggregated long-term chart data (aggregate by month)
  const prepareLongTermChartData = (data, label1, label2, emissionFactor) => {
    if (!data || data.length === 0) return null;

    // Aggregate by month
    const monthlyMap = new Map();
    data.forEach(record => {
      const date = new Date(record.ts.replace(' ', 'T'));
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { date: monthKey, totalValue: 0 });
      }
      
      monthlyMap.get(monthKey).totalValue += record.value;
    });

    const aggregatedData = Array.from(monthlyMap.values());
    const labels = aggregatedData.map(d => d.date);
    const values = aggregatedData.map(d => d.totalValue / 1000); // Convert to kWh
    const carbonValues = values.map(v => v * emissionFactor);

    return {
      labels,
      datasets: [
        {
          label: label1,
          data: values,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: label2,
          data: carbonValues,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };
  };

  // Prepare custom calculation chart data (monthly data with YY/M format)
  const prepareCustomChartData = (data, label1, label2, emissionFactor) => {
    if (!data || data.length === 0) return null;

    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Sort data by year and month
    const sortedData = [...data].sort((a, b) => {
      if (a.year !== b.year) {
        return parseInt(a.year) - parseInt(b.year);
      }
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    // Create labels in YY/M format
    const labels = sortedData.map(entry => {
      const monthIndex = monthOrder.indexOf(entry.month);
      return `${entry.year.slice(2)}/${monthIndex + 1}`;
    });

    const values = sortedData.map(entry => entry.usage || (entry.value / 1000));
    const carbonValues = values.map(v => v * emissionFactor);

    return {
      labels,
      datasets: [
        {
          label: 'Consumption (kWh)',
          data: values,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Carbon Footprint (kg CO₂e)',
          data: carbonValues,
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
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
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

  const emissionFactor = parameters?.emissionFactor || 0.65;

  // Helper function to calculate total energy
  const calculateTotalEnergy = (data) => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, record) => sum + (record.value / 1000), 0);
  };

  const realTimeChartData = prepareRealTimeChartData(
    dataSnapshot?.realTimeData,
    'Energy Consumption (kWh)',
    'Carbon Footprint (kg CO2)',
    emissionFactor
  );

  const dailyChartData = prepareDailyChartData(
    dataSnapshot?.dailyData,
    'Energy Consumption (kWh)',
    'Carbon Footprint (kg CO2)',
    emissionFactor
  );

  const longTermChartData = prepareLongTermChartData(
    dataSnapshot?.longTermData,
    'Energy Consumption (kWh)',
    'Carbon Footprint (kg CO2)',
    emissionFactor
  );

  const customChartData = prepareCustomChartData(
    dataSnapshot?.customCalculation?.data,
    'Energy Consumption (kWh)',
    'Carbon Footprint (kg CO2)',
    emissionFactor
  );

  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      const contentElement = document.querySelector('[data-report-preview-content]');
      if (!contentElement) {
        throw new Error('Content area not found');
      }

      const canvas = await html2canvas(contentElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add GBTAC header
      pdf.setFontSize(20);
      pdf.setTextColor(218, 41, 28);
      pdf.text('GBTAC - Carbon Footprint Report', 20, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const date = new Date(generatedAt);
      const dateStr = date.toLocaleDateString('en-CA');
      const timeStr = date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
      pdf.text(`Generated on: ${dateStr} ${timeStr}`, 20, 30);
      
      // Add content image
      const imgData = canvas.toDataURL('image/png');
      let position = 40; // Start below header
      
      // Add image to PDF (handle multiple pages if needed)
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth - 20, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 40;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth - 20, imgHeight);
        heightLeft -= pageHeight;
      }

      const timeForFilename = timeStr.replace(':', '-');
      const filename = `Carbon_Footprint_Report_${dateStr}_${timeForFilename}.pdf`;
      pdf.save(filename);
      
      // Close dialog after successful download
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#DA291C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component="span">
          Report Preview
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box data-report-preview-content>
          {/* Data Source Info */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              📊 Data Source
            </Typography>
            <Typography variant="body2">• Electricity Maps API</Typography>
            <Typography variant="body2">• Location: {parameters?.carbonIntensity?.location || 'Alberta, Calgary'}</Typography>
            <Typography variant="body2">• Current Intensity: {parameters?.carbonIntensity?.value || 'N/A'} g CO2/kWh</Typography>
            <Typography variant="body2">• Status: {parameters?.carbonIntensity?.isFallback ? '⚠️ Using Fallback' : '✅ Live Data'}</Typography>
          </Box>

          {/* Real-time View */}
          {realTimeChartData && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="h5" gutterBottom>
                Real-time View (Today)
              </Typography>
              {dataSnapshot?.realTimeData && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Records: {dataSnapshot.realTimeData.length} | 
                  Total Energy: {calculateTotalEnergy(dataSnapshot.realTimeData).toFixed(2)} kWh | 
                  Carbon Footprint: {(calculateTotalEnergy(dataSnapshot.realTimeData) * emissionFactor).toFixed(2)} kg CO2
                </Typography>
              )}
              <Box sx={{ height: 300, mt: 2 }}>
                <Line data={realTimeChartData} options={chartOptions} />
              </Box>
            </Box>
          )}

          {/* Daily View */}
          {dailyChartData && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="h5" gutterBottom>
                Daily View
              </Typography>
              {dataSnapshot?.dailyData && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Records: {dataSnapshot.dailyData.length} | 
                  Total Energy: {calculateTotalEnergy(dataSnapshot.dailyData).toFixed(2)} kWh | 
                  Carbon Footprint: {(calculateTotalEnergy(dataSnapshot.dailyData) * emissionFactor).toFixed(2)} kg CO2
                </Typography>
              )}
              <Box sx={{ height: 300, mt: 2 }}>
                <Line data={dailyChartData} options={chartOptions} />
              </Box>
            </Box>
          )}

          {/* Long-term View */}
          {longTermChartData && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="h5" gutterBottom>
                Long-term View (Last 12 Months)
              </Typography>
              {dataSnapshot?.longTermData && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Records: {dataSnapshot.longTermData.length} | 
                  Total Energy: {calculateTotalEnergy(dataSnapshot.longTermData).toFixed(2)} kWh | 
                  Carbon Footprint: {(calculateTotalEnergy(dataSnapshot.longTermData) * emissionFactor).toFixed(2)} kg CO2
                </Typography>
              )}
              <Box sx={{ height: 300, mt: 2 }}>
                <Line data={longTermChartData} options={chartOptions} />
              </Box>
            </Box>
          )}

          {/* Custom Calculation */}
          {customChartData && dataSnapshot?.customCalculation?.data && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="h5" gutterBottom sx={{ color: '#666', mb: 3 }}>
                Custom Calculation (based on monthly electricity bills)
              </Typography>

              {/* Input Table */}
              <Box sx={{ p: 3, bgcolor: '#F9F9F9', borderRadius: 1, mb: 3 }}>
                {/* Header Row */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 1, borderBottom: '2px solid #ddd' }}>
                  <Typography variant="body2" sx={{ minWidth: 120, fontWeight: 600 }}>Year</Typography>
                  <Typography variant="body2" sx={{ minWidth: 150, fontWeight: 600 }}>Month</Typography>
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>Electricity usage</Typography>
                </Box>

                {/* Data Rows */}
                {dataSnapshot.customCalculation.data.map((entry, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ minWidth: 120 }}>{entry.year}</Typography>
                    <Typography variant="body2" sx={{ minWidth: 150 }}>{entry.month}</Typography>
                    <Typography variant="body2" sx={{ flex: 1 }}>{entry.usage} kWh</Typography>
                  </Box>
                ))}
              </Box>

              {/* Chart Title */}
              <Typography variant="h6" gutterBottom sx={{ color: '#666', mt: 3, mb: 2 }}>
                Carbon Footprint (kg CO₂e) & Electricity Consumption (kWh)
              </Typography>

              {/* Chart */}
              <Box sx={{ height: 300, mt: 2 }}>
                <Line data={customChartData} options={customChartOptions} />
              </Box>
            </Box>
          )}
        </Box>

        {isGenerating && (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2">Generating PDF...</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isGenerating}>
          Close
        </Button>
        <Button
          onClick={downloadPDF}
          disabled={isGenerating}
          startIcon={<DownloadIcon />}
          variant="contained"
          sx={{
            bgcolor: '#DA291C',
            '&:hover': {
              bgcolor: '#A6192E'
            }
          }}
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportPreviewDialog;
