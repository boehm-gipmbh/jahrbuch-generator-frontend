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
    Alert,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import imageCompression from 'browser-image-compression';
import {api as bilderApi} from './api';

const CONCURRENCY = 3;
const MAX_RETRIES = 3;
const COMPRESSIBLE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];
const COMPRESS_TARGET_MB = 2;
const COMPRESS_MAX_PX = 1920;

async function readExifDate(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.jpg', '.jpeg'].includes(ext)) return null;
    try {
        const buf = await file.slice(0, 65536).arrayBuffer();
        const view = new DataView(buf);
        if (view.getUint16(0) !== 0xFFD8) return null;
        let off = 2;
        while (off < buf.byteLength - 4) {
            if (view.getUint8(off) !== 0xFF) return null;
            const marker = view.getUint8(off + 1);
            const segLen = view.getUint16(off + 2);
            if (marker === 0xE1 && view.getUint32(off + 4) === 0x45786966) {
                const tb = off + 10;
                const le = view.getUint16(tb) === 0x4949;
                const ri = (o) => le ? view.getUint32(o, true) : view.getUint32(o);
                const rs = (o) => le ? view.getUint16(o, true) : view.getUint16(o);
                const ifd0 = tb + ri(tb + 4);
                const findTag = (ifdOff, tag) => {
                    const n = rs(ifdOff);
                    for (let i = 0; i < n; i++) {
                        const e = ifdOff + 2 + i * 12;
                        if (rs(e) === tag) {
                            const type = rs(e + 2), comps = ri(e + 4);
                            if (type === 2) {
                                const absOff = comps > 4 ? tb + ri(e + 8) : e + 8;
                                return new TextDecoder().decode(new Uint8Array(buf, absOff, comps - 1));
                            }
                            if (type === 4 || type === 9) return ri(e + 8);
                        }
                    }
                    return null;
                };
                let dt = findTag(ifd0, 0x9003);
                if (!dt) {
                    const subOff = findTag(ifd0, 0x8769);
                    if (subOff != null) dt = findTag(tb + subOff, 0x9003);
                }
                if (typeof dt === 'string') return dt;
            } else if (marker === 0xDA) break;
            off += 2 + segLen;
        }
    } catch (_) {}
    return null;
}

async function compressIfNeeded(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!COMPRESSIBLE_TYPES.includes(ext)) return file;
    if (file.size <= COMPRESS_TARGET_MB * 1024 * 1024) return file;
    return imageCompression(file, {
        maxSizeMB: COMPRESS_TARGET_MB,
        maxWidthOrHeight: COMPRESS_MAX_PX,
        useWebWorker: true,
        fileType: file.type,
        preserveExif: true,
    });
}

async function uploadWithRetry(uploadFn, maxRetries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await uploadFn();
        } catch (err) {
            const status = err?.status ?? err?.originalStatus;
            // 4xx-Fehler nicht wiederholen (Validierung schlägt immer fehl)
            if (status >= 400 && status < 500) throw err;
            if (attempt === maxRetries) throw err;
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
}

