import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import ComingSoonPage from './pages/ComingSoonPage';
import Sidebar from './components/Layout/Sidebar';

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

// Layout with Sidebar
function MainLayout({ children }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, bgcolor: 'white', minHeight: '100vh' }}>
        {children}
      </Box>
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

          {/* Protected Routes - Dashboards */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/electricity"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ComingSoonPage featureName="Electricity Dashboard" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/water"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ComingSoonPage featureName="Water Dashboard" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/thermal"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ComingSoonPage featureName="Thermal Dashboard" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Advanced */}
          <Route
            path="/3d-model"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ComingSoonPage featureName="3D Model" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Calculator */}
          <Route
            path="/carbon-footprint"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ComingSoonPage featureName="Carbon Footprint Calculator" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Management (Admin Only) */}
          <Route
            path="/users"
            element={
              <ProtectedRoute adminOnly={true}>
                <MainLayout>
                  <UserManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard-management"
            element={
              <ProtectedRoute adminOnly={true}>
                <MainLayout>
                  <ComingSoonPage featureName="Dashboard Management" />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz-management"
            element={
              <ProtectedRoute adminOnly={true}>
                <MainLayout>
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
