// ComingSoonPage - Placeholder for features under development
import { Typography, Box, Paper } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';
import PageHeader from '../components/Common/PageHeader';

const ComingSoonPage = ({ featureName }) => {
  return (
    <>
      <PageHeader 
        title={featureName || 'Feature'}
        subtitle="This feature is currently under development"
      />
      <Box sx={{ px: 4, py: 8 }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 6, 
            textAlign: 'center',
            bgcolor: '#F5F5F5',
            borderRadius: 2
          }}
        >
          <ConstructionIcon sx={{ fontSize: 80, color: '#DA291C', mb: 2 }} />
          
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontFamily: 'Titillium Web, sans-serif',
              fontWeight: 700,
              color: '#324053'
            }}
          >
            Coming Soon
          </Typography>
          
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ 
              fontFamily: 'DM Sans, sans-serif',
              mb: 3
            }}
          >
            We're working hard to bring you this feature
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Stay tuned for updates!
            </Typography>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default ComingSoonPage;
