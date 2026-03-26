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
    const sql = [
        // 1. Story zuerst anlegen (FK-Constraint für story_id)
        `INSERT INTO stories (id, name, description, user_id, created, version, layout)
         SELECT ${TEST_STORY_ID}, '${TEST_STORY_NAME}', 'Playwright-Testdaten', id, NOW(), 0, '3col'
         FROM users WHERE name='abi85'
         ON CONFLICT (id) DO NOTHING`,
        // 2. Duplikat-Stories mit gleichem Namen entfernen
        `DELETE FROM stories WHERE name='${TEST_STORY_NAME}' AND id != ${TEST_STORY_ID}`,
        // 3. Bild 211 neu einfügen falls durch hard-delete entfernt
        `INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
         SELECT 211, 'Einer war schon immer gern Polizist !', '/e2e-test-bild-1.jpg',
                ${TEST_STORY_ID}, id, 0, 0, NOW(), 0, 0, false
         FROM users WHERE name='abi85'
         ON CONFLICT (id) DO UPDATE SET deleted=false, deleted_from_story_name=NULL, story_id=${TEST_STORY_ID}`,
        // 4. Übrige Items zurücksetzen
        `UPDATE bilder SET deleted=false, deleted_from_story_name=NULL, story_id=${TEST_STORY_ID} WHERE id IN (4027,3160,213,214)`,
        `UPDATE texte  SET deleted=false, deleted_from_story_name=NULL, story_id=${TEST_STORY_ID} WHERE id IN (110,310)`,
    ].join('; ');
    execSync(
        `PGPASSWORD=${DB_PASS} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "${sql}"`,
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
    // Kurz warten bis RTK Query-Daten geladen
    await page.waitForTimeout(800);
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
        await row.locator('button').nth(0).click(); // Restore-Button (erster)
        await expect(page.getByText(BILD_211_TITLE)).not.toBeVisible({timeout: 5_000});
        await screenshot(page, testInfo, 'after');
    });

    test('Bild endgültig löschen zeigt Bestätigungsdialog', async ({page}, testInfo) => {
        await apiDelete('/bilder/211');
        await goToPapierkorb(page);

        const row = page.locator('li').filter({hasText: BILD_211_TITLE});
        await row.locator('button').nth(1).click(); // HardDelete-Button (zweiter)
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
        await row.locator('button').nth(1).click(); // HardDelete-Button (zweiter)
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

        await page.locator('li').filter({hasText: TEST_STORY_NAME}).first().click();
        await expect(page.getByText(BILD_211_TITLE)).not.toBeVisible({timeout: 3_000});
        await screenshot(page, testInfo, 'zugeklappt');
    });

    test('"Mit Inhalt" wiederherstellen leert Papierkorb', async ({page}, testInfo) => {
        await apiDelete(`/stories/${TEST_STORY_ID}/cascade`);
        await goToPapierkorb(page);
        await screenshot(page, testInfo, 'before');

        await page.getByLabel('Story + Inhalt wiederherstellen').click();
        await expect(page.getByText('Papierkorb ist leer')).toBeVisible({timeout: 5_000});
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
        await screenshot(page, testInfo, 'nur-story');

        const row = page.locator('li').filter({hasText: BILD_211_TITLE});
        await row.locator('button').nth(0).click(); // Restore-Button (erster)
        await expect(page.getByText(BILD_211_TITLE)).not.toBeVisible({timeout: 5_000});
        await screenshot(page, testInfo, 'after');
    });
});
