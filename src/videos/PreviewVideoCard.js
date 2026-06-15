import {useState} from 'react';
import {Paper, Box, Typography, Tooltip, Checkbox, TextField, IconButton, InputAdornment, Snackbar} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ClearIcon from '@mui/icons-material/Clear';
import {EditBildPriority} from '../bilder/Priority';
import AuthVideo from './AuthVideo';
import {ReactionButtons} from '../reactions/ReactionButtons';
import {CommentThread} from '../comments/CommentThread';
import {api} from './api';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '';
const isSameDay = (a, b) => {
    if (!a || !b) return false;
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

export const PreviewVideoCard = ({video}) => {
    const [updateVideo] = api.endpoints.updateVideo.useMutation();
    const [setVideoComplete] = api.endpoints.setComplete.useMutation();
    const [priority, setPriorityState] = useState(video.priority);
    const [editField, setEditField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [lockMsg, setLockMsg] = useState(false);
    const isComplete = Boolean(video.complete);

    const setPriority = (p) => { setPriorityState(p); updateVideo({...video, priority: p}); };

    const startEdit = (field) => {
        if (isComplete) { setLockMsg(true); return; }
        setEditField(field);
        setEditValue(video[field] ?? '');
    };

    const commitEdit = () => {
        if (editField && editValue !== (video[editField] ?? '')) {
            updateVideo({...video, [editField]: editValue});
        }
        setEditField(null);
    };

    const handleKeyDown = (e) => {
        if (editField === 'title' && e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') setEditField(null);
    };

    return (
        <>
            <Paper elevation={1} sx={{p: 2, display: 'flex', flexDirection: 'column', position: 'relative'}}>
                <Box sx={{position: 'absolute', top: 0, left: 4, zIndex: 1}}>
                    <EditBildPriority priority={priority} setPriority={setPriority} disabled={isComplete}/>
                </Box>

                <Tooltip title={isComplete ? 'Video ist geschützt' : 'Video kann gelöscht werden'}>
                    <Checkbox
                        checked={isComplete}
                        checkedIcon={<LockIcon color="success" fontSize="small"/>}
                        icon={<LockOpenIcon color="action" fontSize="small"/>}
                        onChange={() => setVideoComplete({video, complete: !isComplete})}
                        sx={{position: 'absolute', top: 0, right: 0}}
                    />
                </Tooltip>

                <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, pt: 3}}>
                    {editField === 'title' ? (
                        <TextField autoFocus size="small" value={editValue} fullWidth sx={{mb: 1}}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={commitEdit} onKeyDown={handleKeyDown}/>
                    ) : (
                        <Tooltip title={isComplete ? '' : 'Titel bearbeiten'} followCursor>
                            <Typography variant="subtitle1" onClick={() => startEdit('title')}
                                sx={{mb: 0.5, fontWeight: 'medium', textAlign: 'center',
                                    cursor: isComplete ? 'default' : 'text',
                                    '&:hover': !isComplete ? {backgroundColor: 'action.hover', borderRadius: 1} : {}}}>
                                {video.title || 'Kein Titel'}
                            </Typography>
                        </Tooltip>
                    )}
                    {(video.user?.name || video.created) && (
                        <Typography variant="caption" color="text.disabled"
                            sx={{display: 'block', textAlign: 'center', mb: 1, lineHeight: 1.4}}>
                            {[video.user?.name,
                                !isSameDay(video.capturedAt, video.created) && video.capturedAt ? `Aufnahme ${fmtDate(video.capturedAt)}` : null,
                                video.created ? `Upload ${fmtDate(video.created)}` : null
                            ].filter(Boolean).join(' · ')}
                        </Typography>
                    )}
                    <Box sx={{display: 'flex', justifyContent: 'center', mb: 2}}>
                        <AuthVideo src={`/api/v1/videos/extern${video.pfad}`} style={{maxWidth: '100%', maxHeight: 200}}/>
                    </Box>
                    {editField === 'description' ? (
                        <TextField autoFocus size="small" multiline value={editValue} fullWidth sx={{mb: 1}}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={commitEdit} onKeyDown={handleKeyDown}
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
                                    border: !video.description ? '1px solid rgba(0,0,0,0.23)' : 'none',
                                    borderRadius: 4, padding: '8.5px 14px',
                                    color: video.description ? 'inherit' : 'rgba(0,0,0,0.38)'}}>
                                {video.description || 'Beschreibung hinzufügen …'}
                            </pre>
                        </Tooltip>
                    )}
                </Box>

                <CommentThread
                    targetType="VIDEO" targetId={video.id}
                    prefix={<ReactionButtons targetType="VIDEO" targetId={video.id}/>}
                />
            </Paper>
            <Snackbar open={lockMsg} autoHideDuration={2500} onClose={() => setLockMsg(false)}
                message="Entsperren zum Bearbeiten"
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}/>
        </>
    );
};
