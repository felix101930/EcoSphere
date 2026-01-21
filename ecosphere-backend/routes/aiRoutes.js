const express = require('express');
const router = express.Router();
const { askGemini } = require('../services/aiService');
const { protect } = require('../middleware/authMiddleware');
const AccessControl = require('../models/AccessControl');
const connectionManager = require('../db/connectionManager');

// Available report modules in the system
const AVAILABLE_MODULES = {
    'electricity': 'Electricity Report',
    'water': 'Water Report',
    'thermal': 'Thermal Report',
    'natural-gas': 'Natural Gas Report',
    'carbon-footprint': 'Carbon Footprint Calculator'
};

// Map AI intent to module permissions
const INTENT_TO_MODULE = {
    'electricity': 'electricity',
    'power': 'electricity',
    'solar': 'electricity',
    'generation': 'electricity',
    'consumption': 'electricity',
    'water': 'water',
    'rainwater': 'water',
    'hotwater': 'water',
    'thermal': 'thermal',
    'temperature': 'thermal',
    'heating': 'thermal',
    'cooling': 'thermal',
    'gas': 'natural-gas',
    'naturalgas': 'natural-gas',
    'carbon': 'carbon-footprint',
    'co2': 'carbon-footprint',
    'footprint': 'carbon-footprint'
};

/**
 * Detect which module the user is trying to access based on their question
 */
function detectModuleFromQuestion(question) {
    const lowerQuestion = question.toLowerCase().replace(/\s+/g, '');

    for (const [keyword, module] of Object.entries(INTENT_TO_MODULE)) {
        if (lowerQuestion.includes(keyword)) {
            return module;
        }
    }

    return null; // General query, no specific module
}

/**
 * AI Analyst endpoint - Protected route with permission checking
 */
router.post('/ask', protect, async (req, res) => {
    try {
        const { question } = req.body;
        const user = req.user;

        console.log(`🤖 AI Request from ${user.email} (${user.role}): "${question}"`);

        // Detect which module the user is trying to access
        const detectedModule = detectModuleFromQuestion(question);

        if (detectedModule) {
            console.log(`📊 Detected module: ${detectedModule}`);

            // Check if module exists in system
            if (!AVAILABLE_MODULES[detectedModule]) {
                return res.json({
                    error: `The requested report type is not available in the system.`,
                    suggestion: `Available reports: ${Object.values(AVAILABLE_MODULES).join(', ')}`
                });
            }

            // SuperAdmin and Admin have access to all modules
            if (user.role === 'SuperAdmin' || user.role === 'Admin') {
                console.log(`✅ ${user.role} has full access to all modules`);
            } else {
                // Check user permissions for TeamMember
                const hasPermission = AccessControl.checkPermission(user, detectedModule);

                if (!hasPermission) {
                    console.log(`❌ Permission denied for ${user.email} to access ${detectedModule}`);
                    return res.status(403).json({
                        error: `You do not have permission to access ${AVAILABLE_MODULES[detectedModule]}.`,
                        requiredPermission: detectedModule,
                        userRole: user.role,
                        message: 'Please contact your administrator to request access.'
                    });
                }

                console.log(`✅ Permission granted for ${detectedModule}`);
            }
        }

        // Call AI to generate SQL
        const aiResponse = await askGemini(question);

        if (aiResponse.error) {
            return res.json({ error: aiResponse.error });
        }

        if (aiResponse.sql) {
            console.log(`⚡ Executing SQL: ${aiResponse.sql}`);

            try {
                // Execute SQL query using connectionManager
                const data = await connectionManager.executeQuery(aiResponse.sql);

                console.log(`📊 Query returned ${data ? data.length : 0} rows`);
                console.log(`📊 First row sample:`, data && data.length > 0 ? JSON.stringify(data[0]) : 'No data');

                if (!data || data.length === 0) {
                    return res.json({
                        answer: "No data found for your query. The requested time range may not have data available.",
                        chartConfig: aiResponse.chartConfig,
                        data: []
                    });
                }

                return res.json({
                    answer: aiResponse.answer || "Here is the data found:",
                    chartConfig: aiResponse.chartConfig,
                    data: data,
                    module: detectedModule
                });
            } catch (sqlError) {
                console.error('SQL Execution Error:', sqlError.message);
                console.error('SQL Error stack:', sqlError.stack);
                return res.status(500).json({
                    error: 'Failed to retrieve data from database.',
                    details: sqlError.message
                });
            }
        }

        return res.status(500).json({ error: "AI did not generate a valid SQL query" });

    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;