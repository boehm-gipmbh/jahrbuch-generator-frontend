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
import {EditTextPriority} from './Priority';
import {clearOpenText, setOpenText} from '../layout';
import {SelectStory} from '../stories';
import {StoryChip} from './StoryChip';


export const EditText = () => {
  const dispatch = useDispatch();
  const openText = useSelector(state => state.layout.openText);
  const isNew = openText && (openText.id === undefined || openText.id === null);
  const isComplete = openText && Boolean(openText.complete);
  const dialogOpen = Boolean(openText);
  const close = () => dispatch(clearOpenText());
  const [addText] = api.endpoints.addText.useMutation();
  const [updateText] = api.endpoints.updateText.useMutation();
  const save = event => {
    event.preventDefault();
    if (event.currentTarget.checkValidity()) {
      const operation = isNew ? addText: updateText;
      operation(openText).then(({error}) => {
        if (!Boolean(error)) {
          close();
        } else {
          console.log(error);
        }
      });
    }
  };
  const [deleteText] = api.endpoints.deleteText.useMutation();
  const doDeleteText = () => {
    deleteText(openText).then(({error}) => {
      if (!Boolean(error)) {
        close();
      }
    })
  };
  const [invalid, setInvalid] = useState( {});
  const onChange = event => {
    const {name, value} = event.currentTarget;
    setInvalid({...invalid, [name]: !event.currentTarget.checkValidity()});
    dispatch(setOpenText({...openText,
      [name]: value,
    }));
  };
  const setPriority = priority => dispatch(setOpenText({...openText, priority}));
  return (
    <Dialog
      fullScreen
      open={dialogOpen}
    >
      {Boolean(openText) && (
        <Box component='form' onSubmit={save}>
          <AppBar sx={{position: 'relative'}}>
            <Toolbar>
              <IconButton
                edge='start'
                color='inherit'
                onClick={close}
                aria-label='close'
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
                {isNew ? 'Neue Erinnerung' : 'Ändere Erinnerung'}
              </Typography>
              <IconButton
                color='inherit'
                aria-label='delete'
                disabled={isComplete}
                onClick={doDeleteText}
              >
                <DeleteIcon />
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
                value={openText.title}
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
                value={openText.description ?? ''}
                onChange={onChange}
                error={Boolean(invalid.description)}
                multiline
                rows={4}
                inputProps={{
                  readOnly: isComplete
              }}
              />
            </Grid>
            <Grid container>
              <Grid item xs={6}>
                <CompleteChip text={openText} />
                <StoryChip text={openText} onDelete={() => dispatch(setOpenText({...openText, story: null}))} />
              </Grid>
              <Grid item xs={6} display='flex' justifyContent='flex-end'>
                <SelectStory
                  disabled={isComplete}
                  onSelectStory={story => dispatch(setOpenText({...openText, story}))}
                />
                <EditTextPriority
                    disabled={isComplete}
                    priority={openText.priority} setPriority={setPriority}
                />
              </Grid>
            </Grid>
          </Grid>
        </Box>
      )}
    </Dialog>
  );
};
