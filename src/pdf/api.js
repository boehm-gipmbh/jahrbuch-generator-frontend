export async function triggerOutpaint(jwt, bildId, prompt) {
  const res = await fetch(`/api/pdf/outpaint/${bildId}`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({prompt: prompt || null}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Fehler ${res.status}`);
  }
  return res.json(); // {outpaintedPfad: "..."}
}

export async function deleteOutpaint(jwt, bildId) {
  const res = await fetch(`/api/pdf/outpaint/${bildId}`, {
    method: 'DELETE',
    headers: {Authorization: `Bearer ${jwt}`},
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Fehler ${res.status}`);
  }
}
