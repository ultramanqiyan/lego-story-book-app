# 章节管理子系统设计文档

## 1. 子系统概述

章节管理子系统负责章节的创建、查询、删除等功能，是故事内容的核心存储单元。

## 2. 功能模块

### 2.1 章节创建模块

#### 2.1.1 创建章节
- 函数名：`createChapter(chapterData)`
- 输入：书籍ID、章节号、标题、内容、谜题数据
- 输出：章节ID
- 流程：
  1. 验证书籍存在
  2. 检查章节数量限制（最多100章）
  3. 生成章节ID
  4. 插入章节记录
  5. 如有谜题，创建谜题记录
  6. 更新书籍章节数量
  7. 返回章节ID

#### 2.1.2 章节号自动递增
- 根据书籍当前章节数量自动计算
- 格式：第1章、第2章...

#### 2.1.3 章节名称自动生成
- 由AI生成
- 从故事内容中提取关键元素
- 格式：4-10个字

### 2.2 章节查询模块

#### 2.2.1 获取书籍章节列表
- 函数名：`getChaptersByBookId(bookId, page, pageSize)`
- 输入：书籍ID、页码、每页数量
- 输出：章节列表（分页）
- 流程：
  1. 验证书籍存在
  2. 查询章节列表
  3. 按章节号排序
  4. 分页返回结果

#### 2.2.2 获取章节详情
- 函数名：`getChapterById(chapterId)`
- 输入：章节ID
- 输出：章节详情（含谜题）
- 流程：
  1. 查询章节信息
  2. 如有谜题，查询谜题信息
  3. 返回完整信息

#### 2.2.3 获取最新章节
- 函数名：`getLatestChapter(bookId)`
- 输入：书籍ID
- 输出：最新章节信息
- 流程：
  1. 查询书籍最新章节
  2. 返回章节信息

### 2.3 章节删除模块

#### 2.3.1 删除章节
- 函数名：`deleteChapter(chapterId)`
- 输入：章节ID
- 输出：成功/失败
- 流程：
  1. 验证章节存在
  2. 删除关联谜题
  3. 删除答题记录
  4. 删除章节记录
  5. 更新书籍章节数量
  6. 返回成功

### 2.4 章节状态管理

#### 2.4.1 章节状态
- 已发布：保存到书籍
- 待解密：包含谜题，等待用户解答

#### 2.4.2 检查章节状态
- 函数名：`checkChapterStatus(chapterId, userId)`
- 输入：章节ID、用户ID
- 输出：章节状态
- 流程：
  1. 查询章节是否有谜题
  2. 如有谜题，检查答题记录
  3. 返回状态

## 3. 章节数量限制

### 3.1 限制规则
- 单本书籍最多100章
- 达到上限后提示创建新书籍
- 章节列表分页加载，每页20章

### 3.2 检查函数
```javascript
async function checkChapterLimit(db, bookId) {
    const book = await getBookById(db, bookId);
    if (!book) {
        return { valid: false, error: '书籍不存在' };
    }
    if (book.chapter_count >= 100) {
        return { 
            valid: false, 
            error: '本书籍已达章节上限，请创建新书籍' 
        };
    }
    return { valid: true };
}
```

## 4. API接口设计

### 4.1 获取书籍章节列表
```
GET /api/chapters/book/:bookId?page=1&pageSize=20
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "chapters": [
    {
      "chapter_id": "string",
      "chapter_number": 1,
      "title": "string",
      "content": "string",
      "has_puzzle": true,
      "created_at": number
    }
  ],
  "total": number,
  "page": number,
  "pageSize": number
}
```

### 4.2 获取章节详情
```
GET /api/chapters/:id
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "chapter": {
    "chapter_id": "string",
    "book_id": "string",
    "chapter_number": 1,
    "title": "string",
    "content": "string",
    "has_puzzle": true,
    "puzzle": {
      "puzzle_id": "string",
      "question": "string",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "hint": "string",
      "type": "string"
    },
    "prompt_used": "string",
    "created_at": number
  }
}
```

### 4.3 删除章节
```
DELETE /api/chapters/:id
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true
}
```

## 5. 数据库操作函数

### 5.1 章节操作 (functions/db/chapters.js)

```javascript
export async function getChapterById(db, chapterId) {
    const sql = `SELECT * FROM chapters WHERE chapter_id = ?`;
    const result = await db.prepare(sql).bind(chapterId).first();
    return result;
}

export async function getChaptersByBookId(db, bookId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM chapters WHERE book_id = ?`;
    const countResult = await db.prepare(countSql).bind(bookId).first();
    
    const sql = `
        SELECT chapter_id, chapter_number, title, 
               SUBSTR(content, 1, 100) as content_preview, 
               has_puzzle, created_at
        FROM chapters 
        WHERE book_id = ?
        ORDER BY chapter_number ASC
        LIMIT ? OFFSET ?
    `;
    const result = await db.prepare(sql).bind(bookId, pageSize, offset).all();
    
    return {
        chapters: result.results,
        total: countResult.total,
        page: page,
        pageSize: pageSize
    };
}

export async function getLatestChapter(db, bookId) {
    const sql = `
        SELECT * FROM chapters 
        WHERE book_id = ?
        ORDER BY chapter_number DESC
        LIMIT 1
    `;
    const result = await db.prepare(sql).bind(bookId).first();
    return result;
}

