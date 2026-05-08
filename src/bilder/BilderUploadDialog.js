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

async function readExifData(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isJpeg = ['.jpg', '.jpeg'].includes(ext) || file.type === 'image/jpeg';
    if (!isJpeg) return {};
    try {
        const buf = await file.slice(0, 131072).arrayBuffer();
        const view = new DataView(buf);
        if (view.getUint16(0) !== 0xFFD8) return {};
        let off = 2;
        while (off < buf.byteLength - 4) {
            if (view.getUint8(off) !== 0xFF) return {};
            const marker = view.getUint8(off + 1);
            const segLen = view.getUint16(off + 2);
            if (marker === 0xE1 && view.getUint32(off + 4) === 0x45786966) {
                return parseExifSegment(buf, view, off + 10);
            } else if (marker === 0xDA) break;
            off += 2 + segLen;
        }
    } catch (_) {}
    return {};
}

function parseExifSegment(buf, view, tb) {
    const le = view.getUint16(tb) === 0x4949;
    const ri = (o) => le ? view.getUint32(o, true) : view.getUint32(o);
    const rs = (o) => le ? view.getUint16(o, true) : view.getUint16(o);

    const readTag = (ifdOff, tag) => {
        const n = rs(ifdOff);
        for (let i = 0; i < n; i++) {
            const e = ifdOff + 2 + i * 12;
            if (e + 12 > buf.byteLength) break;
            if (rs(e) !== tag) continue;
            const type = rs(e + 2), comps = ri(e + 4), valOff = e + 8;
            if (type === 1) return view.getUint8(valOff);
            if (type === 2) {
                const absOff = comps > 4 ? tb + ri(valOff) : valOff;
                return new TextDecoder().decode(new Uint8Array(buf, absOff, Math.max(0, comps - 1))).replace(/\0/g, '').trim();
            }
            if (type === 3) return le ? view.getUint16(valOff, true) : view.getUint16(valOff);
            if (type === 4 || type === 9) return ri(valOff);
            if (type === 5 || type === 10) {
                const absOff = tb + ri(valOff);
                const vals = [];
                for (let c = 0; c < comps && c < 3; c++) {
                    const pos = absOff + c * 8;
                    if (pos + 8 > buf.byteLength) break;
                    const num = ri(pos), den = ri(pos + 4);
                    vals.push(den !== 0 ? num / den : 0);
                }
                return comps === 1 ? vals[0] : vals;
            }
        }
        return null;
    };

    const EXPOSURE_PROGRAM = ['Unbekannt','Manuell','Programm-Auto','Blendenvorwahl','Zeitvorwahl','Kreativ','Action','Porträt','Landschaft'];
    const METERING_MODE    = ['Unbekannt','Mittelwert','Mittenbetont','Spot','Multi-Spot','Mehrfeld','Selektiv'];
    const EXPOSURE_MODE    = ['Auto','Manuell','Auto-Bracket'];
    const WHITE_BALANCE    = ['Auto','Manuell'];
    const SCENE_CAPTURE    = ['Standard','Landschaft','Porträt','Nacht'];

    const set = (key, val) => { if (val != null && val !== '' && val !== 0) result[key] = val; };
    const setStr = (key, val) => { if (val) result[key] = val; };
    const setEnum = (key, val, map) => { if (val != null && map[val] !== undefined) result[key] = map[val]; };

    const result = {};
    const ifd0 = tb + ri(tb + 4);

    // IFD0
    setStr('capturedAt', readTag(ifd0, 0x9003));
    setStr('make',       readTag(ifd0, 0x010F));
    setStr('model',      readTag(ifd0, 0x0110));
    set(   'orientation',readTag(ifd0, 0x0112));
    setStr('software',   readTag(ifd0, 0x0131));
    setStr('dateTime',   readTag(ifd0, 0x0132));
    setStr('artist',     readTag(ifd0, 0x013B));
    setStr('copyright',  readTag(ifd0, 0x8298));

    // ExifIFD
    const subOff = readTag(ifd0, 0x8769);
    if (subOff != null) {
        const exifIfd = tb + subOff;
        const dtOrig = readTag(exifIfd, 0x9003);
        if (dtOrig && !result.capturedAt) result.capturedAt = dtOrig;
        set(   'iso',            readTag(exifIfd, 0x8827));
        set(   'exposureTime',   readTag(exifIfd, 0x829A));
        set(   'fNumber',        readTag(exifIfd, 0x829D));
        set(   'focalLength',    readTag(exifIfd, 0x920A));
        set(   'exposureBias',   readTag(exifIfd, 0x9204));
        setEnum('exposureProgram', readTag(exifIfd, 0x8822), EXPOSURE_PROGRAM);
        setEnum('meteringMode',    readTag(exifIfd, 0x9207), METERING_MODE);
        setEnum('exposureMode',    readTag(exifIfd, 0xA402), EXPOSURE_MODE);
        setEnum('whiteBalance',    readTag(exifIfd, 0xA403), WHITE_BALANCE);
        setEnum('sceneCaptureType',readTag(exifIfd, 0xA406), SCENE_CAPTURE);
        const flash = readTag(exifIfd, 0x9209);
        if (flash != null) result.flash = (flash & 1) ? 'Ja' : 'Nein';
        set('focalLength35mm', readTag(exifIfd, 0xA405));
        setStr('lensModel',    readTag(exifIfd, 0xA434));
        set(   'pixelWidth',   readTag(exifIfd, 0xA002));
        set(   'pixelHeight',  readTag(exifIfd, 0xA003));
        const zoom = readTag(exifIfd, 0xA404);
        if (zoom != null && zoom !== 1) result.digitalZoom = zoom;
    }

    // GPS IFD
    const gpsOff = readTag(ifd0, 0x8825);
    if (gpsOff != null) {
        const gpsIfd = tb + gpsOff;
        const latRef = readTag(gpsIfd, 0x0001);
        const lat    = readTag(gpsIfd, 0x0002);
        const lonRef = readTag(gpsIfd, 0x0003);
        const lon    = readTag(gpsIfd, 0x0004);
        const altRef = readTag(gpsIfd, 0x0005);
        const alt    = readTag(gpsIfd, 0x0006);
        const spdRef = readTag(gpsIfd, 0x000C);
        const spd    = readTag(gpsIfd, 0x000D);
        const dirRef = readTag(gpsIfd, 0x0010);
        const dir    = readTag(gpsIfd, 0x0011);
        if (spd != null) result.gpsSpeed = `${spd.toFixed(1)} ${spdRef || 'km/h'}`;
        if (dir != null) result.gpsDirection = `${dir.toFixed(1)}° ${dirRef || ''}`.trim();
        if (Array.isArray(lat) && Array.isArray(lon)) {
            const toDeg = ([d, m, s]) => d + m / 60 + s / 3600;
            let latDeg = toDeg(lat), lonDeg = toDeg(lon);
            if (latRef === 'S') latDeg = -latDeg;
            if (lonRef === 'W') lonDeg = -lonDeg;
            result.gpsLat = Math.round(latDeg * 1e7) / 1e7;
            result.gpsLon = Math.round(lonDeg * 1e7) / 1e7;
            if (alt != null) result.gpsAlt = Math.round((altRef === 1 ? -alt : alt) * 10) / 10;
        }
    }

    return result;
}

