# 书籍管理子系统设计文档

## 1. 子系统概述

书籍管理子系统负责书籍的创建、查询、更新、删除等功能，是故事创作的核心组织单元。

## 2. 功能模块

### 2.1 书籍创建模块

#### 2.1.1 创建书籍
- 函数名：`createBook(userId, bookData)`
- 输入：用户ID、书籍数据
- 输出：书籍ID
- 流程：
  1. 验证用户ID
  2. 验证书籍名称（必填）
  3. 生成书籍ID
  4. 插入书籍记录
  5. 返回书籍ID

#### 2.1.2 书籍名称验证
- 必填
- 长度限制：1-50字符
- 不含敏感词

### 2.2 书籍查询模块

#### 2.2.1 获取用户书籍列表
- 函数名：`getBooksByUserId(userId, status)`
- 输入：用户ID、状态过滤
- 输出：书籍列表
- 流程：
  1. 验证用户ID
  2. 查询书籍列表
  3. 按创建时间倒序
  4. 返回列表

#### 2.2.2 获取书籍详情
- 函数名：`getBookById(bookId)`
- 输入：书籍ID
- 输出：书籍详情
- 流程：
  1. 查询书籍信息
  2. 查询章节数量
  3. 查询角色列表
  4. 返回完整信息

#### 2.2.3 获取书籍列表（分页）
- 函数名：`getBooksPaginated(userId, page, pageSize)`
- 输入：用户ID、页码、每页数量
- 输出：书籍列表（分页）
- 流程：
  1. 计算偏移量
  2. 查询总数
  3. 查询分页数据
  4. 返回结果

### 2.3 书籍更新模块

#### 2.3.1 更新书籍信息
- 函数名：`updateBook(bookId, bookData)`
- 输入：书籍ID、更新数据
- 输出：成功/失败
- 流程：
  1. 验证书籍存在
  2. 更新指定字段
  3. 返回成功

#### 2.3.2 更新章节数量
- 函数名：`updateBookChapterCount(bookId, count)`
- 输入：书籍ID、章节数量
- 输出：成功/失败

### 2.4 书籍删除模块

#### 2.4.1 删除书籍
- 函数名：`deleteBook(bookId)`
- 输入：书籍ID
- 输出：成功/失败
- 流程：
  1. 验证书籍存在
  2. 标记为"已归档"（软删除）
  3. 记录归档时间
  4. 返回成功

#### 2.4.2 归档规则
- 删除时标记为"已归档"而非物理删除
- 归档数据保留30天
- 可从回收站恢复
- 30天后自动永久删除

#### 2.4.3 恢复书籍
- 函数名：`restoreBook(bookId)`
- 输入：书籍ID
- 输出：成功/失败
- 流程：
  1. 验证书籍在回收站
  2. 恢复为"active"状态
  3. 返回成功

#### 2.4.4 永久删除书籍
- 函数名：`permanentDeleteBook(bookId)`
- 输入：书籍ID
- 输出：成功/失败
- 流程：
  1. 删除关联章节
  2. 删除关联角色
  3. 删除关联分享
  4. 删除书籍记录
  5. 返回成功

### 2.5 书籍角色管理模块

#### 2.5.1 获取书籍角色
- 见角色管理子系统

#### 2.5.2 添加书籍角色
- 见角色管理子系统

#### 2.5.3 删除书籍角色
- 见角色管理子系统

## 3. 书籍状态管理

### 3.1 状态定义
- active：正常状态
- archived：已归档

### 3.2 状态转换
```
创建 → active → 删除 → archived → 30天后 → 永久删除
                ↑______________|
                     恢复
```

## 4. API接口设计

### 4.1 获取书籍列表
```
GET /api/books?page=1&pageSize=20&status=active
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "books": [
    {
      "book_id": "string",
      "title": "string",
      "chapter_count": 5,
      "cover_image": "string",
      "created_at": number,
      "updated_at": number
    }
  ],
  "total": number,
  "page": number,
  "pageSize": number
}
```

### 4.2 获取书籍详情
```
GET /api/books/:id
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "book": {
    "book_id": "string",
    "user_id": "string",
    "title": "string",
    "chapter_count": 5,
    "cover_image": "string",
    "status": "active",
    "created_at": number,
    "updated_at": number,
    "roles": [
      {
        "role_id": "string",
        "character_id": "string",
        "custom_name": "string",
        "role_type": "string",
        "is_protagonist": true
      }
    ]
  }
}
```

