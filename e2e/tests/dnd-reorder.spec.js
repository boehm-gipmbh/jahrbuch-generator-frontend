// @ts-check
const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const TEST_STORY_ID = process.env.TEST_STORY_ID || '1801';

// DB connection for state reset
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_NAME = process.env.DB_NAME || 'postgres';
const DB_PASS = process.env.DB_PASS || 'postgres';

/**
 * Known starting state for Story 1801 (3 columns):
 * Col 0: bild 211 "Einer war schon immer gern Polizist !"         (pos 0)
 *        text 110 "Die 7 K - 46 Jahre nach ihrer Gründung…"       (pos 1)
 * Col 1: bild 4027 "7k zusammen auf 40 Jahre Party"               (pos 0)
 *        bild 3160 "7k oder 8k - Herr Gottschalk…"                (pos 1)
 *        bild  213 "Ne Menge Unfug haben wir auch gemacht"         (pos 2)
 * Col 2: bild  214 "7k oder 8k"                                   (pos 0)
 *        text  310 "Namen von LehrerInnen und von SchülerInnen…"  (pos 1)
 *
 * Reading order (col-by-col): 0,1 | 2,3,4 | 5,6
 */
const INITIAL_TITLES = [
    'Einer war schon immer gern Polizist !',
    'Die 7 K - 46 Jahre nach ihrer Gründung - gefeiert wird dann wieder 2029',
    '7k zusammen auf 40 Jahre Party',
    '7k oder 8k - Herr Gottschalk mit Austausch-Schülerinnen',
    'Ne Menge Unfug haben wir auch gemacht',
    '7k oder 8k',
    'Namen von LehrerInnen und von SchülerInnen steigen auf wie Seifenblasen',
];

function resetStoryState() {
    const sql = [
        "UPDATE bilder SET story_column=0, story_position=0 WHERE id=211",
        "UPDATE texte  SET story_column=0, story_position=1 WHERE id=110",
        "UPDATE bilder SET story_column=1, story_position=0 WHERE id=4027",
        "UPDATE bilder SET story_column=1, story_position=1 WHERE id=3160",
        "UPDATE bilder SET story_column=1, story_position=2 WHERE id=213",
        "UPDATE bilder SET story_column=2, story_position=0 WHERE id=214",
        "UPDATE texte  SET story_column=2, story_position=1 WHERE id=310",
    ].join('; ');
    execSync(
        `PGPASSWORD=${DB_PASS} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "${sql}"`,
        {stdio: 'pipe'}
    );
}

