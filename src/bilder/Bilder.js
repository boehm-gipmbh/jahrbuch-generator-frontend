import React from 'react';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
import {Grid} from '@mui/material';
import {
    Box,
    Button,
    Container,
    Checkbox,
    Paper,
    Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {api as bilderApi} from './api';
import {Priority} from './Priority';
import {Layout, newBild, setOpenBild} from '../layout';
import {api as storyApi} from '../stories';
import {StoryChip} from './StoryChip';
import {TextFields} from "@mui/icons-material";

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
    const dispatch = useDispatch();
    const {data} = bilderApi.endpoints.getBilder.useQuery(undefined, {pollingInterval: 10000});
    const [setComplete] = bilderApi.endpoints.setComplete.useMutation();
    const [triggerCapture] = bilderApi.endpoints.triggerCapture.useMutation();
    return <Layout>
        <Box sx={{mt: 2}}>
            <Button startIcon={<AddIcon/>} onClick={() => triggerCapture()}>
                Füge eine Fotoaufnahme hinzu
            </Button>
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
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                position: 'relative'
                            }}>
                                {/* Priority oben links */}
                                {Boolean(bild.priority) && (
                                    <Box
                                        onClick={(e) => {
                                            e.stopPropagation(); // Verhindert Bubbling
                                            dispatch(setOpenBild(bild));
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            left: 4,
                                            zIndex: 1,
                                            cursor: 'pointer' // Zeigt an, dass es klickbar ist
                                        }}
                                    >
                                        <Priority priority={bild.priority} />
                                    </Box>
                                )}

                                {/* Checkbox oben rechts (bleibt unverändert) */}
                                <Checkbox
                                    checked={Boolean(bild.complete)}
                                    checkedIcon={<CheckCircleIcon fontSize='small'/>}
                                    icon={<RadioButtonUncheckedIcon fontSize='small'/>}
                                    onChange={() => setComplete({bild, complete: !Boolean(bild.complete)})}
                                    sx={{position: 'absolute', top: 0, right: 0}}
                                />

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
                                            src={bild.pfad.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}
                                            alt={bild.description || ''}
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: 200,
                                                objectFit: 'contain'
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{mt: 'auto'}}>
                                        <Typography variant="body2">{bild.description}</Typography>
                                        {!Boolean(story) && <StoryChip bild={bild} size='small'/>}

                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    )) : null}
                </Grid>
            </Paper>
        </Container>
    </Layout>;
};
