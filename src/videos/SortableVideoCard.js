import {memo} from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {Box} from '@mui/material';
import {VideoCard} from './VideoCard';

export const SortableVideoCard = memo(({video, story, storiesLoaded, stories, onSetComplete, onUpdate, onDelete}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: `video-${video.id}`
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box ref={setNodeRef} style={style}>
            <VideoCard
                video={video}
                story={story}
                storiesLoaded={storiesLoaded}
                stories={stories}
                onSetComplete={onSetComplete}
                onUpdate={onUpdate}
                onDelete={onDelete}
                dragHandleProps={{...attributes, ...listeners}}
            />
        </Box>
    );
}, (prev, next) =>
    prev.video === next.video &&
    prev.story === next.story &&
    prev.storiesLoaded === next.storiesLoaded &&
    prev.stories === next.stories
);