const MIME_TO_EXT = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif'};

function effectiveExt(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return COMPRESSIBLE_TYPES.includes(ext) ? ext : (MIME_TO_EXT[file.type] || ext);
}

async function compressIfNeeded(file) {
    if (!COMPRESSIBLE_TYPES.includes(effectiveExt(file))) return file;
    if (file.size <= COMPRESS_TARGET_MB * 1024 * 1024) return file;
    try {
        return await imageCompression(file, {
            maxSizeMB: COMPRESS_TARGET_MB,
            maxWidthOrHeight: COMPRESS_MAX_PX,
            useWebWorker: true,
            fileType: file.type || 'image/jpeg',
            preserveExif: true,
        });
    } catch (_) {
        // Fallback: Originaldatei senden wenn Komprimierung fehlschlägt
        return file;
    }
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
        const ext = effectiveExt(file);
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
        const [compressed, exif] = await Promise.all([compressIfNeeded(file), readExifData(file)]);
        const formData = new FormData();
        formData.append('file', compressed, file.name);
        formData.append('title', isSingle ? title : file.name.replace(/\.[^/.]+$/, ''));
        if (isSingle) formData.append('description', description);
        if (story?.id) formData.append('storyId', story.id);
        if (exif.capturedAt) formData.append('capturedAt', exif.capturedAt);
        if (Object.keys(exif).length > 0) formData.append('exifData', JSON.stringify(exif));
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
                                accept="image/*"
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