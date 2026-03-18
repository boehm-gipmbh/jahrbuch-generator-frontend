// @ts-check
const {defineConfig, devices} = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Load .env.local if present (credentials, DB config — gitignored)
const envLocal = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocal)) {
    for (const line of fs.readFileSync(envLocal, 'utf8').split('\n')) {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) process.env[key.trim()] ??= rest.join('=').trim();
    }
}

module.exports = defineConfig({
    testDir: './tests',
    timeout: 60_000,
    expect: {timeout: 5_000},
    fullyParallel: false,
    retries: 0,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        video: 'on-first-retry',
    },
    projects: [
        {
            name: 'setup',
            testMatch: /auth\.setup\.js/,
        },
        {
            name: 'chromium',
            // Tall viewport so all story cards are visible without scrolling during drag tests.
            use: {...devices['Desktop Chrome'], viewport: {width: 1280, height: 2000}},
            dependencies: ['setup'],
        },
    ],
});
