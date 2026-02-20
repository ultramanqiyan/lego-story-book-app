# 角色管理子系统设计文档

## 1. 子系统概述

角色管理子系统负责书籍角色的管理，包括角色分配、自定义名称、角色类型设置等功能。

## 2. 功能模块

### 2.1 角色类型模块

#### 2.1.1 角色类型定义
- 主人公（protagonist）：必须有且仅有一个
- 配角（supporting）：可以有多个
- 反派（villain）：可选
- 路人（passerby）：可选

#### 2.1.2 角色类型验证
- 函数名：`validateRoleType(roleType)`
- 输入：角色类型
- 输出：有效/无效
- 规则：必须是上述四种类型之一

### 2.2 角色分配模块

#### 2.2.1 添加书籍角色
- 函数名：`addBookRole(bookId, characterId, customName, roleType)`
- 输入：书籍ID、人仔ID、自定义名称、角色类型
- 输出：角色ID
- 流程：
  1. 验证书籍存在
  2. 验证人仔存在
  3. 验证自定义名称（1-20字符，书籍内唯一）
  4. 如果是主角，检查是否已有主角
  5. 创建角色记录
  6. 返回角色ID

#### 2.2.2 更新书籍角色
- 函数名：`updateBookRole(bookId, roleId, updateData)`
- 输入：书籍ID、角色ID、更新数据
- 输出：成功/失败
- 流程：
  1. 验证角色存在
  2. 如果更新自定义名称，验证唯一性
  3. 如果更换主角，处理原主角
  4. 更新角色记录
  5. 返回成功

#### 2.2.3 删除书籍角色
- 函数名：`deleteBookRole(bookId, roleId)`
- 输入：书籍ID、角色ID
- 输出：成功/失败
- 流程：
  1. 验证角色存在
  2. 检查是否被章节引用
  3. 如被引用，标记为"已删除角色"
  4. 删除角色记录
  5. 返回成功

#### 2.2.4 获取书籍角色列表
- 函数名：`getBookRoles(bookId)`
- 输入：书籍ID
- 输出：角色列表
- 流程：
  1. 验证书籍存在
  2. 查询角色列表
  3. 关联人仔信息
  4. 返回列表

### 2.3 自定义名称模块

#### 2.3.1 验证自定义名称
- 函数名：`validateCustomName(bookId, customName, excludeRoleId)`
- 输入：书籍ID、自定义名称、排除的角色ID（更新时）
- 输出：有效/无效
- 规则：
  - 长度：1-20字符
  - 书籍内唯一
  - 不含特殊字符

#### 2.3.2 检查名称唯一性
- 函数名：`checkCustomNameUnique(bookId, customName, excludeRoleId)`
- 输入：书籍ID、自定义名称、排除的角色ID
- 输出：唯一/重复
- 流程：
  1. 查询书籍内同名角色
  2. 排除当前角色（更新时）
  3. 返回结果

### 2.4 主角管理模块

#### 2.4.1 设置主角
- 函数名：`setProtagonist(bookId, roleId)`
- 输入：书籍ID、角色ID
- 输出：成功/失败
- 流程：
  1. 验证角色存在
  2. 取消原主角标记
  3. 设置新主角标记
  4. 记录主角更换历史
  5. 返回成功

#### 2.4.2 获取当前主角
- 函数名：`getCurrentProtagonist(bookId)`
- 输入：书籍ID
- 输出：主角角色信息
- 流程：
  1. 查询is_protagonist=1的角色
  2. 返回角色信息

## 3. API接口设计

### 3.1 获取书籍角色列表
```
GET /api/books/:id/roles
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "roles": [
    {
      "role_id": "string",
      "character_id": "string",
      "character_name": "string",
      "character_image": "string",
      "custom_name": "string",
      "role_type": "string",
      "is_protagonist": boolean,
      "personality": "string",
      "speaking_style": "string"
    }
  ]
}
```

### 3.2 添加书籍角色
```
POST /api/books/:id/roles
Headers:
  Authorization: Bearer {token}
Request:
{
  "character_id": "string",
  "custom_name": "string",
  "role_type": "string"
}
Response:
{
  "success": true,
  "role_id": "string"
}
```

