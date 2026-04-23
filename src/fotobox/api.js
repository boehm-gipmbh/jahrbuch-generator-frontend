const BASE = '/api/v1/fotobox';

let stationToken = null;

async function getStationToken() {
    if (stationToken) return stationToken;
    try {
        const res = await fetch(`${BASE}/station-token`);
        if (res.ok) {
            const data = await res.json();
            stationToken = data.token;
        }
    } catch (e) {
        console.warn('Kein Station-Token verfügbar:', e.message);
    }
    return stationToken;
}

export async function fetchFotoboxState() {
    const res = await fetch(`${BASE}`);
    if (!res.ok) throw new Error('Fotobox-Status nicht verfügbar');
    return res.json();
}

export async function fetchFotoboxConfig() {
    const token = await getStationToken();
    const res = await fetch(`${BASE}/config`, {
        headers: token ? {Authorization: `Bearer ${token}`} : {}
    });
    if (!res.ok) throw new Error('Fotobox-Config nicht verfügbar');
    return res.json();
}

export async function triggerFotoboxCapture(imageFormat = 'Small Fine JPEG') {
    const token = await getStationToken();
    const res = await fetch(`${BASE}/capture`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? {Authorization: `Bearer ${token}`} : {})
        },
        body: JSON.stringify({mainImgsettingsImageformat: imageFormat}),
    });
    if (!res.ok) throw new Error('Capture fehlgeschlagen');
    return res.json();
}

export function fotoboxBildUrl(pfad) {
    return `${BASE}/bilder${pfad}`;
}
