// UserForm - Form for adding/editing users
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth'; // Add this import
import { Box, TextField, Select, MenuItem, FormControl, InputLabel, Typography, FormGroup, FormControlLabel, Checkbox, Paper } from '@mui/material';

const AVAILABLE_PERMISSIONS = [
  { id: 'electricity', label: 'Electricity Dashboard' },
  { id: 'water', label: 'Water Dashboard' },
  { id: 'thermal', label: 'Thermal Dashboard' },
  { id: '3d-model', label: '3D Model' },
  { id: 'carbon-footprint', label: 'Carbon Footprint Calculator' }
];

const UserForm = ({ formData, onChange, isEditMode, isEditingSelf }) => {
  const { currentUser } = useAuth(); // Get current user from auth context
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handlePermissionChange = (permissionId) => {
    const currentPermissions = formData.permissions || [];
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter(p => p !== permissionId)
      : [...currentPermissions, permissionId];
    
    onChange({ ...formData, permissions: newPermissions });
  };

  const isTeamMember = formData.role === 'TeamMember';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      <TextField
        label="First Name"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        placeholder="Enter first name"
        required
        fullWidth
      />
      <TextField
        label="Last Name"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        placeholder="Enter last name"
        required
        fullWidth
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="user@edu.sait.ca"
        required
        fullWidth
      />
      <TextField
        label={isEditMode ? 'New Password (leave blank to keep current)' : 'Password *'}
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder={isEditMode ? 'Enter new password or leave blank' : 'Enter password'}
        required={!isEditMode}
        fullWidth
      />
      
      {/* Role Select - Fixed */}
      <FormControl fullWidth required>
  <InputLabel>Role *</InputLabel>
  <Select
    name="role"
    value={formData.role}
    onChange={handleChange}
    label="Role *"
    disabled={isEditingSelf}
  >
    {currentUser?.role === 'SuperAdmin' && (
      <MenuItem value="SuperAdmin">Super Admin</MenuItem>
    )}
    <MenuItem value="Admin">Admin</MenuItem>
    <MenuItem value="TeamMember">Team Member</MenuItem>
  </Select>
  {isEditingSelf && (
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
      You cannot change your own role
    </Typography>
  )}
</FormControl>

      {/* Permissions Section - Only show for Team Members */}
      {isTeamMember && (
        <Paper elevation={0} sx={{ p: 2, bgcolor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Permissions
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Select which features this Team Member can access
          </Typography>
          <FormGroup>
            {AVAILABLE_PERMISSIONS.map((permission) => (
              <FormControlLabel
                key={permission.id}
                control={
                  <Checkbox
                    checked={(formData.permissions || []).includes(permission.id)}
                    onChange={() => handlePermissionChange(permission.id)}
                    size="small"
                  />
                }
                label={permission.label}
              />
            ))}
          </FormGroup>
        </Paper>
      )}
    </Box>
  );
};

UserForm.propTypes = {
  formData: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    password: PropTypes.string,
    role: PropTypes.string,
    permissions: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  isEditingSelf: PropTypes.bool.isRequired
};

export default UserForm;