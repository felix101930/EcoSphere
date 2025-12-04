// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase/config';
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
  const navigate = useNavigate(); // Add this hook
  const [currentUser, setCurrentUser] = useState(() => loadUserFromSession());
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firebase Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          // Get Firebase ID token
          const token = await user.getIdToken();
          
          // Call backend to sync/get user data with roles
          const response = await fetch('http://localhost:3001/api/auth/firebase-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              email: user.email,
              uid: user.uid,
              token: token
            })
          });

          if (response.ok) {
            const data = await response.json();
            const backendUser = data.user;
            
            setCurrentUser(backendUser);
            sessionStorage.setItem('ecosphere_user', JSON.stringify(backendUser));
            sessionStorage.setItem('ecosphere_token', token);
            
            // Redirect based on role
            const pathname = window.location.pathname;
            
            // If on login page, redirect to appropriate dashboard
            if (pathname === '/login') {
              if (backendUser.role === 'Admin' || backendUser.role === 'SuperAdmin') {
                navigate('/users'); // Admins go to user management
              } else {
                navigate('/dashboard'); // Team members go to dashboard
              }
            }
            
          } else {
            console.error('Backend sync failed');
            // Sign out if backend sync fails
            await signOut(auth);
          }
        } catch (error) {
          console.error('Auth sync error:', error);
          await signOut(auth);
        }
      } else {
        // No user logged in
        setCurrentUser(null);
        sessionStorage.removeItem('ecosphere_user');
        sessionStorage.removeItem('ecosphere_token');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Firebase Sign Up
  const signup = async (email, password, userData) => {
    try {
      setIsLoading(true);
      
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Send email verification (optional)
      await sendEmailVerification(user);
      
      // 3. Get Firebase token
      const token = await user.getIdToken();
      
      // 4. Register user in your backend with role
      const response = await fetch('http://localhost:3001/api/auth/firebase-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          email: user.email,
          uid: user.uid,
          token: token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register user in backend');
      }

      const result = await response.json();
      
      return { 
        success: true, 
        user: result.user,
        message: 'Account created! Please verify your email.' 
      };
      
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Signup failed';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Login
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      // Get IP address for logging
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip || '127.0.0.1';
      
      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified (optional requirement)
      if (!user.emailVerified) {
        console.log('Email not verified');
        // You can choose to allow login anyway or require verification
      }
      
      // Get Firebase token
      const token = await user.getIdToken();
      
      // Call backend to log login and get user data
      // Send token in BODY, not Authorization header
      const response = await fetch('http://localhost:3001/api/auth/firebase-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: user.email,
          uid: user.uid,
          token: token,  // Add token to body
          ipAddress 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Backend login failed');
      }

      const data = await response.json();
      
      setCurrentUser(data.user);
      sessionStorage.setItem('ecosphere_user', JSON.stringify(data.user));
      sessionStorage.setItem('ecosphere_token', token);
      
      // Redirect based on role after successful login
      if (data.user.role === 'Admin' || data.user.role === 'SuperAdmin') {
        navigate('/users');
      } else {
        navigate('/dashboard');
      }
      
      return { success: true, user: data.user };
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Try again later.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Account disabled';
          break;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Logout
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
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear local state
      setCurrentUser(null);
      sessionStorage.removeItem('ecosphere_user');
      sessionStorage.removeItem('ecosphere_token');
      
      // Redirect to login
      navigate('/login');
      
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [currentUser, navigate]);

  // Password Reset
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Failed to send reset email' };
    }
  };

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
    firebaseUser,
    isLoading,
    signup,
    login,
    logout,
    resetPassword,
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