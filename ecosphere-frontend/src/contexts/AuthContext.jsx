// AuthContext - Manages authentication state and user session
// Implements UI class pattern using React Context API
import { createContext, useContext, useState, useEffect } from 'react';
import userService from '../services/UserService';
import Admin from '../models/Admin';
import TeamMember from '../models/TeamMember';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userInstance, setUserInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from session storage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('ecosphere_current_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setCurrentUser(userData);
      
      // Create appropriate user instance
      const instance = createUserInstance(userData);
      setUserInstance(instance);
    }
    setIsLoading(false);
  }, []);

  // Create user instance based on role
  const createUserInstance = (userData) => {
    let instance;
    
    if (userData.role === 'Admin') {
      instance = new Admin();
    } else {
      instance = new TeamMember();
    }
    
    // Populate instance with user data
    instance.createUser(
      userData.id,
      userData.firstName,
      userData.lastName,
      userData.email,
      '', // Don't store password in memory
      userData.role
    );
    
    if (userData.permissions) {
      instance.permissions = userData.permissions;
    }
    
    return instance;
  };

  // Login function
  const login = async (email, password) => {
    try {
      const user = userService.authenticate(email, password);
      
      if (user) {
        setCurrentUser(user);
        
        // Create user instance
        const instance = createUserInstance(user);
        setUserInstance(instance);
        
        // Save to session storage
        sessionStorage.setItem('ecosphere_current_user', JSON.stringify(user));
        
        return { success: true, user };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  // Logout function
  const logout = () => {
    if (userInstance) {
      userInstance.logout();
    }
    
    setCurrentUser(null);
    setUserInstance(null);
    sessionStorage.removeItem('ecosphere_current_user');
  };

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
    userInstance,
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

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
