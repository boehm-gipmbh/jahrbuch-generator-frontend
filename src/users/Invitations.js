import React, {useState} from 'react';
import {
  Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Paper, Snackbar, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Tooltip, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import {api} from './api';
import {Layout} from '../layout';

const NewInvitationDialog = ({onClose}) => {
  const [createInvitation] = api.endpoints.createInvitation.useMutation();
  const [label, setLabel] = useState('');
  const [role, setRole] = useState('user');
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  const handleCreate = () => {
    createInvitation({label, role, expiresAt: new Date(expiresAt).toISOString()})
      .unwrap()
      .then(onClose)
      .catch(() => {});
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Neuen Einladungslink erstellen</DialogTitle>
      <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
        <TextField label="Label (z.B. Klasse 2026)" value={label}
          onChange={e => setLabel(e.target.value)} fullWidth/>
        <TextField label="Ablaufdatum" type="date" value={expiresAt}
          onChange={e => setExpiresAt(e.target.value)} fullWidth InputLabelProps={{shrink: true}}/>
        <TextField label="Rolle" value={role} onChange={e => setRole(e.target.value)}
          select SelectProps={{native: true}} fullWidth>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={handleCreate}>Erstellen</Button>
      </DialogActions>
    </Dialog>
  );
};

export const Invitations = () => {
  const {data: invitations = []} = api.endpoints.getInvitations.useQuery();
  const [deactivateInvitation] = api.endpoints.deactivateInvitation.useMutation();
  const [deleteInvitation] = api.endpoints.deleteInvitation.useMutation();
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = (token) => {
    const url = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
    });
  };

  return (
    <Layout>
      <Container sx={{mt: 2}}>
        <Paper sx={{p: 2}}>
          <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
            <Typography component="h2" variant="h6" color="primary">
              Einladungslinks
            </Typography>
            <Button startIcon={<AddIcon/>} variant="contained" size="small"
              onClick={() => setShowNew(true)}>
              Neuer Link
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Label</TableCell>
                <TableCell>Rolle</TableCell>
                <TableCell>Läuft ab</TableCell>
                <TableCell>Zuletzt genutzt</TableCell>
                <TableCell>Status</TableCell>
                <TableCell/>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitations.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.label || '—'}</TableCell>
                  <TableCell>{inv.role}</TableCell>
                  <TableCell>{new Date(inv.expiresAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {inv.lastUsedAt ? new Date(inv.lastUsedAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    {inv.active
                      ? <Chip label="Aktiv" color="success" size="small"/>
                      : <Chip label="Inaktiv" size="small"/>}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Link kopieren">
                      <span>
                        <IconButton size="small" disabled={!inv.active}
                          onClick={() => copyLink(inv.token)}>
                          <ContentCopyIcon fontSize="small"/>
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Deaktivieren">
                      <span>
                        <IconButton size="small" disabled={!inv.active}
                          onClick={() => deactivateInvitation(inv.id)}>
                          <BlockIcon fontSize="small"/>
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton size="small" onClick={() => deleteInvitation(inv.id)}>
                        <DeleteIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Container>
      {showNew && <NewInvitationDialog onClose={() => setShowNew(false)}/>}
      <Snackbar open={copied} message="Link in Zwischenablage kopiert"
        autoHideDuration={3000} onClose={() => setCopied(false)}/>
    </Layout>
  );
};