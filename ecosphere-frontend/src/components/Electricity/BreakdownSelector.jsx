// Breakdown Selector Component - Card-based selection for data breakdown
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import {
  BarChart,
  ElectricBolt,
  Devices,
  WbSunny
} from '@mui/icons-material';
import {
  CONSUMPTION_BREAKDOWNS,
  GENERATION_BREAKDOWNS
} from '../../lib/constants/electricity';

const BreakdownCard = ({
  title,
  description,
  icon: IconComponent,
  selected,
  onClick
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
            <IconComponent sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6">
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {description}
          </Typography>
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
      icon: BarChart
    },
    {
      id: CONSUMPTION_BREAKDOWNS.PHASE,
      title: 'By Phase',
      description: 'Three-phase power breakdown (A, B, C)',
      icon: ElectricBolt
    },
    {
      id: CONSUMPTION_BREAKDOWNS.EQUIPMENT,
      title: 'By Equipment',
      description: 'Consumption by equipment type',
      icon: Devices
    }
  ];

  const generationBreakdowns = [
    {
      id: GENERATION_BREAKDOWNS.OVERALL,
      title: 'Overall',
      description: 'Total generation trend over time',
      icon: BarChart
    },
    {
      id: GENERATION_BREAKDOWNS.SOURCE,
      title: 'By Source',
      description: 'Solar generation by panel location',
      icon: WbSunny
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
          <Grid xs={12} md={4} key={breakdown.id}>
            <BreakdownCard
              title={breakdown.title}
              description={breakdown.description}
              icon={breakdown.icon}
              selected={selectedBreakdown === breakdown.id}
              onClick={() => onBreakdownChange(breakdown.id)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default BreakdownSelector;
