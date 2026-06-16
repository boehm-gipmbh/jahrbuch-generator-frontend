import {useState, memo} from 'react';
import {Paper, Box, Typography, Tooltip, Checkbox, IconButton, TextField, Snackbar, InputAdornment,
    MenuItem, Popover, MenuList, Divider} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddLinkIcon from '@mui/icons-material/AddLink';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {useDispatch} from 'react-redux';
import {EditTextPriority} from './Priority';
import {StoryChip} from './StoryChip';
import {api} from './api';
import {api as storyApi} from '../stories';
import {ClusterButton} from '../stories/ClusterButton';
import {clusterColor} from '../stories/clusterColor';
import {ReactionButtons} from '../reactions/ReactionButtons';
import {CommentThread} from '../comments/CommentThread';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '';

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
            .then(story => { dispatch(storyApi.util.invalidateTags(['Story'])); assignTo(story.id, story); })
            .catch(e => console.error(e));
        setNewStoryName('');
        setAnchor(null);
    };

    return (
        <>
            <Tooltip title="Story zuweisen">
                <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}>
                    <AddLinkIcon fontSize="small"/>
                </IconButton>
            </Tooltip>
            <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
                     anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}>
                <MenuList dense sx={{minWidth: 180}}>
                    {text.story && <MenuItem onClick={() => assignTo(null, null)} sx={{color: 'text.secondary'}}>Zurück in Pool</MenuItem>}
                    {text.story && <Divider/>}
                    {(stories || []).map(s => (
                        <MenuItem key={s.id} onClick={() => assignTo(s.id)} selected={text.story?.id === s.id}>
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

export const PreviewTextCard = memo(({text, hero = false, story, storiesLoaded, stories, onSetComplete, storyBilder = [], storyTexte = []}) => {
    const [updateText] = api.endpoints.updateText.useMutation();
    const [deleteText] = api.endpoints.deleteText.useMutation();
    const [setHero] = api.endpoints.setHero.useMutation();
    const [editField, setEditField] = useState(null);
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
        if (editField && editValue !== (text[editField] ?? '')) updateText({...text, [editField]: editValue});
        setEditField(null);
    };
    const handleKeyDown = (e) => {
        if (editField === 'title' && e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') setEditField(null);
    };
    const setPriority = (p) => { setPriorityState(p); updateText({...text, priority: p}); };

    return (
        <Paper elevation={hero ? 2 : 1} sx={{p: hero ? 3 : 2, display: 'flex', flexDirection: 'column', position: 'relative',
            borderLeft: text.clusterId ? `4px solid ${clusterColor(text.clusterId)}` : hero ? '4px solid #f59e0b' : undefined,
            boxShadow: hero ? '0 4px 16px rgba(0,0,0,0.18)' : undefined}}>
            <Box sx={{position: 'absolute', top: 0, left: 4, zIndex: 1}}>
                <span onClick={() => isComplete && setLockMsg(true)}>
                    <EditTextPriority priority={priority} setPriority={setPriority} disabled={isComplete}/>
                </span>
            </Box>
            <Tooltip title={isComplete ? "Text ist geschützt" : "Text kann gelöscht werden"}>
                <Checkbox checked={isComplete}
                    checkedIcon={<LockIcon color="success" fontSize='small'/>}
                    icon={<LockOpenIcon color="action" fontSize='small'/>}
                    onChange={() => onSetComplete({text, complete: !isComplete})}
                    sx={{position: 'absolute', top: 0, right: 0, '&.Mui-checked': {color: t => t.palette.success.main}}}/>
            </Tooltip>

            <Box sx={{flex: 1, pt: 3}}>
                {editField === 'title' ? (
                    <TextField autoFocus size="small" value={editValue} fullWidth sx={{mb: 1}}
                        onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={handleKeyDown}/>
                ) : (
                    <Tooltip title={isComplete ? '' : 'Titel bearbeiten'} followCursor>
                        <Typography variant={hero ? 'h6' : 'subtitle1'} component="div" color="primary" onClick={() => startEdit('title')}
                            sx={{mb: 0.5, fontWeight: 'bold', textAlign: 'center',
                                cursor: isComplete ? 'default' : 'text',
                                '&:hover': !isComplete ? {backgroundColor: 'action.hover', borderRadius: 1} : {}}}>
                            {text.title}
                            {!Boolean(story) && <StoryChip text={text} size='small'/>}
                        </Typography>
                    </Tooltip>
                )}
                {(text.user?.name || text.created) && (
                    <Typography variant="caption" color="text.disabled" sx={{display: 'block', textAlign: 'center', mb: 1, lineHeight: 1.4}}>
                        {[text.user?.name, fmtDate(text.created)].filter(Boolean).join(' · ')}
                    </Typography>
                )}
                {editField === 'description' ? (
                    <TextField autoFocus size="small" multiline value={editValue} fullWidth
                        minRows={Math.max(3, (text.description || '').split('\n').length)}
                        onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={handleKeyDown}
                        inputProps={{style: {fontFamily: "'Brush Script MT', cursive", fontSize: '0.95rem'}}}
                        InputProps={{endAdornment: editValue ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onMouseDown={e => { e.preventDefault(); setEditValue(''); }}>
                                    <ClearIcon fontSize="small"/>
                                </IconButton>
                            </InputAdornment>
                        ) : null}}/>
                ) : (
                    <Tooltip title={isComplete ? '' : 'Text bearbeiten'} followCursor>
                        <pre className="wrap-pre" onClick={() => startEdit('description')}
                            style={{cursor: isComplete ? 'default' : 'text', minHeight: '3em',
                                border: !text.description ? '1px solid rgba(0,0,0,0.23)' : 'none',
                                borderRadius: 4, padding: '8.5px 14px',
                                color: text.description ? 'inherit' : 'rgba(0,0,0,0.38)'}}>
                            {text.description || 'Erinnerung hinzufügen …'}
                        </pre>
                    </Tooltip>
                )}
            </Box>

            <CommentThread targetType="TEXT" targetId={text.id}
                prefix={<ReactionButtons targetType="TEXT" targetId={text.id}/>}
                actionButtons={
                    <>
                        {storiesLoaded && <AssignTextToStoryButton text={text} stories={stories}/>}
                        <ClusterButton mode="text" item={text} storyBilder={storyBilder} storyTexte={storyTexte}/>
                        <Tooltip title={text.hero ? 'Hero entfernen' : 'Als Hero markieren (volle Breite)'}>
                            <IconButton size="small" onClick={() => setHero({text, hero: !text.hero})}
                                sx={text.hero ? {color: 'warning.main'} : {}}>
                                {text.hero ? <StarIcon fontSize="small"/> : <StarBorderIcon fontSize="small"/>}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="In Papierkorb legen">
                            <span onClick={() => isComplete && setLockMsg(true)}>
                                <IconButton disabled={isComplete} size="small"
                                    onClick={e => { e.stopPropagation(); deleteText(text); }}>
                                    <DeleteOutlineIcon fontSize="small"/>
                                </IconButton>
                            </span>
                        </Tooltip>
                    </>
                }/>
            <Snackbar open={lockMsg} autoHideDuration={2500} onClose={() => setLockMsg(false)}
                message="Entsperren zum Bearbeiten" anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}/>
        </Paper>
    );
}, (prev, next) =>
    prev.text === next.text &&
    prev.hero === next.hero &&
    prev.story === next.story &&
    prev.storiesLoaded === next.storiesLoaded &&
    prev.stories === next.stories &&
    prev.storyBilder === next.storyBilder &&
    prev.storyTexte === next.storyTexte
);
