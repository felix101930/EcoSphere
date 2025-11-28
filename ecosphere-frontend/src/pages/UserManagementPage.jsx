// UserManagementPage - Admin page for managing users
// This page is a CONTAINER component that orchestrates child components
import { useState } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/UserService';
import AlertMessage from '../components/Common/AlertMessage';
import UserTable from '../components/UserManagement/UserTable';
import UserDialog from '../components/UserManagement/UserDialog';

const UserManagementPage = () => {
  const { currentUser } = useAuth();
  
  // State management - Initialize users from service
  const [users, setUsers] = useState(() => userService.getAllUsers());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'TeamMember'
  });
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  // Data operations
  const loadUsers = () => {
    const allUsers = userService.getAllUsers();
    setUsers(allUsers);
  };

  const showAlert = (message, severity) => {
    setAlert({ show: true, message, severity });
    setTimeout(() => {
      setAlert({ show: false, message: '', severity: 'success' });
    }, 3000);
  };

  // Dialog operations
  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'TeamMember'
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
  const handleSubmit = () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      showAlert('Please fill in all required fields', 'error');
      return;
    }

    if (!editingUser && !formData.password) {
      showAlert('Password is required for new users', 'error');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        userService.updateUser(editingUser.id, updateData);
        showAlert('User updated successfully', 'success');
      } else {
        // Add new user
        userService.addUser(formData);
        showAlert('User added successfully', 'success');
      }
      
      loadUsers();
      handleCloseDialog();
    } catch {
      showAlert('Operation failed', 'error');
    }
  };

  const handleDelete = (userId) => {
    if (userId === currentUser.id) {
      showAlert('Cannot delete your own account', 'error');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        userService.deleteUser(userId);
        showAlert('User deleted successfully', 'success');
        loadUsers();
      } catch {
        showAlert('Delete failed', 'error');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Alert Message */}
      <AlertMessage
        show={alert.show}
        message={alert.message}
        severity={alert.severity}
      />

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
      />

      {/* User Dialog */}
      <UserDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        isEditMode={!!editingUser}
      />
    </Container>
  );
};

export default UserManagementPage;
