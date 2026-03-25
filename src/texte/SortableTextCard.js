import {useState} from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {Paper, Box, Typography, Tooltip, Checkbox, IconButton, TextField, Snackbar} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import {EditTextPriority} from './Priority';
import {StoryChip} from './StoryChip';
import {api} from './api';

export const SortableTextCard = ({text, story, onSetComplete, onRemoveFromStory}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: `text-${text.id}`
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [updateText] = api.endpoints.updateText.useMutation();
    const [editField, setEditField] = useState(null); // 'title' | 'description' | null
    const [editValue, setEditValue] = useState('');
    const [priority, setPriorityState] = useState(text.priority);
    const [lockMsg, setLockMsg] = useState(false);
    const isComplete = Boolean(text.complete);

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

    const setPriority = (p) => { setPriorityState(p); updateText({...text, priority: p}); };

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
                    <EditTextPriority
                        priority={priority}
                        setPriority={setPriority}
                        disabled={isComplete}
                    />
                </Box>

                {/* Lock oben rechts */}
                <Tooltip title={isComplete ? "Text ist geschützt" : "Text kann gelöscht werden"}>
                    <Checkbox
                        checked={isComplete}
                        checkedIcon={<LockIcon color="success" fontSize='small'/>}
                        icon={<LockOpenIcon color="action" fontSize='small'/>}
                        onChange={() => onSetComplete({text, complete: !isComplete})}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            '&.Mui-checked': {color: theme => theme.palette.success.main}
                        }}
                    />
                </Tooltip>

                {/* Inhalt */}
                <Box sx={{flex: 1, pt: 3}}>
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
                        <Tooltip title={isComplete ? '' : 'Titel bearbeiten'}>
                        <Typography
                            variant="subtitle1"
                            component="div"
                            color="primary"
                            onClick={() => startEdit('title')}
                            sx={{
                                mb: 1, fontWeight: 'bold', textAlign: 'center',
                                cursor: isComplete ? 'default' : 'text',
                                '&:hover': !isComplete ? {backgroundColor: 'action.hover', borderRadius: 1} : {}
                            }}
                        >
                            {text.title}
                            {!Boolean(story) && <StoryChip text={text} size='small'/>}
                        </Typography>
                        </Tooltip>
                    )}

                    {/* Text */}
                    {editField === 'description' ? (
                        <TextField
                            autoFocus
                            size="small"
                            multiline
                            minRows={Math.max(3, (text.description || '').split('\n').length)}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                            fullWidth
                            inputProps={{style: {fontFamily: "'Brush Script MT', cursive", fontSize: '0.95rem'}}}
                        />
                    ) : (
                        <Tooltip title={isComplete ? '' : 'Text bearbeiten'}>
                        <pre
                            className="wrap-pre"
                            onClick={() => startEdit('description')}
                            style={{cursor: isComplete ? 'default' : 'text', minHeight: '3em'}}
                        >
                            {text.description}
                        </pre>
                        </Tooltip>
                    )}
                </Box>

                {/* Aus Story entfernen */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    padding: '2px',
                    zIndex: 1
                }}>
                    <Tooltip title="Aus Story entfernen">
                        <span>
                            <IconButton
                                disabled={isComplete}
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onRemoveFromStory(text); }}
                            >
                                <LinkOffIcon fontSize="small"/>
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
};
