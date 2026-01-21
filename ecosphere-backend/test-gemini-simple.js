// Simple Gemini test
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    console.log("Testing Gemini 2.5 Flash...");
    console.log("API Key:", process.env.GEMINI_API_KEY ? "Found" : "NOT FOUND");

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const prompt = "Return only this JSON: {\"test\": \"success\"}";

        console.log("\nSending prompt...");
        const result = await model.generateContent(prompt);

        console.log("\nResponse received");
        const text = result.response.text();
        console.log("Response length:", text.length);
        console.log("Response:", text);

        const parsed = JSON.parse(text);
        console.log("\n✅ Success:", parsed);

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        if (error.response) {
            console.error("Response:", error.response);
        }
    }
}

test();
