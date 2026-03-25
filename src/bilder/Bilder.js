import React, {useState, useRef, useMemo} from 'react';
import AuthImage from './AuthImage';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
import {Grid} from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import DeleteIcon from '@mui/icons-material/Delete';
import {IconButton, ButtonGroup, Tooltip} from '@mui/material';
import {Box, Button, Container, Checkbox, Paper, Typography, TextField, Snackbar} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddLinkIcon from '@mui/icons-material/AddLink';
import {MenuItem, Popover, MenuList, Divider} from '@mui/material';
import {api as bilderApi} from './api';
import {EditBildPriority} from './Priority';
import {Layout, newBild} from '../layout';
import {api as storyApi} from '../stories';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import {StoryChip} from './StoryChip';
import {BilderUploadDialog} from "./BilderUploadDialog";
import {byDateDesc, byDateAsc, matchesSearch, matchesDateRange} from '../sortUtils';
import {FilterBar, STORY_FILTER_NONE} from '../FilterBar';

const AssignToStoryButton = ({bild, stories}) => {
    const dispatch = useDispatch();
    const [updateBild] = bilderApi.endpoints.updateBild.useMutation();
    const [addStory] = storyApi.endpoints.addStory.useMutation();
    const [anchor, setAnchor] = useState(null);
    const [newStoryName, setNewStoryName] = useState('');
    const timerRef = useRef(null);
    const scheduleClose = () => { timerRef.current = setTimeout(() => setAnchor(null), 400); };
    const cancelClose = () => { if (timerRef.current) clearTimeout(timerRef.current); };

    const assignTo = (storyId, knownStory) => {
        const storyObj = knownStory || stories.find(s => s.id === storyId) || null;
        // Optimistisches Update: Cache sofort aktualisieren
        dispatch(bilderApi.util.updateQueryData('getBilder', undefined, draft => {
            const b = draft.find(b => b.id === bild.id);
            if (b) b.story = storyObj ? {id: storyObj.id, name: storyObj.name} : null;
        }));
        updateBild({...bild, story: storyObj ? {id: storyId} : null}).unwrap()
            .catch(e => {
                // Rollback bei Fehler
                dispatch(bilderApi.util.invalidateTags(['Bild']));
                console.error(e);
            });
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
    };

    return (
        <>
            <Tooltip title="Zu Story hinzufügen">
                <IconButton size="small"
                    onClick={e => { e.stopPropagation(); setAnchor(a => a ? null : e.currentTarget); }}>
                    <AddLinkIcon fontSize="small"/>
                </IconButton>
            </Tooltip>
            <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
                transitionDuration={0}
                anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                transformOrigin={{vertical: 'top', horizontal: 'left'}}
                slotProps={{paper: {onMouseEnter: cancelClose, onMouseLeave: scheduleClose}}}
            >
                <MenuList dense>
                    {stories.map(s => {
                        const isCurrent = bild.story?.id === s.id;
                        return (
                            <MenuItem key={s.id} selected={isCurrent} onClick={() => assignTo(s.id)}
                                sx={{display: 'flex', gap: 1}}>
                                {isCurrent ? <CheckIcon fontSize="small" color="primary"/> : <Box sx={{width: 20}}/>}
                                {s.name}
                            </MenuItem>
                        );
                    })}
                </MenuList>
                <Divider/>
                <Box sx={{p: 1, display: 'flex', gap: 0.5}} onMouseEnter={cancelClose}>
                    <TextField
                        size="small" placeholder="Neue Story…" value={newStoryName}
                        onChange={e => setNewStoryName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateAndAssign()}
                        autoComplete="off"
                        sx={{flex: 1}}
                    />
                    <IconButton size="small" onClick={handleCreateAndAssign} disabled={!newStoryName.trim()}>
                        <AddCircleOutlineIcon fontSize="small"/>
                    </IconButton>
                </Box>
            </Popover>
        </>
    );
};

