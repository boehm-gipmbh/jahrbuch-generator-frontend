import React from 'react';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
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
               Füge Deine Bilder hinzu
            </Button>
        </Box>
        <Container sx={{mt: theme => theme.spacing(2)}}>
            <Paper sx={{p: 2}}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    {title}
                </Typography>
                <Table size='small'>
                    <TableBody>
                        {data && Array.from(data).filter(filter).sort(bildSort).map(bild =>
                            <TableRow key={bild.id}>
                                <TableCell sx={{width: '2rem'}}>
                                    <Checkbox
                                        checked={Boolean(bild.complete)}
                                        checkedIcon={<CheckCircleIcon fontSize='small'/>}
                                        icon={<RadioButtonUncheckedIcon fontSize='small'/>}
                                        onChange={() => setComplete({bild, complete: !Boolean(bild.complete)})}
                                    />
                                </TableCell>
                                <TableCell
                                    onClick={() => dispatch(setOpenBild(bild))}
                                    sx={{cursor: 'pointer'}}
                                >
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <Box sx={{flex: 1}}>
                                            {!Boolean(story) && <StoryChip bild={bild} size='small'/>}
                                            <img
                                                src={bild.pfad.replace(/^.*\/captures\//, '/captures/')}
                                                alt={bild.description || ''}
                                                style={{ maxWidth: 600 , maxHeight: 300, marginRight: 8, verticalAlign: 'middle' }}
                                            />
                                            <Typography variant="body2">{bild.description}</Typography>
                                        </Box>
                                        <Box>
                                            {Boolean(bild.priority) && <Priority priority={bild.priority}/>}
                                        </Box>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>
        </Container>
    </Layout>;
};
