import { generateId } from './helpers.js';

export async function getChapterById(db, chapterId) {
    const sql = `SELECT * FROM chapters WHERE chapter_id = ?`;
    const result = await db.prepare(sql).bind(chapterId).first();
    return result;
}

export async function getChaptersByBookId(db, bookId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM chapters WHERE book_id = ?`;
    const countResult = await db.prepare(countSql).bind(bookId).first();
    
    const sql = `
        SELECT chapter_id, chapter_number, title, 
               SUBSTR(content, 1, 100) as content_preview, 
               has_puzzle, created_at
        FROM chapters 
        WHERE book_id = ?
        ORDER BY chapter_number ASC
        LIMIT ? OFFSET ?
    `;
    const result = await db.prepare(sql).bind(bookId, pageSize, offset).all();
    
    return {
        chapters: result.results,
        total: countResult.total,
        page: page,
        pageSize: pageSize
    };
}

export async function getLatestChapter(db, bookId) {
    const sql = `
        SELECT * FROM chapters 
        WHERE book_id = ?
        ORDER BY chapter_number DESC
        LIMIT 1
    `;
    const result = await db.prepare(sql).bind(bookId).first();
    return result;
}

export async function createChapter(db, chapterData) {
    const sql = `
        INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, prompt_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.prepare(sql).bind(
        chapterData.chapter_id || generateId('chapter'),
        chapterData.book_id,
        chapterData.chapter_number,
        chapterData.title,
        chapterData.content,
        chapterData.has_puzzle || 0,
        chapterData.prompt_used || null,
        chapterData.created_at || Date.now()
    ).run();
    return chapterData.chapter_id || generateId('chapter');
}

export async function deleteChapter(db, chapterId) {
    const sql = `DELETE FROM chapters WHERE chapter_id = ?`;
    await db.prepare(sql).bind(chapterId).run();
}

export async function getChapterCount(db, bookId) {
    const sql = `SELECT COUNT(*) as count FROM chapters WHERE book_id = ?`;
    const result = await db.prepare(sql).bind(bookId).first();
    return result.count;
}

export async function getChapterWithPuzzle(db, chapterId) {
    const chapter = await getChapterById(db, chapterId);
    if (!chapter) return null;
    
    if (chapter.has_puzzle) {
        const { getPuzzleByChapterId } = await import('./puzzles.js');
        const puzzle = await getPuzzleByChapterId(db, chapterId);
        chapter.puzzle = puzzle;
    }
    
    return chapter;
}
