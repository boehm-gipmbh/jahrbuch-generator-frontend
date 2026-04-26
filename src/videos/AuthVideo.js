import {useSelector} from 'react-redux';
import {useState} from 'react';

export default function AuthVideo({src, style}) {
    const jwt = useSelector(state => state.auth.jwt);
    const [posterReady, setPosterReady] = useState(false);
    const token = encodeURIComponent(jwt);
    const url = src ? `${src}?token=${token}` : '';
    const posterUrl = src ? `${src}.thumb.jpg?token=${token}` : '';

    return (
        <div style={{position: 'relative', background: '#111', ...style}}>
            <img src={posterUrl} onLoad={() => setPosterReady(true)} alt="" style={{display: 'none'}} />
            {!posterReady && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#444', fontSize: 48, pointerEvents: 'none'
                }}>
                    ▶
                </div>
            )}
            <video src={url} poster={posterReady ? posterUrl : ''} controls preload="none"
                   style={{width: '100%', height: '100%', display: 'block'}} />
        </div>
    );
}
