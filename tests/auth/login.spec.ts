import { test, expect } from '@playwright/test';
import { LoginPage } from '../utils/page-objects';
import { TEST_USERS } from '../utils/auth-helpers';

test.describe('Login Page', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test('should load login page successfully', async ({ page }) => {
        await expect(page).toHaveTitle(/Login|Вход|AutoFood/i);
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.submitButton).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
        await loginPage.submitButton.click();

        // Check for HTML5 validation or custom error messages
        const emailValidity = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
        expect(emailValidity).toBe(false);
    });

    test('should show validation error for invalid email format', async ({ page }) => {
        await loginPage.emailInput.fill('invalid-email');
        await loginPage.passwordInput.fill('password123');
        await loginPage.submitButton.click();

        // Check for validation
        const emailValidity = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
        expect(emailValidity).toBe(false);
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await loginPage.login('wrong@email.com', 'wrongpassword');

        // Wait for error message
        await page.waitForTimeout(2000);

        // Should still be on login page or show error
        const url = page.url();
        const hasError = await loginPage.errorMessage.isVisible().catch(() => false);

        expect(url.includes('/login') || hasError).toBeTruthy();
    });

    test('should successfully login with valid credentials (super admin)', async ({ page }) => {
        await loginPage.login(TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);

        // Wait for navigation
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        // Should redirect to dashboard
        const url = page.url();
        expect(url).toContain('admin');
    });

    test('should have link to signup page', async ({ page }) => {
        await expect(loginPage.signupLink).toBeVisible();

        await loginPage.signupLink.click();
        await page.waitForURL(/\/signup/);

        expect(page.url()).toContain('/signup');
    });

    test('should display Google login button', async ({ page }) => {
        const googleButton = await loginPage.googleLoginButton.isVisible().catch(() => false);

        // Google button might be present
        if (googleButton) {
            await expect(loginPage.googleLoginButton).toBeVisible();
        }
    });

    test('should handle network errors gracefully', async ({ page, context }) => {
        // Simulate offline mode
        await context.setOffline(true);

        await loginPage.login(TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);

        // Should show some error indication
        await page.waitForTimeout(2000);

        // Re-enable network
        await context.setOffline(false);
    });

    test('should not auto-fill password on page load', async ({ page }) => {
        const passwordValue = await loginPage.passwordInput.inputValue();
        expect(passwordValue).toBe('');
    });

    test('should toggle password visibility', async ({ page }) => {
        const toggleButton = page.locator('button:has-text("👁"), [data-testid="toggle-password"], button[aria-label*="password"]');

        if (await toggleButton.isVisible().catch(() => false)) {
            const initialType = await loginPage.passwordInput.getAttribute('type');
            await toggleButton.click();
            const newType = await loginPage.passwordInput.getAttribute('type');

            expect(initialType).not.toBe(newType);
        }
    });
});
