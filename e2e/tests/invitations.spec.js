// @ts-check
const {test, expect} = require('@playwright/test');
const {execSync} = require('child_process');

const API_BASE = 'http://localhost:3000/api/v1';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_NAME = process.env.DB_NAME || 'postgres';
const DB_PASS = process.env.DB_PASS || 'postgres';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getJwt(name, password) {
    const r = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, password}),
    });
    if (!r.ok) throw new Error(`Login ${name} fehlgeschlagen: ${r.status}`);
    return (await r.text()).replace(/"/g, '').trim();
}

async function createToken(jwt, body) {
    const r = await fetch(`${API_BASE}/users/invitations`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${jwt}`},
        body: JSON.stringify(body),
    });
    if (r.status !== 201) throw new Error(`Token-Erstellung fehlgeschlagen: ${r.status}`);
    return r.json();
}

async function registerUser(tokenUuid, name, email, password) {
    const r = await fetch(`${API_BASE}/auth/register?token=${tokenUuid}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, password}),
    });
    if (r.status !== 201) throw new Error(`Registrierung fehlgeschlagen: ${r.status}`);
}

function cleanupTestData() {
    const sql = `
        DELETE FROM user_groups WHERE user_id IN (SELECT id FROM users WHERE name LIKE 'pwtest%');
        DELETE FROM user_roles  WHERE id      IN (SELECT id FROM users WHERE name LIKE 'pwtest%');
        UPDATE users SET managed_group_id = NULL WHERE name LIKE 'pwtest%';
        DELETE FROM users WHERE name LIKE 'pwtest%';
        DELETE FROM invitation_tokens
          WHERE created_by IN (SELECT id FROM users WHERE name IN ('ddet', 'admin'))
            AND label = 'Hochzeitszeitung';
    `;
    execSync(
        `PGPASSWORD=${DB_PASS} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "${sql}"`,
        {stdio: 'pipe'}
    );
}

async function goToInvitations(page, jwt) {
    await page.addInitScript(token => {
        sessionStorage.setItem('jwt', token);
    }, jwt);
    await page.goto('/invitations');
    await page.waitForSelector('h2', {timeout: 15_000});
    await page.waitForTimeout(800);
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

test.beforeEach(() => cleanupTestData());
test.afterAll(() => cleanupTestData());

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('group-admin sieht Seitenüberschrift mit Gruppenname', async ({page}) => {
    // Admin erstellt einen group-admin Token für Hochzeitszeitung
    const adminJwt = await getJwt('admin', 'Admin1234!');
    await createToken(adminJwt, {
        role: 'group-admin',
        label: 'Hochzeitszeitung',
        expiresAt: '2027-01-01T00:00:00Z',
    });

    const ddetJwt = await getJwt('ddet', 'Ddet9999#');
    await goToInvitations(page, ddetJwt);

    await expect(page.getByRole('heading', {level: 2}))
        .toContainText('Einladungen — Hochzeitszeitung');
});

test('group-admin erscheint als Mitglied im group-admin Token', async ({page}) => {
    const adminJwt = await getJwt('admin', 'Admin1234!');
    await createToken(adminJwt, {
        role: 'group-admin',
        label: 'Hochzeitszeitung',
        expiresAt: '2027-01-01T00:00:00Z',
    });

    const ddetJwt = await getJwt('ddet', 'Ddet9999#');
    await goToInvitations(page, ddetJwt);

    // "Hochzeitszeitung" Gruppenüberschrift sichtbar
    await expect(page.getByText('Hochzeitszeitung').first()).toBeVisible();
    // ddet erscheint als Mitglied mit group-admin Chip
    await expect(page.getByText('ddet')).toBeVisible();
    await expect(page.getByText('group-admin').first()).toBeVisible();
});

test('group-admin erstellt neuen user-Einladungslink über Dialog', async ({page}) => {
    const ddetJwt = await getJwt('ddet', 'Ddet9999#');
    await goToInvitations(page, ddetJwt);

    await page.getByRole('button', {name: 'Neuer Link'}).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Ablaufdatum setzen (kein Label/Rolle-Feld für group-admin)
    await page.getByLabel('Ablaufdatum').fill('2027-12-31');
    await page.getByRole('button', {name: 'Erstellen'}).click();

    await expect(page.getByRole('dialog')).not.toBeVisible({timeout: 5_000});

    // "Offene Links" Sektion erscheint nach Token-Erstellung
    await page.waitForTimeout(800);
    await expect(page.getByText(/Offene Links/)).toBeVisible();
});

test('neu registrierter user erscheint in der Mitgliederliste', async ({page}) => {
    // ddet erstellt user-Token via API
    const ddetJwt = await getJwt('ddet', 'Ddet9999#');
    const token = await createToken(ddetJwt, {expiresAt: '2027-01-01T00:00:00Z'});

    // Neuer User registriert sich
    await registerUser(token.token, 'pwtest_neueruser', 'pwtest_neueruser@test.de', 'Pwtest1234!');

    // ddet sieht neuen User in seinen Einladungen
    await goToInvitations(page, ddetJwt);
    await expect(page.getByText('pwtest_neueruser', {exact: true})).toBeVisible();
});

test('dialog für group-admin zeigt keine Label- und Rollenfelder', async ({page}) => {
    const ddetJwt = await getJwt('ddet', 'Ddet9999#');
    await goToInvitations(page, ddetJwt);

    await page.getByRole('button', {name: 'Neuer Link'}).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Kein Label-Feld und kein Rollen-Feld für group-admin
    await expect(page.getByLabel('Label / Gruppe (optional)')).not.toBeVisible();
    await expect(page.getByLabel('Rolle')).not.toBeVisible();
    // Aber Ablaufdatum und optionale E-Mail sind da
    await expect(page.getByLabel('Ablaufdatum')).toBeVisible();
    await expect(page.getByLabel('Einladungs-E-Mail senden an (optional)')).toBeVisible();

    await page.getByRole('button', {name: 'Abbrechen'}).click();
});
