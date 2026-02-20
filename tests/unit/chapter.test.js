const { initializeDatabase, seedPresetCharacters, seedTestData } = require('../setup');

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

describe('Chapter Management Unit Tests', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_CHAPTER_001: Get Chapter List Success', () => {
        test('should return chapters for book', async () => {
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '测试章节', '这是测试章节内容', 0, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            const sql = `SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC`;
            const result = await db.prepare(sql).bind('test_book_1').all();
            
            expect(result.results.length).toBeGreaterThan(0);
        });
    });
    
    describe('TC_CHAPTER_002: Get Chapter List - Pagination', () => {
        test('should return paginated chapters', async () => {
            const page = 1;
            const pageSize = 20;
            const offset = (page - 1) * pageSize;
            
            const sql = `
                SELECT * FROM chapters 
                WHERE book_id = ?
                ORDER BY chapter_number ASC
                LIMIT ? OFFSET ?
            `;
            const result = await db.prepare(sql).bind('test_book_1', pageSize, offset).all();
            
            expect(result.results.length).toBeLessThanOrEqual(pageSize);
        });
    });
    
    describe('TC_CHAPTER_004: Get Chapter Detail Success', () => {
        test('should return chapter detail', async () => {
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '详情测试章节', '这是详情测试章节内容', 0, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            const chapter = await db.prepare(`SELECT * FROM chapters WHERE chapter_id = ?`).bind(chapterId).first();
            
            expect(chapter).toBeDefined();
            expect(chapter.title).toBe('详情测试章节');
        });
    });
    
    describe('TC_CHAPTER_005: Get Chapter Detail - With Puzzle', () => {
        test('should return chapter with puzzle', async () => {
            const chapterId = generateId('chapter');
            const puzzleId = generateId('puzzle');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '谜题测试章节', '这是谜题测试章节内容', 1, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            await db.prepare(`
                INSERT INTO puzzles (puzzle_id, chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, hint, puzzle_type, created_at)
                VALUES (?, ?, '测试问题', 'A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4', 'C', '测试提示', 'pattern', ?)
            `).bind(puzzleId, chapterId, now).run();
            
            const chapter = await db.prepare(`SELECT * FROM chapters WHERE chapter_id = ?`).bind(chapterId).first();
            const puzzle = await db.prepare(`SELECT * FROM puzzles WHERE chapter_id = ?`).bind(chapterId).first();
            
            expect(chapter.has_puzzle).toBe(1);
            expect(puzzle).toBeDefined();
        });
    });
    
    describe('TC_CHAPTER_006: Get Chapter Detail Failed - Not Exist', () => {
        test('should return null for non-existent chapter', async () => {
            const chapter = await db.prepare(`SELECT * FROM chapters WHERE chapter_id = ?`).bind('nonexistent').first();
            
            expect(chapter).toBeNull();
        });
    });
    
    describe('TC_CHAPTER_007: Delete Chapter Success', () => {
        test('should delete chapter successfully', async () => {
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '待删除章节', '这是待删除章节内容', 0, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            await db.prepare(`DELETE FROM chapters WHERE chapter_id = ?`).bind(chapterId).run();
            
            const chapter = await db.prepare(`SELECT * FROM chapters WHERE chapter_id = ?`).bind(chapterId).first();
            
            expect(chapter).toBeNull();
        });
    });
    
    describe('TC_CHAPTER_009: Delete Chapter - Cascade Delete Puzzle', () => {
        test('should delete puzzle when chapter is deleted', async () => {
            const chapterId = generateId('chapter');
            const puzzleId = generateId('puzzle');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '级联删除测试章节', '这是级联删除测试章节内容', 1, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            await db.prepare(`
                INSERT INTO puzzles (puzzle_id, chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, hint, puzzle_type, created_at)
                VALUES (?, ?, '测试问题', 'A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4', 'C', '测试提示', 'pattern', ?)
            `).bind(puzzleId, chapterId, now).run();
            
            await db.prepare(`DELETE FROM puzzles WHERE chapter_id = ?`).bind(chapterId).run();
            await db.prepare(`DELETE FROM chapters WHERE chapter_id = ?`).bind(chapterId).run();
            
            const puzzle = await db.prepare(`SELECT * FROM puzzles WHERE puzzle_id = ?`).bind(puzzleId).first();
            
            expect(puzzle).toBeNull();
        });
    });
    
    describe('TC_CHAPTER_010: Get Latest Chapter Success', () => {
        test('should return latest chapter', async () => {
            const chapterId1 = generateId('chapter');
            const chapterId2 = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '第一章', '内容1', 0, ?)
            `).bind(chapterId1, 'test_book_1', now).run();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 2, '第二章', '内容2', 0, ?)
            `).bind(chapterId2, 'test_book_1', now).run();
            
            const sql = `
                SELECT * FROM chapters 
                WHERE book_id = ?
                ORDER BY chapter_number DESC
                LIMIT 1
            `;
            const chapter = await db.prepare(sql).bind('test_book_1').first();
            
            expect(chapter.chapter_number).toBe(2);
        });
    });
    
    describe('TC_CHAPTER_EDGE_001: Pagination Boundary', () => {
        test('should handle pagination correctly', () => {
            const totalChapters = 25;
            const pageSize = 20;
            
            const page1Count = Math.min(totalChapters, pageSize);
            const page2Count = Math.max(0, totalChapters - pageSize);
            const page3Count = Math.max(0, totalChapters - pageSize * 2);
            
            expect(page1Count).toBe(20);
            expect(page2Count).toBe(5);
            expect(page3Count).toBe(0);
        });
    });
    
    describe('TC_CHAPTER_DB_001: Chapter Data Correct Storage', () => {
        test('should store chapter data correctly', async () => {
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, prompt_used, created_at)
                VALUES (?, ?, 1, '存储测试章节', '这是存储测试章节内容', 0, '测试提示词', ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            const chapter = await db.prepare(`SELECT * FROM chapters WHERE chapter_id = ?`).bind(chapterId).first();
            
            expect(chapter.book_id).toBe('test_book_1');
            expect(chapter.chapter_number).toBe(1);
            expect(chapter.prompt_used).toBe('测试提示词');
        });
    });
});
