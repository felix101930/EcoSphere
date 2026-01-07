// Weather Service - Fetch weather data from Open-Meteo API
const https = require('https');
const {
    LOCATION,
    API_ENDPOINTS,
    WEATHER_VARIABLES,
    WEATHER_ERROR_MESSAGES
} = require('../utils/weatherConstants');

class WeatherService {
    /**
     * Fetch historical weather data from Open-Meteo Archive API
     * @param {string} dateFrom - Start date (YYYY-MM-DD)
     * @param {string} dateTo - End date (YYYY-MM-DD)
     * @param {string} type - Weather type: 'solar' or 'rain' (default: 'solar')
     * @returns {Promise<Object>} Weather data with hourly values
     */
    static async getHistoricalWeather(dateFrom, dateTo, type = 'solar') {
        const variables = type === 'rain' ? WEATHER_VARIABLES.HOURLY_RAIN : WEATHER_VARIABLES.HOURLY;

        const params = new URLSearchParams({
            latitude: LOCATION.LATITUDE,
            longitude: LOCATION.LONGITUDE,
            start_date: dateFrom,
            end_date: dateTo,
            hourly: variables.join(','),
            timezone: LOCATION.TIMEZONE
        });

        const url = `${API_ENDPOINTS.ARCHIVE}?${params.toString()}`;

        try {
            const data = await this._fetchFromAPI(url);
            return this._parseWeatherData(data, type);
        } catch (error) {
            console.error('Error fetching historical weather:', error.message);
            throw new Error(`${WEATHER_ERROR_MESSAGES.FETCH_FAILED}: ${error.message}`);
        }
    }

    /**
     * Fetch weather forecast from Open-Meteo Forecast API
     * @param {string} dateFrom - Start date (YYYY-MM-DD)
     * @param {string} dateTo - End date (YYYY-MM-DD)
     * @param {string} type - Weather type: 'solar' or 'rain' (default: 'solar')
     * @returns {Promise<Object>} Weather forecast data with hourly values
     */
    static async getForecastWeather(dateFrom, dateTo, type = 'solar') {
        const variables = type === 'rain' ? WEATHER_VARIABLES.HOURLY_RAIN : WEATHER_VARIABLES.HOURLY;

        const params = new URLSearchParams({
            latitude: LOCATION.LATITUDE,
            longitude: LOCATION.LONGITUDE,
            start_date: dateFrom,
            end_date: dateTo,
            hourly: variables.join(','),
            timezone: LOCATION.TIMEZONE
        });

        const url = `${API_ENDPOINTS.FORECAST}?${params.toString()}`;

        try {
            const data = await this._fetchFromAPI(url);
            return this._parseWeatherData(data, type);
        } catch (error) {
            console.error('Error fetching weather forecast:', error.message);
            throw new Error(`${WEATHER_ERROR_MESSAGES.FETCH_FAILED}: ${error.message}`);
        }
    }

    /**
     * Get weather data (automatically choose historical or forecast)
     * @param {string} dateFrom - Start date (YYYY-MM-DD)
     * @param {string} dateTo - End date (YYYY-MM-DD)
     * @param {string} type - Weather type: 'solar' or 'rain' (default: 'solar')
     * @returns {Promise<Object>} Weather data
     */
    static async getWeatherData(dateFrom, dateTo, type = 'solar') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const toDate = new Date(dateTo + 'T12:00:00');

