# 分享管理子系统设计文档

## 1. 子系统概述

分享管理子系统负责故事书籍的分享功能，包括创建分享链接、二维码分享、访问控制等功能。

## 2. 功能模块

### 2.1 分享创建模块

#### 2.1.1 创建分享
- 函数名：`createShare(userId, bookId, shareType, password)`
- 输入：用户ID、书籍ID、分享类型、密码（可选）
- 输出：分享ID、分享链接
- 流程：
  1. 验证用户ID
  2. 验证书籍存在且属于用户
  3. 生成分享ID
  4. 如私密分享，验证密码格式
  5. 创建分享记录
  6. 返回分享信息

#### 2.1.2 分享类型
- 公开分享（public）：任何人可查看
- 私密分享（private）：需要密码查看

#### 2.1.3 密码规则
- 长度：4-6位数字
- 纯数字组成

### 2.2 分享访问模块

#### 2.2.1 访问分享内容
- 函数名：`accessShare(shareId, password)`
- 输入：分享ID、密码（私密分享需要）
- 输出：书籍内容
- 流程：
  1. 查询分享记录
  2. 检查分享是否有效
  3. 如私密分享，验证密码
  4. 增加浏览次数
  5. 返回书籍内容

#### 2.2.2 验证分享密码
- 函数名：`verifySharePassword(shareId, password)`
- 输入：分享ID、密码
- 输出：有效/无效

### 2.3 分享管理模块

#### 2.3.1 获取用户分享列表
- 函数名：`getSharesByUserId(userId)`
- 输入：用户ID
- 输出：分享列表
- 流程：
  1. 查询用户创建的分享
  2. 返回列表

#### 2.3.2 取消分享
- 函数名：`cancelShare(shareId, userId)`
- 输入：分享ID、用户ID
- 输出：成功/失败
- 流程：
  1. 验证分享存在
  2. 验证用户是分享创建者
  3. 标记分享为无效
  4. 返回成功

#### 2.3.3 重新生成分享链接
- 函数名：`regenerateShare(shareId, userId)`
- 输入：分享ID、用户ID
- 输出：新分享ID
- 流程：
  1. 验证分享存在
  2. 验证用户是分享创建者
  3. 创建新分享记录
  4. 标记旧分享无效
  5. 返回新分享信息

## 3. API接口设计

### 3.1 创建分享
```
POST /api/share/create
Headers:
  Authorization: Bearer {token}
Request:
{
  "book_id": "string",
  "share_type": "public" | "private",
  "password": "1234" // 可选，私密分享需要
}
Response:
{
  "success": true,
  "share": {
    "share_id": "string",
    "share_url": "https://xxx.com/share?id=xxx",
    "qr_code_url": "https://xxx.com/api/share/qr/xxx",
    "share_type": "public" | "private"
  }
}
```

### 3.2 访问分享
```
GET /api/share/:shareId?password=1234
Response (公开分享):
{
  "success": true,
  "book": {
    "title": "string",
    "chapters": [...]
  }
}

Response (私密分享 - 无密码):
{
  "success": false,
  "error": "需要密码访问"
}

Response (私密分享 - 密码错误):
{
  "success": false,
  "error": "密码错误"
}
```

### 3.3 获取分享列表
```
GET /api/share/list
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "shares": [
    {
      "share_id": "string",
      "book_id": "string",
      "book_title": "string",
      "share_type": "public" | "private",
      "view_count": 10,
      "is_active": true,
      "created_at": number
    }
  ]
}
```

### 3.4 取消分享
```
DELETE /api/share/:shareId
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true
}
```

### 3.5 重新生成分享链接
```
POST /api/share/:shareId/regenerate
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "share": {
    "share_id": "string",
    "share_url": "https://xxx.com/share?id=xxx"
  }
}
```

## 4. 数据库操作函数

### 4.1 分享操作 (functions/db/shares.js)

```javascript
export async function getShareById(db, shareId) {
    const sql = `SELECT * FROM shares WHERE share_id = ?`;
    const result = await db.prepare(sql).bind(shareId).first();
    return result;
}

export async function getSharesByUserId(db, userId) {
    const sql = `
        SELECT s.*, b.title as book_title
        FROM shares s
        JOIN books b ON s.book_id = b.book_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    `;
    const result = await db.prepare(sql).bind(userId).all();
    return result.results;
}

export async function createShare(db, shareData) {
    const sql = `
        INSERT INTO shares (share_id, book_id, user_id, share_type, password, is_active, view_count, created_at)
        VALUES (?, ?, ?, ?, ?, 1, 0, ?)
    `;
    await db.prepare(sql).bind(
        shareData.share_id,
        shareData.book_id,
        shareData.user_id,
        shareData.share_type,
        shareData.password || null,
        Date.now()
    ).run();
    return shareData.share_id;
}

export async function updateShareViewCount(db, shareId) {
    const sql = `UPDATE shares SET view_count = view_count + 1 WHERE share_id = ?`;
    await db.prepare(sql).bind(shareId).run();
}

export async function deactivateShare(db, shareId) {
    const sql = `UPDATE shares SET is_active = 0 WHERE share_id = ?`;
    await db.prepare(sql).bind(shareId).run();
}

export async function deleteShare(db, shareId) {
    const sql = `DELETE FROM shares WHERE share_id = ?`;
    await db.prepare(sql).bind(shareId).run();
}
```

