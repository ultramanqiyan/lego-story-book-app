# 数据库设计文档

## 1. 数据库概述

使用 Cloudflare D1 数据库（SQLite兼容），存储所有业务数据。

## 2. 数据表设计

### 2.1 用户表 (users)

```sql
CREATE TABLE users (
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
```

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | TEXT | 用户唯一ID，主键 |
| username | TEXT | 用户名，唯一 |
| password_hash | TEXT | 密码哈希 |
| email | TEXT | 邮箱（可选） |
| avatar | TEXT | 头像（base64） |
| role | TEXT | 角色：child/parent |
| parent_id | TEXT | 关联的家长ID |
| created_at | INTEGER | 创建时间戳 |
| updated_at | INTEGER | 更新时间戳 |

### 2.2 人仔表 (characters)

```sql
CREATE TABLE characters (
    character_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_base64 TEXT NOT NULL,
    description TEXT,
    personality TEXT NOT NULL,
    speaking_style TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    is_preset INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(user_id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| character_id | TEXT | 人仔唯一ID，主键 |
| name | TEXT | 人仔名称 |
| image_base64 | TEXT | 图片base64编码 |
| description | TEXT | 人设描述 |
| personality | TEXT | 性格类型 |
| speaking_style | TEXT | 说话方式 |
| creator_id | TEXT | 创建者ID（预设为'system'） |
| is_preset | INTEGER | 是否预设人仔（0/1） |
| created_at | INTEGER | 创建时间戳 |
| updated_at | INTEGER | 更新时间戳 |

### 2.3 书籍表 (books)

```sql
CREATE TABLE books (
    book_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    chapter_count INTEGER DEFAULT 0,
    cover_image TEXT,
    status TEXT DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    archived_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| book_id | TEXT | 书籍唯一ID，主键 |
| user_id | TEXT | 所属用户ID |
| title | TEXT | 书籍名称 |
| chapter_count | INTEGER | 章节数量 |
| cover_image | TEXT | 封面图片（base64） |
| status | TEXT | 状态：active/archived |
| created_at | INTEGER | 创建时间戳 |
| updated_at | INTEGER | 更新时间戳 |
| archived_at | INTEGER | 归档时间戳 |

### 2.4 书籍角色表 (book_roles)

```sql
CREATE TABLE book_roles (
    role_id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    custom_name TEXT NOT NULL,
    role_type TEXT NOT NULL,
    is_protagonist INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (character_id) REFERENCES characters(character_id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| role_id | TEXT | 角色唯一ID，主键 |
| book_id | TEXT | 所属书籍ID |
| character_id | TEXT | 关联人仔ID |
| custom_name | TEXT | 自定义名称 |
| role_type | TEXT | 角色类型：protagonist/supporting/villain/passerby |
| is_protagonist | INTEGER | 是否主角（0/1） |
| created_at | INTEGER | 创建时间戳 |
| updated_at | INTEGER | 更新时间戳 |

### 2.5 章节表 (chapters)

```sql
CREATE TABLE chapters (
    chapter_id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    has_puzzle INTEGER DEFAULT 0,
    prompt_used TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(book_id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| chapter_id | TEXT | 章节唯一ID，主键 |
| book_id | TEXT | 所属书籍ID |
| chapter_number | INTEGER | 章节序号 |
| title | TEXT | 章节名称 |
| content | TEXT | 章节内容 |
| has_puzzle | INTEGER | 是否包含谜题（0/1） |
| prompt_used | TEXT | 使用的提示词 |
| created_at | INTEGER | 创建时间戳 |

### 2.6 谜题表 (puzzles)

```sql
CREATE TABLE puzzles (
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
    created_at INTEGER NOT NULL,
    FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| puzzle_id | TEXT | 谜题唯一ID，主键 |
| chapter_id | TEXT | 所属章节ID |
| question | TEXT | 谜题问题 |
| option_a | TEXT | 选项A |
| option_b | TEXT | 选项B |
| option_c | TEXT | 选项C |
| option_d | TEXT | 选项D |
| correct_answer | TEXT | 正确答案（A/B/C/D） |
| hint | TEXT | 提示内容 |
| puzzle_type | TEXT | 谜题类型：pattern/calculation/common |
| created_at | INTEGER | 创建时间戳 |

### 2.7 答题记录表 (puzzle_records)

```sql
CREATE TABLE puzzle_records (
    record_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    puzzle_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    attempts INTEGER DEFAULT 1,
    answer_time INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| record_id | TEXT | 记录唯一ID，主键 |
| user_id | TEXT | 用户ID |
| puzzle_id | TEXT | 谜题ID |
| chapter_id | TEXT | 章节ID |
| user_answer | TEXT | 用户答案（A/B/C/D） |
| is_correct | INTEGER | 是否正确（0/1） |
| attempts | INTEGER | 尝试次数 |
| answer_time | INTEGER | 答题时间戳 |

### 2.8 分享表 (shares)

```sql
CREATE TABLE shares (
    share_id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    share_type TEXT DEFAULT 'public',
    password TEXT,
    is_active INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    expires_at INTEGER,
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| share_id | TEXT | 分享唯一ID，主键 |
| book_id | TEXT | 书籍ID |
| user_id | TEXT | 创建者ID |
| share_type | TEXT | 分享类型：public/private |
| password | TEXT | 访问密码（私密分享） |
| is_active | INTEGER | 是否有效（0/1） |
| view_count | INTEGER | 浏览次数 |
| created_at | INTEGER | 创建时间戳 |
| expires_at | INTEGER | 过期时间戳 |

### 2.9 家长设置表 (parent_settings)

```sql
CREATE TABLE parent_settings (
    setting_id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL,
    child_id TEXT NOT NULL,
    daily_time_limit INTEGER DEFAULT 60,
    time_slots TEXT,
    content_filter INTEGER DEFAULT 1,
    age_rating TEXT DEFAULT 'all',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES users(user_id),
    FOREIGN KEY (child_id) REFERENCES users(user_id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| setting_id | TEXT | 设置唯一ID，主键 |
| parent_id | TEXT | 家长ID |
| child_id | TEXT | 儿童ID |
| daily_time_limit | INTEGER | 每日时长限制（分钟） |
| time_slots | TEXT | 允许时段（JSON） |
| content_filter | INTEGER | 内容过滤开关（0/1） |
| age_rating | TEXT | 年龄分级 |
| created_at | INTEGER | 创建时间戳 |
| updated_at | INTEGER | 更新时间戳 |

### 2.10 使用日志表 (usage_logs)

```sql
CREATE TABLE usage_logs (
    log_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_detail TEXT,
    duration INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| log_id | TEXT | 日志唯一ID，主键 |
| user_id | TEXT | 用户ID |
| action_type | TEXT | 操作类型 |
| action_detail | TEXT | 操作详情（JSON） |
| duration | INTEGER | 持续时间（秒） |
| created_at | INTEGER | 创建时间戳 |

## 3. 索引设计

```sql
CREATE INDEX idx_characters_creator ON characters(creator_id);
CREATE INDEX idx_books_user ON books(user_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_book_roles_book ON book_roles(book_id);
CREATE INDEX idx_chapters_book ON chapters(book_id);
CREATE INDEX idx_puzzles_chapter ON puzzles(chapter_id);
CREATE INDEX idx_puzzle_records_user ON puzzle_records(user_id);
CREATE INDEX idx_puzzle_records_puzzle ON puzzle_records(puzzle_id);
CREATE INDEX idx_shares_book ON shares(book_id);
CREATE INDEX idx_shares_user ON shares(user_id);
CREATE INDEX idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at);
```

## 4. 预设数据

### 4.1 预设人仔数据

```sql
INSERT INTO characters (character_id, name, image_base64, description, personality, speaking_style, creator_id, is_preset, created_at, updated_at) VALUES
('preset_batman', '乐高蝙蝠侠', '[base64]', '哥谭暗夜骑士', '勇敢、正义、严肃', '低沉有力', 'system', 1, 1700000000, 1700000000),
('preset_spiderman', '乐高蜘蛛侠', '[base64]', '友好邻居英雄', '活泼、幽默、善良', '轻松俏皮', 'system', 1, 1700000000, 1700000000),
('preset_naruto', '乐高火影忍者', '[base64]', '忍者村忍者', '热血、坚韧、乐观', '充满干劲', 'system', 1, 1700000000, 1700000000),
('preset_dinosaur', '乐高恐龙', '[base64]', '史前巨兽', '威猛、古老、神秘', '低沉咆哮', 'system', 1, 1700000000, 1700000000),
('preset_princess', '乐高公主', '[base64]', '童话王国', '优雅、善良、勇敢', '温柔甜美', 'system', 1, 1700000000, 1700000000),
('preset_knight', '乐高骑士', '[base64]', '中世纪战士', '忠诚、勇敢、正直', '庄重有力', 'system', 1, 1700000000, 1700000000),
('preset_wizard', '乐高巫师', '[base64]', '魔法大师', '智慧、神秘、慈祥', '古老深奥', 'system', 1, 1700000000, 1700000000),
('preset_astronaut', '乐高宇航员', '[base64]', '太空探索者', '好奇、勇敢、科学', '专业冷静', 'system', 1, 1700000000, 1700000000),
('preset_pirate', '乐高海盗', '[base64]', '七海冒险家', '豪爽、自由、机智', '粗犷豪迈', 'system', 1, 1700000000, 1700000000),
('preset_elf', '乐高精灵', '[base64]', '森林守护者', '敏捷、聪慧、友善', '清脆悦耳', 'system', 1, 1700000000, 1700000000),
('preset_robot', '乐高机器人', '[base64]', '未来科技', '精确、理性、忠诚', '机械平稳', 'system', 1, 1700000000, 1700000000),
('preset_superman', '乐高超人', '[base64]', '氪星之子', '正义、无私、强大', '坚定有力', 'system', 1, 1700000000, 1700000000);
```

## 5. 数据库操作模块

### 5.1 模块结构

```
functions/
├── db/
│   ├── connection.js     - 数据库连接
│   ├── users.js          - 用户操作
│   ├── characters.js     - 人仔操作
│   ├── books.js          - 书籍操作
│   ├── book_roles.js     - 书籍角色操作
│   ├── chapters.js       - 章节操作
│   ├── puzzles.js        - 谜题操作
│   ├── puzzle_records.js - 答题记录操作
│   ├── shares.js         - 分享操作
│   ├── parent_settings.js- 家长设置操作
│   └── usage_logs.js     - 使用日志操作
```

### 5.2 通用操作函数

```javascript
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
```

## 6. 数据迁移脚本

### 6.1 初始化脚本

```sql
-- schema.sql
-- 创建所有表
-- 见上述表定义
```

### 6.2 种子数据脚本

```sql
-- seed.sql
-- 插入预设人仔数据
-- 见上述预设数据
```
