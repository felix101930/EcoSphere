// UserForm - Form for adding/editing users
import { Box, TextField, Select, MenuItem, FormControl, InputLabel, Typography } from '@mui/material';

const UserForm = ({ formData, onChange, isEditMode, isEditingSelf }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

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
        label={isEditMode ? 'Password (leave blank to keep current)' : 'Password'}
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder={isEditMode ? 'Leave blank to keep current' : 'Enter password'}
        required={!isEditMode}
        fullWidth
      />
      <FormControl fullWidth required>
        <InputLabel>Role</InputLabel>
        <Select
          name="role"
          value={formData.role}
          onChange={handleChange}
          label="Role"
          disabled={isEditingSelf}
        >
          <MenuItem value="Admin">Admin</MenuItem>
          <MenuItem value="TeamMember">Team Member</MenuItem>
        </Select>
        {isEditingSelf && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            You cannot change your own role
          </Typography>
        )}
      </FormControl>
    </Box>
  );
};

export default UserForm;
