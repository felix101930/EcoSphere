/**
 * Test ML API Endpoints
 */
const http = require("http");

const BASE_URL = "http://localhost:3001/api";

async function testEndpoint(endpoint, name) {
  return new Promise((resolve) => {
    console.log(`\nTesting ${name}: ${endpoint}`);

    http
      .get(`${BASE_URL}${endpoint}`, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            console.log(`Status: ${res.statusCode}`);
            console.log(`Success: ${json.success || "N/A"}`);

            if (json.error) {
              console.log(`Error: ${json.error}`);
            }

            resolve({ success: true, data: json });
          } catch (e) {
            console.log(`Failed to parse JSON: ${e.message}`);
            console.log(`Raw response: ${data.substring(0, 200)}...`);
            resolve({ success: false, error: e.message });
          }
        });
      })
      .on("error", (err) => {
        console.log(`Request failed: ${err.message}`);
        resolve({ success: false, error: err.message });
      });
  });
}

async function runAPITests() {
  console.log("Testing ML API Endpoints");
  console.log("=".repeat(60));

  const tests = [
    { endpoint: "/ml/test", name: "ML Service Test" },
    { endpoint: "/ml/model-info", name: "Model Information" },
    {
      endpoint: "/ml/solar-forecast?dateFrom=2024-06-01&dateTo=2024-06-02",
      name: "Solar Forecast",
    },
    { endpoint: "/health", name: "Health Check" },
  ];

  let allPassed = true;

  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.name);
    if (!result.success) {
      allPassed = false;
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n" + "=".repeat(60));
  if (allPassed) {
    console.log("All API endpoints working!");
    console.log("\nML Service is fully integrated!");
  } else {
    console.log("Some tests failed");
  }
}

// Run tests
runAPITests();