### 3.3 更新书籍角色
```
PUT /api/books/:id/roles/:roleId
Headers:
  Authorization: Bearer {token}
Request:
{
  "custom_name": "string",
  "role_type": "string"
}
Response:
{
  "success": true
}
```

### 3.4 删除书籍角色
```
DELETE /api/books/:id/roles/:roleId
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "warning": "string" // 如果被章节引用
}
```

## 4. 数据库操作函数

### 4.1 角色操作 (functions/db/book_roles.js)

```javascript
export async function getBookRoles(db, bookId) {
    const sql = `
        SELECT br.*, c.name as character_name, c.image_base64 as character_image,
               c.personality, c.speaking_style, c.description
        FROM book_roles br
        JOIN characters c ON br.character_id = c.character_id
        WHERE br.book_id = ?
        ORDER BY br.is_protagonist DESC, br.created_at ASC
    `;
    const result = await db.prepare(sql).bind(bookId).all();
    return result.results;
}

export async function getBookRoleById(db, roleId) {
    const sql = `
        SELECT br.*, c.name as character_name, c.image_base64 as character_image,
               c.personality, c.speaking_style
        FROM book_roles br
        JOIN characters c ON br.character_id = c.character_id
        WHERE br.role_id = ?
    `;
    const result = await db.prepare(sql).bind(roleId).first();
    return result;
}

export async function createBookRole(db, roleData) {
    const sql = `
        INSERT INTO book_roles (role_id, book_id, character_id, custom_name, role_type, is_protagonist, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const now = Date.now();
    const isProtagonist = roleData.role_type === 'protagonist' ? 1 : 0;
    await db.prepare(sql).bind(
        roleData.role_id,
        roleData.book_id,
        roleData.character_id,
        roleData.custom_name,
        roleData.role_type,
        isProtagonist,
        now,
        now
    ).run();
    return roleData.role_id;
}

