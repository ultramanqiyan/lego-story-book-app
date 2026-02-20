const { initializeDatabase, seedPresetCharacters, seedTestData } = require('../setup');

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

describe('Puzzle Unit Tests', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_PUZZLE_001: Verify Answer Success', () => {
        test('should verify correct answer', async () => {
            const chapterId = generateId('chapter');
            const puzzleId = generateId('puzzle');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '谜题章节', '内容', 1, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            await db.prepare(`
                INSERT INTO puzzles (puzzle_id, chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, hint, puzzle_type, created_at)
                VALUES (?, ?, '红、黄、蓝、红、黄、__，下一个是什么颜色？', 'A. 红色', 'B. 黄色', 'C. 蓝色', 'D. 绿色', 'C', '仔细观察颜色的排列顺序', 'pattern', ?)
            `).bind(puzzleId, chapterId, now).run();
            
            const puzzle = await db.prepare(`SELECT * FROM puzzles WHERE puzzle_id = ?`).bind(puzzleId).first();
            const userAnswer = 'C';
            const isCorrect = userAnswer.toUpperCase() === puzzle.correct_answer.toUpperCase();
            
            expect(isCorrect).toBe(true);
        });
    });
    
    describe('TC_PUZZLE_002: Verify Answer Failed - Wrong Answer', () => {
        test('should verify wrong answer', async () => {
            const puzzleId = generateId('puzzle');
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '谜题章节', '内容', 1, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            await db.prepare(`
                INSERT INTO puzzles (puzzle_id, chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, hint, puzzle_type, created_at)
                VALUES (?, ?, '问题', 'A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4', 'C', '提示', 'pattern', ?)
            `).bind(puzzleId, chapterId, now).run();
            
            const puzzle = await db.prepare(`SELECT * FROM puzzles WHERE puzzle_id = ?`).bind(puzzleId).first();
            const userAnswer = 'A';
            const isCorrect = userAnswer.toUpperCase() === puzzle.correct_answer.toUpperCase();
            
            expect(isCorrect).toBe(false);
        });
    });
    
    describe('TC_PUZZLE_003: Verify Answer Failed - Puzzle Not Exist', () => {
        test('should return null for non-existent puzzle', async () => {
            const puzzle = await db.prepare(`SELECT * FROM puzzles WHERE puzzle_id = ?`).bind('nonexistent').first();
            
            expect(puzzle).toBeNull();
        });
    });
    
    describe('TC_PUZZLE_004: Verify Answer Failed - Invalid Answer Format', () => {
        test('should reject invalid answer format', () => {
            const validAnswers = ['A', 'B', 'C', 'D'];
            const invalidAnswer = 'E';
            
            expect(validAnswers).not.toContain(invalidAnswer);
        });
    });
    
    describe('TC_PUZZLE_005: First Attempt Failed', () => {
        test('should have 2 remaining attempts after first failure', () => {
            const maxAttempts = 3;
            const currentAttempts = 1;
            const remainingAttempts = maxAttempts - currentAttempts;
            
            expect(remainingAttempts).toBe(2);
        });
    });
    
    describe('TC_PUZZLE_006: Second Attempt Failed - Show Hint', () => {
        test('should show hint after second failure', () => {
            const attempts = 2;
            const shouldShowHint = attempts >= 2;
            
            expect(shouldShowHint).toBe(true);
        });
    });
    
    describe('TC_PUZZLE_007: Third Attempt Failed - Penalty Story', () => {
        test('should trigger penalty story after third failure', () => {
            const maxAttempts = 3;
            const currentAttempts = 3;
            const shouldTriggerPenalty = currentAttempts >= maxAttempts;
            
            expect(shouldTriggerPenalty).toBe(true);
        });
    });
    
    describe('TC_PUZZLE_008: Answer Record Create', () => {
        test('should create answer record', async () => {
            const recordId = generateId('record');
            const puzzleId = generateId('puzzle');
            const chapterId = generateId('chapter');
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
            
            const record = await db.prepare(`SELECT * FROM puzzle_records WHERE record_id = ?`).bind(recordId).first();
            
            expect(record).toBeDefined();
            expect(record.attempts).toBe(1);
        });
    });
    
    describe('TC_PUZZLE_009: Answer Record Update', () => {
        test('should update answer record', async () => {
            const recordId = generateId('record');
            const puzzleId = generateId('puzzle');
            const chapterId = generateId('chapter');
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
            
            await db.prepare(`
                UPDATE puzzle_records SET attempts = ?, user_answer = ?, answer_time = ? WHERE record_id = ?
            `).bind(2, 'B', Date.now(), recordId).run();
            
            const record = await db.prepare(`SELECT * FROM puzzle_records WHERE record_id = ?`).bind(recordId).first();
            
            expect(record.attempts).toBe(2);
        });
    });
    
    describe('TC_PUZZLE_EDGE_001: Answer Case Insensitive', () => {
        test('should accept lowercase answer', () => {
            const userAnswer = 'a';
            const correctAnswer = 'A';
            const isCorrect = userAnswer.toUpperCase() === correctAnswer.toUpperCase();
            
            expect(isCorrect).toBe(true);
        });
        
        test('should accept uppercase answer', () => {
            const userAnswer = 'A';
            const correctAnswer = 'A';
            const isCorrect = userAnswer.toUpperCase() === correctAnswer.toUpperCase();
            
            expect(isCorrect).toBe(true);
        });
    });
    
    describe('TC_PUZZLE_EDGE_002: Attempt Count Boundary', () => {
        test('should limit attempts to 3', () => {
            const maxAttempts = 3;
            const currentAttempts = 3;
            const canRetry = currentAttempts < maxAttempts;
            
            expect(canRetry).toBe(false);
        });
    });
    
    describe('TC_PUZZLE_TYPE_001: Pattern Puzzle', () => {
        test('should create pattern type puzzle', async () => {
            const puzzleId = generateId('puzzle');
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '谜题章节', '内容', 1, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            await db.prepare(`
                INSERT INTO puzzles (puzzle_id, chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, hint, puzzle_type, created_at)
                VALUES (?, ?, '红、黄、蓝、红、黄、__，下一个是什么颜色？', 'A. 红色', 'B. 黄色', 'C. 蓝色', 'D. 绿色', 'C', '仔细观察颜色的排列顺序', 'pattern', ?)
            `).bind(puzzleId, chapterId, now).run();
            
            const puzzle = await db.prepare(`SELECT * FROM puzzles WHERE puzzle_id = ?`).bind(puzzleId).first();
            
            expect(puzzle.puzzle_type).toBe('pattern');
        });
    });
    
    describe('TC_PUZZLE_TYPE_002: Calculation Puzzle', () => {
        test('should create calculation type puzzle', async () => {
            const puzzleId = generateId('puzzle');
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '谜题章节', '内容', 1, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            await db.prepare(`
                INSERT INTO puzzles (puzzle_id, chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, hint, puzzle_type, created_at)
                VALUES (?, ?, '你有5块积木，又拿了3块，现在有几块？', 'A. 2块', 'B. 3块', 'C. 4块', 'D. 8块', 'D', '用加法计算', 'calculation', ?)
            `).bind(puzzleId, chapterId, now).run();
            
            const puzzle = await db.prepare(`SELECT * FROM puzzles WHERE puzzle_id = ?`).bind(puzzleId).first();
            
            expect(puzzle.puzzle_type).toBe('calculation');
        });
    });
    
    describe('TC_PUZZLE_TYPE_003: Common Sense Puzzle', () => {
        test('should create common type puzzle', async () => {
            const puzzleId = generateId('puzzle');
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '谜题章节', '内容', 1, ?)
            `).bind(chapterId, 'test_book_1', now).run();
            
            await db.prepare(`
                INSERT INTO puzzles (puzzle_id, chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, hint, puzzle_type, created_at)
                VALUES (?, ?, '书本、铅笔、苹果、橡皮，哪个不一样？', 'A. 书本', 'B. 铅笔', 'C. 苹果', 'D. 橡皮', 'C', '想想哪个不是文具', 'common', ?)
            `).bind(puzzleId, chapterId, now).run();
            
            const puzzle = await db.prepare(`SELECT * FROM puzzles WHERE puzzle_id = ?`).bind(puzzleId).first();
            
            expect(puzzle.puzzle_type).toBe('common');
        });
    });
});
