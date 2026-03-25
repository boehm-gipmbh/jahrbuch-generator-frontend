import React, {useState, useMemo, useRef} from 'react';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    Checkbox,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography, Tooltip,
    Popover, MenuList, MenuItem, Divider, TextField as MuiTextField
} from '@mui/material';
import '../App.css';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteIcon from '@mui/icons-material/Delete';
import AddLinkIcon from '@mui/icons-material/AddLink';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import {IconButton} from '@mui/material';
import {api as texteApi} from './api';
import {EditTextPriority} from './Priority';
import {Layout, newText} from '../layout';
import {api as storyApi} from '../stories';
import {StoryChip} from './StoryChip';
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import {byDateDesc, byDateAsc, matchesSearch, matchesDateRange} from '../sortUtils';
import {FilterBar, STORY_FILTER_NONE} from '../FilterBar';

const AssignToStoryButton = ({text, stories}) => {
    const dispatch = useDispatch();
    const [updateText] = texteApi.endpoints.updateText.useMutation();
    const [addStory] = storyApi.endpoints.addStory.useMutation();
    const [anchor, setAnchor] = useState(null);
    const [newStoryName, setNewStoryName] = useState('');
    const timerRef = useRef(null);
    const scheduleClose = () => { timerRef.current = setTimeout(() => setAnchor(null), 400); };
    const cancelClose = () => { if (timerRef.current) clearTimeout(timerRef.current); };

    const assignTo = (storyId, knownStory) => {
        const storyObj = knownStory || stories.find(s => s.id === storyId) || null;
        dispatch(texteApi.util.updateQueryData('getTexte', undefined, draft => {
            const t = draft.find(t => t.id === text.id);
            if (t) t.story = storyObj ? {id: storyObj.id, name: storyObj.name} : null;
        }));
        updateText({...text, story: storyObj ? {id: storyId} : null}).unwrap()
            .catch(e => {
                dispatch(texteApi.util.invalidateTags(['Text']));
                console.error(e);
            });
        setAnchor(null);
    };

    const handleCreateAndAssign = () => {
        if (!newStoryName.trim()) return;
        addStory({name: newStoryName.trim()}).unwrap()
            .then(story => {
                dispatch(storyApi.util.invalidateTags(['Story']));
                assignTo(story.id, story);
            })
            .catch(e => console.error(e));
        setNewStoryName('');
    };

    return (
        <>
            <Tooltip title="Zu Story hinzufügen">
                <IconButton size="small"
                    onClick={e => { e.stopPropagation(); setAnchor(a => a ? null : e.currentTarget); }}>
                    <AddLinkIcon fontSize="small"/>
                </IconButton>
            </Tooltip>
            <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
                transitionDuration={0}
                anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                transformOrigin={{vertical: 'top', horizontal: 'left'}}
                slotProps={{paper: {onMouseEnter: cancelClose, onMouseLeave: scheduleClose}}}
            >
                <MenuList dense>
                    {stories.map(s => {
                        const isCurrent = text.story?.id === s.id;
                        return (
                            <MenuItem key={s.id} selected={isCurrent} onClick={() => assignTo(s.id)}
                                sx={{display: 'flex', gap: 1}}>
                                {isCurrent ? <CheckIcon fontSize="small" color="primary"/> : <Box sx={{width: 20}}/>}
                                {s.name}
                            </MenuItem>
                        );
                    })}
                </MenuList>
                <Divider/>
                <Box sx={{p: 1, display: 'flex', gap: 0.5}} onMouseEnter={cancelClose}>
                    <MuiTextField
                        size="small" placeholder="Neue Story…" value={newStoryName}
                        onChange={e => setNewStoryName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateAndAssign()}
                        autoComplete="off"
                        sx={{flex: 1}}
                    />
                    <IconButton size="small" onClick={handleCreateAndAssign} disabled={!newStoryName.trim()}>
                        <AddCircleOutlineIcon fontSize="small"/>
                    </IconButton>
                </Box>
            </Popover>
        </>
    );
};

