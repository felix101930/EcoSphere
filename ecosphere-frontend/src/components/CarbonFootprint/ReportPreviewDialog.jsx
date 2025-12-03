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
import { 
  prepareRealTimeChartData, 
  prepareDailyChartData, 
  prepareLongTermChartData, 
  prepareCustomChartData,
  calculateTotalEnergy 
} from '../../utils/chartDataPreparation';
import { standardChartOptions, dualAxisChartOptions } from '../../utils/chartOptions';

const ReportPreviewDialog = ({ open, onClose, reportData }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!reportData) return null;

  const { parameters, dataSnapshot, generatedAt } = reportData;
  const emissionFactor = parameters?.emissionFactor || 0.65;

  // Prepare chart data using utility functions
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
  const customChartData = prepareCustomChartData(dataSnapshot?.customCalculation?.data, emissionFactor);

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

      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add GBTAC header
      pdf.setFontSize(20);
      pdf.setTextColor(218, 41, 28);
      pdf.text('GBTAC - Carbon Footprint Report', 20, 10);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const date = new Date(generatedAt);
      const dateStr = date.toLocaleDateString('en-CA');
      const timeStr = date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
      pdf.text(`Generated on: ${dateStr} ${timeStr}`, 20, 20);
      
      // Add content image
      const imgData = canvas.toDataURL('image/png');
      const headerHeight = 30; // Height reserved for header on first page
      const availableHeightFirstPage = pageHeight - headerHeight; // Available height on first page
      
      // Calculate the scaled image dimensions
      const scaledImgWidth = imgWidth - 20; // 190mm (with 10mm margins on each side)
      const scaledImgHeight = imgHeight;
      
      // Add first page - show as much as fits
      pdf.addImage(imgData, 'PNG', 10, headerHeight, scaledImgWidth, scaledImgHeight);
      
      // Only add subsequent pages if content is longer than first page
      if (scaledImgHeight > availableHeightFirstPage) {
        let yOffset = availableHeightFirstPage; // Start from where first page ended
        
        while (yOffset < scaledImgHeight) {
          pdf.addPage();
          // Position the image so the next section is visible
          pdf.addImage(imgData, 'PNG', 10, -yOffset, scaledImgWidth, scaledImgHeight);
          yOffset += pageHeight;
        }
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
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            maxHeight: '90vh',
            width: '85vw',
            maxWidth: '85vw'
          }
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

      <DialogContent sx={{ p: 4 }}>
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
                <Line data={realTimeChartData} options={standardChartOptions} />
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
                <Line data={dailyChartData} options={standardChartOptions} />
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
                <Line data={longTermChartData} options={standardChartOptions} />
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
                <Line data={customChartData} options={dualAxisChartOptions} />
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
