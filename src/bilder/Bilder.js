import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
import {Grid} from '@mui/material';
// Importiere die benötigten Icons
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import {IconButton, ButtonGroup, Tooltip} from '@mui/material';
import {
    Box, Button, Container, Checkbox, Paper, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import {api as bilderApi} from './api';
import {Priority} from './Priority';
import {Layout, newBild, setOpenBild} from '../layout';
import {api as storyApi} from '../stories';
import {StoryChip} from './StoryChip';
import {BilderUploadDialog} from "./BilderUploadDialog";

const bildSort = (t1, t2) => {
    const p1 = t1.id ?? Number.MAX_SAFE_INTEGER;
    const p2 = t2.id ?? Number.MAX_SAFE_INTEGER;
    if (p1 !== p2) {
        return p2 - p1
    }
    return t2.id - t1.id;
};

export const Bilder = ({title = 'Bilder', filter = () => true}) => {
    const {storyId} = useParams();
    const {story} = storyApi.endpoints.getStories.useQuery(undefined, {
        selectFromResult: ({data}) => ({story: data?.find(s => s.id === parseInt(storyId))})
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
    // Um das Bild nach der Rotation zum Neuladen zu zwingen,
    // musst du einen dynamischen Parameter zur Bild-URL hinzufügen.
    // Implementiere einen State für die Bildversion:
    const [imageVersion, setImageVersion] = useState(0);
    const [getBildById] = bilderApi.endpoints.getBildById.useLazyQuery();
    const SHOW_ROTATION_BUTTONS = false; // auf true setzen, um Buttons wieder anzuzeigen
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
                                        <img
                                            id={`bild-${bild.id}`}
                                            src={`${bild.pfad.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}?v=${imageVersion}`}
                                            alt={bild.description || ''}
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
                                        right: 8,
                                        bottom: 8,
                                        zIndex: 2
                                      }}>
                                        <StoryChip bild={bild} size='small'/>
                                      </Box>
                                    )}
                                </Box>
                                {/* Rotationsbuttons nur anzeigen, wenn SHOW_ROTATION_BUTTONS true ist */}
                                {SHOW_ROTATION_BUTTONS && (<Box
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
                                                                // Cache invalidieren
                                                                dispatch(bilderApi.util.invalidateTags(['Bild']));

                                                                // Browser-Cache umgehen (sofortige visuelle Aktualisierung)
                                                                setImageVersion(prev => prev + 1);

                                                                // Optional: Redux-State aktualisieren, wenn getBildById funktioniert
                                                                return getBildById(bild.id).unwrap()
                                                                    .then(updatedBild => {
                                                                        dispatch(setOpenBild(updatedBild));
                                                                    })
                                                                    .catch(error => {
                                                                        console.error("Fehler beim Laden des aktualisierten Bildes:", error);
                                                                        // Trotz Fehler beim Laden fortfahren
                                                                    });
                                                            })
                                                            .catch(error => {
                                                                console.error("Fehler bei der Bildrotation:", error);
                                                                // Optional: Benutzer über Fehler informieren
                                                                // toast.error("Bild konnte nicht rotiert werden");
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
                                                                // Cache invalidieren
                                                                dispatch(bilderApi.util.invalidateTags(['Bild']));

                                                                // Browser-Cache umgehen (sofortige visuelle Aktualisierung)
                                                                setImageVersion(prev => prev + 1);

                                                                // Optional: Redux-State aktualisieren, wenn getBildById funktioniert
                                                                return getBildById(bild.id).unwrap()
                                                                    .then(updatedBild => {
                                                                        dispatch(setOpenBild(updatedBild));
                                                                    })
                                                                    .catch(error => {
                                                                        console.error("Fehler beim Laden des aktualisierten Bildes:", error);
                                                                        // Trotz Fehler beim Laden fortfahren
                                                                    });
                                                            })
                                                            .catch(error => {
                                                                console.error("Fehler bei der Bildrotation:", error);
                                                                // Optional: Benutzer über Fehler informieren
                                                                //toast.error("Bild konnte nicht rotiert werden");
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
                                                                // Cache invalidieren
                                                                dispatch(bilderApi.util.invalidateTags(['Bild']));

                                                                // Browser-Cache umgehen (sofortige visuelle Aktualisierung)
                                                                setImageVersion(prev => prev + 1);

                                                                // Optional: Redux-State aktualisieren, wenn getBildById funktioniert
                                                                return getBildById(bild.id).unwrap()
                                                                    .then(updatedBild => {
                                                                        dispatch(setOpenBild(updatedBild));
                                                                    })
                                                                    .catch(error => {
                                                                        console.error("Fehler beim Laden des aktualisierten Bildes:", error);
                                                                        // Trotz Fehler beim Laden fortfahren
                                                                    });
                                                            })
                                                            .catch(error => {
                                                                console.error("Fehler bei der Bildrotation:", error);
                                                                // Optional: Benutzer über Fehler informieren
                                                                // toast.error("Bild konnte nicht rotiert werden");
                                                            });
                                                    }}
                                                    size="small"
                                                >
                                                    <SettingsBackupRestoreIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </ButtonGroup>
                                    </Box>)}
                            </Paper>
                        </Grid>)) : null}
                </Grid>
            </Paper>
        </Container>
    </Layout>;
};