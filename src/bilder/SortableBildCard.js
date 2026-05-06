import {useState, memo} from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {Paper, Box, Typography, Tooltip, Checkbox, IconButton, TextField, Snackbar, InputAdornment,
    MenuItem, Popover, MenuList, Divider, Collapse} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AddLinkIcon from '@mui/icons-material/AddLink';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {useDispatch} from 'react-redux';
import AuthImage from './AuthImage';
import {EditBildPriority} from './Priority';
import {StoryChip} from '../texte/StoryChip';
import {api} from './api';
import {api as storyApi} from '../stories';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '';
const isSameDay = (a, b) => {
    if (!a || !b) return false;
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

const AssignBildToStoryButton = ({bild, stories}) => {
    const dispatch = useDispatch();
    const [updateBild] = api.endpoints.updateBild.useMutation();
    const [addStory] = storyApi.endpoints.addStory.useMutation();
    const [anchor, setAnchor] = useState(null);
    const [newStoryName, setNewStoryName] = useState('');

    const assignTo = (storyId, knownStory) => {
        const storyObj = knownStory || stories.find(s => s.id === storyId) || null;
        updateBild({...bild, story: storyObj ? {id: storyId} : null}).unwrap()
            .then(() => dispatch(api.util.invalidateTags(['Bild'])))
            .catch(e => console.error(e));
        setAnchor(null);
    };

    const handleCreateAndAssign = () => {
        if (!newStoryName.trim()) return;
        addStory({name: newStoryName.trim()}).unwrap()
            .then(story => {
                dispatch(storyApi.util.invalidateTags(['Story']));
                assignTo(story.id, story);
            })
            .catch(e => console.error(e));
        setNewStoryName('');
        setAnchor(null);
    };

    return (
        <>
            <Tooltip title="Zu anderer Story hinzufügen">
                <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}>
                    <AddLinkIcon fontSize="small"/>
                </IconButton>
            </Tooltip>
            <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
                     anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}>
                <MenuList dense sx={{minWidth: 180}}>
                    {(stories || []).map(s => (
                        <MenuItem key={s.id} onClick={() => assignTo(s.id)}
                                  selected={bild.story?.id === s.id}>
                            {bild.story?.id === s.id && <CheckIcon fontSize="small" sx={{mr: 1}}/>}
                            {s.name}
                        </MenuItem>
                    ))}
                    {(stories || []).length > 0 && <Divider/>}
                    <MenuItem disableRipple>
                        <TextField size="small" placeholder="Neue Story …" value={newStoryName}
                                   onChange={e => setNewStoryName(e.target.value)}
                                   onKeyDown={e => e.key === 'Enter' && handleCreateAndAssign()}
                                   InputProps={{endAdornment: (
                                       <IconButton size="small" onClick={handleCreateAndAssign}>
                                           <AddCircleOutlineIcon fontSize="small"/>
                                       </IconButton>
                                   )}}/>
                    </MenuItem>
                </MenuList>
            </Popover>
        </>
    );
};

