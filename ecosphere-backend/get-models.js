// ecosphere-backend/get-models.js
const path = require('path');
// Force load the local .env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function listAvailableModels() {
    const key = process.env.GEMINI_API_KEY;
    
    if (!key) {
        console.error("❌ NO API KEY FOUND in ecosphere-backend/.env");
        process.exit(1);
    }

    console.log(`🔑 Using Key: ${key.substring(0, 10)}...`);
    console.log("📡 Querying Google API for available models...");

    try {
        // We hit the API directly to be 100% sure what the server allows
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API ERROR:", data.error.message);
            return;
        }

        console.log("\n✅ AVAILABLE GEMINI MODELS:");
        const models = data.models || [];
        
        // Filter only gemini models and print clean IDs
        const geminiModels = models
            .map(m => m.name.replace('models/', ''))
            .filter(name => name.includes('gemini'));

        if (geminiModels.length === 0) {
            console.log("No 'gemini' models found. You might need to enable the API in Google Cloud Console.");
        } else {
            geminiModels.forEach(name => console.log(` - ${name}`));
        }
        
    } catch (err) {
        console.error("Script failed:", err);
    }
}

listAvailableModels();