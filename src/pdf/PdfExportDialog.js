import React, {useEffect, useState} from 'react';
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, IconButton, InputAdornment, List, ListItem,
  Switch, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useSelector} from 'react-redux';
import {api as storyApi} from '../stories';
import {api as storyAdminApi} from '../stories/api';
import {api as groupsApi} from '../groups/api';
import {api as bilderApi} from '../bilder/api';
import {PassepartoutPicker} from './PassepartoutPicker';
import {BackgroundImagePicker} from './BackgroundImagePicker';

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

const SETTINGS_DEFAULTS = {
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
  tocEnabled: true,
  tocTitle: 'Inhaltsverzeichnis',
  tocTitleSize: 24,
  tocEntrySize: 13,
  tocShowPageNumbers: true,
  tocColumns: 1,
  coverTitlePosition: 'middle',
  coverTitleColor: '#000000',
  tocColor: '#000000',
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

const SortableStoryItem = ({story, checked, onToggle}) => {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: story.id});
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem ref={setNodeRef} style={style} dense disablePadding
      sx={{display: 'flex', alignItems: 'center'}}
    >
      <IconButton size="small" {...attributes} {...listeners}
        sx={{cursor: isDragging ? 'grabbing' : 'grab', color: 'text.disabled', mr: 0.5}}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      <FormControlLabel
        control={<Checkbox checked={checked} onChange={() => onToggle(story.id)} size="small" />}
        label={<Typography variant="body2">{story.name}</Typography>}
        sx={{flexGrow: 1, m: 0}}
      />
    </ListItem>
  );
};

