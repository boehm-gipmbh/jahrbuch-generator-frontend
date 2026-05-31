import React, {useState} from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, ImageList, ImageListItem, Slider, Tooltip, Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import AuthImage from '../bilder/AuthImage';

const externUrl = (pfad) => pfad?.startsWith('/') ? `/api/bilder/extern${pfad}` : pfad;

const Preview = ({pfad, opacity, tint, offsetX = 0, offsetY = 0, zoom = 1}) => {
  if (!pfad) return null;
  const posX = `${(offsetX + 1) / 2 * 100}%`;
  const posY = `${(1 - offsetY) / 2 * 100}%`;
  return (
    <Box sx={{position: 'relative', width: 120, height: 90, flexShrink: 0, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider'}}>
      <AuthImage
        src={externUrl(pfad)}
        thumb
        alt=""
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: `${posX} ${posY}`,
          opacity,
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          transformOrigin: `${posX} ${posY}`,
        }}
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

export const BackgroundImagePicker = ({label, value, onChange, bilder = []}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const bildId = value?.bildId ?? null;
  const pfad = value?.pfad ?? null;
  const opacity = value?.opacity ?? 0.15;
  const tint = value?.tint ?? null;
  const offsetX = value?.offsetX ?? 0;
  const offsetY = value?.offsetY ?? 0;
  const zoom = value?.zoom ?? 1;

  const update = (patch) => onChange(value ? {...value, ...patch} : {bildId: null, pfad: null, opacity: 0.15, tint: null, offsetX: 0, offsetY: 0, zoom: 1, ...patch});

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
      {label && <Typography variant="body2" color="text.secondary">{label}</Typography>}
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
        <Preview pfad={pfad} opacity={opacity} tint={tint} offsetX={offsetX} offsetY={offsetY} zoom={zoom} />
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
                  min={1} max={3} step={0.1}
                  value={zoom}
                  onChange={(_, v) => update({zoom: v})}
                  sx={{flex: 1}}
                />
                <Typography variant="caption" sx={{minWidth: 32, textAlign: 'right'}}>
                  {zoom.toFixed(1)}×
                </Typography>
              </Box>
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
          onSelect={b => update({bildId: b.id, pfad: b.pfad})}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Box>
  );
};
