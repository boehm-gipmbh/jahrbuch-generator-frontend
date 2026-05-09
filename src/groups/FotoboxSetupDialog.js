import React, {useState} from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, TextField, Typography
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {api} from './api';

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export const FotoboxSetupDialog = ({onClose}) => {
  const [groupName, setGroupName] = useState('');
  const [validFrom, setValidFrom] = useState(today());
  const [validTo, setValidTo] = useState(tomorrow());
  const [recipientEmail, setRecipientEmail] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [setupFotobox, {isLoading}] = api.endpoints.setupFotobox.useMutation();
  const emailInvalid = recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);

  const handleSetup = () => {
    setupFotobox({groupName, validFrom, validTo, recipientEmail: recipientEmail || undefined})
      .unwrap()
      .then(res => setResult(res));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Neue Fotobox-Veranstaltung</DialogTitle>
      <DialogContent>
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
          <TextField
            label="Veranstaltungsname"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            fullWidth
            disabled={!!result}
            autoFocus
          />
          <Box sx={{display: 'flex', gap: 2}}>
            <TextField
              label="Gültig ab"
              type="date"
              value={validFrom}
              onChange={e => setValidFrom(e.target.value)}
              InputLabelProps={{shrink: true}}
              fullWidth
              disabled={!!result}
            />
            <TextField
              label="Gültig bis"
              type="date"
              value={validTo}
              onChange={e => setValidTo(e.target.value)}
              InputLabelProps={{shrink: true}}
              fullWidth
              disabled={!!result}
            />
          </Box>
          <TextField
            label="Token per E-Mail senden an (optional)"
            type="email"
            value={recipientEmail}
            onChange={e => setRecipientEmail(e.target.value)}
            fullWidth
            disabled={!!result}
            error={!!emailInvalid}
            helperText={emailInvalid ? 'Bitte eine gültige E-Mail-Adresse eingeben' : ''}
          />

          {result && (
            <Box sx={{bgcolor: 'grey.100', p: 2, borderRadius: 1, position: 'relative'}}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Gruppe "{result.groupName}" erstellt — Token jetzt kopieren
              </Typography>
              <Typography
                sx={{fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', pr: 5}}
              >
                {result.token}
              </Typography>
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{position: 'absolute', top: 8, right: 8}}
              >
                <ContentCopyIcon fontSize="small" color={copied ? 'success' : 'inherit'} />
              </IconButton>
              <Typography variant="caption" color="text.secondary" sx={{mt: 1, display: 'block'}}>
                In application.properties auf der Capture-Station eintragen:
              </Typography>
              <Typography sx={{fontFamily: 'monospace', fontSize: 11, color: 'text.secondary'}}>
                %station.jahrbuch.fotobox.token={result.token.slice(0, 20)}...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{result ? 'Fertig' : 'Abbrechen'}</Button>
        {!result && (
          <Button
            onClick={handleSetup}
            variant="contained"
            disabled={isLoading || !groupName.trim() || !validFrom || !validTo || !!emailInvalid}
          >
            Gruppe + Token erstellen
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
