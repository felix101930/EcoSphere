// Test Gemini API directly
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
    console.log("🧪 Testing Gemini API...");
    console.log("API Key:", process.env.GEMINI_API_KEY ? "Found" : "NOT FOUND");

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-pro"
        });

        const prompt = `Return ONLY this JSON (no markdown):
{"status": "success", "message": "Hello"}`;

        console.log("\n📤 Sending test prompt...");
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        console.log("\n📥 Raw Response:");
        console.log(responseText);

        console.log("\n🔍 Parsing JSON...");
        const parsed = JSON.parse(responseText);
        console.log("✅ JSON parsed successfully:");
        console.log(JSON.stringify(parsed, null, 2));

    } catch (error) {
        console.error("\n❌ Error:", error.message);
    }
}

testGemini();