export const SortableBildCard = memo(({bild, story, storiesLoaded, stories, onSetComplete, onRemoveFromStory}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: `bild-${bild.id}`
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [updateBild] = api.endpoints.updateBild.useMutation();
    const [deleteBild] = api.endpoints.deleteBild.useMutation();
    const [editField, setEditField] = useState(null); // 'title' | 'description' | null
    const [editValue, setEditValue] = useState('');
    const [priority, setPriorityState] = useState(bild.priority);
    const [lockMsg, setLockMsg] = useState(false);
    const [showExif, setShowExif] = useState(false);
    const isComplete = Boolean(bild.complete);

    const exif = bild.exifData ? (() => { try { return JSON.parse(bild.exifData); } catch { return null; } })() : null;

    const startEdit = (field) => {
        if (isComplete) { setLockMsg(true); return; }
        setEditField(field);
        setEditValue(bild[field] ?? '');
    };

    const commitEdit = () => {
        if (editField && editValue !== (bild[editField] ?? '')) {
            updateBild({...bild, [editField]: editValue});
        }
        setEditField(null);
    };

    const handleKeyDown = (e) => {
        if (editField === 'title' && e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') { setEditField(null); }
    };

    const setPriority = (p) => { setPriorityState(p); updateBild({...bild, priority: p}); };

    return (
        <Box ref={setNodeRef} style={style}>
            <Paper elevation={isDragging ? 4 : 1} sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* Drag Handle */}
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        cursor: 'grab',
                        zIndex: 2,
                        p: 1,
                        touchAction: 'none',
                        userSelect: 'none',
                        color: 'action.disabled',
                        '&:hover': {color: 'action.active'}
                    }}
                >
                    <DragIndicatorIcon fontSize="small" sx={{transform: 'rotate(90deg)'}}/>
                </Box>

                {/* Priority oben links */}
                <Box sx={{position: 'absolute', top: 0, left: 4, zIndex: 1}}>
                    <span onClick={() => isComplete && setLockMsg(true)}>
                        <EditBildPriority
                            priority={priority}
                            setPriority={setPriority}
                            disabled={isComplete}
                        />
                    </span>
                </Box>

                {/* Löschschutz oben rechts */}
                <Tooltip title={isComplete ? "Bild ist geschützt" : "Bild kann gelöscht werden"}>
                    <Checkbox
                        checked={isComplete}
                        checkedIcon={<LockIcon color="success" fontSize='small'/>}
                        icon={<LockOpenIcon color="action" fontSize='small'/>}
                        onChange={() => onSetComplete({bild, complete: !isComplete})}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            '&.Mui-checked': {color: theme => theme.palette.success.main}
                        }}
                    />
                </Tooltip>

                <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, pt: 3}}>
                    {/* Titel */}
                    {editField === 'title' ? (
                        <TextField
                            autoFocus
                            size="small"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                            fullWidth
                            sx={{mb: 1}}
                        />
                    ) : (
                        <Tooltip title={isComplete ? '' : 'Titel bearbeiten'} followCursor>
                        <Typography
                            variant="subtitle1"
                            component="div"
                            color="primary"
                            onClick={() => startEdit('title')}
                            sx={{
                                mb: 0.5, fontWeight: 'bold', textAlign: 'center',
                                cursor: isComplete ? 'default' : 'text',
                                '&:hover': !isComplete ? {backgroundColor: 'action.hover', borderRadius: 1} : {}
                            }}
                        >
                            {bild.title || 'Kein Titel'}
                        </Typography>
                        </Tooltip>
                    )}
                    {(bild.user?.name || bild.created) && (
                        <Typography variant="caption" color="text.disabled" sx={{display: 'block', textAlign: 'center', mb: 1, lineHeight: 1.4}}>
                            {[bild.user?.name,
                                !isSameDay(bild.capturedAt, bild.created) && bild.capturedAt ? `Aufnahme ${fmtDate(bild.capturedAt)}` : null,
                                bild.created ? `Upload ${fmtDate(bild.created)}` : null
                            ].filter(Boolean).join(' · ')}
                        </Typography>
                    )}

                    {/* Bild */}
                    <Box sx={{mb: 2}}>
                        <AuthImage
                            src={bild.pfad?.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}
                            alt={bild.description || ''}
                            thumb
                            style={{width: '100%', height: 'auto', display: 'block'}}
                        />
                    </Box>

                    {/* EXIF-Info */}
                    {exif && (
                        <Box sx={{mb: 1}}>
                            <Box sx={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'text.secondary'}}
                                 onClick={() => setShowExif(v => !v)}>
                                <InfoOutlinedIcon sx={{fontSize: 14, mr: 0.5}}/>
                                <Typography variant="caption">EXIF</Typography>
                            </Box>
                            <Collapse in={showExif}>
                                <Box sx={{mt: 0.5, p: 1, bgcolor: 'grey.50', borderRadius: 1, fontSize: '0.7rem', fontFamily: 'monospace', lineHeight: 1.6}}>
                                    {exif.make && <div><b>Kamera:</b> {exif.make} {exif.model}</div>}
                                    {exif.iso && <div><b>ISO:</b> {exif.iso}{exif.fNumber ? `  f/${exif.fNumber.toFixed(1)}` : ''}{exif.exposureTime ? `  1/${Math.round(1/exif.exposureTime)}s` : ''}{exif.focalLength ? `  ${exif.focalLength.toFixed(0)}mm` : ''}</div>}
                                    {exif.gpsLat != null && <div><b>GPS:</b> {exif.gpsLat.toFixed(6)}, {exif.gpsLon.toFixed(6)}{exif.gpsAlt != null ? ` (${exif.gpsAlt}m)` : ''}</div>}
                                    {exif.capturedAt && <div><b>EXIF-Datum:</b> {exif.capturedAt}</div>}
                                </Box>
                            </Collapse>
                        </Box>
                    )}

                    {/* Beschreibung */}
                    <Box sx={{mt: 'auto', mb: 5}}>
                        {editField === 'description' ? (
                            <TextField
                                autoFocus
                                size="small"
                                multiline
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                fullWidth
                                inputProps={{style: {fontFamily: "'Brush Script MT', cursive", fontSize: '0.95rem'}}}
                                InputProps={{endAdornment: editValue ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onMouseDown={e => { e.preventDefault(); setEditValue(''); }}><ClearIcon fontSize="small"/></IconButton>
                                    </InputAdornment>
                                ) : null}}
                            />
                        ) : (
                            <Tooltip title={isComplete ? '' : 'Beschreibung bearbeiten'} followCursor>
                            <pre
                                className="wrap-pre"
                                onClick={() => startEdit('description')}
                                style={{cursor: isComplete ? 'default' : 'text', minHeight: '1.5em',
                                    border: !bild.description ? '1px solid rgba(0,0,0,0.23)' : 'none',
                                    borderRadius: 4,
                                    padding: '8.5px 14px',
                                    color: bild.description ? 'inherit' : 'rgba(0,0,0,0.38)'}}
                            >
                                {bild.description || 'Beschreibung hinzufügen …'}
                                {!Boolean(story) && <StoryChip bild={bild} size='small'/>}
                            </pre>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                {/* Aktionen unten rechts */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    padding: '2px',
                    zIndex: 1,
                    display: 'flex'
                }}>
                    {storiesLoaded && <AssignBildToStoryButton bild={bild} stories={stories}/>}
                    <Tooltip title="Aus Story entfernen">
                        <span onClick={() => isComplete && setLockMsg(true)}>
                            <IconButton
                                disabled={isComplete}
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onRemoveFromStory(bild); }}
                            >
                                <LinkOffIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="In Papierkorb legen">
                        <span onClick={() => isComplete && setLockMsg(true)}>
                            <IconButton
                                disabled={isComplete}
                                size="small"
                                onClick={(e) => { e.stopPropagation(); deleteBild(bild); }}
                            >
                                <DeleteOutlineIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Paper>
            <Snackbar
                open={lockMsg}
                autoHideDuration={2500}
                onClose={() => setLockMsg(false)}
                message="Entsperren zum Bearbeiten"
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            />
        </Box>
    );
}, (prev, next) =>
    prev.bild === next.bild &&
    prev.story === next.story &&
    prev.storiesLoaded === next.storiesLoaded &&
    prev.stories === next.stories
);
