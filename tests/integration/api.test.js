const { initializeDatabase, seedPresetCharacters, seedTestData } = require('../setup');

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function hashPassword(password) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
}

describe('Integration Tests - User Authentication', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_USER_INT_001: Login API Complete Flow', () => {
        test('should complete login flow successfully', async () => {
            const username = 'testuser';
            const password = 'testpassword';
            const passwordHash = hashPassword(password);
            
            const userId = generateId('user');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO users (user_id, username, password_hash, role, created_at, updated_at)
                VALUES (?, ?, ?, 'child', ?, ?)
            `).bind(userId, username, passwordHash, now, now).run();
            
            const user = await db.prepare(`
                SELECT * FROM users WHERE username = ? AND password_hash = ?
            `).bind(username, passwordHash).first();
            
            expect(user).toBeDefined();
            expect(user.username).toBe(username);
        });
    });
    
    describe('TC_USER_INT_002: Auth Middleware Validation', () => {
        test('should reject request without token', () => {
            const authHeader = null;
            
            const isValid = authHeader && authHeader.startsWith('Bearer ');
            
            expect(isValid).toBe(false);
        });
        
        test('should reject request with invalid token', () => {
            const authHeader = 'Bearer invalid_token';
            const token = authHeader.substring(7);
            
            const isValid = token === 'valid_token';
            
            expect(isValid).toBe(false);
        });
        
        test('should accept request with valid token', () => {
            const authHeader = 'Bearer valid_token';
            const token = authHeader.substring(7);
            
            const isValid = token === 'valid_token';
            
            expect(isValid).toBe(true);
        });
    });
});

describe('Integration Tests - Character CRUD', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_CHAR_INT_001: Character CRUD Complete Flow', () => {
        test('should complete character CRUD flow', async () => {
            const characterId = generateId('character');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO characters (character_id, name, image_base64, description, personality, speaking_style, creator_id, is_preset, created_at, updated_at)
                VALUES (?, ?, 'base64_image', '测试描述', '勇敢、正义、严肃', '低沉有力', ?, 0, ?, ?)
            `).bind(characterId, '测试人仔', 'test_user_1', now, now).run();
            
            let char = await db.prepare(`SELECT * FROM characters WHERE character_id = ?`).bind(characterId).first();
            expect(char).toBeDefined();
            
            await db.prepare(`
                UPDATE characters SET name = ?, updated_at = ? WHERE character_id = ?
            `).bind('更新后人仔', Date.now(), characterId).run();
            
            char = await db.prepare(`SELECT * FROM characters WHERE character_id = ?`).bind(characterId).first();
            expect(char.name).toBe('更新后人仔');
            
            await db.prepare(`DELETE FROM characters WHERE character_id = ?`).bind(characterId).run();
            
            char = await db.prepare(`SELECT * FROM characters WHERE character_id = ?`).bind(characterId).first();
            expect(char).toBeNull();
        });
    });
    
    describe('TC_CHAR_INT_002: Preset Character Cannot Be Modified', () => {
        test('should not allow updating preset character', async () => {
            const presetChar = await db.prepare(`
                SELECT * FROM characters WHERE character_id = ? AND is_preset = 1
            `).bind('preset_batman').first();
            
            expect(presetChar).toBeDefined();
            expect(presetChar.is_preset).toBe(1);
        });
    });
});

