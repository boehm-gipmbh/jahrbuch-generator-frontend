import {useState} from 'react';
import {Paper, Box, Typography, Tooltip, Checkbox, TextField, IconButton, InputAdornment, Snackbar} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ClearIcon from '@mui/icons-material/Clear';
import AuthImage from './AuthImage';
import {EditBildPriority} from './Priority';
import {ReactionButtons} from '../reactions/ReactionButtons';
import {CommentThread} from '../comments/CommentThread';
import {api} from './api';
import {clusterColor} from '../stories/clusterColor';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '';
const isSameDay = (a, b) => {
    if (!a || !b) return false;
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

export const PreviewBildCard = ({bild}) => {
    const [updateBild] = api.endpoints.updateBild.useMutation();
    const [setBildComplete] = api.endpoints.setComplete.useMutation();
    const [priority, setPriorityState] = useState(bild.priority);
    const [editField, setEditField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [lockMsg, setLockMsg] = useState(false);
    const isComplete = Boolean(bild.complete);

    const setPriority = (p) => { setPriorityState(p); updateBild({...bild, priority: p}); };

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

    return (
        <Paper elevation={1} sx={{
            p: 2, display: 'flex', flexDirection: 'column', position: 'relative',
            borderLeft: bild.clusterId ? `4px solid ${clusterColor(bild.clusterId)}` : undefined,
        }}>
            <Box sx={{position: 'absolute', top: 0, left: 4, zIndex: 1}}>
                <EditBildPriority priority={priority} setPriority={setPriority} disabled={isComplete}/>
            </Box>

            <Tooltip title={isComplete ? 'Bild ist geschützt' : 'Bild kann gelöscht werden'}>
                <Checkbox
                    checked={isComplete}
                    checkedIcon={<LockIcon color="success" fontSize="small"/>}
                    icon={<LockOpenIcon color="action" fontSize="small"/>}
                    onChange={() => setBildComplete({bild, complete: !isComplete})}
                    sx={{position: 'absolute', top: 0, right: 0, '&.Mui-checked': {color: t => t.palette.success.main}}}
                />
            </Tooltip>

            <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, pt: 3}}>
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
                            {bild.title || 'Kein Titel'}
                        </Typography>
                    </Tooltip>
                )}
                {(bild.user?.name || bild.created) && (
                    <Typography variant="caption" color="text.disabled"
                        sx={{display: 'block', textAlign: 'center', mb: 1, lineHeight: 1.4}}>
                        {[bild.user?.name,
                            !isSameDay(bild.capturedAt, bild.created) && bild.capturedAt ? `Aufnahme ${fmtDate(bild.capturedAt)}` : null,
                            bild.created ? `Upload ${fmtDate(bild.created)}` : null
                        ].filter(Boolean).join(' · ')}
                    </Typography>
                )}
                <Box sx={{mb: 2}}>
                    <AuthImage
                        src={bild.pfad?.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}
                        alt={bild.description || ''} thumb
                        style={{width: '100%', height: 'auto', display: 'block'}}
                    />
                </Box>
                <Box sx={{mt: 'auto', mb: 1}}>
                    {editField === 'description' ? (
                        <TextField autoFocus size="small" multiline value={editValue} fullWidth
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
                        <Tooltip title={isComplete ? '' : 'Beschreibung bearbeiten'} followCursor>
                            <pre className="wrap-pre" onClick={() => startEdit('description')}
                                style={{cursor: isComplete ? 'default' : 'text', minHeight: '1.5em',
                                    border: !bild.description ? '1px solid rgba(0,0,0,0.23)' : 'none',
                                    borderRadius: 4, padding: '8.5px 14px',
                                    color: bild.description ? 'inherit' : 'rgba(0,0,0,0.38)'}}>
                                {bild.description || 'Beschreibung hinzufügen …'}
                            </pre>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            <CommentThread
                targetType="BILD" targetId={bild.id}
                prefix={<ReactionButtons targetType="BILD" targetId={bild.id}/>}
            />

            <Snackbar open={lockMsg} autoHideDuration={2500} onClose={() => setLockMsg(false)}
                message="Entsperren zum Bearbeiten"
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}/>
        </Paper>
    );
};
