    // @ts-check
const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const API_BASE = 'http://localhost:8080/api/v1';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_NAME = process.env.DB_NAME || 'postgres';
const DB_PASS = process.env.DB_PASS || 'postgres';

const TEST_STORY_ID   = 1801;
const TEST_STORY_NAME = 'DnD-Testalbum';
const BILD_211_TITLE  = 'Einer war schon immer gern Polizist !';
const BILD_4027_TITLE = '7k zusammen auf 40 Jahre Party';
const TEXT_110_TITLE  = 'Die 7 K - 46 Jahre nach ihrer Gründung - gefeiert wird dann wieder 2029';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getJwt() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'auth-state.json'), 'utf8')).jwt;
}

function resetPapierkorbState() {
    const seedFile = path.join(__dirname, '..', 'seed.sql');
    execSync(
        `PGPASSWORD=${DB_PASS} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${seedFile}"`,
        {stdio: 'pipe'}
    );
}

async function apiDelete(endpoint) {
    const jwt = getJwt();
    const r = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${jwt}`},
    });
    if (!r.ok) throw new Error(`DELETE ${endpoint} → ${r.status}`);
}

async function goToPapierkorb(page) {
    const jwt = getJwt();
    await page.addInitScript(token => {
        sessionStorage.setItem('jwt', token);
    }, jwt);
    await page.goto('/papierkorb');
    // Warte bis Papierkorb-Überschrift sichtbar
    await page.waitForSelector('h2', {timeout: 15_000});
    // Warte bis RTK Query-Daten geladen (erhöht für langsame Umgebungen)
    await page.waitForTimeout(1500);
}

// ---------------------------------------------------------------------------
// Screenshot-Helpers
// ---------------------------------------------------------------------------

function slug(title) {
    return title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function screenshot(page, testInfo, suffix) {
    const p = `screenshots/papierkorb-${slug(testInfo.title)}-${suffix}.png`;
    await page.screenshot({path: p, fullPage: true});
    await testInfo.attach(suffix, {path: p, contentType: 'image/png'});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Papierkorb', () => {

    // Seriell ausführen: alle Tests teilen Bild 211 / Story 1801 —
    // parallele Ausführung führt zu Race Conditions (hard-delete eines Workers
    // zerstört Testdaten des anderen Workers).
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(() => resetPapierkorbState());

    test('Papierkorb ist leer wenn keine gelöschten Items', async ({page}, testInfo) => {
        await goToPapierkorb(page);
        await screenshot(page, testInfo, 'leer');
        await expect(page.getByText('Papierkorb ist leer')).toBeVisible();
    });

    test('gelöschtes Bild erscheint im Papierkorb', async ({page}, testInfo) => {
        await apiDelete('/bilder/211');
        await goToPapierkorb(page);
        await screenshot(page, testInfo, 'after');
        await expect(page.getByText(BILD_211_TITLE)).toBeVisible();
    });

    test('gelöschter Text erscheint im Papierkorb', async ({page}, testInfo) => {
        await apiDelete('/texte/110');
        await goToPapierkorb(page);
        await screenshot(page, testInfo, 'after');
        await expect(page.getByText(TEXT_110_TITLE)).toBeVisible();
    });

    test('Bild aus Papierkorb wiederherstellen', async ({page}, testInfo) => {
        await apiDelete('/bilder/211');
        await goToPapierkorb(page);
        await screenshot(page, testInfo, 'before');

        const row = page.locator('li').filter({hasText: BILD_211_TITLE});
        await row.getByRole('button', {name: 'Wiederherstellen'}).click();
        await expect(page.getByText(BILD_211_TITLE)).not.toBeVisible({timeout: 5_000});
        await screenshot(page, testInfo, 'after');
    });

    test('Bild endgültig löschen zeigt Bestätigungsdialog', async ({page}, testInfo) => {
        await apiDelete('/bilder/211');
        await goToPapierkorb(page);

        const row = page.locator('li').filter({hasText: BILD_211_TITLE});
        // IconButton mit aria-label findet man durch role + tooltip-name
        await row.getByRole('button', {name: 'Endgültig löschen'}).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await screenshot(page, testInfo, 'dialog');

        await page.getByRole('button', {name: 'Endgültig löschen'}).click();
        await expect(page.getByText(BILD_211_TITLE)).not.toBeVisible({timeout: 5_000});
        await screenshot(page, testInfo, 'after');
    });

    test('Abbrechen im Bestätigungsdialog lässt Item im Papierkorb', async ({page}, testInfo) => {
        await apiDelete('/bilder/211');
        await goToPapierkorb(page);

        const row = page.locator('li').filter({hasText: BILD_211_TITLE});
        // IconButton mit aria-label findet man durch role + tooltip-name
        await row.getByRole('button', {name: 'Endgültig löschen'}).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await screenshot(page, testInfo, 'dialog');

        await page.getByRole('button', {name: 'Abbrechen'}).click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByText(BILD_211_TITLE)).toBeVisible();
        await screenshot(page, testInfo, 'after');
    });

    test('Story-Mitlöschen: Items erscheinen als Gruppe im Papierkorb', async ({page}, testInfo) => {
        await apiDelete(`/stories/${TEST_STORY_ID}/cascade`);
        await goToPapierkorb(page);
        await screenshot(page, testInfo, 'after');

        await expect(page.getByText(TEST_STORY_NAME)).toBeVisible();
        await expect(page.getByText(BILD_211_TITLE)).toBeVisible();
        await expect(page.getByText(BILD_4027_TITLE)).toBeVisible();
        await expect(page.getByText(TEXT_110_TITLE)).toBeVisible();
        await expect(page.getByText('7 Einträge')).toBeVisible();
    });

    test('Story-Gruppe kann zugeklappt werden', async ({page}, testInfo) => {
        await apiDelete(`/stories/${TEST_STORY_ID}/cascade`);
        await goToPapierkorb(page);
        await expect(page.getByText(BILD_211_TITLE)).toBeVisible();
        await screenshot(page, testInfo, 'offen');

        // ListItem mit button-Prop ist kein actionables Element — den Text direkt klicken
        await page.getByText(TEST_STORY_NAME, {exact: true}).first().click();
        await expect(page.getByText(BILD_211_TITLE)).not.toBeVisible({timeout: 3_000});
        await screenshot(page, testInfo, 'zugeklappt');
    });

    test('"Mit Inhalt" wiederherstellen leert Papierkorb', async ({page}, testInfo) => {
        await apiDelete(`/stories/${TEST_STORY_ID}/cascade`);
        await goToPapierkorb(page);
        await screenshot(page, testInfo, 'before');

        // Warte auf API-Response und Click gleichzeitig
        const [restoreResp] = await Promise.all([
            page.waitForResponse(
                r => r.url().includes('/stories/restore') && r.request().method() === 'POST',
                {timeout: 10_000}
            ),
            page.getByLabel('Story + Inhalt wiederherstellen').click(),
        ]);
        // API muss 201 zurückgeben
        if (restoreResp.status() !== 201) {
            const body = await restoreResp.text();
            throw new Error(`restoreByName schlug fehl: HTTP ${restoreResp.status()} — ${body}`);
        }
        await page.waitForTimeout(1500);
        await screenshot(page, testInfo, 'after-click');

        // Seite neu laden, damit RTK Query einen frischen Fetch macht
        await page.reload();
        await page.waitForSelector('h2', {timeout: 15_000});
        await page.waitForTimeout(1500);
        const content = page.locator('main');
        await expect(content.getByText('Papierkorb ist leer')).toBeVisible({timeout: 5_000});
        await screenshot(page, testInfo, 'after');
    });

    test('"Nur Story" wiederherstellen: Items bleiben im Papierkorb', async ({page}, testInfo) => {
        await apiDelete(`/stories/${TEST_STORY_ID}/cascade`);
        await goToPapierkorb(page);
        await screenshot(page, testInfo, 'before');

        await page.getByLabel('Nur Story wiederherstellen (Inhalte bleiben im Papierkorb)').click();
        await page.waitForTimeout(1_000);
        await expect(page.getByText(BILD_211_TITLE)).toBeVisible({timeout: 5_000});
        await expect(page.getByText('Papierkorb ist leer')).not.toBeVisible();
        await screenshot(page, testInfo, 'after');
    });

    test('"Nur Story" dann einzelnes Bild wiederherstellen', async ({page}, testInfo) => {
        await apiDelete(`/stories/${TEST_STORY_ID}/cascade`);
        await goToPapierkorb(page);

        await page.getByLabel('Nur Story wiederherstellen (Inhalte bleiben im Papierkorb)').click();
        await page.waitForTimeout(1_000);
        // Maus wegbewegen damit kein Tooltip den nächsten Click blockiert
        await page.mouse.move(0, 0);
        await page.waitForTimeout(300);
        await screenshot(page, testInfo, 'nur-story');

        // Finde das gelöschte Bild und stelle es wieder her
        const row = page.locator('li').filter({hasText: BILD_211_TITLE});
        await row.getByLabel('Wiederherstellen').click();
        await expect(page.getByText(BILD_211_TITLE)).not.toBeVisible({timeout: 5_000});
        await screenshot(page, testInfo, 'after');
    });
});
