import {
    sortBy,
    byPriorityDesc, byPriorityAsc,
    byPositionAsc,
    byIdDesc, byIdAsc,
    byDateDesc, byDateAsc,
    matchesSearch,
    fmtLocal,
    computeDateRange,
    matchesDateRange,
} from './sortUtils';

// Feste lokale Zeit für deterministische Tests
const T1 = '2026-04-15T08:00:00+02:00'; // 06:00 UTC
const T2 = '2026-04-15T09:30:00+02:00'; // 07:30 UTC
const T3 = '2026-04-15T09:30:45+02:00'; // 07:30:45 UTC — 45 Sekunden nach T2

const item = (overrides) => ({id: 1, created: T1, ...overrides});

// ---------------------------------------------------------------------------
// sortBy
// ---------------------------------------------------------------------------
describe('sortBy', () => {
    test('erster Komparator entscheidet wenn != 0', () => {
        const cmp = sortBy(byPriorityDesc, byIdDesc);
        const a = {priority: 2, id: 1};
        const b = {priority: 1, id: 99};
        expect(cmp(a, b)).toBeLessThan(0); // a hat höhere Priorität → kommt zuerst
    });

    test('zweiter Komparator greift bei Gleichstand', () => {
        const cmp = sortBy(byPriorityDesc, byIdDesc);
        const a = {priority: 1, id: 5};
        const b = {priority: 1, id: 3};
        expect(cmp(a, b)).toBeLessThan(0); // gleiche Priorität, a.id > b.id
    });
});

// ---------------------------------------------------------------------------
// Komparatoren
// ---------------------------------------------------------------------------
describe('byPriorityDesc', () => {
    test('höhere Priorität kommt zuerst', () => {
        expect(byPriorityDesc({priority: 3}, {priority: 1})).toBeLessThan(0);
    });
    test('null-Priorität wird als MAX behandelt (kommt zuerst in desc)', () => {
        expect(byPriorityDesc({priority: null}, {priority: 1})).toBeLessThan(0);
    });
});

describe('byPriorityAsc', () => {
    test('niedrigere Priorität kommt zuerst', () => {
        expect(byPriorityAsc({priority: 1}, {priority: 3})).toBeLessThan(0);
    });
});

describe('byPositionAsc', () => {
    test('niedrigere Position kommt zuerst', () => {
        expect(byPositionAsc({position: 0}, {position: 5})).toBeLessThan(0);
    });
    test('null-Position kommt zuletzt', () => {
        expect(byPositionAsc({position: null}, {position: 1})).toBeGreaterThan(0);
    });
});

describe('byIdDesc / byIdAsc', () => {
    test('byIdDesc: größere ID zuerst', () => {
        expect(byIdDesc({id: 10}, {id: 2})).toBeLessThan(0);
    });
    test('byIdAsc: kleinere ID zuerst', () => {
        expect(byIdAsc({id: 2}, {id: 10})).toBeLessThan(0);
    });
});

describe('byDateDesc / byDateAsc', () => {
    test('byDateDesc: neueres Datum zuerst', () => {
        expect(byDateDesc({created: T2}, {created: T1})).toBeLessThan(0);
    });
    test('byDateAsc: älteres Datum zuerst', () => {
        expect(byDateAsc({created: T1}, {created: T2})).toBeLessThan(0);
    });
});

// ---------------------------------------------------------------------------
// matchesSearch
// ---------------------------------------------------------------------------
describe('matchesSearch', () => {
    test('leere Suche trifft immer zu', () => {
        expect(matchesSearch(item({title: 'Hallo'}), '')).toBe(true);
    });
    test('Treffer im title', () => {
        expect(matchesSearch(item({title: 'Sommerfest'}), 'sommer')).toBe(true);
    });
    test('Treffer in description', () => {
        expect(matchesSearch(item({description: 'Jahrbuch 2026'}), '2026')).toBe(true);
    });
    test('kein Treffer', () => {
        expect(matchesSearch(item({title: 'Hallo', description: 'Welt'}), 'xyz')).toBe(false);
    });
    test('Groß-/Kleinschreibung wird ignoriert', () => {
        expect(matchesSearch(item({title: 'SOMMER'}), 'sommer')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// fmtLocal
// ---------------------------------------------------------------------------
describe('fmtLocal', () => {
    test('gibt YYYY-MM-DDTHH:MM im lokalen Format zurück', () => {
        const ts = new Date('2026-04-15T08:05:00').getTime(); // lokale Zeit
        const result = fmtLocal(ts);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
        expect(result).toBe('2026-04-15T08:05');
    });
});

// ---------------------------------------------------------------------------
// computeDateRange
// ---------------------------------------------------------------------------
describe('computeDateRange', () => {
    test('dateFrom entspricht ältestem Eintrag', () => {
        const items = [{created: T2}, {created: T1}];
        const {dateFrom} = computeDateRange(items);
        expect(new Date(dateFrom).getTime()).toBeLessThanOrEqual(new Date(T1).getTime());
    });

    test('dateTo liegt nach neuestem Eintrag (Sekunden-Puffer)', () => {
        const items = [{created: T2}, {created: T3}]; // T3 hat 45 Sekunden
        const {dateTo} = computeDateRange(items);
        expect(new Date(dateTo).getTime()).toBeGreaterThan(new Date(T3).getTime());
    });

    test('einzelnes Item: dateFrom <= created <= dateTo', () => {
        const items = [{created: T1}];
        const {dateFrom, dateTo} = computeDateRange(items);
        const ts = new Date(T1).getTime();
        expect(new Date(dateFrom).getTime()).toBeLessThanOrEqual(ts);
        expect(new Date(dateTo).getTime()).toBeGreaterThan(ts);
    });
});

// ---------------------------------------------------------------------------
// matchesDateRange
// ---------------------------------------------------------------------------
describe('matchesDateRange', () => {
    test('kein Filter: immer true', () => {
        expect(matchesDateRange(item(), '', '')).toBe(true);
    });

    test('item innerhalb des Bereichs', () => {
        const {dateFrom, dateTo} = computeDateRange([{created: T1}, {created: T2}]);
        expect(matchesDateRange({created: T1}, dateFrom, dateTo)).toBe(true);
        expect(matchesDateRange({created: T2}, dateFrom, dateTo)).toBe(true);
    });

    test('item mit Sekunden wird durch dateTo +1min nicht herausgefiltert', () => {
        const items = [{created: T2}, {created: T3}];
        const {dateFrom, dateTo} = computeDateRange(items);
        expect(matchesDateRange({created: T3}, dateFrom, dateTo)).toBe(true);
    });

    test('item vor dateFrom wird herausgefiltert', () => {
        expect(matchesDateRange({created: T1}, fmtLocal(new Date(T2).getTime()), '')).toBe(false);
    });

    test('nur dateFrom gesetzt: items danach passieren', () => {
        expect(matchesDateRange({created: T2}, fmtLocal(new Date(T1).getTime()), '')).toBe(true);
    });

    test('nur dateTo gesetzt: items davor passieren', () => {
        expect(matchesDateRange({created: T1}, '', fmtLocal(new Date(T2).getTime()))).toBe(true);
    });
});
