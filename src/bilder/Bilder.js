import React, {useState, useRef} from 'react';
import AuthImage from './AuthImage';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
import {Grid} from '@mui/material';
// Importiere die benötigten Icons
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import DeleteIcon from '@mui/icons-material/Delete';
import {IconButton, ButtonGroup, Tooltip} from '@mui/material';
import {
    Box, Button, Container, Checkbox, Paper, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddLinkIcon from '@mui/icons-material/AddLink';
import {MenuItem, Popover, MenuList, Divider, TextField} from '@mui/material';
import {api as bilderApi} from './api';
import {Priority} from './Priority';
import {Layout, newBild, setOpenBild} from '../layout';
import {api as storyApi} from '../stories';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import {StoryChip} from './StoryChip';
import {BilderUploadDialog} from "./BilderUploadDialog";
import {sortBy, byPriorityDesc, byIdDesc} from '../sortUtils';

const bildSort = sortBy(byPriorityDesc, byIdDesc);

const AssignToStoryButton = ({bild, stories}) => {
    const dispatch = useDispatch();
    const [updateBild] = bilderApi.endpoints.updateBild.useMutation();
    const [addStory] = storyApi.endpoints.addStory.useMutation();
    const [anchor, setAnchor] = useState(null);
    const [newStoryName, setNewStoryName] = useState('');
    const timerRef = useRef(null);
    const scheduleClose = () => { timerRef.current = setTimeout(() => setAnchor(null), 400); };
    const cancelClose = () => { if (timerRef.current) clearTimeout(timerRef.current); };

    const assignTo = (storyId) => {
        const storyObj = stories.find(s => s.id === storyId) || null;
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
                assignTo(story.id);
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
    const [triggerCapture] = bilderApi.endpoints.triggerCapture.useMutation();
    const [rotateBild] = bilderApi.endpoints.rotateBild.useMutation();
    const [deleteBild] = bilderApi.endpoints.deleteBild.useMutation();

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

                <Grid container spacing={2}>
                    {data ? Array.from(data).filter(filter).sort(bildSort).map(bild => (
                        <Grid item xs={12} sm={6} key={bild.id}>
                            <Paper elevation={1} sx={{
                                p: 2, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'
                            }}>
                                {/* Priority oben links */}
                                {Boolean(bild.priority) && (<Box
                                        onClick={(e) => {
                                            e.stopPropagation(); // Verhindert Bubbling
                                            dispatch(setOpenBild(bild));
                                        }}
                                        sx={{
                                            position: 'absolute', top: 4, left: 4, zIndex: 1, cursor: 'pointer' // Zeigt an, dass es klickbar ist
                                        }}
                                    >
                                        <Priority priority={bild.priority}/>
                                    </Box>)}
                                {/* Löschschutz oben rechts */}
                                <Tooltip title={bild.complete ? "Bild ist geschützt" : "Bild kann gelöscht werden"}>
                                    <Checkbox
                                        checked={Boolean(bild.complete)}
                                        checkedIcon={<LockIcon color="success" fontSize='small'/>}
                                        icon={<LockOpenIcon color="action" fontSize='small'/>}
                                        onChange={() => setComplete({bild, complete: !Boolean(bild.complete)})}
                                        sx={{
                                            position: 'absolute', top: 0, right: 0, '&.Mui-checked': {
                                                color: theme => theme.palette.success.main
                                            }
                                        }}
                                    />
                                </Tooltip>

                                <Box
                                    onClick={() => dispatch(setOpenBild(bild))}
                                    sx={{cursor: 'pointer', display: 'flex', flexDirection: 'column', flex: 1}}
                                >
                                    <Typography variant="subtitle1" component="div"
                                                sx={{mb: 1, fontWeight: 'medium', textAlign: 'center'}}>
                                        {bild.title || 'Kein Titel'}
                                    </Typography>
                                    <Box sx={{display: 'flex', justifyContent: 'center', mb: 2}}>
                                        <AuthImage
                                            id={`bild-${bild.id}`}
                                            src={`${bild.pfad.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}?v=${bild.lastRotated ?? 0}`}
                                            alt={bild.description || ''}
                                            thumb
                                            style={{
                                                maxWidth: '100%', maxHeight: 200, objectFit: 'contain'
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{mt: 'auto'}}>
                                      <pre className="wrap-pre">
                                        {bild.description}
                                      </pre>
                                    </Box>
                                    {!Boolean(story) && (
                                      <Box sx={{
                                        position: 'absolute',
                                        left: 8,
                                        bottom: 8,
                                        zIndex: 2
                                      }}>
                                        <StoryChip bild={bild} size='small'/>
                                      </Box>
                                    )}
                                </Box>
                                <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 4,
                                            right: 4,
                                            backgroundColor: 'rgba(255,255,255,0.7)',
                                            borderRadius: 1,
                                            padding: '2px',
                                            zIndex: 1
                                        }}
                                    >
                                        <ButtonGroup size="small">
                                            <Tooltip title="90° links drehen">
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        rotateBild({bildId: bild.id, degrees: -90}).unwrap()
                                                            .then(() => {
                                                                dispatch(bilderApi.util.invalidateTags(['Bild']));
                                                            })
                                                            .catch(error => {
                                                                console.error("Fehler bei der Bildrotation:", error);
                                                            });
                                                    }}
                                                    size="small"
                                                >
                                                    <RotateLeftIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="90° rechts drehen">
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        rotateBild({bildId: bild.id, degrees: 90}).unwrap()
                                                            .then(() => {
                                                                dispatch(bilderApi.util.invalidateTags(['Bild']));
                                                            })
                                                            .catch(error => {
                                                                console.error("Fehler bei der Bildrotation:", error);
                                                            });
                                                    }}
                                                    size="small"
                                                >
                                                    <RotateRightIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="180° drehen">
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        rotateBild({bildId: bild.id, degrees: 180}).unwrap()
                                                            .then(() => {
                                                                dispatch(bilderApi.util.invalidateTags(['Bild']));
                                                            })
                                                            .catch(error => {
                                                                console.error("Fehler bei der Bildrotation:", error);
                                                            });
                                                    }}
                                                    size="small"
                                                >
                                                    <SettingsBackupRestoreIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                            {storiesLoaded && <AssignToStoryButton bild={bild} stories={stories}/>}
                                            <Tooltip title="Bild löschen">
                                                <span>
                                                    <IconButton
                                                        disabled={Boolean(bild.complete)}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteBild(bild).unwrap()
                                                                .then(() => {
                                                                    dispatch(bilderApi.util.invalidateTags(['Bild']));
                                                                })
                                                                .catch(error => {
                                                                    console.error("Fehler beim Löschen:", error);
                                                                });
                                                        }}
                                                        size="small"
                                                    >
                                                        <DeleteIcon fontSize="small"/>
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </ButtonGroup>
                                    </Box>
                            </Paper>
                        </Grid>)) : null}
                </Grid>
            </Paper>
        </Container>

    </Layout>;
};