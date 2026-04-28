import React, {useState, useEffect} from 'react';
import {Link, useMatch, useNavigate} from 'react-router-dom';
import {
    Badge,
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
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import SnippetFolderIcon from '@mui/icons-material/SnippetFolder';
import CircleIcon from '@mui/icons-material/Circle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Typography from '@mui/material/Typography';
import VideocamIcon from '@mui/icons-material/Videocam';
import {DndContext, closestCenter, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy, useSortable, arrayMove} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {api as storyApi} from '../stories';
import {api as bilderApi} from '../bilder/api';
import {api as texteApi} from '../texte/api';
import {api as videoApi} from '../videos/api';

const PapierkorbItem = ({disableTooltip}) => {
    const {data: bilderDeleted = []} = bilderApi.endpoints.getPapierkorb.useQuery();
    const {data: texteDeleted = []} = texteApi.endpoints.getPapierkorb.useQuery();
    const {data: videosDeleted = []} = videoApi.endpoints.getPapierkorb.useQuery();
    const count = bilderDeleted.length + texteDeleted.length + videosDeleted.length;
    const match = Boolean(useMatch('/papierkorb'));
    return (
        <ListItemButton component={Link} to='/papierkorb' selected={match}>
            <Tooltip title='Papierkorb' placement='right' disableHoverListener={disableTooltip}>
                <ListItemIcon>
                    <Badge badgeContent={count} color="error" max={99}>
                        <DeleteOutlineIcon/>
                    </Badge>
                </ListItemIcon>
            </Tooltip>
            <ListItemText primary='Papierkorb'/>
        </ListItemButton>
    );
};

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

const SortableStoryItem = ({s, drawerOpen, isDragDisabled}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: s.id,
        disabled: isDragDisabled,
    });
    const [confirmDelete, setConfirmDelete] = useState(false);
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <>
            <ListItem
                ref={setNodeRef}
                style={style}
                disablePadding
                secondaryAction={drawerOpen &&
                    <Tooltip title="Story löschen">
                        <IconButton edge="end" size="small" onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}>
                            <DeleteIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                }
            >
                {drawerOpen && !isDragDisabled && (
                    <Box
                        {...attributes}
                        {...listeners}
                        sx={{
                            display: 'flex', alignItems: 'center',
                            pl: 0.5, cursor: 'grab',
                            color: 'text.disabled',
                            touchAction: 'none',
                            flexShrink: 0,
                        }}
                    >
                        <DragHandleIcon fontSize="small"/>
                    </Box>
                )}
                <ListItemButton component={Link} to={`/bilder/story/${s.id}`}
                    selected={Boolean(useMatch(`/bilder/story/${s.id}`))}
                    sx={{flex: 1, minWidth: 0}}
                >
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
    const [orderedStories, setOrderedStories] = useState([]);
    const [reorderStories] = storyApi.endpoints.reorderStories.useMutation();

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {distance: 5},
    }));

    useEffect(() => {
        setOrderedStories([...stories].sort((a, b) => (a.orderPosition ?? 0) - (b.orderPosition ?? 0)));
    }, [stories]);

    const filtered = search
        ? orderedStories.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
        : orderedStories;

    const handleDragEnd = ({active, over}) => {
        if (!over || active.id === over.id) return;
        setOrderedStories(prev => {
            const oldIndex = prev.findIndex(s => s.id === active.id);
            const newIndex = prev.findIndex(s => s.id === over.id);
            const next = arrayMove(prev, oldIndex, newIndex);
            reorderStories(next.map(s => s.id));
            return next;
        });
    };

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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filtered.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {filtered.map(s => (
                        <SortableStoryItem key={s.id} s={s} drawerOpen={drawerOpen} isDragDisabled={!!search}/>
                    ))}
                </SortableContext>
            </DndContext>
        </>
    );
};

const VersionFooter = ({drawerOpen}) => {
    const [backendVersion, setBackendVersion] = useState(null);
    useEffect(() => {
        fetch('/api/v1/info')
            .then(r => r.json())
            .then(d => setBackendVersion(d.version))
            .catch(() => {});
    }, []);

    const fe = process.env.REACT_APP_VERSION;
    const be = backendVersion;
    if (!drawerOpen || (!fe && !be)) return null;
    return (
        <Typography variant='caption' sx={{p: 1, color: 'text.disabled', display: 'block', lineHeight: 1.6}}>
            {fe && <span>fe: {fe}</span>}
            {fe && be && <br />}
            {be && <span>be: {be}</span>}
        </Typography>
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
        <Box sx={{overflow: drawerOpen ? 'auto' : 'hidden', flexGrow: 1}}>
            <List>
                <Item disableTooltip={drawerOpen} Icon={AssignmentIcon} title='Deine Erinnerungen' to='/texte' bold/>

                <Divider/>
                <Item disableTooltip={drawerOpen} Icon={AssignmentIcon} title='Deine Bilder' to='/bilder' bold/>
                <Item disableTooltip={drawerOpen} Icon={VideocamIcon} title='Deine Videos' to='/videos' bold/>
                <PapierkorbItem disableTooltip={drawerOpen}/>
                <Stories
                    drawerOpen={drawerOpen} openNewStory={openNewStory} stories={stories}
                />

            </List>
        </Box>
        <VersionFooter drawerOpen={drawerOpen} />
    </Drawer>
);
