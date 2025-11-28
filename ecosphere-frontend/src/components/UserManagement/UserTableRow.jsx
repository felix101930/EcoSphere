// UserTableRow - Single row in user table
import { TableCell, TableRow, Box, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const UserTableRow = ({ user, onEdit, onDelete, isCurrentUser, canEdit, canDelete }) => {
  const getDeleteTooltip = () => {
    if (isCurrentUser) return 'Cannot delete your own account';
    if (user.id === 1) return 'Cannot delete Super Admin';
    if (!canDelete) return 'No permission to delete this user';
    return 'Delete user';
  };

  const getEditTooltip = () => {
    if (!canEdit) return 'No permission to edit this user';
    return 'Edit user';
  };

  return (
    <TableRow hover>
      <TableCell>{user.id}</TableCell>
      <TableCell>{user.firstName}</TableCell>
      <TableCell>{user.lastName}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Box
          sx={{
            display: 'inline-block',
            px: 2,
            py: 0.5,
            borderRadius: 1,
            bgcolor: user.role === 'Admin' ? '#6D2077' : '#00A3E0',
            color: 'white',
            fontSize: '0.875rem'
          }}
        >
          {user.role}
          {user.id === 1 && ' (Super)'}
        </Box>
      </TableCell>
      <TableCell align="center">
        <Tooltip title={getEditTooltip()}>
          <span>
            <IconButton
              color="primary"
              onClick={() => onEdit(user)}
              size="small"
              disabled={!canEdit}
            >
              <EditIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={getDeleteTooltip()}>
          <span>
            <IconButton
              color="error"
              onClick={() => onDelete(user.id)}
              size="small"
              disabled={!canDelete}
            >
              <DeleteIcon />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
