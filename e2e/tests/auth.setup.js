// @ts-check
/**
 * Global setup: fetch a fresh JWT directly from the API (no browser UI interaction)
 * and save it to auth-state.json for all tests to inject via addInitScript().
 */
const {test: setup, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const USERNAME = process.env.TEST_USERNAME || 'test';
const PASSWORD = process.env.TEST_PASSWORD || 'test';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

setup('authenticate', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: USERNAME, password: PASSWORD}),
    });

    expect(response.ok, `Login failed: ${response.status} ${response.statusText}`).toBeTruthy();

    const jwt = await response.text();
    expect(jwt, 'JWT must not be empty').toBeTruthy();

    const authDir = path.join(__dirname, '..');
    fs.writeFileSync(path.join(authDir, 'auth-state.json'), JSON.stringify({jwt}));
});