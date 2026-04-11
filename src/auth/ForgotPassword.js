import React, {useState} from 'react';
import {Avatar, Box, Button, Container, Snackbar, TextField, Typography, Alert} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import {Link} from 'react-router-dom';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendReset = () => {
    if (!email.trim()) return;
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email}),
    })
      .then(res => {
        if (res.ok) {
          setSent(true);
        } else {
          setError('Fehler beim Senden. Bitte versuche es erneut.');
        }
      })
      .catch(() => setError('Netzwerkfehler. Bitte versuche es erneut.'))
      .finally(() => setLoading(false));
  };

  if (sent) {
    return (
      <Container maxWidth="xs">
        <Box sx={{mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
          <MarkEmailReadIcon sx={{fontSize: 64, color: 'success.main'}}/>
          <Typography component="h1" variant="h5">E-Mail gesendet</Typography>
          <Alert severity="success">
            Falls diese E-Mail-Adresse registriert ist, wurde ein Reset-Link gesendet.
            Bitte prüfe deinen Posteingang.
          </Alert>
          <Button component={Link} to="/login" variant="outlined" sx={{mt: 1}}>
            Zurück zur Anmeldung
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
          Passwort vergessen
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{mt: 1, textAlign: 'center'}}>
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.
        </Typography>
        <Box noValidate sx={{mt: 2, width: '100%'}}>
          <TextField
            margin="normal" required fullWidth autoFocus
            label="E-Mail" name="email" type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendReset()}
          />
          <Button
            fullWidth variant="contained" onClick={sendReset}
            disabled={loading || !email.trim()}
            sx={{mt: 3, mb: 2}}
          >
            Reset-Link senden
          </Button>
          <Box sx={{textAlign: 'center'}}>
            <Link to="/login" style={{textDecoration: 'none', color: 'inherit'}}>
              <Typography variant="body2" color="primary">
                Zurück zur Anmeldung
              </Typography>
            </Link>
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={Boolean(error)} message={error}
        autoHideDuration={6000} onClose={() => setError(null)}
      />
    </Container>
  );
};