const BildCard = ({bild, story, storiesLoaded, stories, onSetComplete, onUpdate, onRotate, onDelete}) => {
    const [editField, setEditField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [priority, setPriorityState] = useState(bild.priority);
    const [lockMsg, setLockMsg] = useState(false);
    const isComplete = Boolean(bild.complete);

    const startEdit = (field) => {
        if (isComplete) { setLockMsg(true); return; }
        setEditField(field); setEditValue(bild[field] ?? '');
    };
    const commitEdit = () => {
        if (editField && editValue !== (bild[editField] ?? '')) onUpdate({...bild, [editField]: editValue});
        setEditField(null);
    };
    const handleKeyDown = (e) => {
        if (editField === 'title' && e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') setEditField(null);
    };

    return (
        <>
        <Paper elevation={1} sx={{p: 2, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'}}>
            {/* Priority oben links */}
            <Box sx={{position: 'absolute', top: 0, left: 4, zIndex: 1}}>
                <EditBildPriority priority={priority} setPriority={(p) => { setPriorityState(p); onUpdate({...bild, priority: p}); }} disabled={isComplete}/>
            </Box>
            {/* Löschschutz oben rechts */}
            <Tooltip title={isComplete ? "Bild ist geschützt" : "Bild kann gelöscht werden"}>
                <Checkbox
                    checked={isComplete}
                    checkedIcon={<LockIcon color="success" fontSize='small'/>}
                    icon={<LockOpenIcon color="action" fontSize='small'/>}
                    onChange={() => onSetComplete({bild, complete: !isComplete})}
                    sx={{position: 'absolute', top: 0, right: 0, '&.Mui-checked': {color: theme => theme.palette.success.main}}}
                />
            </Tooltip>

            <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, pt: 3}}>
                {/* Titel */}
                {editField === 'title' ? (
                    <TextField autoFocus size="small" value={editValue} onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit} onKeyDown={handleKeyDown} fullWidth sx={{mb: 1}}/>
                ) : (
                    <Tooltip title={isComplete ? '' : 'Titel bearbeiten'}>
                    <Typography variant="subtitle1" component="div" sx={{mb: 1, fontWeight: 'medium', textAlign: 'center',
                        cursor: isComplete ? 'default' : 'text', '&:hover': !isComplete ? {backgroundColor: 'action.hover', borderRadius: 1} : {}}}
                        onClick={() => startEdit('title')}>
                        {bild.title || 'Kein Titel'}
                    </Typography>
                    </Tooltip>
                )}
                <Box sx={{display: 'flex', justifyContent: 'center', mb: 2}}>
                    <AuthImage
                        id={`bild-${bild.id}`}
                        src={`${bild.pfad.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}?v=${bild.lastRotated ?? 0}`}
                        alt={bild.description || ''}
                        thumb
                        style={{maxWidth: '100%', maxHeight: 200, objectFit: 'contain'}}
                    />
                </Box>
                {/* Beschreibung */}
                {editField === 'description' ? (
                    <TextField autoFocus size="small" multiline value={editValue} onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit} onKeyDown={handleKeyDown} fullWidth
                        inputProps={{style: {fontFamily: "'Brush Script MT', cursive", fontSize: '0.95rem'}}}/>
                ) : (
                    <Box sx={{mt: 'auto'}}>
                        <Tooltip title={isComplete ? '' : 'Beschreibung bearbeiten'}>
                        <pre className="wrap-pre" onClick={() => startEdit('description')}
                            style={{cursor: isComplete ? 'default' : 'text', minHeight: '1.5em'}}>
                            {bild.description}
                        </pre>
                        </Tooltip>
                    </Box>
                )}
                {!Boolean(story) && (
                    <Box sx={{position: 'absolute', left: 8, bottom: 8, zIndex: 2}}>
                        <StoryChip bild={bild} size='small'/>
                    </Box>
                )}
            </Box>

            {/* Aktionen unten rechts */}
            <Box sx={{position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1, padding: '2px', zIndex: 1}}>
                <ButtonGroup size="small">
                    <Tooltip title="90° links drehen">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRotate(-90); }}>
                            <RotateLeftIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="90° rechts drehen">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRotate(90); }}>
                            <RotateRightIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="180° drehen">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRotate(180); }}>
                            <SettingsBackupRestoreIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                    {storiesLoaded && <AssignToStoryButton bild={bild} stories={stories}/>}
                    <Tooltip title="Bild löschen">
                        <span>
                            <IconButton disabled={isComplete} size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                                <DeleteIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                </ButtonGroup>
            </Box>
        </Paper>
        <Snackbar
            open={lockMsg}
            autoHideDuration={2500}
            onClose={() => setLockMsg(false)}
            message="Entsperren zum Bearbeiten"
            anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        />
        </>
    );
};

