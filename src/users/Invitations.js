import React, {useState} from 'react';
import {
  Box, Button, Chip, Collapse, Container, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, List, ListItem, ListItemText, Paper, Snackbar, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Tooltip, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import {api} from './api';
import {Layout} from '../layout';

const NewInvitationDialog = ({onClose, isAdmin, groupName}) => {
  const [createInvitation] = api.endpoints.createInvitation.useMutation();
  const [label, setLabel] = useState(isAdmin ? '' : (groupName || ''));
  const [role, setRole] = useState('user');
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [recipientEmail, setRecipientEmail] = useState('');

  const handleCreate = () => {
    const body = {role, expiresAt: new Date(expiresAt).toISOString()};
    if (isAdmin) {
      if (label) body.label = label;
    }
    if (recipientEmail) body.recipientEmail = recipientEmail;
    createInvitation(body)
      .unwrap()
      .then(onClose)
      .catch(() => {});
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Neuen Einladungslink erstellen</DialogTitle>
      <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
        {isAdmin ? (
          <>
            <TextField label="Label / Gruppe (optional)" value={label}
              onChange={e => setLabel(e.target.value)} fullWidth/>
            <TextField label="Ablaufdatum" type="date" value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)} fullWidth InputLabelProps={{shrink: true}}/>
            <TextField label="Rolle" value={role} onChange={e => setRole(e.target.value)}
              select SelectProps={{native: true}} fullWidth>
              <option value="user">user</option>
              <option value="group-admin">group-admin</option>
              <option value="admin">admin</option>
            </TextField>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Gruppe: <strong>{groupName}</strong>
            </Typography>
            <TextField label="Ablaufdatum" type="date" value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)} fullWidth InputLabelProps={{shrink: true}}/>
            <TextField label="Rolle" value={role} onChange={e => setRole(e.target.value)}
              select SelectProps={{native: true}} fullWidth>
              <option value="user">user</option>
              <option value="group-admin">group-admin</option>
            </TextField>
          </>
        )}
        <TextField label="Einladungs-E-Mail senden an (optional)" value={recipientEmail}
          onChange={e => setRecipientEmail(e.target.value)} fullWidth type="email"
          helperText="Wird ausgefüllt, sendet das System direkt eine Einladungsmail"/>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={handleCreate}>Erstellen</Button>
      </DialogActions>
    </Dialog>
  );
};

