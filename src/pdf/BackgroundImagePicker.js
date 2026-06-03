import React, {useEffect, useState} from 'react';
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, ImageList, ImageListItem, Slider, TextField, Tooltip, Typography
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteIcon from '@mui/icons-material/Delete';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import AuthImage from '../bilder/AuthImage';
import {triggerOutpaint, deleteOutpaint, captionBild} from './api';

const externUrl = (pfad) => pfad?.startsWith('/') ? `/api/bilder/extern${pfad}` : pfad;

const PREVIEW_W = 85;
const PREVIEW_H = 120;

const Preview = ({pfad, opacity, tint, offsetX = 0, offsetY = 0, zoom = 1, onDims}) => {
  const [imgData, setImgData] = useState(null); // {blobUrl, w, h}

  useEffect(() => {
    setImgData(null);
    onDims?.(null);
    if (!pfad) return;
    let cancelled = false;
    let objUrl = null;
    const jwt = sessionStorage.getItem('jwt');
    const url = `${externUrl(pfad)}?thumb=true`;
    fetch(url, {headers: {Authorization: `Bearer ${jwt}`}, cache: 'no-store'})
      .then(r => r.blob())
      .then(blob => {
        if (cancelled) return;
        objUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          if (!cancelled) {
            setImgData({blobUrl: objUrl, w: img.naturalWidth, h: img.naturalHeight});
            onDims?.({w: img.naturalWidth, h: img.naturalHeight});
          }
        };
        img.src = objUrl;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [pfad]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pfad) return <Box sx={{width: PREVIEW_W, height: PREVIEW_H, flexShrink: 0}} />;
  if (!imgData) return <Box sx={{width: PREVIEW_W, height: PREVIEW_H, flexShrink: 0, borderRadius: 1, border: '1px solid', borderColor: 'divider'}} />;

  const scale = Math.max(PREVIEW_W / imgData.w, PREVIEW_H / imgData.h) * zoom;
  const drawW = imgData.w * scale;
  const drawH = imgData.h * scale;
  const x = (PREVIEW_W - drawW) / 2 * (1 + offsetX);
  const y = (PREVIEW_H - drawH) / 2 * (1 - offsetY);

  return (
    <Box sx={{position: 'relative', width: PREVIEW_W, height: PREVIEW_H, flexShrink: 0, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider'}}>
      <img
        src={imgData.blobUrl}
        alt=""
        style={{position: 'absolute', left: x, top: y, width: drawW, height: drawH, opacity}}
      />
      {tint && (
        <Box sx={{position: 'absolute', inset: 0, backgroundColor: tint, opacity: 0.3}} />
      )}
    </Box>
  );
};

const BildPickerDialog = ({bilder, onSelect, onClose}) => (
  <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Hintergrundbild wählen</DialogTitle>
    <DialogContent>
      {bilder.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Keine Bilder vorhanden.</Typography>
      ) : (
        <ImageList cols={4} gap={8}>
          {bilder.map(b => (
            <ImageListItem
              key={b.id}
              onClick={() => { onSelect(b); onClose(); }}
              sx={{cursor: 'pointer', borderRadius: 1, overflow: 'hidden',
                '&:hover': {outline: '2px solid', outlineColor: 'primary.main'}}}
            >
              <AuthImage
                src={externUrl(b.pfad)}
                thumb
                alt={b.title || ''}
                style={{width: '100%', aspectRatio: '1', objectFit: 'cover'}}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Abbrechen</Button>
    </DialogActions>
  </Dialog>
);

export const BackgroundImagePicker = ({label, value, onChange, bilder = [], outpaintEnabled = true}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [outpainting, setOutpainting] = useState(false);
  const [outpaintError, setOutpaintError] = useState(null);
  const [captionMode, setCaptionMode] = useState(false);
  const [captioning, setCaptioning] = useState(false);
  const bildId = value?.bildId ?? null;
  const pfad = value?.pfad ?? null;
  const opacity = value?.opacity ?? 0.15;
  const tint = value?.tint ?? null;
  const offsetX = value?.offsetX ?? 0;
  const offsetY = value?.offsetY ?? 0;
  const zoom = value?.zoom || 1;
  const outpaintedPfad = value?.outpaintedPfad ?? null;
  const bildCaption = bilder.find(b => b.id === bildId)?.caption ?? '';

  const [outpaintPrompt, setOutpaintPrompt] = useState(bildCaption);

  const [origDims, setOrigDims] = useState(null); // {w, h} des Originalbilds
  const isLandscape = origDims ? origDims.w > origDims.h : false;

  // Prompt auf Bild-Caption zurücksetzen wenn anderes Bild gewählt wird (Story-Navigation)
  useEffect(() => { setOutpaintPrompt(bildCaption); setCaptionMode(!!bildCaption); }, [bildId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lokaler State für sofortige Preview-Aktualisierung, unabhängig vom Parent-Prop-Cycle
  const [previewOutpaintedPfad, setPreviewOutpaintedPfad] = useState(outpaintedPfad);
  useEffect(() => { setPreviewOutpaintedPfad(outpaintedPfad); }, [outpaintedPfad]);

  useEffect(() => {
    if (!pfad || !previewOutpaintedPfad) return; // Preview liefert dims via onDims wenn kein outpainted
    let cancelled = false;
    const jwt = sessionStorage.getItem('jwt');
    fetch(`/api/bilder/extern${pfad}?thumb=true`, {headers: {Authorization: `Bearer ${jwt}`}, cache: 'no-store'})
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { if (!cancelled) { setOrigDims({w: img.naturalWidth, h: img.naturalHeight}); URL.revokeObjectURL(url); } };
        img.src = url;
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pfad, previewOutpaintedPfad]);

  const update = (patch) => onChange(value ? {...value, ...patch} : {bildId: null, pfad: null, opacity: 0.15, tint: null, offsetX: 0, offsetY: 0, zoom: 1, outpaintedPfad: null, ...patch});

  const handleOutpaint = async () => {
    setOutpainting(true);
    setOutpaintError(null);
    try {
      const jwt = sessionStorage.getItem('jwt');
      const result = await triggerOutpaint(jwt, bildId, outpaintPrompt.trim() || null);
      setPreviewOutpaintedPfad(result.outpaintedPfad); // sofort sichtbar
      update({outpaintedPfad: result.outpaintedPfad, zoom: 1, offsetX: 0, offsetY: 0});
    } catch (e) {
      setOutpaintError(e.message);
    } finally {
      setOutpainting(false);
    }
  };

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
      {label && <Typography variant="body2" color="text.secondary">{label}</Typography>}
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
        <Preview pfad={previewOutpaintedPfad ?? pfad} opacity={opacity} tint={tint} offsetX={offsetX} offsetY={offsetY} zoom={zoom} onDims={!previewOutpaintedPfad ? setOrigDims : undefined} />
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1}}>
          <Box sx={{display: 'flex', gap: 0.5}}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<WallpaperIcon />}
              onClick={() => setPickerOpen(true)}
              disabled={bilder.length === 0}
            >
              {bildId ? 'Ändern' : 'Wählen'}
            </Button>
            {bildId && (
              <Tooltip title="Hintergrundbild entfernen">
                <IconButton size="small" onClick={() => onChange(null)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {bildId && (
            <>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Typography variant="caption" sx={{minWidth: 60}}>Deckkraft</Typography>
                <Slider
                  size="small"
                  min={0.05} max={1} step={0.05}
                  value={opacity}
                  onChange={(_, v) => update({opacity: v})}
                  sx={{flex: 1}}
                />
                <Typography variant="caption" sx={{minWidth: 32, textAlign: 'right'}}>
                  {Math.round(opacity * 100)}%
                </Typography>
              </Box>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Typography variant="caption" sx={{minWidth: 60}}>Links/Rechts</Typography>
                <Slider
                  size="small"
                  min={-1} max={1} step={0.05}
                  value={offsetX}
                  onChange={(_, v) => update({offsetX: v})}
                  sx={{flex: 1}}
                />
              </Box>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Typography variant="caption" sx={{minWidth: 60}}>Oben/Unten</Typography>
                <Slider
                  size="small"
                  min={-1} max={1} step={0.05}
                  value={offsetY}
                  onChange={(_, v) => update({offsetY: v})}
                  sx={{flex: 1}}
                />
              </Box>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Typography variant="caption" sx={{minWidth: 60}}>Zoom</Typography>
                <Slider
                  size="small"
                  min={isLandscape ? 0.1 : 1} max={3} step={0.05}
                  value={zoom}
                  onChange={(_, v) => update({zoom: v})}
                  sx={{flex: 1}}
                />
                <Typography variant="caption" sx={{minWidth: 32, textAlign: 'right'}}>
                  {zoom.toFixed(2)}×
                </Typography>
              </Box>
              {outpaintEnabled && isLandscape && (
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
                  <FormControlLabel
                    control={<Checkbox size="small" checked={captionMode} onChange={e => { setCaptionMode(e.target.checked); setOutpaintPrompt(''); }} disabled={outpainting || captioning} />}
                    label={<Typography variant="caption">KI-Beschreibung zuerst</Typography>}
                    sx={{m: 0}}
                  />
                  {!captionMode && (
                    <Button
                      size="small"
                      variant={previewOutpaintedPfad ? 'contained' : 'outlined'}
                      color={previewOutpaintedPfad ? 'success' : 'primary'}
                      startIcon={outpainting ? <CircularProgress size={14} /> : <AutoFixHighIcon />}
                      onClick={handleOutpaint}
                      disabled={outpainting}
                    >
                      {outpainting ? 'KI läuft…' : previewOutpaintedPfad ? 'KI: fertig ✓' : 'KI Outpainting'}
                    </Button>
                  )}
                  </Box>
                  {captionMode && (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
                      <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-start'}}>
                        <TextField
                          size="small"
                          multiline
                          minRows={2}
                          placeholder="Hier erscheint die KI-Beschreibung…"
                          value={outpaintPrompt}
                          onChange={e => setOutpaintPrompt(e.target.value)}
                          disabled={outpainting || captioning}
                          sx={{flex: 1}}
                          inputProps={{maxLength: 400}}
                        />
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
                          <Button size="small" variant="outlined"
                            onClick={async () => {
                              setCaptioning(true);
                              setOutpaintError(null);
                              try {
                                const jwt = sessionStorage.getItem('jwt');
                                const res = await captionBild(jwt, bildId);
                                setOutpaintPrompt(res.caption || '');
                              } catch(e) { setOutpaintError(e.message); }
                              finally { setCaptioning(false); }
                            }}
                            disabled={captioning || outpainting}
                            startIcon={captioning ? <CircularProgress size={12}/> : null}
                          >
                            {captioning ? 'läuft…' : 'Beschreiben'}
                          </Button>
                          <Button size="small"
                            variant={previewOutpaintedPfad ? 'contained' : 'outlined'}
                            color={previewOutpaintedPfad ? 'success' : 'primary'}
                            startIcon={outpainting ? <CircularProgress size={12}/> : <AutoFixHighIcon/>}
                            onClick={handleOutpaint}
                            disabled={outpainting || !outpaintPrompt.trim()}
                          >
                            {outpainting ? 'KI läuft…' : previewOutpaintedPfad ? 'fertig ✓' : 'Outpainting'}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  {previewOutpaintedPfad && (
                    <Button size="small" sx={{minWidth: 0, px: 0.5}} onClick={() => {
                      const jwt = sessionStorage.getItem('jwt');
                      deleteOutpaint(jwt, bildId).catch(() => {});
                      setPreviewOutpaintedPfad(null);
                      update({outpaintedPfad: null});
                    }}>
                      <Typography variant="caption">entfernen</Typography>
                    </Button>
                  )}
                  {outpaintError && (
                    <Typography variant="caption" color="error">{outpaintError}</Typography>
                  )}
                </Box>
              )}
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Typography variant="caption" sx={{minWidth: 60}}>Farbton</Typography>
                <input
                  type="color"
                  value={tint ?? '#ffffff'}
                  onChange={e => update({tint: e.target.value})}
                  style={{width: 36, height: 24, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 4}}
                />
                {tint && (
                  <Button size="small" sx={{minWidth: 0, px: 0.5}} onClick={() => update({tint: null})}>
                    <Typography variant="caption">entfernen</Typography>
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
      {pickerOpen && (
        <BildPickerDialog
          bilder={bilder}
          onSelect={b => { setPreviewOutpaintedPfad(null); update({bildId: b.id, pfad: b.pfad, outpaintedPfad: null}); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Box>
  );
};
