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

export const matchesDateRange = (item, dateFrom, dateTo) => {
    if (!dateFrom && !dateTo) return true;
    const created = new Date(item.created);
    if (dateFrom && created < new Date(dateFrom)) return false;
    if (dateTo && created > new Date(dateTo)) return false;
    return true;
};
