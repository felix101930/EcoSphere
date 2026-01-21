const { spawn } = require("child_process");
const path = require("path");

function testNodeIntegration() {
  console.log("Testing Node.js Python Integration");
  console.log("=".repeat(60));

  const pythonScript = path.join(
    __dirname,
    "..",
    "ecosphere-ml-service",
    "node_service.py",
  );
  const pythonExe = "python"; // or 'python3' on Linux/Mac

  // Test with current dates
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const args = [
    pythonScript,
    today,
    tomorrow,
    "51.0447", // lat
    "-114.0719", // lon
    "true", // use_weather
    "false", // force_fresh
  ];

  console.log(`Testing: ${today} to ${tomorrow}`);
  console.log(`Running: ${pythonExe} ${args.slice(1).join(" ")}`);

  const pythonProcess = spawn(pythonExe, args, {
    cwd: __dirname,
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
    console.log(`\nProcess exited with code: ${code}`);

    if (code === 0) {
      try {
        const result = JSON.parse(stdout);
        console.log("Python script executed successfully!");
        console.log(`Generated ${result.data.length} predictions`);
        console.log(`Total kWh: ${result.summary.total_kwh}`);
        console.log(`Peak kW: ${result.summary.peak_kw}`);

        // Show first 3 predictions
        console.log("\nSample predictions:");
        result.data.slice(0, 3).forEach((pred) => {
          const time = pred.timestamp.split("T")[1].substring(0, 5);
          let info = `${time}: ${pred.predicted_kw} kW`;
          if (pred.weather) {
            info += ` | UV: ${pred.weather.uv_index} | Clouds: ${pred.weather.clouds_pct}%`;
          }
          console.log(`   ${info}`);
        });

        console.log("\nNode.js integration test PASSED!");
      } catch (e) {
        console.error("Failed to parse JSON:", e.message);
        console.error("Raw output:", stdout);
      }
    } else {
      console.error("Python script failed");
      console.error("Stderr:", stderr);
    }
  });

  pythonProcess.on("error", (error) => {
    console.error("Failed to spawn Python process:", error);
  });
}

testNodeIntegration();
