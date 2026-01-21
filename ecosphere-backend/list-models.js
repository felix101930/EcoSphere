// List available Gemini models
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log("🔍 Listing available Gemini models...");
    console.log("API Key:", API_KEY ? `${API_KEY.substring(0, 10)}...` : "NOT FOUND");

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("❌ Error:", error);
            return;
        }

        const data = await response.json();
        console.log("\n✅ Available models:");
        data.models.forEach(model => {
            console.log(`  - ${model.name}`);
            console.log(`    Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

listModels();
