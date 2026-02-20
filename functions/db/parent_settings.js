import { generateId } from './helpers.js';

export async function getParentSettings(db, parentId, childId) {
    const sql = `
        SELECT * FROM parent_settings 
        WHERE parent_id = ? AND child_id = ?
    `;
    const result = await db.prepare(sql).bind(parentId, childId).first();
    return result;
}

export async function createParentSettings(db, settingsData) {
    const sql = `
        INSERT INTO parent_settings (setting_id, parent_id, child_id, daily_time_limit, time_slots, content_filter, age_rating, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const now = Date.now();
    await db.prepare(sql).bind(
        settingsData.setting_id || generateId('setting'),
        settingsData.parent_id,
        settingsData.child_id,
        settingsData.daily_time_limit || 60,
        settingsData.time_slots ? JSON.stringify(settingsData.time_slots) : null,
        settingsData.content_filter !== false ? 1 : 0,
        settingsData.age_rating || 'all',
        now,
        now
    ).run();
    return settingsData.setting_id || generateId('setting');
}

export async function updateParentSettings(db, settingId, settingsData) {
    const fields = [];
    const values = [];
    
    if (settingsData.daily_time_limit !== undefined) {
        fields.push('daily_time_limit = ?');
        values.push(settingsData.daily_time_limit);
    }
    if (settingsData.time_slots !== undefined) {
        fields.push('time_slots = ?');
        values.push(JSON.stringify(settingsData.time_slots));
    }
    if (settingsData.content_filter !== undefined) {
        fields.push('content_filter = ?');
        values.push(settingsData.content_filter ? 1 : 0);
    }
    if (settingsData.age_rating !== undefined) {
        fields.push('age_rating = ?');
        values.push(settingsData.age_rating);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(settingId);
    
    const sql = `UPDATE parent_settings SET ${fields.join(', ')} WHERE setting_id = ?`;
    await db.prepare(sql).bind(...values).run();
}

export async function deleteParentSettings(db, parentId, childId) {
    const sql = `DELETE FROM parent_settings WHERE parent_id = ? AND child_id = ?`;
    await db.prepare(sql).bind(parentId, childId).run();
}

export async function getChildrenByParentId(db, parentId) {
    const sql = `
        SELECT u.user_id, u.username, u.avatar, ps.daily_time_limit
        FROM users u
        JOIN parent_settings ps ON u.user_id = ps.child_id
        WHERE ps.parent_id = ?
    `;
    const result = await db.prepare(sql).bind(parentId).all();
    return result.results;
}
