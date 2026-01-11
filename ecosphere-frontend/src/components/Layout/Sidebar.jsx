// Sidebar - Navigation component
import { Box, List, ListItem, ListItemButton, ListItemText, Typography, Avatar } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/sait-logo_vert.svg';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, isAdmin, isSuperAdmin, hasPermission } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu structure matching Figma design
  const menuStructure = [
    {
      category: 'DASHBOARDS',
      items: [
        {
          text: 'Overview',
          path: '/overview',
          roles: ['SuperAdmin', 'Admin', 'TeamMember'],
          permission: null
        },
        {
          text: 'Electricity',
          path: '/electricity',
          roles: ['SuperAdmin', 'Admin', 'TeamMember'],
          permission: 'electricity',
          comingSoon: true
        },
        {
          text: 'Water',
          path: '/water',
          roles: ['SuperAdmin', 'Admin', 'TeamMember'],
          permission: 'water',
          comingSoon: true
        },
        {
          text: 'Thermal',
          path: '/thermal',
          roles: ['SuperAdmin', 'Admin', 'TeamMember'],
          permission: 'thermal',
          comingSoon: true
        }
      ]
    },
    {
      category: 'ADVANCED',
      items: [
        {
          text: '3D Model',
          path: '/3d-model',
          roles: ['SuperAdmin', 'Admin', 'TeamMember'],
          permission: '3d-model',
          comingSoon: true
        }
      ]
    },
    {
      category: 'CALCULATOR',
      items: [
        {
          text: 'Carbon Footprint',
          path: '/carbon-footprint',
          roles: ['SuperAdmin', 'Admin', 'TeamMember'],
          permission: 'carbon-footprint'
        }
      ]
    },
    {
      category: 'MANAGEMENT',
      items: [
        {
          text: 'User Management',
          path: '/users',
          roles: ['SuperAdmin', 'Admin'],
          permission: null
        },
        {
          text: 'Dashboard Management',
          path: '/dashboard-management',
          roles: ['SuperAdmin', 'Admin'],
          permission: null,
          comingSoon: true
        },
        {
          text: 'Quiz Management',
          path: '/quiz-management',
          roles: ['SuperAdmin', 'Admin'],
          permission: null,
          comingSoon: true
        }
      ]
    }
  ];

  // Check if user can see a menu item
  const canSeeMenuItem = (item) => {
    if (!currentUser) return false;

    // Check if user has the required role
    const hasRole = item.roles.includes(currentUser.role);
    if (!hasRole) return false;

    // If no specific permission required, allow access
    if (!item.permission) {
      return true;
    }

    // SuperAdmin and Admin have all permissions
    if (isSuperAdmin() || isAdmin()) {
      return true;
    }

    // TeamMember needs specific permission
    return hasPermission(item.permission);
  };

  // Filter menu items based on user role and permissions
  const visibleMenuStructure = menuStructure.map(section => ({
    ...section,
    items: section.items.filter(item => canSeeMenuItem(item))
  })).filter(section => section.items.length > 0);

  // Display role with SuperAdmin special case
  const getRoleDisplay = () => {
    if (!currentUser) return '';
    if (currentUser.role === 'SuperAdmin') return 'Super Admin';
    return currentUser.role;
  };

  return (
    <Box
      sx={{
        width: 180,
        height: '100vh',
        bgcolor: 'white',
        borderRight: '2px solid #DA291C',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Titillium Web, sans-serif',
        position: 'sticky',
        top: 0
      }}
    >
      {/* Logo and GBTAC */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <img src={logo} alt="SAIT Logo" style={{ width: 40, height: 'auto' }} />
        <Typography
          sx={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#324053',
            fontFamily: 'Titillium Web, sans-serif'
          }}
        >
          GBTAC
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1, pt: 1 }}>
        {visibleMenuStructure.map((section) => (
          <Box key={section.category} sx={{ mb: 2.5 }}>
            {/* Category Header */}
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#999',
                textTransform: 'uppercase',
                px: 2,
                py: 0.5,
                mb: 0.5,
                fontFamily: 'Titillium Web, sans-serif'
              }}
            >
              {section.category}
            </Typography>

            {/* Menu Items */}
            <List disablePadding sx={{ '& .MuiListItem-root': { mb: 0.25 } }}>
              {section.items.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={location.pathname === item.path}
                    sx={{
                      py: 0.5,
                      px: 2,
                      borderRadius: '4px',
                      mx: 0.5,
                      minHeight: '32px',
                      '&.Mui-selected': {
                        bgcolor: '#DA291C',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#A6192E'
                        }
                      },
                      '&:hover': {
                        bgcolor: '#F5F5F5'
                      }
                    }}
                  >
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '13px',
                        fontFamily: 'Titillium Web, sans-serif',
                        fontWeight: location.pathname === item.path ? 600 : 400
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* User Info at Bottom */}
      <Box sx={{ borderTop: '1px solid #E0E0E0', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: currentUser?.role === 'SuperAdmin' ? '#6D2077' :
                currentUser?.role === 'Admin' ? '#00A3E0' : '#666',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#324053',
                fontFamily: 'Titillium Web, sans-serif',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentUser?.firstName} {currentUser?.lastName}
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                color: '#999',
                fontFamily: 'DM Sans, sans-serif',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {getRoleDisplay()}
            </Typography>
          </Box>
        </Box>

        {/* Logout Button */}
        <ListItemButton
          onClick={handleLogout}
          sx={{
            py: 1,
            px: 1.5,
            borderRadius: '4px',
            bgcolor: '#6D2077',
            color: 'white',
            justifyContent: 'center',
            '&:hover': {
              bgcolor: '#5A1A63'
            }
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'Titillium Web, sans-serif'
            }}
          >
            Sign Out
          </Typography>
        </ListItemButton>
      </Box>
    </Box>
  );
};

export default Sidebar;