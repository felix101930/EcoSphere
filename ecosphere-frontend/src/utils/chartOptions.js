// Chart Options Configuration
// Centralized chart configuration for consistency

/**
 * Standard chart options for single Y-axis charts
 */
export const standardChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: false,
        boxWidth: 50,
        boxHeight: 2,
        padding: 15
      }
    },
    title: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

/**
 * Dual Y-axis chart options for custom calculation
 */
export const dualAxisChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: false,
        boxWidth: 50,
        boxHeight: 2,
        padding: 15
      }
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      beginAtZero: true,
      title: {
        display: true,
        text: 'Consumption (kWh)'
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      beginAtZero: true,
      title: {
        display: true,
        text: 'Carbon Footprint (kg CO₂e)'
      },
      grid: {
        drawOnChartArea: false,
      },
    },
  }
};
