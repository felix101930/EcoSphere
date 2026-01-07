// Test thermal forecast API
const https = require('https');

async function testThermalForecast() {
    const floor = 'basement';
    const targetDate = '2020-11-08';
    const forecastDays = 14;

    const url = `http://localhost:3001/api/thermal/forecast/${floor}/${targetDate}/${forecastDays}`;

    console.log('Testing Thermal Forecast API...');
    console.log('URL:', url);
    console.log('');

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error('Error:', data.error);
            return;
        }

        console.log('=== FORECAST RESULT ===');
        console.log('Success:', data.success);
        console.log('Target Date:', data.targetDate);
        console.log('Forecast Days:', data.forecastDays);
        console.log('Floor:', data.floor);
        console.log('Sensor Count:', data.sensorCount);
        console.log('Has outdoorTemperature array:', !!data.outdoorTemperature);
        if (data.outdoorTemperature) {
            console.log('Outdoor Temperature array length:', data.outdoorTemperature.length);
        }
        console.log('');

        console.log('=== METADATA ===');
        console.log('Strategy:', data.metadata.strategy);
        console.log('Strategy Name:', data.metadata.strategyName);
        console.log('Confidence:', data.metadata.confidence);
        console.log('Training Days:', data.metadata.trainingDays);
        console.log('');

        console.log('=== MODEL ===');
        console.log('Baseline Temp:', data.metadata.model.baseline_temp);
        console.log('Weather Coefficient:', data.metadata.model.weather_coefficient);
        console.log('Comfortable Temp:', data.metadata.model.comfortable_temp);
        console.log('');

        console.log('=== PREDICTIONS ===');
        console.log('Total predictions:', data.predictions.length);
        console.log('');

        // Show first 5 predictions with details
        console.log('First 5 predictions:');
        data.predictions.slice(0, 5).forEach((pred, index) => {
            console.log(`${index + 1}. Date: ${pred.date}`);
            console.log(`   Indoor Temp: ${pred.value.toFixed(2)}°C`);
            console.log(`   Outdoor Temp: ${pred.weather.outdoor_temp.toFixed(2)}°C`);
            console.log(`   Solar Radiation: ${pred.weather.solar_radiation.toFixed(2)} W/m²`);
            console.log('');
        });

        // Check if all predictions are the same
        const uniqueValues = [...new Set(data.predictions.map(p => p.value.toFixed(2)))];
        console.log('=== ANALYSIS ===');
        console.log('Unique temperature values:', uniqueValues);
        if (uniqueValues.length === 1) {
            console.log('⚠️  WARNING: All predictions have the same value!');
            console.log('This suggests the weather adjustment is not working.');
        } else {
            console.log('✓ Predictions vary, weather adjustment is working.');
        }

        // Check outdoor temperatures
        const outdoorTemps = data.predictions.map(p => p.weather.outdoor_temp.toFixed(2));
        const uniqueOutdoorTemps = [...new Set(outdoorTemps)];
        console.log('');
        console.log('Unique outdoor temperatures:', uniqueOutdoorTemps);
        if (uniqueOutdoorTemps.length === 1) {
            console.log('⚠️  WARNING: All outdoor temperatures are the same!');
            console.log('This suggests weather data is not varying.');
        } else {
            console.log('✓ Outdoor temperatures vary.');
        }

    } catch (error) {
        console.error('Error testing forecast:', error.message);
    }
}

// Run test
testThermalForecast();
