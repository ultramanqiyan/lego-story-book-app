import { generateId } from './helpers.js';

export async function getBookRoles(db, bookId) {
    const sql = `
        SELECT br.*, c.name as character_name, c.image_base64 as character_image,
               c.personality, c.speaking_style, c.description
        FROM book_roles br
        JOIN characters c ON br.character_id = c.character_id
        WHERE br.book_id = ?
        ORDER BY br.is_protagonist DESC, br.created_at ASC
    `;
    const result = await db.prepare(sql).bind(bookId).all();
    return result.results;
}

export async function getBookRoleById(db, roleId) {
    const sql = `
        SELECT br.*, c.name as character_name, c.image_base64 as character_image,
               c.personality, c.speaking_style
        FROM book_roles br
        JOIN characters c ON br.character_id = c.character_id
        WHERE br.role_id = ?
    `;
    const result = await db.prepare(sql).bind(roleId).first();
    return result;
}

export async function createBookRole(db, roleData) {
    const sql = `
        INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const now = Date.now();
    const isProtagonist = roleData.role_type === 'protagonist' ? 1 : 0;
    await db.prepare(sql).bind(
        roleData.role_id || generateId('role'),
        roleData.book_id,
        roleData.character_id,
        roleData.custom_name,
        roleData.role_type,
        isProtagonist,
        now,
        now
    ).run();
    return roleData.role_id || generateId('role');
}

export async function updateBookRole(db, roleId, roleData) {
    const fields = [];
    const values = [];
    
    if (roleData.custom_name) {
        fields.push('custom_name = ?');
        values.push(roleData.custom_name);
    }
    if (roleData.role_type) {
        fields.push('role_type = ?');
        fields.push('is_protagonist = ?');
        values.push(roleData.role_type);
        values.push(roleData.role_type === 'protagonist' ? 1 : 0);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(roleId);
    
    const sql = `UPDATE book_roles SET ${fields.join(', ')} WHERE role_id = ?`;
    await db.prepare(sql).bind(...values).run();
}

export async function deleteBookRole(db, roleId) {
    const sql = `DELETE FROM book_roles WHERE role_id = ?`;
    await db.prepare(sql).bind(roleId).run();
}

export async function checkCustomNameExists(db, bookId, customName, excludeRoleId = null) {
    let sql = `SELECT COUNT(*) as count FROM book_roles WHERE book_id = ? AND custom_name = ?`;
    const params = [bookId, customName];
    
    if (excludeRoleId) {
        sql += ` AND role_id != ?`;
        params.push(excludeRoleId);
    }
    
    const result = await db.prepare(sql).bind(...params).first();
    return result.count > 0;
}

export async function getCurrentProtagonist(db, bookId) {
    const sql = `
        SELECT br.*, c.name as character_name, c.image_base64 as character_image
        FROM book_roles br
        JOIN characters c ON br.character_id = c.character_id
        WHERE br.book_id = ? AND br.is_protagonist = 1
    `;
    const result = await db.prepare(sql).bind(bookId).first();
    return result;
}

export async function clearProtagonist(db, bookId) {
    const sql = `UPDATE book_roles SET is_protagonist = 0, updated_at = ? WHERE book_id = ?`;
    await db.prepare(sql).bind(Date.now(), bookId).run();
}

export async function setProtagonist(db, roleId) {
    const sql = `UPDATE book_roles SET is_protagonist = 1, updated_at = ? WHERE role_id = ?`;
    await db.prepare(sql).bind(Date.now(), roleId).run();
}
