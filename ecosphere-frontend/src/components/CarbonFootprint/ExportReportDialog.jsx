import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PreviewIcon from '@mui/icons-material/Preview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportReportDialog = ({ open, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      // Find the main content area (excluding sidebar and AI panel)
      const contentElement = document.querySelector('[data-export-content]');
      if (!contentElement) {
        throw new Error('Content area not found');
      }

      // Hide Custom Calculator if it has no content
      const customCalc = document.querySelector('[data-custom-calculator]');
      const hasContent = customCalc?.getAttribute('data-has-content') === 'true';
      const originalDisplay = customCalc?.style.display;
      if (customCalc && !hasContent) {
        customCalc.style.display = 'none';
      }

      // Create canvas from the content
      const canvas = await html2canvas(contentElement, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Restore Custom Calculator display
      if (customCalc && !hasContent) {
        customCalc.style.display = originalDisplay || '';
      }

      // Create preview URL
      const previewDataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(previewDataUrl);
      setIsPreviewMode(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error generating preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      // Find the main content area
      const contentElement = document.querySelector('[data-export-content]');
      if (!contentElement) {
        throw new Error('Content area not found');
      }

      // Hide Custom Calculator if it has no content
      const customCalc = document.querySelector('[data-custom-calculator]');
      const hasContent = customCalc?.getAttribute('data-has-content') === 'true';
      const originalDisplay = customCalc?.style.display;
      if (customCalc && !hasContent) {
        customCalc.style.display = 'none';
      }

      // Create canvas from the content
      const canvas = await html2canvas(contentElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Restore Custom Calculator display
      if (customCalc && !hasContent) {
        customCalc.style.display = originalDisplay || '';
      }

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add GBTAC header
      pdf.setFontSize(20);
      pdf.setTextColor(218, 41, 28); // SAIT red
      pdf.text('GBTAC - Carbon Footprint Report', 20, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const currentDate = new Date().toLocaleDateString('en-CA');
      pdf.text(`Generated on: ${currentDate}`, 20, 30);
      
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

      // Generate filename
      const filename = `Carbon_Footprint_Report_${currentDate}.pdf`;
      
      // Download PDF
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

  const handleClose = () => {
    setPreviewUrl(null);
    setIsPreviewMode(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={isPreviewMode ? 'lg' : 'sm'}
      fullWidth
      PaperProps={{
        sx: {
          minHeight: isPreviewMode ? '80vh' : '300px'
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#DA291C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {isPreviewMode ? 'Report Preview' : 'Export Carbon Footprint Report'}
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!isPreviewMode ? (
          <Box textAlign="center">
            <Typography variant="body1" sx={{ mb: 3 }}>
              Generate a PDF report of your current Carbon Footprint analysis.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The report will include:
            </Typography>
            <Box sx={{ textAlign: 'left', mb: 3, pl: 2 }}>
              <Typography variant="body2">• Data source information</Typography>
              <Typography variant="body2">• Current view charts and data</Typography>
              <Typography variant="body2">• Custom calculations (if any)</Typography>
              <Typography variant="body2">• SAIT branding and timestamp</Typography>
            </Box>
          </Box>
        ) : (
          <Box>
            {previewUrl && (
              <Box
                sx={{
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  overflow: 'hidden',
                  maxHeight: '60vh',
                  overflowY: 'auto'
                }}
              >
                <img
                  src={previewUrl}
                  alt="Report Preview"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </Box>
            )}
          </Box>
        )}

        {isGenerating && (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2">
              {isPreviewMode ? 'Generating PDF...' : 'Generating preview...'}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={isGenerating}>
          Cancel
        </Button>
        
        {!isPreviewMode ? (
          <>
            <Button
              onClick={generatePreview}
              disabled={isGenerating}
              startIcon={<PreviewIcon />}
              variant="outlined"
              sx={{
                borderColor: '#DA291C',
                color: '#DA291C',
                '&:hover': {
                  borderColor: '#A6192E',
                  bgcolor: 'rgba(218, 41, 28, 0.04)'
                }
              }}
            >
              Preview
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
          </>
        ) : (
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
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExportReportDialog;
