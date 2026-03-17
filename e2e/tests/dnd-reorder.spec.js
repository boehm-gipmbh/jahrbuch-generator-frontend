// @ts-check
const {test, expect} = require('@playwright/test');

// Config via env vars (override in .env.local or CI)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USERNAME = process.env.TEST_USERNAME || 'test';
const PASSWORD = process.env.TEST_PASSWORD || 'test';
// Story used for DnD tests — must have at least 3 items in column 0
const TEST_STORY_ID = process.env.TEST_STORY_ID || '1';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Login and land on the story page.
 * Skips login if already authenticated (session reuse via storageState).
 */
async function loginAndGoto(page, storyId = TEST_STORY_ID) {
    await page.goto('/');
    const isLoginPage = await page.locator('input[name="username"]').isVisible().catch(() => false);
    if (isLoginPage) {
        await page.fill('input[name="username"]', USERNAME);
        await page.fill('input[name="password"]', PASSWORD);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL(/bilder|stories|texte/, {timeout: 10_000});
    }
    await page.goto(`/bilder/story/${storyId}`);
    // Wait for at least one sortable card to appear
    await page.waitForSelector('[data-testid="sortable-card"], .MuiPaper-root', {timeout: 10_000});
}

/**
 * Simulate a dnd-kit drag using pointer events.
 * dnd-kit uses PointerSensor — page.dragAndDrop() won't work.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} dragHandle  - the drag handle element
 * @param {import('@playwright/test').Locator} dropTarget  - the element to drop onto
 * @param {'before'|'after'} position                      - drop before or after target
 */
async function dndKitDrag(page, dragHandle, dropTarget, position = 'after') {
    const handleBox = await dragHandle.boundingBox();
    const targetBox = await dropTarget.boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not get bounding boxes for drag/drop');

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    const targetY = position === 'before'
        ? targetBox.y + targetBox.height * 0.2
        : targetBox.y + targetBox.height * 0.8;
    const targetX = targetBox.x + targetBox.width / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Small initial move to activate the PointerSensor (activation distance = 8px)
    await page.mouse.move(startX + 1, startY + 10, {steps: 3});
    // Move toward target in steps
    await page.mouse.move(targetX, targetY, {steps: 20});
    // Brief pause so dnd-kit registers the hover
    await page.waitForTimeout(100);
    await page.mouse.up();
    // Wait for optimistic update / API call to settle
    await page.waitForTimeout(500);
}

/**
 * Returns an array of card titles in the order they appear in the given column.
 * Column index is 0-based.
 */
async function getColumnOrder(page, colIndex) {
    // Cards are inside DroppableColumn boxes identified by their order in the grid
    const columns = page.locator('[data-col-index]');
    const col = columns.nth(colIndex);
    const titles = col.locator('.MuiTypography-subtitle1');
    return titles.allTextContents();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('DnD Reorder — Story view', () => {

    test.beforeEach(async ({page}) => {
        await loginAndGoto(page);
    });

    test('same column: drag item from position 1 to position 0 (top)', async ({page}) => {
        const col = page.locator('[data-col-index="0"]');
        const cards = col.locator('.MuiPaper-root');

        const titlesBefore = await col.locator('.MuiTypography-subtitle1').allTextContents();
        expect(titlesBefore.length).toBeGreaterThanOrEqual(2);

        const dragHandle = cards.nth(1).locator('svg[data-testid="DragIndicatorIcon"]').first();
        const dropTarget = cards.nth(0);

        await dndKitDrag(page, dragHandle, dropTarget, 'before');

        const titlesAfter = await col.locator('.MuiTypography-subtitle1').allTextContents();
        // Item that was at position 1 should now be at position 0
        expect(titlesAfter[0]).toBe(titlesBefore[1]);
        expect(titlesAfter[1]).toBe(titlesBefore[0]);
    });

    test('same column: drag item from position 0 to position 2', async ({page}) => {
        const col = page.locator('[data-col-index="0"]');
        const cards = col.locator('.MuiPaper-root');

        const titlesBefore = await col.locator('.MuiTypography-subtitle1').allTextContents();
        expect(titlesBefore.length).toBeGreaterThanOrEqual(3);

        const dragHandle = cards.nth(0).locator('svg[data-testid="DragIndicatorIcon"]').first();
        const dropTarget = cards.nth(2);

        await dndKitDrag(page, dragHandle, dropTarget, 'after');

        const titlesAfter = await col.locator('.MuiTypography-subtitle1').allTextContents();
        expect(titlesAfter[2]).toBe(titlesBefore[0]);
    });

    test('cross-column: drag item from column 0 to column 1', async ({page}) => {
        // Ensure layout has at least 2 columns — switch to 2-col if needed
        const twoColBtn = page.locator('[aria-label="2 Spalten"], [value="2col"]');
        if (await twoColBtn.isVisible()) await twoColBtn.click();

        const col0 = page.locator('[data-col-index="0"]');
        const col1 = page.locator('[data-col-index="1"]');

        const titles0Before = await col0.locator('.MuiTypography-subtitle1').allTextContents();
        const titles1Before = await col1.locator('.MuiTypography-subtitle1').allTextContents();
        expect(titles0Before.length).toBeGreaterThanOrEqual(1);

        const draggedTitle = titles0Before[0];
        const dragHandle = col0.locator('.MuiPaper-root').first()
            .locator('svg[data-testid="DragIndicatorIcon"]').first();
        const dropTarget = col1;

        await dndKitDrag(page, dragHandle, dropTarget, 'after');

        const titles1After = await col1.locator('.MuiTypography-subtitle1').allTextContents();
        expect(titles1After).toContain(draggedTitle);

        const titles0After = await col0.locator('.MuiTypography-subtitle1').allTextContents();
        expect(titles0After).not.toContain(draggedTitle);
    });

    test('order persists after page reload', async ({page}) => {
        const col = page.locator('[data-col-index="0"]');
        const cards = col.locator('.MuiPaper-root');

        const titlesBefore = await col.locator('.MuiTypography-subtitle1').allTextContents();
        expect(titlesBefore.length).toBeGreaterThanOrEqual(2);

        // Drag item 1 → position 0
        const dragHandle = cards.nth(1).locator('svg[data-testid="DragIndicatorIcon"]').first();
        const dropTarget = cards.nth(0);
        await dndKitDrag(page, dragHandle, dropTarget, 'before');

        const titlesAfterDrag = await col.locator('.MuiTypography-subtitle1').allTextContents();

        // Reload and check persistence
        await page.reload();
        await page.waitForSelector('.MuiPaper-root', {timeout: 10_000});

        const titlesAfterReload = await col.locator('.MuiTypography-subtitle1').allTextContents();
        expect(titlesAfterReload[0]).toBe(titlesAfterDrag[0]);
        expect(titlesAfterReload[1]).toBe(titlesAfterDrag[1]);
    });
});
