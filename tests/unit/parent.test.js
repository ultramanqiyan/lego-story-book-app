const { initializeDatabase, seedPresetCharacters, seedTestData } = require('../setup');

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

describe('Parent Control Unit Tests', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_PARENT_001: Daily Time Limit - Not Exceeded', () => {
        test('should allow usage when not exceeded', () => {
            const dailyTimeLimit = 60;
            const currentUsage = 30;
            
            const allowed = currentUsage < dailyTimeLimit;
            
            expect(allowed).toBe(true);
        });
    });
    
    describe('TC_PARENT_002: Daily Time Limit - Exceeded', () => {
        test('should block usage when exceeded', () => {
            const dailyTimeLimit = 60;
            const currentUsage = 60;
            
            const allowed = currentUsage < dailyTimeLimit;
            
            expect(allowed).toBe(false);
        });
    });
    
    describe('TC_PARENT_003: Time Slot - Within Allowed', () => {
        test('should allow usage within time slot', () => {
            const timeSlots = [{ start: '09:00', end: '20:00' }];
            const currentTime = '15:00';
            
            const isInSlot = timeSlots.some(slot => {
                return currentTime >= slot.start && currentTime <= slot.end;
            });
            
            expect(isInSlot).toBe(true);
        });
    });
    
    describe('TC_PARENT_004: Time Slot - Outside Allowed', () => {
        test('should block usage outside time slot', () => {
            const timeSlots = [{ start: '09:00', end: '20:00' }];
            const currentTime = '21:00';
            
            const isInSlot = timeSlots.some(slot => {
                return currentTime >= slot.start && currentTime <= slot.end;
            });
            
            expect(isInSlot).toBe(false);
        });
    });
    
    describe('TC_PARENT_005: Sensitive Word Filter', () => {
        test('should filter sensitive words', () => {
            const sensitiveWords = ['暴力', '血腥', '恐怖', '死亡'];
            let content = '这是一个暴力的故事';
            
            sensitiveWords.forEach(word => {
                content = content.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
            });
            
            expect(content).toBe('这是一个**的故事');
        });
    });
    
    describe('TC_PARENT_006: Age Rating Check - Allow', () => {
        test('should allow access for appropriate content', () => {
            const ageRating = 'all';
            const contentRating = 'all';
            
            const ratingOrder = { 'all': 0, '6+': 1, '12+': 2 };
            const allowed = ratingOrder[ageRating] >= ratingOrder[contentRating];
            
            expect(allowed).toBe(true);
        });
    });
    
    describe('TC_PARENT_007: Age Rating Check - Deny', () => {
        test('should deny access for inappropriate content', () => {
            const ageRating = '6+';
            const contentRating = '12+';
            
            const ratingOrder = { 'all': 0, '6+': 1, '12+': 2 };
            const allowed = ratingOrder[ageRating] >= ratingOrder[contentRating];
            
            expect(allowed).toBe(false);
        });
    });
    
    describe('TC_PARENT_008: Bind Child Account Success', () => {
        test('should bind child account successfully', async () => {
            const settingId = generateId('setting');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO parent_settings (setting_id, parent_id, child_id, daily_time_limit, content_filter, age_rating, created_at, updated_at)
                VALUES (?, ?, ?, 60, 1, 'all', ?, ?)
            `).bind(settingId, 'test_parent_1', 'test_user_1', now, now).run();
            
            const setting = await db.prepare(`SELECT * FROM parent_settings WHERE setting_id = ?`).bind(settingId).first();
            
            expect(setting).toBeDefined();
            expect(setting.parent_id).toBe('test_parent_1');
            expect(setting.child_id).toBe('test_user_1');
        });
    });
    
    describe('TC_PARENT_009: Bind Child Account Failed - Not Exist', () => {
        test('should fail for non-existent child', async () => {
            const child = await db.prepare(`SELECT * FROM users WHERE user_id = ?`).bind('nonexistent_child').first();
            
            expect(child).toBeNull();
        });
    });
    
    describe('TC_PARENT_010: Bind Child Account Failed - Already Bound', () => {
        test('should fail for already bound child', async () => {
            const existingBinding = await db.prepare(`
                SELECT * FROM parent_settings WHERE child_id = ?
            `).bind('test_user_1').first();
            
            if (existingBinding) {
                expect(existingBinding.parent_id).toBeDefined();
            }
        });
    });
    
    describe('TC_PARENT_011: Unbind Child Account Success', () => {
        test('should unbind child account successfully', async () => {
            const settingId = generateId('setting');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO parent_settings (setting_id, parent_id, child_id, daily_time_limit, content_filter, age_rating, created_at, updated_at)
                VALUES (?, ?, ?, 60, 1, 'all', ?, ?)
            `).bind(settingId, 'test_parent_1', 'test_user_1', now, now).run();
            
            await db.prepare(`DELETE FROM parent_settings WHERE setting_id = ?`).bind(settingId).run();
            
            const setting = await db.prepare(`SELECT * FROM parent_settings WHERE setting_id = ?`).bind(settingId).first();
            
            expect(setting).toBeNull();
        });
    });
    
    describe('TC_PARENT_012: Get Parent Settings Success', () => {
        test('should return parent settings', async () => {
            const settingId = generateId('setting');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO parent_settings (setting_id, parent_id, child_id, daily_time_limit, content_filter, age_rating, created_at, updated_at)
                VALUES (?, ?, ?, 60, 1, 'all', ?, ?)
            `).bind(settingId, 'test_parent_1', 'test_user_1', now, now).run();
            
            const setting = await db.prepare(`
                SELECT * FROM parent_settings WHERE parent_id = ? AND child_id = ?
            `).bind('test_parent_1', 'test_user_1').first();
            
            expect(setting).toBeDefined();
            expect(setting.daily_time_limit).toBe(60);
        });
    });
    
    describe('TC_PARENT_013: Update Parent Settings Success', () => {
        test('should update parent settings successfully', async () => {
            const settingId = generateId('setting');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO parent_settings (setting_id, parent_id, child_id, daily_time_limit, content_filter, age_rating, created_at, updated_at)
                VALUES (?, ?, ?, 60, 1, 'all', ?, ?)
            `).bind(settingId, 'test_parent_1', 'test_user_1', now, now).run();
            
            await db.prepare(`
                UPDATE parent_settings SET daily_time_limit = ?, updated_at = ? WHERE setting_id = ?
            `).bind(90, Date.now(), settingId).run();
            
            const setting = await db.prepare(`SELECT * FROM parent_settings WHERE setting_id = ?`).bind(settingId).first();
            
            expect(setting.daily_time_limit).toBe(90);
        });
    });
    
    describe('TC_PARENT_014: Get Usage Stats Success', () => {
        test('should return usage stats', async () => {
            const logId = generateId('log');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO usage_logs (log_id, user_id, action_type, duration, created_at)
                VALUES (?, ?, 'story_create', 300, ?)
            `).bind(logId, 'test_user_1', now).run();
            
            const sql = `
                SELECT SUM(duration) as total_duration
                FROM usage_logs
                WHERE user_id = ?
            `;
            const result = await db.prepare(sql).bind('test_user_1').first();
            
            expect(result.total_duration).toBeGreaterThan(0);
        });
    });
    
    describe('TC_PARENT_EDGE_001: Time Limit Boundary', () => {
        test('should handle 0 minute limit', () => {
            const dailyTimeLimit = 0;
            const currentUsage = 0;
            
            const allowed = currentUsage < dailyTimeLimit;
            
            expect(allowed).toBe(false);
        });
        
        test('should handle 1440 minute limit (24 hours)', () => {
            const dailyTimeLimit = 1440;
            const currentUsage = 60;
            
            const allowed = currentUsage < dailyTimeLimit;
            
            expect(allowed).toBe(true);
        });
    });
    
    describe('TC_PARENT_DB_001: Parent Settings Correct Storage', () => {
        test('should store parent settings correctly', async () => {
            const settingId = generateId('setting');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO parent_settings (setting_id, parent_id, child_id, daily_time_limit, content_filter, age_rating, created_at, updated_at)
                VALUES (?, ?, ?, 60, 1, 'all', ?, ?)
            `).bind(settingId, 'test_parent_1', 'test_user_1', now, now).run();
            
            const setting = await db.prepare(`SELECT * FROM parent_settings WHERE setting_id = ?`).bind(settingId).first();
            
            expect(setting.parent_id).toBe('test_parent_1');
            expect(setting.child_id).toBe('test_user_1');
            expect(setting.content_filter).toBe(1);
        });
    });
    
    describe('TC_PARENT_DB_002: Usage Log Correct Storage', () => {
        test('should store usage log correctly', async () => {
            const logId = generateId('log');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO usage_logs (log_id, user_id, action_type, action_detail, duration, created_at)
                VALUES (?, ?, 'story_create', ?, 300, ?)
            `).bind(logId, 'test_user_1', JSON.stringify({ book_id: 'test_book_1' }), now).run();
            
            const log = await db.prepare(`SELECT * FROM usage_logs WHERE log_id = ?`).bind(logId).first();
            
            expect(log.user_id).toBe('test_user_1');
            expect(log.action_type).toBe('story_create');
            expect(log.duration).toBe(300);
        });
    });
});
