import React from 'react';
import {useForm} from '../useForm';
import {useDispatch, useSelector} from 'react-redux';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material';
import {closeNewStory} from '../layout';
import {api} from './';

export const NewStoryDialog = () => {
  const {values, invalid, isValid, error, setError, clearForm, onChange} = useForm({
    initialValues: {name: ''}
  });
  const dispatch = useDispatch();
  const newStoryOpen = useSelector(state => state.layout.newStoryOpen);
  const close = () => dispatch(closeNewStory());
  const [addStory] = api.endpoints.addStory.useMutation();
  const canSave = isValid && Boolean(values.name);
  const save = () => {
    addStory(values).then(({error: saveError}) => {
      if (!Boolean(saveError)) {
        clearForm();
        close();
      } else {
        setError('Unknown error, please try again');
      }
    });
  };
  return (
    <Dialog open={newStoryOpen} onClose={close}>
      <DialogTitle>Neue Geschichte</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Füge eine neue Geschichte hinzu.
        </DialogContentText>
        {Boolean(error) && <Alert severity='error'>{error}</Alert>}
        <TextField
          autoFocus
          fullWidth
          variant='standard'
          label='Name'
          name='name'
          value={values.name}
          onChange={onChange}
          onKeyDown={e => e.key === 'Enter' && canSave && save()}
          error={Boolean(invalid.name)}
          required
        />
        <TextField
            autoFocus
            fullWidth
            variant='standard'
            label='Beschreibung'
            name='description'
            value={values.description}
            onChange={onChange}
            onKeyDown={e => e.key === 'Enter' && canSave && save()}
            error={Boolean(invalid.name)}
            required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button onClick={save} disabled={!canSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
