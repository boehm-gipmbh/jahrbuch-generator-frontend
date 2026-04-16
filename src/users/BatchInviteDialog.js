import React, {useRef, useState} from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, InputLabel, MenuItem, Radio, RadioGroup,
  Select, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Typography
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {api} from './api';

const parseLines = (text) => {
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const parts = line.split(/\s+/);
      const email = parts[0];
      const role = parts[1] || null;
      return {email, role};
    });
};

const StatusChip = ({status}) => {
  if (status === 'sent')
    return <Chip label="Versendet" size="small" color="success" icon={<CheckCircleOutlineIcon/>}/>;
  if (status === 'invalid')
    return <Chip label="Ungültig" size="small" color="error" icon={<ErrorOutlineIcon/>}/>;
  if (status === 'already_registered')
    return <Chip label="Bereits registriert" size="small" color="warning" icon={<WarningAmberIcon/>}/>;
  if (status === 'already_sent')
    return <Chip label="Bereits versendet" size="small" variant="outlined" icon={<MailOutlineIcon/>}/>;
  return null;
};

export const BatchInviteDialog = ({onClose, invitations, isAdmin, groupName}) => {
  const [step, setStep] = useState(1);
  const [tokenMode, setTokenMode] = useState('new');
  const [existingTokenId, setExistingTokenId] = useState('');
  const [label, setLabel] = useState(isAdmin ? '' : (groupName || ''));
  const [defaultRole, setDefaultRole] = useState('user');
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [entries, setEntries] = useState([]);
  const [results, setResults] = useState(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef();

  const [sendBatch] = api.endpoints.sendBatchInvitation.useMutation();

  const activeTokens = (invitations || []).filter(inv => inv.active);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEntries(parseLines(ev.target.result));
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleSend = () => {
    setSending(true);
    const body = {
      entries,
      existingTokenId: tokenMode === 'existing' ? Number(existingTokenId) : null,
      expiresAt: tokenMode === 'new' ? new Date(expiresAt).toISOString() : null,
      label: tokenMode === 'new' ? label : null,
      defaultRole
    };
    sendBatch(body).unwrap()
      .then(res => { setResults(res); setStep(3); })
      .catch(() => {})
      .finally(() => setSending(false));
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Batch-Einladung versenden</DialogTitle>
      <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>

        {step === 1 && (
          <>
            <RadioGroup row value={tokenMode} onChange={e => setTokenMode(e.target.value)}>
              <FormControlLabel value="new" control={<Radio size="small"/>} label="Neuen Token erstellen"/>
              <FormControlLabel value="existing" control={<Radio size="small"/>} label="Bestehenden Token verwenden"/>
            </RadioGroup>

            {tokenMode === 'new' ? (
              <>
                {isAdmin && (
                  <TextField label="Label / Gruppe (optional)" value={label}
                    onChange={e => setLabel(e.target.value)} fullWidth size="small"/>
                )}
                {!isAdmin && (
                  <Typography variant="body2" color="text.secondary">
                    Gruppe: <strong>{groupName}</strong>
                  </Typography>
                )}
                <TextField label="Ablaufdatum" type="date" value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)} fullWidth size="small"
                  InputLabelProps={{shrink: true}}/>
                <TextField label="Standardrolle" value={defaultRole}
                  onChange={e => setDefaultRole(e.target.value)}
                  select SelectProps={{native: true}} fullWidth size="small">
                  <option value="user">user</option>
                  <option value="group-admin">group-admin</option>
                  {isAdmin && <option value="admin">admin</option>}
                </TextField>
              </>
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel>Token auswählen</InputLabel>
                <Select value={existingTokenId} label="Token auswählen"
                  onChange={e => setExistingTokenId(e.target.value)}>
                  {activeTokens.map(inv => (
                    <MenuItem key={inv.id} value={inv.id}>
                      {inv.label || '—'} · {inv.role} · #{inv.token?.slice(0, 4)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box>
              <Button variant="outlined" size="small" onClick={() => fileRef.current.click()}>
                TXT-Datei auswählen
              </Button>
              <input ref={fileRef} type="file" accept=".txt" hidden onChange={handleFile}/>
              <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.5}}>
                Format: eine E-Mail pro Zeile, optional gefolgt von «user» oder «group»
              </Typography>
            </Box>
          </>
        )}

        {step === 2 && (
          <>
            <Typography variant="body2">
              <strong>{entries.length}</strong> Einträge gelesen:
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>E-Mail</TableCell>
                  <TableCell>Rolle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell>{e.email}</TableCell>
                    <TableCell>{e.role || <Typography variant="caption" color="text.secondary">Standard ({defaultRole})</Typography>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {step === 3 && results && (
          <>
            <Typography variant="body2">
              <strong>{results.filter(r => r.status === 'sent').length}</strong> versendet ·{' '}
              <strong>{results.filter(r => r.status === 'invalid').length}</strong> ungültig ·{' '}
              <strong>{results.filter(r => r.status === 'already_registered').length}</strong> bereits registriert ·{' '}
              <strong>{results.filter(r => r.status === 'already_sent').length}</strong> bereits versendet
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>E-Mail</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.email}</TableCell>
                    <TableCell><StatusChip status={r.status}/></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
        {step === 2 && (
          <>
            <Button onClick={() => setStep(1)}>Zurück</Button>
            <Button variant="contained" onClick={handleSend} disabled={sending}>
              {sending ? 'Wird gesendet…' : `${entries.length} Einladungen senden`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};