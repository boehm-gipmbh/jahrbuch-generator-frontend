import {Paper, Box, Typography, Tooltip, Checkbox} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import {EditTextPriority} from './Priority';
import {ReactionButtons} from '../reactions/ReactionButtons';
import {CommentThread} from '../comments/CommentThread';
import {api} from './api';
import {useState} from 'react';
import {clusterColor} from '../stories/clusterColor';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '';

export const PreviewTextCard = ({text}) => {
    const [updateText] = api.endpoints.updateText.useMutation();
    const [setTextComplete] = api.endpoints.setComplete.useMutation();
    const [priority, setPriorityState] = useState(text.priority);
    const isComplete = Boolean(text.complete);

    const setPriority = (p) => { setPriorityState(p); updateText({...text, priority: p}); };

    return (
        <Paper elevation={1} sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            borderLeft: text.clusterId ? `4px solid ${clusterColor(text.clusterId)}` : undefined,
        }}>
            <Box sx={{position: 'absolute', top: 0, left: 4, zIndex: 1}}>
                <EditTextPriority priority={priority} setPriority={setPriority} disabled={isComplete}/>
            </Box>

            <Tooltip title={isComplete ? 'Text ist geschützt' : 'Text kann gelöscht werden'}>
                <Checkbox
                    checked={isComplete}
                    checkedIcon={<LockIcon color="success" fontSize="small"/>}
                    icon={<LockOpenIcon color="action" fontSize="small"/>}
                    onChange={() => setTextComplete({text, complete: !isComplete})}
                    sx={{position: 'absolute', top: 0, right: 0, '&.Mui-checked': {color: t => t.palette.success.main}}}
                />
            </Tooltip>

            <Box sx={{flex: 1, pt: 3}}>
                <Typography variant="subtitle1" color="primary"
                    sx={{mb: 0.5, fontWeight: 'bold', textAlign: 'center'}}>
                    {text.title}
                </Typography>
                {(text.user?.name || text.created) && (
                    <Typography variant="caption" color="text.disabled"
                        sx={{display: 'block', textAlign: 'center', mb: 1, lineHeight: 1.4}}>
                        {[text.user?.name, fmtDate(text.created)].filter(Boolean).join(' · ')}
                    </Typography>
                )}
                {text.description && (
                    <pre className="wrap-pre" style={{margin: 0, minHeight: '3em',
                        fontFamily: "'Brush Script MT', cursive", fontSize: '0.95rem'}}>
                        {text.description}
                    </pre>
                )}
            </Box>

            <CommentThread
                targetType="TEXT" targetId={text.id}
                prefix={<ReactionButtons targetType="TEXT" targetId={text.id}/>}
            />
        </Paper>
    );
};
