import {useState, memo} from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {Paper, Box, Typography, Tooltip, Checkbox, IconButton, TextField, Snackbar, InputAdornment,
    MenuItem, Popover, MenuList, Divider} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddLinkIcon from '@mui/icons-material/AddLink';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import {useDispatch} from 'react-redux';
import {EditTextPriority} from './Priority';
import {StoryChip} from './StoryChip';
import {api} from './api';
import {api as storyApi} from '../stories';

const AssignTextToStoryButton = ({text, stories}) => {
    const dispatch = useDispatch();
    const [updateText] = api.endpoints.updateText.useMutation();
    const [addStory] = storyApi.endpoints.addStory.useMutation();
    const [anchor, setAnchor] = useState(null);
    const [newStoryName, setNewStoryName] = useState('');

    const assignTo = (storyId, knownStory) => {
        const storyObj = knownStory || stories.find(s => s.id === storyId) || null;
        updateText({...text, story: storyObj ? {id: storyId} : null}).unwrap()
            .then(() => dispatch(api.util.invalidateTags(['Text'])))
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
                                  selected={text.story?.id === s.id}>
                            {text.story?.id === s.id && <CheckIcon fontSize="small" sx={{mr: 1}}/>}
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

export const SortableTextCard = memo(({text, story, storiesLoaded, stories, onSetComplete, onRemoveFromStory}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: `text-${text.id}`
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [updateText] = api.endpoints.updateText.useMutation();
    const [deleteText] = api.endpoints.deleteText.useMutation();
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
                    <span onClick={() => isComplete && setLockMsg(true)}>
                        <EditTextPriority
                            priority={priority}
                            setPriority={setPriority}
                            disabled={isComplete}
                        />
                    </span>
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
                        <Tooltip title={isComplete ? '' : 'Titel bearbeiten'} followCursor>
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
                            InputProps={{endAdornment: editValue ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onMouseDown={e => { e.preventDefault(); setEditValue(''); }}><ClearIcon fontSize="small"/></IconButton>
                                </InputAdornment>
                            ) : null}}
                        />
                    ) : (
                        <Tooltip title={isComplete ? '' : 'Text bearbeiten'} followCursor>
                        <pre
                            className="wrap-pre"
                            onClick={() => startEdit('description')}
                            style={{cursor: isComplete ? 'default' : 'text', minHeight: '3em',
                                border: !text.description ? '1px solid rgba(0,0,0,0.23)' : 'none',
                                borderRadius: 4,
                                padding: '8.5px 14px',
                                marginBottom: 40,
                                color: text.description ? 'inherit' : 'rgba(0,0,0,0.38)'}}
                        >
                            {text.description || 'Erinnerung hinzufügen …'}
                        </pre>
                        </Tooltip>
                    )}
                </Box>

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
                    {storiesLoaded && <AssignTextToStoryButton text={text} stories={stories}/>}
                    <Tooltip title="Aus Story entfernen">
                        <span onClick={() => isComplete && setLockMsg(true)}>
                            <IconButton
                                disabled={isComplete}
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onRemoveFromStory(text); }}
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
                                onClick={(e) => { e.stopPropagation(); deleteText(text); }}
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
    prev.text === next.text &&
    prev.story === next.story &&
    prev.storiesLoaded === next.storiesLoaded &&
    prev.stories === next.stories
);
