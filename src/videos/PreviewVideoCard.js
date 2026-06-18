import {api as videoApi} from './api';
import {VideoCard} from './VideoCard';
import {useDispatch} from 'react-redux';

export const PreviewVideoCard = ({video, story, storiesLoaded, stories, storyBilder, storyTexte}) => {
    const dispatch = useDispatch();
    const [updateVideo] = videoApi.endpoints.updateVideo.useMutation();
    const [setVideoComplete] = videoApi.endpoints.setComplete.useMutation();
    const [deleteVideo] = videoApi.endpoints.deleteVideo.useMutation();

    return (
        <VideoCard
            video={video}
            story={story}
            storiesLoaded={storiesLoaded}
            stories={stories}
            onSetComplete={(args) => setVideoComplete(args)}
            onUpdate={(v) => updateVideo(v).unwrap()
                .then(() => dispatch(videoApi.util.invalidateTags(['Video'])))
                .catch(e => console.error(e))}
            onDelete={() => deleteVideo(video).unwrap()
                .then(() => dispatch(videoApi.util.invalidateTags(['Video'])))
                .catch(e => console.error(e))}
        />
    );
};
