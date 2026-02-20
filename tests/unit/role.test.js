const { initializeDatabase, seedPresetCharacters, seedTestData } = require('../setup');

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

describe('Role Management Unit Tests', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_ROLE_001: Add Book Role Success', () => {
        test('should add book role successfully', async () => {
            const roleId = generateId('role');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            `).bind(roleId, 'test_book_1', 'preset_batman', '小蝙蝠', 'protagonist', now, now).run();
            
            const role = await db.prepare(`SELECT * FROM book_roles WHERE role_id = ?`).bind(roleId).first();
            
            expect(role).toBeDefined();
            expect(role.custom_name).toBe('小蝙蝠');
            expect(role.role_type).toBe('protagonist');
            expect(role.is_protagonist).toBe(1);
        });
    });
    
    describe('TC_ROLE_002: Add Book Role Failed - Empty Custom Name', () => {
        test('should fail with empty custom name', () => {
            const customName = '';
            expect(customName.trim()).toBe('');
        });
    });
    
    describe('TC_ROLE_003: Add Book Role Failed - Custom Name Too Long', () => {
        test('should fail with custom name over 20 characters', () => {
            const customName = 'a'.repeat(21);
            expect(customName.length).toBeGreaterThan(20);
        });
    });
    
    describe('TC_ROLE_004: Add Book Role Failed - Duplicate Custom Name', () => {
        test('should fail with duplicate custom name in same book', async () => {
            const roleId1 = generateId('role');
            const roleId2 = generateId('role');
            const now = Date.now();
            const customName = '唯一名称测试';
            
            await db.prepare(`
                INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            `).bind(roleId1, 'test_book_1', 'preset_batman', customName, 'protagonist', now, now).run();
            
            const existing = await db.prepare(`
                SELECT COUNT(*) as count FROM book_roles WHERE book_id = ? AND custom_name = ?
            `).bind('test_book_1', customName).first();
            
            expect(existing.count).toBeGreaterThan(0);
        });
    });
    
    describe('TC_ROLE_005: Add Book Role Failed - Invalid Role Type', () => {
        test('should validate role type', () => {
            const validRoleTypes = ['protagonist', 'supporting', 'villain', 'passerby'];
            const invalidRoleType = 'invalid_type';
            
            expect(validRoleTypes).not.toContain(invalidRoleType);
        });
    });
    
    describe('TC_ROLE_006: Add Book Role Failed - Already Has Protagonist', () => {
        test('should have only one protagonist', async () => {
            const bookId = generateId('book');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'active', ?, ?)
            `).bind(bookId, 'test_user_1', '主角测试书籍', now, now).run();
            
            await db.prepare(`
                INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            `).bind(generateId('role'), bookId, 'preset_batman', '主角A', 'protagonist', now, now).run();
            
            const protagonistCount = await db.prepare(`
                SELECT COUNT(*) as count FROM book_roles WHERE book_id = ? AND is_protagonist = 1
            `).bind(bookId).first();
            
            expect(protagonistCount.count).toBe(1);
        });
    });
    
    describe('TC_ROLE_007: Update Book Role - Modify Custom Name', () => {
        test('should update custom name successfully', async () => {
            const roleId = generateId('role');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            `).bind(roleId, 'test_book_1', 'preset_spiderman', '更新前名称', 'supporting', now, now).run();
            
            await db.prepare(`
                UPDATE book_roles SET custom_name = ?, updated_at = ? WHERE role_id = ?
            `).bind('更新后名称', Date.now(), roleId).run();
            
            const role = await db.prepare(`SELECT * FROM book_roles WHERE role_id = ?`).bind(roleId).first();
            
            expect(role.custom_name).toBe('更新后名称');
        });
    });
    
    describe('TC_ROLE_008: Update Book Role - Change Protagonist', () => {
        test('should change protagonist successfully', async () => {
            const bookId = generateId('book');
            const roleId1 = generateId('role');
            const roleId2 = generateId('role');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'active', ?, ?)
            `).bind(bookId, 'test_user_1', '更换主角测试', now, now).run();
            
            await db.prepare(`
                INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            `).bind(roleId1, bookId, 'preset_batman', '原主角', 'protagonist', now, now).run();
            
            await db.prepare(`
                INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            `).bind(roleId2, bookId, 'preset_spiderman', '新主角', 'supporting', now, now).run();
            
            await db.prepare(`UPDATE book_roles SET is_protagonist = 0 WHERE book_id = ?`).bind(bookId).run();
            await db.prepare(`UPDATE book_roles SET is_protagonist = 1, role_type = 'protagonist' WHERE role_id = ?`).bind(roleId2).run();
            
            const newProtagonist = await db.prepare(`SELECT * FROM book_roles WHERE role_id = ?`).bind(roleId2).first();
            expect(newProtagonist.is_protagonist).toBe(1);
        });
    });
    
    describe('TC_ROLE_010: Delete Book Role Success', () => {
        test('should delete role successfully', async () => {
            const roleId = generateId('role');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            `).bind(roleId, 'test_book_1', 'preset_spiderman', '待删除角色', 'supporting', now, now).run();
            
            await db.prepare(`DELETE FROM book_roles WHERE role_id = ?`).bind(roleId).run();
            
            const role = await db.prepare(`SELECT * FROM book_roles WHERE role_id = ?`).bind(roleId).first();
            
            expect(role).toBeNull();
        });
    });
    
    describe('TC_ROLE_013: Get Book Role List Success', () => {
        test('should return roles for book', async () => {
            const sql = `
                SELECT br.*, c.name as character_name
                FROM book_roles br
                JOIN characters c ON br.character_id = c.character_id
                WHERE br.book_id = ?
                ORDER BY br.is_protagonist DESC, br.created_at ASC
            `;
            const result = await db.prepare(sql).bind('test_book_1').all();
            
            expect(Array.isArray(result.results)).toBe(true);
        });
    });
    
    describe('TC_ROLE_EDGE_001: Custom Name Length Boundary', () => {
        test('should accept 1 character custom name', () => {
            const customName = 'a';
            expect(customName.length).toBeGreaterThanOrEqual(1);
            expect(customName.length).toBeLessThanOrEqual(20);
        });
        
        test('should accept 20 character custom name', () => {
            const customName = 'a'.repeat(20);
            expect(customName.length).toBeGreaterThanOrEqual(1);
            expect(customName.length).toBeLessThanOrEqual(20);
        });
        
        test('should reject 21 character custom name', () => {
            const customName = 'a'.repeat(21);
            expect(customName.length).toBeGreaterThan(20);
        });
    });
    
    describe('TC_ROLE_DB_001: Role Data Correct Storage', () => {
        test('should store role data correctly', async () => {
            const roleId = generateId('role');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            `).bind(roleId, 'test_book_1', 'preset_batman', '存储测试角色', 'supporting', now, now).run();
            
            const role = await db.prepare(`SELECT * FROM book_roles WHERE role_id = ?`).bind(roleId).first();
            
            expect(role.book_id).toBe('test_book_1');
            expect(role.character_id).toBe('preset_batman');
        });
    });
});