const UserActions = ({user, self, isAdmin, isGroupAdmin, groupId}) => {
  const [deleteUser] = api.endpoints.deleteUser.useMutation();
  const [deactivateUser] = api.endpoints.deactivateUser.useMutation();
  const [reactivateUser] = api.endpoints.reactivateUser.useMutation();
  const [promoteUser] = api.endpoints.promoteUser.useMutation();
  const [demoteUser] = api.endpoints.demoteUser.useMutation();
  const isSelf = user.id === self?.id;
  const isGroupAdminRole = (user.roles || []).includes('group-admin');

  if (!isAdmin && !isGroupAdmin) return null;

  return (
    <Box sx={{display: 'flex', gap: 0.5}}>
      {isGroupAdmin && !isSelf && (
        isGroupAdminRole ? (
          <Tooltip title="Zu user degradieren">
            <IconButton size="small" onClick={() => demoteUser(user.id)}>
              <ArrowDownwardIcon fontSize="small" color="warning"/>
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Zum group-admin befördern">
            <IconButton size="small" onClick={() => promoteUser({id: user.id, groupId})}>
              <ArrowUpwardIcon fontSize="small" color="primary"/>
            </IconButton>
          </Tooltip>
        )
      )}
      {isAdmin && (user.active ? (
        <Tooltip title="Deaktivieren (Login sperren)">
          <span>
            <IconButton size="small" disabled={isSelf} onClick={() => deactivateUser(user.id)}>
              <PersonOffIcon fontSize="small"/>
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <Tooltip title="Reaktivieren">
          <IconButton size="small" onClick={() => reactivateUser(user.id)}>
            <LockOpenIcon fontSize="small" color="success"/>
          </IconButton>
        </Tooltip>
      ))}
      {isAdmin && (
        <Tooltip title="Löschen">
          <span>
            <IconButton size="small" disabled={isSelf} onClick={() => deleteUser(user)}>
              <DeleteIcon fontSize="small"/>
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
};

const UserRow = ({user, self, isAdmin, isGroupAdmin, groupId}) => (
  <ListItem disableGutters sx={{pl: 2, gap: 1}}>
    <ListItemText
      primary={
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
          {user.name}
          {(user.roles || []).includes('group-admin') && <Chip label="group-admin" size="small" variant="outlined" color="primary"/>}
          {!user.active && <Chip label="Gesperrt" size="small" color="error"/>}
        </Box>
      }
      secondary={user.email}
      primaryTypographyProps={{variant: 'body2'}}
      secondaryTypographyProps={{variant: 'caption'}}
    />
    <UserActions user={user} self={self} isAdmin={isAdmin} isGroupAdmin={isGroupAdmin} groupId={groupId}/>
  </ListItem>
);

const GroupSection = ({label, invs, self, isAdmin, isGroupAdmin, groupId, expanded, toggleExpanded, copyLink,
    deactivateInvitation, reactivateInvitation, deleteInvitation}) => {
  const memberMap = new Map();
  invs.forEach(inv => (inv.members || []).forEach(u => memberMap.set(u.id, u)));
  const uniqueMembers = [...memberMap.values()];
  const groupKey = `group_${label}`;
  const isOpen = expanded[groupKey] !== false;

  return (
    <Box sx={{mb: 2}}>
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', py: 0.5}}
        onClick={() => toggleExpanded(groupKey)}>
        {isOpen
          ? <ExpandLessIcon fontSize="small" color="action"/>
          : <ExpandMoreIcon fontSize="small" color="action"/>}
        <Typography variant="subtitle2" fontWeight="bold">{label}</Typography>
        {uniqueMembers.length > 0 && <Chip label={uniqueMembers.length} size="small" color="primary"/>}
      </Box>
      <Collapse in={isOpen} unmountOnExit>
        {uniqueMembers.length > 0 && (
          <List dense disablePadding sx={{mb: 1}}>
            {uniqueMembers.map(u => <UserRow key={u.id} user={u} self={self} isAdmin={isAdmin} isGroupAdmin={isGroupAdmin} groupId={groupId}/>)}
          </List>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rolle</TableCell>
              <TableCell>Läuft ab</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell>Gesendet an</TableCell>}
              <TableCell/>
            </TableRow>
          </TableHead>
          <TableBody>
            {invs.map(inv => (
              <TableRow key={inv.id}>
                <TableCell>{inv.role}</TableCell>
                <TableCell>{new Date(inv.expiresAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {inv.active
                    ? <Chip label="Aktiv" color="success" size="small"/>
                    : <Chip label="Inaktiv" size="small"/>}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    {inv.recipientEmail ? (
                      <Tooltip title={inv.recipientEmail}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                          <MailOutlineIcon fontSize="small" color="action"/>
                          <Typography variant="caption" noWrap sx={{maxWidth: 120}}>
                            {inv.recipientEmail}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : '—'}
                  </TableCell>
                )}
                <TableCell align="right">
                  <Tooltip title="Link kopieren">
                    <span>
                      <IconButton size="small" disabled={!inv.active} onClick={() => copyLink(inv.token)}>
                        <ContentCopyIcon fontSize="small"/>
                      </IconButton>
                    </span>
                  </Tooltip>
                  {isAdmin && (inv.active ? (
                    <Tooltip title="Deaktivieren">
                      <IconButton size="small" onClick={() => deactivateInvitation(inv.id)}>
                        <BlockIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Reaktivieren">
                      <IconButton size="small" onClick={() => reactivateInvitation(inv.id)}>
                        <CheckCircleOutlineIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  ))}
                  {isAdmin && (
                    <Tooltip title="Löschen">
                      <IconButton size="small" onClick={() => deleteInvitation(inv.id)}>
                        <DeleteIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Collapse>
    </Box>
  );
};

export const Invitations = () => {
  const {data: invitations = []} = api.endpoints.getInvitations.useQuery();
  const {data: allUsers = []} = api.endpoints.getUsers.useQuery(undefined, {pollingInterval: 10000});
  const {data: self} = api.endpoints.getSelf.useQuery();
  const [deactivateInvitation] = api.endpoints.deactivateInvitation.useMutation();
  const [reactivateInvitation] = api.endpoints.reactivateInvitation.useMutation();
  const [deleteInvitation] = api.endpoints.deleteInvitation.useMutation();
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState({});

  const isAdmin = self?.roles?.includes('admin');
  const isGroupAdmin = !isAdmin && self?.roles?.includes('group-admin');
  const groupName = isGroupAdmin ? self?.groups?.[0]?.name : null;
  const groupId = isGroupAdmin ? self?.groups?.[0]?.id : null;

  const toggleExpanded = (key) => setExpanded(prev => ({...prev, [key]: !prev[key]}));

  const copyLink = (token) => {
    const url = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(url).then(() => setCopied(true));
  };

  const sectionProps = {self, isAdmin, isGroupAdmin, groupId, expanded, toggleExpanded, copyLink,
    deactivateInvitation, reactivateInvitation, deleteInvitation};

  const groupedInvitations = Object.entries(
    invitations.reduce((acc, inv) => {
      const key = inv.label || '—';
      if (!acc[key]) acc[key] = [];
      acc[key].push(inv);
      return acc;
    }, {})
  );

  const invitedUserIds = new Set(invitations.flatMap(inv => (inv.members || []).map(u => u.id)));
  const manualUsers = allUsers.filter(u => !invitedUserIds.has(u.id));

  return (
    <Layout>
      <Container sx={{mt: 2}}>
        <Paper sx={{p: 2}}>
          <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
            <Typography component="h2" variant="h6" color="primary">
              {isGroupAdmin ? `Einladungen — ${groupName}` : 'Benutzer & Einladungslinks'}
            </Typography>
            <Button startIcon={<AddIcon/>} variant="contained" size="small"
              onClick={() => setShowNew(true)}>
              Neuer Link
            </Button>
          </Box>

          {groupedInvitations.map(([label, groupInvs]) => (
            <GroupSection key={label} label={label} invs={groupInvs} {...sectionProps}/>
          ))}

          {isAdmin && manualUsers.length > 0 && (
            <>
              <Divider sx={{my: 2}}/>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1, cursor: 'pointer'}}
                onClick={() => toggleExpanded('manual')}>
                {expanded['manual']
                  ? <ExpandLessIcon fontSize="small" color="action"/>
                  : <ExpandMoreIcon fontSize="small" color="action"/>}
                <Typography variant="subtitle2" color="text.secondary">
                  Manuell angelegt ({manualUsers.length})
                </Typography>
              </Box>
              <Collapse in={!!expanded['manual']} unmountOnExit>
                <List dense disablePadding>
                  {manualUsers.map(u => <UserRow key={u.id} user={u} self={self} isAdmin={isAdmin}/>)}
                </List>
              </Collapse>
            </>
          )}
        </Paper>
      </Container>

      {showNew && (
        <NewInvitationDialog
          onClose={() => setShowNew(false)}
          isAdmin={isAdmin}
          groupName={groupName}
        />
      )}
      <Snackbar open={copied} message="Link in Zwischenablage kopiert"
        autoHideDuration={3000} onClose={() => setCopied(false)}/>
    </Layout>
  );
};