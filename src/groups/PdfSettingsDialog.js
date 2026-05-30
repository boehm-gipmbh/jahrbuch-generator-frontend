import React, {useEffect, useState} from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, InputAdornment, TextField, Typography
} from '@mui/material';
import {api} from './api';
import {PassepartoutPicker} from '../pdf/PassepartoutPicker';

const DEFAULTS = {
  storyHeaderTitleSize: 22,
  storyHeaderSubtitleSize: 10,
  textTitleSize: 14,
  textDescriptionSize: 12,
  imageCaptionSize: 9,
  commentTopLevelSize: 13,
  commentReplySize: 11,
  passepartoutStyle: 'gold',
  pdfPassword: ''
};

const FONT_FIELDS = [
  {key: 'storyHeaderTitleSize', label: 'Story-Titel (Titelseite)'},
  {key: 'storyHeaderSubtitleSize', label: 'Story-Untertitel (Titelseite)'},
  {key: 'textTitleSize', label: 'Text-Titel'},
  {key: 'textDescriptionSize', label: 'Text-Beschreibung'},
  {key: 'imageCaptionSize', label: 'Bildunterschrift'},
  {key: 'commentTopLevelSize', label: 'Kommentar (Hauptebene)'},
  {key: 'commentReplySize', label: 'Kommentar (Antwort)'}
];

export const PdfSettingsDialog = ({groupId, onClose}) => {
  const {data: loaded, isLoading} = api.endpoints.getPdfConfig.useQuery({id: groupId});
  const [putPdfConfig, {isLoading: isSaving}] = api.endpoints.putPdfConfig.useMutation();
  const [form, setForm] = useState(DEFAULTS);

  useEffect(() => {
    if (loaded) {
      setForm({...DEFAULTS, ...loaded, pdfPassword: loaded.pdfPassword ?? ''});
    }
  }, [loaded]);

  const setField = (key, value) => setForm(prev => ({...prev, [key]: value}));

  const handleSave = () => {
    const settings = {
      ...form,
      pdfPassword: form.pdfPassword.trim() === '' ? null : form.pdfPassword.trim()
    };
    putPdfConfig({id: groupId, settings})
      .unwrap()
      .then(onClose)
      .catch(() => {});
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>PDF-Einstellungen</DialogTitle>
      <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
        {isLoading ? (
          <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="subtitle2" color="text.secondary">Schriftgrößen</Typography>
            <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
              {FONT_FIELDS.map(({key, label}) => (
                <TextField
                  key={key}
                  label={label}
                  type="number"
                  size="small"
                  value={form[key]}
                  onChange={e => setField(key, parseFloat(e.target.value) || 0)}
                  InputProps={{endAdornment: <InputAdornment position="end">pt</InputAdornment>}}
                  inputProps={{min: 6, max: 48, step: 0.5}}
                />
              ))}
            </Box>

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">Rahmen-Stil</Typography>
            <PassepartoutPicker
              value={form.passepartoutStyle}
              onChange={v => setField('passepartoutStyle', v)}
            />

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">Passwortschutz</Typography>
            <TextField
              label="PDF-Passwort (leer = kein Schutz)"
              type="password"
              size="small"
              value={form.pdfPassword}
              onChange={e => setField('pdfPassword', e.target.value)}
              autoComplete="new-password"
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isLoading || isSaving}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
};
