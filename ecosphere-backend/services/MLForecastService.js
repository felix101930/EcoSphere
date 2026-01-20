// ML Forecast Service - Communicates with Python ML model
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const cache = require("../utils/cache");

class MLForecastService {
  constructor() {
    // __dirname = D:\Ecosphere\EcoSphere\ecosphere-backend\services
    // Go up one level to ecosphere-backend, then use correct sibling directory
    this.backendDir = path.join(__dirname, ".."); // ecosphere-backend
    this.projectRoot = path.join(this.backendDir, ".."); // EcoSphere
    this.mlServicePath = path.join(this.projectRoot, "ecosphere-ml-service");
    this.pythonScript = path.join(this.mlServicePath, "node_service.py");
    this.modelPath = path.join(
      this.mlServicePath,
      "solar_forecast_openweather.pkl",
    );

    // Cache TTL (10 minutes for weather, 10 minutes for results)
    this.WEATHER_CACHE_TTL = 10 * 60 * 1000;
    this.RESULT_CACHE_TTL = 10 * 60 * 1000;

    console.log(`🔧 Enhanced ML Service initialized`);
    console.log(`   Python script: ${this.pythonScript}`);

    this.verifySetup();
  }

  verifySetup() {
    const missingFiles = [];

    if (!fs.existsSync(this.pythonScript)) {
      missingFiles.push("node_service.py");
    }

    if (!fs.existsSync(this.modelPath)) {
      missingFiles.push("solar_forecast_openweather.pkl");
    }

    if (missingFiles.length > 0) {
      console.warn(`Missing files: ${missingFiles.join(", ")}`);
      console.warn(`Please check ecosphere-ml-service directory`);
      return false;
    }

    console.log(`All required files found`);
    return true;
  }

  async detectPython() {
    // Try multiple Python executables
    const pythonExecutables = [
      "python", // Default
      "python3", // Linux/Mac
      "py", // Windows Python Launcher
      "python.exe", // Windows
      "python3.exe", // Windows
    ];

    for (const pythonExe of pythonExecutables) {
      try {
        const { exec } = require("child_process");
        const { promisify } = require("util");
        const execPromise = promisify(exec);

        // Try to get Python version
        await execPromise(`${pythonExe} --version`);
        console.log(`Python found: ${pythonExe}`);
        return pythonExe;
      } catch (error) {
        // Continue to next executable
      }
    }

    throw new Error(
      "Python not found. Please ensure Python 3.7+ is installed and in PATH",
    );
  }

  async getPythonWithVenv() {
    // Use the virtual environment Python
    const venvPython = path.join(
      this.mlServicePath,
      ".venv",
      "Scripts",
      "python.exe",
    );

    console.log(`🔧 Looking for virtual environment Python: ${venvPython}`);

    if (fs.existsSync(venvPython)) {
      console.log(`✅ Found virtual environment Python: ${venvPython}`);

      // Verify it works
      try {
        const { exec } = require("child_process");
        const { promisify } = require("util");
        const execPromise = promisify(exec);

        // Test with a simple command
        await execPromise(`"${venvPython}" --version`);
        console.log(`✅ Virtual environment Python verified`);
        return venvPython;
      } catch (error) {
        console.error(`❌ Virtual environment Python failed: ${error.message}`);
      }
    }

    console.log(`⚠️ Virtual environment not found, using system Python`);

    // Fallback to system Python
    return "python";
  }

