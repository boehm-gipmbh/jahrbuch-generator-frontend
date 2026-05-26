import {useState} from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Typography, Box, Alert, Stepper, Step, StepLabel
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export const ReportDialog = ({open, onClose, onConfirm}) => {
    const [step, setStep] = useState(0);
    const [message, setMessage] = useState('');

    const handleClose = () => {
        setStep(0);
        setMessage('');
        onClose();
    };

    const handleConfirm = () => {
        onConfirm(message.trim() || null);
        setStep(0);
        setMessage('');
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <FlagIcon color="error" fontSize="small"/>
                Inhalt melden
            </DialogTitle>

            <DialogContent>
                <Stepper activeStep={step} sx={{mb: 2}}>
                    <Step><StepLabel>Begründung</StepLabel></Step>
                    <Step><StepLabel>Bestätigen</StepLabel></Step>
                </Stepper>

                {step === 0 && (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <Alert severity="info" icon={false}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Unsere Netiquette
                            </Typography>
                            <Typography variant="body2">
                                Inhalte, die andere Personen beleidigen, diskriminieren, in ihrer Würde verletzen
                                oder gegen geltendes Recht verstoßen, haben im Jahrbuch keinen Platz.
                                Bitte melde nur Inhalte, die gegen diese Regeln verstoßen.
                            </Typography>
                        </Alert>
                        <TextField
                            label="Begründung (optional)"
                            multiline
                            minRows={3}
                            maxRows={6}
                            fullWidth
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Warum möchtest du diesen Inhalt melden?"
                            inputProps={{maxLength: 500}}
                            helperText={`${message.length}/500`}
                        />
                    </Box>
                )}

                {step === 1 && (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <Alert severity="warning" icon={<WarningAmberIcon/>}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Diese Meldung wird eskaliert
                            </Typography>
                            <Typography variant="body2">
                                Dein Name und deine Begründung werden an den/die Group-Admin(s) weitergeleitet.
                                Die Admins entscheiden über eine Löschung des Inhalts.
                            </Typography>
                        </Alert>
                        {message.trim() && (
                            <Box sx={{bgcolor: 'grey.100', borderRadius: 1, p: 1.5}}>
                                <Typography variant="caption" color="text.secondary">Deine Begründung:</Typography>
                                <Typography variant="body2" sx={{mt: 0.5, whiteSpace: 'pre-wrap'}}>
                                    {message.trim()}
                                </Typography>
                            </Box>
                        )}
                        <Typography variant="body2" color="text.secondary">
                            Möchtest du diesen Inhalt wirklich melden?
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>Abbrechen</Button>
                {step === 0 && (
                    <Button variant="contained" onClick={() => setStep(1)}>
                        Weiter
                    </Button>
                )}
                {step === 1 && (
                    <>
                        <Button onClick={() => setStep(0)}>Zurück</Button>
                        <Button variant="contained" color="error" onClick={handleConfirm}
                            startIcon={<FlagIcon/>}>
                            Jetzt melden
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};
