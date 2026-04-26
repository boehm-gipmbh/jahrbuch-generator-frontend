import {useSelector} from 'react-redux';
import {useState, useEffect, useRef} from 'react';

export default function AuthVideo({src, style}) {
    const jwt = useSelector(state => state.auth.jwt);
    const [posterReady, setPosterReady] = useState(false);
    const [videoKey, setVideoKey] = useState(0);
    const intervalRef = useRef(null);
    const token = encodeURIComponent(jwt);
    const url = src ? `${src}?token=${token}` : '';
    const posterUrl = src ? `${src}.thumb.jpg?token=${token}` : '';

    useEffect(() => {
        if (!src || posterReady) return;
        intervalRef.current = setInterval(() => {
            fetch(posterUrl, {method: 'HEAD'})
                .then(r => {
                    if (r.ok) {
                        setPosterReady(true);
                        setVideoKey(k => k + 1);
                        clearInterval(intervalRef.current);
                    }
                })
                .catch(() => {});
        }, 10000);
        return () => clearInterval(intervalRef.current);
    }, [src, posterReady, posterUrl]);

    return (
        <div style={{position: 'relative', background: '#111', ...style}}>
            {!posterReady && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#444', fontSize: 48, pointerEvents: 'none'
                }}>
                    ▶
                </div>
            )}
            <video key={videoKey} src={url} poster={posterReady ? posterUrl : ''} controls preload="none"
                   style={{width: '100%', height: '100%', display: 'block'}}
                   onLoadedMetadata={() => setPosterReady(true)} />
        </div>
    );
}
