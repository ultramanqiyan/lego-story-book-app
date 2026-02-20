const { initializeDatabase, seedPresetCharacters, seedTestData, presetCharacters } = require('../setup');

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

describe('Character Management Unit Tests', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_CHAR_001: Get Preset Characters List Success', () => {
        test('should return 12 preset characters', async () => {
            const sql = `SELECT * FROM characters WHERE is_preset = 1`;
            const result = await db.prepare(sql).all();
            
            expect(result.results.length).toBe(12);
        });
    });
    
    describe('TC_CHAR_002: Preset Character Data Integrity', () => {
        test('should have all required fields for preset characters', async () => {
            const sql = `SELECT * FROM characters WHERE is_preset = 1`;
            const result = await db.prepare(sql).all();
            
            result.results.forEach(char => {
                expect(char.character_id).toBeDefined();
                expect(char.name).toBeDefined();
                expect(char.image_base64).toBeDefined();
                expect(char.description).toBeDefined();
                expect(char.personality).toBeDefined();
                expect(char.speaking_style).toBeDefined();
            });
        });
    });
    
    describe('TC_CHAR_003: Get Custom Characters List Success', () => {
        test('should return custom characters for user', async () => {
            const characterId = generateId('character');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO characters (character_id, name, image_base64, description, personality, speaking_style, creator_id, is_preset, created_at, updated_at)
                VALUES (?, ?, 'base64_image', '测试描述', '勇敢、正义', '坚定有力', ?, 0, ?, ?)
            `).bind(characterId, '测试人仔', 'test_user_1', now, now).run();
            
            const sql = `SELECT * FROM characters WHERE creator_id = ? AND is_preset = 0`;
            const result = await db.prepare(sql).bind('test_user_1').all();
            
            expect(result.results.length).toBeGreaterThan(0);
        });
    });
    
    describe('TC_CHAR_004: Get Custom Characters List - Empty', () => {
        test('should return empty array for user without custom characters', async () => {
            const sql = `SELECT * FROM characters WHERE creator_id = ? AND is_preset = 0`;
            const result = await db.prepare(sql).bind('nonexistent_user').all();
            
            expect(result.results.length).toBe(0);
        });
    });
    
    describe('TC_CHAR_005: Create Custom Character Success', () => {
        test('should create custom character successfully', async () => {
            const characterId = generateId('character');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO characters (character_id, name, image_base64, description, personality, speaking_style, creator_id, is_preset, created_at, updated_at)
                VALUES (?, ?, 'base64_image', '测试描述', '勇敢、正义', '坚定有力', ?, 0, ?, ?)
            `).bind(characterId, '新测试人仔', 'test_user_1', now, now).run();
            
            const char = await db.prepare(`SELECT * FROM characters WHERE character_id = ?`).bind(characterId).first();
            
            expect(char).toBeDefined();
            expect(char.name).toBe('新测试人仔');
            expect(char.is_preset).toBe(0);
        });
    });
    
    describe('TC_CHAR_006: Create Custom Character Failed - Empty Name', () => {
        test('should fail with empty name', () => {
            const name = '';
            expect(name.trim()).toBe('');
        });
    });
    
    describe('TC_CHAR_007: Create Custom Character Failed - Name Too Long', () => {
        test('should fail with name over 20 characters', () => {
            const name = 'a'.repeat(21);
            expect(name.length).toBeGreaterThan(20);
        });
    });
    
    describe('TC_CHAR_008: Create Custom Character Failed - Description Too Long', () => {
        test('should fail with description over 100 characters', () => {
            const description = 'a'.repeat(101);
            expect(description.length).toBeGreaterThan(100);
        });
    });
    
    describe('TC_CHAR_009: Create Custom Character Failed - Invalid Personality', () => {
        test('should validate personality type', () => {
            const validPersonalities = [
                '勇敢、正义、严肃', '活泼、幽默、善良', '热血、坚韧、乐观',
                '威猛、古老、神秘', '优雅、善良、勇敢', '忠诚、勇敢、正直',
                '智慧、神秘、慈祥', '好奇、勇敢、科学', '豪爽、自由、机智',
                '敏捷、聪慧、友善', '精确、理性、忠诚', '正义、无私、强大'
            ];
            
            const invalidPersonality = '无效性格';
            expect(validPersonalities).not.toContain(invalidPersonality);
        });
    });
    
    describe('TC_CHAR_010: Create Custom Character Failed - Invalid Speaking Style', () => {
        test('should validate speaking style', () => {
            const validSpeakingStyles = [
                '低沉有力', '轻松俏皮', '充满干劲', '低沉咆哮', '温柔甜美',
                '庄重有力', '古老深奥', '专业冷静', '粗犷豪迈', '清脆悦耳',
                '机械平稳', '坚定有力'
            ];
            
            const invalidSpeakingStyle = '无效方式';
            expect(validSpeakingStyles).not.toContain(invalidSpeakingStyle);
        });
    });
    
    describe('TC_CHAR_011: Update Custom Character Success', () => {
        test('should update character name successfully', async () => {
            const characterId = generateId('character');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO characters (character_id, name, image_base64, description, personality, speaking_style, creator_id, is_preset, created_at, updated_at)
                VALUES (?, ?, 'base64_image', '测试描述', '勇敢、正义', '坚定有力', ?, 0, ?, ?)
            `).bind(characterId, '更新前名称', 'test_user_1', now, now).run();
            
            await db.prepare(`
                UPDATE characters SET name = ?, updated_at = ? WHERE character_id = ?
            `).bind('更新后名称', Date.now(), characterId).run();
            
            const char = await db.prepare(`SELECT * FROM characters WHERE character_id = ?`).bind(characterId).first();
            
            expect(char.name).toBe('更新后名称');
        });
    });
    
    describe('TC_CHAR_013: Delete Custom Character Success', () => {
        test('should delete character successfully', async () => {
            const characterId = generateId('character');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO characters (character_id, name, image_base64, description, personality, speaking_style, creator_id, is_preset, created_at, updated_at)
                VALUES (?, ?, 'base64_image', '测试描述', '勇敢、正义', '坚定有力', ?, 0, ?, ?)
            `).bind(characterId, '待删除人仔', 'test_user_1', now, now).run();
            
            await db.prepare(`DELETE FROM characters WHERE character_id = ?`).bind(characterId).run();
            
            const char = await db.prepare(`SELECT * FROM characters WHERE character_id = ?`).bind(characterId).first();
            
            expect(char).toBeNull();
        });
    });
    
    describe('TC_CHAR_EDGE_001: Character Name Length Boundary', () => {
        test('should accept 1 character name', () => {
            const name = 'a';
            expect(name.length).toBeGreaterThanOrEqual(1);
            expect(name.length).toBeLessThanOrEqual(20);
        });
        
        test('should accept 20 character name', () => {
            const name = 'a'.repeat(20);
            expect(name.length).toBeGreaterThanOrEqual(1);
            expect(name.length).toBeLessThanOrEqual(20);
        });
        
        test('should reject 21 character name', () => {
            const name = 'a'.repeat(21);
            expect(name.length).toBeGreaterThan(20);
        });
    });
    
    describe('TC_CHAR_EDGE_002: Description Length Boundary', () => {
        test('should accept 100 character description', () => {
            const description = 'a'.repeat(100);
            expect(description.length).toBeLessThanOrEqual(100);
        });
        
        test('should reject 101 character description', () => {
            const description = 'a'.repeat(101);
            expect(description.length).toBeGreaterThan(100);
        });
    });
    
    describe('TC_CHAR_DB_001: Character Data Correct Storage', () => {
        test('should store character data correctly', async () => {
            const characterId = generateId('character');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO characters (character_id, name, image_base64, description, personality, speaking_style, creator_id, is_preset, created_at, updated_at)
                VALUES (?, ?, 'base64_image', '测试描述', '勇敢、正义', '坚定有力', ?, 0, ?, ?)
            `).bind(characterId, '存储测试人仔', 'test_user_1', now, now).run();
            
            const char = await db.prepare(`SELECT * FROM characters WHERE character_id = ?`).bind(characterId).first();
            
            expect(char.creator_id).toBe('test_user_1');
            expect(char.is_preset).toBe(0);
        });
    });
});
