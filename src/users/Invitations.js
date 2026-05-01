import React, {useState} from 'react';
import {BatchInviteDialog} from './BatchInviteDialog';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box, Button, Chip, Collapse, Container, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Paper, Snackbar, Table, TableBody,
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
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import {api} from './api';
import {Layout} from '../layout';

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
};

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
  const emailInvalid = recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);

  const handleCreate = () => {
    if (emailInvalid) return;
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
          error={!!emailInvalid}
          helperText={emailInvalid ? 'Bitte eine gültige E-Mail-Adresse eingeben' : 'Wird ausgefüllt, sendet das System direkt eine Einladungsmail'}/>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!!emailInvalid}>Erstellen</Button>
      </DialogActions>
    </Dialog>
  );
};

const ReminderSendEntry = ({send}) => {
  const [fetchStatus, {data: statusData, isFetching}] = api.endpoints.getReminderSendStatus.useLazyQuery();
  const shownStatus = statusData?.id === String(send.id) ? statusData.status : send.deliveryStatus;
  return (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, pl: 1, py: 0.1}}>
      <Typography variant="caption" color="text.secondary">
        {new Date(send.sentAt).toLocaleString()}
      </Typography>
      <Tooltip title="Zustellstatus abrufen">
        <IconButton size="small" disabled={isFetching} onClick={() => fetchStatus(send.id)}>
          <RefreshIcon sx={{fontSize: '0.875rem'}}/>
        </IconButton>
      </Tooltip>
      {shownStatus && deliveryChip(shownStatus)}
    </Box>
  );
};

const ReminderSection = ({user, canAct}) => {
  const [sendReminder] = api.endpoints.sendReminder.useMutation();
  const [showHistory, setShowHistory] = useState(false);
  const {data: sends, refetch} = api.endpoints.getReminderSends.useQuery(user.id, {skip: !canAct || !user.email});

  const handleSend = () => {
    sendReminder(user.id).unwrap().then(() => refetch()).catch(() => {});
  };

  if (!canAct || !user.email) return null;

  return (
    <Box sx={{mb: 0.5}}>
      <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
        <MailOutlineIcon sx={{fontSize: '0.875rem'}} color="action"/>
        <Typography variant="caption" color="text.secondary">Erinnerungsmail</Typography>
        <Tooltip title="Jetzt senden">
          <IconButton size="small" onClick={handleSend}>
            <SendIcon sx={{fontSize: '0.875rem'}}/>
          </IconButton>
        </Tooltip>
        {sends && sends.length > 0 && (
          <Box component="span" sx={{cursor: 'pointer', color: 'text.disabled', fontSize: '0.65rem', '&:hover': {color: 'text.primary'}}}
            onClick={() => setShowHistory(v => !v)}>
            {showHistory ? '▲' : `▼ ${sends.length}×`}
          </Box>
        )}
      </Box>
      {showHistory && sends && sends.map(s => <ReminderSendEntry key={s.id} send={s}/>)}
    </Box>
  );
};

