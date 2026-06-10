import React, {useState} from 'react';
import {
  Box, Button, Container, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {Navigate} from 'react-router-dom';
import {Layout} from '../layout';
import {api} from './api';
import {api as usersApi} from '../users';
import {FotoboxSetupDialog} from './FotoboxSetupDialog';
import {FotoboxTokenDialog} from './FotoboxTokenDialog';
import {PdfSettingsDialog} from './PdfSettingsDialog';

export const Groups = () => {
  const {data: user} = usersApi.endpoints.getSelf.useQuery();
  const {data: groups} = api.endpoints.getGroups.useQuery();
  const [revokeToken] = api.endpoints.revokeToken.useMutation();
  const [setupOpen, setSetupOpen] = useState(false);
  const [tokenDialogGruppe, setTokenDialogGruppe] = useState(null);
  const [revokeConfirmGruppe, setRevokeConfirmGruppe] = useState(null);
  const [pdfSettingsGruppe, setPdfSettingsGruppe] = useState(null);

  const isAdmin = user?.roles?.includes('admin');
  const isGroupAdmin = user?.roles?.includes('group-admin');

  if (user && !isAdmin && !isGroupAdmin) {
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
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setSetupOpen(true)}
              >
                Neue Fotobox-Veranstaltung
              </Button>
            )}
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
                        onClick={() => setPdfSettingsGruppe(gruppe)}
                      >
                        PDF-Einstellungen
                      </Button>
                      {isAdmin && (
                        <Button
                          size="small"
                          startIcon={<CameraAltIcon />}
                          onClick={() => setTokenDialogGruppe(gruppe)}
                        >
                          Token neu generieren
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<BlockIcon />}
                          onClick={() => setRevokeConfirmGruppe(gruppe)}
                        >
                          Token widerrufen
                        </Button>
                      )}
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

      {pdfSettingsGruppe && (
        <PdfSettingsDialog
          groupId={pdfSettingsGruppe.id}
          onClose={() => setPdfSettingsGruppe(null)}
        />
      )}

      {tokenDialogGruppe && (
        <FotoboxTokenDialog
          gruppe={tokenDialogGruppe}
          onClose={() => setTokenDialogGruppe(null)}
        />
      )}

      <Dialog open={!!revokeConfirmGruppe} onClose={() => setRevokeConfirmGruppe(null)}>
        <DialogTitle>Token widerrufen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Soll der aktive Fotobox-Token für <strong>{revokeConfirmGruppe?.name}</strong> sofort
            widerrufen werden? Die Fotobox kann danach keine Bilder mehr hochladen.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeConfirmGruppe(null)}>Abbrechen</Button>
          <Button
            color="error"
            onClick={() => {
              revokeToken({id: revokeConfirmGruppe.id});
              setRevokeConfirmGruppe(null);
            }}
          >
            Widerrufen
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};
