// UserDialog - Dialog for adding/editing users
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import UserForm from './UserForm';

const UserDialog = ({ open, onClose, onSubmit, formData, onChange, isEditMode }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Edit User' : 'Add New User'}
      </DialogTitle>
      <DialogContent>
        <UserForm
          formData={formData}
          onChange={onChange}
          isEditMode={isEditMode}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          sx={{ bgcolor: '#DA291C', '&:hover': { bgcolor: '#A6192E' } }}
        >
          {isEditMode ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDialog;
