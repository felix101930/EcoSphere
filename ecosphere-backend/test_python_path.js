// test_python_path.js
const { spawn } = require("child_process");

console.log("Testing Python PATH in Node.js server environment");

// Test 1: Simple spawn
console.log("\n1. Testing simple spawn...");
try {
  const python = spawn("python", ["--version"]);
  python.stdout.on("data", (data) => {
    console.log(`Success: ${data}`);
  });
  python.stderr.on("data", (data) => {
    console.log(`Error: ${data}`);
  });
  python.on("close", (code) => {
    console.log(`   Exit code: ${code}`);
  });
  python.on("error", (error) => {
    console.log(`Spawn error: ${error.message}`);
  });
} catch (e) {
  console.log(`Exception: ${e.message}`);
}

// Test 2: Using exec
console.log("\n2. Testing with exec...");
const { exec } = require("child_process");
exec("python --version", (error, stdout, stderr) => {
  if (error) {
    console.log(`Error: ${error.message}`);
    return;
  }
  console.log(`Output: ${stdout}`);
});

// Test 3: Check PATH
console.log("\n3. Checking environment PATH...");
console.log(`   PATH: ${process.env.PATH}`);
