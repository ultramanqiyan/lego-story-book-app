const { initializeDatabase, seedPresetCharacters, seedTestData } = require('../setup');

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

describe('Share Management Unit Tests', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_SHARE_001: Create Public Share Success', () => {
        test('should create public share successfully', async () => {
            const shareId = generateId('share');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO shares (share_id, book_id, user_id, share_type, is_active, view_count, created_at)
                VALUES (?, ?, ?, 'public', 1, 0, ?)
            `).bind(shareId, 'test_book_1', 'test_user_1', now).run();
            
            const share = await db.prepare(`SELECT * FROM shares WHERE share_id = ?`).bind(shareId).first();
            
            expect(share).toBeDefined();
            expect(share.share_type).toBe('public');
            expect(share.is_active).toBe(1);
        });
    });
    
    describe('TC_SHARE_002: Create Private Share Success', () => {
        test('should create private share successfully', async () => {
            const shareId = generateId('share');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO shares (share_id, book_id, user_id, share_type, password, is_active, view_count, created_at)
                VALUES (?, ?, ?, 'private', ?, 1, 0, ?)
            `).bind(shareId, 'test_book_1', 'test_user_1', '1234', now).run();
            
            const share = await db.prepare(`SELECT * FROM shares WHERE share_id = ?`).bind(shareId).first();
            
            expect(share).toBeDefined();
            expect(share.share_type).toBe('private');
            expect(share.password).toBe('1234');
        });
    });
    
    describe('TC_SHARE_005: Create Private Share Failed - Invalid Password Format', () => {
        test('should validate password format', () => {
            const validPasswords = ['1234', '12345', '123456'];
            const invalidPasswords = ['abc', '1234567', 'abcdef', '12ab'];
            
            const passwordRegex = /^\d{4,6}$/;
            
            validPasswords.forEach(pwd => {
                expect(passwordRegex.test(pwd)).toBe(true);
            });
            
            invalidPasswords.forEach(pwd => {
                expect(passwordRegex.test(pwd)).toBe(false);
            });
        });
    });
    
    describe('TC_SHARE_006: Access Public Share Success', () => {
        test('should access public share successfully', async () => {
            const shareId = generateId('share');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO shares (share_id, book_id, user_id, share_type, is_active, view_count, created_at)
                VALUES (?, ?, ?, 'public', 1, 0, ?)
            `).bind(shareId, 'test_book_1', 'test_user_1', now).run();
            
            const share = await db.prepare(`SELECT * FROM shares WHERE share_id = ? AND is_active = 1`).bind(shareId).first();
            
            expect(share).toBeDefined();
            
            await db.prepare(`UPDATE shares SET view_count = view_count + 1 WHERE share_id = ?`).bind(shareId).run();
            
            const updatedShare = await db.prepare(`SELECT * FROM shares WHERE share_id = ?`).bind(shareId).first();
            expect(updatedShare.view_count).toBe(1);
        });
    });
    
    describe('TC_SHARE_007: Access Private Share Success', () => {
        test('should access private share with correct password', async () => {
            const shareId = generateId('share');
            const now = Date.now();
            const password = '1234';
            
            await db.prepare(`
                INSERT INTO shares (share_id, book_id, user_id, share_type, password, is_active, view_count, created_at)
                VALUES (?, ?, ?, 'private', ?, 1, 0, ?)
            `).bind(shareId, 'test_book_1', 'test_user_1', password, now).run();
            
            const share = await db.prepare(`SELECT * FROM shares WHERE share_id = ?`).bind(shareId).first();
            const inputPassword = '1234';
            
            const isPasswordCorrect = inputPassword === share.password;
            
            expect(isPasswordCorrect).toBe(true);
        });
    });
    
    describe('TC_SHARE_009: Access Private Share Failed - Wrong Password', () => {
        test('should fail with wrong password', async () => {
            const shareId = generateId('share');
            const now = Date.now();
            const password = '1234';
            
            await db.prepare(`
                INSERT INTO shares (share_id, book_id, user_id, share_type, password, is_active, view_count, created_at)
                VALUES (?, ?, ?, 'private', ?, 1, 0, ?)
            `).bind(shareId, 'test_book_1', 'test_user_1', password, now).run();
            
            const share = await db.prepare(`SELECT * FROM shares WHERE share_id = ?`).bind(shareId).first();
            const inputPassword = '5678';
            
            const isPasswordCorrect = inputPassword === share.password;
            
            expect(isPasswordCorrect).toBe(false);
        });
    });
    
    describe('TC_SHARE_010: Access Share Failed - Not Exist', () => {
        test('should return null for non-existent share', async () => {
            const share = await db.prepare(`SELECT * FROM shares WHERE share_id = ?`).bind('nonexistent').first();
            
            expect(share).toBeNull();
        });
    });
    
    describe('TC_SHARE_011: Access Share Failed - Inactive', () => {
        test('should fail for inactive share', async () => {
            const shareId = generateId('share');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO shares (share_id, book_id, user_id, share_type, is_active, view_count, created_at)
                VALUES (?, ?, ?, 'public', 0, 0, ?)
            `).bind(shareId, 'test_book_1', 'test_user_1', now).run();
            
            const share = await db.prepare(`SELECT * FROM shares WHERE share_id = ? AND is_active = 1`).bind(shareId).first();
            
            expect(share).toBeNull();
        });
    });
    
    describe('TC_SHARE_012: Cancel Share Success', () => {
        test('should cancel share successfully', async () => {
            const shareId = generateId('share');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO shares (share_id, book_id, user_id, share_type, is_active, view_count, created_at)
                VALUES (?, ?, ?, 'public', 1, 0, ?)
            `).bind(shareId, 'test_book_1', 'test_user_1', now).run();
            
            await db.prepare(`UPDATE shares SET is_active = 0 WHERE share_id = ?`).bind(shareId).run();
            
            const share = await db.prepare(`SELECT * FROM shares WHERE share_id = ?`).bind(shareId).first();
            
            expect(share.is_active).toBe(0);
        });
    });
    
    describe('TC_SHARE_015: Get Share List', () => {
        test('should return shares for user', async () => {
            const shareId = generateId('share');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO shares (share_id, book_id, user_id, share_type, is_active, view_count, created_at)
                VALUES (?, ?, ?, 'public', 1, 0, ?)
            `).bind(shareId, 'test_book_1', 'test_user_1', now).run();
            
            const sql = `
                SELECT s.*, b.title as book_title
                FROM shares s
                JOIN books b ON s.book_id = b.book_id
                WHERE s.user_id = ?
                ORDER BY s.created_at DESC
            `;
            const result = await db.prepare(sql).bind('test_user_1').all();
            
            expect(result.results.length).toBeGreaterThan(0);
        });
    });
    
    describe('TC_SHARE_EDGE_001: Password Length Boundary', () => {
        test('should accept 4 digit password', () => {
            const password = '1234';
            const passwordRegex = /^\d{4,6}$/;
            expect(passwordRegex.test(password)).toBe(true);
        });
        
        test('should accept 6 digit password', () => {
            const password = '123456';
            const passwordRegex = /^\d{4,6}$/;
            expect(passwordRegex.test(password)).toBe(true);
        });
        
        test('should reject 3 digit password', () => {
            const password = '123';
            const passwordRegex = /^\d{4,6}$/;
            expect(passwordRegex.test(password)).toBe(false);
        });
        
        test('should reject 7 digit password', () => {
            const password = '1234567';
            const passwordRegex = /^\d{4,6}$/;
            expect(passwordRegex.test(password)).toBe(false);
        });
    });
    
    describe('TC_SHARE_EDGE_002: View Count Statistics', () => {
        test('should increment view count correctly', async () => {
            const shareId = generateId('share');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO shares (share_id, book_id, user_id, share_type, is_active, view_count, created_at)
                VALUES (?, ?, ?, 'public', 1, 0, ?)
            `).bind(shareId, 'test_book_1', 'test_user_1', now).run();
            
            for (let i = 0; i < 5; i++) {
                await db.prepare(`UPDATE shares SET view_count = view_count + 1 WHERE share_id = ?`).bind(shareId).run();
            }
            
            const share = await db.prepare(`SELECT * FROM shares WHERE share_id = ?`).bind(shareId).first();
            
            expect(share.view_count).toBe(5);
        });
    });
});
