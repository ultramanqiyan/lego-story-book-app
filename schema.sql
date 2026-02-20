CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    age_range TEXT,
    avatar_url TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE IF NOT EXISTS characters (
    character_id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    is_preset INTEGER DEFAULT 0,
    appearance TEXT,
    personality TEXT,
    avatar_emoji TEXT DEFAULT '👤',
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE IF NOT EXISTS books (
    book_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    theme TEXT NOT NULL,
    age_range TEXT,
    cover_image TEXT,
    total_chapters INTEGER DEFAULT 0,
    read_chapters INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE IF NOT EXISTS book_roles (
    role_id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    role_description TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (character_id) REFERENCES characters(character_id)
);

CREATE TABLE IF NOT EXISTS chapters (
    chapter_id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    is_read INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (book_id) REFERENCES books(book_id)
);

CREATE TABLE IF NOT EXISTS puzzles (
    puzzle_id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    hint TEXT,
    puzzle_type TEXT DEFAULT 'choice',
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
);

CREATE TABLE IF NOT EXISTS puzzle_records (
    record_id TEXT PRIMARY KEY,
    puzzle_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    answer_index INTEGER NOT NULL,
    is_correct INTEGER NOT NULL,
    answered_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS shares (
    share_id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    password TEXT,
    expires_at INTEGER,
    view_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS parent_settings (
    setting_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    daily_time_limit INTEGER DEFAULT 60,
    rest_reminder_interval INTEGER DEFAULT 30,
    content_filter_level TEXT DEFAULT 'standard',
    is_parent_mode INTEGER DEFAULT 0,
    parent_password TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS usage_logs (
    log_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_detail TEXT,
    duration INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_puzzles_chapter ON puzzles(chapter_id);
CREATE INDEX IF NOT EXISTS idx_shares_book ON shares(book_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);

INSERT INTO characters (character_id, name, is_preset, avatar_emoji, personality) VALUES
('preset_1', '小明', 1, '👦', '{"traits": ["勇敢", "好奇"], "description": "一个勇敢的小男孩，喜欢冒险"}'),
('preset_2', '小红', 1, '👧', '{"traits": ["聪明", "善良"], "description": "一个聪明的小女孩，喜欢帮助别人"}'),
('preset_3', '小强', 1, '🧒', '{"traits": ["强壮", "忠诚"], "description": "一个强壮的小男孩，是可靠的朋友"}'),
('preset_4', '小美', 1, '👩', '{"traits": ["优雅", "有创意"], "description": "一个优雅的小女孩，喜欢艺术"}'),
('preset_5', '小智', 1, '🧑', '{"traits": ["智慧", "冷静"], "description": "一个聪明的小孩，善于解决问题"}'),
('preset_6', '小勇', 1, '👦', '{"traits": ["冒险", "热情"], "description": "一个充满活力的小男孩"}');
