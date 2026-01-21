// AIChatbot - EVA Virtual Assistant Panel
import { Box, Typography, TextField, IconButton, Avatar } from '@mui/material';
import { Send as SendIcon, Mic as MicIcon } from '@mui/icons-material';
import { useState } from 'react';

const AIChatbot = () => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    // TODO: Implement chatbot functionality
    console.log('Message sent:', message);
    setMessage('');
  };

  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        bgcolor: 'white',
        borderLeft: '2px solid #DA291C',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #E0E0E0',
          bgcolor: '#F5F5F5'
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#999',
            textTransform: 'uppercase',
            fontFamily: 'Titillium Web, sans-serif',
            mb: 1
          }}
        >
          Non-Chatbot +
        </Typography>
      </Box>

      {/* EVA Introduction */}
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          borderBottom: '1px solid #E0E0E0'
        }}
      >
        <Typography
          sx={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#DA291C',
            fontFamily: 'Titillium Web, sans-serif',
            mb: 0.5
          }}
        >
          Hello, I'm EVA
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            color: '#DA291C',
            fontFamily: 'Titillium Web, sans-serif',
            mb: 0.5
          }}
        >
          (ecoSphere Virtual Assistant).
        </Typography>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#324053',
            fontFamily: 'Titillium Web, sans-serif'
          }}
        >
          How can I help??
        </Typography>
      </Box>

      {/* Capabilities */}
      <Box sx={{ p: 2, flexGrow: 1 }}>
        <Typography
          sx={{
            fontSize: '12px',
            color: '#666',
            fontFamily: 'DM Sans, sans-serif',
            mb: 1.5
          }}
        >
          I can:
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <Typography
            component="li"
            sx={{
              fontSize: '12px',
              color: '#666',
              fontFamily: 'DM Sans, sans-serif',
              mb: 0.5
            }}
          >
            Fetch data from database
          </Typography>
          <Typography
            component="li"
            sx={{
              fontSize: '12px',
              color: '#666',
              fontFamily: 'DM Sans, sans-serif',
              mb: 0.5
            }}
          >
            Visualize data into graphs
          </Typography>
          <Typography
            component="li"
            sx={{
              fontSize: '12px',
              color: '#666',
              fontFamily: 'DM Sans, sans-serif'
            }}
          >
            Explain reports
          </Typography>
        </Box>
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #E0E0E0'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: '#F5F5F5',
            borderRadius: '20px',
            px: 2,
            py: 0.5
          }}
        >
          <TextField
            fullWidth
            placeholder="Ask a question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '14px',
                fontFamily: 'DM Sans, sans-serif'
              }
            }}
          />
          <IconButton size="small" onClick={handleSend}>
            <SendIcon sx={{ fontSize: 18, color: '#666' }} />
          </IconButton>
          <IconButton size="small">
            <MicIcon sx={{ fontSize: 18, color: '#666' }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default AIChatbot;
