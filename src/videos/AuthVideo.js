import {useSelector} from 'react-redux';

export default function AuthVideo({src, style}) {
    const jwt = useSelector(state => state.auth.jwt);
    const token = encodeURIComponent(jwt);
    const url = src ? `${src}?token=${token}` : '';
    const poster = src ? `${src}.thumb.jpg?token=${token}` : '';
    return <video src={url} poster={poster} controls preload="none" style={style}/>;
}
