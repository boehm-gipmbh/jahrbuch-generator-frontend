import React, {useState} from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, FormControlLabel,
  InputLabel, MenuItem, Radio, RadioGroup, Select, Stack, TextField, Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PeopleIcon from '@mui/icons-material/People';
import {usePreviewRecipientsMutation, useSendAnnouncementMutation} from './api';
import {api as groupApi} from '../groups/api';

export default function AnnouncementDialog({open, onClose}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('ALL');
  const [groupId, setGroupId] = useState('');
  const [recipients, setRecipients] = useState(null);
  const [result, setResult] = useState(null);

  const {data: groups = []} = groupApi.endpoints.getGroups.useQuery();
  const [previewRecipients, {isLoading: isPreviewing}] = usePreviewRecipientsMutation();
  const [sendAnnouncement, {isLoading: isSending}] = useSendAnnouncementMutation();

  const buildRequest = () => ({
    subject,
    body,
    recipientFilter,
    groupId: recipientFilter === 'GROUP' ? Number(groupId) : null,
  });

  const handlePreview = async () => {
    setResult(null);
    const res = await previewRecipients(buildRequest());
    if (!res.error) setRecipients(res.data);
  };

  const handleSend = async () => {
    const res = await sendAnnouncement(buildRequest());
    if (!res.error) {
      setResult(res.data);
      setRecipients(null);
    }
  };

  const handleClose = () => {
    setSubject('');
    setBody('');
    setRecipientFilter('ALL');
    setGroupId('');
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

          <Box>
            <Button
              variant="outlined"
              startIcon={isPreviewing ? <CircularProgress size={16}/> : <PeopleIcon/>}
              onClick={handlePreview}
              disabled={isPreviewing || !subject || !body || (recipientFilter === 'GROUP' && !groupId)}
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
                {recipients.map(r => (
                  <Chip key={r.id} label={`${r.name} <${r.email}>`} size="small" variant="outlined"/>
                ))}
              </Box>
            </Box>
          )}

          {result && (
            <Alert severity={result.failed === 0 ? 'success' : 'warning'}>
              {result.sent} gesendet, {result.failed} fehlgeschlagen.
              {result.errors?.length > 0 && <Box>{result.errors.join(', ')}</Box>}
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
          disabled={isSending || !subject || !body || (recipientFilter === 'GROUP' && !groupId) || !!result}
        >
          Senden
        </Button>
      </DialogActions>
    </Dialog>
  );
}