const UserActions = ({user, self, isAdmin, isGroupAdmin, groupId}) => {
  const [deleteUser] = api.endpoints.deleteUser.useMutation();
  const [deactivateUser] = api.endpoints.deactivateUser.useMutation();
  const [reactivateUser] = api.endpoints.reactivateUser.useMutation();
  const [promoteUser] = api.endpoints.promoteUser.useMutation();
  const [demoteUser] = api.endpoints.demoteUser.useMutation();
  const isSelf = user.id === self?.id;
  const isGroupAdminRole = groupId
    ? (user.managedGroups || []).some(g => g.id === groupId)
    : (user.roles || []).includes('group-admin');

  if (!isAdmin && !isGroupAdmin) return null;

  const canAct = isAdmin || isGroupAdmin;

  return (
    <Box sx={{display: 'flex', gap: 0.5, alignItems: 'center'}}>
      {canAct && !isSelf && (
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
      {canAct && (user.active ? (
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
      {canAct && (
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

const UserRow = ({user, self, isAdmin, isGroupAdmin, groupId, invToken}) => {
  const [open, setOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [updateUserInvitationExpiry] = api.endpoints.updateUserInvitationExpiry.useMutation();
  const [updateUserEmail] = api.endpoints.updateUserEmail.useMutation();

  const handleEmailEdit = (e) => {
    e.stopPropagation();
    setEmailValue(user.email || '');
    setEditingEmail(true);
  };

  const handleEmailSave = (e) => {
    e.stopPropagation();
    updateUserEmail({id: user.id, email: emailValue})
      .unwrap()
      .then(() => setEditingEmail(false))
      .catch(() => {});
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter') handleEmailSave(e);
    if (e.key === 'Escape') { e.stopPropagation(); setEditingEmail(false); }
  };

  const handleExtend = () => {
    updateUserInvitationExpiry({id: user.id, expiresAt: new Date(newDate).toISOString()})
      .unwrap()
      .then(() => setExtending(false))
      .catch(() => {});
  };

  return (
    <>
      <ListItem disableGutters sx={{pl: 2, cursor: 'pointer'}} onClick={() => setOpen(v => !v)}>
        <ListItemIcon sx={{minWidth: 28}}>
          {open ? <ExpandLessIcon fontSize="small" color="action"/> : <ExpandMoreIcon fontSize="small" color="action"/>}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
              {user.name}
              {(groupId
                ? (user.managedGroups || []).some(g => g.id === groupId)
                : (user.roles || []).includes('group-admin'))
                && <Chip label="group-admin" size="small" variant="outlined" color="primary"/>}
              {!user.active && <Chip label="Gesperrt" size="small" color="error"/>}
              {user.invitationExpiresAt && (() => {
                const days = daysUntil(user.invitationExpiresAt);
                if (days === null || days > 14) return null;
                return (
                  <Tooltip title={days <= 0 ? 'Einladung abgelaufen' : `Einladung läuft in ${days} Tag${days === 1 ? '' : 'en'} ab`}>
                    <WarningAmberIcon fontSize="small" color={days <= 0 ? 'error' : 'warning'}/>
                  </Tooltip>
                );
              })()}
            </Box>
          }
          secondary={
            <Box component="span" sx={{display: 'flex', alignItems: 'center', gap: 0.5}} onClick={e => e.stopPropagation()}>
              {editingEmail ? (
                <>
                  <TextField size="small" value={emailValue} type="email"
                    onChange={e => setEmailValue(e.target.value)}
                    onKeyDown={handleEmailKeyDown}
                    autoFocus
                    sx={{'& input': {py: 0.25, fontSize: '0.75rem'}, width: 220}}/>
                  <Button size="small" variant="contained" sx={{py: 0, minWidth: 0, fontSize: '0.7rem'}} onClick={handleEmailSave}>OK</Button>
                  <Button size="small" sx={{py: 0, minWidth: 0, fontSize: '0.7rem'}} onClick={e => { e.stopPropagation(); setEditingEmail(false); }}>✕</Button>
                </>
              ) : (
                <>
                  <span>{user.email}</span>
                  {(isAdmin || isGroupAdmin) && (
                    <Box component="span" sx={{cursor: 'pointer', color: 'text.disabled', fontSize: '0.7rem', ml: 0.25, '&:hover': {color: 'primary.main'}}} onClick={handleEmailEdit}>✎</Box>
                  )}
                  {invToken && <Box component="span" sx={{ml: 0.5, color: 'text.disabled'}}>#{invToken.slice(0, 4)}</Box>}
                </>
              )}
            </Box>
          }
          primaryTypographyProps={{variant: 'body2'}}
          secondaryTypographyProps={{variant: 'caption', component: 'span'}}
        />
      </ListItem>
      <Collapse in={open} unmountOnExit>
        <Box sx={{pl: 7, pb: 1}}>
          <ReminderSection user={user} canAct={isAdmin || isGroupAdmin}/>
          <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <Box>
            {user.invitationExpiresAt && !extending && (() => {
              const days = daysUntil(user.invitationExpiresAt);
              const isExpired = days !== null && days <= 0;
              const isWarning = days !== null && days > 0 && days <= 14;
              return (
                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                  {(isExpired || isWarning) && (
                    <WarningAmberIcon fontSize="small" color={isExpired ? 'error' : 'warning'}/>
                  )}
                  <Typography variant="caption"
                    color={isExpired ? 'error' : isWarning ? 'warning.main' : 'text.secondary'}>
                    Einladung {isExpired ? 'abgelaufen' : `läuft ab`}: {new Date(user.invitationExpiresAt).toLocaleDateString()}
                    {isWarning && ` (${days}d)`}
                  </Typography>
                  {(isAdmin || isGroupAdmin) && user.usedInvitationId && (
                    <Button size="small" sx={{fontSize: '0.7rem', py: 0, minWidth: 0}}
                      onClick={() => { setNewDate(new Date(user.invitationExpiresAt).toISOString().slice(0,10)); setExtending(true); }}>
                      Verlängern
                    </Button>
                  )}
                </Box>
              );
            })()}
            {extending && (
              <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5}}>
                <TextField size="small" type="date" value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  InputLabelProps={{shrink: true}} sx={{'& input': {py: 0.5, fontSize: '0.75rem'}}}/>
                <Button size="small" variant="contained" onClick={handleExtend}>OK</Button>
                <Button size="small" onClick={() => setExtending(false)}>Abbrechen</Button>
              </Box>
            )}
          </Box>
          <UserActions user={user} self={self} isAdmin={isAdmin} isGroupAdmin={isGroupAdmin} groupId={groupId}/>
          </Box>
        </Box>
      </Collapse>
    </>
  );
};

const deliveryChip = (status) => {
  if (!status || status === 'unknown') return null;
  const map = {
    sent:        {label: 'Gesendet',    color: 'info'},
    delivered:   {label: 'Zugestellt', color: 'success'},
    bounced:     {label: 'Zurückgewiesen', color: 'error'},
    suppressed:  {label: 'Gesperrt',   color: 'error'},
    complained:  {label: 'Spam',       color: 'warning'},
  };
  const cfg = map[status];
  return cfg ? <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" sx={{fontSize: '0.65rem', height: 18}}/> : null;
};

const SendHistoryEntry = ({s, inv, members, canAct, resendInvitation}) => {
  const [fetchStatus, {data: liveStatus, isFetching}] = api.endpoints.getSendStatus.useLazyQuery();
  const [deleteSend] = api.endpoints.deleteSend.useMutation();

  const regMember = members.find(u => u.email === s.sentTo);
  const regActive = regMember ? regMember.active !== false : true;
  const inGroup = !!regMember;
  const regName = regMember?.name || s.registeredUserName;
  const hasAccount = !!(regMember || s.registeredUserName);
  const isInvalid = s.status === 'invalid';
  const isAlreadyRegistered = s.status === 'already_registered';
  const isRegisteredNotInGroup = s.status === 'registered_not_in_group';
  const shownDeliveryStatus = liveStatus?.status || s.deliveryStatus;
  const deliveryFailed = ['bounced', 'suppressed', 'complained'].includes(shownDeliveryStatus);

  return (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, pl: 2, py: 0.1, flexWrap: 'wrap'}}>
      {s.sentAt && (
        <Typography variant="caption" color="text.secondary">
          {new Date(s.sentAt).toLocaleString()}
        </Typography>
      )}
      {deliveryChip(shownDeliveryStatus)}
      {isInvalid
        ? <Chip label="Ungültig" size="small" color="error" variant="outlined" sx={{fontSize: '0.65rem', height: 18}}/>
        : isAlreadyRegistered
          ? <Chip label={regName ? `Bereits in der Gruppe (${regName})` : 'Bereits in der Gruppe'} size="small" color="success" variant="outlined" sx={{fontSize: '0.65rem', height: 18}}/>
          : isRegisteredNotInGroup || (hasAccount && !inGroup)
          ? <><Chip label={regName ? `Konto vorhanden (${regName}), nicht in Gruppe` : 'Konto vorhanden, nicht in Gruppe'} size="small" color="warning" variant="outlined" icon={<WarningAmberIcon/>} sx={{fontSize: '0.65rem', height: 18}}/>
              {canAct && s.id && (
                <Tooltip title="Einladung erneut senden">
                  <IconButton size="small" onClick={() => resendInvitation({id: inv.id, recipientEmail: s.sentTo})}>
                    <SendIcon sx={{fontSize: '0.875rem'}}/>
                  </IconButton>
                </Tooltip>
              )}</>
          : inGroup
          ? <><Chip label={regName} size="small" color="success" variant="outlined" sx={{fontSize: '0.65rem', height: 18}}/>
              {!regActive && <Chip label="Gesperrt" size="small" color="error" sx={{fontSize: '0.65rem', height: 18}}/>}</>
          : !deliveryFailed && <><Chip label="Noch nicht registriert" size="small" color="warning" variant="outlined" sx={{fontSize: '0.65rem', height: 18}}/>
              {canAct && s.id && (
                <Tooltip title="Erneut senden">
                  <IconButton size="small" onClick={() => resendInvitation({id: inv.id, recipientEmail: s.sentTo})}>
                    <SendIcon sx={{fontSize: '0.875rem'}}/>
                  </IconButton>
                </Tooltip>
              )}</>}
      {!isInvalid && s.id && canAct && (
        <Tooltip title="Zustellstatus aktualisieren">
          <IconButton size="small" disabled={isFetching} onClick={() => fetchStatus(s.id)}>
            <RefreshIcon sx={{fontSize: '0.875rem'}}/>
          </IconButton>
        </Tooltip>
      )}
      {s.id && canAct && (
        <Tooltip title="Eintrag löschen">
          <IconButton size="small" onClick={() => deleteSend(s.id)}>
            <DeleteIcon sx={{fontSize: '0.875rem'}}/>
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

const SendEmailGroup = ({email, sends, inv, members, canAct, resendInvitation}) => {
  const [updateSendEmail] = api.endpoints.updateSendEmail.useMutation();
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const sorted = [...sends].sort((a, b) => {
    if (!a.sentAt && !b.sentAt) return (a.id || 0) - (b.id || 0);
    if (!a.sentAt) return -1;
    if (!b.sentAt) return 1;
    return new Date(a.sentAt) - new Date(b.sentAt);
  });
  const latest = sorted[sorted.length - 1];
  const history = sorted.slice(0, -1);
  const editId = [...sorted].reverse().find(s => s.id)?.id;
  const isInvalid = latest.status === 'invalid';
  const isWarning = latest.status === 'registered_not_in_group';

  const handleEmailSave = () => {
    if (!editId) return;
    updateSendEmail({sendId: editId, email: emailValue})
      .unwrap()
      .then(() => setEditingEmail(false))
      .catch(() => {});
  };

  return (
    <Box sx={{mb: 0.5}}>
      {editingEmail ? (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, py: 0.25}}>
          <MailOutlineIcon fontSize="small" color="action" sx={{fontSize: '0.875rem'}}/>
          <TextField size="small" value={emailValue} type="email" autoFocus
            onChange={e => setEmailValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEmailSave(); if (e.key === 'Escape') setEditingEmail(false); }}
            sx={{'& input': {py: 0.25, fontSize: '0.75rem'}, width: 220}}/>
          <Button size="small" variant="contained" sx={{py: 0, minWidth: 0, fontSize: '0.7rem'}} onClick={handleEmailSave}>OK</Button>
          <Button size="small" sx={{py: 0, minWidth: 0, fontSize: '0.7rem'}} onClick={() => setEditingEmail(false)}>✕</Button>
        </Box>
      ) : (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, py: 0.1}}>
          <MailOutlineIcon fontSize="small" color={isInvalid ? 'disabled' : isWarning ? 'warning' : 'action'} sx={{fontSize: '0.875rem'}}/>
          <Typography variant="caption" color={isInvalid ? 'text.disabled' : 'inherit'}>{email}</Typography>
          {canAct && editId && (
            <Box component="span" sx={{cursor: 'pointer', color: 'text.disabled', fontSize: '0.7rem', '&:hover': {color: 'primary.main'}}}
              onClick={() => { setEmailValue(email); setEditingEmail(true); }}>✎</Box>
          )}
          {canAct && !isInvalid && (
            <Tooltip title="Erneut senden">
              <IconButton size="small" onClick={() => resendInvitation({id: inv.id, recipientEmail: email})}>
                <SendIcon sx={{fontSize: '0.875rem'}}/>
              </IconButton>
            </Tooltip>
          )}
          {history.length > 0 && (
            <Box component="span" sx={{cursor: 'pointer', color: 'text.disabled', fontSize: '0.65rem', ml: 0.5, '&:hover': {color: 'text.primary'}}}
              onClick={() => setShowHistory(v => !v)}>
              {showHistory ? '▲' : `▼ +${history.length}`}
            </Box>
          )}
        </Box>
      )}
      <SendHistoryEntry s={latest} inv={inv} members={members} canAct={canAct} resendInvitation={resendInvitation}/>
      {showHistory && history.map((s, i) => (
        <SendHistoryEntry key={i} s={s} inv={inv} members={members} canAct={canAct} resendInvitation={resendInvitation}/>
      ))}
    </Box>
  );
};

const TokenRow = ({inv, isAdmin, isGroupAdmin, copyLink, deactivateInvitation, reactivateInvitation, deleteInvitation}) => {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [extending, setExtending] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [showSends, setShowSends] = useState(false);
  const [resendInvitation] = api.endpoints.resendInvitation.useMutation();
  const [extendInvitation] = api.endpoints.extendInvitation.useMutation();
  const canAct = isAdmin || isGroupAdmin;

  const handleSendEmail = () => {
    resendInvitation({id: inv.id, recipientEmail: emailValue})
      .unwrap()
      .then(() => setSendingEmail(false))
      .catch(() => {});
  };

  const handleExtend = () => {
    extendInvitation({id: inv.id, expiresAt: new Date(newDate).toISOString()})
      .unwrap()
      .then(() => setExtending(false))
      .catch(() => {});
  };

  const registeredUsers = inv.registeredUsers || [];
  const members = inv.members || registeredUsers;
  const registrationCount = members.length;
  const registeredEmails = members.map(u => u.email).join('\n');
  const sends = inv.sends || [];
  const sendList = sends.length > 0 ? sends
    : (inv.recipientEmail ? [{sentTo: inv.recipientEmail, sentAt: inv.sentAt}] : []);
  const sendsByEmail = sendList.reduce((acc, s) => {
    const key = s.sentTo || '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  // Alle Gruppenmitglieder (egal ob via Email-Send oder direktem Link registriert) anzeigen
  members.forEach(u => {
    if (u.email && !sendsByEmail[u.email]) {
      sendsByEmail[u.email] = [{sentTo: u.email, status: 'already_registered', registeredUserName: u.name}];
    }
  });
  const emailCount = Object.keys(sendsByEmail).length;

  const colSpan = canAct ? 6 : 5;

  return (
    <>
      <TableRow>
        <TableCell>
          <Box sx={{display: 'flex', flexDirection: 'column'}}>
            <span>{inv.role}</span>
            {inv.token && <Typography variant="caption" color="text.disabled">#{inv.token.slice(0, 4)}</Typography>}
          </Box>
        </TableCell>
        <TableCell>
          <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
            {new Date(inv.expiresAt).toLocaleDateString()}
            {canAct && (
              <Button size="small" sx={{fontSize: '0.7rem', py: 0, minWidth: 0}}
                onClick={() => { setNewDate(new Date(inv.expiresAt).toISOString().slice(0, 10)); setSendingEmail(false); setExtending(v => !v); }}>
                Verlängern
              </Button>
            )}
          </Box>
        </TableCell>
        <TableCell>
          {(() => {
            if (!inv.active) return <Chip label="Inaktiv" size="small"/>;
            const days = daysUntil(inv.expiresAt);
            if (days !== null && days <= 0) return <Chip label="Abgelaufen" color="error" size="small"/>;
            if (days !== null && days <= 14)
              return <Chip label={`Läuft ab (${days}d)`} color="warning" size="small"
                icon={<WarningAmberIcon/>}/>;
            return <Chip label="Aktiv" color="success" size="small"/>;
          })()}
        </TableCell>
        <TableCell>
          {registrationCount > 0 ? (
            <Tooltip title={<span style={{whiteSpace: 'pre-line'}}>{registeredEmails}</span>} arrow>
              <Chip label={registrationCount} size="small" variant="outlined" color="primary" sx={{cursor: 'help'}}/>
            </Tooltip>
          ) : (
            <Typography variant="caption" color="text.secondary">—</Typography>
          )}
        </TableCell>
        {canAct && (
          <TableCell>
            {sendList.length > 0 ? (
              <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer'}}
                onClick={() => setShowSends(v => !v)}>
                <MailOutlineIcon fontSize="small" color="action"/>
                <Typography variant="caption">{emailCount}×</Typography>
                {showSends
                  ? <ExpandLessIcon fontSize="small" color="action"/>
                  : <ExpandMoreIcon fontSize="small" color="action"/>}
              </Box>
            ) : '—'}
          </TableCell>
        )}
        <TableCell align="right" sx={{whiteSpace: 'nowrap'}}>
          <Tooltip title="Link kopieren">
            <span>
              <IconButton size="small" disabled={!inv.active} onClick={() => copyLink(inv.token)}>
                <ContentCopyIcon fontSize="small"/>
              </IconButton>
            </span>
          </Tooltip>
          {canAct && (
            <Tooltip title="Einladungsmail senden">
              <IconButton size="small" onClick={() => { setEmailValue(inv.recipientEmail || ''); setSendingEmail(v => !v); }}>
                <MailOutlineIcon fontSize="small" color={sendingEmail ? 'primary' : 'action'}/>
              </IconButton>
            </Tooltip>
          )}
          {canAct && (inv.active ? (
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
          {canAct && (
            <Tooltip title="Löschen">
              <IconButton size="small" onClick={() => deleteInvitation(inv.id)}>
                <DeleteIcon fontSize="small"/>
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      {sendingEmail && (
        <TableRow>
          <TableCell colSpan={colSpan} sx={{py: 0.5, borderBottom: 0}}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
              <TextField size="small" label="E-Mail-Adresse" type="email" value={emailValue}
                onChange={e => setEmailValue(e.target.value)}
                sx={{flexGrow: 1}} InputLabelProps={{shrink: true}}/>
              <Button size="small" variant="contained" onClick={handleSendEmail}>Senden</Button>
              <Button size="small" onClick={() => setSendingEmail(false)}>Abbrechen</Button>
            </Box>
          </TableCell>
        </TableRow>
      )}
      {extending && (
        <TableRow>
          <TableCell colSpan={colSpan} sx={{py: 0.5, borderBottom: 0}}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
              <TextField size="small" label="Neues Ablaufdatum" type="date" value={newDate}
                onChange={e => setNewDate(e.target.value)}
                sx={{flexGrow: 1}} InputLabelProps={{shrink: true}}/>
              <Button size="small" variant="contained" onClick={handleExtend}>OK</Button>
              <Button size="small" onClick={() => setExtending(false)}>Abbrechen</Button>
            </Box>
          </TableCell>
        </TableRow>
      )}
      {showSends && emailCount > 0 && (
        <TableRow>
          <TableCell colSpan={colSpan} sx={{py: 0.5, borderBottom: 0, pl: 4}}>
            {Object.entries(sendsByEmail).map(([email, emailSends]) => (
              <SendEmailGroup key={email} email={email} sends={emailSends} inv={inv} members={members} canAct={canAct} resendInvitation={resendInvitation}/>
            ))}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const GroupSection = ({label, invs, self, isAdmin, isGroupAdmin, groupId: parentGroupId, expanded, toggleExpanded, copyLink,
    deactivateInvitation, reactivateInvitation, deleteInvitation}) => {
  const memberMap = new Map();
  const invTokenByUserId = new Map();
  invs.forEach(inv => (inv.members || []).forEach(u => {
    memberMap.set(u.id, u);
    invTokenByUserId.set(u.id, inv.token);
  }));
  const uniqueMembers = [...memberMap.values()];
  const groupId = parentGroupId ?? invs.find(inv => inv.group?.id)?.group?.id ?? null;
  const groupKey = `group_${label}`;
  const isOpen = expanded[groupKey] !== false;
  const canAct = isAdmin || isGroupAdmin;

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
            {uniqueMembers.map(u => <UserRow key={u.id} user={u} self={self} isAdmin={isAdmin} isGroupAdmin={isGroupAdmin} groupId={groupId} invToken={invTokenByUserId.get(u.id)}/>)}
          </List>
        )}
        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1, mb: 0.5, pl: 0.5}}>
          Einladungslinks
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rolle</TableCell>
              <TableCell>Läuft ab</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Registrierungen</TableCell>
              {canAct && <TableCell>Gesendet an</TableCell>}
              <TableCell/>
            </TableRow>
          </TableHead>
          <TableBody>
            {invs.map(inv => (
              <TokenRow key={inv.id} inv={inv} isAdmin={isAdmin} isGroupAdmin={isGroupAdmin}
                copyLink={copyLink} deactivateInvitation={deactivateInvitation}
                reactivateInvitation={reactivateInvitation} deleteInvitation={deleteInvitation}/>
            ))}
          </TableBody>
        </Table>
      </Collapse>
    </Box>
  );
};

export const Invitations = () => {
  const {data: invitations = []} = api.endpoints.getInvitations.useQuery();
  const {data: self} = api.endpoints.getSelf.useQuery();
  const isAdmin = self?.roles?.includes('admin');
  const {data: allUsers = []} = api.endpoints.getUsers.useQuery(undefined, {pollingInterval: 10000, skip: !isAdmin});
  const [deactivateInvitation] = api.endpoints.deactivateInvitation.useMutation();
  const [reactivateInvitation] = api.endpoints.reactivateInvitation.useMutation();
  const [deleteInvitation] = api.endpoints.deleteInvitation.useMutation();
  const [showNew, setShowNew] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState({});

  const hasGroupAdminRole = !isAdmin && self?.roles?.includes('group-admin');
  const isGroupAdmin = hasGroupAdminRole && self?.activeGroup != null;
  const groupName = isGroupAdmin ? self?.activeGroup?.name : null;
  const groupId = isGroupAdmin ? self?.activeGroup?.id : null;

  if (hasGroupAdminRole && !isGroupAdmin) {
    return (
      <Layout>
        <Container sx={{mt: 2}}>
          <Paper sx={{p: 2}}>
            <Typography color="text.secondary">
              Wechseln Sie zu Ihrer verwalteten Gruppe um Einladungen zu verwalten.
            </Typography>
          </Paper>
        </Container>
      </Layout>
    );
  }

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
            <Box sx={{display: 'flex', gap: 1}}>
              <Button variant="outlined" size="small" onClick={() => setShowBatch(true)}>
                Batch-Einladung
              </Button>
              {(!isGroupAdmin || invitations.length === 0) && (
                <Button startIcon={<AddIcon/>} variant="contained" size="small"
                  onClick={() => setShowNew(true)}>
                  Neuer Link
                </Button>
              )}
            </Box>
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
      {showBatch && (
        <BatchInviteDialog
          onClose={() => setShowBatch(false)}
          invitations={invitations}
          isAdmin={isAdmin}
          groupName={groupName}
        />
      )}
      <Snackbar open={copied} message="Link in Zwischenablage kopiert"
        autoHideDuration={3000} onClose={() => setCopied(false)}/>
    </Layout>
  );
};