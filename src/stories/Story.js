import React from 'react';
import AuthImage from '../bilder/AuthImage';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
import {Grid, Tooltip} from '@mui/material';
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
import '../App.css';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {api as texteApi} from '../texte/api';
import {api as bilderApi} from '../bilder/api';
import {Priority} from '../texte/Priority';
import {Layout, newText, setOpenBild, setOpenText} from '../layout';
import {api as storyApi} from './api.js';
import {StoryChip} from '../texte/StoryChip';
import {BilderUploadDialog} from "../bilder/BilderUploadDialog";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import {sortBy, byPositionAsc, byPriorityDesc, byPriorityAsc, byIdDesc, byIdAsc} from '../sortUtils';
import {DndContext, closestCenter, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {SortableContext, arrayMove, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {restrictToVerticalAxis} from '@dnd-kit/modifiers';
import {SortableBildCard} from '../bilder/SortableBildCard';
import {SortableTextRow} from '../texte/SortableTextRow';

const textSort = sortBy(byPositionAsc, byPriorityAsc, byIdAsc);
const bildSort = sortBy(byPositionAsc, byPriorityDesc, byIdDesc);

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
    const dataBilder = bilderApi.endpoints.getBilder.useQuery(undefined, {pollingInterval: 10000});
    const [setTextComplete] = texteApi.endpoints.setComplete.useMutation();
    const [setBildComplete] = bilderApi.endpoints.setComplete.useMutation();
    const [deleteBild] = bilderApi.endpoints.deleteBild.useMutation();
    const [deleteText] = texteApi.endpoints.deleteText.useMutation();
    const [reorderBilder] = bilderApi.endpoints.reorderBilder.useMutation();
    const [reorderTexte] = texteApi.endpoints.reorderTexte.useMutation();
    const [triggerCapture] = bilderApi.endpoints.triggerCapture.useMutation();
    const {data: capturesConfig} = bilderApi.endpoints.getCapturesConfig.useQuery();
    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 8}}));
    const sortedBilder = dataBilder?.data ? Array.from(dataBilder.data).filter(filterBild).sort(bildSort) : [];
    const sortedTexte = data ? Array.from(data).filter(filterText).sort(textSort) : [];
    const handleBilderDragEnd = (event) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sortedBilder.findIndex(b => b.id === active.id);
        const newIndex = sortedBilder.findIndex(b => b.id === over.id);
        const reordered = arrayMove(sortedBilder, oldIndex, newIndex);
        if (story) {
            reorderBilder({storyId: story.id, bildIds: reordered.map(b => b.id)});
        }
    };
    const handleTexteDragEnd = (event) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sortedTexte.findIndex(t => t.id === active.id);
        const newIndex = sortedTexte.findIndex(t => t.id === over.id);
        const reordered = arrayMove(sortedTexte, oldIndex, newIndex);
        if (story) {
            reorderTexte({storyId: story.id, textIds: reordered.map(t => t.id)});
        }
    };
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
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            modifiers={[restrictToVerticalAxis]}
                            onDragEnd={handleTexteDragEnd}
                        >
                            <SortableContext items={sortedTexte.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                <Table size='small'>
                                    <TableBody>
                                        {sortedTexte.map(text =>
                                            <SortableTextRow
                                                key={text.id}
                                                text={text}
                                                story={story}
                                                onClickText={(t) => dispatch(setOpenText(t))}
                                                onSetComplete={(args) => setTextComplete(args)}
                                                onDeleteText={(t) => deleteText(t).unwrap().then(() => dispatch(texteApi.util.invalidateTags(['Text']))).catch(e => console.error(e))}
                                            />
                                        )}
                                    </TableBody>
                                </Table>
                            </SortableContext>
                        </DndContext>
                    </Paper>
                </Grid>

                {/* Rechte Spalte für Bilder */}
                <Grid item xs={12} md={6}>
                    <Box sx={{mt: 2}}>
                        {capturesConfig?.enabled && (
                            <Button startIcon={<AddIcon/>} onClick={() => triggerCapture()}>
                                Füge eine Fotoaufnahme hinzu
                            </Button>
                        )}
                     <BilderUploadDialog story={story}/>
                    </Box>
                    <Paper sx={{p: 2}}>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            modifiers={[restrictToVerticalAxis]}
                            onDragEnd={handleBilderDragEnd}
                        >
                            <SortableContext items={sortedBilder.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                <Grid container spacing={2}>
                                    {sortedBilder.map(bild => (
                                        <SortableBildCard
                                            key={bild.id}
                                            bild={bild}
                                            story={story}
                                            onClickBild={(b) => dispatch(setOpenBild(b))}
                                            onSetComplete={(args) => setBildComplete(args)}
                                            onDeleteBild={(b) => deleteBild(b).unwrap().then(() => dispatch(bilderApi.util.invalidateTags(['Bild']))).catch(e => console.error(e))}
                                        />
                                    ))}
                                </Grid>
                            </SortableContext>
                        </DndContext>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    </Layout>
};
