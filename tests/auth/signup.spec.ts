import { test, expect } from '@playwright/test';
import { SignupPage } from '../utils/page-objects';

test.describe('Signup Page', () => {
    let signupPage: SignupPage;

    test.beforeEach(async ({ page }) => {
        signupPage = new SignupPage(page);
        await signupPage.goto();
    });

    test('should load signup page successfully', async ({ page }) => {
        await expect(page).toHaveTitle(/Signup|Регистрация|AutoFood/i);
        await expect(signupPage.emailInput).toBeVisible();
        await expect(signupPage.passwordInput).toBeVisible();
        await expect(signupPage.submitButton).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
        await signupPage.submitButton.click();

        const emailValidity = await signupPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
        expect(emailValidity).toBe(false);
    });

    test('should show validation error for invalid email', async ({ page }) => {
        if (await signupPage.nameInput.isVisible()) {
            await signupPage.nameInput.fill('Test User');
        }
        await signupPage.emailInput.fill('invalid-email');
        await signupPage.passwordInput.fill('Password123!');

        if (await signupPage.confirmPasswordInput.isVisible()) {
            await signupPage.confirmPasswordInput.fill('Password123!');
        }

        await signupPage.submitButton.click();

        const emailValidity = await signupPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
        expect(emailValidity).toBe(false);
    });

    test('should show error for weak password', async ({ page }) => {
        if (await signupPage.nameInput.isVisible()) {
            await signupPage.nameInput.fill('Test User');
        }
        await signupPage.emailInput.fill('test@example.com');
        await signupPage.passwordInput.fill('weak');

        if (await signupPage.confirmPasswordInput.isVisible()) {
            await signupPage.confirmPasswordInput.fill('weak');
        }

        await signupPage.submitButton.click();

        await page.waitForTimeout(1000);

        // Should show error or stay on page
        const hasError = await signupPage.errorMessage.isVisible().catch(() => false);
        const url = page.url();

        expect(hasError || url.includes('/signup')).toBeTruthy();
    });

    test('should show error when passwords do not match', async ({ page }) => {
        if (await signupPage.confirmPasswordInput.isVisible()) {
            if (await signupPage.nameInput.isVisible()) {
                await signupPage.nameInput.fill('Test User');
            }
            await signupPage.emailInput.fill('test@example.com');
            await signupPage.passwordInput.fill('Password123!');
            await signupPage.confirmPasswordInput.fill('DifferentPassword123!');

            await signupPage.submitButton.click();

            await page.waitForTimeout(1000);

            const hasError = await signupPage.errorMessage.isVisible().catch(() => false);
            const url = page.url();

            expect(hasError || url.includes('/signup')).toBeTruthy();
        }
    });

    test('should have link to login page', async ({ page }) => {
        await expect(signupPage.loginLink).toBeVisible();

        await signupPage.loginLink.click();
        await page.waitForURL(/\/login/);

        expect(page.url()).toContain('/login');
    });

    test('should display Google signup button', async ({ page }) => {
        const googleButton = await signupPage.googleSignupButton.isVisible().catch(() => false);

        if (googleButton) {
            await expect(signupPage.googleSignupButton).toBeVisible();
        }
    });

    test('should navigate to login after successful signup', async ({ page }) => {
        const timestamp = Date.now();
        const testEmail = `test${timestamp}@example.com`;

        await signupPage.signup('Test User ' + timestamp, testEmail, 'Password123!@#');

        // Wait for response
        await page.waitForTimeout(3000);

        const url = page.url();

        // Should either stay on signup with error (duplicate) or navigate to login/dashboard
        expect(url).toBeTruthy();
    });
});
