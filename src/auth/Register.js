import React, {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Alert, Avatar, Box, Button, Container, Snackbar, TextField, Typography} from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import {useDispatch} from 'react-redux';
import {register} from './redux';
import {useForm} from '../useForm';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const dispatch = useDispatch();
  const {values, isValid, error, setError, onChange} = useForm({
    initialValues: {name: '', email: '', password: ''}
  });
  const [tokenState, setTokenState] = useState('loading'); // loading | valid | invalid
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenState('invalid');
      return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/auth/validate-token?token=${token}`)
      .then(res => {
        setTokenState(res.ok ? 'valid' : 'invalid');
      })
      .catch(() => setTokenState('invalid'));
  }, [token]);

  const sendRegister = () => {
    if (!isValid) return;
    dispatch(register({token, name: values.name, email: values.email, password: values.password}))
      .then(({meta, payload}) => {
        if (meta.requestStatus === 'fulfilled') {
          setRegistered(true);
        } else if (payload?.status === 409) {
          setError('Name oder E-Mail bereits vergeben');
        } else if (payload?.status === 410) {
          setError('Einladungslink ist nicht mehr gültig');
        } else {
          setError('Fehler bei der Registrierung');
        }
      });
  };

  if (registered) {
    return (
      <Container maxWidth="xs">
        <Box sx={{mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
          <MarkEmailReadIcon sx={{fontSize: 64, color: 'success.main'}}/>
          <Typography component="h1" variant="h5">Fast geschafft!</Typography>
          <Alert severity="success">
            Wir haben dir eine E-Mail an <strong>{values.email}</strong> geschickt.
            Bitte klicke auf den Link darin, um dein Konto zu aktivieren.
          </Alert>
        </Box>
      </Container>
    );
  }

  if (tokenState === 'loading') {
    return (
      <Container maxWidth="xs">
        <Box sx={{mt: 8, textAlign: 'center'}}>
          <Typography>Link wird überprüft…</Typography>
        </Box>
      </Container>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <Container maxWidth="xs">
        <Box sx={{mt: 8, textAlign: 'center'}}>
          <Typography variant="h6" color="error">Ungültiger oder abgelaufener Einladungslink</Typography>
          <Typography variant="body2" sx={{mt: 1}}>
            Bitte fordere einen neuen Link an.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Avatar sx={{m: 1}}>
          <HowToRegIcon/>
        </Avatar>
        <Typography component="h1" variant="h5">
          Registrieren
        </Typography>
        <Box noValidate sx={{mt: 1}}>
          <TextField margin="normal" required fullWidth autoFocus
            label="Username" name="name"
            onChange={e => onChange({target: {name: 'name', value: e.target.value.replace(/\s/g, '')}})}
            value={values.name}
            helperText="Keine Leerzeichen erlaubt"
          />
          <TextField margin="normal" required fullWidth
            label="E-Mail" name="email" type="email" onChange={onChange} value={values.email}
          />
          <TextField margin="normal" required fullWidth
            label="Passwort" name="password" type="password" onChange={onChange} value={values.password}
            onKeyDown={e => e.key === 'Enter' && sendRegister()}
          />
          <Button fullWidth variant="contained" onClick={sendRegister} sx={{mt: 3, mb: 2}}>
            Konto erstellen
          </Button>
        </Box>
      </Box>
      <Snackbar
        open={Boolean(error)} message={error}
        autoHideDuration={6000} onClose={() => setError(null)}
      />
    </Container>
  );
};