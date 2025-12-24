// Breakdown Selector Component - Card-based selection for data breakdown
import { Box, Paper, Typography, Grid, Card, CardContent, CardActionArea, Chip } from '@mui/material';
import { 
  BarChart, 
  ElectricBolt, 
  Devices,
  Warning,
  WbSunny
} from '@mui/icons-material';
import { 
  CONSUMPTION_BREAKDOWNS, 
  GENERATION_BREAKDOWNS, 
  DATA_WARNINGS 
} from '../../lib/constants/electricity';

const BreakdownCard = ({ 
  title, 
  description, 
  icon: Icon, 
  selected, 
  onClick, 
  warning,
  available 
}) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.50' : 'background.paper'
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Icon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6">
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {description}
          </Typography>
          {available && (
            <Chip 
              label={available} 
              size="small" 
              color="info" 
              sx={{ mb: 1 }}
            />
          )}
          {warning && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1 }}>
              <Warning sx={{ fontSize: 16, color: 'warning.main', mr: 0.5, mt: 0.2 }} />
              <Typography variant="caption" color="warning.main">
                {warning}
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const BreakdownSelector = ({ selectedBreakdown, onBreakdownChange, type = 'consumption' }) => {
  const consumptionBreakdowns = [
    {
      id: CONSUMPTION_BREAKDOWNS.OVERALL,
      title: 'Overall',
      description: 'Total consumption trend over time',
      icon: BarChart,
      available: '634 days available',
      warning: null
    },
    {
      id: CONSUMPTION_BREAKDOWNS.PHASE,
      title: 'By Phase',
      description: 'Three-phase power breakdown (A, B, C)',
      icon: ElectricBolt,
      available: '7 days only',
      warning: DATA_WARNINGS.PHASE
    },
    {
      id: CONSUMPTION_BREAKDOWNS.EQUIPMENT,
      title: 'By Equipment',
      description: 'Consumption by equipment type',
      icon: Devices,
      available: 'Various ranges',
      warning: DATA_WARNINGS.EQUIPMENT
    }
  ];

  const generationBreakdowns = [
    {
      id: GENERATION_BREAKDOWNS.OVERALL,
      title: 'Overall',
      description: 'Total generation trend over time',
      icon: BarChart,
      available: '634 days available',
      warning: null
    },
    {
      id: GENERATION_BREAKDOWNS.SOURCE,
      title: 'By Source',
      description: 'Solar generation by panel location',
      icon: WbSunny,
      available: '7 days only',
      warning: DATA_WARNINGS.SOLAR_SOURCE
    }
  ];

  const breakdowns = type === 'consumption' ? consumptionBreakdowns : generationBreakdowns;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Data Breakdown
      </Typography>
      <Grid container spacing={2}>
        {breakdowns.map((breakdown) => (
          <Grid item xs={12} md={4} key={breakdown.id}>
            <BreakdownCard
              title={breakdown.title}
              description={breakdown.description}
              icon={breakdown.icon}
              selected={selectedBreakdown === breakdown.id}
              onClick={() => onBreakdownChange(breakdown.id)}
              warning={breakdown.warning}
              available={breakdown.available}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default BreakdownSelector;
