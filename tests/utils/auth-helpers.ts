import { Page } from '@playwright/test';

/**
 * Authentication helper functions for tests
 */

export interface TestUser {
    email: string;
    password: string;
    role: 'SUPER_ADMIN' | 'MIDDLE_ADMIN' | 'LOW_ADMIN' | 'COURIER';
    name: string;
}

export const TEST_USERS: Record<string, TestUser> = {
    superAdmin: {
        email: 'super@admin.com',
        password: 'Test123!@#',
        role: 'SUPER_ADMIN',
        name: 'Super Admin',
    },
    middleAdmin: {
        email: 'middle@admin.com',
        password: 'Test123!@#',
        role: 'MIDDLE_ADMIN',
        name: 'Middle Admin',
    },
    lowAdmin: {
        email: 'low@admin.com',
        password: 'Test123!@#',
        role: 'LOW_ADMIN',
        name: 'Low Admin',
    },
    courier: {
        email: 'courier@test.com',
        password: 'Test123!@#',
        role: 'COURIER',
        name: 'Test Courier',
    },
};

/**
 * Login helper function
 */
export async function login(page: Page, user: TestUser) {
    await page.goto('/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
}

/**
 * Login as specific role
 */
export async function loginAsRole(
    page: Page,
    role: 'SUPER_ADMIN' | 'MIDDLE_ADMIN' | 'LOW_ADMIN' | 'COURIER'
) {
    const userMap = {
        SUPER_ADMIN: TEST_USERS.superAdmin,
        MIDDLE_ADMIN: TEST_USERS.middleAdmin,
        LOW_ADMIN: TEST_USERS.lowAdmin,
        COURIER: TEST_USERS.courier,
    };

    await login(page, userMap[role]);
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
    // Assuming there's a logout button/link
    await page.click('[data-testid="logout-button"], button:has-text("Выход"), button:has-text("Logout")');
    await page.waitForURL('/login');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
    try {
        // Check for auth cookie or session
        const cookies = await page.context().cookies();
        return cookies.some(cookie =>
            cookie.name.includes('session') ||
            cookie.name.includes('auth') ||
            cookie.name.includes('token')
        );
    } catch {
        return false;
    }
}

/**
 * Get role-specific dashboard URL
 */
export function getDashboardUrl(role: TestUser['role']): string {
    const urlMap = {
        SUPER_ADMIN: '/super-admin',
        MIDDLE_ADMIN: '/middle-admin',
        LOW_ADMIN: '/low-admin',
        COURIER: '/courier',
    };

    return urlMap[role];
}
