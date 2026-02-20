import { generateId } from './helpers.js';

export async function getAnswerRecord(db, userId, puzzleId) {
    const sql = `SELECT * FROM puzzle_records WHERE user_id = ? AND puzzle_id = ?`;
    const result = await db.prepare(sql).bind(userId, puzzleId).first();
    return result;
}

export async function createAnswerRecord(db, recordData) {
    const sql = `
        INSERT INTO puzzle_records (record_id, user_id, puzzle_id, chapter_id, user_answer, is_correct, attempts, answer_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.prepare(sql).bind(
        recordData.record_id || generateId('record'),
        recordData.user_id,
        recordData.puzzle_id,
        recordData.chapter_id,
        recordData.user_answer,
        recordData.is_correct,
        recordData.attempts || 1,
        recordData.answer_time || Date.now()
    ).run();
    return recordData.record_id || generateId('record');
}

export async function updateAnswerRecord(db, recordId, updateData) {
    const sql = `
        UPDATE puzzle_records 
        SET user_answer = ?, is_correct = ?, attempts = ?, answer_time = ?
        WHERE record_id = ?
    `;
    await db.prepare(sql).bind(
        updateData.user_answer,
        updateData.is_correct,
        updateData.attempts,
        updateData.answer_time,
        recordId
    ).run();
}

export async function getAnswerRecordByChapter(db, userId, chapterId) {
    const sql = `
        SELECT pr.* FROM puzzle_records pr
        JOIN puzzles p ON pr.puzzle_id = p.puzzle_id
        WHERE pr.user_id = ? AND p.chapter_id = ?
    `;
    const result = await db.prepare(sql).bind(userId, chapterId).first();
    return result;
}
