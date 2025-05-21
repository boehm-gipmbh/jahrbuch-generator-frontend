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
import {api} from './api';
import {Priority} from './Priority';
import {Layout, newTask, setOpenTask} from '../layout';
import {api as projectApi} from '../projects';
import {ProjectChip} from './ProjectChip';

const bildSort = (t1, t2) => {
    const p1 = t1.quality ?? Number.MAX_SAFE_INTEGER;
    const p2 = t2.quality ?? Number.MAX_SAFE_INTEGER;
    if (p1 !== p2) {
        return p1 - p2
    }
    return t1.id - t2.id;
};

export const Bilder = ({title = 'Bilder', filter = () => true}) => {
    const {projectId} = useParams();
    const {project} = projectApi.endpoints.getProjects.useQuery(undefined, {
        selectFromResult: ({data}) => ({project: data?.find(p => p.id === parseInt(projectId))})
    });
    if (Boolean(project)) {
        title = project?.name;
        filter = bild => bild.project?.id === project.id;
    }
    const dispatch = useDispatch();
    const {data} = api.endpoints.getBilder.useQuery(undefined, {pollingInterval: 10000});
    const [setProtect] = api.endpoints.setProtect.useMutation();
    return <Layout>
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
                                        checked={Boolean(bild.protect)}
                                        checkedIcon={<CheckCircleIcon fontSize='small'/>}
                                        icon={<RadioButtonUncheckedIcon fontSize='small'/>}
                                        onChange={() => setProtect({bild, protect: !Boolean(bild.protect)})}
                                    />
                                </TableCell>

                                <TableCell
                                    onClick={() => dispatch(setOpenTask(bild))}
                                    sx={{cursor: 'pointer'}}
                                >

                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <Box sx={{flex: 1}}>
                                            {!Boolean(project) && <ProjectChip bild={bild} size='small'/>}
                                            <img
                                                src={bild.pfad.replace(/^.*\/captures\//, '/captures/')}
                                                alt={bild.beschreibung || ''}
                                                style={{ maxWidth: 800 , maxHeight: 400, marginRight: 8, verticalAlign: 'middle' }}
                                            />
                                        </Box>

                                        <Box>
                                            {Boolean(bild.quality) && <Priority quality={bild.quality}/>}
                                        </Box>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <Box sx={{mt: 2}}>
                    <Button startIcon={<AddIcon/>} onClick={() => dispatch(newTask({project: project}))}>
                        Add Bild
                    </Button>
                </Box>
            </Paper>
        </Container>
    </Layout>;
};
