import {IconButton, Tooltip, Typography, Box} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {api} from './api';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'}) : '';

const reactorTooltip = (list) =>
    list?.length
        ? <Box>{list.map((r, i) => <Box key={i}>{r.userName} · {fmtDate(r.createdAt)}</Box>)}</Box>
        : '';

export const ReactionButtons = ({targetType, targetId}) => {
    const {data} = api.endpoints.getCounts.useQuery({targetType, targetId});
    const [toggleReaction] = api.endpoints.toggleReaction.useMutation();

    const hasLike = data?.myReactions?.includes('LIKE');
    const hasFavorit = data?.myReactions?.includes('FAVORIT');

    const toggle = (reactionType) => (e) => {
        e.stopPropagation();
        toggleReaction({targetType, targetId, reactionType});
    };

    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
            <Tooltip title={hasLike ? 'Like entfernen' : 'Gefällt mir'}>
                <IconButton size="small" onClick={toggle('LIKE')} sx={hasLike ? {color: 'error.main'} : {}}>
                    {hasLike ? <FavoriteIcon fontSize="small"/> : <FavoriteBorderIcon fontSize="small"/>}
                </IconButton>
            </Tooltip>
            {data?.likeCount > 0 && (
                <Tooltip title={reactorTooltip(data.likes)} placement="top">
                    <Typography variant="caption" color="text.secondary" sx={{minWidth: 12, cursor: 'default'}}>
                        {data.likeCount}
                    </Typography>
                </Tooltip>
            )}
            <Tooltip title={hasFavorit ? 'Favorit entfernen' : 'Als Favorit markieren'}>
                <IconButton size="small" onClick={toggle('FAVORIT')} sx={hasFavorit ? {color: 'warning.main'} : {}}>
                    {hasFavorit ? <StarIcon fontSize="small"/> : <StarBorderIcon fontSize="small"/>}
                </IconButton>
            </Tooltip>
            {data?.favoritCount > 0 && (
                <Tooltip title={reactorTooltip(data.favoriten)} placement="top">
                    <Typography variant="caption" color="text.secondary" sx={{minWidth: 12, cursor: 'default'}}>
                        {data.favoritCount}
                    </Typography>
                </Tooltip>
            )}
        </Box>
    );
};
