import { generateId } from './helpers.js';

export async function getShareById(db, shareId) {
    const sql = `SELECT * FROM shares WHERE share_id = ?`;
    const result = await db.prepare(sql).bind(shareId).first();
    return result;
}

export async function getSharesByUserId(db, userId) {
    const sql = `
        SELECT s.*, b.title as book_title
        FROM shares s
        JOIN books b ON s.book_id = b.book_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    `;
    const result = await db.prepare(sql).bind(userId).all();
    return result.results;
}

export async function createShare(db, shareData) {
    const sql = `
        INSERT INTO shares (share_id, book_id, user_id, share_type, password, is_active, view_count, created_at)
        VALUES (?, ?, ?, ?, ?, 1, 0, ?)
    `;
    await db.prepare(sql).bind(
        shareData.share_id || generateId('share'),
        shareData.book_id,
        shareData.user_id,
        shareData.share_type || 'public',
        shareData.password || null,
        shareData.created_at || Date.now()
    ).run();
    return shareData.share_id || generateId('share');
}

export async function updateShareViewCount(db, shareId) {
    const sql = `UPDATE shares SET view_count = view_count + 1 WHERE share_id = ?`;
    await db.prepare(sql).bind(shareId).run();
}

export async function deactivateShare(db, shareId) {
    const sql = `UPDATE shares SET is_active = 0 WHERE share_id = ?`;
    await db.prepare(sql).bind(shareId).run();
}

export async function deleteShare(db, shareId) {
    const sql = `DELETE FROM shares WHERE share_id = ?`;
    await db.prepare(sql).bind(shareId).run();
}
