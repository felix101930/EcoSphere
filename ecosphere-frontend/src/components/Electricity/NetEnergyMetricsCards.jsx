// Net Energy Metrics Cards - Display metrics with sign preserved
import { Box, Paper, Typography, Grid } from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  ShowChart,
  Speed
} from '@mui/icons-material';

const NetEnergyMetricCard = ({ title, value, unit, icon: Icon, color = 'primary', description }) => {
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
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {description}
        </Typography>
      )}
    </Paper>
  );
};

const NetEnergyMetricsCards = ({ metrics }) => {
  if (!metrics) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Key Metrics
      </Typography>
      
      <Grid container spacing={2}>
        <Grid xs={12} sm={6} md={3}>
          <NetEnergyMetricCard
            title="Total Net Energy"
            value={metrics.total.toFixed(2)}
            unit="Wh"
            icon={ShowChart}
            color={metrics.total < 0 ? 'error' : 'success'}
            description={metrics.total < 0 ? 'Grid dependent' : 'Grid exporter'}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <NetEnergyMetricCard
            title="Average"
            value={metrics.average.toFixed(2)}
            unit="Wh"
            icon={Speed}
            color={metrics.average < 0 ? 'error' : 'success'}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <NetEnergyMetricCard
            title="Peak Surplus"
            value={Math.abs(metrics.peak).toFixed(2)}
            unit="Wh"
            icon={TrendingUp}
            color="success"
            description="Max generation surplus"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <NetEnergyMetricCard
            title="Peak Deficit"
            value={Math.abs(metrics.min).toFixed(2)}
            unit="Wh"
            icon={TrendingDown}
            color="error"
            description="Max consumption deficit"
          />
        </Grid>
      </Grid>

      {/* Additional Info */}
      <Paper sx={{ p: 2, mt: 2, bgcolor: metrics.total < 0 ? 'error.50' : 'success.50' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Status:</strong> {metrics.total < 0 
            ? 'Building consumes more than it generates' 
            : 'Building generates more than it consumes'}
          <br />
          <strong>Interpretation:</strong> {metrics.total < 0 
            ? 'The building needs to draw power from the grid to meet its energy needs.' 
            : 'The building produces excess energy that can be exported to the grid.'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default NetEnergyMetricsCards;
