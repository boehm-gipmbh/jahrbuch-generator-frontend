// @ts-check
const {defineConfig, devices} = require('@playwright/test');

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
            use: {...devices['Desktop Chrome']},
            dependencies: ['setup'],
        },
    ],
});
