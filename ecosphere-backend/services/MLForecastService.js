// ML Forecast Service - Communicates with Python ML model
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const cache = require("../utils/cache");

class MLForecastService {
  constructor() {
    // Paths - adjust based on your project structure
    this.projectRoot = path.join(__dirname, "..", "..");
    this.mlServicePath = path.join(this.projectRoot, "ecosphere-ml-service");
    this.pythonScript = path.join(this.mlServicePath, "node_service.py");
    this.modelPath = path.join(
      this.mlServicePath,
      "solar_forecast_openweather.pkl",
    );

    // Cache TTL (1 hour)
    this.CACHE_TTL = 60 * 60 * 1000;

    console.log(`🔧 ML Service initialized`);
    console.log(`   Python script: ${this.pythonScript}`);
    console.log(`   Model path: ${this.modelPath}`);

    this.verifySetup();
  }

  verifySetup() {
    // Check if files exist
    const missingFiles = [];

    if (!fs.existsSync(this.pythonScript)) {
      missingFiles.push("node_service.py");
    }

    if (!fs.existsSync(this.modelPath)) {
      missingFiles.push("solar_forecast_openweather.pkl");
    }

    if (missingFiles.length > 0) {
      console.warn(`⚠️  Missing files: ${missingFiles.join(", ")}`);
      console.warn(`   Please check ecosphere-ml-service directory`);
    } else {
      console.log(`✅ All required files found`);
    }
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
        console.log(`✅ Python found: ${pythonExe}`);
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
    try {
      // First try direct Python
      return await this.detectPython();
    } catch (error) {
      // Try using virtual environment
      const venvPython = path.join(
        this.mlServicePath,
        "venv",
        "Scripts",
        "python.exe",
      );
      if (fs.existsSync(venvPython)) {
        console.log(`✅ Using virtual environment Python: ${venvPython}`);
        return venvPython;
      }

      const venvPythonUnix = path.join(
        this.mlServicePath,
        "venv",
        "bin",
        "python",
      );
      if (fs.existsSync(venvPythonUnix)) {
        console.log(`✅ Using virtual environment Python: ${venvPythonUnix}`);
        return venvPythonUnix;
      }

      throw error;
    }
  }

  async getSolarForecast(dateFrom, dateTo, useCache = true) {
    const cacheKey = `ml_forecast_${dateFrom}_${dateTo}`;

    // Check cache first
    if (useCache) {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`📦 Using cached forecast for ${dateFrom} to ${dateTo}`);
        return cached;
      }
    }

    console.log(`🤖 Generating ML forecast for ${dateFrom} to ${dateTo}`);

    try {
      const pythonExecutable = await this.getPythonWithVenv();

      return new Promise((resolve, reject) => {
        // Spawn Python process
        const pythonProcess = spawn(
          pythonExecutable,
          [this.pythonScript, dateFrom, dateTo],
          {
            cwd: this.mlServicePath,
            stdio: ["pipe", "pipe", "pipe"],
          },
        );

        let stdout = "";
        let stderr = "";

        // Collect output
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

        // Handle process completion
        pythonProcess.on("close", (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);

              if (result.success) {
                // Cache successful result
                cache.set(cacheKey, result, this.CACHE_TTL);
                console.log(
                  `✅ Forecast generated: ${result.summary.prediction_count} predictions`,
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
            reject(new Error(`ML service failed with code ${code}`));
          }
        });

        pythonProcess.on("error", (error) => {
          console.error("Failed to spawn Python process:", error);
          reject(new Error(`Failed to start ML service: ${error.message}`));
        });

        // Set timeout (45 seconds)
        setTimeout(() => {
          if (!pythonProcess.killed) {
            pythonProcess.kill();
            reject(new Error("ML service timeout (45s)"));
          }
        }, 45000);
      });
    } catch (error) {
      console.error("ML service error:", error.message);

      // Return fallback instead of failing completely
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
}

// Create singleton instance
const mlForecastService = new MLForecastService();

module.exports = mlForecastService;
