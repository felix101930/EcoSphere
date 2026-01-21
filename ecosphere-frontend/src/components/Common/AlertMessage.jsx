// AlertMessage - Reusable alert component
import { Alert } from '@mui/material';

const AlertMessage = ({ show, message, severity = 'success', onClose }) => {
  if (!show) return null;

  return (
    <Alert severity={severity} onClose={onClose} sx={{ mb: 2 }}>
      {message}
    </Alert>
  );
};

export default AlertMessage;
