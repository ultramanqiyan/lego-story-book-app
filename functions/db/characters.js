import { generateId } from './helpers.js';

export async function getPresetCharacters(db) {
    const sql = `SELECT * FROM characters WHERE is_preset = 1`;
    const result = await db.prepare(sql).all();
    return result.results;
}

export async function getCharacterById(db, characterId) {
    const sql = `SELECT * FROM characters WHERE character_id = ?`;
    const result = await db.prepare(sql).bind(characterId).first();
    return result;
}

export async function getCustomCharactersByUserId(db, userId) {
    const sql = `SELECT * FROM characters WHERE creator_id = ? AND is_preset = 0`;
    const result = await db.prepare(sql).bind(userId).all();
    return result.results;
}

export async function createCharacter(db, characterData) {
    const sql = `
        INSERT INTO characters (character_id, name, image_base64, description, personality, speaking_style, creator_id, is_preset, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `;
    const now = Date.now();
    await db.prepare(sql).bind(
        characterData.character_id || generateId('character'),
        characterData.name,
        characterData.image_base64,
        characterData.description || null,
        characterData.personality,
        characterData.speaking_style,
        characterData.creator_id,
        now,
        now
    ).run();
    return characterData.character_id || generateId('character');
}

export async function updateCharacter(db, characterId, characterData) {
    const fields = [];
    const values = [];
    
    if (characterData.name) {
        fields.push('name = ?');
        values.push(characterData.name);
    }
    if (characterData.description !== undefined) {
        fields.push('description = ?');
        values.push(characterData.description);
    }
    if (characterData.personality) {
        fields.push('personality = ?');
        values.push(characterData.personality);
    }
    if (characterData.speaking_style) {
        fields.push('speaking_style = ?');
        values.push(characterData.speaking_style);
    }
    if (characterData.image_base64) {
        fields.push('image_base64 = ?');
        values.push(characterData.image_base64);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(characterId);
    
    const sql = `UPDATE characters SET ${fields.join(', ')} WHERE character_id = ?`;
    await db.prepare(sql).bind(...values).run();
}

export async function deleteCharacter(db, characterId) {
    const sql = `DELETE FROM characters WHERE character_id = ?`;
    await db.prepare(sql).bind(characterId).run();
}

export async function checkCharacterInUse(db, characterId) {
    const sql = `SELECT COUNT(*) as count FROM book_roles WHERE character_id = ?`;
    const result = await db.prepare(sql).bind(characterId).first();
    return result.count > 0;
}
