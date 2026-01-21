// Weather Correlation Analysis Script (60 days)
// Analyze correlation between weather variables and solar generation

const ElectricityService = require('../services/electricityService');
const https = require('https');

// Calgary coordinates (60 Fowler Dr NW, Calgary, AB)
const CALGARY_LAT = 51.0947;
const CALGARY_LON = -114.1094;

// Open-Meteo Archive API
const OPEN_METEO_ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

/**
 * Fetch historical weather data from Open-Meteo
 */
async function fetchWeatherData(dateFrom, dateTo) {
    const params = new URLSearchParams({
        latitude: CALGARY_LAT,
        longitude: CALGARY_LON,
        start_date: dateFrom,
        end_date: dateTo,
        hourly: [
            'temperature_2m',
            'cloud_cover',
            'shortwave_radiation',
            'direct_radiation',
            'diffuse_radiation',
            'wind_speed_10m',
            'relative_humidity_2m'
        ].join(','),
        timezone: 'America/Edmonton'
    });

    const url = `${OPEN_METEO_ARCHIVE_URL}?${params.toString()}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Failed to parse weather data: ' + error.message));
                }
            });
        }).on('error', (error) => {
            reject(new Error('Failed to fetch weather data: ' + error.message));
        });
    });
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x, y) {
    const n = x.length;
    if (n !== y.length || n === 0) {
        throw new Error('Arrays must have the same non-zero length');
    }

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
}

/**
 * Aggregate hourly data to daily totals/averages
 */
function aggregateToDaily(hourlyData, aggregationType = 'sum') {
    const dailyData = {};

    hourlyData.forEach(item => {
        const date = item.ts.split(' ')[0];

        if (!dailyData[date]) {
            dailyData[date] = {
                values: [],
                count: 0
            };
        }

        dailyData[date].values.push(item.value);
        dailyData[date].count++;
    });

    const result = {};
    Object.keys(dailyData).forEach(date => {
        const values = dailyData[date].values;
        if (aggregationType === 'sum') {
            result[date] = values.reduce((a, b) => a + b, 0);
        } else if (aggregationType === 'avg') {
            result[date] = values.reduce((a, b) => a + b, 0) / values.length;
        }
    });

    return result;
}

/**
 * Aggregate weather data to daily
 */
function aggregateWeatherToDaily(weatherData) {
    const dailyWeather = {};

    weatherData.hourly.time.forEach((timestamp, index) => {
        const date = timestamp.split('T')[0];

        if (!dailyWeather[date]) {
            dailyWeather[date] = {
                temperature: [],
                cloud_cover: [],
                shortwave_radiation: [],
                direct_radiation: [],
                diffuse_radiation: [],
                wind_speed: [],
                humidity: []
            };
        }

        dailyWeather[date].temperature.push(weatherData.hourly.temperature_2m[index] || 0);
        dailyWeather[date].cloud_cover.push(weatherData.hourly.cloud_cover[index] || 0);
        dailyWeather[date].shortwave_radiation.push(weatherData.hourly.shortwave_radiation[index] || 0);
        dailyWeather[date].direct_radiation.push(weatherData.hourly.direct_radiation[index] || 0);
        dailyWeather[date].diffuse_radiation.push(weatherData.hourly.diffuse_radiation[index] || 0);
        dailyWeather[date].wind_speed.push(weatherData.hourly.wind_speed_10m[index] || 0);
        dailyWeather[date].humidity.push(weatherData.hourly.relative_humidity_2m[index] || 0);
    });

    const result = {};
    Object.keys(dailyWeather).forEach(date => {
        const data = dailyWeather[date];
        result[date] = {
            avg_temperature: data.temperature.reduce((a, b) => a + b, 0) / data.temperature.length,
            avg_cloud_cover: data.cloud_cover.reduce((a, b) => a + b, 0) / data.cloud_cover.length,
            total_shortwave_radiation: data.shortwave_radiation.reduce((a, b) => a + b, 0),
            avg_shortwave_radiation: data.shortwave_radiation.reduce((a, b) => a + b, 0) / data.shortwave_radiation.length,
            total_direct_radiation: data.direct_radiation.reduce((a, b) => a + b, 0),
            avg_direct_radiation: data.direct_radiation.reduce((a, b) => a + b, 0) / data.direct_radiation.length,
            total_diffuse_radiation: data.diffuse_radiation.reduce((a, b) => a + b, 0),
            avg_wind_speed: data.wind_speed.reduce((a, b) => a + b, 0) / data.wind_speed.length,
            avg_humidity: data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length,
            daylight_hours: data.shortwave_radiation.filter(r => r > 0).length
        };
    });

    return result;
}

/**
 * Main analysis function
 */
async function analyzeCorrelation() {
    console.log('🔍 Starting Weather-Generation Correlation Analysis (60 days)\n');
    console.log('='.repeat(70));

    // Use last 60 days before 2020-11-08
    const dateTo = '2020-11-07';
    const dateFrom = '2020-09-08';

    try {
        console.log(`\n📅 Analysis Period: ${dateFrom} to ${dateTo} (60 days)`);

        // 1. Fetch generation data
        console.log('\n📊 Fetching generation data...');
        const generationData = await ElectricityService.getGenerationData(dateFrom, dateTo);
        console.log(`   ✓ Retrieved ${generationData.length} hourly generation records`);

        // 2. Fetch weather data
        console.log('\n🌤️  Fetching weather data from Open-Meteo...');
        const weatherData = await fetchWeatherData(dateFrom, dateTo);
        console.log(`   ✓ Retrieved ${weatherData.hourly.time.length} hourly weather records`);

        // 3. Aggregate to daily
        console.log('\n📈 Aggregating data to daily totals...');
        const dailyGeneration = aggregateToDaily(generationData, 'sum');
        const dailyWeather = aggregateWeatherToDaily(weatherData);

        console.log(`   ✓ ${Object.keys(dailyGeneration).length} days of generation data`);
        console.log(`   ✓ ${Object.keys(dailyWeather).length} days of weather data`);

        // 4. Prepare arrays for correlation
        const dates = Object.keys(dailyGeneration).sort();
        const generationValues = dates.map(date => dailyGeneration[date]);

        // Statistics
        const genStats = {
            min: Math.min(...generationValues),
            max: Math.max(...generationValues),
            avg: generationValues.reduce((a, b) => a + b, 0) / generationValues.length
        };

        console.log('\n' + '='.repeat(70));
        console.log('📊 GENERATION STATISTICS');
        console.log('='.repeat(70));
        console.log(`Total days: ${dates.length}`);
        console.log(`Min daily generation: ${genStats.min.toFixed(2)} Wh`);
        console.log(`Max daily generation: ${genStats.max.toFixed(2)} Wh`);
        console.log(`Avg daily generation: ${genStats.avg.toFixed(2)} Wh`);

        // 5. Calculate correlations
        console.log('\n' + '='.repeat(70));
        console.log('🔗 CORRELATION ANALYSIS (Pearson Correlation Coefficient)');
        console.log('='.repeat(70));
        console.log('\nNote: Values range from -1 to +1');
        console.log('  +1 = Perfect positive correlation');
        console.log('   0 = No correlation');
        console.log('  -1 = Perfect negative correlation');
        console.log('');

        const correlations = [
            {
                name: 'Total Shortwave Radiation',
                values: dates.map(date => dailyWeather[date].total_shortwave_radiation)
            },
            {
                name: 'Avg Shortwave Radiation',
                values: dates.map(date => dailyWeather[date].avg_shortwave_radiation)
            },
            {
                name: 'Total Direct Radiation',
                values: dates.map(date => dailyWeather[date].total_direct_radiation)
            },
            {
                name: 'Avg Direct Radiation',
                values: dates.map(date => dailyWeather[date].avg_direct_radiation)
            },
            {
                name: 'Total Diffuse Radiation',
                values: dates.map(date => dailyWeather[date].total_diffuse_radiation)
            },
            {
                name: 'Cloud Cover (inverted)',
                values: dates.map(date => 100 - dailyWeather[date].avg_cloud_cover)
            },
            {
                name: 'Temperature',
                values: dates.map(date => dailyWeather[date].avg_temperature)
            },
            {
                name: 'Daylight Hours',
                values: dates.map(date => dailyWeather[date].daylight_hours)
            },
            {
                name: 'Wind Speed',
                values: dates.map(date => dailyWeather[date].avg_wind_speed)
            },
            {
                name: 'Humidity (inverted)',
                values: dates.map(date => 100 - dailyWeather[date].avg_humidity)
            }
        ];

        correlations.forEach(item => {
            const corr = calculateCorrelation(generationValues, item.values);
            const strength = Math.abs(corr) > 0.8 ? '🔥 STRONG' :
                Math.abs(corr) > 0.5 ? '⚡ MODERATE' :
                    '💤 WEAK';
            console.log(`${strength.padEnd(12)} ${corr.toFixed(4).padStart(8)} - ${item.name}`);
        });

        // 6. Recommendations
        console.log('\n' + '='.repeat(70));
        console.log('💡 RECOMMENDATIONS');
        console.log('='.repeat(70));

        const topCorrelations = correlations
            .map(item => ({
                name: item.name,
                correlation: calculateCorrelation(generationValues, item.values)
            }))
            .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
            .slice(0, 5);

        console.log('\nTop 5 most correlated variables:');
        topCorrelations.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.name} (r = ${item.correlation.toFixed(4)})`);
        });

        console.log('\nSuggested model variables (r > 0.7):');
        topCorrelations.forEach(item => {
            if (Math.abs(item.correlation) > 0.7) {
                console.log(`  ✓ ${item.name}`);
            }
        });

        console.log('\n' + '='.repeat(70));
        console.log('✅ Analysis Complete!');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n❌ Error during analysis:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run analysis
if (require.main === module) {
    analyzeCorrelation()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { analyzeCorrelation };