        // If end date is in the past, use historical data
        // Otherwise use forecast data
        if (toDate <= today) {
            return this.getHistoricalWeather(dateFrom, dateTo, type);
        } else {
            return this.getForecastWeather(dateFrom, dateTo, type);
        }
    }

    /**
     * Aggregate hourly weather data to daily
     * @param {Object} weatherData - Hourly weather data
     * @param {string} type - Weather type: 'solar' or 'rain'
     * @returns {Object} Daily aggregated weather data
     */
    static aggregateToDaily(weatherData, type = 'solar') {
        if (type === 'rain') {
            return this._aggregateRainToDaily(weatherData);
        }
        return this._aggregateSolarToDaily(weatherData);
    }

    /**
     * Private: Aggregate solar weather data to daily
     */
    static _aggregateSolarToDaily(weatherData) {
        const dailyData = {};

        weatherData.hourly.time.forEach((timestamp, index) => {
            const date = timestamp.split('T')[0];

            if (!dailyData[date]) {
                dailyData[date] = {
                    temperature: [],
                    cloud_cover: [],
                    shortwave_radiation: [],
                    direct_radiation: [],
                    diffuse_radiation: []
                };
            }

            dailyData[date].temperature.push(weatherData.hourly.temperature_2m[index] || 0);
            dailyData[date].cloud_cover.push(weatherData.hourly.cloud_cover[index] || 0);
            dailyData[date].shortwave_radiation.push(weatherData.hourly.shortwave_radiation[index] || 0);
            dailyData[date].direct_radiation.push(weatherData.hourly.direct_radiation[index] || 0);
            dailyData[date].diffuse_radiation.push(weatherData.hourly.diffuse_radiation[index] || 0);
        });

        // Calculate daily aggregates
        const result = {};
        Object.keys(dailyData).forEach(date => {
            const data = dailyData[date];
            result[date] = {
                avg_temperature: this._average(data.temperature),
                avg_cloud_cover: this._average(data.cloud_cover),
                total_shortwave_radiation: this._sum(data.shortwave_radiation),
                avg_shortwave_radiation: this._average(data.shortwave_radiation),
                total_direct_radiation: this._sum(data.direct_radiation),
                avg_direct_radiation: this._average(data.direct_radiation),
                total_diffuse_radiation: this._sum(data.diffuse_radiation),
                daylight_hours: data.shortwave_radiation.filter(r => r > 0).length
            };
        });

        return result;
    }

    /**
     * Private: Aggregate rain weather data to daily
     */
    static _aggregateRainToDaily(weatherData) {
        const dailyData = {};

        weatherData.hourly.time.forEach((timestamp, index) => {
            const date = timestamp.split('T')[0];

            if (!dailyData[date]) {
                dailyData[date] = {
                    temperature: [],
                    precipitation: [],
                    rain: [],
                    showers: []
                };
            }

            dailyData[date].temperature.push(weatherData.hourly.temperature_2m[index] || 0);
            dailyData[date].precipitation.push(weatherData.hourly.precipitation[index] || 0);
            dailyData[date].rain.push(weatherData.hourly.rain[index] || 0);
            dailyData[date].showers.push(weatherData.hourly.showers[index] || 0);
        });

        // Calculate daily aggregates
        const result = {};
        Object.keys(dailyData).forEach(date => {
            const data = dailyData[date];
            result[date] = {
                avg_temperature: this._average(data.temperature),
                total_precipitation: this._sum(data.precipitation),
                total_rain: this._sum(data.rain),
                total_showers: this._sum(data.showers),
                rainy_hours: data.precipitation.filter(p => p > 0).length
            };
        });

        return result;
    }

    /**
     * Private: Fetch data from API using https
     */
    static _fetchFromAPI(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);

                        // Check for API errors
                        if (jsonData.error) {
                            reject(new Error(jsonData.reason || WEATHER_ERROR_MESSAGES.API_ERROR));
                            return;
                        }

                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error('Failed to parse weather data: ' + error.message));
                    }
                });
            }).on('error', (error) => {
                reject(new Error('Network error: ' + error.message));
            });
        });
    }

    /**
     * Private: Parse weather data into consistent format
     */
    static _parseWeatherData(data, type = 'solar') {
        if (!data.hourly || !data.hourly.time) {
            throw new Error('Invalid weather data format');
        }

        const hourly = {
            time: data.hourly.time,
            temperature_2m: data.hourly.temperature_2m || []
        };

        if (type === 'rain') {
            hourly.precipitation = data.hourly.precipitation || [];
            hourly.rain = data.hourly.rain || [];
            hourly.showers = data.hourly.showers || [];
            hourly.weather_code = data.hourly.weather_code || [];
        } else {
            hourly.cloud_cover = data.hourly.cloud_cover || [];
            hourly.shortwave_radiation = data.hourly.shortwave_radiation || [];
            hourly.direct_radiation = data.hourly.direct_radiation || [];
            hourly.diffuse_radiation = data.hourly.diffuse_radiation || [];
        }

        return {
            hourly,
            metadata: {
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone,
                elevation: data.elevation
            }
        };
    }

    /**
     * Private: Calculate sum of array
     */
    static _sum(arr) {
        return arr.reduce((a, b) => a + b, 0);
    }

    /**
     * Private: Calculate average of array
     */
    static _average(arr) {
        return arr.length > 0 ? this._sum(arr) / arr.length : 0;
    }
}

module.exports = WeatherService;
