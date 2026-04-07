import React, {useEffect, useState} from 'react';
import {useSearchParams, Link} from 'react-router-dom';
import {Alert, Box, Button, CircularProgress, Container, Typography} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState('loading'); // loading | success | expired | error

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/auth/verify-email?token=${token}`)
      .then(res => {
        if (res.ok) setState('success');
        else if (res.status === 410) setState('expired');
        else setState('error');
      })
      .catch(() => setState('error'));
  }, [token]);

  return (
    <Container maxWidth="xs">
      <Box sx={{mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
        {state === 'loading' && (
          <>
            <CircularProgress/>
            <Typography>E-Mail wird bestätigt…</Typography>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircleOutlineIcon sx={{fontSize: 64, color: 'success.main'}}/>
            <Typography component="h1" variant="h5">E-Mail bestätigt!</Typography>
            <Alert severity="success">
              Dein Konto ist jetzt aktiv. Du kannst dich jetzt einloggen.
            </Alert>
            <Button variant="contained" component={Link} to="/login">
              Zum Login
            </Button>
          </>
        )}
        {state === 'expired' && (
          <>
            <ErrorOutlineIcon sx={{fontSize: 64, color: 'warning.main'}}/>
            <Typography component="h1" variant="h5">Link abgelaufen</Typography>
            <Alert severity="warning">
              Der Bestätigungslink ist abgelaufen (gültig 24 Stunden).
              Bitte registriere dich erneut.
            </Alert>
          </>
        )}
        {state === 'error' && (
          <>
            <ErrorOutlineIcon sx={{fontSize: 64, color: 'error.main'}}/>
            <Typography component="h1" variant="h5">Link ungültig</Typography>
            <Alert severity="error">
              Der Bestätigungslink ist ungültig.
            </Alert>
          </>
        )}
      </Box>
    </Container>
  );
};
