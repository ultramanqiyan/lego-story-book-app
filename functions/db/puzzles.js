import { generateId } from './helpers.js';

export async function getPuzzleById(db, puzzleId) {
    const sql = `SELECT * FROM puzzles WHERE puzzle_id = ?`;
    const result = await db.prepare(sql).bind(puzzleId).first();
    return result;
}

export async function getPuzzleByChapterId(db, chapterId) {
    const sql = `SELECT * FROM puzzles WHERE chapter_id = ?`;
    const result = await db.prepare(sql).bind(chapterId).first();
    return result;
}

export async function createPuzzle(db, puzzleData) {
    const sql = `
        INSERT INTO puzzles (puzzle_id, chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, hint, puzzle_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.prepare(sql).bind(
        puzzleData.puzzle_id || generateId('puzzle'),
        puzzleData.chapter_id,
        puzzleData.question,
        puzzleData.option_a,
        puzzleData.option_b,
        puzzleData.option_c,
        puzzleData.option_d,
        puzzleData.correct_answer,
        puzzleData.hint || null,
        puzzleData.puzzle_type,
        puzzleData.created_at || Date.now()
    ).run();
    return puzzleData.puzzle_id || generateId('puzzle');
}

export async function deletePuzzle(db, puzzleId) {
    const sql = `DELETE FROM puzzles WHERE puzzle_id = ?`;
    await db.prepare(sql).bind(puzzleId).run();
}

export async function deletePuzzleByChapterId(db, chapterId) {
    const sql = `DELETE FROM puzzles WHERE chapter_id = ?`;
    await db.prepare(sql).bind(chapterId).run();
}