export const BilderUploadDialog = ({ story }) => {
    const [open, setOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [validationErrors, setValidationErrors] = useState([]);
    const [progress, setProgress] = useState({ done: 0, total: 0, errors: [], status: '' });
    const [uploading, setUploading] = useState(false);

    const [uploadConfig, setUploadConfig] = useState({
        maxSize: 2097152,
        allowedTypes: ['.jpg', '.jpeg', '.png', '.gif']
    });

    const [uploadBild] = bilderApi.endpoints.uploadBild.useMutation();
    const {data: config} = bilderApi.endpoints.getUploadConfig.useQuery(null, { skip: !open });

    useEffect(() => {
        if (config) setUploadConfig(config);
    }, [config]);

    const validateFile = (file) => {
        // Größenvalidierung überspringen für komprimierbare Typen — werden vor Upload verkleinert
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!COMPRESSIBLE_TYPES.includes(ext) && file.size > uploadConfig.maxSize)
            return `${file.name}: zu groß (max. ${uploadConfig.maxSize / 1024 / 1024} MB)`;
        if (!uploadConfig.allowedTypes.includes(ext))
            return `${file.name}: Format nicht erlaubt (${uploadConfig.allowedTypes.join(', ')})`;
        return null;
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        setValidationErrors(files.map(validateFile).filter(Boolean));
        setProgress({ done: 0, total: 0, errors: [], status: '' });
    };

    const handleClose = () => {
        if (uploading) return;
        setOpen(false);
        setSelectedFiles([]);
        setTitle('');
        setDescription('');
        setValidationErrors([]);
        setProgress({ done: 0, total: 0, errors: [], status: '' });
    };

    const uploadSingle = async (file, isSingle) => {
        const [compressed, exifDate] = await Promise.all([compressIfNeeded(file), readExifDate(file)]);
        const formData = new FormData();
        formData.append('file', compressed, file.name);
        formData.append('title', isSingle ? title : file.name.replace(/\.[^/.]+$/, ''));
        if (isSingle) formData.append('description', description);
        if (story?.id) formData.append('storyId', story.id);
        if (exifDate) formData.append('capturedAt', exifDate);
        await uploadWithRetry(() => uploadBild(formData).unwrap());
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0 || validationErrors.length > 0) return;
        setUploading(true);
        const errors = [];
        let done = 0;
        const isSingle = selectedFiles.length === 1;
        setProgress({ done: 0, total: selectedFiles.length, errors: [], status: 'Komprimiere...' });

        for (let i = 0; i < selectedFiles.length; i += CONCURRENCY) {
            const batch = selectedFiles.slice(i, i + CONCURRENCY);
            const results = await Promise.allSettled(batch.map(f => uploadSingle(f, isSingle)));
            results.forEach((r, idx) => {
                if (r.status === 'rejected')
                    errors.push(`${batch[idx].name}: ${r.reason?.data?.message || 'Fehler'}`);
            });
            done += batch.length;
            setProgress({ done, total: selectedFiles.length, errors: [...errors], status: 'Lade hoch...' });
        }

        setUploading(false);
        if (errors.length === 0) handleClose();
    };

    const isBulk = selectedFiles.length > 1;
    const canUpload = selectedFiles.length > 0 && validationErrors.length === 0 && !uploading;

    return (
        <>
            <Button startIcon={<UploadIcon/>} onClick={() => setOpen(true)}>
                Bild hochladen
            </Button>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{isBulk ? `${selectedFiles.length} Bilder hochladen` : 'Bild hochladen'}</DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                        {validationErrors.map((e, i) => <Alert key={i} severity="error">{e}</Alert>)}
                        {progress.errors.map((e, i) => <Alert key={i} severity="error">{e}</Alert>)}

                        <Button variant="outlined" component="label">
                            Dateien auswählen
                            <input
                                type="file"
                                accept={uploadConfig.allowedTypes.join(',')}
                                hidden
                                multiple
                                onChange={handleFileChange}
                            />
                        </Button>

                        {isBulk && selectedFiles.length > 0 && (
                            <List dense disablePadding>
                                {selectedFiles.map((f, i) => (
                                    <ListItem key={i} disableGutters>
                                        <ListItemText
                                            primary={f.name}
                                            secondary={`${(f.size / 1024).toFixed(1)} KB`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}

                        {!isBulk && selectedFiles[0] && (
                            <Box>
                                <Typography variant="body2">
                                    {selectedFiles[0].name} ({(selectedFiles[0].size / 1024).toFixed(2)} KB)
                                </Typography>
                                {selectedFiles[0].type.startsWith('image/') && (
                                    <Box sx={{mt: 1}}>
                                        <img
                                            src={URL.createObjectURL(selectedFiles[0])}
                                            alt="Vorschau"
                                            style={{maxWidth: '100%', maxHeight: 200}}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}

                        {!isBulk && (
                            <>
                                <TextField label="Titel" value={title} onChange={e => setTitle(e.target.value)} fullWidth />
                                <TextField label="Beschreibung" value={description} onChange={e => setDescription(e.target.value)} multiline rows={3} fullWidth />
                            </>
                        )}

                        {uploading && (
                            <Box>
                                <Typography variant="body2" sx={{mb: 0.5}}>
                                    {progress.status} {progress.total > 0 && `(${progress.done} / ${progress.total})`}
                                </Typography>
                                <LinearProgress
                                    variant={progress.total > 0 ? 'determinate' : 'indeterminate'}
                                    value={progress.total > 0 ? (progress.done / progress.total) * 100 : undefined}
                                />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={uploading}>Abbrechen</Button>
                    <Button onClick={handleUpload} variant="contained" disabled={!canUpload}>
                        {isBulk ? `${selectedFiles.length} Bilder hochladen` : 'Hochladen'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};