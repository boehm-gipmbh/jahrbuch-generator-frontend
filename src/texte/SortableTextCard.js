import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {Paper, Box, Typography, Tooltip, Checkbox, IconButton} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import {Priority} from './Priority';
import {StoryChip} from './StoryChip';

export const SortableTextCard = ({text, story, onClickText, onSetComplete, onDeleteText}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: `text-${text.id}`
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
                {Boolean(text.priority) && (
                    <Box sx={{position: 'absolute', top: 4, left: 4, zIndex: 1}}>
                        <Priority priority={text.priority}/>
                    </Box>
                )}

                {/* Lock oben rechts */}
                <Tooltip title={text.complete ? "Text ist geschützt" : "Text kann gelöscht werden"}>
                    <Checkbox
                        checked={Boolean(text.complete)}
                        checkedIcon={<LockIcon color="success" fontSize='small'/>}
                        icon={<LockOpenIcon color="action" fontSize='small'/>}
                        onChange={() => onSetComplete({text, complete: !Boolean(text.complete)})}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            '&.Mui-checked': {color: theme => theme.palette.success.main}
                        }}
                    />
                </Tooltip>

                {/* Inhalt */}
                <Box
                    onClick={() => onClickText(text)}
                    sx={{cursor: 'pointer', flex: 1, pt: 3}}
                >
                    <Typography variant="subtitle1" component="div" color="primary"
                                sx={{mb: 1, fontWeight: 'bold', textAlign: 'center'}}>
                        {text.title}
                        {!Boolean(story) && <StoryChip text={text} size='small'/>}
                    </Typography>
                    <pre className="wrap-pre">{text.description}</pre>
                </Box>

                {/* Delete unten rechts */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    padding: '2px',
                    zIndex: 1
                }}>
                    <Tooltip title="Erinnerung löschen">
                        <span>
                            <IconButton
                                disabled={Boolean(text.complete)}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteText(text);
                                }}
                            >
                                <DeleteIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Paper>
        </Box>
    );
};