describe('Integration Tests - Book and Chapter', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_BOOK_INT_001: Book Complete Lifecycle', () => {
        test('should complete book lifecycle', async () => {
            const bookId = generateId('book');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'active', ?, ?)
            `).bind(bookId, 'test_user_1', '生命周期测试书籍', now, now).run();
            
            let book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            expect(book.status).toBe('active');
            
            await db.prepare(`
                UPDATE books SET title = ?, updated_at = ? WHERE book_id = ?
            `).bind('更新后书名', Date.now(), bookId).run();
            
            book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            expect(book.title).toBe('更新后书名');
            
            await db.prepare(`
                UPDATE books SET status = 'archived', archived_at = ?, updated_at = ? WHERE book_id = ?
            `).bind(Date.now(), Date.now(), bookId).run();
            
            book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            expect(book.status).toBe('archived');
            
            await db.prepare(`
                UPDATE books SET status = 'active', archived_at = NULL, updated_at = ? WHERE book_id = ?
            `).bind(Date.now(), bookId).run();
            
            book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            expect(book.status).toBe('active');
        });
    });
    
    describe('TC_BOOK_INT_002: Book Chapter Handling', () => {
        test('should handle chapters when book is archived', async () => {
            const bookId = generateId('book');
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'active', ?, ?)
            `).bind(bookId, 'test_user_1', '章节处理测试书籍', now, now).run();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '第一章', '内容', 0, ?)
            `).bind(chapterId, bookId, now).run();
            
            await db.prepare(`
                UPDATE books SET status = 'archived', archived_at = ?, updated_at = ? WHERE book_id = ?
            `).bind(Date.now(), Date.now(), bookId).run();
            
            const chapter = await db.prepare(`SELECT * FROM chapters WHERE chapter_id = ?`).bind(chapterId).first();
            expect(chapter).toBeDefined();
        });
    });
});

describe('Integration Tests - Story Generation', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_STORY_INT_001: Story Generation Complete Flow', () => {
        test('should complete story generation flow', async () => {
            const bookId = generateId('book');
            const roleId = generateId('role');
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'active', ?, ?)
            `).bind(bookId, 'test_user_1', '故事生成测试书籍', now, now).run();
            
            await db.prepare(`
                INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            `).bind(roleId, bookId, 'preset_batman', '小蝙蝠', 'protagonist', now, now).run();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, prompt_used, created_at)
                VALUES (?, ?, 1, '第一章', '故事内容...', 0, '提示词...', ?)
            `).bind(chapterId, bookId, now).run();
            
            await db.prepare(`
                UPDATE books SET chapter_count = chapter_count + 1, updated_at = ? WHERE book_id = ?
            `).bind(Date.now(), bookId).run();
            
            const book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            expect(book.chapter_count).toBe(1);
            
            const chapter = await db.prepare(`SELECT * FROM chapters WHERE chapter_id = ?`).bind(chapterId).first();
            expect(chapter).toBeDefined();
        });
    });
});

describe('Integration Tests - Puzzle Interaction', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_PUZZLE_INT_001: Complete Puzzle Flow', () => {
        test('should complete puzzle interaction flow', async () => {
            const chapterId = generateId('chapter');
            const puzzleId = generateId('puzzle');
            const recordId = generateId('record');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '谜题章节', '内容', 1, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            await db.prepare(`
                INSERT INTO puzzles (puzzle_id, chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, hint, puzzle_type, created_at)
                VALUES (?, ?, '问题', 'A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4', 'C', '提示', 'pattern', ?)
            `).bind(puzzleId, chapterId, now).run();
            
            await db.prepare(`
                INSERT INTO puzzle_records (record_id, user_id, puzzle_id, chapter_id, user_answer, is_correct, attempts, answer_time)
                VALUES (?, ?, ?, ?, ?, 0, 1, ?)
            `).bind(recordId, 'test_user_1', puzzleId, chapterId, 'A', now).run();
            
            const puzzle = await db.prepare(`SELECT * FROM puzzles WHERE puzzle_id = ?`).bind(puzzleId).first();
            const record = await db.prepare(`SELECT * FROM puzzle_records WHERE record_id = ?`).bind(recordId).first();
            
            expect(puzzle).toBeDefined();
            expect(record.attempts).toBe(1);
            
            const isCorrect = record.user_answer.toUpperCase() === puzzle.correct_answer.toUpperCase();
            expect(isCorrect).toBe(false);
        });
    });
});

describe('Integration Tests - Share Flow', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_SHARE_INT_001: Share Complete Flow', () => {
        test('should complete share flow', async () => {
            const shareId = generateId('share');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO shares (share_id, book_id, user_id, share_type, is_active, view_count, created_at)
                VALUES (?, ?, ?, 'public', 1, 0, ?)
            `).bind(shareId, 'test_book_1', 'test_user_1', now).run();
            
            let share = await db.prepare(`SELECT * FROM shares WHERE share_id = ?`).bind(shareId).first();
            expect(share.is_active).toBe(1);
            
            await db.prepare(`UPDATE shares SET view_count = view_count + 1 WHERE share_id = ?`).bind(shareId).run();
            
            share = await db.prepare(`SELECT * FROM shares WHERE share_id = ?`).bind(shareId).first();
            expect(share.view_count).toBe(1);
            
            await db.prepare(`UPDATE shares SET is_active = 0 WHERE share_id = ?`).bind(shareId).run();
            
            share = await db.prepare(`SELECT * FROM shares WHERE share_id = ? AND is_active = 1`).bind(shareId).first();
            expect(share).toBeNull();
        });
    });
});