export const PdfExportDialog = ({gruppe, onClose, onOptionsSelected, isGroupAdmin = false}) => {
  const {data: userStories = []} = storyApi.endpoints.getStories.useQuery(undefined, {skip: !!onOptionsSelected});
  const {data: groupStories = []} = storyAdminApi.endpoints.getStoriesByGroup.useQuery(gruppe?.id, {skip: !onOptionsSelected || !gruppe?.id});
  const allStories = onOptionsSelected ? groupStories : userStories;
  const jwt = useSelector(state => state.auth.jwt);

  const {data: loadedSettings, isLoading: isSettingsLoading} = groupsApi.endpoints.getPdfConfig.useQuery(
    {id: gruppe?.id},
    {skip: !isGroupAdmin || !gruppe?.id}
  );
  const [putPdfConfig, {isLoading: isSaving}] = groupsApi.endpoints.putPdfConfig.useMutation();
  const {data: groupBilder = []} = bilderApi.endpoints.getBilderByGroup.useQuery(
    gruppe?.id,
    {skip: !isGroupAdmin || !gruppe?.id}
  );

  const [activeTab, setActiveTab] = useState(0);
  const [settingsForm, setSettingsForm] = useState(SETTINGS_DEFAULTS);

  const [orderedStories, setOrderedStories] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [initialized, setInitialized] = useState(false);
  const [includePendingBilder, setIncludePendingBilder] = useState(false);
  const [includePendingTexte, setIncludePendingTexte] = useState(false);
  const [coverPage, setCoverPage] = useState(true);
  const [coverTitle, setCoverTitle] = useState(gruppe.name);
  const [pageNumbers, setPageNumbers] = useState(true);
  const [includeReactions, setIncludeReactions] = useState(true);
  const [includeComments, setIncludeComments] = useState(true);
  const [commentDepth, setCommentDepth] = useState(1);
  const [commentMaxPerItem, setCommentMaxPerItem] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!initialized && allStories.length > 0) {
      setOrderedStories(allStories);
      setCheckedIds(new Set(allStories.map(s => s.id)));
      setInitialized(true);
    }
  }, [allStories, initialized]);

  useEffect(() => {
    if (loadedSettings) {
      setSettingsForm({
        ...SETTINGS_DEFAULTS,
        ...loadedSettings,
        pdfPassword: loadedSettings.pdfPassword ?? '',
        coverFrontBackground: enrichBackground(loadedSettings.coverFrontBackground, groupBilder),
        coverBackBackground: enrichBackground(loadedSettings.coverBackBackground, groupBilder),
        tocBackground: enrichBackground(loadedSettings.tocBackground, groupBilder),
        tocEnabled: loadedSettings.tocEnabled ?? SETTINGS_DEFAULTS.tocEnabled,
        tocTitle: loadedSettings.tocTitle ?? SETTINGS_DEFAULTS.tocTitle,
        tocTitleSize: loadedSettings.tocTitleSize ?? SETTINGS_DEFAULTS.tocTitleSize,
        tocEntrySize: loadedSettings.tocEntrySize ?? SETTINGS_DEFAULTS.tocEntrySize,
        tocShowPageNumbers: loadedSettings.tocShowPageNumbers ?? SETTINGS_DEFAULTS.tocShowPageNumbers,
        tocColumns: loadedSettings.tocColumns ?? SETTINGS_DEFAULTS.tocColumns,
      });
    }
  }, [loadedSettings, groupBilder]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
  );

  const handleDragEnd = ({active, over}) => {
    if (active.id !== over?.id) {
      setOrderedStories(prev => {
        const oldIdx = prev.findIndex(s => s.id === active.id);
        const newIdx = prev.findIndex(s => s.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const toggleStory = (id) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setSettingsField = (key, value) => setSettingsForm(prev => ({...prev, [key]: value}));

  const handleSaveSettings = () => {
    const settings = {
      ...settingsForm,
      pdfPassword: settingsForm.pdfPassword.trim() === '' ? null : settingsForm.pdfPassword.trim(),
      coverFrontBackground: stripBackground(settingsForm.coverFrontBackground),
      coverBackBackground: stripBackground(settingsForm.coverBackBackground),
      tocBackground: stripBackground(settingsForm.tocBackground),
    };
    putPdfConfig({id: gruppe.id, settings})
      .unwrap()
      .then(() => setActiveTab(0))
      .catch(() => {});
  };

  const handleGenerate = async () => {
    const storyIds = orderedStories.filter(s => checkedIds.has(s.id)).map(s => s.id);
    const options = {
      storyIds,
      includePendingBilder,
      includePendingTexte,
      coverPage,
      coverTitle: coverPage ? coverTitle : null,
      pageNumbers,
      includeReactions,
      includeComments,
      commentDepth,
      commentMaxPerItem
    };

    if (onOptionsSelected) {
      onOptionsSelected(options);
      onClose();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/pdf/${gruppe.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      if (!res.ok) {
        setError(`Fehler ${res.status}: PDF-Generierung fehlgeschlagen.`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jahrbuch-${gruppe.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      setError('Fehler bei der Verbindung zum Server.');
    } finally {
      setLoading(false);
    }
  };

  const noneSelected = checkedIds.size === 0 && !includePendingBilder && !includePendingTexte;
  const onSettingsTab = isGroupAdmin && activeTab === 1;

  return (
    <Dialog open onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{pb: isGroupAdmin ? 0 : undefined}}>
        Jahrbuch exportieren
        {isGroupAdmin && (
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{mt: 1}}>
            <Tab label="Inhalt" />
            <Tab label="Einstellungen" />
          </Tabs>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {!onSettingsTab ? (
          <>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Stories
            </Typography>
            {!initialized ? (
              <Box sx={{display: 'flex', justifyContent: 'center', py: 2}}>
                <CircularProgress size={24} />
              </Box>
            ) : orderedStories.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Keine Stories vorhanden.</Typography>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={orderedStories.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <List dense disablePadding>
                    {orderedStories.map(story => (
                      <SortableStoryItem
                        key={story.id}
                        story={story}
                        checked={checkedIds.has(story.id)}
                        onToggle={toggleStory}
                      />
                    ))}
                  </List>
                </SortableContext>
              </DndContext>
            )}

            <Divider sx={{my: 2}} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Optionen
            </Typography>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
              <FormControlLabel
                control={<Switch checked={includePendingBilder} onChange={e => setIncludePendingBilder(e.target.checked)} size="small" />}
                label="Bilder ohne Story einschließen"
              />
              <FormControlLabel
                control={<Switch checked={includePendingTexte} onChange={e => setIncludePendingTexte(e.target.checked)} size="small" />}
                label="Texte ohne Story einschließen"
              />
              <FormControlLabel
                control={<Switch checked={coverPage} onChange={e => setCoverPage(e.target.checked)} size="small" />}
                label="Deckblatt"
              />
              {coverPage && (
                <TextField
                  size="small"
                  label="Deckblatt-Titel"
                  value={coverTitle}
                  onChange={e => setCoverTitle(e.target.value)}
                  sx={{ml: 4, mt: 0.5, maxWidth: 320}}
                />
              )}
              <FormControlLabel
                control={<Switch checked={pageNumbers} onChange={e => setPageNumbers(e.target.checked)} size="small" />}
                label="Seitenzahlen"
              />
              <Divider sx={{my: 1}}/>
              <FormControlLabel
                control={<Switch checked={includeReactions} onChange={e => setIncludeReactions(e.target.checked)} size="small"/>}
                label="Reaktionen (♥ Likes, ★ Votes)"
              />
              <FormControlLabel
                control={<Switch checked={includeComments} onChange={e => setIncludeComments(e.target.checked)} size="small"/>}
                label="Kommentare"
              />
              {includeComments && (
                <Box sx={{ml: 4, display: 'flex', flexDirection: 'column', gap: 0.5}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Typography variant="body2" sx={{minWidth: 48}}>Tiefe</Typography>
                    <ToggleButtonGroup
                      value={commentDepth}
                      exclusive
                      onChange={(_, v) => v && setCommentDepth(v)}
                      size="small"
                    >
                      <ToggleButton value={1}>1</ToggleButton>
                      <ToggleButton value={2}>2</ToggleButton>
                    </ToggleButtonGroup>
                    <Typography variant="caption" color="text.secondary">
                      {commentDepth === 1 ? 'nur direkte Kommentare' : '+ Antworten'}
                    </Typography>
                  </Box>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Typography variant="body2" sx={{minWidth: 48}}>Max.</Typography>
                    <ToggleButtonGroup
                      value={commentMaxPerItem}
                      exclusive
                      onChange={(_, v) => v !== null && setCommentMaxPerItem(v)}
                      size="small"
                    >
                      {[3, 5, 10, 0].map(n => (
                        <ToggleButton key={n} value={n}>{n === 0 ? '∞' : n}</ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                    <Typography variant="caption" color="text.secondary">pro Inhalt</Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {error && (
              <Typography color="error" variant="body2" sx={{mt: 1.5}}>{error}</Typography>
            )}
          </>
        ) : (
          <>
            {isSettingsLoading ? (
              <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                <Typography variant="subtitle2" color="text.secondary">Schriftgrößen</Typography>
                <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                  {FONT_FIELDS.map(({key, label}) => (
                    <TextField
                      key={key}
                      label={label}
                      type="number"
                      size="small"
                      value={settingsForm[key]}
                      onChange={e => setSettingsField(key, parseFloat(e.target.value) || 0)}
                      InputProps={{endAdornment: <InputAdornment position="end">pt</InputAdornment>}}
                      inputProps={{min: 6, max: 48, step: 0.5}}
                    />
                  ))}
                </Box>

                <Divider />

                <Typography variant="subtitle2" color="text.secondary">Rahmen-Stil</Typography>
                <PassepartoutPicker
                  value={settingsForm.passepartoutStyle}
                  onChange={v => setSettingsField('passepartoutStyle', v)}
                />

                <Divider />

                <Typography variant="subtitle2" color="text.secondary">Inhaltsverzeichnis</Typography>
                <FormControlLabel
                  control={<Switch checked={settingsForm.tocEnabled} onChange={e => setSettingsField('tocEnabled', e.target.checked)} size="small" />}
                  label="Inhaltsverzeichnis anzeigen"
                />
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                  <Typography variant="body2" sx={{minWidth: 100}}>Textfarbe</Typography>
                  <input
                    type="color"
                    value={settingsForm.tocColor}
                    onChange={e => setSettingsField('tocColor', e.target.value)}
                    style={{width: 40, height: 32, border: 'none', cursor: 'pointer', padding: 0}}
                  />
                </Box>
                {settingsForm.tocEnabled && (
                  <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5, ml: 1}}>
                    <TextField
                      label="Titel"
                      size="small"
                      value={settingsForm.tocTitle}
                      onChange={e => setSettingsField('tocTitle', e.target.value)}
                    />
                    <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                      <TextField
                        label="Titelgröße"
                        type="number"
                        size="small"
                        value={settingsForm.tocTitleSize}
                        onChange={e => setSettingsField('tocTitleSize', parseFloat(e.target.value) || 0)}
                        InputProps={{endAdornment: <InputAdornment position="end">pt</InputAdornment>}}
                        inputProps={{min: 10, max: 60, step: 0.5}}
                      />
                      <TextField
                        label="Eintrags-Schriftgröße"
                        type="number"
                        size="small"
                        value={settingsForm.tocEntrySize}
                        onChange={e => setSettingsField('tocEntrySize', parseFloat(e.target.value) || 0)}
                        InputProps={{endAdornment: <InputAdornment position="end">pt</InputAdornment>}}
                        inputProps={{min: 6, max: 30, step: 0.5}}
                      />
                    </Box>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
                      <FormControlLabel
                        control={<Switch checked={settingsForm.tocShowPageNumbers} onChange={e => setSettingsField('tocShowPageNumbers', e.target.checked)} size="small" />}
                        label="Seitenzahlen"
                      />
                      <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <Typography variant="body2">Spalten</Typography>
                        <ToggleButtonGroup
                          value={settingsForm.tocColumns}
                          exclusive
                          onChange={(_, v) => v !== null && setSettingsField('tocColumns', v)}
                          size="small"
                        >
                          <ToggleButton value={1}>1</ToggleButton>
                          <ToggleButton value={2}>2</ToggleButton>
                        </ToggleButtonGroup>
                      </Box>
                    </Box>
                  </Box>
                )}

                <Divider />

                <Typography variant="subtitle2" color="text.secondary">Hintergrundbilder</Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                  <Typography variant="body2" sx={{minWidth: 100}}>Titelposition</Typography>
                  <ToggleButtonGroup
                    value={settingsForm.coverTitlePosition}
                    exclusive
                    onChange={(_, v) => v && setSettingsField('coverTitlePosition', v)}
                    size="small"
                  >
                    <ToggleButton value="top">Oben</ToggleButton>
                    <ToggleButton value="middle">Mitte</ToggleButton>
                    <ToggleButton value="bottom">Unten</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                  <Typography variant="body2" sx={{minWidth: 100}}>Titelfarbe</Typography>
                  <input
                    type="color"
                    value={settingsForm.coverTitleColor}
                    onChange={e => setSettingsField('coverTitleColor', e.target.value)}
                    style={{width: 40, height: 32, border: 'none', cursor: 'pointer', padding: 0}}
                  />
                </Box>

                <BackgroundImagePicker
                  label="Vorderdeckel"
                  value={settingsForm.coverFrontBackground}
                  onChange={v => setSettingsField('coverFrontBackground', v)}
                  bilder={groupBilder}
                />
                <BackgroundImagePicker
                  label="Inhaltsverzeichnis"
                  value={settingsForm.tocBackground}
                  onChange={v => setSettingsField('tocBackground', v)}
                  bilder={groupBilder}
                />
                <BackgroundImagePicker
                  label="Rückdeckel"
                  value={settingsForm.coverBackBackground}
                  onChange={v => setSettingsField('coverBackBackground', v)}
                  bilder={groupBilder}
                />

                <Divider />

                <Typography variant="subtitle2" color="text.secondary">Passwortschutz</Typography>
                <TextField
                  label="PDF-Passwort (leer = kein Schutz)"
                  type="password"
                  size="small"
                  value={settingsForm.pdfPassword}
                  onChange={e => setSettingsField('pdfPassword', e.target.value)}
                  autoComplete="new-password"
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading || isSaving}>Abbrechen</Button>
        {onSettingsTab ? (
          <Button
            variant="contained"
            onClick={handleSaveSettings}
            disabled={isSettingsLoading || isSaving}
          >
            Speichern
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || noneSelected}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {onOptionsSelected ? 'Übernehmen' : 'Generieren'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
