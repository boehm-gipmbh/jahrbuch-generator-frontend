import {useState, useCallback} from 'react';
import {Tooltip, IconButton, Popover, Box, Typography, List, ListItem,
    ListItemButton, ListItemText, ListItemIcon, Divider, Badge, Button, Checkbox,
    Snackbar, Alert} from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import AuthImage from '../bilder/AuthImage';
import {useLinkItemsMutation, useUnlinkItemMutation} from './clusterApi';

const key = (type, id) => `${type}:${id}`;

export const ClusterButton = ({mode, item, storyBilder = [], storyTexte = []}) => {
    const [anchor, setAnchor] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [initial, setInitial] = useState(new Set());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [linkItems] = useLinkItemsMutation();
    const [unlinkItem] = useUnlinkItemMutation();

    const ownType = mode === 'bild' ? 'BILD' : 'TEXT';
    const ownId = item?.id;
    const clusterId = item?.clusterId ?? null;

    const memberCount = [
        ...storyBilder.filter(b => b.id !== ownId && b.clusterId != null && b.clusterId === clusterId),
        ...storyTexte.filter(t => !(mode === 'text' && t.id === ownId) && t.clusterId != null && t.clusterId === clusterId),
    ].length;

    const otherBilder = storyBilder.filter(b => b.id !== ownId);
    const otherTexte = storyTexte.filter(t => !(mode === 'text' && t.id === ownId));

    const handleOpen = useCallback((e) => {
        const cur = new Set();
        if (clusterId != null) {
            otherBilder.filter(b => b.clusterId === clusterId).forEach(b => cur.add(key('BILD', b.id)));
            otherTexte.filter(t => t.clusterId === clusterId).forEach(t => cur.add(key('TEXT', t.id)));
        }
        setSelected(new Set(cur));
        setInitial(new Set(cur));
        setAnchor(e.currentTarget);
    }, [clusterId, otherBilder, otherTexte]);

    const toggle = (type, id) => {
        const k = key(type, id);
        setSelected(prev => {
            const next = new Set(prev);
            next.has(k) ? next.delete(k) : next.add(k);
            return next;
        });
    };

    const hasChanges = () => {
        if (selected.size !== initial.size) return true;
        for (const k of selected) if (!initial.has(k)) return true;
        return false;
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError(null);
        try {
            for (const k of selected) {
                if (!initial.has(k)) {
                    const [type, id] = k.split(':');
                    await linkItems({typeA: ownType, idA: ownId, typeB: type, idB: Number(id)}).unwrap();
                }
            }
            for (const k of initial) {
                if (!selected.has(k)) {
                    const [type, id] = k.split(':');
                    await unlinkItem({type, id: Number(id)}).unwrap();
                }
            }
            if (selected.size === 0 && clusterId != null) {
                await unlinkItem({type: ownType, id: ownId}).unwrap();
            }
            setAnchor(null);
        } catch (e) {
            setError('Fehler beim Speichern: ' + (e?.data?.message ?? e?.status ?? e?.message ?? 'Unbekannt'));
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => { if (!saving) setAnchor(null); };

    return (
        <>
            <Tooltip title={clusterId ? `Cluster (${memberCount + 1} Items)` : 'Cluster erstellen'}>
                <IconButton size="small" onClick={handleOpen}>
                    <Badge badgeContent={memberCount > 0 ? memberCount + 1 : null} color="primary" overlap="circular">
                        <HubIcon fontSize="small" color={clusterId ? 'primary' : 'action'}/>
                    </Badge>
                </IconButton>
            </Tooltip>
            <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={handleClose}
                     anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}>
                <Box sx={{minWidth: 240, maxHeight: 420, display: 'flex', flexDirection: 'column'}}>
                    <Box sx={{flex: 1, overflowY: 'auto'}}>
                        {otherBilder.length > 0 && (
                            <>
                                <Box sx={{px: 2, pt: 1.5, pb: 0.5}}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">BILDER</Typography>
                                </Box>
                                <List dense disablePadding>
                                    {otherBilder.map(b => (
                                        <ListItem key={b.id} disablePadding>
                                            <ListItemButton onClick={() => toggle('BILD', b.id)}>
                                                <ListItemIcon sx={{minWidth: 36}}>
                                                    <Checkbox size="small" edge="start" disableRipple
                                                              checked={selected.has(key('BILD', b.id))}
                                                              sx={{p: 0}}/>
                                                </ListItemIcon>
                                                <ListItemIcon sx={{minWidth: 36}}>
                                                    <AuthImage
                                                        src={b.pfad?.startsWith('/') ? `/api/bilder/extern${b.pfad}` : b.pfad}
                                                        alt="" thumb
                                                        style={{width: 28, height: 28, objectFit: 'cover', borderRadius: 2}}/>
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
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">TEXTE</Typography>
                                </Box>
                                <List dense disablePadding>
                                    {otherTexte.map(t => (
                                        <ListItem key={t.id} disablePadding>
                                            <ListItemButton onClick={() => toggle('TEXT', t.id)}>
                                                <ListItemIcon sx={{minWidth: 36}}>
                                                    <Checkbox size="small" edge="start" disableRipple
                                                              checked={selected.has(key('TEXT', t.id))}
                                                              sx={{p: 0}}/>
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
                    {(otherBilder.length > 0 || otherTexte.length > 0) && (
                        <>
                            <Divider/>
                            <Box sx={{p: 1, display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                                <Button size="small" onClick={handleClose} disabled={saving}>Abbrechen</Button>
                                <Button size="small" variant="contained" onClick={handleSubmit}
                                        disabled={saving || !hasChanges()}>
                                    {saving ? 'Speichern…' : 'Übernehmen'}
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Popover>
            <Snackbar open={Boolean(error)} autoHideDuration={5000} onClose={() => setError(null)}
                      anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
                <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Snackbar>
        </>
    );
};