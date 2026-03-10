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
export const byIdDesc       = (a, b) => b.id - a.id;
export const byIdAsc        = (a, b) => a.id - b.id;
