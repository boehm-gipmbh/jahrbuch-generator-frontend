import React, {useState, useEffect} from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Box,
    Typography,
    Alert
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import {api as bilderApi} from './api';

export const BilderUploadDialog = () => {
    const [open, setOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    // Konfiguration für Upload-Beschränkungen
    const [uploadConfig, setUploadConfig] = useState({
        maxSize: 2097152, // 2MB Fallback
        allowedTypes: ['.jpg', '.jpeg', '.png', '.gif'] // Fallback
    });

    const [uploadBild] = bilderApi.endpoints.uploadBild.useMutation();
    const {data: config} = bilderApi.endpoints.getUploadConfig.useQuery(null, {
        skip: !open
    });

    useEffect(() => {
        if (config) {
            setUploadConfig(config);
        }
    }, [config]);

    const validateFile = (file) => {
        if (!file) return null;

        // Größenvalidierung
        if (file.size > uploadConfig.maxSize) {
            return `Die Datei ist zu groß. Maximale Größe: ${uploadConfig.maxSize / 1024 / 1024}MB`;
        }

        // Typ-Validierung
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!uploadConfig.allowedTypes.includes(fileExtension)) {
            return `Nicht unterstütztes Dateiformat. Erlaubte Formate: ${uploadConfig.allowedTypes.join(', ')}`;
        }

        return null;
    };
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);

        // Validierung bei Dateiauswahl
        const errorMsg = validateFile(file);
        setError(errorMsg);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        // Nochmalige Validierung vor dem Upload
        const errorMsg = validateFile(selectedFile);
        if (errorMsg) {
            setError(errorMsg);
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title);
        formData.append('description', description);

        try {
            await uploadBild(formData).unwrap();
            setOpen(false);
            setSelectedFile(null);
            setTitle('');
            setDescription('');
            setError('');
        } catch (error) {
            console.error('Upload fehlgeschlagen:', error);
            setError('Upload fehlgeschlagen: ' + (error.data?.message || error.message || 'Unbekannter Fehler'));
        }
    };

    return (
        <>
            <Button startIcon={<UploadIcon/>} onClick={() => setOpen(true)}>
                Bild hochladen
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Bild hochladen</DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <Button
                            variant="outlined"
                            component="label"
                        >
                            Datei auswählen
                            <input
                                type="file"
                                accept={uploadConfig.allowedTypes.join(',')}
                                hidden
                                onChange={handleFileChange}
                            />
                        </Button>

                        {selectedFile && (
                            <Box sx={{mt: 1}}>
                                <Typography variant="body2">
                                    Ausgewählt: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                                </Typography>
                                {selectedFile.type.startsWith('image/') && (
                                    <Box sx={{mt: 1}}>
                                        <img
                                            src={URL.createObjectURL(selectedFile)}
                                            alt="Vorschau"
                                            style={{maxWidth: '100%', maxHeight: 200}}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}

                        <TextField
                            label="Titel"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            fullWidth
                        />

                        <TextField
                            label="Beschreibung"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Abbrechen</Button>
                    <Button
                        onClick={handleUpload}
                        variant="contained"
                        disabled={!selectedFile || !!error}
                    >
                        Hochladen
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};