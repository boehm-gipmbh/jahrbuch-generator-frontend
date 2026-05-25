import {useState} from 'react';
import {Box, Typography, IconButton, TextField, Button, Tooltip, Divider, Collapse} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReplyIcon from '@mui/icons-material/Reply';
import CommentIcon from '@mui/icons-material/Comment';
import {useSelector} from 'react-redux';
import {api} from './api';
import {ReactionButtons} from '../reactions/ReactionButtons';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
}) : '';

const CommentInput = ({onSubmit, placeholder = 'Kommentar schreiben …', autoFocus = false, onCancel}) => {
    const [value, setValue] = useState('');
    const submit = () => {
        if (!value.trim()) return;
        onSubmit(value.trim());
        setValue('');
    };
    return (
        <Box sx={{display: 'flex', gap: 0.5, alignItems: 'flex-end', mt: 0.5}}>
            <TextField
                size="small" multiline maxRows={4} fullWidth
                placeholder={placeholder}
                value={value}
                autoFocus={autoFocus}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
                    if (e.key === 'Escape' && onCancel) onCancel();
                }}
                sx={{'& .MuiInputBase-root': {fontSize: '0.8rem'}}}
            />
            <Button size="small" variant="contained" disableElevation onClick={submit}
                disabled={!value.trim()} sx={{minWidth: 0, px: 1.5, flexShrink: 0}}>
                OK
            </Button>
        </Box>
    );
};

const SingleComment = ({comment, targetType, depth = 0, onReply}) => {
    const [deleteComment] = api.endpoints.deleteComment.useMutation();

    return (
        <Box sx={{ml: depth > 0 ? 2 : 0, mt: 0.5}}>
            <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 0.5}}>
                <Box sx={{flex: 1, minWidth: 0}}>
                    <Box sx={{display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap'}}>
                        <Typography variant="caption" fontWeight="bold" color="text.primary">
                            {comment.mine ? 'Du' : comment.userName}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            {fmtDate(comment.createdAt)}
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                        {comment.content}
                    </Typography>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                        <ReactionButtons targetType="COMMENT" targetId={comment.id}/>
                        {depth === 0 && (
                            <Tooltip title="Antworten">
                                <IconButton size="small" onClick={() => onReply(comment.id)}
                                    sx={{color: 'text.disabled'}}>
                                    <ReplyIcon sx={{fontSize: '0.9rem'}}/>
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
                {comment.canDelete && (
                    <Tooltip title="Kommentar löschen">
                        <IconButton size="small" sx={{color: 'text.disabled', flexShrink: 0}}
                            onClick={() => deleteComment({commentId: comment.id, targetType, targetId: comment.targetId})}>
                            <DeleteOutlineIcon sx={{fontSize: '0.9rem'}}/>
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
};

/**
 * prefix: ReactNode rendered in the same flex row as the comment icon (e.g. <ReactionButtons/>)
 * actionButtons: ReactNode rendered right-aligned in the same row (e.g. delete/link buttons for the card)
 */
export const CommentThread = ({targetType, targetId, prefix, actionButtons}) => {
    const jwt = useSelector(state => state.auth.jwt);
    const [open, setOpen] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const {data: comments = []} = api.endpoints.getComments.useQuery(
        {targetType, targetId},
        {skip: !open && !jwt}
    );
    const [addComment] = api.endpoints.addComment.useMutation();

    const total = open
        ? comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0)
        : 0;

    const submit = (content, parentId = null) => {
        addComment({targetType, targetId, content, parentId});
        setReplyTo(null);
    };

    if (!jwt) return prefix ?? null;

    return (
        <Box onClick={e => e.stopPropagation()} sx={{flex: 1}}>
            {/* Action row: prefix (reactions) + comment toggle + count + right actions */}
            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                {prefix}
                <Tooltip title={open ? 'Kommentare schließen' : 'Kommentare anzeigen'}>
                    <IconButton size="small"
                        onClick={() => { setOpen(v => !v); setReplyTo(null); }}
                        sx={{color: open ? 'primary.main' : 'text.disabled'}}>
                        <CommentIcon sx={{fontSize: '1rem'}}/>
                    </IconButton>
                </Tooltip>
                {total > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{cursor: 'default', mr: 0.5}}>
                        {total}
                    </Typography>
                )}
                {actionButtons && <Box sx={{ml: 'auto'}}>{actionButtons}</Box>}
            </Box>

            {/* Expanded thread */}
            <Collapse in={open}>
                <Box sx={{mt: 0.5, px: 0.5}}>
                    {comments.length > 0 && <Divider sx={{mb: 0.5}}/>}
                    {comments.map(comment => (
                        <Box key={comment.id}>
                            <SingleComment comment={comment} targetType={targetType} depth={0}
                                onReply={id => setReplyTo(replyTo === id ? null : id)}/>
                            {comment.replies?.map(reply => (
                                <SingleComment key={reply.id} comment={reply} targetType={targetType} depth={1}
                                    onReply={() => {}}/>
                            ))}
                            {replyTo === comment.id && (
                                <Box sx={{ml: 2}}>
                                    <CommentInput autoFocus placeholder="Antworten …"
                                        onCancel={() => setReplyTo(null)}
                                        onSubmit={content => submit(content, comment.id)}/>
                                </Box>
                            )}
                        </Box>
                    ))}
                    <CommentInput onSubmit={content => submit(content)}/>
                </Box>
            </Collapse>
        </Box>
    );
};
