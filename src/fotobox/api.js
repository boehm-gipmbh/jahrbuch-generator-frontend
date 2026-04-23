const BASE = '/api/v1/fotobox';

export async function fetchFotoboxState() {
    const res = await fetch(`${BASE}`);
    if (!res.ok) throw new Error('Fotobox-Status nicht verfügbar');
    return res.json();
}

export async function triggerFotoboxCapture() {
    const res = await fetch(`${BASE}/capture`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({mainImgsettingsImageformat: 'Small Fine JPEG'}),
    });
    if (!res.ok) throw new Error('Capture fehlgeschlagen');
    return res.json();
}

export function fotoboxBildUrl(pfad) {
    // pfad kommt mit führendem /, z.B. /gruppen/1/abc.jpg
    return `${BASE}/bilder${pfad}`;
}
