import { useState } from 'react';
import { Box, TextField, Button, Checkbox, FormControlLabel, Typography, Paper } from '@mui/material';
import loginBackground from '../assets/loginbackground.jpg';
import saitLogo from '../assets/sait-logo_horz.svg';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password, rememberMe });
    // TODO: Implement login logic
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${loginBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: 4,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(156, 102, 192, 0.3) 100%)',
          zIndex: 1,
        },
      }}
    >
      {/* Login Form Card */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          marginRight: 8,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            padding: 4,
            width: '100%',
            maxWidth: 400,
            backgroundColor: 'white',
            borderRadius: 2,
          }}
        >
          {/* SAIT Logo */}
          <Box sx={{ mb: 3, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
            <img 
              src={saitLogo} 
              alt="SAIT Logo" 
              style={{ 
                maxWidth: '280px',
                width: '100%',
                height: 'auto',
                marginBottom: '8px'
              }}
            />
          </Box>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="body2" 
                sx={{ mb: 0.5, color: '#666', fontWeight: 500 }}
              >
                Email address
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="michael.jones@edu.sait.ca"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                  },
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="body2" 
                sx={{ mb: 0.5, color: '#666', fontWeight: 500 }}
              >
                Password
              </Typography>
              <TextField
                fullWidth
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                  },
                }}
              />
            </Box>

            {/* Remember Me Checkbox */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Remember for 30 days
                  </Typography>
                }
              />
            </Box>

            {/* Sign In Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: '#E31837',
                color: 'white',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#C01530',
                },
              }}
            >
              Sign In
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}

export default LoginPage;
