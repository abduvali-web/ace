import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
    test('landing page should not have accessibility violations', async ({ page }) => {
        await page.goto('/');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('login page should not have accessibility violations', async ({ page }) => {
        await page.goto('/login');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('signup page should not have accessibility violations', async ({ page }) => {
        await page.goto('/signup');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        await page.goto('/');

        const h1Count = await page.locator('h1').count();

        // Should have at least one H1
        expect(h1Count).toBeGreaterThanOrEqual(1);

        // Should not have more than one H1 per page
        expect(h1Count).toBeLessThanOrEqual(1);
    });

    test('all images should have alt text', async ({ page }) => {
        await page.goto('/');

        const images = page.locator('img');
        const count = await images.count();

        for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute('alt');

            // Alt attribute should exist (can be empty for decorative images)
            expect(alt).not.toBeNull();
        }
    });

    test('all form inputs should have labels', async ({ page }) => {
        await page.goto('/login');

        const inputs = page.locator('input');
        const count = await inputs.count();

        for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const type = await input.getAttribute('type');

            // Skip hidden inputs
            if (type === 'hidden') continue;

            const id = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledBy = await input.getAttribute('aria-labelledby');

            // Should have either id with label, aria-label, or aria-labelledby
            expect(id || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
    });

    test('should support keyboard navigation', async ({ page }) => {
        await page.goto('/login');

        // Press Tab to navigate
        await page.keyboard.press('Tab');

        // Should focus on first focusable element
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
    });

    test('buttons should have accessible names', async ({ page }) => {
        await page.goto('/login');

        const buttons = page.locator('button');
        const count = await buttons.count();

        for (let i = 0; i < count; i++) {
            const button = buttons.nth(i);
            const text = await button.textContent();
            const ariaLabel = await button.getAttribute('aria-label');

            // Button should have either text content or aria-label
            expect(text || ariaLabel).toBeTruthy();
        }
    });
});
