import React, {useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Avatar, Box, Button, Container, Snackbar, Typography, Alert} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import {PasswordField} from './PasswordField';

const validatePassword = (p) => {
  if (!p) return null;
  if (p.length < 8) return 'Mindestens 8 Zeichen';
  if (!/[A-Z]/.test(p)) return 'Mindestens 1 Großbuchstabe';
  if (!/[a-z]/.test(p)) return 'Mindestens 1 Kleinbuchstabe';
  if (!/[0-9]/.test(p)) return 'Mindestens 1 Zahl';
  if (!/[^a-zA-Z0-9]/.test(p)) return 'Mindestens 1 Sonderzeichen';
  return null;
};

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const passwordError = validatePassword(password);
  const confirmError = confirm && password !== confirm ? 'Passwörter stimmen nicht überein' : null;
  const canSubmit = password && !passwordError && !confirmError && token;

  const sendReset = () => {
    if (!canSubmit) return;
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password?token=${token}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({password}),
    })
      .then(res => {
        if (res.ok) {
          navigate('/login', {state: {resetSuccess: true}});
        } else if (res.status === 410) {
          setError('Der Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen an.');
        } else if (res.status === 404) {
          setError('Ungültiger Link. Bitte fordere einen neuen Reset-Link an.');
        } else {
          setError('Fehler beim Zurücksetzen. Bitte versuche es erneut.');
        }
      })
      .catch(() => setError('Netzwerkfehler. Bitte versuche es erneut.'))
      .finally(() => setLoading(false));
  };

  if (!token) {
    return (
      <Container maxWidth="xs">
        <Box sx={{mt: 8, textAlign: 'center'}}>
          <Alert severity="error">Ungültiger Link. Bitte fordere einen neuen Reset-Link an.</Alert>
          <Button href="/forgot-password" variant="outlined" sx={{mt: 2}}>
            Neuen Link anfordern
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Avatar sx={{m: 1}}>
          <LockResetIcon/>
        </Avatar>
        <Typography component="h1" variant="h5">
          Neues Passwort setzen
        </Typography>
        <Box noValidate sx={{mt: 2, width: '100%'}}>
          <PasswordField
            margin="normal" required fullWidth autoFocus
            label="Neues Passwort" name="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={Boolean(password && passwordError)}
            helperText={(password && passwordError) || '8+ Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen'}
          />
          <PasswordField
            margin="normal" required fullWidth
            label="Passwort bestätigen" name="confirm"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendReset()}
            error={Boolean(confirmError)}
            helperText={confirmError || ''}
          />
          <Button
            fullWidth variant="contained" onClick={sendReset}
            disabled={loading || !canSubmit}
            sx={{mt: 3, mb: 2}}
          >
            Passwort zurücksetzen
          </Button>
        </Box>
      </Box>
      <Snackbar
        open={Boolean(error)} message={error}
        autoHideDuration={8000} onClose={() => setError(null)}
      />
    </Container>
  );
};