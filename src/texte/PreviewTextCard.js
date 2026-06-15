import {useState} from 'react';
import {Paper, Box, Typography, Tooltip, Checkbox, TextField, IconButton, InputAdornment, Snackbar} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ClearIcon from '@mui/icons-material/Clear';
import {EditTextPriority} from './Priority';
import {ReactionButtons} from '../reactions/ReactionButtons';
import {CommentThread} from '../comments/CommentThread';
import {api} from './api';
import {clusterColor} from '../stories/clusterColor';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '';

export const PreviewTextCard = ({text}) => {
    const [updateText] = api.endpoints.updateText.useMutation();
    const [setTextComplete] = api.endpoints.setComplete.useMutation();
    const [priority, setPriorityState] = useState(text.priority);
    const [editField, setEditField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [lockMsg, setLockMsg] = useState(false);
    const isComplete = Boolean(text.complete);

    const setPriority = (p) => { setPriorityState(p); updateText({...text, priority: p}); };

    const startEdit = (field) => {
        if (isComplete) { setLockMsg(true); return; }
        setEditField(field);
        setEditValue(text[field] ?? '');
    };

    const commitEdit = () => {
        if (editField && editValue !== (text[editField] ?? '')) {
            updateText({...text, [editField]: editValue});
        }
        setEditField(null);
    };

    const handleKeyDown = (e) => {
        if (editField === 'title' && e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') { setEditField(null); }
    };

    return (
        <Paper elevation={1} sx={{
            p: 2, display: 'flex', flexDirection: 'column', position: 'relative',
            borderLeft: text.clusterId ? `4px solid ${clusterColor(text.clusterId)}` : undefined,
        }}>
            <Box sx={{position: 'absolute', top: 0, left: 4, zIndex: 1}}>
                <EditTextPriority priority={priority} setPriority={setPriority} disabled={isComplete}/>
            </Box>

            <Tooltip title={isComplete ? 'Text ist geschützt' : 'Text kann gelöscht werden'}>
                <Checkbox
                    checked={isComplete}
                    checkedIcon={<LockIcon color="success" fontSize="small"/>}
                    icon={<LockOpenIcon color="action" fontSize="small"/>}
                    onChange={() => setTextComplete({text, complete: !isComplete})}
                    sx={{position: 'absolute', top: 0, right: 0, '&.Mui-checked': {color: t => t.palette.success.main}}}
                />
            </Tooltip>

            <Box sx={{flex: 1, pt: 3}}>
                {editField === 'title' ? (
                    <TextField autoFocus size="small" value={editValue} fullWidth sx={{mb: 1}}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit} onKeyDown={handleKeyDown}/>
                ) : (
                    <Tooltip title={isComplete ? '' : 'Titel bearbeiten'} followCursor>
                        <Typography variant="subtitle1" color="primary" onClick={() => startEdit('title')}
                            sx={{mb: 0.5, fontWeight: 'bold', textAlign: 'center',
                                cursor: isComplete ? 'default' : 'text',
                                '&:hover': !isComplete ? {backgroundColor: 'action.hover', borderRadius: 1} : {}}}>
                            {text.title}
                        </Typography>
                    </Tooltip>
                )}
                {(text.user?.name || text.created) && (
                    <Typography variant="caption" color="text.disabled"
                        sx={{display: 'block', textAlign: 'center', mb: 1, lineHeight: 1.4}}>
                        {[text.user?.name, fmtDate(text.created)].filter(Boolean).join(' · ')}
                    </Typography>
                )}
                {editField === 'description' ? (
                    <TextField autoFocus size="small" multiline value={editValue} fullWidth
                        minRows={Math.max(3, (text.description || '').split('\n').length)}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit} onKeyDown={handleKeyDown}
                        inputProps={{style: {fontFamily: "'Brush Script MT', cursive", fontSize: '0.95rem'}}}
                        InputProps={{endAdornment: editValue ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onMouseDown={e => { e.preventDefault(); setEditValue(''); }}>
                                    <ClearIcon fontSize="small"/>
                                </IconButton>
                            </InputAdornment>
                        ) : null}}
                    />
                ) : (
                    <Tooltip title={isComplete ? '' : 'Text bearbeiten'} followCursor>
                        <pre className="wrap-pre" onClick={() => startEdit('description')}
                            style={{cursor: isComplete ? 'default' : 'text', minHeight: '3em',
                                fontFamily: "'Brush Script MT', cursive", fontSize: '0.95rem',
                                border: !text.description ? '1px solid rgba(0,0,0,0.23)' : 'none',
                                borderRadius: 4, padding: '8.5px 14px',
                                color: text.description ? 'inherit' : 'rgba(0,0,0,0.38)'}}>
                            {text.description || 'Erinnerung hinzufügen …'}
                        </pre>
                    </Tooltip>
                )}
            </Box>

            <CommentThread
                targetType="TEXT" targetId={text.id}
                prefix={<ReactionButtons targetType="TEXT" targetId={text.id}/>}
            />

            <Snackbar open={lockMsg} autoHideDuration={2500} onClose={() => setLockMsg(false)}
                message="Entsperren zum Bearbeiten"
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}/>
        </Paper>
    );
};
