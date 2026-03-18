import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {Paper, Box, Typography, Tooltip, Checkbox, IconButton} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AuthImage from './AuthImage';
import {Priority} from '../texte/Priority';
import {StoryChip} from '../texte/StoryChip';

export const SortableBildCard = ({bild, story, onClickBild, onSetComplete, onRemoveFromStory}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: `bild-${bild.id}`
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box ref={setNodeRef} style={style}>
            <Paper elevation={isDragging ? 4 : 1} sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* Drag Handle */}
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{
                        position: 'absolute',
                        top: 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        cursor: 'grab',
                        zIndex: 2,
                        color: 'action.disabled',
                        '&:hover': {color: 'action.active'}
                    }}
                >
                    <DragIndicatorIcon fontSize="small" sx={{transform: 'rotate(90deg)'}}/>
                </Box>

                {/* Priority oben links */}
                {Boolean(bild.priority) && (
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            onClickBild(bild);
                        }}
                        sx={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            zIndex: 1,
                            cursor: 'pointer'
                        }}
                    >
                        <Priority priority={bild.priority}/>
                    </Box>
                )}

                {/* Löschschutz oben rechts */}
                <Tooltip title={bild.complete ? "Bild ist geschützt" : "Bild kann gelöscht werden"}>
                    <Checkbox
                        checked={Boolean(bild.complete)}
                        checkedIcon={<LockIcon color="success" fontSize='small'/>}
                        icon={<LockOpenIcon color="action" fontSize='small'/>}
                        onChange={() => onSetComplete({bild, complete: !Boolean(bild.complete)})}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            '&.Mui-checked': {
                                color: theme => theme.palette.success.main
                            }
                        }}
                    />
                </Tooltip>

                <Box
                    onClick={() => onClickBild(bild)}
                    sx={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        pt: 3
                    }}
                >
                    <Typography variant="subtitle1" component="div" color="primary"
                                sx={{mb: 1, fontWeight: 'bold', textAlign: 'center'}}>
                        {bild.title || 'Kein Titel'}
                    </Typography>

                    <Box sx={{mb: 2}}>
                        <AuthImage
                            src={bild.pfad?.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}
                            alt={bild.description || ''}
                            thumb
                            style={{width: '100%', height: 'auto', display: 'block'}}
                        />
                    </Box>

                    <Box sx={{mt: 'auto'}}>
                        <pre className="wrap-pre">
                            {bild.description}
                            {!Boolean(story) && <StoryChip bild={bild} size='small'/>}
                        </pre>
                    </Box>
                </Box>
                <Box sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    padding: '2px',
                    zIndex: 1
                }}>
                    <Tooltip title="Aus Story entfernen">
                        <span>
                            <IconButton
                                disabled={Boolean(bild.complete)}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveFromStory(bild);
                                }}
                            >
                                <LinkOffIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Paper>
        </Box>
    );
};
