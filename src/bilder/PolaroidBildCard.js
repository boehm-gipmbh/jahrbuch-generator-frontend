import {useState, memo} from 'react';
import {Paper, Box, Typography, Tooltip, Checkbox, IconButton, TextField, Snackbar, InputAdornment,
    MenuItem, Popover, MenuList, Divider} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddLinkIcon from '@mui/icons-material/AddLink';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {useDispatch} from 'react-redux';
import AuthImage from './AuthImage';
import {EditBildPriority} from './Priority';
import {api} from './api';
import {api as storyApi} from '../stories';
import {ClusterButton} from '../stories/ClusterButton';
import {clusterColor} from '../stories/clusterColor';
import {ReactionButtons} from '../reactions/ReactionButtons';
import {CommentThread} from '../comments/CommentThread';

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
                    {bild.story && <MenuItem onClick={() => assignTo(null, null)} sx={{color: 'text.secondary'}}>Zurück in Pool</MenuItem>}
                    {bild.story && <Divider/>}
                    {(stories || []).map(s => (
                        <MenuItem key={s.id} onClick={() => assignTo(s.id)} selected={bild.story?.id === s.id}>
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

export const PolaroidBildCard = memo(({bild, hero = false, story, storiesLoaded, stories, onSetComplete, storyBilder = [], storyTexte = []}) => {
    const [updateBild] = api.endpoints.updateBild.useMutation();
    const [deleteBild] = api.endpoints.deleteBild.useMutation();
    const [setHauptbild] = api.endpoints.setHauptbild.useMutation();
    const [editField, setEditField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [priority, setPriorityState] = useState(bild.priority);
    const [lockMsg, setLockMsg] = useState(false);
    const isComplete = Boolean(bild.complete);
    const accent = clusterColor(bild.clusterId);

    const startEdit = (field) => {
        if (isComplete) { setLockMsg(true); return; }
        setEditField(field);
        setEditValue(bild[field] ?? '');
    };
    const commitEdit = () => {
        if (editField && editValue !== (bild[editField] ?? '')) updateBild({...bild, [editField]: editValue});
        setEditField(null);
    };
    const handleKeyDown = (e) => {
        if (editField === 'title' && e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') setEditField(null);
    };
    const setPriority = (p) => { setPriorityState(p); updateBild({...bild, priority: p}); };

    return (
        <Paper elevation={2} sx={{
            display: 'flex', flexDirection: 'column', position: 'relative',
            bgcolor: '#fff',
            borderLeft: accent ? `4px solid ${accent}` : hero ? '4px solid #f59e0b' : undefined,
            boxShadow: hero
                ? '0 4px 16px rgba(0,0,0,0.18)'
                : '0 2px 8px rgba(0,0,0,0.12)',
        }}>
            {/* Controls overlay top-left */}
            <Box sx={{position: 'absolute', top: 0, left: 4, zIndex: 2}}>
                <span onClick={() => isComplete && setLockMsg(true)}>
                    <EditBildPriority priority={priority} setPriority={setPriority} disabled={isComplete}/>
                </span>
            </Box>

            {/* Lock top-right */}
            <Tooltip title={isComplete ? 'Bild ist geschützt' : 'Bild kann gelöscht werden'}>
                <Checkbox checked={isComplete}
                    checkedIcon={<LockIcon color="success" fontSize="small"/>}
                    icon={<LockOpenIcon color="action" fontSize="small"/>}
                    onChange={() => onSetComplete({bild, complete: !isComplete})}
                    sx={{position: 'absolute', top: 0, right: 0, zIndex: 2,
                        '&.Mui-checked': {color: t => t.palette.success.main}}}/>
            </Tooltip>

            {/* Hero star */}
            {hero && (
                <Box sx={{position: 'absolute', top: 36, right: 4, zIndex: 2}}>
                    <Tooltip title="Hero entfernen">
                        <IconButton size="small" onClick={() => setHauptbild({bild, hauptbild: false})}
                            sx={{color: 'warning.main'}}>
                            <StarIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Image */}
            <Box sx={{overflow: 'hidden', flexShrink: 0}}>
                <AuthImage
                    src={bild.pfad?.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}
                    alt={bild.title || ''} thumb
                    style={{width: '100%', height: 'auto', display: 'block'}}
                />
            </Box>

            {/* Polaroid-Bereich: weißer Rahmen unten */}
            <Box sx={{p: hero ? 2 : 1.5, pt: hero ? 1.5 : 1}}>
                {/* Meta */}
                {(bild.user?.name || bild.created) && (
                    <Typography variant="caption" color="text.disabled"
                        sx={{display: 'block', textAlign: 'center', mb: 0.5, lineHeight: 1.3}}>
                        {[bild.user?.name,
                            !isSameDay(bild.capturedAt, bild.created) && bild.capturedAt ? fmtDate(bild.capturedAt) : null,
                        ].filter(Boolean).join(' · ')}
                    </Typography>
                )}

                {/* Titel */}
                {editField === 'title' ? (
                    <TextField autoFocus size="small" value={editValue} fullWidth sx={{mb: 0.5}}
                        onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={handleKeyDown}
                        inputProps={{style: {textAlign: 'center', fontWeight: 'bold'}}}/>
                ) : (
                    <Tooltip title={isComplete ? '' : 'Titel bearbeiten'} followCursor>
                        <Typography variant={hero ? 'subtitle1' : 'body2'} onClick={() => startEdit('title')}
                            sx={{fontWeight: 'bold', textAlign: 'center', mb: 0.5, color: 'primary.main',
                                cursor: isComplete ? 'default' : 'text',
                                '&:hover': !isComplete ? {bgcolor: 'action.hover', borderRadius: 0.5} : {}}}>
                            {bild.title || 'Kein Titel'}
                        </Typography>
                    </Tooltip>
                )}

                {/* Beschreibung in Kursivschrift wie PDF */}
                {editField === 'description' ? (
                    <TextField autoFocus size="small" multiline value={editValue} fullWidth
                        onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={handleKeyDown}
                        inputProps={{style: {fontFamily: "'Brush Script MT', cursive", fontSize: '0.9rem'}}}
                        InputProps={{endAdornment: editValue ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onMouseDown={e => { e.preventDefault(); setEditValue(''); }}>
                                    <ClearIcon fontSize="small"/>
                                </IconButton>
                            </InputAdornment>
                        ) : null}}/>
                ) : (
                    <Tooltip title={isComplete ? '' : 'Beschreibung bearbeiten'} followCursor>
                        <Typography variant="body2" onClick={() => startEdit('description')}
                            sx={{
                                fontFamily: "'Brush Script MT', cursive",
                                fontSize: hero ? '1.1rem' : '0.9rem',
                                textAlign: 'left', color: bild.description ? 'text.primary' : 'text.disabled',
                                cursor: isComplete ? 'default' : 'text', minHeight: '1.4em',
                                '&:hover': !isComplete ? {bgcolor: 'action.hover', borderRadius: 0.5} : {},
                            }}>
                            {bild.description || 'Beschreibung hinzufügen …'}
                        </Typography>
                    </Tooltip>
                )}
            </Box>

            {/* Actions */}
            <CommentThread targetType="BILD" targetId={bild.id}
                prefix={<ReactionButtons targetType="BILD" targetId={bild.id}/>}
                actionButtons={
                    <>
                        {storiesLoaded && <AssignBildToStoryButton bild={bild} stories={stories}/>}
                        <ClusterButton mode="bild" item={bild} storyBilder={storyBilder} storyTexte={storyTexte}/>
                        {!hero && (
                            <Tooltip title="Als Hero markieren">
                                <IconButton size="small" onClick={() => setHauptbild({bild, hauptbild: true})}>
                                    <StarBorderIcon fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="In Papierkorb legen">
                            <span onClick={() => isComplete && setLockMsg(true)}>
                                <IconButton disabled={isComplete} size="small"
                                    onClick={e => { e.stopPropagation(); deleteBild(bild); }}>
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
    prev.bild === next.bild &&
    prev.hero === next.hero &&
    prev.story === next.story &&
    prev.storiesLoaded === next.storiesLoaded &&
    prev.stories === next.stories &&
    prev.storyBilder === next.storyBilder &&
    prev.storyTexte === next.storyTexte
);
