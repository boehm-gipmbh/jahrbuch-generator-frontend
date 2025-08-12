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
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {api as texteApi} from '../texte/api';
import {api as bilderApi} from '../bilder/api';
import {Priority} from '../texte/Priority';
import {Layout, newText, setOpenBild, setOpenText} from '../layout';
import {api as storyApi} from './api.js';
import {StoryChip} from '../texte/StoryChip';

const textSort = (t1, t2) => {
    const p1 = t1.priority ?? Number.MAX_SAFE_INTEGER;
    const p2 = t2.priority ?? Number.MAX_SAFE_INTEGER;
    if (p1 !== p2) {
        return p1 - p2
    }
    return t1.id - t2.id;
};
const bildSort = (t1, t2) => {
    const p1 = t1.id ?? Number.MAX_SAFE_INTEGER;
    const p2 = t2.id ?? Number.MAX_SAFE_INTEGER;
    if (p1 !== p2) {
        return p2 - p1
    }
    return t2.id - t1.id;
};

export const Story = ({title = 'Deine Geschichte', filterText = () => false, filterBild = () => false}) => {
    const {storyId} = useParams();
    const {story} = storyApi.endpoints.getStories.useQuery(undefined, {
        selectFromResult: ({data}) => ({story: data?.find(s => s.id === parseInt(storyId))})
    });
    if (Boolean(story)) {
        title = story?.name;
        filterText = text => text.story?.id === story.id;
        filterBild = bild => bild.story?.id === story.id;
    }
    const dispatch = useDispatch();
    const {data} = texteApi.endpoints.getTexte.useQuery(undefined, {pollingInterval: 10000});
    console.log(data);
    const dataBilder = bilderApi.endpoints.getBilder.useQuery(undefined, {pollingInterval: 10000});
    console.log(dataBilder);
    const [setComplete] = texteApi.endpoints.setComplete.useMutation();
    const [triggerCapture] = bilderApi.endpoints.triggerCapture.useMutation();
    return <Layout>
        <Container sx={{mt: theme => theme.spacing(2)}}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                {title}
            </Typography>
            <Grid container spacing={2}>
                {/* Linke Spalte für Texte */}
                <Grid item xs={12} md={6}>
                    <Box sx={{mt: 2}}>
                        <Button startIcon={<AddIcon/>} onClick={() => dispatch(newText({story: story}))}>
                            Füge Deine Erinnerung hinzu
                        </Button>
                    </Box>
                    <Paper sx={{p: 2}}>
                        <Table size='small'>
                            <TableBody>
                                {data ? Array.from(data).filter(filterText).sort(textSort).map(text =>
                                    <TableRow key={text.id}>
                                        <TableCell sx={{width: '2rem'}}>
                                            <Checkbox
                                                checked={Boolean(text.complete)}
                                                checkedIcon={<CheckCircleIcon fontSize='small'/>}
                                                icon={<RadioButtonUncheckedIcon fontSize='small'/>}
                                                onChange={() => setComplete({text, complete: !Boolean(text.complete)})}
                                            />
                                        </TableCell>
                                        <TableCell
                                            onClick={() => dispatch(setOpenText(text))}
                                            sx={{cursor: 'pointer'}}
                                        >
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                <Box sx={{flex: 1}}>
                                                    <Typography variant="subtitle1" component="span"  color="primary"
                                                                sx={{fontWeight: 'bold'}}>
                                                        {text.title}
                                                    </Typography> {!Boolean(story) &&
                                                    <StoryChip text={text} size='small'/>}
                                                </Box>
                                                <Box>
                                                    {Boolean(text.priority) && <Priority priority={text.priority}/>}
                                                </Box>
                                            </Box>
                                            <Box sx={{flex: 1}}>
                                                {text.description} {!Boolean(story) &&
                                                <StoryChip text={text} size='small'/>}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ):null}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                {/* Rechte Spalte für Bilder */}
                <Grid item xs={12} md={6}>
                    <Box sx={{mt: 2}}>
                        <Button startIcon={<AddIcon/>} onClick={() => triggerCapture()}>
                            Füge eine Fotoaufnahme hinzu
                        </Button>
                    </Box>
                    <Paper sx={{p: 2}}>
                        <Grid container spacing={2}>
                            {dataBilder?.data ? Array.from(dataBilder.data).filter(filterBild).sort(bildSort).map(bild => (
                                <Grid item xs={12} key={bild.id}>
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

                                        {/* Checkbox oben rechts */}
                                        <Checkbox
                                            checked={Boolean(bild.complete)}
                                            checkedIcon={<CheckCircleIcon fontSize='small'/>}
                                            icon={<RadioButtonUncheckedIcon fontSize='small'/>}
                                            onChange={() => setComplete({bild, complete: !Boolean(bild.complete)})}
                                            sx={{position: 'absolute', top: 0, right: 0}}
                                        />

                                        <Box
                                            onClick={() => dispatch(setOpenBild(bild))}
                                            sx={{cursor: 'pointer', display: 'flex', flexDirection: 'column', flex: 1, pt: 3}}
                                        >
                                            <Typography variant="subtitle1" component="div" color="primary"
                                                        sx={{mb: 1, fontWeight: 'bold', textAlign: 'center'}}>
                                                {bild.title || 'Kein Titel'}
                                            </Typography>

                                            <Box sx={{display: 'flex', justifyContent: 'center', mb: 2}}>
                                                <img
                                                    src={bild.pfad?.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}
                                                    alt={bild.description || ''}
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: 300,
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
                </Grid>
            </Grid>
        </Container>
    </Layout>
};
