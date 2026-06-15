import {Paper, Box, Typography, Tooltip, Checkbox} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AuthImage from './AuthImage';
import {EditBildPriority} from './Priority';
import {ReactionButtons} from '../reactions/ReactionButtons';
import {CommentThread} from '../comments/CommentThread';
import {api} from './api';
import {useState} from 'react';
import {clusterColor} from '../stories/clusterColor';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '';
const isSameDay = (a, b) => {
    if (!a || !b) return false;
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

export const PreviewBildCard = ({bild}) => {
    const [updateBild] = api.endpoints.updateBild.useMutation();
    const [setBildComplete] = api.endpoints.setComplete.useMutation();
    const [priority, setPriorityState] = useState(bild.priority);
    const isComplete = Boolean(bild.complete);

    const setPriority = (p) => { setPriorityState(p); updateBild({...bild, priority: p}); };

    return (
        <Paper elevation={1} sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            borderLeft: bild.clusterId ? `4px solid ${clusterColor(bild.clusterId)}` : undefined,
        }}>
            <Box sx={{position: 'absolute', top: 0, left: 4, zIndex: 1}}>
                <EditBildPriority priority={priority} setPriority={setPriority} disabled={isComplete}/>
            </Box>

            <Tooltip title={isComplete ? 'Bild ist geschützt' : 'Bild kann gelöscht werden'}>
                <Checkbox
                    checked={isComplete}
                    checkedIcon={<LockIcon color="success" fontSize="small"/>}
                    icon={<LockOpenIcon color="action" fontSize="small"/>}
                    onChange={() => setBildComplete({bild, complete: !isComplete})}
                    sx={{position: 'absolute', top: 0, right: 0, '&.Mui-checked': {color: t => t.palette.success.main}}}
                />
            </Tooltip>

            <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, pt: 3}}>
                <Typography variant="subtitle1" color="primary"
                    sx={{mb: 0.5, fontWeight: 'bold', textAlign: 'center'}}>
                    {bild.title || 'Kein Titel'}
                </Typography>
                {(bild.user?.name || bild.created) && (
                    <Typography variant="caption" color="text.disabled"
                        sx={{display: 'block', textAlign: 'center', mb: 1, lineHeight: 1.4}}>
                        {[bild.user?.name,
                            !isSameDay(bild.capturedAt, bild.created) && bild.capturedAt ? `Aufnahme ${fmtDate(bild.capturedAt)}` : null,
                            bild.created ? `Upload ${fmtDate(bild.created)}` : null
                        ].filter(Boolean).join(' · ')}
                    </Typography>
                )}
                <Box sx={{mb: 2}}>
                    <AuthImage
                        src={bild.pfad?.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}
                        alt={bild.description || ''} thumb
                        style={{width: '100%', height: 'auto', display: 'block'}}
                    />
                </Box>
                {bild.description && (
                    <pre className="wrap-pre" style={{margin: '0 0 8px 0'}}>
                        {bild.description}
                    </pre>
                )}
            </Box>

            <CommentThread
                targetType="BILD" targetId={bild.id}
                prefix={<ReactionButtons targetType="BILD" targetId={bild.id}/>}
            />
        </Paper>
    );
};
