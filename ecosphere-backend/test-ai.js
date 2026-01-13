// File: D:\school\Y2T2\EcoSphere Merge\EcoSphere\ecosphere-backend\test-ai.js
const { askGemini } = require('./services/aiService');

async function runTest() {
    console.log("Testing Gemini Connection...");
    
    // Test Question
    const question = "Show me the indoor temperature for the last 24 hours.";
    console.log(`Question: "${question}"`);

    const result = await askGemini(question);
    
    console.log("\n--- AI Response ---");
    console.log(JSON.stringify(result, null, 2));
    console.log("-------------------");
}

runTest();