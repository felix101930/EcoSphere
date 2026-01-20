const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

class MLForecastService {
  constructor() {
    // Store the full 48-hour dataset for filtering
    this.fullDatasetCache = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
  }

  /**
   * Check if cache is valid
   */
  isCacheValid() {
    if (!this.fullDatasetCache || !this.cacheTimestamp) {
      return false;
    }
    const age = Date.now() - this.cacheTimestamp;
    return age < this.CACHE_DURATION;
  }

  /**
   * Get solar generation forecast with smart caching
   * Always fetches 48 hours and caches it for 10 minutes
   * @param {string} dateFrom - Start date (YYYY-MM-DD)
   * @param {string} dateTo - End date (YYYY-MM-DD)
   * @param {Object} options - Additional options
   * @returns {Promise} Full 48-hour forecast data
   */
  async getSolarForecast(dateFrom, dateTo, options = {}) {
    const {
      useCache = true,
      useWeather = true,
      forceFresh = false,
      coordinates = null,
    } = options;

    try {
      // Check if we have valid cached data (unless force refresh)
      if (useCache && !forceFresh && this.isCacheValid()) {
        console.log(
          `📦 Using cached 48-hour dataset (age: ${Math.round((Date.now() - this.cacheTimestamp) / 1000)}s)`,
        );
        return this.fullDatasetCache;
      }

      // Always request 48 hours to get complete dataset
      const start = new Date(dateFrom);
      const end = new Date(start);
      end.setHours(end.getHours() + 48);

      const adjustedDateFrom = start.toISOString().split("T")[0];
      const adjustedDateTo = end.toISOString().split("T")[0];

      console.log(
        `📡 Fetching 48-hour forecast: ${adjustedDateFrom} to ${adjustedDateTo}`,
      );

      // Build query parameters
      const params = new URLSearchParams({
        dateFrom: adjustedDateFrom,
        dateTo: adjustedDateTo,
        useCache: useCache.toString(),
        useWeather: useWeather.toString(),
        forceFresh: forceFresh.toString(),
      });

      // Add coordinates if provided
      if (coordinates) {
        params.append("lat", coordinates.lat);
        params.append("lon", coordinates.lon);
      }

      const response = await fetch(
        `${API_BASE_URL}/ml/solar-forecast?${params}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch solar forecast: ${response.statusText}`,
        );
      }

      const result = await response.json();

      // Store the full 48-hour dataset with metadata
      this.fullDatasetCache = {
        ...result,
        _metadata: {
          isFullDataset: true,
          totalHoursAvailable: 48,
          datasetHours: result.data?.length || 0,
          cachedAt: new Date().toISOString(),
          willExpireAt: new Date(
            Date.now() + this.CACHE_DURATION,
          ).toISOString(),
        },
      };
      this.cacheTimestamp = Date.now();

      console.log(
        `✅ 48-hour dataset loaded: ${result.data?.length || 0} predictions`,
      );
      console.log(`💾 Cached for ${this.CACHE_DURATION / 60000} minutes`);

      return this.fullDatasetCache;
    } catch (error) {
      console.error("Error fetching ML forecast:", error);

      // If cache exists but API failed, return cached data
      if (this.fullDatasetCache && !forceFresh) {
        console.log("⚠️ API failed, using cached data");
        return this.fullDatasetCache;
      }

      // Return fallback
      return this.getFallbackForecast();
    }
  }

  /**
   * Get filtered forecast for specific number of hours
   * Uses cached 48-hour dataset if available
   * @param {number} hours - Number of hours to show (1-48)
   * @param {Object} fullForecast - Optional: Full forecast object (if not using cache)
   * @param {boolean} includeNighttime - Optional: Include nighttime hours (default: true)
   * @returns {Object} Filtered forecast data
   */
  getFilteredForecast(hours, fullForecast = null, includeNighttime = true) {
    const forecast = fullForecast || this.fullDatasetCache;

    if (!forecast || !forecast.data || forecast.data.length === 0) {
      console.warn("No forecast data available for filtering");
      return null;
    }

    // Get current time
    const now = new Date();
    const currentHour = now.getHours();

    // Filter: only future predictions starting from next hour
    const filteredData = forecast.data
      .filter((item) => {
        const itemTime = new Date(item.timestamp);

        // Skip if in the past
        if (itemTime < now) return false;

        // Skip current hour if less than 30 minutes left
        if (itemTime.getHours() === currentHour && now.getMinutes() > 30) {
          return false;
        }

        return true; // Include ALL hours (day and night)
      })
      .slice(0, hours); // Take only requested hours

    // Calculate summary for filtered data
    const total_kwh = filteredData.reduce(
      (sum, item) => sum + item.predicted_kw,
      0,
    );
    const peak_kw = Math.max(...filteredData.map((item) => item.predicted_kw));

    // Count daytime vs nighttime
    const daytimeHours = filteredData.filter(
      (item) => item.is_daylight === 1,
    ).length;
    const nighttimeHours = filteredData.filter(
      (item) => item.is_daylight === 0,
    ).length;

    // Get weather stats from filtered data
    const weatherData = filteredData.filter((item) => item.weather);
    const hasWeatherData = weatherData.length > 0;
    const avgUV = hasWeatherData
      ? weatherData.reduce(
          (sum, item) => sum + (item.weather?.uv_index || 0),
          0,
        ) / weatherData.length
      : 0;
    const avgClouds = hasWeatherData
      ? weatherData.reduce(
          (sum, item) => sum + (item.weather?.clouds_pct || 0),
          0,
        ) / weatherData.length
      : 0;

    return {
      success: true,
      data: filteredData,
      summary: {
        total_kwh: parseFloat(total_kwh.toFixed(2)),
        peak_kw: parseFloat(peak_kw.toFixed(2)),
        prediction_count: filteredData.length,
        daytime_hours: daytimeHours,
        nighttime_hours: nighttimeHours,
        requested_hours: hours,
        actual_hours_shown: filteredData.length,
        weather_quality: {
          weather_data_available: hasWeatherData,
          avg_uv_index: parseFloat(avgUV.toFixed(2)),
          avg_cloud_cover: parseFloat(avgClouds.toFixed(1)),
        },
        cache_info: {
          using_cached_dataset: this.isCacheValid(),
          cache_age_seconds: this.cacheTimestamp
            ? Math.round((Date.now() - this.cacheTimestamp) / 1000)
            : null,
        },
      },
      model_info: forecast.model_info || {
        name: "RandomForestRegressor",
        weather_integrated: hasWeatherData,
        r2_score: 0.693,
        features_used: 17,
      },
      api_stats: forecast.api_stats,
      ui_metadata: {
        generated_at: new Date().toISOString(),
        is_filtered_view: true,
        original_dataset_hours: forecast.data.length,
        filtered_to_hours: hours,
        note: `Showing ${filteredData.length} hours (${daytimeHours} daytime, ${nighttimeHours} nighttime)`,
      },
    };
  }

  /**
   * Get fallback forecast when ML service fails
   */
  getFallbackForecast() {
    console.log("⚠️ Using fallback forecast data");

    // Generate 48 hours of fallback data
    const hourlyData = [];
    const now = new Date();

    for (let i = 1; i <= 48; i++) {
      const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = timestamp.getHours();

      // Only include daytime hours for fallback too
      if (hour >= 6 && hour <= 21) {
        const isDaytime = hour >= 6 && hour <= 21;
        const basePower = isDaytime ? 2.5 : 0.5;

        hourlyData.push({
          timestamp: timestamp.toISOString(),
          predicted_kw: basePower + Math.random() * 1.5,
          hour: hour,
          date: timestamp.toISOString().split("T")[0],
          is_daylight: isDaytime ? 1 : 0,
          is_forecast: 1,
          weather: {
            uv_index: isDaytime ? 3 : 0,
            clouds_pct: 50,
            temperature_c: 20,
            weather_main: "Clear",
            weather_description: "clear sky",
          },
        });
      }
    }

    const total_kwh = hourlyData.reduce(
      (sum, item) => sum + item.predicted_kw,
      0,
    );
    const peak_kw = Math.max(...hourlyData.map((item) => item.predicted_kw));

    return {
      success: true,
      data: hourlyData,
      summary: {
        total_kwh: parseFloat(total_kwh.toFixed(2)),
        peak_kw: parseFloat(peak_kw.toFixed(2)),
        prediction_count: hourlyData.length,
        weather_quality: {
          weather_data_available: true,
          avg_uv_index: 3,
          avg_cloud_cover: 50,
        },
        is_fallback: true,
      },
      model_info: {
        name: "Fallback Model",
        is_fallback: true,
        weather_integrated: true,
        r2_score: 0.693,
        features_used: 17,
      },
      ui_metadata: {
        generated_at: new Date().toISOString(),
        is_fallback: true,
        disclaimer: "Using fallback simulation data",
      },
      _metadata: {
        isFullDataset: true,
        totalHoursAvailable: 48,
        datasetHours: hourlyData.length,
        cachedAt: new Date().toISOString(),
        isFallback: true,
      },
    };
  }

  /**
   * Get weather quality indicator
   */
  getWeatherQuality(weatherQuality) {
    if (!weatherQuality) return "unknown";

    const {
      avg_uv_index = 0,
      avg_cloud_cover = 50,
      weather_data_available,
    } = weatherQuality;

    if (!weather_data_available) return "no_data";

    // Calculate quality score
    let score = 0;

    // Higher UV is better for solar
    if (avg_uv_index > 5) score += 2;
    else if (avg_uv_index > 3) score += 1;
    else if (avg_uv_index > 1) score += 0.5;

    // Lower cloud cover is better
    if (avg_cloud_cover < 20) score += 2;
    else if (avg_cloud_cover < 40) score += 1;
    else if (avg_cloud_cover < 60) score += 0.5;

    // Determine quality level
    if (score >= 3) return "excellent";
    if (score >= 2) return "good";
    if (score >= 1) return "fair";
    return "poor";
  }

  /**
   * Format forecast for charts with weather data
   */
  formatForecastForCharts(forecastData) {
    console.log("📈 Formatting forecast for charts:", forecastData);

    if (!forecastData || !forecastData.data || forecastData.data.length === 0) {
      console.warn("No forecast data to format");
      return {
        hourly: [],
        daily: [],
        weather_series: [],
        disclaimer: "No forecast data available",
      };
    }

    const limitedData = forecastData.data;
    console.log(`📊 Formatting ${limitedData.length} data points`);

    const hourly = limitedData.map((item) => ({
      timestamp: new Date(item.timestamp),
      predicted_kw: item.predicted_kw,
      hour: item.hour,
      date: item.date,
      is_daylight: item.is_daylight === 1,
      weather: item.weather || {},
      disclaimer: item.disclaimer || "For reference only",
    }));

    // Prepare weather series
    const weatherSeries = {
      uv_index: limitedData
        .filter((item) => item.weather?.uv_index !== undefined)
        .map((item) => ({
          timestamp: new Date(item.timestamp),
          value: item.weather.uv_index,
          hour: item.hour,
        })),
      cloud_cover: limitedData
        .filter((item) => item.weather?.clouds_pct !== undefined)
        .map((item) => ({
          timestamp: new Date(item.timestamp),
          value: item.weather.clouds_pct,
          hour: item.hour,
        })),
      temperature: limitedData
        .filter((item) => item.weather?.temperature_c !== undefined)
        .map((item) => ({
          timestamp: new Date(item.timestamp),
          value: item.weather.temperature_c,
          hour: item.hour,
        })),
    };

    console.log("🌤️ Weather series counts:", {
      uv_index: weatherSeries.uv_index.length,
      cloud_cover: weatherSeries.cloud_cover.length,
      temperature: weatherSeries.temperature.length,
    });

    // Calculate totals
    const total_kwh = hourly.reduce((sum, item) => sum + item.predicted_kw, 0);
    const peak_kw = Math.max(...hourly.map((item) => item.predicted_kw));

    return {
      hourly,
      weather_series: weatherSeries,
      summary: {
        total_kwh: parseFloat(total_kwh.toFixed(2)),
        peak_kw: parseFloat(peak_kw.toFixed(2)),
        hours: hourly.length,
        weather_data_points: Object.values(weatherSeries).reduce(
          (sum, series) => sum + series.length,
          0,
        ),
        disclaimer: `${hourly.length}-hour forecast with weather data`,
      },
    };
  }

  /**
   * Get quick forecast options
   */
  getQuickForecastOptions() {
    return [
      { value: 1, label: "Next Hour", hours: 1 },
      { value: 5, label: "Next 5 Hours", hours: 5 },
      { value: 12, label: "Next 12 Hours", hours: 12 },
      { value: 24, label: "Next 24 Hours", hours: 24 },
      { value: 48, label: "Next 48 Hours", hours: 48 },
      { value: "custom", label: "Custom Hours" },
    ];
  }

  /**
   * Calculate date range for forecast hours
   */
  getDateRangeForHours(hours, startDate = new Date()) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setHours(end.getHours() + hours);

    // Ensure we don't exceed 48 hours
    const actualHours = Math.min(hours, 48);
    if (hours > 48) {
      console.warn(
        `Forecast limited to 48 hours maximum (requested: ${hours})`,
      );
    }

    return {
      dateFrom: start.toISOString().split("T")[0],
      dateTo: end.toISOString().split("T")[0],
      hours: actualHours,
    };
  }

  /**
   * Get ML model info with API stats
   */
  async getModelInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/ml/model-info`);
      if (!response.ok) throw new Error("Failed to fetch model info");
      return await response.json();
    } catch (error) {
      console.error("Error fetching model info:", error);
      return null;
    }
  }

  /**
   * Get API usage statistics
   */
  async getApiStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/ml/api-stats`);
      if (!response.ok) throw new Error("Failed to fetch API stats");
      return await response.json();
    } catch (error) {
      console.error("Error fetching API stats:", error);
      return null;
    }
  }

  /**
   * Clear the cached dataset
   */
  clearCache() {
    this.fullDatasetCache = null;
    this.cacheTimestamp = null;
    console.log("🗑️ Cleared ML forecast cache");
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    return {
      hasCache: !!this.fullDatasetCache,
      isCacheValid: this.isCacheValid(),
      cacheAge: this.cacheTimestamp
        ? Math.round((Date.now() - this.cacheTimestamp) / 1000)
        : null,
      cacheDuration: this.CACHE_DURATION / 1000,
      datasetHours: this.fullDatasetCache?.data?.length || 0,
    };
  }
}

// Export singleton
const mlForecastService = new MLForecastService();
export default mlForecastService;
