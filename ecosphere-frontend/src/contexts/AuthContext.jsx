// AuthContext - Manages authentication state and user session
// Implements UI class pattern using React Context API
import { createContext, useState, useEffect, useCallback } from 'react';
import userService from '../services/UserService';
import LoginLogService from '../services/LoginLogService';

const AuthContext = createContext(null);

// Helper function to load user from session storage
const loadUserFromSession = () => {
  const storedUser = sessionStorage.getItem('ecosphere_current_user');
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
  // Initialize state from session storage using lazy initialization
  const [currentUser, setCurrentUser] = useState(() => loadUserFromSession());
  const [isLoading] = useState(false);

  // Login function
  const login = async (email, password) => {
    try {
      const user = await userService.authenticate(email, password);
      
      if (user) {
        setCurrentUser(user);
        
        // Save to session storage
        sessionStorage.setItem('ecosphere_current_user', JSON.stringify(user));
        
        return { success: true, user };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  // Logout function - Defined early to avoid hoisting issues
  const logout = useCallback(async () => {
    // Update logout in login log
    if (currentUser && currentUser.lastLoginId) {
      try {
        await LoginLogService.updateLogout(currentUser.lastLoginId);
      } catch (error) {
        console.error('Error updating logout:', error);
      }
    }
    
    setCurrentUser(null);
    sessionStorage.removeItem('ecosphere_current_user');
  }, [currentUser]);

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

  // Handle browser close/refresh
  useEffect(() => {
    if (!currentUser || !currentUser.lastLoginId) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable logout on page unload
      const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/login-logs/${currentUser.lastLoginId}/logout`;
      
      // Send empty request body
      navigator.sendBeacon(url, new Blob([JSON.stringify({})], { type: 'application/json' }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  // Check if user is authenticated
  const isAuthenticated = () => {
    return currentUser !== null;
  };

  // Check if user is admin
  const isAdmin = () => {
    return currentUser && currentUser.role === 'Admin';
  };

  // Check if user is team member
  const isTeamMember = () => {
    return currentUser && currentUser.role === 'TeamMember';
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isTeamMember
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
