import React from 'react';
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
import {useForm} from '../useForm';
import {api} from './';
import {closeChangePassword} from "../layout";

export const ChangePasswordDialog = () => {
  const {values, invalid, isValid, error, setError, clearForm, onChange} = useForm({
    initialValues: {currentPassword: '', newPassword: '', confirmPassword: ''}
  });
  const dispatch = useDispatch();
  const changePasswordOpen = useSelector(state => state.layout.changePasswordOpen);
  const close = () => dispatch(closeChangePassword());
  const [changePassword] = api.endpoints.changePassword.useMutation();
  const canSave = isValid && Boolean(values.currentPassword) && Boolean(values.newPassword)
      && values.newPassword === values.confirmPassword;
  const save = () => {
    changePassword(values).then(({error}) => {
      if (!Boolean(error)) {
        clearForm();
        close();
      } else if (error?.status === 409) {
          setError('Current password is incorrect');
      } else {
        setError('Unknown error, please try again');
      }
    });
  };
  return (
    <Dialog open={changePasswordOpen} onClose={close}>
      <DialogTitle>Change password</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Change your user password.
        </DialogContentText>
        {Boolean(error) && <Alert severity='error'>{error}</Alert>}
        <TextField type='password' fullWidth margin='dense' variant='standard' label='Current password'
          name='currentPassword' value={values.currentPassword} onChange={onChange}
          required error={Boolean(invalid.currentPassword)}
          autoFocus
        />
        <TextField type='password' fullWidth margin='dense' variant='standard' label='New password'
          name='newPassword' value={values.newPassword} onChange={onChange}
          required error={Boolean(invalid.newPassword)}
        />
        <TextField type='password' fullWidth margin='dense' variant='standard' label='Confirm new password'
                   name='confirmPassword' value={values.confirmPassword} onChange={onChange}
                   required error={Boolean(invalid.confirmPassword)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button onClick={save} disabled={!canSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
