// Path: ecosphere-frontend/src/components/DynamicChart.jsx
import React from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const DynamicChart = ({ data, config }) => {
  // Empty State
  if (!data || data.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
        <Typography color="text.secondary">Select sensors and click Generate to view data.</Typography>
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
        
        // Switch between Line, Bar, Area based on user selection
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
    <Paper elevation={3} sx={{ p: 2, height: '100%', width: '100%', borderRadius: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
        </ResponsiveContainer>
    </Paper>
  );
};

export default DynamicChart;