const TextRow = ({text, story, storiesLoaded, stories, onSetComplete, onUpdate, onDelete}) => {
    const [editField, setEditField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [priority, setPriorityState] = useState(text.priority);
    const isComplete = Boolean(text.complete);

    const startEdit = (field) => { if (!isComplete) { setEditField(field); setEditValue(text[field] ?? ''); } };
    const commitEdit = () => {
        if (editField && editValue !== (text[editField] ?? '')) onUpdate({...text, [editField]: editValue});
        setEditField(null);
    };
    const handleKeyDown = (e) => {
        if (editField === 'title' && e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') setEditField(null);
    };

    return (
        <TableRow>
            <TableCell sx={{width: '2rem'}}>
                <Tooltip title={isComplete ? "Text ist geschützt" : "Text kann gelöscht werden"}>
                    <Checkbox
                        checked={isComplete}
                        checkedIcon={<LockIcon color="success" fontSize='small'/>}
                        icon={<LockOpenIcon color="action" fontSize='small'/>}
                        onChange={() => onSetComplete({text, complete: !isComplete})}
                        sx={{'&.Mui-checked': {color: theme => theme.palette.success.main}}}
                    />
                </Tooltip>
            </TableCell>
            <TableCell sx={{position: 'relative'}}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 0.5}}>
                    <Box sx={{flex: 1}}>
                        {editField === 'title' ? (
                            <MuiTextField autoFocus size="small" value={editValue} fullWidth
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit} onKeyDown={handleKeyDown}/>
                        ) : (
                            <Typography variant="subtitle1" component="span" color="primary"
                                sx={{fontWeight: 'bold', cursor: isComplete ? 'default' : 'text',
                                    '&:hover': !isComplete ? {backgroundColor: 'action.hover', borderRadius: 1} : {}}}
                                onClick={() => startEdit('title')}>
                                {text.title}
                            </Typography>
                        )}
                        {!Boolean(story) && <StoryChip text={text} size='small'/>}
                    </Box>
                    <Box>
                        <EditTextPriority priority={priority} setPriority={(p) => { setPriorityState(p); onUpdate({...text, priority: p}); }} disabled={isComplete}/>
                    </Box>
                </Box>
                {editField === 'description' ? (
                    <MuiTextField autoFocus size="small" multiline minRows={Math.max(3, (text.description || '').split('\n').length)} value={editValue} fullWidth
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit} onKeyDown={handleKeyDown}
                        inputProps={{style: {fontFamily: "'Brush Script MT', cursive", fontSize: '0.95rem'}}}/>
                ) : (
                    <pre className="wrap-pre" onClick={() => startEdit('description')}
                        style={{cursor: isComplete ? 'default' : 'text', minHeight: '2em'}}>
                        {text.description}
                    </pre>
                )}
                <Box sx={{position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1, padding: '2px'}}>
                    {storiesLoaded && <AssignToStoryButton text={text} stories={stories}/>}
                    <Tooltip title="Erinnerung löschen">
                        <span>
                            <IconButton disabled={isComplete} size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                                <DeleteIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );
};

export const Texte = ({title = 'Erinnerungen', filter = () => true}) => {
  const {storyId} = useParams();
  const {story, stories, storiesLoaded} = storyApi.endpoints.getStories.useQuery(undefined, {
    selectFromResult: ({data, isSuccess}) => ({
      story: data?.find(p => p.id === parseInt(storyId)),
      stories: data || [],
      storiesLoaded: isSuccess
    })
  });
  if (Boolean(story)) {
    title = story?.name;
    filter = text => text.story?.id === story.id;
  }
  const dispatch = useDispatch();
  const {data} = texteApi.endpoints.getTexte.useQuery(undefined, {pollingInterval: 10000});
  const [setComplete] = texteApi.endpoints.setComplete.useMutation();
  const [updateText] = texteApi.endpoints.updateText.useMutation();
  const [deleteText] = texteApi.endpoints.deleteText.useMutation();

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [storyFilter, setStoryFilter] = useState(new Set());

  const q = search.toLowerCase();
  const filteredTexte = useMemo(() => {
    const base = (data || []).filter(text => {
      if (!filter(text)) return false;
      if (!matchesSearch(text, q)) return false;
      if (!matchesDateRange(text, dateFrom, dateTo)) return false;
      if (storyFilter.size > 0) {
        const key = text.story ? text.story.id : STORY_FILTER_NONE;
        if (!storyFilter.has(key)) return false;
      }
      return true;
    });
    const cmp = sortField === 'priority'
      ? (sortAsc ? (a, b) => (a.priority ?? 0) - (b.priority ?? 0) : (a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      : (sortAsc ? byDateAsc : byDateDesc);
    return [...base].sort(cmp);
  }, [data, filter, q, dateFrom, dateTo, sortField, sortAsc, storyFilter]);

  return <Layout>
    <Box sx={{mt: 2}}>
      <Button startIcon={<AddIcon />} onClick={() => dispatch(newText({story: story}))}>
        Füge Deine Erinnerung hinzu
      </Button>
    </Box>
    <Container sx={{mt: theme => theme.spacing(2)}}>
      <Paper sx={{p: 2}}>
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          {title}
        </Typography>
        <FilterBar
          search={search} setSearch={setSearch}
          dateFrom={dateFrom} setDateFrom={setDateFrom}
          dateTo={dateTo} setDateTo={setDateTo}
          sortField={sortField} setSortField={setSortField}
          sortAsc={sortAsc} setSortAsc={setSortAsc}
          stories={storiesLoaded && !story ? stories : undefined}
          storyFilter={storyFilter} setStoryFilter={setStoryFilter}
        />
        <Table size='small'>
          <TableBody>
              {filteredTexte.map(text =>
                <TextRow
                    key={text.id}
                    text={text}
                    story={story}
                    storiesLoaded={storiesLoaded}
                    stories={stories}
                    onSetComplete={(args) => setComplete(args)}
                    onUpdate={(updated) => updateText(updated)}
                    onDelete={() => deleteText(text).unwrap()
                        .then(() => dispatch(texteApi.util.invalidateTags(['Text'])))
                        .catch(e => console.error(e))}
                />
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  </Layout>;
};
