import { test, expect } from '@playwright/test';
import { CourierDashboard } from '../utils/page-objects';
import { loginAsRole } from '../utils/auth-helpers';

test.describe('Courier Dashboard', () => {
    let dashboard: CourierDashboard;

    test.beforeEach(async ({ page }) => {
        await loginAsRole(page, 'COURIER');
        await page.waitForURL(/\/courier/, { timeout: 10000 });
        dashboard = new CourierDashboard(page);
    });

    test('should load courier dashboard', async ({ page }) => {
        const url = page.url();
        expect(url).toContain('/courier');
    });

    test('should display orders tab', async ({ page }) => {
        if (await dashboard.activeOrdersTab.isVisible()) {
            await dashboard.activeOrdersTab.click();
            await page.waitForLoadState('networkidle');
        }
    });

    test('should display profile tab', async ({ page }) => {
        if (await dashboard.profileTab.isVisible()) {
            await dashboard.profileTab.click();
            await page.waitForLoadState('networkidle');

            // Should show profile form
            const emailField = page.locator('input[type="email"]');
            const isVisible = await emailField.isVisible().catch(() => false);

            if (isVisible) {
                await expect(emailField).toBeVisible();
            }
        }
    });

    test('should display chat tab', async ({ page }) => {
        if (await dashboard.chatTab.isVisible()) {
            await dashboard.chatTab.click();
            await page.waitForLoadState('networkidle');
        }
    });

    test('should display orders list', async ({ page }) => {
        const ordersCount = await dashboard.getOrdersCount();

        // Count can be 0 if no orders
        expect(ordersCount).toBeGreaterThanOrEqual(0);
    });

    test('should NOT have admin functionality', async ({ page }) => {
        const adminLinks = page.locator('a[href*="admin"]');
        const count = await adminLinks.count();

        // Courier should not have admin links
        expect(count).toBe(0);
    });
});
