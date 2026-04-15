/**
 * Kombiniert mehrere Komparatoren: der erste mit Ergebnis != 0 gewinnt.
 * Ermöglicht generisches Multi-Kriterien-Sortieren.
 *
 * Beispiel:
 *   const bildSort = sortBy(byPriorityDesc, byIdDesc);
 *   const textSort = sortBy(byPriorityAsc, byIdAsc);
 */
export const sortBy = (...comparators) => (a, b) => {
    for (const cmp of comparators) {
        const result = cmp(a, b);
        if (result !== 0) return result;
    }
    return 0;
};

const FALLBACK = Number.MAX_SAFE_INTEGER;

export const byPriorityDesc = (a, b) => (b.priority ?? FALLBACK) - (a.priority ?? FALLBACK);
export const byPriorityAsc  = (a, b) => (a.priority ?? FALLBACK) - (b.priority ?? FALLBACK);
export const byPositionAsc  = (a, b) => (a.position ?? FALLBACK) - (b.position ?? FALLBACK);
export const byIdDesc       = (a, b) => b.id - a.id;
export const byIdAsc        = (a, b) => a.id - b.id;
export const byDateDesc     = (a, b) => new Date(b.created) - new Date(a.created);
export const byDateAsc      = (a, b) => new Date(a.created) - new Date(b.created);

export const matchesSearch = (item, q) =>
    !q || (item.title || '').toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);

const pad = n => String(n).padStart(2, '0');

/** Formatiert einen Timestamp als lokale datetime-local-Zeichenkette (YYYY-MM-DDTHH:MM). */
export const fmtLocal = ts => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Berechnet min/max-Datumsbereich aus einem Array von Items mit .created-Feld.
 *  dateTo wird auf die nächste Minute aufgerundet, damit Einträge mit Sekunden nicht herausgefiltert werden. */
export const computeDateRange = items => {
    const timestamps = items.map(item => new Date(item.created).getTime());
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const maxDate = new Date(maxTs);
    maxDate.setMinutes(maxDate.getMinutes() + 1);
    return {dateFrom: fmtLocal(minTs), dateTo: fmtLocal(maxDate.getTime())};
};

export const matchesDateRange = (item, dateFrom, dateTo) => {
    if (!dateFrom && !dateTo) return true;
    const created = new Date(item.created);
    if (dateFrom && created < new Date(dateFrom)) return false;
    if (dateTo && created > new Date(dateTo)) return false;
    return true;
};
