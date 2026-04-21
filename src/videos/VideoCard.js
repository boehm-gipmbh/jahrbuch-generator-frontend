import React, {memo, useState} from 'react';
import {
    Box, Button, ButtonGroup, Checkbox, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, Paper, Snackbar, TextField,
    Tooltip, Typography, MenuItem, Popover, MenuList, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddLinkIcon from '@mui/icons-material/AddLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import {EditBildPriority} from '../bilder/Priority';
import AuthVideo from './AuthVideo';
import {api as storyApi} from '../stories';
import {useDispatch} from 'react-redux';
import {api as videoApi} from './api';

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

export const VideoCard = memo(({video, story, storiesLoaded, stories, onSetComplete, onUpdate, onDelete, onRemoveFromStory}) => {
    const [priority, setPriorityState] = useState(video.priority);
    const [lockMsg, setLockMsg] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const isComplete = Boolean(video.complete);

    return (
        <>
            <Paper elevation={1} sx={{p: 2, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'}}>
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
                    <Typography variant="subtitle1" sx={{mb: 1, fontWeight: 'medium', textAlign: 'center'}}>
                        {video.title || 'Kein Titel'}
                    </Typography>
                    <Box sx={{display: 'flex', justifyContent: 'center', mb: 2}}>
                        <AuthVideo
                            src={`/api/v1/videos/extern${video.pfad}`}
                            style={{maxWidth: '100%', maxHeight: 200}}
                        />
                    </Box>
                    {video.description && (
                        <pre className="wrap-pre" style={{margin: '0 0 20px 0', minHeight: '1.5em'}}>
                            {video.description}
                        </pre>
                    )}
                    {!Boolean(story) && video.story && (
                        <Box sx={{position: 'absolute', left: 8, bottom: 8, zIndex: 2}}>
                            <Typography variant="caption" color="text.secondary">
                                {video.story.name}
                            </Typography>
                        </Box>
                    )}
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
