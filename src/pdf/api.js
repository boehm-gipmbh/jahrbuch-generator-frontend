export async function triggerOutpaint(jwt, bildId) {
  const res = await fetch(`/api/pdf/outpaint/${bildId}`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${jwt}`},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Fehler ${res.status}`);
  }
  return res.json(); // {outpaintedPfad: "..."}
}
