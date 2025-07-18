import React from 'react';
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
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {api as texteApi} from './api';
import {Priority} from './Priority';
import {Layout, newText, setOpenText} from '../layout';
import {api as storyApi} from '../stories';
import {StoryChip} from './StoryChip';

const textSort = (t1, t2) => {
  const p1 = t1.priority ?? Number.MAX_SAFE_INTEGER;
  const p2 = t2.priority ?? Number.MAX_SAFE_INTEGER;
  if (p1 !== p2) {
    return p1 - p2
  }
  return t1.id - t2.id;
};

export const Texte = ({title = 'Erinnerungen', filter = () => true}) => {
  const {storyId} = useParams();
  const {story} = storyApi.endpoints.getStories.useQuery(undefined, {
    selectFromResult: ({data}) => ({story: data?.find(p => p.id === parseInt(storyId))})
  });
  if (Boolean(story)) {
    title = story?.name;
    filter = text => text.story?.id === story.id;
  }
  const dispatch = useDispatch();
  const {data} = texteApi.endpoints.getTexte.useQuery(undefined, {pollingInterval: 10000});
  const [setComplete] = texteApi.endpoints.setComplete.useMutation();
  return <Layout>
    <Box sx={{mt: 2}}>
      <Button startIcon={<AddIcon />} onClick={() => dispatch(newText({story: story}))}>
        Füge Deine Erinnerungen hinzu
      </Button>
    </Box>
    <Container sx={{mt: theme => theme.spacing(2)}}>
      <Paper sx={{p: 2}}>
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          {title}
        </Typography>
        <Table size='small'>
          <TableBody>
              {data && Array.from(data).filter(filter).sort(textSort).map(text =>
              <TableRow key={text.id}>
                <TableCell sx={{width: '2rem'}}>
                  <Checkbox
                    checked={Boolean(text.complete)}
                    checkedIcon={<CheckCircleIcon fontSize='small' />}
                    icon={<RadioButtonUncheckedIcon fontSize='small' />}
                    onChange={() => setComplete({text, complete: !Boolean(text.complete)})}
                  />
                </TableCell>
                <TableCell
                  onClick={() => dispatch(setOpenText(text))}
                  sx={{cursor: 'pointer'}}
                >
                  <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <Box sx={{flex: 1}}>
                      {!Boolean(story) && <StoryChip text={text} size='small' />} {text.title}
                    </Box>
                    <Box>
                      {Boolean(text.priority) && <Priority priority={text.priority} />}
                    </Box>
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
