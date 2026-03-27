// @ts-check
/**
 * Playwright globalSetup — läuft einmalig vor allen Tests.
 * Seeded die Testdatenbank mit festen IDs (User abi85, Story 1801, Bilder/Texte).
 * Liest DB-Verbindungsdaten aus .env.local (gleiche Quelle wie playwright.config.js).
 */
const {execSync} = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async function globalSetup() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const user = process.env.DB_USER || 'postgres';
    const db   = process.env.DB_NAME || 'postgres';
    const pass = process.env.DB_PASS || 'postgres';

    const seedFile = path.join(__dirname, 'seed.sql');

    console.log(`\n[globalSetup] Seede Testdatenbank ${user}@${host}:${port}/${db} …`);

    try {
        execSync(
            `PGPASSWORD=${pass} psql -h ${host} -p ${port} -U ${user} -d ${db} -f "${seedFile}"`,
            {stdio: 'pipe'}
        );
        console.log('[globalSetup] Seed erfolgreich.\n');
    } catch (err) {
        console.error('[globalSetup] Seed fehlgeschlagen:');
        console.error(err.stderr?.toString() || err.message);
        throw err;
    }
};
