import { generateId } from './helpers.js';

export async function getUserById(db, userId) {
    const sql = `SELECT * FROM users WHERE user_id = ?`;
    const result = await db.prepare(sql).bind(userId).first();
    return result;
}

export async function getUserByUsername(db, username) {
    const sql = `SELECT * FROM users WHERE username = ?`;
    const result = await db.prepare(sql).bind(username).first();
    return result;
}

export async function createUser(db, userData) {
    const sql = `
        INSERT INTO users (user_id, username, password_hash, email, avatar, role, parent_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const now = Date.now();
    await db.prepare(sql).bind(
        userData.user_id || generateId('user'),
        userData.username,
        userData.password_hash,
        userData.email || null,
        userData.avatar || null,
        userData.role || 'child',
        userData.parent_id || null,
        now,
        now
    ).run();
    return userData.user_id || generateId('user');
}

export async function updateUser(db, userId, userData) {
    const fields = [];
    const values = [];
    
    if (userData.username) {
        fields.push('username = ?');
        values.push(userData.username);
    }
    if (userData.password_hash) {
        fields.push('password_hash = ?');
        values.push(userData.password_hash);
    }
    if (userData.email !== undefined) {
        fields.push('email = ?');
        values.push(userData.email);
    }
    if (userData.avatar !== undefined) {
        fields.push('avatar = ?');
        values.push(userData.avatar);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(userId);
    
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    await db.prepare(sql).bind(...values).run();
}

export async function deleteUser(db, userId) {
    const sql = `DELETE FROM users WHERE user_id = ?`;
    await db.prepare(sql).bind(userId).run();
}
