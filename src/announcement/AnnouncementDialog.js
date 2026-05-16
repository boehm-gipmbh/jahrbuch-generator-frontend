import React, {useMemo, useRef, useState} from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, FormControlLabel,
  InputLabel, MenuItem, Radio, RadioGroup, Select, Stack, TextField, Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PeopleIcon from '@mui/icons-material/People';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {usePreviewRecipientsMutation, useSendAnnouncementMutation} from './api';
import {api as groupApi} from '../groups/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AnnouncementDialog({open, onClose}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('ALL');
  const [groupId, setGroupId] = useState('');
  const [externalEmailsText, setExternalEmailsText] = useState('');
  const [recipients, setRecipients] = useState(null);
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);
  const {data: groups = []} = groupApi.endpoints.getGroups.useQuery();
  const [previewRecipients, {isLoading: isPreviewing}] = usePreviewRecipientsMutation();
  const [sendAnnouncement, {isLoading: isSending}] = useSendAnnouncementMutation();

  const externalEmails = useMemo(() =>
    externalEmailsText.split('\n').map(l => l.trim()).filter(l => l.length > 0),
    [externalEmailsText]
  );
  const invalidEmails = externalEmails.filter(e => !EMAIL_RE.test(e));

  const isReady = subject && body
    && (recipientFilter !== 'GROUP' || groupId)
    && (recipientFilter !== 'EXTERNAL' || (externalEmails.length > 0 && invalidEmails.length === 0));

  const buildRequest = () => ({
    subject,
    body,
    recipientFilter,
    groupId: recipientFilter === 'GROUP' ? Number(groupId) : null,
    externalEmails: recipientFilter === 'EXTERNAL' ? externalEmails : null,
  });

  const handlePreview = async () => {
    setResult(null);
    const res = await previewRecipients(buildRequest());
    if (!res.error) setRecipients(res.data);
  };

  const handleSend = async () => {
    const res = await sendAnnouncement(buildRequest());
    if (res.error) {
      setResult({sent: 0, failed: -1, errors: [res.error?.data?.error ?? 'Unbekannter Fehler']});
    } else {
      setResult(res.data);
      setRecipients(null);
      setTimeout(handleClose, 2000);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setExternalEmailsText(prev => prev ? prev + '\n' + text.trim() : text.trim());
      setRecipients(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClose = () => {
    setSubject('');
    setBody('');
    setRecipientFilter('ALL');
    setGroupId('');
    setExternalEmailsText('');
    setRecipients(null);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Ankündigung senden</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{mt: 1}}>
          <TextField
            label="Betreff"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Nachricht (HTML möglich)"
            value={body}
            onChange={e => setBody(e.target.value)}
            fullWidth
            multiline
            rows={6}
            required
          />
          <FormControl>
            <Typography variant="subtitle2" gutterBottom>Empfänger</Typography>
            <RadioGroup value={recipientFilter} onChange={e => { setRecipientFilter(e.target.value); setRecipients(null); }}>
              <FormControlLabel value="ALL" control={<Radio/>} label="Alle aktiven Nutzer"/>
              <FormControlLabel value="GROUP" control={<Radio/>} label="Gruppe"/>
              <FormControlLabel value="EXTERNAL" control={<Radio/>} label="Externe E-Mail-Liste"/>
            </RadioGroup>
          </FormControl>

          {recipientFilter === 'GROUP' && (
            <FormControl fullWidth>
              <InputLabel>Gruppe</InputLabel>
              <Select value={groupId} onChange={e => setGroupId(e.target.value)} label="Gruppe">
                {groups.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}

          {recipientFilter === 'EXTERNAL' && (
            <>
              <TextField
                label="E-Mail-Adressen (eine pro Zeile)"
                value={externalEmailsText}
                onChange={e => { setExternalEmailsText(e.target.value); setRecipients(null); }}
                fullWidth
                multiline
                rows={5}
                placeholder="max@muster.de&#10;anna@beispiel.de"
                error={invalidEmails.length > 0}
                helperText={invalidEmails.length > 0
                  ? `Ungültige Adressen: ${invalidEmails.join(', ')}`
                  : externalEmails.length > 0 ? `${externalEmails.length} Adresse(n)` : ''}
              />
              <Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  style={{display: 'none'}}
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadFileIcon/>}
                  onClick={() => fileInputRef.current.click()}
                >
                  TXT-Datei laden
                </Button>
              </Box>
            </>
          )}

          <Box>
            <Button
              variant="outlined"
              startIcon={isPreviewing ? <CircularProgress size={16}/> : <PeopleIcon/>}
              onClick={handlePreview}
              disabled={isPreviewing || !isReady}
            >
              Empfänger anzeigen
            </Button>
          </Box>

          {recipients && (
            <Box>
              <Divider sx={{mb: 1}}/>
              <Typography variant="subtitle2" gutterBottom>
                {recipients.length} Empfänger
              </Typography>
              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                {recipients.map((r, i) => (
                  <Chip
                    key={r.id ?? i}
                    label={r.name ? `${r.name} <${r.email}>` : r.email}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {result && (
            <Alert severity={result.failed === -1 ? 'error' : result.failed === 0 ? 'success' : 'warning'}>
              {result.failed === -1
                ? `Fehler: ${result.errors?.join(', ')}`
                : `${result.sent} gesendet, ${result.failed} fehlgeschlagen.`}
              {result.failed >= 0 && result.errors?.length > 0 && <Box>{result.errors.join(', ')}</Box>}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Schließen</Button>
        <Button
          variant="contained"
          startIcon={isSending ? <CircularProgress size={16}/> : <SendIcon/>}
          onClick={handleSend}
          disabled={isSending || !isReady || !!result}
        >
          Senden
        </Button>
      </DialogActions>
    </Dialog>
  );
}