### 4.3 创建书籍
```
POST /api/books
Headers:
  Authorization: Bearer {token}
Request:
{
  "title": "string",
  "cover_image": "string" // 可选
}
Response:
{
  "success": true,
  "book_id": "string"
}
```

### 4.4 更新书籍
```
PUT /api/books/:id
Headers:
  Authorization: Bearer {token}
Request:
{
  "title": "string",
  "cover_image": "string"
}
Response:
{
  "success": true
}
```

### 4.5 删除书籍
```
DELETE /api/books/:id
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "message": "书籍已移至回收站，30天后将永久删除"
}
```

### 4.6 恢复书籍
```
POST /api/books/:id/restore
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true
}
```

### 4.7 获取回收站书籍
```
GET /api/books/trash
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "books": [
    {
      "book_id": "string",
      "title": "string",
      "archived_at": number,
      "days_remaining": 15
    }
  ]
}
```

## 5. 数据库操作函数

### 5.1 书籍操作 (functions/db/books.js)

```javascript
export async function getBookById(db, bookId) {
    const sql = `SELECT * FROM books WHERE book_id = ?`;
    const result = await db.prepare(sql).bind(bookId).first();
    return result;
}

export async function getBooksByUserId(db, userId, status = 'active', page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM books WHERE user_id = ? AND status = ?`;
    const countResult = await db.prepare(countSql).bind(userId, status).first();
    
    const sql = `
        SELECT * FROM books 
        WHERE user_id = ? AND status = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `;
    const result = await db.prepare(sql).bind(userId, status, pageSize, offset).all();
    
    return {
        books: result.results,
        total: countResult.total,
        page: page,
        pageSize: pageSize
    };
}

export async function createBook(db, bookData) {
    const sql = `
        INSERT INTO books (book_id, user_id, title, chapter_count, cover_image, status, created_at, updated_at)
        VALUES (?, ?, ?, 0, ?, 'active', ?, ?)
    `;
    const now = Date.now();
    await db.prepare(sql).bind(
        bookData.book_id,
        bookData.user_id,
        bookData.title,
        bookData.cover_image || null,
        now,
        now
    ).run();
    return bookData.book_id;
}

