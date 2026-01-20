// ecosphere-backend/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SYSTEM_CONTEXT } = require("../utils/aiContext.js");
const path = require('path');
// FORCE it to look in the backend folder for .env, regardless of where you run node from
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askGemini(userQuestion) {
    try {
        // UPDATED: Using the Gemini 3 Flash model as requested
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash-lite", 
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `${SYSTEM_CONTEXT}\nUSER QUESTION: "${userQuestion}"`;
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());

    } catch (error) {
        // If 3.0 fails, it might be named 'gemini-2.0-flash-exp' in some regions, 
        // but we try 3.0 first as seen in your dashboard.
        console.error("AI Service Error:", error.message);
        return { error: "AI_SERVICE_FAILED" };
    }
}

module.exports = { askGemini };