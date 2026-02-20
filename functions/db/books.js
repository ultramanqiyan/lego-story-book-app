import { generateId } from './helpers.js';

export async function getBookById(db, bookId) {
    const sql = `SELECT * FROM books WHERE book_id = ?`;
    const result = await db.prepare(sql).bind(bookId).first();
    return result;
}

export async function getBooksByUserId(db, userId, status = 'active', page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM books WHERE user_id = ? AND status = ?`;
    const countResult = await db.prepare(countSql).bind(userId, status).first();
    
    const sql = `
        SELECT * FROM books 
        WHERE user_id = ? AND status = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `;
    const result = await db.prepare(sql).bind(userId, status, pageSize, offset).all();
    
    return {
        books: result.results,
        total: countResult.total,
        page: page,
        pageSize: pageSize
    };
}

export async function createBook(db, bookData) {
    const sql = `
        INSERT INTO books (book_id, user_id, title, chapter_count, cover_image, status, created_at, updated_at)
        VALUES (?, ?, ?, 0, ?, 'active', ?, ?)
    `;
    const now = Date.now();
    await db.prepare(sql).bind(
        bookData.book_id || generateId('book'),
        bookData.user_id,
        bookData.title,
        bookData.cover_image || null,
        now,
        now
    ).run();
    return bookData.book_id || generateId('book');
}

export async function updateBook(db, bookId, bookData) {
    const fields = [];
    const values = [];
    
    if (bookData.title) {
        fields.push('title = ?');
        values.push(bookData.title);
    }
    if (bookData.cover_image !== undefined) {
        fields.push('cover_image = ?');
        values.push(bookData.cover_image);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(bookId);
    
    const sql = `UPDATE books SET ${fields.join(', ')} WHERE book_id = ?`;
    await db.prepare(sql).bind(...values).run();
}

export async function updateBookChapterCount(db, bookId, count) {
    const sql = `UPDATE books SET chapter_count = ?, updated_at = ? WHERE book_id = ?`;
    await db.prepare(sql).bind(count, Date.now(), bookId).run();
}

export async function archiveBook(db, bookId) {
    const sql = `UPDATE books SET status = 'archived', archived_at = ?, updated_at = ? WHERE book_id = ?`;
    const now = Date.now();
    await db.prepare(sql).bind(now, now, bookId).run();
}

export async function restoreBook(db, bookId) {
    const sql = `UPDATE books SET status = 'active', archived_at = NULL, updated_at = ? WHERE book_id = ?`;
    await db.prepare(sql).bind(Date.now(), bookId).run();
}

export async function deleteBook(db, bookId) {
    const sql = `DELETE FROM books WHERE book_id = ?`;
    await db.prepare(sql).bind(bookId).run();
}

export async function getArchivedBooks(db, userId) {
    const sql = `
        SELECT *, 
               (30 - CAST((? - archived_at) / 86400000.0 AS INTEGER)) as days_remaining
        FROM books 
        WHERE user_id = ? AND status = 'archived'
        ORDER BY archived_at DESC
    `;
    const result = await db.prepare(sql).bind(Date.now(), userId).all();
    return result.results;
}
