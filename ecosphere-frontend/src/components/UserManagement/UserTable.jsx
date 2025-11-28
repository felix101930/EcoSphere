// UserTable - Displays list of users in a table
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import UserTableRow from './UserTableRow';

const UserTable = ({ users, onEdit, onDelete, currentUserId }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#F5F5F5' }}>
            <TableCell><strong>ID</strong></TableCell>
            <TableCell><strong>First Name</strong></TableCell>
            <TableCell><strong>Last Name</strong></TableCell>
            <TableCell><strong>Email</strong></TableCell>
            <TableCell><strong>Role</strong></TableCell>
            <TableCell align="center"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <UserTableRow
              key={user.id}
              user={user}
              onEdit={onEdit}
              onDelete={onDelete}
              isCurrentUser={user.id === currentUserId}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserTable;
