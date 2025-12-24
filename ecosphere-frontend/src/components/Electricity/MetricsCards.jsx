// Metrics Cards Component - Display key metrics
import { Box, Paper, Typography, Grid } from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  ShowChart,
  Speed
} from '@mui/icons-material';

const MetricCard = ({ title, value, unit, icon: Icon, color = 'primary' }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Icon sx={{ color: `${color}.main`, mr: 1 }} />
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
        {value !== null && value !== undefined ? value.toLocaleString() : 'N/A'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {unit}
      </Typography>
    </Paper>
  );
};

const MetricsCards = ({ metrics }) => {
  if (!metrics) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Key Metrics
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total"
            value={Math.abs(metrics.total).toFixed(2)}
            unit="Wh"
            icon={ShowChart}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Average"
            value={Math.abs(metrics.average).toFixed(2)}
            unit="Wh"
            icon={Speed}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Peak"
            value={Math.abs(metrics.peak).toFixed(2)}
            unit="Wh"
            icon={TrendingUp}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Minimum"
            value={Math.abs(metrics.min).toFixed(2)}
            unit="Wh"
            icon={TrendingDown}
            color="success"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MetricsCards;
