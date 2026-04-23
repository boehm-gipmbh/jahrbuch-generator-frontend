import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {Box, Chip, CircularProgress, Typography} from '@mui/material';
import {CameraAlt, FiberManualRecord} from '@mui/icons-material';
import {api as bilderApi} from '../bilder/api';
import AuthImage from '../bilder/AuthImage';

const SCREENSAVER_TIMEOUT_MS = 60000;
const PREVIEW_DURATION_MS = 8000;
const SLIDE_INTERVAL_MS = 3000;

export const Fotobox = () => {
    const navigate = useNavigate();
    const {data: capturesConfig} = bilderApi.endpoints.getCapturesConfig.useQuery();
    const {data: cameraStatus} = bilderApi.endpoints.getCameraStatus.useQuery(undefined, {pollingInterval: 5000});
    const {data: bilder} = bilderApi.endpoints.getBilder.useQuery(undefined, {pollingInterval: 10000});
    const [triggerCapture] = bilderApi.endpoints.triggerCapture.useMutation();

    const [phase, setPhase] = useState('idle'); // idle | countdown | capturing | preview | screensaver
    const [countdown, setCountdown] = useState(3);
    const [lastBild, setLastBild] = useState(null);
    const [slideIndex, setSlideIndex] = useState(0);
    const inactivityTimer = useRef(null);
    const phaseRef = useRef(phase);
    phaseRef.current = phase;

    useEffect(() => {
        if (capturesConfig && !capturesConfig.enabled) {
            navigate('/bilder');
        }
    }, [capturesConfig, navigate]);

    const todaysBilder = (bilder || []).filter(b => {
        if (!b.created) return false;
        return new Date(b.created).toDateString() === new Date().toDateString();
    });

    const startInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            if (phaseRef.current === 'idle' || phaseRef.current === 'preview') {
                setPhase('screensaver');
                setSlideIndex(0);
            }
        }, SCREENSAVER_TIMEOUT_MS);
    }, []);

    const handleActivity = useCallback(() => {
        if (phaseRef.current === 'screensaver') {
            setPhase('idle');
        }
        startInactivityTimer();
    }, [startInactivityTimer]);

    useEffect(() => {
        startInactivityTimer();
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('touchstart', handleActivity);
        return () => {
            clearTimeout(inactivityTimer.current);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
        };
    }, [handleActivity, startInactivityTimer]);

    useEffect(() => {
        if (phase !== 'screensaver' || todaysBilder.length === 0) return;
        const timer = setInterval(() => {
            setSlideIndex(i => (i + 1) % todaysBilder.length);
        }, SLIDE_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [phase, todaysBilder.length]);

    const handleCapture = useCallback(async () => {
        if (phase !== 'idle') return;
        setPhase('countdown');
        setCountdown(3);
        await new Promise(resolve => {
            let c = 3;
            const interval = setInterval(() => {
                c--;
                setCountdown(c);
                if (c === 0) { clearInterval(interval); resolve(); }
            }, 1000);
        });
        setPhase('capturing');
        try {
            const result = await triggerCapture().unwrap();
            setLastBild(result);
            setPhase('preview');
            setTimeout(() => setPhase('idle'), PREVIEW_DURATION_MS);
        } catch {
            setPhase('idle');
        }
    }, [phase, triggerCapture]);

    if (phase === 'screensaver') {
        return (
            <Box onClick={handleActivity} sx={{width: '100vw', height: '100vh', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'none'}}>
                {todaysBilder.length > 0
                    ? <AuthImage src={`/api/v1/bilder/extern${todaysBilder[slideIndex]?.pfad}`} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
                    : <Typography variant="h3" sx={{color: 'white', opacity: 0.2}}>Jahrbuch Fotobox</Typography>
                }
            </Box>
        );
    }

    return (
        <Box sx={{width: '100vw', height: '100vh', bgcolor: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, userSelect: 'none', overflow: 'hidden'}}>

            {/* Kamera-Status */}
            <Box sx={{position: 'absolute', top: 20, left: 20}}>
                <Chip
                    icon={<FiberManualRecord sx={{fontSize: 12, color: cameraStatus?.connected ? 'success.main' : 'error.main'}} />}
                    label={cameraStatus?.connected ? (cameraStatus.model || 'Kamera verbunden') : 'Keine Kamera'}
                    sx={{bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 12}}
                />
            </Box>

            {phase === 'preview' && lastBild && (
                <Box sx={{position: 'absolute', top: 24, right: 24, width: 220, borderRadius: 2, overflow: 'hidden', border: '3px solid white', boxShadow: 8}}>
                    <AuthImage src={`/api/v1/bilder/extern${lastBild.pfad}`} style={{width: '100%', height: 'auto', display: 'block'}} />
                </Box>
            )}

            {phase === 'countdown' && (
                <Typography sx={{color: 'white', fontSize: '30vw', fontWeight: 'bold', lineHeight: 1, animation: 'pulse 1s ease-in-out'}}>
                    {countdown}
                </Typography>
            )}

            {phase === 'capturing' && (
                <CircularProgress size={140} thickness={2} sx={{color: 'white'}} />
            )}

            {(phase === 'idle' || phase === 'preview') && (
                <Box onClick={handleCapture} sx={{
                    width: 220, height: 220, borderRadius: '50%',
                    bgcolor: phase === 'idle' ? 'error.main' : 'grey.800',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: phase === 'idle' ? 'pointer' : 'default',
                    boxShadow: 10,
                    transition: 'background-color 0.3s, transform 0.1s',
                    '&:active': phase === 'idle' ? {transform: 'scale(0.93)'} : {},
                }}>
                    <CameraAlt sx={{fontSize: 90, color: 'white'}} />
                </Box>
            )}

            <Typography variant="h6" sx={{color: 'white', opacity: 0.5, mt: 1}}>
                {phase === 'idle' && 'Drücken zum Aufnehmen'}
                {phase === 'preview' && '📸 Aufgenommen!'}
            </Typography>
        </Box>
    );
};
