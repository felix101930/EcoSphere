const express = require('express');
const router = express.Router();
const { askGemini } = require('../services/aiService');

// ✅ FIXED IMPORT: Destructure the named export
const { sqlcmdQuery } = require('../db/sqlcmdQuery'); 

router.post('/ask', async (req, res) => {
    try {
        const { question } = req.body;
        console.log(`🤖 AI Request: "${question}"`);

        const aiResponse = await askGemini(question);

        if (aiResponse.error) return res.json({ error: aiResponse.error });

        if (aiResponse.sql) {
            console.log(`⚡ Executing SQL: ${aiResponse.sql}`);
            
            // Execute
            const data = await sqlcmdQuery(aiResponse.sql);
            
            return res.json({
                answer: "Here is the data found:",
                chartConfig: aiResponse.chartConfig,
                data: data
            });
        }
        return res.status(500).json({ error: "No SQL generated" });

    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;