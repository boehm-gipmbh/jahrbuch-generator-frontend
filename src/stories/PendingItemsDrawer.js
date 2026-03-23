import React, {useState, useMemo} from 'react';
import {
    Drawer, Box, Typography, TextField, ToggleButton, ToggleButtonGroup, Paper, IconButton, Tooltip
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import AuthImage from '../bilder/AuthImage';

const matchesDateRange = (item, dateFrom, dateTo) => {
    if (!dateFrom && !dateTo) return true;
    const created = new Date(item.created);
    if (dateFrom && created < new Date(dateFrom)) return false;
    if (dateTo && created > new Date(dateTo)) return false;
    return true;
};

const sortItems = (items, sortBy) => [...items].sort((a, b) => {
    if (sortBy === 'priority') return (b.priority ?? 0) - (a.priority ?? 0);
    return new Date(b.created) - new Date(a.created);
});

export const PendingItemsDrawer = ({open, onClose, bilder, texte, onAssign}) => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const pendingBilder = useMemo(() =>
        (bilder || []).filter(b => !b.story), [bilder]);
    const pendingTexte = useMemo(() =>
        (texte || []).filter(t => !t.story), [texte]);

    const q = search.toLowerCase();
    const filteredBilder = useMemo(() => {
        const filtered = typeFilter === 'text' ? [] :
            pendingBilder.filter(b =>
                (!q || (b.title || '').toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q)) &&
                matchesDateRange(b, dateFrom, dateTo));
        return sortItems(filtered, sortBy);
    }, [pendingBilder, q, typeFilter, sortBy, dateFrom, dateTo]);

    const filteredTexte = useMemo(() => {
        const filtered = typeFilter === 'bild' ? [] :
            pendingTexte.filter(t =>
                (!q || (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)) &&
                matchesDateRange(t, dateFrom, dateTo));
        return sortItems(filtered, sortBy);
    }, [pendingTexte, q, typeFilter, sortBy, dateFrom, dateTo]);

    const empty = filteredBilder.length === 0 && filteredTexte.length === 0;

    return (
        <Drawer anchor="right" open={open} onClose={onClose}
            PaperProps={{sx: {width: {xs: '100%', sm: 380}, p: 2, display: 'flex', flexDirection: 'column'}}}>

            <Typography variant="h6" gutterBottom>Aus Bibliothek hinzufügen</Typography>

            <TextField
                size="small" fullWidth placeholder="Suchen…"
                value={search} onChange={e => setSearch(e.target.value)}
                sx={{mb: 1}}
            />
            <Box sx={{display: 'flex', gap: 1, mb: 1}}>
                <TextField
                    size="small" type="datetime-local" label="Von"
                    value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    InputLabelProps={{shrink: true}} sx={{flex: 1}}
                />
                <TextField
                    size="small" type="datetime-local" label="Bis"
                    value={dateTo} onChange={e => setDateTo(e.target.value)}
                    InputLabelProps={{shrink: true}} sx={{flex: 1}}
                />
            </Box>

            <Box sx={{display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap'}}>
                <ToggleButtonGroup
                    value={typeFilter} exclusive size="small"
                    onChange={(_, v) => v && setTypeFilter(v)}
                >
                    <ToggleButton value="all">Alle</ToggleButton>
                    <ToggleButton value="bild">Bilder</ToggleButton>
                    <ToggleButton value="text">Texte</ToggleButton>
                </ToggleButtonGroup>
                <ToggleButtonGroup
                    value={sortBy} exclusive size="small"
                    onChange={(_, v) => v && setSortBy(v)}
                >
                    <ToggleButton value="date">Datum</ToggleButton>
                    <ToggleButton value="priority">Priorität</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Box sx={{overflowY: 'auto', flex: 1}}>
                {empty && (
                    <Typography color="text.secondary" variant="body2">Keine unzugeordneten Einträge gefunden.</Typography>
                )}

                {filteredBilder.map(bild => (
                    <Paper key={bild.id} variant="outlined"
                        sx={{p: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                            '&:hover': {bgcolor: 'action.hover'}}}
                        onClick={() => onAssign('bild', bild)}>
                        <Tooltip placement="left" title={
                            <AuthImage
                                src={bild.pfad?.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}
                                alt={bild.title || ''}
                                thumb
                                style={{width: 200, height: 200, objectFit: 'contain', display: 'block'}}
                            />
                        }>
                            <span>
                                <AuthImage
                                    src={bild.pfad?.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}
                                    alt={bild.title || ''}
                                    thumb
                                    style={{width: 56, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0, display: 'block'}}
                                />
                            </span>
                        </Tooltip>
                        <Tooltip title={bild.description || ''} placement="top">
                            <Typography variant="body2" sx={{flex: 1}} noWrap>{bild.title || 'Kein Titel'}</Typography>
                        </Tooltip>
                        <Tooltip title="Zur Story hinzufügen">
                            <IconButton size="small" onClick={e => { e.stopPropagation(); onAssign('bild', bild); }}>
                                <AddCircleOutlineIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Paper>
                ))}

                {filteredTexte.map(text => (
                    <Paper key={text.id} variant="outlined"
                        sx={{p: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                            '&:hover': {bgcolor: 'action.hover'}}}
                        onClick={() => onAssign('text', text)}>
                        <Box sx={{
                            width: 56, height: 56, flexShrink: 0, borderRadius: 1,
                            bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TextSnippetIcon color="action"/>
                        </Box>
                        <Box sx={{flex: 1, minWidth: 0}}>
                            <Tooltip title={text.description || ''} placement="top">
                                <Typography variant="body2" noWrap>{text.title || 'Kein Titel'}</Typography>
                            </Tooltip>
                        </Box>
                        <Tooltip title="Zur Story hinzufügen">
                            <IconButton size="small" onClick={e => { e.stopPropagation(); onAssign('text', text); }}>
                                <AddCircleOutlineIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Paper>
                ))}
            </Box>
        </Drawer>
    );
};
