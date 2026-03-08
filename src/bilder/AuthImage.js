import {useEffect, useRef, useState} from 'react';

export default function AuthImage({src, alt, style, id}) {
    const [blobUrl, setBlobUrl] = useState(null);
    const blobRef = useRef(null);

    useEffect(() => {
        if (!src) return;
        let cancelled = false;
        const jwt = sessionStorage.getItem('jwt');
        fetch(src, {headers: {Authorization: `Bearer ${jwt}`}})
            .then(r => r.blob())
            .then(blob => {
                if (!cancelled) {
                    const url = URL.createObjectURL(blob);
                    blobRef.current = url;
                    setBlobUrl(url);
                }
            });
        return () => {
            cancelled = true;
            if (blobRef.current) {
                URL.revokeObjectURL(blobRef.current);
                blobRef.current = null;
            }
        };
    }, [src]);

    return <img id={id} src={blobUrl || ''} alt={alt} style={style}/>;
}
