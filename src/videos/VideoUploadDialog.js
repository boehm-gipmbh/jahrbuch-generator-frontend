import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Box,
    Typography,
    Alert,
    LinearProgress
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import {api as videoApi} from './api';

const ALLOWED_TYPES = ['.mp4', '.mov', '.webm', '.avi'];
const MAX_SIZE_BYTES = 524288000; // 500 MB

export const VideoUploadDialog = ({story}) => {
    const dispatch = useDispatch();
    const jwt = useSelector(state => state.auth.jwt);
    const [open, setOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const validateFile = (file) => {
        if (!file) return null;
        if (file.size > MAX_SIZE_BYTES) {
            return `Die Datei ist zu groß. Maximale Größe: ${MAX_SIZE_BYTES / 1024 / 1024} MB`;
        }
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_TYPES.includes(ext)) {
            return `Nicht unterstütztes Format. Erlaubt: ${ALLOWED_TYPES.join(', ')}`;
        }
        return null;
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setError(validateFile(file) || '');
    };

    const handleClose = () => {
        if (uploading) return;
        setOpen(false);
        setSelectedFile(null);
        setTitle('');
        setDescription('');
        setError('');
        setProgress(0);
    };

    const handleUpload = () => {
        if (!selectedFile) return;
        const errorMsg = validateFile(selectedFile);
        if (errorMsg) { setError(errorMsg); return; }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title);
        formData.append('description', description);
        if (story?.id) formData.append('storyId', story.id);

        const apiUrl = process.env.REACT_APP_API_URL || '';
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiUrl}/videos/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${jwt}`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                setProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            setUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
                dispatch(videoApi.util.invalidateTags(['Video']));
                handleClose();
            } else {
                let msg = `HTTP ${xhr.status}`;
                try {
                    const body = JSON.parse(xhr.responseText);
                    msg = body.message || msg;
                } catch (_) {}
                setError(`Upload fehlgeschlagen: ${msg}`);
                setProgress(0);
            }
        };

        xhr.onerror = () => {
            setUploading(false);
            setError('Upload fehlgeschlagen: Netzwerkfehler');
            setProgress(0);
        };

        xhr.ontimeout = () => {
            setUploading(false);
            setError('Upload fehlgeschlagen: Timeout');
            setProgress(0);
        };

        setUploading(true);
        setError('');
        setProgress(0);
        xhr.send(formData);
    };

    return (
        <>
            <Button startIcon={<UploadIcon/>} onClick={() => setOpen(true)}>
                Video hochladen
            </Button>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Video hochladen</DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <Button variant="outlined" component="label" disabled={uploading}>
                            Datei auswählen
                            <input
                                type="file"
                                accept={ALLOWED_TYPES.join(',')}
                                hidden
                                onChange={handleFileChange}
                            />
                        </Button>

                        {selectedFile && (
                            <Typography variant="body2">
                                Ausgewählt: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                            </Typography>
                        )}

                        <TextField
                            label="Titel"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            fullWidth
                            disabled={uploading}
                        />

                        <TextField
                            label="Beschreibung"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                            disabled={uploading}
                        />

                        {uploading && (
                            <Box>
                                <Typography variant="body2" sx={{mb: 0.5}}>
                                    {progress}% hochgeladen…
                                </Typography>
                                <LinearProgress variant="determinate" value={progress}/>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={uploading}>Abbrechen</Button>
                    <Button
                        onClick={handleUpload}
                        variant="contained"
                        disabled={!selectedFile || !!error || uploading}
                    >
                        {uploading ? 'Lädt hoch…' : 'Hochladen'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
