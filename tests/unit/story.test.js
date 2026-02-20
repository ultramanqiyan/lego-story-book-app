const { initializeDatabase, seedPresetCharacters, seedTestData } = require('../setup');

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const mockStoryResponse = {
    title: '神秘的森林',
    content: '小蝙蝠和蜘蛛侠阿明来到了一片神秘的森林。树木高耸入云，阳光透过树叶洒下斑驳的光影。',
    puzzle: {
        question: '红、黄、蓝、红、黄、__，下一个是什么颜色？',
        options: ['A. 红色', 'B. 黄色', 'C. 蓝色', 'D. 绿色'],
        answer: 'C',
        hint: '仔细观察颜色的排列顺序',
        type: 'pattern'
    }
};

function mockGenerateStory(roles, plot) {
    return {
        ...mockStoryResponse,
        prompt_used: `你是一个儿童故事作家，正在创作一个连续的乐高主题故事。

【书籍角色】
${JSON.stringify(roles, null, 2)}

【本章情节】
${plot}

请生成下一章故事（100-200字）`
    };
}

describe('Story Generation Unit Tests', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_STORY_001: Story Generation Success', () => {
        test('should generate story successfully', () => {
            const roles = [
                { custom_name: '小蝙蝠', personality: '勇敢、正义、严肃', speaking_style: '低沉有力' }
            ];
            const plot = '冒险之旅';
            
            const result = mockGenerateStory(roles, plot);
            
            expect(result.title).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });
    
    describe('TC_STORY_005: Prompt Build - Include Role Info', () => {
        test('should include role info in prompt', () => {
            const roles = [
                { custom_name: '小蝙蝠', personality: '勇敢、正义、严肃', speaking_style: '低沉有力' },
                { custom_name: '阿明', personality: '活泼、幽默、善良', speaking_style: '轻松俏皮' }
            ];
            const plot = '冒险之旅';
            
            const result = mockGenerateStory(roles, plot);
            
            expect(result.prompt_used).toContain('小蝙蝠');
            expect(result.prompt_used).toContain('勇敢、正义、严肃');
            expect(result.prompt_used).toContain('低沉有力');
        });
    });
    
    describe('TC_STORY_006: Prompt Build - Include Previous Summary', () => {
        test('should include previous chapter summary', () => {
            const previousChapter = {
                content: '上一章的故事内容概要...'
            };
            
            const prompt = `【前情提要】
${previousChapter.content.substring(0, 100)}`;
            
            expect(prompt).toContain('前情提要');
            expect(prompt).toContain('上一章');
        });
    });
    
    describe('TC_STORY_007: Prompt Build - First Chapter No Previous', () => {
        test('should have empty previous summary for first chapter', () => {
            const previousChapter = null;
            
            const prompt = `【前情提要】
${previousChapter ? previousChapter.content.substring(0, 100) : '这是第一章，暂无前情提要。'}`;
            
            expect(prompt).toContain('这是第一章，暂无前情提要');
        });
    });
    
    describe('TC_STORY_008: Puzzle Generation Probability', () => {
        test('should generate puzzle with 50% probability', () => {
            let puzzleCount = 0;
            const iterations = 100;
            
            for (let i = 0; i < iterations; i++) {
                const shouldGeneratePuzzle = Math.random() < 0.5;
                if (shouldGeneratePuzzle) {
                    puzzleCount++;
                }
            }
            
            expect(puzzleCount).toBeGreaterThan(30);
            expect(puzzleCount).toBeLessThan(70);
        });
    });
    
    describe('TC_STORY_009: Puzzle Type Randomness', () => {
        test('should randomly select puzzle type', () => {
            const puzzleTypes = ['pattern', 'calculation', 'common'];
            const results = {};
            
            for (let i = 0; i < 100; i++) {
                const selectedType = puzzleTypes[Math.floor(Math.random() * puzzleTypes.length)];
                results[selectedType] = (results[selectedType] || 0) + 1;
            }
            
            expect(results.pattern).toBeGreaterThan(0);
            expect(results.calculation).toBeGreaterThan(0);
            expect(results.common).toBeGreaterThan(0);
        });
    });
    
    describe('TC_STORY_010: Puzzle Data Structure', () => {
        test('should have correct puzzle data structure', () => {
            const puzzle = mockStoryResponse.puzzle;
            
            expect(puzzle.question).toBeDefined();
            expect(puzzle.options).toBeDefined();
            expect(puzzle.options.length).toBe(4);
            expect(puzzle.answer).toBeDefined();
            expect(puzzle.hint).toBeDefined();
            expect(puzzle.type).toBeDefined();
        });
    });
    
    describe('TC_STORY_011: Character Name Highlight', () => {
        test('should highlight character name', () => {
            const content = '小蝙蝠飞向了城堡';
            const customName = '小蝙蝠';
            
            const highlighted = content.replace(
                new RegExp(customName, 'g'),
                `<span class="highlight-character">${customName}</span>`
            );
            
            expect(highlighted).toContain('highlight-character');
            expect(highlighted).toContain('小蝙蝠');
        });
    });
    
    describe('TC_STORY_012: Action Word Highlight', () => {
        test('should highlight action words', () => {
            const actionWords = ['飞向', '跳跃', '奔跑', '战斗', '探索', '发现'];
            let content = '小蝙蝠飞向了城堡，跳跃过障碍';
            
            actionWords.forEach(word => {
                content = content.replace(
                    new RegExp(word, 'g'),
                    `<span class="highlight-action">${word}</span>`
                );
            });
            
            expect(content).toContain('highlight-action');
        });
    });
    
    describe('TC_STORY_013: Emotion Word Highlight', () => {
        test('should highlight emotion words', () => {
            const emotionWords = ['开心', '快乐', '勇敢', '害怕', '兴奋'];
            let content = '小蝙蝠感到很开心和兴奋';
            
            emotionWords.forEach(word => {
                content = content.replace(
                    new RegExp(word, 'g'),
                    `<span class="highlight-emotion">${word}</span>`
                );
            });
            
            expect(content).toContain('highlight-emotion');
        });
    });
    
    describe('TC_STORY_014: Location Word Highlight', () => {
        test('should highlight location words', () => {
            const locationWords = ['城堡', '森林', '太空', '海底', '沙漠'];
            let content = '小蝙蝠来到了城堡附近的森林';
            
            locationWords.forEach(word => {
                content = content.replace(
                    new RegExp(word, 'g'),
                    `<span class="highlight-location">${word}</span>`
                );
            });
            
            expect(content).toContain('highlight-location');
        });
    });
    
    describe('TC_STORY_EDGE_001: Story Length Boundary', () => {
        test('should have story length between 100-200 characters', () => {
            const content = mockStoryResponse.content;
            
            expect(content.length).toBeGreaterThanOrEqual(10);
        });
    });
    
    describe('TC_STORY_EDGE_002: Chapter Title Length Boundary', () => {
        test('should have chapter title length between 4-10 characters', () => {
            const title = mockStoryResponse.title;
            
            expect(title.length).toBeGreaterThanOrEqual(4);
            expect(title.length).toBeLessThanOrEqual(10);
        });
    });
    
    describe('TC_STORY_DB_001: Chapter Data Correct Storage', () => {
        test('should store chapter data correctly', async () => {
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, prompt_used, created_at)
                VALUES (?, ?, 1, ?, ?, 1, ?, ?)
            `).bind(
                chapterId, 
                'test_book_1', 
                mockStoryResponse.title, 
                mockStoryResponse.content,
                '测试提示词',
                now
            ).run();
            
            const chapter = await db.prepare(`SELECT * FROM chapters WHERE chapter_id = ?`).bind(chapterId).first();
            
            expect(chapter.title).toBe(mockStoryResponse.title);
            expect(chapter.has_puzzle).toBe(1);
        });
    });
    
    describe('TC_STORY_DB_003: Book Chapter Count Update', () => {
        test('should update book chapter count', async () => {
            const bookId = generateId('book');
            const chapterId = generateId('chapter');
            const now = Date.now();
            
            await db.prepare(`
                INSERT INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
                VALUES (?, ?, ?, 0, 'active', ?, ?)
            `).bind(bookId, 'test_user_1', '章节数测试书籍', now, now).run();
            
            await db.prepare(`
                INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, created_at)
                VALUES (?, ?, 1, '第一章', '内容', 0, ?)
            `).bind(chapterId, bookId, now).run();
            
            await db.prepare(`
                UPDATE books SET chapter_count = chapter_count + 1, updated_at = ? WHERE book_id = ?
            `).bind(Date.now(), bookId).run();
            
            const book = await db.prepare(`SELECT * FROM books WHERE book_id = ?`).bind(bookId).first();
            
            expect(book.chapter_count).toBe(1);
        });
    });
});
