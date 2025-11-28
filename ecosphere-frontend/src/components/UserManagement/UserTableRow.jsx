// UserTableRow - Single row in user table
import { TableCell, TableRow, Box, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const UserTableRow = ({ user, onEdit, onDelete, isCurrentUser }) => {
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
        </Box>
      </TableCell>
      <TableCell align="center">
        <IconButton
          color="primary"
          onClick={() => onEdit(user)}
          size="small"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          color="error"
          onClick={() => onDelete(user.id)}
          size="small"
          disabled={isCurrentUser}
        >
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
