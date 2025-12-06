import { test, expect } from '@playwright/test';
import { AdminDashboard } from '../utils/page-objects';
import { loginAsRole } from '../utils/auth-helpers';

test.describe('Middle Admin Dashboard', () => {
    let dashboard: AdminDashboard;

    test.beforeEach(async ({ page }) => {
        await loginAsRole(page, 'MIDDLE_ADMIN');
        await page.waitForURL(/\/middle-admin/, { timeout: 10000 });
        dashboard = new AdminDashboard(page);
    });

    test('should load middle admin dashboard', async ({ page }) => {
        const url = page.url();
        expect(url).toContain('/middle-admin');

        await expect(dashboard.navigationTabs).toBeVisible();
    });

    test('should display statistics tab', async ({ page }) => {
        const statsTab = page.locator('[role="tab"]:has-text("Статистика"), [role="tab"]:has-text("Statistics")');

        if (await statsTab.isVisible()) {
            await statsTab.click();
            await dashboard.waitForDataToLoad();

            const statsCount = await dashboard.getStatsCount();
            expect(statsCount).toBeGreaterThan(0);
        }
    });

    test('should display low admins tab', async ({ page }) => {
        const lowAdminsTab = page.locator('[role="tab"]:has-text("Low Admin")');

        if (await lowAdminsTab.isVisible()) {
            await lowAdminsTab.click();
            await dashboard.waitForDataToLoad();
        }
    });

    test('should display couriers tab', async ({ page }) => {
        const couriersTab = page.locator('[role="tab"]:has-text("Курьер"), [role="tab"]:has-text("Courier")');

        if (await couriersTab.isVisible()) {
            await couriersTab.click();
            await dashboard.waitForDataToLoad();
        }
    });

    test('should display clients tab', async ({ page }) => {
        const clientsTab = page.locator('[role="tab"]:has-text("Клиенты"), [role="tab"]:has-text("Clients")');

        if (await clientsTab.isVisible()) {
            await clientsTab.click();
            await dashboard.waitForDataToLoad();
        }
    });

    test('should NOT have access to middle admin management', async ({ page }) => {
        const middleAdminsTab = page.locator('[role="tab"]:has-text("Middle Admin")');
        const isVisible = await middleAdminsTab.isVisible().catch(() => false);

        // Middle admin should not see middle admin tab
        expect(isVisible).toBe(false);
    });

    test('should have chat functionality', async ({ page }) => {
        const chatTab = page.locator('[role="tab"]:has-text("Чат"), [role="tab"]:has-text("Chat")');

        if (await chatTab.isVisible()) {
            await chatTab.click();
            await dashboard.waitForDataToLoad();
        }
    });
});
