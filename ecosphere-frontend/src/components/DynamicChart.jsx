// Path: ecosphere-frontend/src/components/DynamicChart.jsx
import React from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const DynamicChart = ({ data, config, customEmptyMessage }) => {
  // Enhanced Empty State
  if (!data || data.length === 0) {
    return (
      <Paper elevation={3} sx={{
        p: 4,
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        bgcolor: '#fafafa'
      }}>
        <InfoOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" align="center">
          {customEmptyMessage || "No Data Available"}
        </Typography>
        <Typography variant="body2" color="text.disabled" align="center" sx={{ mt: 1 }}>
          The query executed successfully but returned no data points.
        </Typography>
      </Paper>
    );
  }

  // Validate data structure
  const hasValidData = data.some(item => item.ts && (item.value !== null && item.value !== undefined));
  if (!hasValidData) {
    return (
      <Paper elevation={3} sx={{
        p: 4,
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        bgcolor: '#fff3e0'
      }}>
        <InfoOutlinedIcon sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
        <Typography variant="h6" color="warning.main" align="center">
          Invalid Data Format
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          The data returned does not have the expected structure (ts, value).
        </Typography>
      </Paper>
    );
  }

  const formatDate = (ts) => {
    const date = new Date(ts);
    return isNaN(date.getTime()) ? ts : date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const commonProps = {
    data: data,
    margin: { top: 10, right: 30, left: 0, bottom: 0 }
  };

  const commonElements = [
    <CartesianGrid strokeDasharray="3 3" key="grid" />,
    <XAxis dataKey="ts" tickFormatter={formatDate} minTickGap={50} key="x" />,
    <YAxis key="y" />,
    <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} key="tip" />,
    <Legend key="leg" />
  ];

  const renderChart = () => {
    // Multi-Series Mode
    if (config?.type === 'multi' && config.series) {
      switch (config.chartType) {
        case 'bar':
          return (
            <BarChart {...commonProps}>
              {commonElements}
              {config.series.map(s => (
                <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.color} name={s.dataKey} />
              ))}
            </BarChart>
          );
        case 'area':
          return (
            <AreaChart {...commonProps}>
              {commonElements}
              {config.series.map(s => (
                <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} stroke={s.color} fill={s.color} fillOpacity={0.3} name={s.dataKey} connectNulls />
              ))}
            </AreaChart>
          );
        case 'line':
        default:
          return (
            <LineChart {...commonProps}>
              {commonElements}
              {config.series.map(s => (
                <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} stroke={s.color} strokeWidth={2} dot={false} connectNulls name={s.dataKey} />
              ))}
            </LineChart>
          );
      }
    }

    // Single Series Mode (AI Fallback)
    return (
      <LineChart {...commonProps}>
        {commonElements}
        <Line type="monotone" dataKey="value" stroke={config?.color || "#8884d8"} strokeWidth={2} dot={false} name={config?.title} />
      </LineChart>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 2, minHeight: 400, width: '100%', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
          {config?.title || "Analysis Result"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.length} data points
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={350}>
        {renderChart()}
      </ResponsiveContainer>
    </Paper>
  );
};

export default DynamicChart;