export async function createChapter(db, chapterData) {
    const sql = `
        INSERT INTO chapters (chapter_id, book_id, chapter_number, title, content, has_puzzle, prompt_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.prepare(sql).bind(
        chapterData.chapter_id,
        chapterData.book_id,
        chapterData.chapter_number,
        chapterData.title,
        chapterData.content,
        chapterData.has_puzzle,
        chapterData.prompt_used,
        chapterData.created_at
    ).run();
    return chapterData.chapter_id;
}

export async function deleteChapter(db, chapterId) {
    const sql = `DELETE FROM chapters WHERE chapter_id = ?`;
    await db.prepare(sql).bind(chapterId).run();
}

export async function getChapterCount(db, bookId) {
    const sql = `SELECT COUNT(*) as count FROM chapters WHERE book_id = ?`;
    const result = await db.prepare(sql).bind(bookId).first();
    return result.count;
}

export async function getChapterWithPuzzle(db, chapterId) {
    const chapter = await getChapterById(db, chapterId);
    if (!chapter) return null;
    
    if (chapter.has_puzzle) {
        const puzzle = await getPuzzleByChapterId(db, chapterId);
        chapter.puzzle = puzzle;
    }
    
    return chapter;
}
```

## 6. 章节阅读界面设计

### 6.1 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│                    章节阅读界面                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 书籍名称：乐高冒险故事                                │   │
│  │ 第3章：神秘的森林                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 故事内容区域                                         │   │
│  │                                                       │   │
│  │ 小蝙蝠和蜘蛛侠阿明来到了一片神秘的森林。              │   │
│  │ 树木高耸入云，阳光透过树叶洒下斑驳的光影。            │   │
│  │                                                       │   │
│  │ "这里好安静啊，"阿明说道，"我们要找的宝藏            │   │
│  │ 就在这里吗？"                                         │   │
│  │                                                       │   │
│  │ 小蝙蝠点了点头："根据地图，宝藏就在森林深处..."       │   │
│  │                                                       │   │
│  │ [谜题区域 - 如果有谜题]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 提示词展示区域（可折叠）                              │   │
│  │ [展开/收起]                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 章节导航                                             │   │
│  │ [上一章]  第3章/共10章  [下一章] / [继续生成故事]    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 章节导航逻辑

```javascript
class ChapterNavigation {
    constructor(bookId, currentChapter, totalChapters) {
        this.bookId = bookId;
        this.currentChapter = currentChapter;
        this.totalChapters = totalChapters;
    }
    
    getPreviousChapterUrl() {
        if (this.currentChapter <= 1) return null;
        return `/book?id=${this.bookId}&chapter=${this.currentChapter - 1}`;
    }
    
    getNextChapterUrl() {
        if (this.currentChapter >= this.totalChapters) return null;
        return `/book?id=${this.bookId}&chapter=${this.currentChapter + 1}`;
    }
    
    getContinueStoryUrl() {
        if (this.currentChapter < this.totalChapters) return null;
        return `/story-create?bookId=${this.bookId}`;
    }
    
    renderNavigation() {
        const prevBtn = this.getPreviousChapterUrl() 
            ? `<a href="${this.getPreviousChapterUrl()}" class="nav-btn">上一章</a>`
            : `<span class="nav-btn disabled">上一章</span>`;
        
        const nextBtn = this.getNextChapterUrl()
            ? `<a href="${this.getNextChapterUrl()}" class="nav-btn">下一章</a>`
            : (this.currentChapter === this.totalChapters
                ? `<a href="${this.getContinueStoryUrl()}" class="nav-btn primary">继续生成故事</a>`
                : `<span class="nav-btn disabled">下一章</span>`);
        
        return `
            <div class="chapter-nav">
                ${prevBtn}
                <span class="chapter-info">第${this.currentChapter}章/共${this.totalChapters}章</span>
                ${nextBtn}
            </div>
        `;
    }
}
```

## 7. 提示词展示功能

### 7.1 展示内容
- 书籍角色信息（名称、性格、说话方式）
- 前情提要（如有）
- 本章角色
- 本章情节

### 7.2 折叠组件

```javascript
class PromptDisplay {
    constructor(promptUsed) {
        this.promptUsed = promptUsed;
        this.isExpanded = false;
    }
    
    toggle() {
        this.isExpanded = !this.isExpanded;
        this.render();
    }
    
    render() {
        const container = document.getElementById('prompt-container');
        
        if (this.isExpanded) {
            container.innerHTML = `
                <div class="prompt-header" onclick="promptDisplay.toggle()">
                    <span>📝 提示词详情</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="prompt-content">
                    <pre>${this.formatPrompt(this.promptUsed)}</pre>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="prompt-header" onclick="promptDisplay.toggle()">
                    <span>📝 提示词详情</span>
                    <span class="toggle-icon">▶</span>
                </div>
            `;
        }
    }
    
    formatPrompt(prompt) {
        return prompt
            .replace(/【([^】]+)】/g, '\n【$1】')
            .replace(/\\n/g, '\n');
    }
}
```

## 8. 错误处理

| 错误码 | 说明 |
|--------|------|
| CHAPTER_001 | 章节不存在 |
| CHAPTER_002 | 书籍章节数已达上限 |
| CHAPTER_003 | 无权限访问此章节 |
| CHAPTER_004 | 章节创建失败 |
| CHAPTER_005 | 章节删除失败 |

## 9. 文件结构

```
functions/
├── api/
│   └── chapters/
│       ├── book/
│       │   └── [bookId].js  - 获取书籍章节列表
│       └── [id].js          - 章节详情/删除
├── db/
│   └── chapters.js          - 章节数据库操作
└── services/
    └── chapterValidator.js  - 章节验证服务
```