function getJwt() {
    const authFile = path.join(__dirname, '..', 'auth-state.json');
    return JSON.parse(fs.readFileSync(authFile, 'utf8')).jwt;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoStory(page, storyId = TEST_STORY_ID) {
    const jwt = getJwt();
    await page.addInitScript(token => {
        sessionStorage.setItem('jwt', token);
    }, jwt);
    await page.goto(`/bilder/story/${storyId}`);
    await page.waitForSelector('main .MuiPaper-root', {timeout: 20_000});
}

async function getCardTitles(page) {
    const titles = await page.locator('main').locator('.MuiTypography-subtitle1').allTextContents();
    return titles.map(t => t.trim());
}

// Only leaf card Papers — excludes the outer wrapper Paper (which contains nested MuiPaper-root elements).
function cardOf(page, index) {
    return page.locator('main .MuiPaper-root')
        .filter({hasNot: page.locator('.MuiPaper-root')})
        .nth(index);
}

// The drag handle Box carries aria-roledescription="sortable" via dnd-kit's {...attributes}.
function dragHandleOf(page, cardIndex) {
    return page.locator('main [aria-roledescription="sortable"]').nth(cardIndex);
}

async function dndKitDrag(page, dragHandle, dropTarget, position = 'after') {
    const handleBox = await dragHandle.boundingBox();
    const targetBox = await dropTarget.boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not get bounding boxes');

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = position === 'before'
        ? targetBox.y + targetBox.height * 0.2
        : targetBox.y + targetBox.height * 0.8;

    // Hover so the handle is ready
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(50);
    await page.mouse.down();
    await page.waitForTimeout(50);

    // Slow initial movement — gives the PointerSensor (distance: 8) time to activate
    for (let i = 1; i <= 6; i++) {
        await page.mouse.move(startX, startY + i * 3);
        await page.waitForTimeout(30);
    }
    // Wait for drag-start animation to settle
    await page.waitForTimeout(200);

    // Move to target with real delays so collision detection fires at each step
    const moveSteps = 30;
    const fromX = startX;
    const fromY = startY + 18; // where activation loop left off
    for (let s = 1; s <= moveSteps; s++) {
        const mx = fromX + (targetX - fromX) * s / moveSteps;
        const my = fromY + (targetY - fromY) * s / moveSteps;
        await page.mouse.move(mx, my);
        await page.waitForTimeout(20);
    }
    await page.waitForTimeout(300);
    await page.mouse.up();
    // Wait for optimistic state update + API round-trip
    await page.waitForTimeout(2000);
}

async function switch3Col(page) {
    await page.locator('.MuiToggleButtonGroup-root .MuiToggleButton-root').nth(2).click();
    await page.waitForTimeout(300);
}

function screenshotSlug(testTitle) {
    return testTitle.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function screenshotBefore(page, testInfo) {
    const slug = screenshotSlug(testInfo.title);
    const path = `screenshots/${slug}-before.png`;
    await page.screenshot({path});
    await testInfo.attach('before', {path, contentType: 'image/png'});
}

async function screenshotAfter(page, testInfo) {
    const slug = screenshotSlug(testInfo.title);
    const path = `screenshots/${slug}-after.png`;
    await page.screenshot({path});
    await testInfo.attach('after', {path, contentType: 'image/png'});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('DnD Reorder — 3-Spalten-Layout', () => {

    test.beforeEach(async ({page}) => {
        resetStoryState();
        await gotoStory(page);
        await switch3Col(page);
    });

    test('Ausgangszustand stimmt mit DB überein', async ({page}, testInfo) => {
        await screenshotBefore(page, testInfo);
        const titles = await getCardTitles(page);
        await screenshotAfter(page, testInfo);
        expect(titles).toEqual(INITIAL_TITLES);
    });

    // Known bug: dragging first item to last position within a column has no effect.
    test('bug: same-col drag col1[0] → col1[2] (runter, Spalte 1)', async ({page}, testInfo) => {
        // col1 vorher: 4027, 3160, 213
        // col1 nachher erwartet: 3160, 213, 4027
        await screenshotBefore(page, testInfo);
        await dndKitDrag(page, dragHandleOf(page, 2), cardOf(page, 4), 'after');
        await screenshotAfter(page, testInfo);

        const titles = await getCardTitles(page);
        expect(titles[2]).toBe(INITIAL_TITLES[3]); // 3160
        expect(titles[3]).toBe(INITIAL_TITLES[4]); // 213
        expect(titles[4]).toBe(INITIAL_TITLES[2]); // 4027 an letzter Stelle
    });

    // Known bug: dragging last item to first position crosses into wrong column.
    test('bug: same-col drag col1[2] → col1[0] (hoch, Spalte 1)', async ({page}, testInfo) => {
        // col1 nachher erwartet: 213, 4027, 3160
        await screenshotBefore(page, testInfo);
        await dndKitDrag(page, dragHandleOf(page, 4), cardOf(page, 2), 'before');
        await screenshotAfter(page, testInfo);

        const titles = await getCardTitles(page);
        expect(titles[2]).toBe(INITIAL_TITLES[4]); // 213 an pos0
        expect(titles[3]).toBe(INITIAL_TITLES[2]); // 4027 an pos1
        expect(titles[4]).toBe(INITIAL_TITLES[3]); // 3160 an pos2
    });

    test('order persists after page reload', async ({page}, testInfo) => {
        // Drag col1[0] → col1[2]
        await screenshotBefore(page, testInfo);
        await dndKitDrag(page, dragHandleOf(page, 2), cardOf(page, 4), 'after');
        await screenshotAfter(page, testInfo);

        const titlesAfterDrag = await getCardTitles(page);

        await page.reload();
        await page.waitForSelector('main .MuiPaper-root', {timeout: 15_000});
        await switch3Col(page);

        const titlesAfterReload = await getCardTitles(page);
        expect(titlesAfterReload).toEqual(titlesAfterDrag);
    });

    // Known bug: cross-column drag does not reliably land in the correct column.
    test('bug: cross-col drag col0 → col2', async ({page}, testInfo) => {
        // Drag "Einer war…" (col0, idx 0) in col2 (nach idx 5)
        await screenshotBefore(page, testInfo);
        await dndKitDrag(page, dragHandleOf(page, 0), cardOf(page, 5), 'after');
        await screenshotAfter(page, testInfo);

        const titles = await getCardTitles(page);
        // "Einer war…" sollte aus col0 raus und in col2 (idx 4-6) sein
        expect(titles[0]).not.toBe(INITIAL_TITLES[0]); // nicht mehr an col0[0]
        expect(titles.slice(4)).toContain(INITIAL_TITLES[0]); // jetzt in col2
    });
});
