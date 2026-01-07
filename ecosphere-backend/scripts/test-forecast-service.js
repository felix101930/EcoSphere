// Test forecastService directly
const ForecastService = require('../services/forecastService');

// Mock data
const predictions = [
    { date: '2020-11-09', value: 22.5, weather: { outdoor_temp: -4.5, solar_radiation: 100 } },
    { date: '2020-11-10', value: 22.6, weather: { outdoor_temp: -2.0, solar_radiation: 80 } }
];

// Extract outdoor temperature
const outdoorTemperature = predictions.map(p => ({
    date: p.date,
    value: p.weather?.outdoor_temp || null
}));

console.log('Predictions:', predictions);
console.log('');
console.log('Outdoor Temperature:', outdoorTemperature);
console.log('');
console.log('Has outdoor_temp in predictions:', predictions.every(p => p.weather?.outdoor_temp !== undefined));
console.log('Outdoor temperature array length:', outdoorTemperature.length);
