import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LoginLogService from '../../services/LoginLogService';

const LoginLogDialog = ({ open, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await LoginLogService.getAllLogs();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching login logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    return timestamp;
  };

  const getStatusChip = (status) => {
    if (status === 'success') {
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="Success"
          color="success"
          size="small"
        />
      );
    } else {
      return (
        <Chip
          icon={<CancelIcon />}
          label="Failed"
          color="error"
          size="small"
        />
      );
    }
  };

  const getRoleChip = (role) => {
    let color;
    if (role === 'Admin') {
      color = 'secondary'; // Purple
    } else if (role === 'Unknown') {
      color = 'error'; // Red
    } else {
      color = 'primary'; // Blue (TeamMember)
    }
    return <Chip label={role} color={color} size="small" />;
  };



  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#DA291C', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div">
            Login Activity Log
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography variant="body1" color="text.secondary">
              No login logs found
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                    Login Time
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                    Role
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                    Logout Time
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                    IP Address
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    sx={{
                      '&:hover': {
                        bgcolor: '#f9f9f9'
                      }
                    }}
                  >
                    <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                    <TableCell>{log.email}</TableCell>
                    <TableCell>{getRoleChip(log.role)}</TableCell>
                    <TableCell>
                      {getStatusChip(log.status)}
                      {log.status === 'failed' && log.failureReason && (
                        <Typography variant="caption" display="block" color="error" sx={{ mt: 0.5 }}>
                          {log.failureReason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatTimestamp(log.logoutTimestamp)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {log.ipAddress}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginLogDialog;
