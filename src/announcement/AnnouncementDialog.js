import React, {useMemo, useRef, useState} from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, FormControlLabel,
  InputLabel, MenuItem, Radio, RadioGroup, Select, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PeopleIcon from '@mui/icons-material/People';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import {useGetAnnouncementHistoryQuery, usePreviewRecipientsMutation, useSendAnnouncementMutation} from './api';
import {api as groupApi} from '../groups/api';
import {PdfExportDialog} from '../pdf/PdfExportDialog';
import SettingsIcon from '@mui/icons-material/Settings';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AnnouncementDialog({open, onClose}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('ALL');
  const [groupId, setGroupId] = useState('');
  const [externalEmailsText, setExternalEmailsText] = useState('');
  const [recipients, setRecipients] = useState(null);
  const [result, setResult] = useState(null);

  const [attachmentMode, setAttachmentMode] = useState('NONE');
  const [attachmentFile, setAttachmentFile] = useState(null);   // {filename, content (base64)}
  const [attachmentGroupId, setAttachmentGroupId] = useState('');
  const [pdfOptions, setPdfOptions] = useState(null);
  const [pdfConfigOpen, setPdfConfigOpen] = useState(false);

  const emailFileInputRef = useRef(null);
  const attachmentFileInputRef = useRef(null);
  const {data: groups = []} = groupApi.endpoints.getGroups.useQuery();
  const {data: history = []} = useGetAnnouncementHistoryQuery();
  const [previewRecipients, {isLoading: isPreviewing}] = usePreviewRecipientsMutation();
  const [sendAnnouncement, {isLoading: isSending}] = useSendAnnouncementMutation();

  const externalEmails = useMemo(() =>
    externalEmailsText.split('\n').map(l => l.trim()).filter(l => l.length > 0),
    [externalEmailsText]
  );
  const invalidEmails = externalEmails.filter(e => !EMAIL_RE.test(e));

  const isReady = subject && body
    && (recipientFilter !== 'GROUP' || groupId)
    && (recipientFilter !== 'EXTERNAL' || (externalEmails.length > 0 && invalidEmails.length === 0))
    && (attachmentMode !== 'FILE' || attachmentFile != null)
    && (attachmentMode !== 'GROUP_PDF' || attachmentGroupId);

  const buildRequest = () => ({
    subject,
    body,
    recipientFilter,
    groupId: recipientFilter === 'GROUP' ? Number(groupId) : null,
    externalEmails: recipientFilter === 'EXTERNAL' ? externalEmails : null,
    attachmentFilename: attachmentMode === 'FILE' ? attachmentFile?.filename : null,
    attachmentContent: attachmentMode === 'FILE' ? attachmentFile?.content : null,
    attachmentGroupId: attachmentMode === 'GROUP_PDF' ? Number(attachmentGroupId) : null,
    pdfOptions: attachmentMode === 'GROUP_PDF' ? pdfOptions : null,
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
    }
  };

  const handleEmailFileUpload = (e) => {
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

  const handleAttachmentFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1];
      setAttachmentFile({filename: file.name, content: base64});
    };
    reader.readAsDataURL(file);
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
    setAttachmentMode('NONE');
    setAttachmentFile(null);
    setAttachmentGroupId('');
    setPdfOptions(null);
    setPdfConfigOpen(false);
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
                  ref={emailFileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  style={{display: 'none'}}
                  onChange={handleEmailFileUpload}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadFileIcon/>}
                  onClick={() => emailFileInputRef.current.click()}
                >
                  TXT-Datei laden
                </Button>
              </Box>
            </>
          )}

          <Divider/>

          <FormControl>
            <Typography variant="subtitle2" gutterBottom>Anhang (optional)</Typography>
            <RadioGroup value={attachmentMode} onChange={e => { setAttachmentMode(e.target.value); setAttachmentFile(null); setAttachmentGroupId(''); }}>
              <FormControlLabel value="NONE" control={<Radio/>} label="Kein Anhang"/>
              <FormControlLabel value="FILE" control={<Radio/>} label="Datei hochladen"/>
              <FormControlLabel value="GROUP_PDF" control={<Radio/>} label="Gruppen-PDF generieren"/>
            </RadioGroup>
          </FormControl>

          {attachmentMode === 'FILE' && (
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
              <input
                ref={attachmentFileInputRef}
                type="file"
                style={{display: 'none'}}
                onChange={handleAttachmentFileUpload}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<AttachFileIcon/>}
                onClick={() => attachmentFileInputRef.current.click()}
              >
                Datei auswählen
              </Button>
              {attachmentFile && (
                <Typography variant="body2" color="text.secondary">{attachmentFile.filename}</Typography>
              )}
            </Box>
          )}

          {attachmentMode === 'GROUP_PDF' && (
            <Stack spacing={1}>
              <FormControl fullWidth>
                <InputLabel>Gruppe für PDF</InputLabel>
                <Select
                  value={attachmentGroupId}
                  onChange={e => { setAttachmentGroupId(e.target.value); setPdfOptions(null); }}
                  label="Gruppe für PDF"
                >
                  {groups.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                </Select>
              </FormControl>
              {attachmentGroupId && (
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SettingsIcon/>}
                    onClick={() => setPdfConfigOpen(true)}
                  >
                    PDF konfigurieren…
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {pdfOptions
                      ? `${pdfOptions.storyIds?.length ?? '?'} Stories${pdfOptions.coverPage ? ' · Deckblatt' : ''}`
                      : 'optional – Standard-Einstellungen werden verwendet'}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}

          {pdfConfigOpen && attachmentGroupId && (
            <PdfExportDialog
              gruppe={groups.find(g => g.id === Number(attachmentGroupId)) ?? {id: Number(attachmentGroupId), name: ''}}
              onClose={() => setPdfConfigOpen(false)}
              onOptionsSelected={(opts) => { setPdfOptions(opts); setPdfConfigOpen(false); }}
            />
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
                : <>{result.sent} gesendet, {result.failed} fehlgeschlagen. <a href="https://resend.com/emails" target="_blank" rel="noreferrer">Zustellstatus im Resend-Dashboard</a></>}
              {result.failed >= 0 && result.errors?.length > 0 && <Box>{result.errors.join(', ')}</Box>}
            </Alert>
          )}

          {history.length > 0 && (
            <>
              <Divider/>
              <Typography variant="subtitle2">Verlauf</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Datum</TableCell>
                    <TableCell>Betreff</TableCell>
                    <TableCell>Empfänger</TableCell>
                    <TableCell align="right">Gesendet</TableCell>
                    <TableCell>Anhang</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map(h => (
                    <TableRow key={h.id}>
                      <TableCell sx={{whiteSpace: 'nowrap'}}>
                        {new Date(h.sentAt).toLocaleString('de-DE', {dateStyle: 'short', timeStyle: 'short'})}
                      </TableCell>
                      <TableCell>{h.subject}</TableCell>
                      <TableCell>{h.recipientDescription}</TableCell>
                      <TableCell align="right">
                        {h.sentCount}
                        {h.failedCount > 0 && <Typography component="span" color="warning.main"> ({h.failedCount} ✗)</Typography>}
                      </TableCell>
                      <TableCell>{h.attachmentFilename ?? '–'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
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
