import React, {useState} from 'react';
import {
  Box, Button, Container, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {Navigate} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {Layout} from '../layout';
import {api} from './api';
import {api as usersApi} from '../users';
import {FotoboxSetupDialog} from './FotoboxSetupDialog';
import {FotoboxTokenDialog} from './FotoboxTokenDialog';

const useJahrbuchDownload = () => {
  const jwt = useSelector(state => state.auth.jwt);
  return async (gruppe) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/pdf/${gruppe.id}`, {
      headers: {Authorization: `Bearer ${jwt}`}
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jahrbuch-${gruppe.name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
};

export const Groups = () => {
  const {data: user} = usersApi.endpoints.getSelf.useQuery();
  const {data: groups} = api.endpoints.getGroups.useQuery();
  const [setupOpen, setSetupOpen] = useState(false);
  const [tokenDialogGruppe, setTokenDialogGruppe] = useState(null);
  const downloadJahrbuch = useJahrbuchDownload();

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
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() => downloadJahrbuch(gruppe)}
                      >
                        Jahrbuch exportieren
                      </Button>
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
