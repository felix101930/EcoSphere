// UserManagementPage - Admin page for managing users
// This page is a CONTAINER component that orchestrates child components
import { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Snackbar, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import userService from '../services/UserService';
import UserTable from '../components/UserManagement/UserTable';
import UserDialog from '../components/UserManagement/UserDialog';

const UserManagementPage = () => {
  const { currentUser } = useAuth();
  
  // State management
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'TeamMember'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Data operations
  const loadUsers = async () => {
    const allUsers = await userService.getAllUsers();
    setUsers(allUsers);
  };

  // Load users on mount
  useEffect(() => {
    let mounted = true;
    
    const fetchUsers = async () => {
      const allUsers = await userService.getAllUsers();
      if (mounted) {
        setUsers(allUsers);
      }
    };
    
    fetchUsers();
    
    return () => {
      mounted = false;
    };
  }, []);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Check if current user can edit a specific user
  const canEditUser = (user) => {
    // Super Admin (ID=1) can edit everyone except themselves (role change)
    // Regular Admin can edit TeamMembers and themselves (except role change)
    // Cannot edit Super Admin if you're not Super Admin
    if (user.id === 1 && currentUser.id !== 1) {
      return false; // Cannot edit Super Admin
    }
    return true;
  };

  // Check if current user can delete a specific user
  const canDeleteUser = (user) => {
    // Cannot delete yourself
    if (user.id === currentUser.id) {
      return false;
    }
    // Only Super Admin can delete other Admins
    if (user.role === 'Admin' && currentUser.id !== 1) {
      return false;
    }
    // Cannot delete Super Admin
    if (user.id === 1) {
      return false;
    }
    return true;
  };

  // Dialog operations
  const handleOpenDialog = (user = null) => {
    if (user) {
      // Check if user can be edited
      if (!canEditUser(user)) {
        showSnackbar('You do not have permission to edit this user', 'error');
        return;
      }
      
      setEditingUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role,
        permissions: user.permissions || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: '',
        permissions: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleFormChange = (newFormData) => {
    setFormData(newFormData);
  };

  // CRUD operations
  const handleSubmit = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    if (!formData.role) {
      showSnackbar('Please select a role', 'error');
      return;
    }

    if (!editingUser && !formData.password) {
      showSnackbar('Password is required for new users', 'error');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email
        };
        
        // Only allow role change if NOT editing yourself
        if (editingUser.id !== currentUser.id) {
          updateData.role = formData.role;
        }
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        // Include permissions for TeamMember role
        if (formData.role === 'TeamMember') {
          updateData.permissions = formData.permissions || [];
        }
        
        await userService.updateUser(editingUser.id, updateData);
        showSnackbar('User updated successfully', 'success');
      } else {
        // Add new user - include permissions for TeamMember
        const newUserData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };
        
        // Include permissions for TeamMember role
        if (formData.role === 'TeamMember') {
          newUserData.permissions = formData.permissions || [];
        }
        
        await userService.addUser(newUserData);
        showSnackbar('User added successfully', 'success');
      }
      
      await loadUsers();
      handleCloseDialog();
    } catch (error) {
      showSnackbar(error.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    
    if (!userToDelete) {
      showSnackbar('User not found', 'error');
      return;
    }

    if (!canDeleteUser(userToDelete)) {
      if (userId === currentUser.id) {
        showSnackbar('Cannot delete your own account', 'error');
      } else if (userId === 1) {
        showSnackbar('Cannot delete Super Admin', 'error');
      } else {
        showSnackbar('You do not have permission to delete this user', 'error');
      }
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        showSnackbar('User deleted successfully', 'success');
        await loadUsers();
      } catch (error) {
        showSnackbar(error.message || 'Delete failed', 'error');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#DA291C', '&:hover': { bgcolor: '#A6192E' } }}
        >
          Add User
        </Button>
      </Box>

      {/* User Table */}
      <UserTable
        users={users}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
        currentUserId={currentUser.id}
        canEditUser={canEditUser}
        canDeleteUser={canDeleteUser}
      />

      {/* User Dialog */}
      <UserDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        isEditMode={!!editingUser}
        isEditingSelf={editingUser && editingUser.id === currentUser.id}
      />

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserManagementPage;
