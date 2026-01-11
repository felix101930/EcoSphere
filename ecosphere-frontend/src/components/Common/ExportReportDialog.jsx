// Generic Export Report Dialog - Simplified version (no server storage)
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

const ExportReportDialog = ({ 
  open, 
  onClose, 
  reportType,
  reportTitle
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const contentElement = document.querySelector('[data-export-content]');
      if (!contentElement) {
        throw new Error('Content area not found');
      }

      // Lower scale for smaller file size
      const canvas = await html2canvas(contentElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Use JPEG with compression
      const previewDataUrl = canvas.toDataURL('image/jpeg', 0.85);
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
      const contentElement = document.querySelector('[data-export-content]');
      if (!contentElement) {
        throw new Error('Content area not found');
      }

      // Lower scale for smaller file size (1.5 instead of 2)
      const canvas = await html2canvas(contentElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      
      pdf.setFontSize(20);
      pdf.setTextColor(218, 41, 28);
      pdf.text(`GBTAC - ${reportTitle}`, 20, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-CA');
      const currentTime = now.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
      pdf.text(`Generated on: ${currentDate} ${currentTime}`, 20, 30);
      
      // Use JPEG with compression for smaller file size (0.85 quality)
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      let position = 40;
      
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth - 20, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 40;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth - 20, imgHeight);
        heightLeft -= pageHeight;
      }

      const timeForFilename = currentTime.replace(':', '-');
      const filename = `${reportType}_Report_${currentDate}_${timeForFilename}.pdf`;
      
      // Download PDF to user's computer
      pdf.save(filename);
      
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
      maxWidth={isPreviewMode ? false : 'sm'}
      slotProps={{
        paper: {
          sx: {
            minHeight: isPreviewMode ? '80vh' : '300px',
            ...(isPreviewMode && {
              width: '85vw',
              maxWidth: '85vw'
            })
          }
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#DA291C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component="span">
          {isPreviewMode ? 'Report Preview' : `Export ${reportTitle}`}
        </Box>
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
              Generate a PDF report of your current {reportTitle} analysis.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The report will include:
            </Typography>
            <Box sx={{ textAlign: 'left', mb: 3, pl: 2 }}>
              <Typography variant="body2">• Current view data and charts</Typography>
              <Typography variant="body2">• Analysis parameters</Typography>
              <Typography variant="body2">• SAIT branding and timestamp</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
              Note: The PDF will be downloaded directly to your computer.
            </Typography>
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
