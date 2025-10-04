import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {
    AppBar,
    Box,
    Button,
    Dialog,
    Grid,
    IconButton,
    TextField,
    Toolbar,
    Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import {api} from './api';
import {CompleteChip} from './CompleteChip';
import {EditBildPriority} from './Priority';
import {clearOpenBild, setOpenBild} from '../layout';
import {SelectStory} from '../stories';
import {StoryChip} from './StoryChip';


export const EditBild = () => {
    const dispatch = useDispatch();
    const openBild = useSelector(state => state.layout.openBild);
    const isNew = openBild && (openBild.id === undefined || openBild.id === null);
    const isComplete = openBild && Boolean(openBild.complete);
    const dialogOpen = Boolean(openBild);
    const close = () => dispatch(clearOpenBild());
    const [addBild] = api.endpoints.addBild.useMutation();
    const [updateBild] = api.endpoints.updateBild.useMutation();
    const save = event => {
        event.preventDefault();
        if (event.currentTarget.checkValidity()) {
            const operation = isNew ? addBild : updateBild;
            operation(openBild).then(({error}) => {
                if (!Boolean(error)) {
                    close();
                } else {
                    console.log(error);
                }
            });
        }
    };
    const [deleteBild] = api.endpoints.deleteBild.useMutation();
    const doDeleteBild = () => {
        deleteBild(openBild).then(({error}) => {
            if (!Boolean(error)) {
                close();
            }
        })
    };
    const [invalid, setInvalid] = useState({});
    const onChange = event => {
        const {name, value} = event.currentTarget;
        setInvalid({...invalid, [name]: !event.currentTarget.checkValidity()});
        dispatch(setOpenBild({
            ...openBild,
            [name]: value,
        }));
    };
    const setPriority = priority => dispatch(setOpenBild({...openBild, priority}));
    return (
        <Dialog
            fullScreen
            open={dialogOpen}
        >
            {Boolean(openBild) && (
                <Box component='form' onSubmit={save}>
                    <AppBar sx={{position: 'relative'}}>
                        <Toolbar>
                            <IconButton
                                edge='start'
                                color='inherit'
                                onClick={close}
                                aria-label='close'
                            >
                                <CloseIcon/>
                            </IconButton>
                            <Typography sx={{ml: 2, flex: 1}} variant='h6' component='div'>
                                {isNew ? 'Neues Bild' : 'Ändere Bild'}
                            </Typography>
                            <IconButton
                                color='inherit'
                                aria-label='delete'
                                disabled={isComplete}
                                onClick={doDeleteBild}
                            >
                                <DeleteIcon/>
                            </IconButton>
                            <Button type='submit' color='inherit' disabled={isComplete}>
                                save
                            </Button>
                        </Toolbar>
                    </AppBar>
                    <Grid container sx={{p: 2}}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                margin='normal'
                                label='Title'
                                name='title'
                                value={openBild.title}
                                onChange={onChange}
                                error={Boolean(invalid.title)}
                                required
                                autoFocus
                                inputProps={{
                                    readOnly: isComplete
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                margin='normal'
                                label='Description'
                                name='description'
                                value={openBild.description ?? ''}
                                onChange={onChange}
                                error={Boolean(invalid.description)}
                                multiline
                                rows={4}
                                inputProps={{
                                    readOnly: isComplete
                                }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      fontFamily: "'Brush Script MT', cursive",
                                      fontSize: '0.95rem',
                                    }
                                  }}
                            />
                        </Grid>
                        <Grid container>
                            <Grid item xs={6}>
                                <CompleteChip bild={openBild}/>
                                <StoryChip bild={openBild}
                                           onDelete={() => dispatch(setOpenBild({...openBild, story: null}))}/>
                            </Grid>
                            <Grid item xs={6} display='flex' justifyContent='flex-end'>
                                <SelectStory
                                    disabled={isComplete}
                                    onSelectStory={story => dispatch(setOpenBild({...openBild, story}))}
                                />
                                <EditBildPriority
                                    disabled={isComplete}
                                    priority={openBild.priority} setPriority={setPriority}
                                />
                            </Grid>
                        </Grid>
                        <Grid item xs={12} sx={{mt: 2, display: 'flex', justifyContent: 'center'}}>
                            <img
                                src={openBild.pfad.startsWith('/') ? `/api/bilder/extern${openBild.pfad}` : openBild.pfad}
                                alt={openBild.description || ''}
                                style={{
                                    maxWidth: 600,
                                    maxHeight: 300,
                                    verticalAlign: 'middle'
                                }}
                            />
                        </Grid>
                    </Grid>

                </Box>
            )}
        </Dialog>
    );
};
