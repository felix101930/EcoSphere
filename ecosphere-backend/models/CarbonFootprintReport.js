// Carbon Footprint Report Model - File-based storage
// This is a schema definition for documentation purposes
// Actual data is stored in JSON files

const reportSchema = {
  id: 'number',              // Unique report ID
  userId: 'number',          // User ID (from users.json)
  generatedAt: 'string',     // ISO date string
  parameters: {
    dateRange: {
      from: 'string',        // Date string
      to: 'string'           // Date string
    },
    emissionFactor: 'number',
    carbonIntensity: {
      value: 'number',
      location: 'string',
      fetchedAt: 'string',   // ISO date string
      isFallback: 'boolean'
    }
  },
  dataSnapshot: {
    realTimeData: 'array',   // Array of {ts, value}
    dailyData: 'array',      // Array of {ts, value}
    longTermData: 'array',   // Array of {ts, value}
    customCalculation: {
      hasData: 'boolean',
      entries: 'array',      // Array of custom entries
      chartData: 'object'    // Chart data object
    }
  },
  metadata: {
    fileName: 'string',
    description: 'string'
  },
  createdAt: 'string',       // ISO date string
  updatedAt: 'string'        // ISO date string
};

module.exports = { reportSchema };
