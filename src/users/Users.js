import React, {useState} from 'react';
import {Alert, Container, IconButton, Paper, Snackbar, Table, TableBody, TableCell, TableHead, TableRow, Typography} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {api} from './api';
import {Layout} from '../layout';

export const Users = () => {
  const {data: allUsers} = api.endpoints.getUsers.useQuery(undefined, {pollingInterval: 10000});
  const {data: self} = api.endpoints.getSelf.useQuery();
  const [deleteUser] = api.endpoints.deleteUser.useMutation();
  const [error, setError] = useState(null);

  const handleDelete = (user) => {
    deleteUser(user).unwrap()
      .catch(err => {
        const msg = err?.data || err?.error || 'Löschen fehlgeschlagen';
        setError(typeof msg === 'string' ? msg : 'User hat noch Inhalte — bitte zuerst deaktivieren.');
      });
  };

  return <Layout>
    <Container sx={{mt: theme => theme.spacing(2)}}>
      <Paper sx={{p: 2}}>
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          Users
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>E-Mail</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell/>
            </TableRow>
          </TableHead>
          <TableBody>
            {allUsers && allUsers.map(user =>
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{new Date(user.created).toLocaleDateString()}</TableCell>
                <TableCell>{user.roles.join(', ')}</TableCell>
                <TableCell align='right'>
                  <IconButton
                    disabled={user.id === self?.id} onClick={() => handleDelete(user)}
                  >
                    <DeleteIcon/>
                  </IconButton>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
    <Snackbar open={Boolean(error)} autoHideDuration={8000} onClose={() => setError(null)}>
      <Alert severity="warning" onClose={() => setError(null)}>{error}</Alert>
    </Snackbar>
  </Layout>;
};