export const Bilder = ({title = 'Bilder', filter = () => true}) => {
    const {storyId} = useParams();
    const {story, stories, storiesLoaded} = storyApi.endpoints.getStories.useQuery(undefined, {
        selectFromResult: ({data, isSuccess}) => ({
            story: data?.find(s => s.id === parseInt(storyId)),
            stories: data || [],
            storiesLoaded: isSuccess
        })
    });
    if (Boolean(story)) {
        title = story?.name;
        filter = bild => bild.story?.id === story.id;
    }
    const {data: capturesConfig} = bilderApi.endpoints.getCapturesConfig.useQuery();
    const dispatch = useDispatch();
    const {data} = bilderApi.endpoints.getBilder.useQuery(undefined, {pollingInterval: 10000});
    const [setComplete] = bilderApi.endpoints.setComplete.useMutation();
    const [updateBild] = bilderApi.endpoints.updateBild.useMutation();
    const [triggerCapture] = bilderApi.endpoints.triggerCapture.useMutation();
    const [rotateBild] = bilderApi.endpoints.rotateBild.useMutation();
    const [deleteBild] = bilderApi.endpoints.deleteBild.useMutation();

    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortField, setSortField] = useState('date');
    const [sortAsc, setSortAsc] = useState(false);
    const [storyFilter, setStoryFilter] = useState(new Set());

    const q = search.toLowerCase();
    const filteredBilder = useMemo(() => {
        const base = (data || []).filter(bild => {
            if (!filter(bild)) return false;
            if (!matchesSearch(bild, q)) return false;
            if (!matchesDateRange(bild, dateFrom, dateTo)) return false;
            if (storyFilter.size > 0) {
                const key = bild.story ? bild.story.id : STORY_FILTER_NONE;
                if (!storyFilter.has(key)) return false;
            }
            return true;
        });
        const cmp = sortField === 'priority'
            ? (sortAsc ? (a, b) => (a.priority ?? 0) - (b.priority ?? 0) : (a, b) => (b.priority ?? 0) - (a.priority ?? 0))
            : (sortAsc ? byDateAsc : byDateDesc);
        return [...base].sort(cmp);
    }, [data, filter, q, dateFrom, dateTo, sortField, sortAsc, storyFilter]);

    return <Layout>
        <Box sx={{mt: 2}}>
            {capturesConfig?.enabled && (<Button
                    autoFocus
                    startIcon={<AddIcon/>}
                    onClick={() => triggerCapture()}
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{
                        fontWeight: 'bold', fontSize: '1.2rem', py: 2, px: 4, boxShadow: 3, mb: 2
                    }}
                >
                    Foto shot&nbsp;!
                </Button>)}
            <BilderUploadDialog/>
        </Box>
        <Container sx={{mt: theme => theme.spacing(2)}}>
            <Paper sx={{p: 2}}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    {title}
                </Typography>

                <FilterBar
                    search={search} setSearch={setSearch}
                    dateFrom={dateFrom} setDateFrom={setDateFrom}
                    dateTo={dateTo} setDateTo={setDateTo}
                    sortField={sortField} setSortField={setSortField}
                    sortAsc={sortAsc} setSortAsc={setSortAsc}
                    stories={storiesLoaded && !story ? stories : undefined}
                    storyFilter={storyFilter} setStoryFilter={setStoryFilter}
                />

                <Grid container spacing={2}>
                    {filteredBilder.map(bild => (
                        <Grid item xs={12} sm={6} key={bild.id}>
                            <BildCard
                                bild={bild}
                                story={story}
                                storiesLoaded={storiesLoaded}
                                stories={stories}
                                onSetComplete={(args) => setComplete(args)}
                                onUpdate={(updated) => updateBild(updated)}
                                onRotate={(degrees) => rotateBild({bildId: bild.id, degrees}).unwrap()
                                    .then(() => dispatch(bilderApi.util.invalidateTags(['Bild'])))
                                    .catch(e => console.error(e))}
                                onDelete={() => deleteBild(bild).unwrap()
                                    .then(() => dispatch(bilderApi.util.invalidateTags(['Bild'])))
                                    .catch(e => console.error(e))}
                            />
                        </Grid>))}
                </Grid>
            </Paper>
        </Container>

    </Layout>;
};