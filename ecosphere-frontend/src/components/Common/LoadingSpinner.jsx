// LoadingSpinner - Reusable loading component
import PropTypes from 'prop-types';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2
      }}
    >
      <CircularProgress 
        size={60}
        sx={{ color: '#DA291C' }}
      />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string
};

LoadingSpinner.defaultProps = {
  message: 'Loading...'
};

export default LoadingSpinner;
