import React, {useState, useRef} from 'react';
import {
    Box, TextField, ToggleButton, ToggleButtonGroup, IconButton, Tooltip,
    Button, Popover, MenuList, MenuItem, Checkbox, ListItemText, Divider, Badge
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

const NONE = '__none__';

const StoryFilterButton = ({stories, storyFilter, setStoryFilter}) => {
    const [anchor, setAnchor] = useState(null);
    const timerRef = useRef(null);
    const scheduleClose = () => { timerRef.current = setTimeout(() => setAnchor(null), 400); };
    const cancelClose = () => { if (timerRef.current) clearTimeout(timerRef.current); };

    const toggle = (key) => {
        setStoryFilter(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const selectAll = () => {
        setStoryFilter(new Set([NONE, ...stories.map(s => s.id)]));
    };

    const selectNone = () => setStoryFilter(new Set());

    const activeCount = storyFilter.size;

    return (
        <>
            <Badge badgeContent={activeCount || null} color="primary">
                <Button
                    size="small" variant={activeCount ? 'contained' : 'outlined'}
                    startIcon={<FilterListIcon fontSize="small"/>}
                    onClick={e => setAnchor(a => a ? null : e.currentTarget)}
                    onMouseEnter={cancelClose}
                >
                    Stories
                </Button>
            </Badge>
            <Popover
                open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                transformOrigin={{vertical: 'top', horizontal: 'left'}}
                slotProps={{paper: {onMouseEnter: cancelClose, onMouseLeave: scheduleClose}}}
            >
                <Box sx={{display: 'flex', gap: 1, p: 1}}>
                    <Button size="small" onClick={selectAll}>Alle</Button>
                    <Button size="small" onClick={selectNone}>Keine</Button>
                </Box>
                <Divider/>
                <MenuList dense sx={{maxHeight: 300, overflowY: 'auto'}}>
                    <MenuItem onClick={() => toggle(NONE)} sx={{py: 0}}>
                        <Checkbox checked={storyFilter.has(NONE)} size="small"/>
                        <ListItemText primary="Ohne Story"/>
                    </MenuItem>
                    <Divider/>
                    {stories.map(s => (
                        <MenuItem key={s.id} onClick={() => toggle(s.id)} sx={{py: 0}}>
                            <Checkbox checked={storyFilter.has(s.id)} size="small"/>
                            <ListItemText primary={s.name}/>
                        </MenuItem>
                    ))}
                </MenuList>
            </Popover>
        </>
    );
};

export const FilterBar = ({
    search, setSearch,
    dateFrom, setDateFrom, dateTo, setDateTo,
    sortField, setSortField, sortAsc, setSortAsc,
    stories, storyFilter, setStoryFilter,
    noTitle, setNoTitle,
    noDescription, setNoDescription,
}) => (
    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center'}}>
        <TextField
            size="small" placeholder="Suchen…" value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{minWidth: 160}}
            InputProps={search ? {
                endAdornment: (
                    <IconButton size="small" onClick={() => setSearch('')} edge="end">
                        <ClearIcon fontSize="small"/>
                    </IconButton>
                )
            } : undefined}
        />
        <TextField
            size="small" type="datetime-local" label="Von"
            value={dateFrom}
            onChange={e => {
                const val = e.target.value;
                setDateFrom(val);
                if (val) {
                    const next = new Date(val);
                    next.setDate(next.getDate() + 1);
                    const pad = n => String(n).padStart(2, '0');
                    setDateTo(`${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`);
                }
            }}
            InputLabelProps={{shrink: true}}
        />
        <TextField
            size="small" type="datetime-local" label="Bis"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            InputLabelProps={{shrink: true}}
        />
        {stories && (
            <StoryFilterButton stories={stories} storyFilter={storyFilter} setStoryFilter={setStoryFilter}/>
        )}
        {setNoTitle && (
            <ToggleButton value="noTitle" size="small" selected={!!noTitle}
                onChange={() => setNoTitle(v => !v)}>
                Ohne Titel
            </ToggleButton>
        )}
        {setNoDescription && (
            <ToggleButton value="noDescription" size="small" selected={!!noDescription}
                onChange={() => setNoDescription(v => !v)}>
                Ohne Beschreibung
            </ToggleButton>
        )}
        <ToggleButtonGroup value={sortField} exclusive size="small" onChange={(_, v) => v && setSortField(v)}>
            <ToggleButton value="date">Datum</ToggleButton>
            <ToggleButton value="priority">Priorität</ToggleButton>
        </ToggleButtonGroup>
        <Tooltip title={sortAsc ? 'Aufsteigend' : 'Absteigend'}>
            <IconButton size="small" onClick={() => setSortAsc(v => !v)}>
                {sortAsc ? <ArrowUpwardIcon fontSize="small"/> : <ArrowDownwardIcon fontSize="small"/>}
            </IconButton>
        </Tooltip>
    </Box>
);

export const STORY_FILTER_NONE = NONE;