# 用户管理子系统设计文档

## 1. 子系统概述

用户管理子系统负责用户身份认证、用户信息管理、会话管理等功能。

## 2. 功能模块

### 2.1 用户认证模块

#### 2.1.1 用户登录
- 函数名：`loginUser(username, password)`
- 输入：用户名、密码
- 输出：用户信息、会话token
- 流程：
  1. 验证用户名格式（非空，1-50字符）
  2. 查询用户是否存在
  3. 验证密码哈希
  4. 生成会话token
  5. 返回用户信息

#### 2.1.2 用户登出
- 函数名：`logoutUser(token)`
- 输入：会话token
- 输出：成功/失败
- 流程：
  1. 验证token有效性
  2. 清除会话
  3. 返回成功

#### 2.1.3 获取当前用户
- 函数名：`getCurrentUser(token)`
- 输入：会话token
- 输出：用户信息
- 流程：
  1. 验证token有效性
  2. 查询用户信息
  3. 返回用户信息

### 2.2 用户信息模块

#### 2.2.1 创建用户
- 函数名：`createUser(userData)`
- 输入：用户名、密码、邮箱（可选）、角色
- 输出：用户ID
- 流程：
  1. 验证用户名唯一性
  2. 密码加密（SHA-256）
  3. 生成用户ID
  4. 插入数据库
  5. 返回用户ID

#### 2.2.2 更新用户信息
- 函数名：`updateUser(userId, userData)`
- 输入：用户ID、更新数据
- 输出：成功/失败
- 流程：
  1. 验证用户存在
  2. 更新指定字段
  3. 返回成功

#### 2.2.3 删除用户
- 函数名：`deleteUser(userId)`
- 输入：用户ID
- 输出：成功/失败
- 流程：
  1. 验证用户存在
  2. 级联删除关联数据
  3. 删除用户记录
  4. 返回成功

### 2.3 会话管理模块

#### 2.3.1 创建会话
- 函数名：`createSession(userId)`
- 输入：用户ID
- 输出：会话token
- 流程：
  1. 生成唯一token
  2. 设置过期时间（24小时）
  3. 存储会话
  4. 返回token

#### 2.3.2 验证会话
- 函数名：`validateSession(token)`
- 输入：会话token
- 输出：用户ID / 无效
- 流程：
  1. 查询会话记录
  2. 检查是否过期
  3. 返回用户ID或无效

#### 2.3.3 销毁会话
- 函数名：`destroySession(token)`
- 输入：会话token
- 输出：成功/失败
- 流程：
  1. 删除会话记录
  2. 返回成功

## 3. API接口设计

### 3.1 登录接口
```
POST /api/auth/login
Request:
{
  "username": "string",
  "password": "string"
}
Response:
{
  "success": true,
  "user": {
    "user_id": "string",
    "username": "string",
    "avatar": "string",
    "role": "string"
  },
  "token": "string"
}
```

### 3.2 登出接口
```
POST /api/auth/logout
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true
}
```

### 3.3 获取当前用户接口
```
GET /api/auth/user
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "user": {
    "user_id": "string",
    "username": "string",
    "avatar": "string",
    "role": "string"
  }
}
```

## 4. 数据库操作函数

### 4.1 用户操作 (functions/db/users.js)

```javascript
export async function getUserById(db, userId) {
    const sql = `SELECT * FROM users WHERE user_id = ?`;
    const result = await db.prepare(sql).bind(userId).first();
    return result;
}

export async function getUserByUsername(db, username) {
    const sql = `SELECT * FROM users WHERE username = ?`;
    const result = await db.prepare(sql).bind(username).first();
    return result;
}

export async function createUser(db, userData) {
    const sql = `
        INSERT INTO users (user_id, username, password_hash, email, avatar, role, parent_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const now = Date.now();
    await db.prepare(sql).bind(
        userData.user_id,
        userData.username,
        userData.password_hash,
        userData.email || null,
        userData.avatar || null,
        userData.role || 'child',
        userData.parent_id || null,
        now,
        now
    ).run();
    return userData.user_id;
}

export async function updateUser(db, userId, userData) {
    const fields = [];
    const values = [];
    
    if (userData.username) {
        fields.push('username = ?');
        values.push(userData.username);
    }
    if (userData.password_hash) {
        fields.push('password_hash = ?');
        values.push(userData.password_hash);
    }
    if (userData.email !== undefined) {
        fields.push('email = ?');
        values.push(userData.email);
    }
    if (userData.avatar !== undefined) {
        fields.push('avatar = ?');
        values.push(userData.avatar);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(userId);
    
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    await db.prepare(sql).bind(...values).run();
}

export async function deleteUser(db, userId) {
    const sql = `DELETE FROM users WHERE user_id = ?`;
    await db.prepare(sql).bind(userId).run();
}
```

## 5. 认证中间件

### 5.1 验证中间件 (functions/middleware/auth.js)

```javascript
export async function requireAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: '未提供认证信息' };
    }
    
    const token = authHeader.substring(7);
    const sessionData = await validateToken(token, env);
    
    if (!sessionData) {
        return { valid: false, error: '无效的认证信息' };
    }
    
    return { valid: true, userId: sessionData.userId };
}

async function validateToken(token, env) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp < Date.now()) return null;
        
        return { userId: payload.userId };
    } catch {
        return null;
    }
}
```

## 6. 错误处理

| 错误码 | 说明 |
|--------|------|
| AUTH_001 | 用户名不存在 |
| AUTH_002 | 密码错误 |
| AUTH_003 | 用户名已存在 |
| AUTH_004 | 未登录 |
| AUTH_005 | 会话已过期 |
| AUTH_006 | 用户名格式错误 |
| AUTH_007 | 密码格式错误 |

## 7. 安全措施

### 7.1 密码安全
- 使用SHA-256哈希存储
- 密码长度限制：6-20字符
- 不明文存储密码

### 7.2 会话安全
- Token有效期：24小时
- Token格式：header.payload.signature
- 登出时立即失效

### 7.3 访问控制
- 所有API需要验证token
- 用户只能访问自己的数据
- 管理员权限单独验证
