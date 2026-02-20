const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const schema = `
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'child',
    parent_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
    character_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_base64 TEXT NOT NULL,
    description TEXT,
    personality TEXT NOT NULL,
    speaking_style TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    is_preset INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS books (
    book_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    chapter_count INTEGER DEFAULT 0,
    cover_image TEXT,
    status TEXT DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    archived_at INTEGER
);

CREATE TABLE IF NOT EXISTS book_roles (
    role_id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    custom_name TEXT NOT NULL,
    role_type TEXT NOT NULL,
    is_protagonist INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chapters (
    chapter_id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    has_puzzle INTEGER DEFAULT 0,
    prompt_used TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS puzzles (
    puzzle_id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    hint TEXT,
    puzzle_type TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS puzzle_records (
    record_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    puzzle_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    attempts INTEGER DEFAULT 1,
    answer_time INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shares (
    share_id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    share_type TEXT DEFAULT 'public',
    password TEXT,
    is_active INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS parent_settings (
    setting_id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL,
    child_id TEXT NOT NULL,
    daily_time_limit INTEGER DEFAULT 60,
    time_slots TEXT,
    content_filter INTEGER DEFAULT 1,
    age_rating TEXT DEFAULT 'all',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_logs (
    log_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_detail TEXT,
    duration INTEGER,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_characters_creator ON characters(creator_id);
CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_book_roles_book ON book_roles(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_puzzles_chapter ON puzzles(chapter_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_records_user ON puzzle_records(user_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_records_puzzle ON puzzle_records(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_shares_book ON shares(book_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON usage_logs(created_at);
`;

async function initializeDatabase(db) {
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
        if (statement.trim()) {
            await db.prepare(statement).run();
        }
    }
}

const presetCharacters = [
    { character_id: 'preset_batman', name: '乐高蝙蝠侠', description: '哥谭暗夜骑士', personality: '勇敢、正义、严肃', speaking_style: '低沉有力' },
    { character_id: 'preset_spiderman', name: '乐高蜘蛛侠', description: '友好邻居英雄', personality: '活泼、幽默、善良', speaking_style: '轻松俏皮' },
    { character_id: 'preset_naruto', name: '乐高火影忍者', description: '忍者村忍者', personality: '热血、坚韧、乐观', speaking_style: '充满干劲' },
    { character_id: 'preset_dinosaur', name: '乐高恐龙', description: '史前巨兽', personality: '威猛、古老、神秘', speaking_style: '低沉咆哮' },
    { character_id: 'preset_princess', name: '乐高公主', description: '童话王国', personality: '优雅、善良、勇敢', speaking_style: '温柔甜美' },
    { character_id: 'preset_knight', name: '乐高骑士', description: '中世纪战士', personality: '忠诚、勇敢、正直', speaking_style: '庄重有力' },
    { character_id: 'preset_wizard', name: '乐高巫师', description: '魔法大师', personality: '智慧、神秘、慈祥', speaking_style: '古老深奥' },
    { character_id: 'preset_astronaut', name: '乐高宇航员', description: '太空探索者', personality: '好奇、勇敢、科学', speaking_style: '专业冷静' },
    { character_id: 'preset_pirate', name: '乐高海盗', description: '七海冒险家', personality: '豪爽、自由、机智', speaking_style: '粗犷豪迈' },
    { character_id: 'preset_elf', name: '乐高精灵', description: '森林守护者', personality: '敏捷、聪慧、友善', speaking_style: '清脆悦耳' },
    { character_id: 'preset_robot', name: '乐高机器人', description: '未来科技', personality: '精确、理性、忠诚', speaking_style: '机械平稳' },
    { character_id: 'preset_superman', name: '乐高超人', description: '氪星之子', personality: '正义、无私、强大', speaking_style: '坚定有力' }
];

async function seedPresetCharacters(db) {
    const now = Date.now();
    for (const char of presetCharacters) {
        await db.prepare(`
            INSERT OR IGNORE INTO characters 
            (character_id, name, image_base64, description, personality, speaking_style, creator_id, is_preset, created_at, updated_at)
            VALUES (?, ?, 'base64_image_placeholder', ?, ?, ?, 'system', 1, ?, ?)
        `).bind(char.character_id, char.name, char.description, char.personality, char.speaking_style, now, now).run();
    }
}

async function seedTestData(db) {
    const now = Date.now();
    
    await db.prepare(`
        INSERT OR IGNORE INTO users (user_id, username, password_hash, role, created_at, updated_at)
        VALUES ('test_user_1', 'testuser', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'child', ?, ?)
    `).bind(now, now).run();
    
    await db.prepare(`
        INSERT OR IGNORE INTO users (user_id, username, password_hash, role, created_at, updated_at)
        VALUES ('test_parent_1', 'testparent', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'parent', ?, ?)
    `).bind(now, now).run();
    
    await db.prepare(`
        INSERT OR IGNORE INTO books (book_id, user_id, title, chapter_count, status, created_at, updated_at)
        VALUES ('test_book_1', 'test_user_1', '测试书籍', 0, 'active', ?, ?)
    `).bind(now, now).run();
}

module.exports = {
    initializeDatabase,
    seedPresetCharacters,
    seedTestData,
    presetCharacters
};
