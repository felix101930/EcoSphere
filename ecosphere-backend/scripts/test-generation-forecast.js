// Test Generation Forecast
const ElectricityService = require('../services/electricityService');
const WeatherService = require('../services/weatherService');
const ForecastService = require('../services/forecastService');

async function testGenerationForecast() {
    try {
        console.log('🧪 Testing Generation Forecast\n');

        const targetDate = '2020-11-07';
        const forecastDays = 7;

        // Training period
        const trainingEndDate = new Date('2020-11-06T12:00:00');
        const trainingStartDate = new Date(trainingEndDate);
        trainingStartDate.setDate(trainingStartDate.getDate() - 60);

        const formatDate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const trainingStartStr = formatDate(trainingStartDate);
        const trainingEndStr = formatDate(trainingEndDate);

        console.log(`Training period: ${trainingStartStr} to ${trainingEndStr}`);

        // Fetch generation data
        console.log('\n1. Fetching generation data...');
        const historicalGeneration = await ElectricityService.getGenerationData(
            trainingStartStr,
            trainingEndStr
        );
        console.log(`   ✓ Retrieved ${historicalGeneration.length} hourly records`);

        // Fetch weather data
        console.log('\n2. Fetching weather data...');
        const historicalWeatherRaw = await WeatherService.getHistoricalWeather(
            trainingStartStr,
            trainingEndStr
        );
        console.log(`   ✓ Retrieved ${historicalWeatherRaw.hourly.time.length} hourly weather records`);

        // Aggregate
        console.log('\n3. Aggregating to daily...');
        const historicalWeather = WeatherService.aggregateToDaily(historicalWeatherRaw);
        console.log(`   ✓ ${Object.keys(historicalWeather).length} days of weather data`);

        // Show sample
        const weatherDates = Object.keys(historicalWeather).sort();
        console.log(`\n   Weather dates: ${weatherDates[0]} to ${weatherDates[weatherDates.length - 1]}`);
        console.log(`   Sample weather data for ${weatherDates[0]}:`);
        console.log(`     Direct radiation: ${historicalWeather[weatherDates[0]].total_direct_radiation}`);
        console.log(`     Temperature: ${historicalWeather[weatherDates[0]].avg_temperature}`);
        console.log(`     Cloud cover: ${historicalWeather[weatherDates[0]].avg_cloud_cover}`);

        // Try to train model
        console.log('\n4. Training model...');
        const model = ForecastService.trainWeatherModel(historicalGeneration, historicalWeather);
        console.log(`   ✓ Model trained with ${model.trainingDays} days`);
        console.log(`   R-squared: ${model.r_squared.toFixed(4)}`);
        console.log(`   Coefficients:`);
        console.log(`     Direct radiation: ${model.coefficients.direct_radiation.toFixed(4)}`);
        console.log(`     Temperature: ${model.coefficients.temperature.toFixed(4)}`);
        console.log(`     Cloud cover (inv): ${model.coefficients.cloud_cover_inverted.toFixed(4)}`);
        console.log(`     Intercept: ${model.intercept.toFixed(4)}`);

        console.log('\n✅ Test passed!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testGenerationForecast()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
