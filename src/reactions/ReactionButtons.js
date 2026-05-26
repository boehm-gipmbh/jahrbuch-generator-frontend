import {IconButton, Tooltip, Typography, Box} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import FlagIcon from '@mui/icons-material/Flag';
import FlagOutlinedIcon from '@mui/icons-material/OutlinedFlag';
import {useSelector} from 'react-redux';
import {useState} from 'react';
import {ReportDialog} from './ReportDialog';
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
    const [reportDialogOpen, setReportDialogOpen] = useState(false);

    const hasLike = data?.myReactions?.includes('LIKE');
    const hasVote = data?.myReactions?.includes('VOTE');
    const hasDislike = data?.myReactions?.includes('DISLIKE');
    const hasReport = data?.myReactions?.includes('REPORT');

    const toggle = (reactionType) => (e) => {
        e.stopPropagation();
        toggleReaction({targetType, targetId, reactionType});
    };

    const handleReportClick = (e) => {
        e.stopPropagation();
        if (hasReport) {
            toggleReaction({targetType, targetId, reactionType: 'REPORT'});
        } else {
            setReportDialogOpen(true);
        }
    };

    const handleReportConfirm = (message) => {
        setReportDialogOpen(false);
        toggleReaction({targetType, targetId, reactionType: 'REPORT', message});
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
                <Tooltip title={likeInfo} placement="top">
                    <Typography variant="caption" color="text.secondary" sx={{minWidth: 12, cursor: 'default'}}>
                        {data.likeCount}
                    </Typography>
                </Tooltip>
            )}

            <Tooltip title={hasVote ? 'Empfehlung entfernen' : 'Für Jahrbuch empfehlen'}>
                <IconButton size="small" onClick={toggle('VOTE')} sx={hasVote ? {color: 'primary.main'} : {}}>
                    {hasVote ? <ThumbUpIcon fontSize="small"/> : <ThumbUpOutlinedIcon fontSize="small"/>}
                </IconButton>
            </Tooltip>
            {data?.voteCount > 0 && (
                <Tooltip title={voteInfo} placement="top">
                    <Typography variant="caption" color="text.secondary" sx={{minWidth: 12, cursor: 'default'}}>
                        {data.voteCount}
                    </Typography>
                </Tooltip>
            )}

            <Tooltip title={hasDislike ? 'Ablehnung zurückziehen' : 'Nicht ins Jahrbuch'}>
                <IconButton size="small" onClick={toggle('DISLIKE')} sx={hasDislike ? {color: 'warning.main'} : {}}>
                    {hasDislike ? <ThumbDownIcon fontSize="small"/> : <ThumbDownOutlinedIcon fontSize="small"/>}
                </IconButton>
            </Tooltip>
            {data?.dislikeCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{minWidth: 12, cursor: 'default'}}>
                    {data.dislikeCount}
                </Typography>
            )}

            <Tooltip title={hasReport ? 'Meldung zurückziehen' : 'Inhalt melden'}>
                <IconButton size="small" onClick={handleReportClick} sx={hasReport ? {color: 'error.dark'} : {}}>
                    {hasReport ? <FlagIcon fontSize="small"/> : <FlagOutlinedIcon fontSize="small"/>}
                </IconButton>
            </Tooltip>
            {data?.reportCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{minWidth: 12, cursor: 'default'}}>
                    {data.reportCount}
                </Typography>
            )}

            <ReportDialog
                open={reportDialogOpen}
                onClose={() => setReportDialogOpen(false)}
                onConfirm={handleReportConfirm}
            />
        </Box>
    );
};
