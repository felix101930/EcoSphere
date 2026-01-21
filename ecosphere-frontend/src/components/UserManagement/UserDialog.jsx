// UserDialog - Dialog for adding/editing users
import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import UserForm from './UserForm';

const UserDialog = ({ open, onClose, onSubmit, formData, onChange, isEditMode, isEditingSelf }) => {
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
          isEditingSelf={isEditingSelf}
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

UserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
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

export default UserDialog;