export async function updateBookRole(db, roleId, roleData) {
    const fields = [];
    const values = [];
    
    if (roleData.custom_name) {
        fields.push('custom_name = ?');
        values.push(roleData.custom_name);
    }
    if (roleData.role_type) {
        fields.push('role_type = ?');
        fields.push('is_protagonist = ?');
        values.push(roleData.role_type);
        values.push(roleData.role_type === 'protagonist' ? 1 : 0);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(roleId);
    
    const sql = `UPDATE book_roles SET ${fields.join(', ')} WHERE role_id = ?`;
    await db.prepare(sql).bind(...values).run();
}

export async function deleteBookRole(db, roleId) {
    const sql = `DELETE FROM book_roles WHERE role_id = ?`;
    await db.prepare(sql).bind(roleId).run();
}

export async function checkCustomNameExists(db, bookId, customName, excludeRoleId = null) {
    let sql = `SELECT COUNT(*) as count FROM book_roles WHERE book_id = ? AND custom_name = ?`;
    const params = [bookId, customName];
    
    if (excludeRoleId) {
        sql += ` AND role_id != ?`;
        params.push(excludeRoleId);
    }
    
    const result = await db.prepare(sql).bind(...params).first();
    return result.count > 0;
}

export async function getCurrentProtagonist(db, bookId) {
    const sql = `
        SELECT br.*, c.name as character_name, c.image_base64 as character_image
        FROM book_roles br
        JOIN characters c ON br.character_id = c.character_id
        WHERE br.book_id = ? AND br.is_protagonist = 1
    `;
    const result = await db.prepare(sql).bind(bookId).first();
    return result;
}

export async function clearProtagonist(db, bookId) {
    const sql = `UPDATE book_roles SET is_protagonist = 0, updated_at = ? WHERE book_id = ?`;
    await db.prepare(sql).bind(Date.now(), bookId).run();
}

export async function setProtagonist(db, roleId) {
    const sql = `UPDATE book_roles SET is_protagonist = 1, updated_at = ? WHERE role_id = ?`;
    await db.prepare(sql).bind(Date.now(), roleId).run();
}

export async function checkRoleInChapters(db, roleId) {
    const sql = `
        SELECT COUNT(*) as count FROM chapters 
        WHERE book_id = (SELECT book_id FROM book_roles WHERE role_id = ?)
        AND content LIKE '%' || (SELECT custom_name FROM book_roles WHERE role_id = ?) || '%'
    `;
    const result = await db.prepare(sql).bind(roleId, roleId).first();
    return result.count > 0;
}
```

## 5. 角色选择步骤设计

### 5.1 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│                    角色选择步骤                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 预设人仔区域（网格展示）                               │   │
│  │ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐               │   │
│  │ │   │ │   │ │   │ │   │ │   │ │   │               │   │
│  │ │   │ │   │ │   │ │   │ │   │ │   │               │   │
│  │ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘               │   │
│  │ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐               │   │
│  │ │   │ │   │ │   │ │   │ │   │ │   │               │   │
│  │ │   │ │   │ │   │ │   │ │   │ │   │               │   │
│  │ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 自定义人仔区域                                         │   │
│  │ ┌───┐ ┌───┐ ┌───┐                                   │   │
│  │ │   │ │   │ │   │  [+ 创建人仔]                      │   │
│  │ └───┘ └───┘ └───┘                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 已选角色区域                                           │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ [图片] 人仔名称  [角色类型▼] [自定义名称____]    │ │   │
│  │ │ [图片] 人仔名称  [角色类型▼] [自定义名称____]    │ │   │
│  │ │ [图片] 人仔名称  [角色类型▼] [自定义名称____]    │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [上一步]                                        [下一步]   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 已选角色卡片设计

```
┌─────────────────────────────────────────────────────────────┐
│  ┌────┐                                                    │
│  │图片│  人仔名称（原始名称）                                │
│  │16px│  性格风格标签 | 说话风格标签                         │
│  └────┘                                                    │
│                                                             │
│  角色类型：[主人公 ▼]  自定义名称：[小蝙蝠_____]  [删除]     │
└─────────────────────────────────────────────────────────────┘
```

## 6. 角色自动保存逻辑

### 6.1 实时保存机制
- 修改自定义名称后，延迟500ms自动保存
- 切换角色类型后，立即保存
- 添加/删除角色后，立即保存

### 6.2 保存函数
```javascript
async function autoSaveRole(roleId, field, value) {
    const updateData = {};
    updateData[field] = value;
    await updateBookRole(db, roleId, updateData);
}
```

## 7. 主角更换历史处理

### 7.1 更换流程
```
┌─────────────────────────────────────────────────────────────┐
│                    主角更换流程                              │
├─────────────────────────────────────────────────────────────┤
│  1. 用户选择新主角                                          │
│     ↓                                                       │
│  2. 检查当前主角                                            │
│     ├─ 无主角 → 直接设置新主角                              │
│     └─ 有主角 → 执行更换流程                                │
│         ↓                                                   │
│         取消原主角标记                                       │
│         ↓                                                   │
│         原主角变为配角                                       │
│         ↓                                                   │
│         设置新主角标记                                       │
│         ↓                                                   │
│         新章节使用新主角名称                                 │
│         ↓                                                   │
│         已生成章节保持原主角名称                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 历史记录
- 记录主角更换时间和原主角信息
- 用户可查看主角更换历史

## 8. 错误处理

| 错误码 | 说明 |
|--------|------|
| ROLE_001 | 角色不存在 |
| ROLE_002 | 自定义名称不能为空 |
| ROLE_003 | 自定义名称超过20字符 |
| ROLE_004 | 自定义名称已存在 |
| ROLE_005 | 无效的角色类型 |
| ROLE_006 | 书籍已有主角 |
| ROLE_007 | 角色已在故事中使用 |
| ROLE_008 | 无权限操作此角色 |

## 9. 文件结构

```
functions/
├── api/
│   └── books/
│       └── [id]/
│           └── roles/
│               ├── index.js    - 获取角色列表
│               ├── create.js   - 添加角色
│               ├── update.js   - 更新角色
│               └── delete.js   - 删除角色
├── db/
│   └── book_roles.js           - 角色数据库操作
└── services/
    └── roleValidator.js        - 角色验证服务
```
