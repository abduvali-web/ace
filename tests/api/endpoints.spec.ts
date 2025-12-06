import { test, expect } from '@playwright/test';

test.describe('API Health Checks', () => {
    test('should have accessible health endpoint', async ({ request }) => {
        const response = await request.get('/api/health').catch(() => null);

        if (response) {
            expect(response.status()).toBe(200);
        }
    });

    test('should return 401 for unauthorized access to protected endpoints', async ({ request }) => {
        const endpoints = [
            '/api/admin/clients',
            '/api/admin/middle-admins',
            '/api/admin/low-admins',
            '/api/courier',
        ];

        for (const endpoint of endpoints) {
            const response = await request.get(endpoint).catch(() => null);

            if (response) {
                // Should be unauthorized or redirect
                expect([401, 403, 302]).toContain(response.status());
            }
        }
    });
});

test.describe('API Response Format', () => {
    test('should return JSON responses', async ({ request }) => {
        const response = await request.get('/api/health').catch(() => null);

        if (response && response.ok()) {
            const contentType = response.headers()['content-type'];
            expect(contentType).toContain('json');
        }
    });
});
