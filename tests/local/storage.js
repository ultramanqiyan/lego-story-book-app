const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'test_data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userId) {
    const payload = JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    return Buffer.from(payload).toString('base64');
}

function verifyToken(token) {
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (payload.exp < Date.now()) {
            return { valid: false, error: '会话已过期' };
        }
        return { valid: true, userId: payload.userId };
    } catch (e) {
        return { valid: false, error: '无效的认证信息' };
    }
}

class FileStorage {
    constructor(collection) {
        this.filePath = path.join(DATA_DIR, `${collection}.json`);
        this.data = this.load();
    }

    load() {
        if (fs.existsSync(this.filePath)) {
            return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        }
        return [];
    }

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }

    insert(item) {
        this.data.push(item);
        this.save();
        return item;
    }

    find(predicate) {
        return this.data.filter(predicate);
    }

    findOne(predicate) {
        return this.data.find(predicate);
    }

    update(predicate, updates) {
        const index = this.data.findIndex(predicate);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates };
            this.save();
            return this.data[index];
        }
        return null;
    }

    delete(predicate) {
        const index = this.data.findIndex(predicate);
        if (index !== -1) {
            this.data.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    count(predicate) {
        return predicate ? this.data.filter(predicate).length : this.data.length;
    }

    clear() {
        this.data = [];
        this.save();
    }
}

const users = new FileStorage('users');
const characters = new FileStorage('characters');
const books = new FileStorage('books');
const bookRoles = new FileStorage('book_roles');
const chapters = new FileStorage('chapters');
const puzzles = new FileStorage('puzzles');
const puzzleRecords = new FileStorage('puzzle_records');
const shares = new FileStorage('shares');
const parentSettings = new FileStorage('parent_settings');
const usageLogs = new FileStorage('usage_logs');

function initPresetCharacters() {
    if (characters.count(c => c.is_preset) === 0) {
        const presets = [
            { character_id: generateId('char_'), name: '小明', is_preset: true, avatar_emoji: '👦', personality: '勇敢、好奇', description: '一个勇敢的小男孩，喜欢冒险' },
            { character_id: generateId('char_'), name: '小红', is_preset: true, avatar_emoji: '👧', personality: '聪明、善良', description: '一个聪明的小女孩，喜欢帮助别人' },
            { character_id: generateId('char_'), name: '小强', is_preset: true, avatar_emoji: '🧒', personality: '强壮、忠诚', description: '一个强壮的小男孩，是可靠的朋友' },
            { character_id: generateId('char_'), name: '小美', is_preset: true, avatar_emoji: '👩', personality: '优雅、有创意', description: '一个优雅的小女孩，喜欢艺术' },
            { character_id: generateId('char_'), name: '小智', is_preset: true, avatar_emoji: '🧑', personality: '智慧、冷静', description: '一个聪明的小孩，善于解决问题' },
            { character_id: generateId('char_'), name: '小勇', is_preset: true, avatar_emoji: '👦', personality: '冒险、热情', description: '一个充满活力的小男孩' }
        ];
        presets.forEach(p => characters.insert(p));
    }
}

function clearAllData() {
    users.clear();
    characters.clear();
    books.clear();
    bookRoles.clear();
    chapters.clear();
    puzzles.clear();
    puzzleRecords.clear();
    shares.clear();
    parentSettings.clear();
    usageLogs.clear();
}

module.exports = {
    generateId,
    hashPassword,
    generateToken,
    verifyToken,
    FileStorage,
    users,
    characters,
    books,
    bookRoles,
    chapters,
    puzzles,
    puzzleRecords,
    shares,
    parentSettings,
    usageLogs,
    initPresetCharacters,
    clearAllData,
    DATA_DIR
};
