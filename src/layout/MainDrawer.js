import React, {useState} from 'react';
import {Link, useMatch, useNavigate} from 'react-router-dom';
import {
    Box,
    Button,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Divider,
    Drawer, IconButton,
    List, ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    Toolbar,
    Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import InboxIcon from '@mui/icons-material/Inbox';
import SnippetFolderIcon from '@mui/icons-material/SnippetFolder';
import CircleIcon from '@mui/icons-material/Circle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckIcon from '@mui/icons-material/Check';
import PersonIcon from '@mui/icons-material/Person';
import {HasRole} from '../auth';
import {api as storyApi} from '../stories';

const Item = ({Icon, iconSize, title, to, disableTooltip = false, bold = false}) => {
    const match = Boolean(useMatch(to));
    return (
        <ListItemButton component={Link} to={to} selected={match}>
            {Icon && <Tooltip title={title} placement='right' disableHoverListener={disableTooltip}>
                <ListItemIcon><Icon fontSize={iconSize}/></ListItemIcon>
            </Tooltip>
            }
            <ListItemText primary={title} primaryTypographyProps={bold ? {fontWeight: 'bold'} : undefined}/>
        </ListItemButton>
    )
};

const DeleteStoryDialog = ({story, onClose}) => {
    const navigate = useNavigate();
    const [deleteStory] = storyApi.endpoints.deleteStory.useMutation();
    const [deleteStoryCascade] = storyApi.endpoints.deleteStoryCascade.useMutation();

    const handleDelete = (cascade) => {
        const action = cascade ? deleteStoryCascade(story.id) : deleteStory(story.id);
        action.unwrap()
            .then(() => { navigate('/bilder'); onClose(); })
            .catch(e => console.error(e));
    };

    return (
        <Dialog open onClose={onClose}>
            <DialogTitle>Story „{story.name}" löschen?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Was soll mit den Bildern und Texten in dieser Story passieren?
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{flexDirection: 'column', alignItems: 'stretch', gap: 1, p: 2}}>
                <Button variant="outlined" onClick={() => handleDelete(false)}>
                    Zurücklegen (Bilder &amp; Texte behalten)
                </Button>
                <Button variant="contained" color="error" onClick={() => handleDelete(true)}>
                    Mitlöschen (Bilder &amp; Texte löschen)
                </Button>
                <Button onClick={onClose}>Abbrechen</Button>
            </DialogActions>
        </Dialog>
    );
};

const StoryItem = ({s, drawerOpen}) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <>
            <ListItem disablePadding secondaryAction={drawerOpen &&
                <Tooltip title="Story löschen">
                    <IconButton edge="end" size="small" onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}>
                        <DeleteIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
            }>
                <ListItemButton component={Link} to={`/bilder/story/${s.id}`}
                    selected={Boolean(useMatch(`/bilder/story/${s.id}`))}>
                    <Tooltip title={s.name} placement='right' disableHoverListener={drawerOpen}>
                        <ListItemIcon><CircleIcon fontSize='small'/></ListItemIcon>
                    </Tooltip>
                    <ListItemText primary={s.name}/>
                </ListItemButton>
            </ListItem>
            {confirmDelete && <DeleteStoryDialog story={s} onClose={() => setConfirmDelete(false)}/>}
        </>
    );
};

const Stories = ({drawerOpen, openNewStory, stories}) => {
    const [search, setSearch] = useState('');
    const [sortAsc, setSortAsc] = useState(true);

    const filtered = Array.from(stories)
        .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

    return (
        <>
            <Divider/>
            <ListItem>
                <ListItemIcon><SnippetFolderIcon/></ListItemIcon>
                <ListItemText primaryTypographyProps={{fontWeight: 'medium'}}>
                    Deine Stories
                </ListItemText>
            </ListItem>
            {drawerOpen && (
                <Box sx={{px: 1, pb: 1, display: 'flex', gap: 0.5, alignItems: 'center'}}>
                    <Tooltip title={sortAsc ? 'A→Z' : 'Z→A'}>
                        <IconButton size="small" onClick={() => setSortAsc(v => !v)}>
                            {sortAsc ? <ArrowUpwardIcon fontSize="small"/> : <ArrowDownwardIcon fontSize="small"/>}
                        </IconButton>
                    </Tooltip>
                    <TextField
                        size="small" placeholder="Suchen…" value={search}
                        onChange={e => setSearch(e.target.value)}
                        sx={{flex: 1}}
                        InputProps={search ? {
                            endAdornment: (
                                <IconButton size="small" onClick={() => setSearch('')} edge="end">
                                    <ClearIcon fontSize="small"/>
                                </IconButton>
                            )
                        } : undefined}
                    />
                    <Tooltip title="Neue Story">
                        <IconButton size="small" onClick={openNewStory}>
                            <AddIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
            {filtered.map(s => (
                <StoryItem key={s.id} s={s} drawerOpen={drawerOpen}/>
            ))}
        </>
    );
};

export const MainDrawer = ({drawerOpen, toggleDrawer, openNewStory, openNewBild, stories = [], bilder ={}}) => (
    <Drawer
        open={drawerOpen} onClose={toggleDrawer} variant='permanent'
        sx={{
            width: theme => drawerOpen ? theme.layout.drawerWidth : theme.spacing(7),
            '& .MuiDrawer-paper': theme => ({
                width: theme.layout.drawerWidth,
                ...(!drawerOpen && {
                    width: theme.spacing(7),
                    overflowX: 'hidden'
                })
            })
        }}
    >
        <Toolbar/>
        <Box sx={{overflow: drawerOpen ? 'auto' : 'hidden'}}>
            <List>
                <Item disableTooltip={drawerOpen} Icon={AssignmentIcon} title='Deine Erinnerungen' to='/texte' bold/>

                <Divider/>
                <Item disableTooltip={drawerOpen} Icon={AssignmentIcon} title='Deine Bilder' to='/bilder' bold/>
                <Stories
                    drawerOpen={drawerOpen} openNewStory={openNewStory} stories={stories}
                />

                <HasRole role='admin'>
                    <Divider/>
                    <Item disableTooltip={drawerOpen} Icon={PersonIcon} title='Users' to='/users'/>
                </HasRole>
            </List>
        </Box>
    </Drawer>
);
