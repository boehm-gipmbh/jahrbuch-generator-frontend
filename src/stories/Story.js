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
import {api as texteApi} from '../texte/api';
import {api as bilderApi} from '../bilder/api';
import {Priority} from '../texte/Priority';
import {Layout, newText, setOpenText} from '../layout';
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
    return <Layout>
        <Box sx={{mt: 2}}>
            <Button startIcon={<AddIcon />} onClick={() => dispatch(newText({story: story}))}>
                Füge Deine Erinnerungen hinzu
            </Button>
        </Box>
        <Container sx={{mt: theme => theme.spacing(2)}}>
            <Paper sx={{p: 2}}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    {title}
                </Typography>
                <Table size='small'>
                    <TableBody>
                        {data && Array.from(data).filter(filterText).sort(textSort).map(text =>
                            <TableRow key={text.id}>
                                <TableCell sx={{width: '2rem'}}>
                                    <Checkbox
                                        checked={Boolean(text.complete)}
                                        checkedIcon={<CheckCircleIcon fontSize='small' />}
                                        icon={<RadioButtonUncheckedIcon fontSize='small' />}
                                        onChange={() => setComplete({text, complete: !Boolean(text.complete)})}
                                    />
                                </TableCell>
                                <TableCell
                                    onClick={() => dispatch(setOpenText(text))}
                                    sx={{cursor: 'pointer'}}
                                >
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <Box sx={{flex: 1}}>
                                            {text.title} {!Boolean(story) && <StoryChip text={text} size='small' />}
                                        </Box>
                                        <Box>
                                            {Boolean(text.priority) && <Priority priority={text.priority} />}
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
