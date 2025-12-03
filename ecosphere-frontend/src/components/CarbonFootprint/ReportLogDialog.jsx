import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import CarbonFootprintReportService from '../../services/CarbonFootprintReportService';

const ReportLogDialog = ({ open, onClose, onPreviewReport }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await CarbonFootprintReportService.getReports(page, 10);
      setReports(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading reports:', error);
      // Don't show alert, just log the error
      // User will see "No reports yet" message in the UI
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (open) {
      loadReports();
    }
  }, [open, loadReports]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await CarbonFootprintReportService.deleteReport(id);
      loadReports(); // Reload list
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  const handlePreview = async (id) => {
    try {
      const response = await CarbonFootprintReportService.getReportById(id);
      onPreviewReport(response.data);
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Failed to load report');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            minHeight: '70vh',
            width: '85vw',
            maxWidth: '85vw'
          }
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#DA291C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component="span">
          Report History
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : reports.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No reports yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Export your first report to see it here
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Generated At</strong></TableCell>
                  <TableCell><strong>Date Range</strong></TableCell>
                  <TableCell><strong>Emission Factor</strong></TableCell>
                  <TableCell><strong>Custom Calc</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(report.generatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {report.parameters?.dateRange?.from || 'N/A'} to {report.parameters?.dateRange?.to || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {report.parameters?.emissionFactor?.toFixed(2) || 'N/A'} kg CO₂/kWh
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(report.dataSnapshot?.customCalculation?.hasData || 
                        report.dataSnapshot?.customCalculation?.dataCount > 0) ? (
                        <Chip label="Yes" size="small" color="success" />
                      ) : (
                        <Chip label="No" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Preview">
                          <IconButton
                            size="small"
                            onClick={() => handlePreview(report.id)}
                            sx={{ color: '#1976d2' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(report.id)}
                            sx={{ color: '#d32f2f' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={3} gap={1}>
            <Button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              variant="outlined"
              size="small"
            >
              Previous
            </Button>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
              Page {page} of {totalPages}
            </Typography>
            <Button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              variant="outlined"
              size="small"
            >
              Next
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportLogDialog;
