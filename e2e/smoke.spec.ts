import { test, expect } from '@playwright/test';

/**
 * Basic E2E smoke test: verify the app loads and matchmaking screen renders.
 * Full E2E tests simulating two players require more complex multi-context setups.
 */
test.describe('RPS Battle E2E', () => {
    test('app loads and shows matchmaking screen', async ({ page }) => {
        await page.goto('/');

        // Wait for DOM to load (networkidle can hang with Socket.IO)
        await page.waitForLoadState('domcontentloaded');

        // Check that the page title or main heading appears
        await expect(page).toHaveTitle(/RPS Battle/i);

        // Verify we can see the matchmaking screen (join queue button exists)
        const joinQueueButton = page.getByRole('button', { name: /join queue|play/i });
        await expect(joinQueueButton).toBeVisible();
    });

    test('can navigate to singleplayer mode', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Look for singleplayer/AI button and assert it's visible
        const singleplayerButton = page.getByRole('button', { name: /ai|singleplayer|vs computer/i });
        await expect(singleplayerButton).toBeVisible();

        await singleplayerButton.click();

        // Should transition to setup or game screen
        await page.waitForTimeout(500);
    });
});
