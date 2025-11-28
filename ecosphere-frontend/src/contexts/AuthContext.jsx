// AuthContext - Manages authentication state and user session
// Implements UI class pattern using React Context API
import { createContext, useState } from 'react';
import userService from '../services/UserService';
import Admin from '../models/Admin';
import TeamMember from '../models/TeamMember';

const AuthContext = createContext(null);

// Helper function to create user instance based on role
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
  const [userInstance, setUserInstance] = useState(() => {
    const user = loadUserFromSession();
    return user ? createUserInstance(user) : null;
  });
  const [isLoading] = useState(false);

  // Login function
  const login = async (email, password) => {
    try {
      const user = await userService.authenticate(email, password);
      
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
    } catch {
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

export default AuthContext;
