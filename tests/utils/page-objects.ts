import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Login Page
 */
export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly submitButton: Locator;
    readonly googleLoginButton: Locator;
    readonly signupLink: Locator;
    readonly errorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.locator('input[type="email"]');
        this.passwordInput = page.locator('input[type="password"]');
        this.submitButton = page.locator('button[type="submit"]');
        this.googleLoginButton = page.locator('button:has-text("Google")');
        this.signupLink = page.locator('a[href="/signup"]');
        this.errorMessage = page.locator('[role="alert"], .error, .text-red-500');
    }

    async goto() {
        await this.page.goto('/login');
    }

    async login(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    async waitForError() {
        await this.errorMessage.waitFor({ state: 'visible' });
    }

    async getErrorText(): Promise<string> {
        return await this.errorMessage.textContent() || '';
    }
}

/**
 * Page Object Model for Signup Page
 */
export class SignupPage {
    readonly page: Page;
    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly submitButton: Locator;
    readonly googleSignupButton: Locator;
    readonly loginLink: Locator;
    readonly errorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.nameInput = page.locator('input[name="name"], input[placeholder*="имя"], input[placeholder*="name"]').first();
        this.emailInput = page.locator('input[type="email"]');
        this.passwordInput = page.locator('input[type="password"]').first();
        this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
        this.submitButton = page.locator('button[type="submit"]');
        this.googleSignupButton = page.locator('button:has-text("Google")');
        this.loginLink = page.locator('a[href="/login"]');
        this.errorMessage = page.locator('[role="alert"], .error, .text-red-500');
    }

    async goto() {
        await this.page.goto('/signup');
    }

    async signup(name: string, email: string, password: string) {
        await this.nameInput.fill(name);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        if (await this.confirmPasswordInput.isVisible()) {
            await this.confirmPasswordInput.fill(password);
        }
        await this.submitButton.click();
    }
}

/**
 * Page Object Model for Admin Dashboard (shared components)
 */
export class AdminDashboard {
    readonly page: Page;
    readonly navigationTabs: Locator;
    readonly activeTab: Locator;
    readonly statsCards: Locator;
    readonly dataTable: Locator;
    readonly searchInput: Locator;
    readonly addButton: Locator;
    readonly profileButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.navigationTabs = page.locator('[role="tablist"]');
        this.activeTab = page.locator('[role="tab"][aria-selected="true"]');
        this.statsCards = page.locator('.stats-card, [data-testid*="stat"]');
        this.dataTable = page.locator('table');
        this.searchInput = page.locator('input[type="search"], input[placeholder*="Поиск"], input[placeholder*="Search"]');
        this.addButton = page.locator('button:has-text("Добавить"), button:has-text("Add")');
        this.profileButton = page.locator('button:has-text("Профиль"), button:has-text("Profile")');
    }

    async selectTab(tabName: string) {
        await this.page.click(`[role="tab"]:has-text("${tabName}")`);
    }

    async waitForDataToLoad() {
        await this.page.waitForLoadState('networkidle');
        // Wait for any loading spinners to disappear
        await this.page.waitForSelector('[data-loading="true"], .loading, .spinner', { state: 'hidden', timeout: 5000 }).catch(() => { });
    }

    async getStatsCount(): Promise<number> {
        return await this.statsCards.count();
    }

    async searchFor(query: string) {
        await this.searchInput.fill(query);
        await this.page.waitForTimeout(500); // Wait for debounce
    }
}

/**
 * Page Object Model for Courier Dashboard
 */
export class CourierDashboard {
    readonly page: Page;
    readonly ordersList: Locator;
    readonly activeOrdersTab: Locator;
    readonly completedOrdersTab: Locator;
    readonly profileTab: Locator;
    readonly chatTab: Locator;

    constructor(page: Page) {
        this.page = page;
        this.ordersList = page.locator('.order-item, [data-testid="order"]');
        this.activeOrdersTab = page.locator('[role="tab"]:has-text("Заказы"), [role="tab"]:has-text("Orders")');
        this.completedOrdersTab = page.locator('[role="tab"]:has-text("Завершенные"), [role="tab"]:has-text("Completed")');
        this.profileTab = page.locator('[role="tab"]:has-text("Профиль"), [role="tab"]:has-text("Profile")');
        this.chatTab = page.locator('[role="tab"]:has-text("Чат"), [role="tab"]:has-text("Chat")');
    }

    async goto() {
        await this.page.goto('/courier');
    }

    async getOrdersCount(): Promise<number> {
        return await this.ordersList.count();
    }
}

/**
 * Page Object Model for Landing Page
 */
export class LandingPage {
    readonly page: Page;
    readonly heroSection: Locator;
    readonly featuresSection: Locator;
    readonly pricingSection: Locator;
    readonly testimonialsSection: Locator;
    readonly loginButton: Locator;
    readonly contactButton: Locator;
    readonly languageSwitcher: Locator;
    readonly userGuideButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heroSection = page.locator('section').first();
        this.featuresSection = page.locator('section:has-text("Функсiyalar"), section:has-text("Features")');
        this.pricingSection = page.locator('section:has-text("Narx"), section:has-text("Pricing")');
        this.testimonialsSection = page.locator('section:has-text("Mijozlar"), section:has-text("Testimonial")');
        this.loginButton = page.locator('a[href="/login"]').first();
        this.contactButton = page.locator('a[href^="tel:"]').first();
        this.languageSwitcher = page.locator('[data-testid="language-switcher"], button:has-text("RU"), button:has-text("UZ")');
        this.userGuideButton = page.locator('button:has-text("Qo\'llanma"), button:has-text("Guide")');
    }

    async goto() {
        await this.page.goto('/');
    }

    async scrollToSection(section: 'features' | 'pricing' | 'testimonials') {
        const sectionMap = {
            features: this.featuresSection,
            pricing: this.pricingSection,
            testimonials: this.testimonialsSection,
        };

        await sectionMap[section].scrollIntoViewIfNeeded();
    }
}
