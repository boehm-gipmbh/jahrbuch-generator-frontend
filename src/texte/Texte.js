import React, {useState, useMemo} from 'react';
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
    Typography, Tooltip
} from '@mui/material';
import '../App.css';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteIcon from '@mui/icons-material/Delete';
import {IconButton} from '@mui/material';
import {api as texteApi} from './api';
import {Priority} from './Priority';
import {Layout, newText, setOpenText} from '../layout';
import {api as storyApi} from '../stories';
import {StoryChip} from './StoryChip';
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import {byDateDesc, byDateAsc, matchesSearch, matchesDateRange} from '../sortUtils';
import {FilterBar, STORY_FILTER_NONE} from '../FilterBar';

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
              <TableRow key={text.id}>
                  <TableCell sx={{width: '2rem'}}>
                      <Tooltip title={text.complete ? "Text ist geschützt" : "Text kann gelöscht werden"}>
                          <Checkbox
                              checked={Boolean(text.complete)}
                              checkedIcon={<LockIcon color="success" fontSize='small'/>}
                              icon={<LockOpenIcon color="action" fontSize='small'/>}
                              onChange={() => setComplete({text, complete: !Boolean(text.complete)})}
                              sx={{
                                  '&.Mui-checked': {
                                      color: theme => theme.palette.success.main
                                  }
                              }}
                          />
                      </Tooltip>
                  </TableCell>
                <TableCell
                  onClick={() => dispatch(setOpenText(text))}
                  sx={{cursor: 'pointer', position: 'relative'}}
                >
                  <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <Box sx={{flex: 1}}>
                    <Typography variant="subtitle1" component="span" color="primary" sx={{fontWeight: 'bold'}}>
                      {text.title}
                      </Typography>
                      {!Boolean(story) && <StoryChip text={text} size='small' />}
                    </Box>
                    <Box>
                      {Boolean(text.priority) && <Priority priority={text.priority} />}
                    </Box>
                  </Box>
                  <Box sx={{flex: 1}}>
                    <pre className="wrap-pre">
                      {text.description} {!Boolean(story) }
                    </pre>
                  </Box>
                  <Box sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    padding: '2px',
                  }}>
                    <Tooltip title="Erinnerung löschen">
                      <span>
                        <IconButton
                          disabled={Boolean(text.complete)}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteText(text).unwrap()
                              .then(() => dispatch(texteApi.util.invalidateTags(['Text'])))
                              .catch(error => console.error("Fehler beim Löschen:", error));
                          }}
                        >
                          <DeleteIcon fontSize="small"/>
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  </Layout>;
};
