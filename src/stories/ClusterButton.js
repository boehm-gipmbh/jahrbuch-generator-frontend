import {useState} from 'react';
import {Tooltip, IconButton, Popover, Box, Typography, List, ListItem,
    ListItemButton, ListItemText, ListItemIcon, Divider, Badge} from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AuthImage from '../bilder/AuthImage';
import {useLinkItemsMutation, useUnlinkItemMutation} from './clusterApi';

export const ClusterButton = ({mode, item, storyBilder = [], storyTexte = []}) => {
    const [anchor, setAnchor] = useState(null);
    const [linkItems] = useLinkItemsMutation();
    const [unlinkItem] = useUnlinkItemMutation();

    const ownType = mode === 'bild' ? 'BILD' : 'TEXT';
    const ownId = item?.id;
    const clusterId = item?.clusterId ?? null;

    const clusterMembers = [
        ...storyBilder.filter(b => b.id !== ownId && b.clusterId != null && b.clusterId === clusterId),
        ...storyTexte.filter(t => t.clusterId != null && t.clusterId === clusterId),
    ];

    const otherBilder = storyBilder.filter(b => b.id !== ownId);
    const otherTexte = storyTexte.filter(t => !(mode === 'text' && t.id === ownId));

    const toggle = async (targetType, targetId, targetClusterId) => {
        if (clusterId != null && targetClusterId === clusterId) {
            // remove self from cluster
            await unlinkItem({type: ownType, id: ownId});
        } else {
            await linkItems({typeA: ownType, idA: ownId, typeB: targetType, idB: targetId});
        }
        setAnchor(null);
    };

    const handleUnlinkSelf = async () => {
        await unlinkItem({type: ownType, id: ownId});
        setAnchor(null);
    };

    const isLinked = (targetClusterId) =>
        clusterId != null && targetClusterId === clusterId;

    const memberCount = clusterMembers.length;

    return (
        <>
            <Tooltip title={clusterId ? `Cluster (${memberCount + 1} Items)` : 'Cluster erstellen'}>
                <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}>
                    <Badge badgeContent={memberCount > 0 ? memberCount + 1 : null} color="primary" overlap="circular">
                        <HubIcon fontSize="small" color={clusterId ? 'primary' : 'action'}/>
                    </Badge>
                </IconButton>
            </Tooltip>
            <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
                     anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}>
                <Box sx={{minWidth: 220, maxHeight: 400, overflow: 'auto'}}>
                    {clusterId && (
                        <>
                            <Box sx={{px: 2, pt: 1.5, pb: 0.5}}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                    AUS CLUSTER ENTFERNEN
                                </Typography>
                            </Box>
                            <List dense disablePadding>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={handleUnlinkSelf} sx={{color: 'error.main'}}>
                                        <ListItemText primary="Dieses Item entfernen"/>
                                    </ListItemButton>
                                </ListItem>
                            </List>
                            <Divider/>
                        </>
                    )}
                    {otherBilder.length > 0 && (
                        <>
                            <Box sx={{px: 2, pt: 1.5, pb: 0.5}}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                    BILDER
                                </Typography>
                            </Box>
                            <List dense disablePadding>
                                {otherBilder.map(b => (
                                    <ListItem key={b.id} disablePadding>
                                        <ListItemButton onClick={() => toggle('BILD', b.id, b.clusterId)}
                                                        selected={isLinked(b.clusterId)}>
                                            <ListItemIcon sx={{minWidth: 36}}>
                                                {isLinked(b.clusterId)
                                                    ? <CheckCircleIcon fontSize="small" color="primary"/>
                                                    : <AuthImage src={b.pfad?.startsWith('/') ? `/api/bilder/extern${b.pfad}` : b.pfad}
                                                                 alt="" thumb
                                                                 style={{width: 28, height: 28, objectFit: 'cover', borderRadius: 2}}/>
                                                }
                                            </ListItemIcon>
                                            <ListItemText primary={b.title || 'Kein Titel'}
                                                          primaryTypographyProps={{noWrap: true, variant: 'body2'}}/>
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                    {otherBilder.length > 0 && otherTexte.length > 0 && <Divider/>}
                    {otherTexte.length > 0 && (
                        <>
                            <Box sx={{px: 2, pt: 1.5, pb: 0.5}}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                    TEXTE
                                </Typography>
                            </Box>
                            <List dense disablePadding>
                                {otherTexte.map(t => (
                                    <ListItem key={t.id} disablePadding>
                                        <ListItemButton onClick={() => toggle('TEXT', t.id, t.clusterId)}
                                                        selected={isLinked(t.clusterId)}>
                                            <ListItemIcon sx={{minWidth: 36}}>
                                                {isLinked(t.clusterId) &&
                                                    <CheckCircleIcon fontSize="small" color="primary"/>}
                                            </ListItemIcon>
                                            <ListItemText primary={t.title || '(kein Titel)'}
                                                          primaryTypographyProps={{noWrap: true, variant: 'body2'}}/>
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                    {otherBilder.length === 0 && otherTexte.length === 0 && (
                        <Box sx={{p: 2}}>
                            <Typography variant="body2" color="text.secondary">
                                Keine anderen Items in dieser Story
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Popover>
        </>
    );
};