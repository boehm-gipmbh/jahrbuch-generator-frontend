import React, {useEffect, useState} from 'react';
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, IconButton, List, ListItem,
  Switch, TextField, ToggleButton, ToggleButtonGroup, Typography
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

const PASSEPARTOUT_STYLES = [
  {id: 'none',     label: 'Keiner'},
  {id: 'gold',     label: 'Gold'},
  {id: 'silber',   label: 'Silber'},
  {id: 'vintage',  label: 'Vintage'},
  {id: 'festlich', label: 'Festlich'},
];

const PassepartoutSvg = ({styleId}) => {
  const W = 48, H = 68;
  const cfg = {
    none:     {primary: null,               fill: null,                bw: 7,  ol: 2, cs: 2.2, lw: 0,   diamonds: false, squares: false, flowers: 0, midSide: false, doubleInner: false},
    gold:     {primary: 'rgba(189,143,20,', fill: 'rgba(252,247,220,', bw: 7,  ol: 2, cs: 2.2, lw: 1,   diamonds: true,  squares: false, flowers: 0, midSide: false, doubleInner: false},
    silber:   {primary: 'rgba(153,153,163,',fill: 'rgba(235,235,240,', bw: 7,  ol: 2, cs: 2.2, lw: 1.4, diamonds: false, squares: true,  flowers: 0, midSide: false, doubleInner: false},
    vintage:  {primary: 'rgba(140,82,25,',  fill: 'rgba(250,240,222,', bw: 10, ol: 2, cs: 2.8, lw: 0.7, diamonds: false, squares: false, flowers: 4, midSide: true,  doubleInner: true},
    festlich: {primary: 'rgba(110,10,20,',  fill: 'rgba(252,232,234,', bw: 12, ol: 2, cs: 3.2, lw: 1.5, diamonds: false, squares: false, flowers: 5, midSide: true,  doubleInner: false},
  }[styleId] || {};

  const p = (o) => `${cfg.primary}${o})`;
  const f = (o) => `${cfg.fill}${o})`;
  const {bw, ol, cs, lw} = cfg;
  const corners = [[bw, bw], [W - bw, bw], [bw, H - bw], [W - bw, H - bw]];

  const svgFlower = (cx, cy, r, petals, color) => (
    [...Array(petals)].map((_, i) => {
      const angle = (Math.PI * 2 * i) / petals - Math.PI / 2;
      return <circle key={i} cx={cx + Math.cos(angle) * r * 0.72} cy={cy + Math.sin(angle) * r * 0.72} r={r * 0.52} fill={color} />;
    }).concat(<circle key="c" cx={cx} cy={cy} r={r * 0.36} fill={color} />)
  );

  return (
    <svg width={W} height={H} style={{display: 'block', border: '1px solid #ddd', background: 'white'}}>
      {cfg.fill && <>
        <rect x={0} y={H - bw} width={W} height={bw} fill={f('0.55')} />
        <rect x={0} y={0} width={W} height={bw} fill={f('0.55')} />
        <rect x={0} y={bw} width={bw} height={H - 2 * bw} fill={f('0.55')} />
        <rect x={W - bw} y={bw} width={bw} height={H - 2 * bw} fill={f('0.55')} />
      </>}
      {cfg.primary && !cfg.doubleInner && <rect x={ol} y={ol} width={W - 2 * ol} height={H - 2 * ol} fill="none" stroke={p('0.45')} strokeWidth={0.5} />}
      {cfg.primary && <rect x={bw} y={bw} width={W - 2 * bw} height={H - 2 * bw} fill="none" stroke={p('0.75')} strokeWidth={lw} />}
      {cfg.doubleInner && <rect x={bw + 1.5} y={bw + 1.5} width={W - 2 * (bw + 1.5)} height={H - 2 * (bw + 1.5)} fill="none" stroke={p('0.6')} strokeWidth={0.5} />}
      {cfg.diamonds && corners.map(([cx, cy], i) => (
        <polygon key={i} points={`${cx},${cy - cs} ${cx + cs},${cy} ${cx},${cy + cs} ${cx - cs},${cy}`} fill={p('0.75')} />
      ))}
      {cfg.squares && corners.map(([cx, cy], i) => (
        <rect key={i} x={cx - cs * 0.8} y={cy - cs * 0.8} width={cs * 1.6} height={cs * 1.6} fill={p('0.75')} />
      ))}
      {cfg.flowers > 0 && <>
        {corners.map(([cx, cy], i) => <g key={i}>{svgFlower(cx, cy, cs, cfg.flowers, p('0.75'))}</g>)}
        {cfg.midSide && [
          [W/2, bw/2], [W/2, H - bw/2], [bw/2, H/2], [W - bw/2, H/2]
        ].map(([cx, cy], i) => <g key={`m${i}`}>{svgFlower(cx, cy, cs * 0.65, cfg.flowers, p('0.6'))}</g>)}
      </>}
    </svg>
  );
};

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

export const PdfExportDialog = ({gruppe, onClose, onOptionsSelected}) => {
  const {data: allStories = []} = storyApi.endpoints.getStories.useQuery();
  const jwt = useSelector(state => state.auth.jwt);

  const [orderedStories, setOrderedStories] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [initialized, setInitialized] = useState(false);
  const [includePendingBilder, setIncludePendingBilder] = useState(false);
  const [includePendingTexte, setIncludePendingTexte] = useState(false);
  const [coverPage, setCoverPage] = useState(true);
  const [coverTitle, setCoverTitle] = useState(gruppe.name);
  const [pageNumbers, setPageNumbers] = useState(true);
  const [passepartoutStyle, setPassepartoutStyle] = useState('gold');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!initialized && allStories.length > 0) {
      setOrderedStories(allStories);
      setCheckedIds(new Set(allStories.map(s => s.id)));
      setInitialized(true);
    }
  }, [allStories, initialized]);

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

  const handleGenerate = async () => {
    const storyIds = orderedStories.filter(s => checkedIds.has(s.id)).map(s => s.id);
    const options = {
      storyIds,
      includePendingBilder,
      includePendingTexte,
      coverPage,
      coverTitle: coverPage ? coverTitle : null,
      pageNumbers,
      passepartoutStyle
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

  return (
    <Dialog open onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Jahrbuch exportieren</DialogTitle>
      <DialogContent dividers>
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
          <Box sx={{mt: 0.5}}>
            <Typography variant="body2" sx={{mb: 0.75}}>Passepartout</Typography>
            <ToggleButtonGroup
              value={passepartoutStyle}
              exclusive
              onChange={(_, v) => v && setPassepartoutStyle(v)}
              size="small"
              sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButtonGroup-grouped': {border: '1px solid rgba(0,0,0,0.18) !important', borderRadius: '4px !important', m: 0}}}
            >
              {PASSEPARTOUT_STYLES.map(s => (
                <ToggleButton key={s.id} value={s.id} sx={{flexDirection: 'column', gap: 0.5, p: 0.75, minWidth: 64}}>
                  <PassepartoutSvg styleId={s.id} />
                  <Typography variant="caption" sx={{lineHeight: 1}}>{s.label}</Typography>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>

        {error && (
          <Typography color="error" variant="body2" sx={{mt: 1.5}}>{error}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Abbrechen</Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={loading || noneSelected}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {onOptionsSelected ? 'Übernehmen' : 'Generieren'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
