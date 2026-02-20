export function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function executeQuery(db, sql, params = []) {
    try {
        const result = await db.prepare(sql).bind(...params).all();
        return { success: true, data: result.results };
    } catch (error) {
        console.error('Database query error:', error);
        return { success: false, error: error.message };
    }
}

export async function executeInsert(db, sql, params = []) {
    try {
        const result = await db.prepare(sql).bind(...params).run();
        return { success: true, data: result };
    } catch (error) {
        console.error('Database insert error:', error);
        return { success: false, error: error.message };
    }
}

export async function executeUpdate(db, sql, params = []) {
    try {
        const result = await db.prepare(sql).bind(...params).run();
        return { success: true, data: result };
    } catch (error) {
        console.error('Database update error:', error);
        return { success: false, error: error.message };
    }
}

export async function executeDelete(db, sql, params = []) {
    try {
        const result = await db.prepare(sql).bind(...params).run();
        return { success: true, data: result };
    } catch (error) {
        console.error('Database delete error:', error);
        return { success: false, error: error.message };
    }
}
