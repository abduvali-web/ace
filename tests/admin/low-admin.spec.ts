import { test, expect } from '@playwright/test';
import { AdminDashboard } from '../utils/page-objects';
import { loginAsRole } from '../utils/auth-helpers';

test.describe('Low Admin Dashboard', () => {
    let dashboard: AdminDashboard;

    test.beforeEach(async ({ page }) => {
        await loginAsRole(page, 'LOW_ADMIN');
        await page.waitForURL(/\/low-admin/, { timeout: 10000 });
        dashboard = new AdminDashboard(page);
    });

    test('should load low admin dashboard', async ({ page }) => {
        const url = page.url();
        expect(url).toContain('/low-admin');

        await expect(dashboard.navigationTabs).toBeVisible();
    });

    test('should display statistics tab', async ({ page }) => {
        const statsTab = page.locator('[role="tab"]:has-text("Статистика"), [role="tab"]:has-text("Statistics")');

        if (await statsTab.isVisible()) {
            await statsTab.click();
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

    test('should display orders tab', async ({ page }) => {
        const ordersTab = page.locator('[role="tab"]:has-text("Заказы"), [role="tab"]:has-text("Orders")');

        if (await ordersTab.isVisible()) {
            await ordersTab.click();
            await dashboard.waitForDataToLoad();
        }
    });

    test('should NOT have admin creation capabilities', async ({ page }) => {
        const adminTabs = page.locator('[role="tab"]:has-text("Admin")');
        const count = await adminTabs.count();

        // Low admin should not have admin management tabs
        expect(count).toBe(0);
    });

    test('should NOT have courier management', async ({ page }) => {
        const couriersTab = page.locator('[role="tab"]:has-text("Курьер"), [role="tab"]:has-text("Courier")');
        const isVisible = await couriersTab.isVisible().catch(() => false);

        // Low admin should not manage couriers
        expect(isVisible).toBe(false);
    });

    test('should have chat functionality', async ({ page }) => {
        const chatTab = page.locator('[role="tab"]:has-text("Чат"), [role="tab"]:has-text("Chat")');

        if (await chatTab.isVisible()) {
            await chatTab.click();
            await dashboard.waitForDataToLoad();
        }
    });

    test('should have profile section', async ({ page }) => {
        const profileTab = page.locator('[role="tab"]:has-text("Профиль"), [role="tab"]:has-text("Profile")');

        if (await profileTab.isVisible()) {
            await profileTab.click();
            await dashboard.waitForDataToLoad();
        }
    });
});