export async function updateBook(db, bookId, bookData) {
    const fields = [];
    const values = [];
    
    if (bookData.title) {
        fields.push('title = ?');
        values.push(bookData.title);
    }
    if (bookData.cover_image !== undefined) {
        fields.push('cover_image = ?');
        values.push(bookData.cover_image);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(bookId);
    
    const sql = `UPDATE books SET ${fields.join(', ')} WHERE book_id = ?`;
    await db.prepare(sql).bind(...values).run();
}

export async function updateBookChapterCount(db, bookId, count) {
    const sql = `UPDATE books SET chapter_count = ?, updated_at = ? WHERE book_id = ?`;
    await db.prepare(sql).bind(count, Date.now(), bookId).run();
}

export async function archiveBook(db, bookId) {
    const sql = `UPDATE books SET status = 'archived', archived_at = ?, updated_at = ? WHERE book_id = ?`;
    const now = Date.now();
    await db.prepare(sql).bind(now, now, bookId).run();
}

export async function restoreBook(db, bookId) {
    const sql = `UPDATE books SET status = 'active', archived_at = NULL, updated_at = ? WHERE book_id = ?`;
    await db.prepare(sql).bind(Date.now(), bookId).run();
}

export async function deleteBook(db, bookId) {
    const sql = `DELETE FROM books WHERE book_id = ?`;
    await db.prepare(sql).bind(bookId).run();
}

export async function getArchivedBooks(db, userId) {
    const sql = `
        SELECT *, 
               (30 - CAST((? - archived_at) / 86400000.0 AS INTEGER)) as days_remaining
        FROM books 
        WHERE user_id = ? AND status = 'archived'
        ORDER BY archived_at DESC
    `;
    const result = await db.prepare(sql).bind(Date.now(), userId).all();
    return result.results;
}

export async function getExpiredArchivedBooks(db) {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const sql = `
        SELECT * FROM books 
        WHERE status = 'archived' AND archived_at < ?
    `;
    const result = await db.prepare(sql).bind(thirtyDaysAgo).all();
    return result.results;
}
```

## 6. 书架页面设计

### 6.1 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│                    书架页面                                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 我的书籍                                    [+ 新书籍] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │ [封面]  │ │ [封面]  │ │ [封面]  │ │ [封面]  │         │
│  │         │ │         │ │         │ │         │         │
│  │ 书名1   │ │ 书名2   │ │ 书名3   │ │ 书名4   │         │
│  │ 5章     │ │ 10章    │ │ 3章     │ │ 8章     │         │
│  │ [阅读]  │ │ [阅读]  │ │ [阅读]  │ │ [阅读]  │         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 回收站 (3本书)                                       │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ 书名A - 剩余15天  [恢复] [永久删除]              │ │   │
│  │ │ 书名B - 剩余10天  [恢复] [永久删除]              │ │   │
│  │ │ 书名C - 剩余5天   [恢复] [永久删除]              │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [1] [2] [3] ... [10]                                      │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 书籍卡片组件

```javascript
class BookCard {
    constructor(book) {
        this.book = book;
    }
    
    render() {
        return `
            <div class="book-card" data-book-id="${this.book.book_id}">
                <div class="book-cover">
                    ${this.book.cover_image 
                        ? `<img src="${this.book.cover_image}" alt="${this.book.title}">`
                        : `<div class="default-cover">📚</div>`
                    }
                </div>
                <div class="book-info">
                    <h3 class="book-title">${this.book.title}</h3>
                    <p class="book-chapters">${this.book.chapter_count}章</p>
                </div>
                <div class="book-actions">
                    <button class="btn-read" onclick="openBook('${this.book.book_id}')">
                        阅读
                    </button>
                    <button class="btn-edit" onclick="editBook('${this.book.book_id}')">
                        编辑
                    </button>
                    <button class="btn-delete" onclick="deleteBook('${this.book.book_id}')">
                        删除
                    </button>
                </div>
            </div>
        `;
    }
}
```

## 7. 书籍详情页面设计

### 7.1 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│                    书籍详情页面                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 书籍信息                                             │   │
│  │ ┌────┐                                              │   │
│  │ │封面│  书名：乐高冒险故事                           │   │
│  │ │    │  章节数：10章                                │   │
│  │ └────┘  创建时间：2024-01-01                        │   │
│  │                                                       │   │
│  │  [编辑书名] [管理角色] [分享] [删除]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 章节列表                                             │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ 第1章：开始冒险     [阅读]                       │ │   │
│  │ │ 第2章：神秘森林     [阅读] 🔒                   │ │   │
│  │ │ 第3章：古老城堡     [阅读]                       │ │   │
│  │ │ ...                                             │ │   │
│  │ │ 第10章：最终对决   [阅读]                        │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │ [继续生成故事]                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 角色管理                                             │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ [图片] 小蝙蝠 (主角) - 乐高蝙蝠侠               │ │   │
│  │ │ [图片] 阿明 (配角) - 乐高蜘蛛侠                 │ │   │
│  │ │ [+ 添加角色]                                    │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 8. 书籍选择步骤设计

### 8.1 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│                    书籍选择步骤                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 选择书籍                                             │   │
│  │                                                       │   │
│  │ ○ 创建新书籍                                         │   │
│  │   ┌─────────────────────────────────────────────┐   │   │
│  │   │ 书名：[____________________]                │   │   │
│  │   └─────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │ ○ 选择已有书籍续写                                   │   │
│  │   ┌─────────────────────────────────────────────┐   │   │
│  │   │ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │   │
│  │   │ │ 书名1   │ │ 书名2   │ │ 书名3   │       │   │   │
│  │   │ │ 5章     │ │ 10章    │ │ 3章     │       │   │   │
│  │   │ └─────────┘ └─────────┘ └─────────┘       │   │   │
│  │   └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [上一步]                                        [下一步]   │
└─────────────────────────────────────────────────────────────┘
```

## 9. 错误处理

| 错误码 | 说明 |
|--------|------|
| BOOK_001 | 书籍不存在 |
| BOOK_002 | 书籍名称不能为空 |
| BOOK_003 | 书籍名称超过50字符 |
| BOOK_004 | 无权限操作此书籍 |
| BOOK_005 | 书籍已在回收站 |
| BOOK_006 | 书籍不在回收站 |
| BOOK_007 | 书籍创建失败 |

## 10. 文件结构

```
functions/
├── api/
│   └── books/
│       ├── index.js         - 书籍列表API
│       ├── [id].js          - 书籍详情/更新/删除API
│       ├── create.js        - 创建书籍API
│       ├── restore.js       - 恢复书籍API
│       ├── trash.js         - 回收站API
│       └── [id]/
│           └── roles/       - 书籍角色API
├── db/
│   └── books.js             - 书籍数据库操作
└── services/
    └── bookValidator.js     - 书籍验证服务
```
