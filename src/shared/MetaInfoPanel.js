import {useState} from 'react';
import {Box, Collapse, Typography} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const LABELS = {
    capturedAt:       'Datum',
    dateTime:         'Dateidatum',
    make:             'Hersteller',
    model:            'Modell',
    software:         'Software',
    artist:           'Fotograf',
    copyright:        'Copyright',
    orientation:      'Orientierung',
    iso:              'ISO',
    exposureTime:     'Belichtung',
    fNumber:          'Blende',
    focalLength:      'Brennweite',
    focalLength35mm:  'Brennweite (35mm)',
    exposureBias:     'Belichtungskorr.',
    exposureProgram:  'Belichtungsprogr.',
    exposureMode:     'Belichtungsmodus',
    meteringMode:     'Messmethode',
    flash:            'Blitz',
    whiteBalance:     'Weißabgleich',
    lensModel:        'Objektiv',
    sceneCaptureType: 'Szene',
    pixelWidth:       'Breite (px)',
    pixelHeight:      'Höhe (px)',
    digitalZoom:      'Digitalzoom',
    gpsLat:           'GPS Breite',
    gpsLon:           'GPS Länge',
    gpsAlt:           'GPS Höhe',
    gpsSpeed:         'GPS Tempo',
    gpsDirection:     'GPS Richtung',
    // video
    creationTime:     'Aufnahme',
    codec:            'Codec',
    width:            'Breite',
    height:           'Höhe',
    fps:              'FPS',
    duration:         'Dauer',
};

const ORDER = Object.keys(LABELS);

function formatValue(key, val) {
    if (key === 'exposureTime') {
        return val < 1 ? `1/${Math.round(1 / val)}s` : `${val.toFixed(1)}s`;
    }
    if (key === 'fNumber') return `f/${typeof val === 'number' ? val.toFixed(1) : val}`;
    if (key === 'focalLength' || key === 'focalLength35mm') return `${Math.round(val)}mm`;
    if (key === 'exposureBias') return `${val > 0 ? '+' : ''}${val.toFixed(1)} EV`;
    if (key === 'gpsLat' || key === 'gpsLon') return typeof val === 'number' ? val.toFixed(6) : val;
    if (key === 'gpsAlt') return `${val}m`;
    if (key === 'duration') return `${Math.floor(val / 60)}:${String(val % 60).padStart(2, '0')}`;
    if (key === 'width' || key === 'height' || key === 'pixelWidth' || key === 'pixelHeight') return `${val}px`;
    if (key === 'digitalZoom') return typeof val === 'number' ? `${val.toFixed(1)}×` : val;
    return String(val);
}

export const MetaInfoPanel = ({jsonString}) => {
    const [open, setOpen] = useState(false);

    if (!jsonString) return null;
    let meta;
    try { meta = JSON.parse(jsonString); } catch { return null; }

    const entries = ORDER
        .filter(k => meta[k] != null && meta[k] !== '')
        .map(k => [LABELS[k] || k, formatValue(k, meta[k])]);

    // Unbekannte Felder ans Ende
    Object.keys(meta).forEach(k => {
        if (!LABELS[k] && meta[k] != null && meta[k] !== '') {
            entries.push([k, String(meta[k])]);
        }
    });

    if (entries.length === 0) return null;

    return (
        <Box sx={{mb: 1}}>
            <Box sx={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'text.secondary'}}
                 onClick={() => setOpen(v => !v)}>
                <InfoOutlinedIcon sx={{fontSize: 14, mr: 0.5}}/>
                <Typography variant="caption">{meta.codec ? 'Metadaten' : 'EXIF'} ({entries.length})</Typography>
            </Box>
            <Collapse in={open}>
                <Box sx={{mt: 0.5, p: 1, bgcolor: 'grey.50', borderRadius: 1, fontSize: '0.7rem', fontFamily: 'monospace', lineHeight: 1.7,
                          display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '8px'}}>
                    {entries.map(([label, value]) => (
                        <>
                            <span style={{color: '#666', whiteSpace: 'nowrap'}}>{label}</span>
                            <span>{value}</span>
                        </>
                    ))}
                </Box>
            </Collapse>
        </Box>
    );
};
