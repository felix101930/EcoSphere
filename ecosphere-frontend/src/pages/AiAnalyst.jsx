// File: ecosphere-frontend/src/pages/AiAnalyst.jsx
import { useState } from 'react';
import {
  Container, TextField, Button, Box, Typography,
  CircularProgress, Chip, Stack, Alert, Paper
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import AIChartWrapper from '../components/AiAnalyst/AIChartWrapper';

const AiAnalyst = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Pre-canned questions for the Demo
  const quickPrompts = [
    "Show me the indoor temperature for the last 24 hours",
    "Show me the total solar generation for the last week",
    "What is the current CO2 level?",
    "Show me the lighting usage for the last 3 days",
    "Display total site consumption for the last 48 hours"
  ];

  const handleAsk = async (textOverride = null) => {
    const query = textOverride || question;
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    // Update input box if clicking a chip
    if (textOverride) setQuestion(textOverride);

    try {
      // Get user token from sessionStorage
      const userToken = sessionStorage.getItem('ecosphere_user');

      if (!userToken) {
        setError("You must be logged in to use AI Analyst.");
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ question: query }),
      });

      const data = await response.json();

      if (response.status === 403) {
        // Permission denied
        setError(data.error || "You don't have permission to access this data.");
      } else if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Failed to connect to the AI Service.");
      console.error(err);
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
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
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
            <Alert severity="success" sx={{ mb: 2 }}>
              {result.answer}
            </Alert>
          )}

          <AIChartWrapper
            data={result.data}
            config={result.chartConfig}
          />
        </Box>
      )}
    </Container>
  );
};

export default AiAnalyst;