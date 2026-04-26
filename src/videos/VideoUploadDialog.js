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
const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB pro Chunk

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
        if (file.size > MAX_SIZE_BYTES)
            return `Die Datei ist zu groß. Maximale Größe: ${MAX_SIZE_BYTES / 1024 / 1024} MB`;
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_TYPES.includes(ext))
            return `Nicht unterstütztes Format. Erlaubt: ${ALLOWED_TYPES.join(', ')}`;
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

    const sendChunk = (formData) => new Promise((resolve, reject) => {
        const apiUrl = process.env.REACT_APP_API_URL || '';
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiUrl}/videos/upload/chunk`);
        xhr.setRequestHeader('Authorization', `Bearer ${jwt}`);
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                let msg = `HTTP ${xhr.status}`;
                try { msg = JSON.parse(xhr.responseText).message || msg; } catch (_) {}
                reject(new Error(msg));
            }
        };
        xhr.onerror = () => reject(new Error('Netzwerkfehler'));
        xhr.ontimeout = () => reject(new Error('Timeout'));
        xhr.send(formData);
    });

    const sendChunkWithRetry = async (formData) => {
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                return await sendChunk(formData);
            } catch (err) {
                if (attempt === 4) throw err;
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        const errorMsg = validateFile(selectedFile);
        if (errorMsg) { setError(errorMsg); return; }

        setUploading(true);
        setError('');
        setProgress(0);

        const uploadId = crypto.randomUUID();
        const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);

        try {
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, selectedFile.size);

                const formData = new FormData();
                formData.append('uploadId', uploadId);
                formData.append('chunkIndex', i);
                formData.append('totalChunks', totalChunks);
                formData.append('fileName', selectedFile.name);
                formData.append('file', selectedFile.slice(start, end), selectedFile.name);

                if (i === totalChunks - 1) {
                    formData.append('title', title);
                    formData.append('description', description);
                    if (story?.id) formData.append('storyId', story.id);
                }

                await sendChunkWithRetry(formData);
                setProgress(Math.round(((i + 1) / totalChunks) * 100));
            }

            dispatch(videoApi.util.invalidateTags(['Video']));
            handleClose();
        } catch (err) {
            setError('Upload fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler'));
            setProgress(0);
        } finally {
            setUploading(false);
        }
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
                        <Alert severity="info">
                            Videos werden auf max. 1280px Breite verkleinert und in H.264 umgewandelt.
                            Der Upload ist <strong>kein Backup</strong> — Originalaufnahmen bitte separat sichern.
                        </Alert>
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
                                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
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
                                <Typography variant="body2" sx={{mb: 0.5}}>{progress}%</Typography>
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
