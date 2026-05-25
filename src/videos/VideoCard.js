import React, {memo, useState} from 'react';
import {
    Box, Button, ButtonGroup, Checkbox, Chip, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, InputAdornment, Paper, Snackbar, TextField,
    Tooltip, Typography, MenuItem, Popover, MenuList, Divider
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddLinkIcon from '@mui/icons-material/AddLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import {MetaInfoPanel} from '../shared/MetaInfoPanel';
import {EditBildPriority} from '../bilder/Priority';
import AuthVideo from './AuthVideo';
import {api as storyApi} from '../stories';
import {useDispatch} from 'react-redux';
import {api as videoApi} from './api';
import {ReactionButtons} from '../reactions/ReactionButtons';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '';
const isSameDay = (a, b) => {
    if (!a || !b) return false;
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

const AssignVideoToStoryButton = ({video, stories}) => {
    const dispatch = useDispatch();
    const [updateVideo] = videoApi.endpoints.updateVideo.useMutation();
    const [addStory] = storyApi.endpoints.addStory.useMutation();
    const [anchor, setAnchor] = useState(null);
    const [newStoryName, setNewStoryName] = useState('');

    const assignTo = (storyId, knownStory) => {
        const storyObj = knownStory || stories.find(s => s.id === storyId) || null;
        updateVideo({...video, story: storyObj ? {id: storyId} : null}).unwrap()
            .then(() => dispatch(videoApi.util.invalidateTags(['Video'])))
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
                                  selected={video.story?.id === s.id}>
                            {video.story?.id === s.id && <CheckIcon fontSize="small" sx={{mr: 1}}/>}
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

export const VideoCard = memo(({video, story, storiesLoaded, stories, onSetComplete, onUpdate, onDelete, onRemoveFromStory, dragHandleProps}) => {
    const [priority, setPriorityState] = useState(video.priority);
    const [lockMsg, setLockMsg] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [editField, setEditField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const isComplete = Boolean(video.complete);

    const startEdit = (field) => {
        if (isComplete) { setLockMsg(true); return; }
        setEditField(field);
        setEditValue(video[field] ?? '');
    };
    const commitEdit = () => {
        if (editField && editValue !== (video[editField] ?? '')) onUpdate({...video, [editField]: editValue});
        setEditField(null);
    };
    const handleKeyDown = (e) => {
        if (editField === 'title' && e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') setEditField(null);
    };

    return (
        <>
            <Paper elevation={1} sx={{p: 2, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'}}>
                {dragHandleProps && (
                    <Box {...dragHandleProps} sx={{position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                        cursor: 'grab', zIndex: 2, p: 1, touchAction: 'none', userSelect: 'none',
                        color: 'action.disabled', '&:hover': {color: 'action.active'}}}>
                        <DragIndicatorIcon fontSize="small" sx={{transform: 'rotate(90deg)'}}/>
                    </Box>
                )}
                {/* Priority oben links */}
                <Box sx={{position: 'absolute', top: 0, left: 4, zIndex: 1}}>
                    <span onClick={() => isComplete && setLockMsg(true)}>
                        <EditBildPriority priority={priority}
                                          setPriority={p => { setPriorityState(p); onUpdate({...video, priority: p}); }}
                                          disabled={isComplete}/>
                    </span>
                </Box>
                {/* Löschschutz oben rechts */}
                <Tooltip title={isComplete ? 'Video ist geschützt' : 'Video kann gelöscht werden'}>
                    <Checkbox
                        checked={isComplete}
                        checkedIcon={<LockIcon color="success" fontSize="small"/>}
                        icon={<LockOpenIcon color="action" fontSize="small"/>}
                        onChange={() => onSetComplete({video, complete: !isComplete})}
                        sx={{position: 'absolute', top: 0, right: 0}}
                    />
                </Tooltip>

                <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, pt: 3}}>
                    {editField === 'title' ? (
                        <TextField autoFocus size="small" value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={commitEdit} onKeyDown={handleKeyDown}
                            fullWidth sx={{mb: 1}}/>
                    ) : (
                        <Tooltip title={isComplete ? '' : 'Titel bearbeiten'} followCursor>
                            <Typography variant="subtitle1" component="div"
                                sx={{mb: 0.5, fontWeight: 'medium', textAlign: 'center',
                                    cursor: isComplete ? 'default' : 'text',
                                    '&:hover': !isComplete ? {backgroundColor: 'action.hover', borderRadius: 1} : {}}}
                                onClick={() => startEdit('title')}>
                                {video.title || 'Kein Titel'}
                            </Typography>
                        </Tooltip>
                    )}
                    {(video.user?.name || video.created) && (
                        <Typography variant="caption" color="text.disabled" sx={{display: 'block', textAlign: 'center', mb: 1, lineHeight: 1.4}}>
                            {[video.user?.name,
                                !isSameDay(video.capturedAt, video.created) && video.capturedAt ? `Aufnahme ${fmtDate(video.capturedAt)}` : null,
                                video.created ? `Upload ${fmtDate(video.created)}` : null
                            ].filter(Boolean).join(' · ')}
                        </Typography>
                    )}
                    <Box sx={{display: 'flex', justifyContent: 'center', mb: 2}}>
                        <AuthVideo
                            src={`/api/v1/videos/extern${video.pfad}`}
                            style={{maxWidth: '100%', maxHeight: 200}}
                        />
                    </Box>

                    <MetaInfoPanel jsonString={video.metadata}/>

                    {editField === 'description' ? (
                        <TextField autoFocus size="small" multiline value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={commitEdit} onKeyDown={handleKeyDown}
                            fullWidth sx={{mb: 5}}
                            inputProps={{style: {fontFamily: "'Brush Script MT', cursive", fontSize: '0.95rem'}}}
                            InputProps={{endAdornment: editValue ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onMouseDown={e => { e.preventDefault(); setEditValue(''); }}>
                                        <ClearIcon fontSize="small"/>
                                    </IconButton>
                                </InputAdornment>
                            ) : null}}/>
                    ) : (
                        <Tooltip title={isComplete ? '' : 'Beschreibung bearbeiten'} followCursor>
                            <pre className="wrap-pre" onClick={() => startEdit('description')}
                                style={{cursor: isComplete ? 'default' : 'text', minHeight: '1.5em',
                                    marginBottom: 40,
                                    border: !video.description ? '1px solid rgba(0,0,0,0.23)' : 'none',
                                    borderRadius: 4,
                                    padding: '8.5px 14px',
                                    color: video.description ? 'inherit' : 'rgba(0,0,0,0.38)'}}>
                                {video.description || 'Beschreibung hinzufügen …'}
                            </pre>
                        </Tooltip>
                    )}
                    {!Boolean(story) && video.story && (
                        <Box sx={{position: 'absolute', left: 8, bottom: 36, zIndex: 2}}>
                            <Chip
                                label={video.story.name}
                                size="small"
                                onDelete={!isComplete && onRemoveFromStory ? () => onRemoveFromStory(video) : undefined}
                            />
                        </Box>
                    )}
                </Box>

                <Box sx={{position: 'absolute', bottom: 4, left: 4, zIndex: 1}}>
                    <ReactionButtons targetType="VIDEO" targetId={video.id}/>
                </Box>

                {/* Aktionen unten rechts */}
                <Box sx={{position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1, padding: '2px', zIndex: 1}}>
                    <ButtonGroup size="small">
                        {storiesLoaded && <AssignVideoToStoryButton video={video} stories={stories}/>}
                        {video.story && onRemoveFromStory && (
                            <Tooltip title="Aus Story entfernen">
                                <span onClick={() => isComplete && setLockMsg(true)}>
                                    <IconButton disabled={isComplete} size="small"
                                                onClick={e => { e.stopPropagation(); onRemoveFromStory(video); }}>
                                        <LinkOffIcon fontSize="small"/>
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                        <Tooltip title="Video löschen">
                            <span onClick={() => isComplete && setLockMsg(true)}>
                                <IconButton disabled={isComplete} size="small"
                                            onClick={e => { e.stopPropagation(); setDeleteConfirm(true); }}>
                                    <DeleteIcon fontSize="small"/>
                                </IconButton>
                            </span>
                        </Tooltip>
                    </ButtonGroup>
                </Box>
            </Paper>
            <Snackbar open={lockMsg} autoHideDuration={2500} onClose={() => setLockMsg(false)}
                      message="Entsperren zum Bearbeiten"
                      anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}/>
            <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
                <DialogTitle>Video in Papierkorb?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        „{video.title || 'Kein Titel'}" wird in den Papierkorb verschoben.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm(false)}>Abbrechen</Button>
                    <Button onClick={() => { setDeleteConfirm(false); onDelete(); }} color="error" variant="contained">
                        In Papierkorb
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}, (prev, next) =>
    prev.video === next.video &&
    prev.story === next.story &&
    prev.storiesLoaded === next.storiesLoaded &&
    prev.stories === next.stories
);
