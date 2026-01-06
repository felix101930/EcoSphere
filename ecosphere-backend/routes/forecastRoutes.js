// Forecast Routes
const express = require('express');
const router = express.Router();
const { getElectricityForecast, getGenerationForecast } = require('../controllers/forecastController');

// Get electricity consumption forecast
// Parameters:
//   - targetDate: YYYY-MM-DD (base date, forecast starts from day after)
//   - forecastDays: number of days to forecast (1-30)
router.get('/electricity/:targetDate/:forecastDays', getElectricityForecast);

// Get solar generation forecast (weather-based)
// Parameters:
//   - targetDate: YYYY-MM-DD (base date, forecast starts from day after)
//   - forecastDays: number of days to forecast (1-30)
router.get('/generation/:targetDate/:forecastDays', getGenerationForecast);

module.exports = router;
