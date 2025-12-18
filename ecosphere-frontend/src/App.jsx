import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import CarbonFootprintPage from './pages/CarbonFootprintPage';
import ThermalPage from './pages/ThermalPage';
import ComingSoonPage from './pages/ComingSoonPage';
import Sidebar from './components/Layout/Sidebar';
import AIChatbot from './components/Layout/AIChatbot';
import ErrorBoundary from './components/Common/ErrorBoundary';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Layout with Sidebar and conditional AI Chatbot
function MainLayout({ children, showAIChatbot = true }) {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left Sidebar - Fixed */}
      <Sidebar />
      
      {/* Main Content Area - Scrollable */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          bgcolor: 'white', 
          overflowY: 'auto',
          height: '100vh'
        }}
      >
        {children}
      </Box>

      {/* Right AI Chatbot Panel - Fixed - Only show for non-Management pages */}
      {showAIChatbot && <AIChatbot />}
    </Box>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes - Dashboards (with AI Chatbot) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout showAIChatbot={true}>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/electricity"
            element={
              <ProtectedRoute>
                <MainLayout showAIChatbot={true}>
                  <ComingSoonPage featureName="Electricity Dashboard" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/water"
            element={
              <ProtectedRoute>
                <MainLayout showAIChatbot={true}>
                  <ComingSoonPage featureName="Water Dashboard" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/thermal"
            element={
              <ProtectedRoute>
                <MainLayout showAIChatbot={true}>
                  <ThermalPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Advanced (with AI Chatbot) */}
          <Route
            path="/3d-model"
            element={
              <ProtectedRoute>
                <MainLayout showAIChatbot={true}>
                  <ComingSoonPage featureName="3D Model" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Calculator (with AI Chatbot) */}
          <Route
            path="/carbon-footprint"
            element={
              <ProtectedRoute>
                <MainLayout showAIChatbot={true}>
                  <CarbonFootprintPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Management (Admin Only, NO AI Chatbot) */}
          <Route
  path="/users"
  element={
    <ProtectedRoute adminOnly={true}>
      <MainLayout showAIChatbot={false}>
        <UserManagementPage />
      </MainLayout>
    </ProtectedRoute>
  }
/>

          <Route
  path="/dashboard-management"
  element={
    <ProtectedRoute adminOnly={true}>
      <MainLayout showAIChatbot={false}>
        <ComingSoonPage featureName="Dashboard Management" />
      </MainLayout>
    </ProtectedRoute>
  }
/>

          <Route
  path="/quiz-management"
  element={
    <ProtectedRoute adminOnly={true}>
      <MainLayout showAIChatbot={false}>
        <ComingSoonPage featureName="Quiz Management" />
      </MainLayout>
    </ProtectedRoute>
  }
/>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
