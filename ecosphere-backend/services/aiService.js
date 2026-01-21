// ecosphere-backend/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SYSTEM_CONTEXT } = require("../utils/aiContext.js");
const path = require('path');
// FORCE it to look in the backend folder for .env, regardless of where you run node from
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Clean markdown code blocks from response
 * Gemini sometimes returns JSON wrapped in ```json ... ```
 */
function cleanMarkdownCodeBlocks(text) {
    // Remove ```json and ``` markers
    let cleaned = text.trim();

    // Remove opening code block
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
    }

    // Remove closing code block
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    return cleaned.trim();
}

async function askGemini(userQuestion) {
    try {
        console.log("🔑 API Key status:", process.env.GEMINI_API_KEY ? "Found" : "NOT FOUND");

        // Using Gemini 2.5 Flash (stable version)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.1  // Lower temperature for more consistent output
            }
        });

        const prompt = `${SYSTEM_CONTEXT}\nUSER QUESTION: "${userQuestion}"`;

        console.log("📤 Sending request to Gemini...");
        const result = await model.generateContent(prompt);

        console.log("📥 Received response from Gemini");

        // Check if response exists
        if (!result || !result.response) {
            console.error("❌ No response from Gemini");
            return { error: "AI service returned no response" };
        }

        let responseText = result.response.text();

        console.log("🤖 Raw response length:", responseText.length);
        console.log("🤖 Raw response (first 300 chars):", responseText.substring(0, 300));

        // Check if response is empty
        if (!responseText || responseText.trim().length === 0) {
            console.error("❌ Empty response from Gemini");
            return { error: "AI service returned empty response. Please try again." };
        }

        // Clean markdown code blocks
        responseText = cleanMarkdownCodeBlocks(responseText);
        console.log("🧹 Cleaned response (first 300 chars):", responseText.substring(0, 300));

        // Try to parse JSON
        try {
            const parsed = JSON.parse(responseText);
            console.log("✅ JSON parsed successfully");
            return parsed;
        } catch (parseError) {
            console.error("❌ JSON Parse Error:", parseError.message);
            console.error("Full cleaned response:", responseText);
            return {
                error: "AI returned invalid JSON format. Please try rephrasing your question.",
                rawResponse: responseText.substring(0, 500)
            };
        }

    } catch (error) {
        console.error("❌ AI Service Error:", error.message);
        console.error("Error stack:", error.stack);

        if (error.message.includes('API key')) {
            return { error: "AI service configuration error. Please contact administrator." };
        }
        if (error.message.includes('quota')) {
            return { error: "AI service quota exceeded. Please try again later." };
        }
        if (error.message.includes('models/gemini')) {
            return { error: "AI model not available. Please try again later." };
        }
        if (error.message.includes('SAFETY')) {
            return { error: "Request blocked by safety filters. Please rephrase your question." };
        }
        return { error: `AI service failed: ${error.message}` };
    }
}

module.exports = { askGemini };
