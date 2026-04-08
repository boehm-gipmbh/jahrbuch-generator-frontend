import React, {useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Alert, Avatar, Box, Button, Container, Snackbar, TextField, Typography} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import {useDispatch, useSelector} from 'react-redux';
import {register} from './redux';
import {useForm} from '../useForm';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const jwt = useSelector(state => state.auth.jwt);
  const {values, setValue, isValid, error, setError, onChange} = useForm({
    initialValues: {name: '', email: '', password: ''}
  });
  const [tokenState, setTokenState] = useState('loading'); // loading | valid | invalid
  const [tokenData, setTokenData] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenState('invalid');
      return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/auth/validate-token?token=${token}`)
      .then(res => {
        if (res.ok) {
          return res.json().then(data => { setTokenData(data); setTokenState('valid'); });
        }
        setTokenState('invalid');
      })
      .catch(() => setTokenState('invalid'));
  }, [token]);

  const passwordError = (() => {
    const p = values.password;
    if (!p) return null;
    if (p.length < 8) return 'Mindestens 8 Zeichen';
    if (!/[A-Z]/.test(p)) return 'Mindestens 1 Großbuchstabe';
    if (!/[a-z]/.test(p)) return 'Mindestens 1 Kleinbuchstabe';
    if (!/[0-9]/.test(p)) return 'Mindestens 1 Zahl';
    if (!/[^a-zA-Z0-9]/.test(p)) return 'Mindestens 1 Sonderzeichen';
    return null;
  })();

  const sendRegister = () => {
    if (!isValid) return;
    dispatch(register({token, name: values.name, email: values.email, password: values.password}))
      .then(({meta, payload}) => {
        if (meta.requestStatus === 'fulfilled') {
          setRegistered(true);
        } else if (payload?.status === 400) {
          setError('Ungültiger Username oder Passwort entspricht nicht den Anforderungen');
        } else if (payload?.status === 409) {
          navigate(`/login?next=${encodeURIComponent(`/register?token=${token}`)}`);
        } else if (payload?.status === 410) {
          setError('Einladungslink ist nicht mehr gültig');
        } else {
          setError('Fehler bei der Registrierung');
        }
      });
  };

  const joinGroup = () => {
    fetch(`${process.env.REACT_APP_API_URL}/auth/join-group?token=${token}`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${jwt}`}
    }).then(res => {
      if (res.ok) {
        setJoined(true);
      } else {
        setError('Fehler beim Beitreten der Gruppe');
      }
    }).catch(() => setError('Fehler beim Beitreten der Gruppe'));
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

  if (joined) {
    return (
      <Container maxWidth="xs">
        <Box sx={{mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
          <GroupsIcon sx={{fontSize: 64, color: 'success.main'}}/>
          <Typography component="h1" variant="h5">Gruppe beigetreten!</Typography>
          <Alert severity="success">
            Du bist jetzt Mitglied der Gruppe <strong>{tokenData?.group?.name}</strong>.
            Wechsle in der App oben rechts zur Gruppenansicht.
          </Alert>
          <Button variant="contained" href="/bilder">Zur App</Button>
        </Box>
      </Container>
    );
  }

  // Eingeloggter User mit Gruppen-Einladung → direkt beitreten
  if (jwt && tokenState === 'valid' && tokenData?.group) {
    return (
      <Container maxWidth="xs">
        <Box sx={{mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
          <Avatar sx={{m: 1}}><GroupsIcon/></Avatar>
          <Typography component="h1" variant="h5">Gruppe beitreten</Typography>
          <Alert severity="info">
            Du bist eingeladen, der Gruppe <strong>{tokenData.group.name}</strong> beizutreten.
          </Alert>
          <Button fullWidth variant="contained" onClick={joinGroup} sx={{mt: 2}}>
            Gruppe beitreten
          </Button>
          <Snackbar
            open={Boolean(error)} message={error}
            autoHideDuration={6000} onClose={() => setError(null)}
          />
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
            onChange={e => setValue('name', e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
            value={values.name}
            inputProps={{maxLength: 30}}
            helperText="3–30 Zeichen, nur Buchstaben, Ziffern, - und _"
          />
          <TextField margin="normal" required fullWidth
            label="E-Mail" name="email" type="email" onChange={onChange} value={values.email}
          />
          <TextField margin="normal" required fullWidth
            label="Passwort" name="password" type="password" onChange={onChange} value={values.password}
            onKeyDown={e => e.key === 'Enter' && sendRegister()}
            error={Boolean(values.password && passwordError)}
            helperText={(values.password && passwordError) || '8+ Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen'}
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