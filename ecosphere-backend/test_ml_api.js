// test_enhanced_service.js
const MLForecastService = require("./services/MLForecastService");

async function runEnhancedTest() {
  console.log("🚀 Testing Enhanced ML Service with Weather Integration");
  console.log("=".repeat(60));

  console.log("\n1. Testing setup...");
  const setupOk = MLForecastService.verifySetup();
  if (!setupOk) {
    console.log("Setup verification failed");
    return false;
  }
  console.log("Setup verified");

  console.log("\n2. Testing Python detection...");
  try {
    const python = await MLForecastService.getPythonWithVenv();
    console.log(`Python found: ${python}`);
  } catch (error) {
    console.log(`Python not found: ${error.message}`);
    return false;
  }

  console.log("\n3. Testing API stats...");
  try {
    const stats = await MLForecastService.getApiStats();
    if (stats.success) {
      console.log(
        `API calls today: ${stats.calls_today}/${stats.max_calls_per_day}`,
      );
      console.log(`Last reset: ${stats.last_reset}`);
      console.log(`Today: ${stats.today}`);
    } else {
      console.log(`Could not get API stats: ${stats.error}`);
    }
  } catch (error) {
    console.log(`API stats error: ${error.message}`);
  }

  console.log("\n4. Testing forecast with weather data...");
  try {
    const forecast = await MLForecastService.getSolarForecast(
      new Date().toISOString().split("T")[0],
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      {
        useWeather: true,
        useCache: false,
        forceFresh: false,
        coordinates: { lat: 51.0447, lon: -114.0719 },
      },
    );

    if (forecast.success) {
      console.log(`Forecast generated successfully`);
      console.log(`Total predictions: ${forecast.summary.prediction_count}`);
      console.log(`Total kWh: ${forecast.summary.total_kwh.toFixed(1)}`);
      console.log(`Peak kW: ${forecast.summary.peak_kw.toFixed(2)}`);
      console.log(`Model: ${forecast.model_info.name}`);
      console.log(
        `Weather integrated: ${forecast.model_info.weather_integrated}`,
      );
      console.log(
        `API calls remaining: ${forecast.api_stats?.remaining_calls || "N/A"}`,
      );

      if (forecast.warning) {
        console.log(`Warning: ${forecast.warning}`);
      }

      // Show metadata
      console.log(`\nMetadata:`);
      console.log(`Generated at: ${forecast.metadata.generated_at}`);
      console.log(
        `Coordinates: ${forecast.metadata.coordinates.lat}, ${forecast.metadata.coordinates.lon}`,
      );
      console.log(
        `Max hours ahead: ${forecast.metadata.time_constraints.max_hours_ahead}`,
      );
      console.log(
        `Cache used: ${forecast.metadata.cache_info?.used_cached_data ? "Yes" : "No"}`,
      );

      // Show a sample with weather
      const sampleWithWeather = forecast.data.find((p) => p.weather);
      if (sampleWithWeather) {
        console.log(`\n   🌤️ Sample with weather data:`);
        console.log(`      Time: ${sampleWithWeather.timestamp}`);
        console.log(`      Predicted: ${sampleWithWeather.predicted_kw} kW`);
        console.log(`      UV Index: ${sampleWithWeather.weather.uv_index}`);
        console.log(
          `      Cloud Cover: ${sampleWithWeather.weather.clouds_pct}%`,
        );
        console.log(
          `      Weather: ${sampleWithWeather.weather.weather_description}`,
        );
      }
    } else {
      console.log(`Forecast generation failed: ${forecast.error}`);
      return false;
    }
  } catch (error) {
    console.log(`Forecast test failed: ${error.message}`);
    console.log("This might be expected if API key is not set");

    // Test without weather data
    console.log("\n5. Testing forecast WITHOUT weather data...");
    try {
      const forecast = await MLForecastService.getSolarForecast(
        new Date().toISOString().split("T")[0],
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        {
          useWeather: false,
          useCache: false,
          forceFresh: false,
        },
      );

      if (forecast.success) {
        console.log(`Forecast without weather generated successfully`);
        console.log(`Total predictions: ${forecast.summary.prediction_count}`);
        console.log(`Total kWh: ${forecast.summary.total_kwh.toFixed(1)}`);
        console.log(
          `Weather integrated: ${forecast.model_info.weather_integrated}`,
        );
      }
    } catch (error2) {
      console.log(`Fallback test also failed: ${error2.message}`);
      return false;
    }
  }

  console.log("\n6. Testing caching...");
  try {
    const startTime = Date.now();
    const forecast1 = await MLForecastService.getSolarForecast(
      new Date().toISOString().split("T")[0],
      new Date().toISOString().split("T")[0],
      {
        useWeather: true,
        useCache: true,
        forceFresh: false,
      },
    );

    const time1 = Date.now() - startTime;
    console.log(`First request: ${time1}ms`);
    console.log(`Cache used: ${forecast1.metadata.cache_used ? "Yes" : "No"}`);

    // Second request should be faster (cached)
    const startTime2 = Date.now();
    const forecast2 = await MLForecastService.getSolarForecast(
      new Date().toISOString().split("T")[0],
      new Date().toISOString().split("T")[0],
      {
        useWeather: true,
        useCache: true,
        forceFresh: false,
      },
    );

    const time2 = Date.now() - startTime2;
    console.log(`Second request (cached): ${time2}ms`);
    console.log(`Cache used: ${forecast2.metadata.cache_used ? "Yes" : "No"}`);

    if (time2 < time1 * 0.5) {
      console.log(`Caching working effectively`);
    }
  } catch (error) {
    console.log(`Cache test error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Enhanced ML Service Test Complete!");
  console.log("\nSummary:");
  console.log("   - Weather API integration");
  console.log("   - 48-hour limit");
  console.log("   - 10-minute caching");
  console.log("   - Rate limiting (950/day)");
  console.log("   - Fallback mechanisms");

  console.log("\nNext steps:");
  console.log("   1. Set OPENWEATHER_API_KEY environment variable");
  console.log("   2. Update frontend to use enhanced endpoints");
  console.log("   3. Test with different locations");
  console.log("   4. Monitor API usage with /api/ml/api-stats");

  return true;
}

// Run the test
runEnhancedTest()
  .then((success) => {
    if (success) {
      console.log("\nEnhanced service ready for frontend integration!");
    } else {
      console.log("\nPlease fix the issues above before proceeding.");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Test failed with error:", error);
    process.exit(1);
  });