## 5. 分享页面设计

### 5.1 分享创建弹窗

```
┌─────────────────────────────────────────────────────────────┐
│                    创建分享                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  分享类型：                                                 │
│  ○ 公开分享（任何人可查看）                                 │
│  ○ 私密分享（需要密码查看）                                 │
│                                                             │
│  密码设置（私密分享）：                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [____] (4-6位数字)                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [取消]  [创建分享]             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 分享成功弹窗

```
┌─────────────────────────────────────────────────────────────┐
│                    分享创建成功                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  分享链接：                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ https://xxx.com/share?id=abc123                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  [复制链接]                                                 │
│                                                             │
│  二维码：                                                   │
│  ┌─────────────┐                                           │
│  │   [QR码]    │                                           │
│  │             │                                           │
│  └─────────────┘                                           │
│  [下载二维码]                                               │
│                                                             │
│  访问密码：1234（私密分享）                                 │
│                                                             │
│                              [关闭]                         │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 分享访问页面

```
┌─────────────────────────────────────────────────────────────┐
│                    分享内容                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  书名：乐高冒险故事                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 章节列表                                             │   │
│  │ 第1章：开始冒险                                      │   │
│  │ 第2章：神秘森林                                      │   │
│  │ 第3章：古老城堡                                      │   │
│  │ ...                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [返回书架]                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 密码输入弹窗

```
┌─────────────────────────────────────────────────────────────┐
│                    访问密码                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  此分享需要密码访问                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [______]                                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [取消]  [确认]                 │
└─────────────────────────────────────────────────────────────┘
```

## 6. 二维码生成

### 6.1 二维码API

```javascript
export async function onRequestGet(context) {
    const { shareId } = context.params;
    
    const share = await getShareById(context.env.DB, shareId);
    if (!share || !share.is_active) {
        return new Response('分享不存在', { status: 404 });
    }
    
    const shareUrl = `${new URL(context.request.url).origin}/share?id=${shareId}`;
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    
    const response = await fetch(qrCodeUrl);
    const imageBuffer = await response.arrayBuffer();
    
    return new Response(imageBuffer, {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400'
        }
    });
}
```

## 7. 分享链接格式

### 7.1 链接格式
```
https://xxx.com/share?id={shareId}
```

### 7.2 分享ID格式
- 前缀：share_
- 随机字符串：8位字母数字
- 示例：share_abc12345

## 8. 前端分享功能

### 8.1 分享组件

```javascript
class ShareManager {
    constructor(bookId) {
        this.bookId = bookId;
    }
    
    async createShare(shareType, password = null) {
        const response = await fetch('/api/share/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                book_id: this.bookId,
                share_type: shareType,
                password: password
            })
        });
        
        return await response.json();
    }
    
    async copyShareUrl(shareUrl) {
        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast('链接已复制到剪贴板');
        } catch (err) {
            fallbackCopy(shareUrl);
        }
    }
    
    async downloadQrCode(shareId) {
        const link = document.createElement('a');
        link.href = `/api/share/qr/${shareId}`;
        link.download = `share-${shareId}.png`;
        link.click();
    }
    
    async cancelShare(shareId) {
        const response = await fetch(`/api/share/${shareId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        return await response.json();
    }
}
```

## 9. 错误处理

| 错误码 | 说明 |
|--------|------|
| SHARE_001 | 分享不存在 |
| SHARE_002 | 分享已失效 |
| SHARE_003 | 需要密码访问 |
| SHARE_004 | 密码错误 |
| SHARE_005 | 无权限操作此分享 |
| SHARE_006 | 密码格式错误 |
| SHARE_007 | 书籍不存在 |

## 10. 文件结构

```
functions/
├── api/
│   └── share/
│       ├── create.js        - 创建分享API
│       ├── list.js          - 分享列表API
│       ├── [shareId].js     - 访问分享/取消分享API
│       ├── qr/
│       │   └── [shareId].js - 二维码API
│       └── regenerate/
│           └── [shareId].js - 重新生成分享API
├── db/
│   └── shares.js            - 分享数据库操作
└── services/
    └── shareValidator.js    - 分享验证服务
```
