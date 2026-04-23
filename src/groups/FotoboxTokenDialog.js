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

export const FotoboxTokenDialog = ({gruppe, onClose}) => {
  const [validFrom, setValidFrom] = useState(today());
  const [validTo, setValidTo] = useState(tomorrow());
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generateFotoboxToken, {isLoading}] = api.endpoints.generateFotoboxToken.useMutation();

  const handleGenerate = () => {
    generateFotoboxToken({id: gruppe.id, validFrom, validTo})
      .unwrap()
      .then(res => setToken(res.token));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Fotobox-Token — {gruppe.name}</DialogTitle>
      <DialogContent>
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
          <Box sx={{display: 'flex', gap: 2}}>
            <TextField
              label="Gültig ab"
              type="date"
              value={validFrom}
              onChange={e => setValidFrom(e.target.value)}
              InputLabelProps={{shrink: true}}
              fullWidth
            />
            <TextField
              label="Gültig bis"
              type="date"
              value={validTo}
              onChange={e => setValidTo(e.target.value)}
              InputLabelProps={{shrink: true}}
              fullWidth
            />
          </Box>

          {token && (
            <Box sx={{bgcolor: 'grey.100', p: 2, borderRadius: 1, position: 'relative'}}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Token (einmalig angezeigt — jetzt kopieren)
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all',
                  pr: 5
                }}
              >
                {token}
              </Typography>
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{position: 'absolute', top: 8, right: 8}}
              >
                <ContentCopyIcon fontSize="small" color={copied ? 'success' : 'inherit'} />
              </IconButton>
              <Typography variant="caption" color="text.secondary" sx={{mt: 1, display: 'block'}}>
                In application.properties eintragen:
              </Typography>
              <Typography sx={{fontFamily: 'monospace', fontSize: 11, color: 'text.secondary'}}>
                %station.jahrbuch.fotobox.token={token.slice(0, 20)}...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
        <Button onClick={handleGenerate} variant="contained" disabled={isLoading || !validFrom || !validTo}>
          Token generieren
        </Button>
      </DialogActions>
    </Dialog>
  );
};
