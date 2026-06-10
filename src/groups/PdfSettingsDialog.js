import React, {useEffect, useState} from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, InputAdornment, TextField, ToggleButton,
  ToggleButtonGroup, Typography
} from '@mui/material';
import {api} from './api';
import {api as bilderApi} from '../bilder/api';
import {PassepartoutPicker} from '../pdf/PassepartoutPicker';
import {BackgroundImagePicker} from '../pdf/BackgroundImagePicker';

const DEFAULTS = {
  storyHeaderTitleSize: 22,
  storyHeaderSubtitleSize: 10,
  textTitleSize: 14,
  textDescriptionSize: 12,
  imageCaptionSize: 9,
  commentTopLevelSize: 13,
  commentReplySize: 11,
  passepartoutStyle: 'gold',
  pdfPassword: '',
  coverFrontBackground: null,
  coverBackBackground: null,
  tocBackground: null,
  coverTitlePosition: 'middle',
  coverTitleColor: '#000000'
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

const enrichBackground = (bg, bilder) => {
  if (!bg || !bg.bildId) return bg;
  const bild = bilder.find(b => b.id === bg.bildId);
  const enriched = {...bg, zoom: bg.zoom || 1};
  return bild ? {...enriched, pfad: bild.pfad} : enriched;
};

const stripBackground = (bg) => {
  if (!bg) return null;
  const {pfad, ...rest} = bg;
  return rest;
};

export const PdfSettingsDialog = ({groupId, onClose}) => {
  const {data: loaded, isLoading} = api.endpoints.getPdfConfig.useQuery({id: groupId});
  const {data: bilder = []} = bilderApi.endpoints.getBilderByGroup.useQuery(groupId);
  const [putPdfConfig, {isLoading: isSaving}] = api.endpoints.putPdfConfig.useMutation();
  const [form, setForm] = useState(DEFAULTS);

  useEffect(() => {
    if (loaded && bilder.length >= 0) {
      setForm({
        ...DEFAULTS,
        ...loaded,
        pdfPassword: loaded.pdfPassword ?? '',
        coverFrontBackground: enrichBackground(loaded.coverFrontBackground, bilder),
        coverBackBackground: enrichBackground(loaded.coverBackBackground, bilder),
        tocBackground: enrichBackground(loaded.tocBackground, bilder),
      });
    }
  }, [loaded, bilder]);

  const setField = (key, value) => setForm(prev => ({...prev, [key]: value}));

  const handleSave = () => {
    const settings = {
      ...form,
      pdfPassword: form.pdfPassword.trim() === '' ? null : form.pdfPassword.trim(),
      coverFrontBackground: stripBackground(form.coverFrontBackground),
      coverBackBackground: stripBackground(form.coverBackBackground),
      tocBackground: stripBackground(form.tocBackground),
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

            <Typography variant="subtitle2" color="text.secondary">Hintergrundbilder</Typography>
            <BackgroundImagePicker
              label="Vorderdeckel"
              value={form.coverFrontBackground}
              onChange={v => setField('coverFrontBackground', v)}
              bilder={bilder}
            />
            <BackgroundImagePicker
              label="Inhaltsverzeichnis"
              value={form.tocBackground}
              onChange={v => setField('tocBackground', v)}
              bilder={bilder}
            />
            <BackgroundImagePicker
              label="Rückdeckel"
              value={form.coverBackBackground}
              onChange={v => setField('coverBackBackground', v)}
              bilder={bilder}
            />

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">Titel auf Deckblatt</Typography>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={form.coverTitlePosition}
                onChange={(_, v) => v && setField('coverTitlePosition', v)}
              >
                <ToggleButton value="top">Oben</ToggleButton>
                <ToggleButton value="middle">Mitte</ToggleButton>
                <ToggleButton value="bottom">Unten</ToggleButton>
              </ToggleButtonGroup>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Typography variant="body2" color="text.secondary">Farbe</Typography>
                <input
                  type="color"
                  value={form.coverTitleColor}
                  onChange={e => setField('coverTitleColor', e.target.value)}
                  style={{width: 40, height: 32, border: 'none', cursor: 'pointer', padding: 0}}
                />
              </Box>
            </Box>

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
