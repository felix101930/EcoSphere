// DashboardPage - Main page for TeamMembers
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/Common/PageHeader';

const DashboardPage = () => {
  const { currentUser } = useAuth();

  return (
    <>
      <PageHeader 
        title={`Welcome, ${currentUser?.firstName} ${currentUser?.lastName}!`}
        subtitle={`Role: ${currentUser?.role}`}
      />
      <Box sx={{ px: 4, py: 3 }}>

      {/* Dashboard Content */}
      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Carbon Footprint
            </Typography>
            <Typography variant="h3" color="primary">
              Coming Soon
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Electricity Usage
            </Typography>
            <Typography variant="h3" color="primary">
              Coming Soon
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Reports
            </Typography>
            <Typography variant="h3" color="primary">
              Coming Soon
            </Typography>
          </Paper>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Dashboard Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This is your main dashboard. More features will be added here including:
            </Typography>
            <Box component="ul" sx={{ mt: 2 }}>
              <li>Carbon Footprint Calculator (Two modes)</li>
              <li>Electricity Reports</li>
              <li>Water Reports</li>
              <li>Thermal Reports</li>
              <li>Data Visualization</li>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      </Box>
    </>
  );
};

export default DashboardPage;
