import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
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
import {api as videoApi} from './api';

const ALLOWED_TYPES = ['.mp4', '.mov', '.webm', '.avi'];
const MAX_SIZE_BYTES = 524288000; // 500 MB

export const VideoUploadDialog = ({story}) => {
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const [uploadVideo] = videoApi.endpoints.uploadVideo.useMutation();

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

    const handleUpload = async () => {
        if (!selectedFile) return;
        const errorMsg = validateFile(selectedFile);
        if (errorMsg) { setError(errorMsg); return; }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title);
        formData.append('description', description);
        if (story?.id) formData.append('storyId', story.id);

        try {
            await uploadVideo(formData).unwrap();
            dispatch(videoApi.util.invalidateTags(['Video']));
            setOpen(false);
            setSelectedFile(null);
            setTitle('');
            setDescription('');
            setError('');
        } catch (err) {
            setError('Upload fehlgeschlagen: ' + (err.data?.message || err.message || 'Unbekannter Fehler'));
        }
    };

    return (
        <>
            <Button startIcon={<UploadIcon/>} onClick={() => setOpen(true)}>
                Video hochladen
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Video hochladen</DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <Button variant="outlined" component="label">
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