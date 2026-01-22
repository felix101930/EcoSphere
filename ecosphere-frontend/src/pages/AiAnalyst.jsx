// File: ecosphere-frontend/src/pages/AiAnalyst.jsx
import React, { useState } from 'react';
import {
  Container, TextField, Button, Box, Typography,
  CircularProgress, Chip, Stack, Alert, Paper, LinearProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import DynamicChart from '../components/DynamicChart';

const AiAnalyst = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [progressMessage, setProgressMessage] = useState('');

  // Pre-canned questions for the Demo
  const quickPrompts = [
    "Show me the indoor temperature for the last 24 hours",
    "Show me the total solar generation history",
    "What is the CO2 level right now?",
    "Show me the lighting usage for the last week"
  ];

  const handleAsk = async (textOverride = null) => {
    const query = textOverride || question;
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setProgressMessage('');
    // Update input box if clicking a chip
    if (textOverride) setQuestion(textOverride);

    try {
      // Step 1: Analyzing question
      setProgressMessage('🤖 Analyzing your question with AI...');

      const response = await fetch('http://localhost:3001/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      // Step 2: Processing response
      setProgressMessage('📊 Querying database for relevant data...');

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setProgressMessage('');
      } else {
        // Step 3: Generating chart
        setProgressMessage('📈 Generating visualization...');

        // Small delay to show the message
        await new Promise(resolve => setTimeout(resolve, 300));

        setResult(data);
        setProgressMessage('✅ Chart generated successfully!');

        // Clear success message after 2 seconds
        setTimeout(() => setProgressMessage(''), 2000);
      }
    } catch (err) {
      setError("Failed to connect to the AI Service. Please ensure the backend is running.");
      setProgressMessage('');
      console.error('AI Analyst Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <AutoGraphIcon fontSize="large" color="primary" />
          EcoSphere AI Analyst
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Ask questions about your building data in plain English.
        </Typography>
      </Box>

      {/* Input Area */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            label="Ask a question..."
            variant="outlined"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
            disabled={loading}
          />
          <Button
            variant="contained"
            endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={() => handleAsk()}
            disabled={loading}
            size="large"
          >
            Ask
          </Button>
        </Stack>

        {/* Quick Prompts */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" display="block" sx={{ mb: 1 }}>
            Try these demo queries:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {quickPrompts.map((prompt, index) => (
              <Chip
                key={index}
                label={prompt}
                onClick={() => handleAsk(prompt)}
                clickable
                color="primary"
                variant="outlined"
                disabled={loading}
              />
            ))}
          </Stack>
        </Box>
      </Paper>

      {/* Progress Messages */}
      {loading && progressMessage && (
        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              {progressMessage}
            </Typography>
          </Box>
          <LinearProgress sx={{ mt: 1 }} />
        </Paper>
      )}

      {/* Success Message (non-loading) */}
      {!loading && progressMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {progressMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
          {result.answer && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {result.answer}
            </Alert>
          )}

          {result.data && result.data.length > 0 ? (
            <DynamicChart
              data={result.data}
              config={result.chartConfig}
            />
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No data found for your query. The database might not have data for the requested time period.
            </Alert>
          )}
        </Box>
      )}
    </Container>
  );
};

export default AiAnalyst;