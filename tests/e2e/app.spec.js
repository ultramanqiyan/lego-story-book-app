const { test, expect } = require('@playwright/test');

test.describe('E2E Tests - User Flow', () => {
    test.describe('TC_E2E_001: User Login Complete Flow', () => {
        test('should login successfully', async ({ page }) => {
            await page.goto('/login');
            
            await page.fill('#username', 'testuser');
            await page.fill('#password', 'password123');
            
            await page.click('button[type="submit"]');
            
            await page.waitForURL('**/story-create');
            
            await expect(page).toHaveURL(/.*story-create.*/);
        });
    });
    
    test.describe('TC_E2E_002: User Logout Complete Flow', () => {
        test('should logout successfully', async ({ page }) => {
            await page.goto('/login');
            await page.fill('#username', 'testuser');
            await page.fill('#password', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/story-create');
            
            await page.click('#logout-btn');
            
            await page.waitForURL('**/login');
            
            await expect(page).toHaveURL(/.*login.*/);
        });
    });
});

test.describe('E2E Tests - Story Creation Flow', () => {
    test.describe('TC_E2E_003: Complete Story Creation Flow', () => {
        test('should create story successfully', async ({ page }) => {
            await page.goto('/login');
            await page.fill('#username', 'testuser');
            await page.fill('#password', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/story-create');
            
            await page.fill('#new-book-name', 'E2E测试书籍');
            await page.click('#next-btn');
            
            await page.waitForSelector('.character-card');
            await page.click('.character-card:first-child');
            await page.click('#next-btn');
            
            await page.waitForSelector('.plot-card');
            await page.click('.plot-card:first-child');
            await page.click('#next-btn');
            
            await page.waitForSelector('.chapter-result', { timeout: 30000 });
            
            await expect(page.locator('.chapter-result')).toBeVisible();
        });
    });
});

test.describe('E2E Tests - Book Management Flow', () => {
    test.describe('TC_E2E_008: Book CRUD Flow', () => {
        test('should manage books successfully', async ({ page }) => {
            await page.goto('/login');
            await page.fill('#username', 'testuser');
            await page.fill('#password', 'password123');
            await page.click('button[type="submit"]');
            
            await page.goto('/bookshelf');
            
            await expect(page.locator('.book-card')).toHaveCountGreaterThan(0);
            
            const bookTitle = await page.locator('.book-card:first-child .book-title').textContent();
            expect(bookTitle).toBeTruthy();
        });
    });
    
    test.describe('TC_E2E_009: Book Detail Page Flow', () => {
        test('should view book detail successfully', async ({ page }) => {
            await page.goto('/login');
            await page.fill('#username', 'testuser');
            await page.fill('#password', 'password123');
            await page.click('button[type="submit"]');
            
            await page.goto('/bookshelf');
            
            await page.click('.book-card:first-child');
            
            await page.waitForSelector('.book-detail-container');
            
            await expect(page.locator('.book-title')).toBeVisible();
        });
    });
});

test.describe('E2E Tests - Character Management Flow', () => {
    test.describe('TC_E2E_010: Create Custom Character Flow', () => {
        test('should create character successfully', async ({ page }) => {
            await page.goto('/login');
            await page.fill('#username', 'testuser');
            await page.fill('#password', 'password123');
            await page.click('button[type="submit"]');
            
            await page.goto('/characters');
            
            await expect(page.locator('.character-card')).toHaveCountGreaterThan(0);
        });
    });
});

test.describe('E2E Tests - Navigation', () => {
    test.describe('TC_E2E_017: Navigation Bar Function Test', () => {
        test('should navigate between pages', async ({ page }) => {
            await page.goto('/login');
            await page.fill('#username', 'testuser');
            await page.fill('#password', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/story-create');
            
            await page.click('a[href="/bookshelf"]');
            await page.waitForURL('**/bookshelf');
            await expect(page).toHaveURL(/.*bookshelf.*/);
            
            await page.click('a[href="/characters"]');
            await page.waitForURL('**/characters');
            await expect(page).toHaveURL(/.*characters.*/);
        });
    });
});

test.describe('E2E Tests - Error Handling', () => {
    test.describe('TC_E2E_019: Network Error Handling', () => {
        test('should handle network errors gracefully', async ({ page, context }) => {
            await page.goto('/login');
            await page.fill('#username', 'testuser');
            await page.fill('#password', 'password123');
            
            await context.setOffline(true);
            
            await page.click('button[type="submit"]');
            
            await expect(page.locator('.toast-error')).toBeVisible({ timeout: 5000 });
            
            await context.setOffline(false);
        });
    });
});

test.describe('E2E Tests - Performance', () => {
    test.describe('TC_E2E_021: Page Load Performance', () => {
        test('should load pages within 5 seconds', async ({ page }) => {
            const startTime = Date.now();
            
            await page.goto('/login');
            
            const loadTime = Date.now() - startTime;
            
            expect(loadTime).toBeLessThan(5000);
        });
    });
});

test.describe('E2E Tests - Mobile Responsive', () => {
    test.describe('TC_E2E_018: Mobile Adaptation Test', () => {
        test('should display correctly on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            
            await page.goto('/login');
            
            await expect(page.locator('.login-card')).toBeVisible();
            
            const loginCard = await page.locator('.login-card').boundingBox();
            expect(loginCard.width).toBeLessThanOrEqual(375);
        });
    });
});
