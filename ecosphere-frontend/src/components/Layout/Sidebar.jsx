// Sidebar - Navigation component
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/sait-logo_vert.svg';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['Admin', 'TeamMember']
    },
    {
      text: 'User Management',
      icon: <PeopleIcon />,
      path: '/users',
      roles: ['Admin']
    },
    {
      text: 'Reports',
      icon: <AssessmentIcon />,
      path: '/reports',
      roles: ['Admin', 'TeamMember']
    }
  ];

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => 
    item.roles.includes(currentUser?.role)
  );

  return (
    <Box
      sx={{
        width: 250,
        height: '100vh',
        bgcolor: '#324053',
        color: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <img src={logo} alt="SAIT Logo" style={{ width: '80%', maxWidth: 150 }} />
        <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold' }}>
          EcoSphere
        </Typography>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      {/* User Info */}
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Logged in as:
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {currentUser?.firstName} {currentUser?.lastName}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {currentUser?.role}
        </Typography>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {visibleMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  bgcolor: '#DA291C',
                  '&:hover': {
                    bgcolor: '#A6192E'
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      {/* Logout */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ color: 'white' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar;
