import {IconButton, Tooltip, Typography, Box} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {useSelector} from 'react-redux';
import {api} from './api';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'}) : '';

const parseJwtName = (jwt) => {
    try {
        return JSON.parse(atob(jwt.split('.')[1])).upn;
    } catch {
        return null;
    }
};

const reactorTooltip = (list, myName) =>
    list?.length
        ? <Box>{list.map((r, i) => <Box key={i}>{r.userName === myName ? 'Du' : r.userName} · {fmtDate(r.createdAt)}</Box>)}</Box>
        : null;

export const ReactionButtons = ({targetType, targetId}) => {
    const jwt = useSelector(state => state.auth.jwt);
    const myName = parseJwtName(jwt);
    const {data} = api.endpoints.getCounts.useQuery({targetType, targetId});
    const [toggleReaction] = api.endpoints.toggleReaction.useMutation();

    const hasLike = data?.myReactions?.includes('LIKE');
    const hasVote = data?.myReactions?.includes('VOTE');

    const toggle = (reactionType) => (e) => {
        e.stopPropagation();
        toggleReaction({targetType, targetId, reactionType});
    };

    const likeInfo = reactorTooltip(data?.likes, myName);
    const voteInfo = reactorTooltip(data?.votes, myName);

    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
            <Tooltip title={hasLike ? 'Like entfernen' : 'Gefällt mir'}>
                <IconButton size="small" onClick={toggle('LIKE')} sx={hasLike ? {color: 'error.main'} : {}}>
                    {hasLike ? <FavoriteIcon fontSize="small"/> : <FavoriteBorderIcon fontSize="small"/>}
                </IconButton>
            </Tooltip>
            {data?.likeCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{minWidth: 12}}>
                    {data.likeCount}
                </Typography>
            )}
            {likeInfo && (
                <Tooltip title={likeInfo} placement="top">
                    <InfoOutlinedIcon sx={{fontSize: 12, color: 'text.disabled', cursor: 'default'}}/>
                </Tooltip>
            )}

            <Tooltip title={hasVote ? 'Empfehlung entfernen' : 'Empfehlen'}>
                <IconButton size="small" onClick={toggle('VOTE')} sx={hasVote ? {color: 'primary.main'} : {}}>
                    {hasVote ? <ThumbUpIcon fontSize="small"/> : <ThumbUpOutlinedIcon fontSize="small"/>}
                </IconButton>
            </Tooltip>
            {data?.voteCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{minWidth: 12}}>
                    {data.voteCount}
                </Typography>
            )}
            {voteInfo && (
                <Tooltip title={voteInfo} placement="top">
                    <InfoOutlinedIcon sx={{fontSize: 12, color: 'text.disabled', cursor: 'default'}}/>
                </Tooltip>
            )}
        </Box>
    );
};
