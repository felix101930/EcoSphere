// UserForm - Form for adding/editing users
import { Box, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const UserForm = ({ formData, onChange, isEditMode }) => {
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
        required
        fullWidth
      />
      <TextField
        label="Last Name"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        required
        fullWidth
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
        fullWidth
      />
      <TextField
        label={isEditMode ? 'Password (leave blank to keep current)' : 'Password'}
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required={!isEditMode}
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel>Role</InputLabel>
        <Select
          name="role"
          value={formData.role}
          onChange={handleChange}
          label="Role"
        >
          <MenuItem value="Admin">Admin</MenuItem>
          <MenuItem value="TeamMember">Team Member</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default UserForm;
