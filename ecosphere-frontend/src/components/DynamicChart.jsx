// File: ecosphere-frontend/src/components/DynamicChart.jsx
import React from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const DynamicChart = ({ data, config }) => {
  // 1. Handle Empty State
  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary', border: '1px dashed grey', borderRadius: 2 }}>
        <Typography variant="body1">Waiting for data...</Typography>
      </Box>
    );
  }

  // 2. Date Formatter (Makes the X-Axis readable)
  const formatDate = (ts) => {
    if (!ts) return '';
    // Tries to create a date object. If invalid, returns string as-is.
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts; 
    
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  // 3. Common Chart Elements (Grid, Axis, Tooltips)
  const renderCommonElements = () => [
    <CartesianGrid strokeDasharray="3 3" key="grid" />,
    <XAxis 
      dataKey="ts" 
      tickFormatter={formatDate} 
      minTickGap={50} // Prevents labels from overlapping
      key="xaxis" 
    />,
    <YAxis key="yaxis" />,
    <Tooltip 
      labelFormatter={(label) => new Date(label).toLocaleString()} 
      key="tooltip" 
    />,
    <Legend key="legend" />
  ];

  // 4. Chart Switcher logic
  const renderChart = () => {
    const color = config?.color || "#1976d2"; // Default Blue
    const title = config?.title || "Value";

    switch (config?.type) {
      case 'bar':
        return (
          <BarChart data={data}>
            {renderCommonElements()}
            <Bar dataKey="value" fill={color} name={title} />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            {renderCommonElements()}
            <Area type="monotone" dataKey="value" stroke={color} fill={color} name={title} />
          </AreaChart>
        );
      case 'line':
      default:
        return (
          <LineChart data={data}>
            {renderCommonElements()}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              dot={false} // Performance optimization for high-density data
              name={title} 
            />
          </LineChart>
        );
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: 500, width: '100%', mt: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: config?.color }}>
            {config?.title || "Analysis Result"}
        </Typography>
        <ResponsiveContainer width="100%" height="85%">
            {renderChart()}
        </ResponsiveContainer>
    </Paper>
  );
};

export default DynamicChart;