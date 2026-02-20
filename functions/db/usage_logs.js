import { generateId } from './helpers.js';

export async function createUsageLog(db, logData) {
    const sql = `
        INSERT INTO usage_logs (log_id, user_id, action_type, action_detail, duration, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.prepare(sql).bind(
        logData.log_id || generateId('log'),
        logData.user_id,
        logData.action_type,
        logData.action_detail ? JSON.stringify(logData.action_detail) : null,
        logData.duration || 0,
        logData.created_at || Date.now()
    ).run();
}

export async function getDailyUsage(db, userId, date) {
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    
    const sql = `
        SELECT SUM(duration) as total_duration
        FROM usage_logs
        WHERE user_id = ? AND created_at >= ? AND created_at <= ?
    `;
    const result = await db.prepare(sql).bind(userId, startOfDay, endOfDay).first();
    return result.total_duration || 0;
}

export async function getUsageStats(db, userId, startDate, endDate) {
    const sql = `
        SELECT 
            DATE(created_at / 1000, 'unixepoch') as date,
            SUM(duration) as duration
        FROM usage_logs
        WHERE user_id = ? AND created_at >= ? AND created_at <= ?
        GROUP BY DATE(created_at / 1000, 'unixepoch')
        ORDER BY date
    `;
    const result = await db.prepare(sql).bind(userId, startDate, endDate).all();
    return result.results;
}

export async function getWeeklyUsage(db, userId) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const sql = `
        SELECT 
            DATE(created_at / 1000, 'unixepoch') as date,
            SUM(duration) as duration
        FROM usage_logs
        WHERE user_id = ? AND created_at >= ?
        GROUP BY DATE(created_at / 1000, 'unixepoch')
        ORDER BY date
    `;
    const result = await db.prepare(sql).bind(userId, startOfWeek.getTime()).all();
    return result.results;
}

export async function getMonthlyUsage(db, userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const sql = `
        SELECT 
            DATE(created_at / 1000, 'unixepoch') as date,
            SUM(duration) as duration
        FROM usage_logs
        WHERE user_id = ? AND created_at >= ?
        GROUP BY DATE(created_at / 1000, 'unixepoch')
        ORDER BY date
    `;
    const result = await db.prepare(sql).bind(userId, startOfMonth.getTime()).all();
    return result.results;
}
