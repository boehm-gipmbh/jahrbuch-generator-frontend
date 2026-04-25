import React, {useState} from 'react';
import {
  Box, Button, Container, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import {Navigate} from 'react-router-dom';
import {Layout} from '../layout';
import {api} from './api';
import {api as usersApi} from '../users';
import {FotoboxSetupDialog} from './FotoboxSetupDialog';
import {FotoboxTokenDialog} from './FotoboxTokenDialog';

export const Groups = () => {
  const {data: user} = usersApi.endpoints.getSelf.useQuery();
  const {data: groups} = api.endpoints.getGroups.useQuery();
  const [setupOpen, setSetupOpen] = useState(false);
  const [tokenDialogGruppe, setTokenDialogGruppe] = useState(null);

  if (user && !user.roles?.includes('admin')) {
    return <Navigate to='/bilder' replace />;
  }

  return (
    <Layout>
      <Container sx={{mt: 2}}>
        <Paper sx={{p: 2}}>
          <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
            <Typography component="h2" variant="h6" color="primary">
              Gruppen
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSetupOpen(true)}
            >
              Neue Fotobox-Veranstaltung
            </Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Erstellt</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups && groups.map(gruppe => (
                <TableRow key={gruppe.id}>
                  <TableCell>{gruppe.name}</TableCell>
                  <TableCell>
                    {gruppe.createdAt ? new Date(gruppe.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                      <Button
                        size="small"
                        startIcon={<CameraAltIcon />}
                        onClick={() => setTokenDialogGruppe(gruppe)}
                      >
                        Token neu generieren
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Container>

      {setupOpen && (
        <FotoboxSetupDialog onClose={() => setSetupOpen(false)} />
      )}

      {tokenDialogGruppe && (
        <FotoboxTokenDialog
          gruppe={tokenDialogGruppe}
          onClose={() => setTokenDialogGruppe(null)}
        />
      )}
    </Layout>
  );
};
