// Forecast Constants

// Forecast UI types (for toggle buttons) - ADD THIS FIRST
export const FORECAST_UI_TYPES = {
  HISTORICAL: "historical",
  ML_SOLAR: "ml_solar",
};

// Forecast UI type labels - NOW THIS WILL WORK
export const FORECAST_UI_TYPE_LABELS = {
  [FORECAST_UI_TYPES.HISTORICAL]: "Historical Pattern",
  [FORECAST_UI_TYPES.ML_SOLAR]: "AI Solar Forecast",
};

// Forecast types
export const FORECAST_TYPES = {
  CONSUMPTION: "consumption",
  GENERATION: "generation",
  BOTH: "both",
  ML_SOLAR: "ml_solar",
};

// Forecast type labels
export const FORECAST_TYPE_LABELS = {
  [FORECAST_TYPES.CONSUMPTION]: "Consumption",
  [FORECAST_TYPES.GENERATION]: "Generation",
  [FORECAST_TYPES.BOTH]: "Both",
  [FORECAST_TYPES.ML_SOLAR]: "AI Solar Forecast",
};

// Forecast periods
export const FORECAST_PERIODS = {
  SEVEN_DAYS: 7,
  FOURTEEN_DAYS: 14,
  THIRTY_DAYS: 30,
};

// Forecast period labels
export const FORECAST_PERIOD_LABELS = {
  [FORECAST_PERIODS.SEVEN_DAYS]: "7 Days",
  [FORECAST_PERIODS.FOURTEEN_DAYS]: "14 Days",
  [FORECAST_PERIODS.THIRTY_DAYS]: "30 Days",
};

// Strategy names
export const STRATEGY_NAMES = {
  HOLT_WINTERS: "Holt-Winters Seasonal Smoothing",
  SEASONAL_WEIGHTED: "Weighted Seasonal Prediction",
  TREND_BASED: "Trend-Based Prediction",
  MOVING_AVERAGE: "Moving Average",
  WEATHER_BASED: "Weather-Based Linear Regression",
  INSUFFICIENT_DATA: "Insufficient Data",
  ML_RANDOM_FOREST: "Random Forest ML Model",
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  ACCEPTABLE: 60,
  LOW: 50,
};

// Confidence labels
export const CONFIDENCE_LABELS = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  ACCEPTABLE: "Acceptable",
  LOW: "Low",
  INSUFFICIENT: "Insufficient",
};

// Chart colors
export const FORECAST_COLORS = {
  CONSUMPTION: "#005EB8", // SAIT Blue
  GENERATION: "#4CAF50", // Green (matches Generation tab)
  PREDICTED_CONSUMPTION: "#DA291C", // SAIT Red
  PREDICTED_GENERATION: "#4CAF50", // Green (matches Generation tab)
  ML_FORECAST: "#4CAF50",
  ML_FORECAST_BG: "rgba(76, 175, 80, 0.1)",
  CONFIDENCE_AREA: "rgba(218, 41, 28, 0.1)", // Light red
};

// ML Forecast specific constants
export const ML_FORECAST = {
  MAX_HOURS: 24,
  UNIT: "kW",
  DISCLAIMER: "For reference only - AI prediction",
  MODEL_TYPES: {
    RANDOM_FOREST: "RandomForestRegressor",
    XGBOOST: "XGBoost",
    LIGHTGBM: "LightGBM",
  },
};

// ML Model metrics thresholds
export const ML_METRICS_THRESHOLDS = {
  EXCELLENT_R2: 0.8,
  GOOD_R2: 0.6,
  ACCEPTABLE_R2: 0.4,
  POOR_R2: 0.2,
};

// Default demo dates (based on available data)
export const DEFAULT_DEMO_DATES = {
  TARGET_DATE: "2025-12-31", // Predict from latest available date
  FORECAST_DAYS: 7,
};

// UI dimensions
export const CARD_HEIGHT = 270;
export const CHART_HEIGHT = 400;

// Algorithm tiers configuration
export const ALGORITHM_TIERS = [
  {
    tier: 1,
    strategy: "HOLT_WINTERS",
    name: "Holt-Winters",
    stars: "★★★★★",
    features: [
      "Industry standard method",
      "Exponential smoothing",
      "Weekly seasonality",
    ],
    requirements: ["2 years historical data", "70% data completeness"],
    formula: "Y(t+h) = L(t) + h×T(t) + S(t+h-m)",
    description:
      "Triple exponential smoothing that captures level (L), trend (T), and seasonal (S) components. Uses α, β, γ parameters to weight recent vs historical data. Requires 2 complete seasonal cycles (2 years) for accurate pattern recognition.",
  },
  {
    tier: 2,
    strategy: "SEASONAL_WEIGHTED",
    name: "Seasonal Weighted",
    stars: "★★★★☆",
    features: [
      "30% last year data",
      "50% last week data",
      "20% 30-day average",
    ],
    requirements: ["Last year same period", "Recent 30 days data"],
    formula: "Y = 0.3×LastYear + 0.5×LastWeek + 0.2×Avg30Days",
    description:
      "Weighted average combining last year's same period (seasonal pattern), last week's same day (recent trend), and 30-day average (baseline). Balances seasonal and recent patterns.",
  },
  {
    tier: 3,
    strategy: "TREND_BASED",
    name: "Trend-Based",
    stars: "★★★☆☆",
    features: [
      "Linear trend analysis",
      "No seasonality",
      "Recent pattern only",
    ],
    requirements: ["Recent 30 days data"],
    formula: "Y = a×t + b",
    description:
      "Simple linear regression on recent 30 days. Calculates slope (a) and intercept (b) to project future trend. Best for short-term predictions when seasonal data unavailable.",
  },
  {
    tier: 4,
    strategy: "MOVING_AVERAGE",
    name: "Moving Average",
    stars: "★★☆☆☆",
    features: ["Simple average", "Baseline method", "No trend/seasonality"],
    requirements: ["Recent 7 days data"],
    formula: "Y = (Σ last 7 days) / 7",
    description:
      "Simple average of last 7 days. Assumes future will match recent average. Fallback method when insufficient data for more sophisticated algorithms.",
  },
];
