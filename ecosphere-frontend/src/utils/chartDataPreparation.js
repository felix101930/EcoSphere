// Chart Data Preparation Utilities
// Extract chart data preparation logic for better code organization

/**
 * Prepare real-time chart data (hourly data)
 */
export const prepareRealTimeChartData = (data, label1, label2, emissionFactor) => {
  if (!data || data.length === 0) return null;

  const labels = data.map(record => {
    const date = new Date(record.ts.replace(' ', 'T'));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  });

  const values = data.map(record => record.value / 1000); // Convert to kWh
  const carbonValues = values.map(v => v * emissionFactor);

  return {
    labels,
    datasets: [
      {
        label: label1,
        data: values,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: label2,
        data: carbonValues,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  };
};

/**
 * Prepare aggregated daily chart data (aggregate by day)
 */
export const prepareDailyChartData = (data, label1, label2, emissionFactor) => {
  if (!data || data.length === 0) return null;

  // Aggregate by day
  const dailyMap = new Map();
  data.forEach(record => {
    const date = new Date(record.ts.replace(' ', 'T'));
    const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { date: dateKey, totalValue: 0 });
    }
    
    dailyMap.get(dateKey).totalValue += record.value;
  });

  const aggregatedData = Array.from(dailyMap.values());
  const labels = aggregatedData.map(d => d.date);
  const values = aggregatedData.map(d => d.totalValue / 1000); // Convert to kWh
  const carbonValues = values.map(v => v * emissionFactor);

  return {
    labels,
    datasets: [
      {
        label: label1,
        data: values,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: label2,
        data: carbonValues,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
};

/**
 * Prepare aggregated long-term chart data (aggregate by month)
 */
export const prepareLongTermChartData = (data, label1, label2, emissionFactor) => {
  if (!data || data.length === 0) return null;

  // Aggregate by month
  const monthlyMap = new Map();
  data.forEach(record => {
    const date = new Date(record.ts.replace(' ', 'T'));
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { date: monthKey, totalValue: 0 });
    }
    
    monthlyMap.get(monthKey).totalValue += record.value;
  });

  const aggregatedData = Array.from(monthlyMap.values());
  const labels = aggregatedData.map(d => d.date);
  const values = aggregatedData.map(d => d.totalValue / 1000); // Convert to kWh
  const carbonValues = values.map(v => v * emissionFactor);

  return {
    labels,
    datasets: [
      {
        label: label1,
        data: values,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7
      },
      {
        label: label2,
        data: carbonValues,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };
};

/**
 * Prepare custom calculation chart data (monthly data with YY/M format)
 * Note: This function uses dual Y-axis (y and y1) for consumption and carbon footprint
 */
export const prepareCustomChartData = (data, emissionFactor) => {
  if (!data || data.length === 0) return null;

  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Sort data by year and month
  const sortedData = [...data].sort((a, b) => {
    if (a.year !== b.year) {
      return parseInt(a.year) - parseInt(b.year);
    }
    return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
  });

  // Create labels in YY/M format
  const labels = sortedData.map(entry => {
    const monthIndex = monthOrder.indexOf(entry.month);
    return `${entry.year.slice(2)}/${monthIndex + 1}`;
  });

  const values = sortedData.map(entry => entry.usage || (entry.value / 1000));
  const carbonValues = values.map(v => v * emissionFactor);

  return {
    labels,
    datasets: [
      {
        label: 'Consumption (kWh)',
        data: values,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y'
      },
      {
        label: 'Carbon Footprint (kg CO₂e)',
        data: carbonValues,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1'
      }
    ]
  };
};

/**
 * Calculate total energy from data records
 */
export const calculateTotalEnergy = (data) => {
  if (!data || data.length === 0) return 0;
  return data.reduce((sum, record) => sum + (record.value / 1000), 0);
};
