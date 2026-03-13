import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {TableRow, TableCell, Box, Typography, Tooltip, Checkbox, IconButton} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import {Priority} from './Priority';
import {StoryChip} from './StoryChip';

export const SortableTextRow = ({text, story, onClickText, onSetComplete, onDeleteText}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: text.id
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <TableRow ref={setNodeRef} style={style}>
            <TableCell
                sx={{width: '2rem', position: 'relative', verticalAlign: 'top', paddingTop: '8px'}}
            >
                <Tooltip title={text.complete ? "Text ist geschützt" : "Text kann gelöscht werden"}>
                    <Checkbox
                        checked={Boolean(text.complete)}
                        checkedIcon={<LockIcon color="success" fontSize='small'/>}
                        icon={<LockOpenIcon color="action" fontSize='small'/>}
                        onChange={() => onSetComplete({text, complete: !Boolean(text.complete)})}
                        sx={{
                            padding: '0',
                            '&.Mui-checked': {
                                color: theme => theme.palette.success.main
                            }
                        }}
                    />
                </Tooltip>
            </TableCell>
            <TableCell
                onClick={() => onClickText(text)}
                sx={{cursor: 'pointer', position: 'relative'}}
            >
                <Box
                    sx={{display: 'flex', justifyContent: 'center', cursor: 'grab', mb: 0.5}}
                    {...attributes}
                    {...listeners}
                >
                    <DragIndicatorIcon
                        fontSize="small"
                        sx={{transform: 'rotate(90deg)', color: 'action.disabled', '&:hover': {color: 'action.active'}}}
                    />
                </Box>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <Box sx={{flex: 1}}>
                        <Typography variant="subtitle1" component="span" color="primary"
                                    sx={{fontWeight: 'bold'}}>
                            {text.title}
                        </Typography> {!Boolean(story) &&
                        <StoryChip text={text} size='small'/>}
                    </Box>
                    <Box>
                        {Boolean(text.priority) && <Priority priority={text.priority}/>}
                    </Box>
                </Box>
                <Box sx={{flex: 1}}>
                    <pre className="wrap-pre">
                        {text.description} {!Boolean(story) &&
                        <StoryChip text={text} size='small'/>}
                    </pre>
                </Box>
                <Box sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    padding: '2px',
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
            </TableCell>
        </TableRow>
    );
};
