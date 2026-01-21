// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginLogService from '../services/LoginLogService';

const AuthContext = createContext(null);

// Helper to load user from session
const loadUserFromSession = () => {
  const storedUser = sessionStorage.getItem('ecosphere_user');
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => loadUserFromSession());
  const [isLoading, setIsLoading] = useState(false);

  // Check session on mount
  useEffect(() => {
    const user = loadUserFromSession();
    if (user) {
      setCurrentUser(user);
    }
    setIsLoading(false);
  }, []);

  // Simple Login (no Firebase)
  const login = async (email, password) => {
    try {
      setIsLoading(true);

      // Get IP address for logging
      let ipAddress = '127.0.0.1';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip || '127.0.0.1';
      } catch {
        console.log('Could not fetch IP address, using default');
      }

      // Call backend login API
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          ipAddress
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      setCurrentUser(data.user);
      sessionStorage.setItem('ecosphere_user', JSON.stringify(data.user));

      // Redirect based on role after successful login
      if (data.user.role === 'Admin' || data.user.role === 'SuperAdmin') {
        navigate('/users');
      } else {
        navigate('/overview');
      }

      return { success: true, user: data.user };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Invalid email or password' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = useCallback(async () => {
    try {
      // Update logout in login log
      if (currentUser && currentUser.lastLoginId) {
        try {
          await LoginLogService.updateLogout(currentUser.lastLoginId);
        } catch (logError) {
          console.error('Error updating logout:', logError);
        }
      }

      // Clear local state
      setCurrentUser(null);
      sessionStorage.removeItem('ecosphere_user');

      // Redirect to login
      navigate('/login');

    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [currentUser, navigate]);

  // Session timeout (30 minutes)
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId;
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Reset timeout on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout();

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [currentUser, logout]);

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    isAuthenticated: () => currentUser !== null,
    isAdmin: () => currentUser && (currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin'),
    isSuperAdmin: () => currentUser && currentUser.role === 'SuperAdmin',
    isTeamMember: () => currentUser && currentUser.role === 'TeamMember',
    hasPermission: (permission) => {
      if (!currentUser) return false;
      if (currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin') return true;
      return currentUser.permissions?.includes(permission) || false;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;