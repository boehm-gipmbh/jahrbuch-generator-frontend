import {useState} from 'react';
import {Box, Collapse, Typography} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const MetaInfoPanel = ({jsonString}) => {
    const [open, setOpen] = useState(false);

    if (!jsonString) return null;
    let meta;
    try { meta = JSON.parse(jsonString); } catch { return null; }

    const hasMeta = meta.make || meta.codec || meta.gpsLat != null || meta.capturedAt || meta.creationTime || meta.iso;
    if (!hasMeta) return null;

    return (
        <Box sx={{mb: 1}}>
            <Box sx={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'text.secondary'}}
                 onClick={() => setOpen(v => !v)}>
                <InfoOutlinedIcon sx={{fontSize: 14, mr: 0.5}}/>
                <Typography variant="caption">{meta.codec ? 'Metadaten' : 'EXIF'}</Typography>
            </Box>
            <Collapse in={open}>
                <Box sx={{mt: 0.5, p: 1, bgcolor: 'grey.50', borderRadius: 1, fontSize: '0.7rem', fontFamily: 'monospace', lineHeight: 1.6}}>
                    {meta.make && (
                        <div><b>Kamera:</b> {meta.make}{meta.model ? ` ${meta.model}` : ''}</div>
                    )}
                    {meta.iso && (
                        <div>
                            <b>ISO:</b> {meta.iso}
                            {meta.fNumber ? `  f/${meta.fNumber.toFixed(1)}` : ''}
                            {meta.exposureTime ? `  1/${Math.round(1 / meta.exposureTime)}s` : ''}
                            {meta.focalLength ? `  ${meta.focalLength.toFixed(0)}mm` : ''}
                        </div>
                    )}
                    {meta.codec && (
                        <div>
                            <b>Video:</b> {meta.codec}
                            {meta.width ? ` ${meta.width}×${meta.height}` : ''}
                            {meta.fps ? ` @ ${meta.fps} fps` : ''}
                        </div>
                    )}
                    {meta.duration != null && (
                        <div><b>Dauer:</b> {Math.floor(meta.duration / 60)}:{String(meta.duration % 60).padStart(2, '0')} min</div>
                    )}
                    {meta.gpsLat != null && (
                        <div>
                            <b>GPS:</b> {meta.gpsLat.toFixed(6)}, {meta.gpsLon.toFixed(6)}
                            {meta.gpsAlt != null ? ` (${meta.gpsAlt}m)` : ''}
                        </div>
                    )}
                    {(meta.capturedAt || meta.creationTime) && (
                        <div><b>Aufnahme:</b> {meta.capturedAt || meta.creationTime}</div>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};
