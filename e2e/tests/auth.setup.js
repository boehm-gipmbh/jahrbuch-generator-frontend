// @ts-check
/**
 * Global setup: login once and save the JWT to auth-state.json.
 * Tests inject the JWT via page.addInitScript() so React reads it from sessionStorage on startup.
 */
const {test: setup, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const USERNAME = process.env.TEST_USERNAME || 'test';
const PASSWORD = process.env.TEST_PASSWORD || 'test';

setup('authenticate', async ({page}) => {
    await page.goto('/');
    await page.waitForSelector('input[name="username"]', {timeout: 15_000});
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.locator('button:has-text("Sign In")').click();

    // Wait for JWT to appear in sessionStorage (React sets it after successful login)
    const jwt = await page.waitForFunction(() => sessionStorage.getItem('jwt'), {timeout: 15_000});
    const jwtValue = await jwt.jsonValue();
    expect(jwtValue).toBeTruthy();

    // Save JWT for all tests to use
    const authDir = path.join(__dirname, '..');
    fs.writeFileSync(path.join(authDir, 'auth-state.json'), JSON.stringify({jwt: jwtValue}));
});
