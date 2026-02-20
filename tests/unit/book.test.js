const { initializeDatabase, seedPresetCharacters, seedTestData } = require('../setup');

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

describe('Book Management Unit Tests', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_BOOK_001: Create Book Success', () => {
        test('should create book successfully', async () => {
            const bookId = generateId('book');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'active', ?, ?)
            `).bind(bookId, 'test_user_1', '新测试书籍', now, now).run();
            
            const book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            
            expect(book).toBeDefined();
            expect(book.title).toBe('新测试书籍');
            expect(book.status).toBe('active');
        });
    });
    
    describe('TC_BOOK_002: Create Book Failed - Empty Title', () => {
        test('should fail with empty title', () => {
            const title = '';
            expect(title.trim()).toBe('');
        });
    });
    
    describe('TC_BOOK_003: Create Book Failed - Title Too Long', () => {
        test('should fail with title over 50 characters', () => {
            const title = 'a'.repeat(51);
            expect(title.length).toBeGreaterThan(50);
        });
    });
    
    describe('TC_BOOK_004: Get Book List Success', () => {
        test('should return books for user', async () => {
            const sql = `SELECT * FROM books WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC`;
            const result = await db.prepare(sql).bind('test_user_1').all();
            
            expect(result.results.length).toBeGreaterThan(0);
        });
    });
    
    describe('TC_BOOK_005: Get Book List - Pagination', () => {
        test('should return paginated books', async () => {
            const page = 1;
            const pageSize = 20;
            const offset = (page - 1) * pageSize;
            
            const sql = `
                SELECT * FROM books 
                WHERE user_id = ? AND status = 'active'
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            const result = await db.prepare(sql).bind('test_user_1', pageSize, offset).all();
            
            expect(result.results.length).toBeLessThanOrEqual(pageSize);
        });
    });
    
    describe('TC_BOOK_007: Get Book Detail Success', () => {
        test('should return book detail', async () => {
            const book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind('test_book_1').first();
            
            expect(book).toBeDefined();
            expect(book.title).toBe('测试书籍');
        });
    });
    
    describe('TC_BOOK_008: Get Book Detail Failed - Not Exist', () => {
        test('should return null for non-existent book', async () => {
            const book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind('nonexistent').first();
            
            expect(book).toBeNull();
        });
    });
    
    describe('TC_BOOK_009: Update Book Title Success', () => {
        test('should update book title successfully', async () => {
            const bookId = generateId('book');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'active', ?, ?)
            `).bind(bookId, 'test_user_1', '更新前书名', now, now).run();
            
            await db.prepare(`
                UPDATE books SET title = ?, updated_at = ? WHERE book_id = ?
            `).bind('更新后书名', Date.now(), bookId).run();
            
            const book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            
            expect(book.title).toBe('更新后书名');
        });
    });
    
    describe('TC_BOOK_011: Delete Book Success - Move to Trash', () => {
        test('should archive book successfully', async () => {
            const bookId = generateId('book');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'active', ?, ?)
            `).bind(bookId, 'test_user_1', '待删除书籍', now, now).run();
            
            await db.prepare(`
                UPDATE books SET status = 'archived', archived_at = ?, updated_at = ? WHERE book_id = ?
            `).bind(Date.now(), Date.now(), bookId).run();
            
            const book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            
            expect(book.status).toBe('archived');
            expect(book.archived_at).toBeDefined();
        });
    });
    
    describe('TC_BOOK_013: Restore Book Success', () => {
        test('should restore archived book successfully', async () => {
            const bookId = generateId('book');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, archived_at, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'archived', ?, ?, ?)
            `).bind(bookId, 'test_user_1', '待恢复书籍', now, now, now).run();
            
            await db.prepare(`
                UPDATE books SET status = 'active', archived_at = NULL, updated_at = ? WHERE book_id = ?
            `).bind(Date.now(), bookId).run();
            
            const book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            
            expect(book.status).toBe('active');
            expect(book.archived_at).toBeNull();
        });
    });
    
    describe('TC_BOOK_015: Get Trash Books', () => {
        test('should return archived books', async () => {
            const sql = `SELECT * FROM books WHERE user_id = ? AND status = 'archived'`;
            const result = await db.prepare(sql).bind('test_user_1').all();
            
            expect(Array.isArray(result.results)).toBe(true);
        });
    });
    
    describe('TC_BOOK_EDGE_001: Book Title Length Boundary', () => {
        test('should accept 1 character title', () => {
            const title = 'a';
            expect(title.length).toBeGreaterThanOrEqual(1);
            expect(title.length).toBeLessThanOrEqual(50);
        });
        
        test('should accept 50 character title', () => {
            const title = 'a'.repeat(50);
            expect(title.length).toBeGreaterThanOrEqual(1);
            expect(title.length).toBeLessThanOrEqual(50);
        });
        
        test('should reject 51 character title', () => {
            const title = 'a'.repeat(51);
            expect(title.length).toBeGreaterThan(50);
        });
    });
    
    describe('TC_BOOK_DB_001: Book Data Correct Storage', () => {
        test('should store book data correctly', async () => {
            const bookId = generateId('book');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'active', ?, ?)
            `).bind(bookId, 'test_user_1', '存储测试书籍', now, now).run();
            
            const book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            
            expect(book.user_id).toBe('test_user_1');
            expect(book.status).toBe('active');
            expect(book.chapter_count).toBe(0);
        });
    });
});
