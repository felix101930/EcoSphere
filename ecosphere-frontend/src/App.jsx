import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import ComingSoonPage from './pages/ComingSoonPage';
import Sidebar from './components/Layout/Sidebar';
import AIChatbot from './components/Layout/AIChatbot';

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
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
    <Box sx={{ display: 'flex' }}>
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          bgcolor: 'white', 
          minHeight: '100vh'
        }}
      >
        {children}
      </Box>

      {/* Right AI Chatbot Panel - Only show for non-Management pages */}
      {showAIChatbot && <AIChatbot />}
    </Box>
  );
}

function App() {
  return (
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
                  <ComingSoonPage featureName="Thermal Dashboard" />
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
                  <ComingSoonPage featureName="Carbon Footprint Calculator" />
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
  );
}

export default App;
