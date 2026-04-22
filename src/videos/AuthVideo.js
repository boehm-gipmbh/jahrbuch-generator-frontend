import {useSelector} from 'react-redux';

export default function AuthVideo({src, style}) {
    const jwt = useSelector(state => state.auth.jwt);
    const url = src ? `${src}?token=${encodeURIComponent(jwt)}` : '';
    return <video src={url} controls preload="none" style={style}/>;
}
