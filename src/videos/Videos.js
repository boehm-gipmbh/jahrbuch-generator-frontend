import React, {useState, useRef, useMemo, useEffect} from 'react';
import {useWindowVirtualizer} from '@tanstack/react-virtual';
import {useTheme} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
import {Grid} from '@mui/material';
import {Box, Container, Paper, Typography} from '@mui/material';
import {api as videoApi} from './api';
import {api as storyApi} from '../stories';
import {VideoCard} from './VideoCard';
import {VideoUploadDialog} from './VideoUploadDialog';
import {Layout} from '../layout';
import {byDateDesc, byDateAsc, matchesSearch, matchesDateRange, computeDateRange} from '../sortUtils';
import {FilterBar, STORY_FILTER_NONE} from '../FilterBar';

export const Videos = ({title = 'Deine Videos', filter = () => true}) => {
    const {storyId} = useParams();
    const {story, stories, storiesLoaded} = storyApi.endpoints.getStories.useQuery(undefined, {
        selectFromResult: ({data, isSuccess}) => ({
            story: data?.find(s => s.id === parseInt(storyId)),
            stories: data || [],
            storiesLoaded: isSuccess
        })
    });
    if (Boolean(story)) {
        title = story?.name;
        filter = video => video.story?.id === story.id;
    }
    const dispatch = useDispatch();
    const {data} = videoApi.endpoints.getVideos.useQuery(undefined, {pollingInterval: 10000});
    const [setVideoComplete] = videoApi.endpoints.setComplete.useMutation();
    const [updateVideo] = videoApi.endpoints.updateVideo.useMutation();
    const [deleteVideo] = videoApi.endpoints.deleteVideo.useMutation();

    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const dateInitialized = useRef(false);
    useEffect(() => {
        if (!data || data.length === 0) return;
        const {dateFrom: from, dateTo: to} = computeDateRange(data);
        if (!dateInitialized.current) {
            dateInitialized.current = true;
            setDateFrom(from);
        }
        setDateTo(to);
    }, [data]);
    const [sortField, setSortField] = useState('date');
    const [sortAsc, setSortAsc] = useState(false);
    const [storyFilter, setStoryFilter] = useState(new Set());
    const [metadataFilter, setMetadataFilter] = useState(['noStory']);

    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const cols = isSmall ? 1 : 2;

    const q = search.toLowerCase();
    const filteredVideos = useMemo(() => {
        const base = (data || []).filter(video => {
            if (video.deleted) return false;
            if (!filter(video)) return false;
            if (!matchesSearch(video, q)) return false;
            if (!matchesDateRange(video, dateFrom, dateTo)) return false;
            if (storyFilter.size > 0) {
                const key = video.story ? video.story.id : STORY_FILTER_NONE;
                if (!storyFilter.has(key)) return false;
            }
            if (metadataFilter.includes('noStory') && video.story) return false;
            return true;
        });
        const cmp = sortField === 'priority'
            ? (sortAsc ? (a, b) => (a.priority ?? 0) - (b.priority ?? 0) : (a, b) => (b.priority ?? 0) - (a.priority ?? 0))
            : (sortAsc ? byDateAsc : byDateDesc);
        return [...base].sort(cmp);
    }, [data, filter, q, dateFrom, dateTo, sortField, sortAsc, storyFilter, metadataFilter]);

    const rows = useMemo(() => {
        const result = [];
        for (let i = 0; i < filteredVideos.length; i += cols) {
            result.push(filteredVideos.slice(i, i + cols));
        }
        return result;
    }, [filteredVideos, cols]);

    const gridRef = useRef(null);
    const [scrollMargin, setScrollMargin] = useState(0);
    useEffect(() => {
        if (gridRef.current) setScrollMargin(gridRef.current.offsetTop);
    }, [rows.length]);

    const rowVirtualizer = useWindowVirtualizer({
        count: rows.length,
        estimateSize: () => 420,
        overscan: 3,
        scrollMargin,
        measureElement: el => el.getBoundingClientRect().height,
    });

    return (
        <Layout>
            <Box sx={{mt: 2}}>
                <VideoUploadDialog story={story}/>
            </Box>
            <Container sx={{mt: theme => theme.spacing(2)}}>
                <Paper sx={{p: 2}}>
                    <Box sx={{
                        position: 'sticky', top: {xs: 56, sm: 64}, zIndex: 'appBar',
                        backgroundColor: 'background.paper', pt: 1, pb: 1, mx: -2, px: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                    }}>
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
                            metadataFilter={metadataFilter} setMetadataFilter={setMetadataFilter}
                        />
                    </Box>

                    <Box ref={gridRef} style={{height: rowVirtualizer.getTotalSize(), position: 'relative'}}>
                        {rowVirtualizer.getVirtualItems().map(virtualRow => (
                            <Box key={virtualRow.key}
                                data-index={virtualRow.index}
                                ref={rowVirtualizer.measureElement}
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%',
                                    transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`
                                }}>
                                <Grid container spacing={2} sx={{mb: 2}}>
                                    {rows[virtualRow.index].map(video => (
                                        <Grid item xs={12} sm={6} key={video.id}>
                                            <VideoCard
                                                video={video}
                                                story={story}
                                                storiesLoaded={storiesLoaded}
                                                stories={stories}
                                                onSetComplete={(args) => setVideoComplete(args)}
                                                onUpdate={(updated) => updateVideo(updated)}
                                                onDelete={() => deleteVideo(video).unwrap()
                                                    .then(() => dispatch(videoApi.util.invalidateTags(['Video'])))
                                                    .catch(e => console.error(e))}
                                                onRemoveFromStory={(v) => updateVideo({...v, story: null}).unwrap()
                                                    .then(() => dispatch(videoApi.util.invalidateTags(['Video'])))
                                                    .catch(e => console.error(e))}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </Container>
        </Layout>
    );
};
