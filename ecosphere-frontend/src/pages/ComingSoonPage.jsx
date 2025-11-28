// ComingSoonPage - Placeholder for features under development
import { Container, Typography, Box, Paper } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

const ComingSoonPage = ({ featureName }) => {
  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
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
          {featureName || 'Feature'} Coming Soon
        </Typography>
        
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ 
            fontFamily: 'DM Sans, sans-serif',
            mb: 3
          }}
        >
          This feature is currently under development
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            We're working hard to bring you this feature. Stay tuned!
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ComingSoonPage;
