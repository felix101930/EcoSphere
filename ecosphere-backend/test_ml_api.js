/**
 * Simple ML Integration Test
 * Tests ML service directly without starting server
 */
const MLForecastService = require("./services/MLForecastService");

async function runSimpleTest() {
  console.log("🔧 Testing ML Service Integration");
  console.log("=".repeat(60));

  console.log("\n1. Testing Python detection...");
  try {
    const python = await MLForecastService.getPythonWithVenv();
    console.log(`   ✅ Python found: ${python}`);
  } catch (error) {
    console.log(`   ❌ Python not found: ${error.message}`);
    console.log("   💡 Make sure Python 3.7+ is installed and in PATH");
    return false;
  }

  console.log("\n2. Testing model loading...");
  try {
    const modelInfo = await MLForecastService.getModelInfo();
    if (modelInfo.success) {
      console.log(`   ✅ Model loaded: ${modelInfo.model?.type || "Unknown"}`);
      console.log(`   📊 Features: ${modelInfo.model?.feature_count || 0}`);
      if (modelInfo.model?.metrics?.r2) {
        console.log(`   🎯 R² Score: ${modelInfo.model.metrics.r2.toFixed(3)}`);
      }
    } else {
      console.log(`   ❌ Model loading failed: ${modelInfo.error}`);
      console.log(
        "   💡 Check if model file exists: ml-service/solar_forecast_openweather.pkl",
      );
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Model test failed: ${error.message}`);
    return false;
  }

  console.log("\n3. Testing forecast generation...");
  try {
    const forecast = await MLForecastService.getSolarForecast(
      "2024-06-01",
      "2024-06-02",
      false,
    );

    if (forecast.success) {
      console.log(`   ✅ Forecast generated successfully`);
      console.log(
        `   📈 Total predictions: ${forecast.summary.prediction_count}`,
      );
      console.log(`   🔋 Total kWh: ${forecast.summary.total_kwh.toFixed(1)}`);
      console.log(`   🏔️  Peak kW: ${forecast.summary.peak_kw.toFixed(2)}`);
      console.log(`   🤖 Model used: ${forecast.model_info.name}`);

      if (forecast.warning) {
        console.log(`   ⚠️  Note: ${forecast.warning}`);
      }

      // Show a sample prediction
      if (forecast.data && forecast.data.length > 0) {
        console.log(`\n   📋 Sample prediction:`);
        const sample = forecast.data[0];
        console.log(`      Time: ${sample.timestamp}`);
        console.log(`      Predicted: ${sample.predicted_kw} kW`);
        console.log(`      Hour: ${sample.hour}`);
        console.log(`      Date: ${sample.date}`);
      }
    } else {
      console.log(`   ❌ Forecast generation failed`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Forecast test failed: ${error.message}`);
    console.log("   💡 Check if Python script is executable");
    return false;
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ All tests passed! ML Service is ready.");
  console.log("\n🚀 Next steps:");
  console.log("   1. Start your server: npm start");
  console.log("   2. Test API endpoints in browser or with curl:");
  console.log("      - GET http://localhost:3000/api/ml/test");
  console.log(
    "      - GET http://localhost:3000/api/ml/solar-forecast?dateFrom=2024-06-01&dateTo=2024-06-02",
  );
  console.log("   3. Check the health endpoint:");
  console.log("      - GET http://localhost:3000/api/health");

  return true;
}

// Run the test
runSimpleTest().then((success) => {
  if (success) {
    console.log("\n✨ Ready for frontend integration!");
  } else {
    console.log("\n🔧 Please fix the issues above before proceeding.");
    process.exit(1);
  }
});
