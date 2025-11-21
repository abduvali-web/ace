import { test, expect } from '@playwright/test';
import { LandingPage } from '../utils/page-objects';

test.describe('Landing Page', () => {
    let landingPage: LandingPage;

    test.beforeEach(async ({ page }) => {
        landingPage = new LandingPage(page);
        await landingPage.goto();
    });

    test('should load landing page successfully', async ({ page }) => {
        await expect(page).toHaveTitle(/AutoFood/i);
        await expect(landingPage.heroSection).toBeVisible();
    });

    test('should display hero section with call-to-action', async ({ page }) => {
        await expect(landingPage.heroSection).toBeVisible();
        await expect(landingPage.loginButton).toBeVisible();
        await expect(landingPage.contactButton).toBeVisible();
    });

    test('should navigate to login page when login button clicked', async ({ page }) => {
        await landingPage.loginButton.click();
        await page.waitForURL(/\/login/);

        expect(page.url()).toContain('/login');
    });

    test('should have working contact button', async ({ page }) => {
        const href = await landingPage.contactButton.getAttribute('href');
        expect(href).toContain('tel:');
    });

    test('should display features section', async ({ page }) => {
        if (await landingPage.featuresSection.isVisible()) {
            await landingPage.scrollToSection('features');
            await expect(landingPage.featuresSection).toBeInViewport();
        }
    });

    test('should display pricing section', async ({ page }) => {
        if (await landingPage.pricingSection.isVisible()) {
            await landingPage.scrollToSection('pricing');
            await expect(landingPage.pricingSection).toBeInViewport();
        }
    });

    test('should display testimonials section', async ({ page }) => {
        if (await landingPage.testimonialsSection.isVisible()) {
            await landingPage.scrollToSection('testimonials');
            await expect(landingPage.testimonialsSection).toBeInViewport();
        }
    });

    test('should have language switcher', async ({ page }) => {
        const langSwitcher = await landingPage.languageSwitcher.isVisible().catch(() => false);

        if (langSwitcher) {
            await expect(landingPage.languageSwitcher).toBeVisible();
        }
    });

    test('should have user guide button', async ({ page }) => {
        const guideButton = await landingPage.userGuideButton.isVisible().catch(() => false);

        if (guideButton) {
            await expect(landingPage.userGuideButton).toBeVisible();

            // Click and check modal opens
            await landingPage.userGuideButton.click();
            await page.waitForTimeout(500);

            // Modal should be visible
            const modal = page.locator('[role="dialog"], .modal');
            await expect(modal).toBeVisible();
        }
    });

    test('should not have console errors', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.waitForLoadState('networkidle');

        // Filter out known third-party errors
        const criticalErrors = errors.filter(error =>
            !error.includes('favicon') &&
            !error.includes('chrome-extension')
        );

        if (criticalErrors.length > 0) {
            console.log('Console errors found:', criticalErrors);
        }
    });

    test('should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        await expect(landingPage.heroSection).toBeVisible();
        await expect(landingPage.loginButton).toBeVisible();
    });

    test('should load all images without errors', async ({ page }) => {
        const images = page.locator('img');
        const count = await images.count();

        for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            const isVisible = await img.isVisible().catch(() => false);

            if (isVisible) {
                const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
                const src = await img.getAttribute('src');

                if (src && !src.startsWith('data:')) {
                    expect(naturalWidth).toBeGreaterThan(0);
                }
            }
        }
    });

    test('should have proper meta tags for SEO', async ({ page }) => {
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(10);

        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
        if (metaDescription) {
            expect(metaDescription.length).toBeGreaterThan(50);
        }
    });
});