  async getSolarForecast(dateFrom, dateTo, options = {}) {
    const {
      useCache = true,
      useWeather = true,
      forceFresh = false,
      coordinates = null,
    } = options;

    // Generate cache key
    const cacheKey = `enhanced_forecast_${dateFrom}_${dateTo}_${JSON.stringify(coordinates)}_${useWeather}`;

    // Check cache first
    if (useCache && !forceFresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`📦 Using cached forecast for ${dateFrom} to ${dateTo}`);
        cached.metadata.cache_used = true;
        return cached;
      }
    }

    console.log(`Generating enhanced forecast for ${dateFrom} to ${dateTo}`);

    try {
      const pythonExecutable = await this.getPythonWithVenv();

      // Prepare arguments
      const args = [
        this.pythonScript,
        dateFrom,
        dateTo,
        coordinates?.lat || "null",
        coordinates?.lon || "null",
        useWeather.toString(),
        forceFresh.toString(),
      ];

      return new Promise((resolve, reject) => {
        const pythonProcess = spawn(pythonExecutable, args, {
          cwd: this.mlServicePath,
          stdio: ["pipe", "pipe", "pipe"],
          env: {
            ...process.env,
            OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || "",
          },
        });

        let stdout = "";
        let stderr = "";

        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          const errorText = data.toString();
          stderr += errorText;
          // Log warnings but don't treat as errors
          if (!errorText.includes("Warning") && !errorText.includes("⚠️")) {
            console.error(`Python stderr: ${errorText}`);
          }
        });

        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);

              if (result.success) {
                // Add cache metadata
                result.metadata = {
                  ...result.metadata,
                  cache_used: false,
                  generated_via: "enhanced_service",
                  node_timestamp: new Date().toISOString(),
                };

                // Cache successful result
                if (useCache) {
                  cache.set(cacheKey, result, this.RESULT_CACHE_TTL);
                  console.log(`Forecast cached for 10 minutes`);
                }

                console.log(
                  `Forecast generated: ${result.summary.prediction_count} predictions`,
                );
                console.log(
                  `   Weather data: ${result.model_info.weather_integrated ? "Yes" : "No"}`,
                );
                console.log(
                  `   API calls remaining: ${result.api_stats?.remaining_calls || "N/A"}`,
                );

                resolve(result);
              } else {
                console.error(`ML service failed: ${result.error}`);
                reject(new Error(`ML service error: ${result.error}`));
              }
            } catch (parseError) {
              console.error("Failed to parse Python output:", parseError);
              console.error("Raw output:", stdout);
              reject(new Error("Invalid JSON from ML service"));
            }
          } else {
            console.error(`Python process exited with code ${code}`);
            console.error("Stderr:", stderr);

            // Try to get fallback
            try {
              const fallback = this.getFallbackForecast(dateFrom, dateTo);
              console.log(`⚠️ Using fallback due to Python error`);
              resolve(fallback);
            } catch (fallbackError) {
              reject(new Error(`ML service failed with code ${code}`));
            }
          }
        });

        pythonProcess.on("error", (error) => {
          console.error("Failed to spawn Python process:", error);
          reject(new Error(`Failed to start ML service: ${error.message}`));
        });

        // Set timeout (60 seconds for weather API calls)
        setTimeout(() => {
          if (!pythonProcess.killed) {
            pythonProcess.kill();
            reject(new Error("ML service timeout (60s)"));
          }
        }, 60000);
      });
    } catch (error) {
      console.error("ML service error:", error.message);

      // Return fallback
      return this.getFallbackForecast(dateFrom, dateTo);
    }
  }

  getFallbackForecast(dateFrom, dateTo) {
    console.log(`⚠️ Using fallback forecast for ${dateFrom} to ${dateTo}`);

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    const predictions = [];
    let currentDate = new Date(startDate);

    // Simple season-based forecast
    while (currentDate <= endDate) {
      const month = currentDate.getMonth() + 1;
      const dateStr = currentDate.toISOString().split("T")[0];

      // Seasonal base values
      let baseKW = 0;
      if (month >= 5 && month <= 8) {
        baseKW = 12; // Summer
      } else if (month >= 3 && month <= 10) {
        baseKW = 6; // Spring/Fall
      } else {
        baseKW = 2; // Winter
      }

      // Generate hourly predictions for daylight hours
      for (let hour = 6; hour <= 21; hour++) {
        // Sinusoidal pattern throughout the day
        const hourRad = ((hour - 6) * Math.PI) / 15; // 6am to 9pm = 15 hours
        const hourFactor = Math.sin(hourRad);
        const predictedKW = Math.max(0, baseKW * hourFactor * hourFactor); // Square for peak at noon

        predictions.push({
          timestamp: `${dateStr}T${hour.toString().padStart(2, "0")}:00:00`,
          predicted_kw: parseFloat(predictedKW.toFixed(2)),
          hour: hour,
          date: dateStr,
          is_daylight: 1,
          is_fallback: true,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const total_kwh = predictions.reduce((sum, p) => sum + p.predicted_kw, 0);
    const peak_kw = Math.max(...predictions.map((p) => p.predicted_kw));

    return {
      success: true,
      data: predictions,
      summary: {
        total_kwh: parseFloat(total_kwh.toFixed(2)),
        peak_kw: parseFloat(peak_kw.toFixed(2)),
        prediction_count: predictions.length,
        date_range: { start: dateFrom, end: dateTo },
        avg_kw_per_day: parseFloat(
          (
            total_kwh /
            ((endDate - startDate) / (1000 * 60 * 60 * 24) + 1)
          ).toFixed(2),
        ),
      },
      model_info: {
        name: "FallbackModel",
        r2_score: 0,
        features_used: 0,
        is_fallback: true,
      },
      warning: "Using fallback calculation (ML service unavailable)",
      metadata: {
        generated_at: new Date().toISOString(),
        is_fallback: true,
      },
    };
  }

  async getModelInfo() {
    try {
      const pythonExecutable = await this.getPythonWithVenv();
      const checkScript = path.join(this.mlServicePath, "check_model.py");

      return new Promise((resolve) => {
        const pythonProcess = spawn(pythonExecutable, [checkScript], {
          cwd: this.mlServicePath,
          stdio: ["pipe", "pipe", "pipe"],
        });

        let stdout = "";
        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          console.error("Python stderr:", data.toString());
        });

        pythonProcess.on("close", () => {
          try {
            resolve(JSON.parse(stdout));
          } catch (e) {
            console.error("Failed to parse model info:", e);
            console.error("Raw output:", stdout);
            resolve({
              success: false,
              error: "Failed to parse model info",
            });
          }
        });

        pythonProcess.on("error", (error) => {
          console.error("Python process error:", error);
          resolve({
            success: false,
            error: error.message,
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async testConnection() {
    try {
      // Test with a small date range
      const testDate = new Date();
      const tomorrow = new Date(testDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dateFrom = testDate.toISOString().split("T")[0];
      const dateTo = tomorrow.toISOString().split("T")[0];

      const forecast = await this.getSolarForecast(dateFrom, dateTo);

      return {
        success: true,
        python: "Detected",
        model: "Loaded",
        test_prediction_count: forecast.summary.prediction_count,
        is_fallback: forecast.model_info.is_fallback || false,
        message: forecast.warning || "ML service operational",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        python: "Check installation",
        model: "Not loaded",
      };
    }
  }

  async getApiStats() {
    try {
      const pythonExecutable = await this.getPythonWithVenv();

      // Use the PERMANENT file
      const statsScript = path.join(this.mlServicePath, "get_api_stats.py");

      // Check if file exists
      if (!fs.existsSync(statsScript)) {
        console.error("get_api_stats.py not found at:", statsScript);
        return {
          success: false,
          error: "API stats script not found",
          calls_today: 0,
          max_calls_per_day: 950,
          remaining_calls: 950,
        };
      }

      return new Promise((resolve) => {
        const pythonProcess = spawn(pythonExecutable, [statsScript], {
          cwd: this.mlServicePath,
          stdio: ["pipe", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        pythonProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              // Try to parse JSON from stdout
              const result = JSON.parse(stdout.trim());
              console.log("API stats received successfully");
              resolve(result);
            } catch (parseError) {
              console.error("Failed to parse API stats JSON:", parseError);
              console.error("Raw stdout:", stdout);
              console.error("Raw stderr:", stderr);

              // Try to parse from stderr if stdout is empty
              if (stdout.trim() === "" && stderr.trim() !== "") {
                try {
                  const result = JSON.parse(stderr.trim());
                  resolve(result);
                } catch (e) {
                  // If both fail, return fallback
                  resolve({
                    success: false,
                    error: `Parse error: ${parseError.message}`,
                    calls_today: 0,
                    max_calls_per_day: 950,
                    remaining_calls: 950,
                  });
                }
              } else {
                resolve({
                  success: false,
                  error: "Invalid JSON response",
                  calls_today: 0,
                  max_calls_per_day: 950,
                  remaining_calls: 950,
                });
              }
            }
          } else {
            console.error(`Python process exited with code ${code}`);
            console.error("Stderr:", stderr);
            resolve({
              success: false,
              error: `Python process failed with code ${code}`,
              calls_today: 0,
              max_calls_per_day: 950,
              remaining_calls: 950,
            });
          }
        });

        pythonProcess.on("error", (error) => {
          console.error("Python process error:", error);
          resolve({
            success: false,
            error: error.message,
            calls_today: 0,
            max_calls_per_day: 950,
            remaining_calls: 950,
          });
        });

        // Set timeout
        setTimeout(() => {
          if (!pythonProcess.killed) {
            pythonProcess.kill();
            resolve({
              success: false,
              error: "API stats timeout",
              calls_today: 0,
              max_calls_per_day: 950,
              remaining_calls: 950,
            });
          }
        }, 10000);
      });
    } catch (error) {
      console.error("getApiStats error:", error);
      return {
        success: false,
        error: error.message,
        calls_today: 0,
        max_calls_per_day: 950,
        remaining_calls: 950,
      };
    }
  }
}

// Create singleton instance
const mlForecastService = new MLForecastService();

module.exports = mlForecastService;
