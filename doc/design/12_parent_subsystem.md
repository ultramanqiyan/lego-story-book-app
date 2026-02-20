# 家长控制子系统设计文档

## 1. 子系统概述

家长控制子系统负责使用时长控制、内容过滤、家长监控等功能，保障儿童健康使用。

## 2. 功能模块

### 2.1 使用时长控制模块

#### 2.1.1 每日使用时长限制
- 函数名：`checkDailyTimeLimit(userId)`
- 输入：用户ID
- 输出：是否超限
- 流程：
  1. 获取用户今日使用时长
  2. 获取家长设置的时长限制
  3. 比较是否超限
  4. 返回结果

#### 2.1.2 使用时段限制
- 函数名：`checkTimeSlot(userId)`
- 输入：用户ID
- 输出：是否在允许时段
- 流程：
  1. 获取当前时间
  2. 获取家长设置的允许时段
  3. 检查是否在允许时段内
  4. 返回结果

#### 2.1.3 休息提醒
- 函数名：`checkRestReminder(userId)`
- 输入：用户ID
- 输出：是否需要提醒
- 规则：连续使用45分钟后提醒休息

### 2.2 内容过滤模块

#### 2.2.1 敏感词过滤
- 函数名：`filterSensitiveContent(content)`
- 输入：内容文本
- 输出：过滤后的内容
- 流程：
  1. 匹配敏感词列表
  2. 替换敏感词
  3. 返回过滤结果

#### 2.2.2 暴力内容过滤
- 检测暴力相关词汇
- 自动替换或屏蔽

#### 2.2.3 年龄分级
- 函数名：`checkAgeRating(userId, contentRating)`
- 输入：用户ID、内容分级
- 输出：是否允许访问
- 分级：
  - all：全年龄
  - 6+：6岁以上
  - 12+：12岁以上

### 2.3 家长监控模块

#### 2.3.1 查看孩子创作记录
- 函数名：`getChildCreationRecords(parentId, childId)`
- 输入：家长ID、儿童ID
- 输出：创作记录列表
- 内容：
  - 创建的书籍
  - 生成的章节
  - 创建的人仔

#### 2.3.2 查看使用统计
- 函数名：`getUsageStats(parentId, childId, period)`
- 输入：家长ID、儿童ID、统计周期
- 输出：使用统计数据
- 内容：
  - 每日使用时长
  - 使用频率
  - 活跃时段

#### 2.3.3 接收异常提醒
- 触发条件：
  - 使用时长超限
  - 非允许时段使用
  - 敏感内容检测
- 通知方式：站内消息

### 2.4 家长账户模块

#### 2.4.1 绑定儿童账户
- 函数名：`bindChildAccount(parentId, childUsername)`
- 输入：家长ID、儿童用户名
- 输出：成功/失败
- 流程：
  1. 查询儿童账户
  2. 检查是否已被绑定
  3. 创建绑定关系
  4. 返回结果

#### 2.4.2 解绑儿童账户
- 函数名：`unbindChildAccount(parentId, childId)`
- 输入：家长ID、儿童ID
- 输出：成功/失败
- 流程：
  1. 验证绑定关系
  2. 删除绑定关系
  3. 删除家长设置
  4. 返回结果

#### 2.4.3 设置控制规则
- 函数名：`setParentSettings(parentId, childId, settings)`
- 输入：家长ID、儿童ID、设置内容
- 输出：成功/失败
- 设置内容：
  - 每日时长限制
  - 允许时段
  - 内容过滤开关
  - 年龄分级

## 3. API接口设计

### 3.1 获取家长设置
```
GET /api/parent/settings/:childId
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "settings": {
    "setting_id": "string",
    "daily_time_limit": 60,
    "time_slots": [
      {"start": "09:00", "end": "12:00"},
      {"start": "14:00", "end": "20:00"}
    ],
    "content_filter": true,
    "age_rating": "all"
  }
}
```

### 3.2 更新家长设置
```
POST /api/parent/settings/:childId
Headers:
  Authorization: Bearer {token}
Request:
{
  "daily_time_limit": 60,
  "time_slots": [
    {"start": "09:00", "end": "12:00"},
    {"start": "14:00", "end": "20:00"}
  ],
  "content_filter": true,
  "age_rating": "all"
}
Response:
{
  "success": true
}
```

### 3.3 获取使用统计
```
GET /api/parent/stats/:childId?period=week
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "stats": {
    "daily_usage": [
      {"date": "2024-01-01", "duration": 45},
      {"date": "2024-01-02", "duration": 60}
    ],
    "total_duration": 315,
    "average_duration": 45,
    "most_active_hour": 15
  }
}
```

### 3.4 绑定儿童账户
```
POST /api/parent/bind
Headers:
  Authorization: Bearer {token}
Request:
{
  "child_username": "string"
}
Response:
{
  "success": true,
  "child": {
    "user_id": "string",
    "username": "string"
  }
}
```

### 3.5 解绑儿童账户
```
DELETE /api/parent/bind/:childId
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true
}
```

### 3.6 获取绑定儿童列表
```
GET /api/parent/children
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "children": [
    {
      "user_id": "string",
      "username": "string",
      "avatar": "string",
      "today_usage": 30,
      "time_limit": 60
    }
  ]
}
```

## 4. 数据库操作函数

### 4.1 家长设置操作 (functions/db/parent_settings.js)

```javascript
export async function getParentSettings(db, parentId, childId) {
    const sql = `
        SELECT * FROM parent_settings 
        WHERE parent_id = ? AND child_id = ?
    `;
    const result = await db.prepare(sql).bind(parentId, childId).first();
    return result;
}

export async function createParentSettings(db, settingsData) {
    const sql = `
        INSERT INTO parent_settings (setting_id, parent_id, child_id, daily_time_limit, time_slots, content_filter, age_rating, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const now = Date.now();
    await db.prepare(sql).bind(
        settingsData.setting_id,
        settingsData.parent_id,
        settingsData.child_id,
        settingsData.daily_time_limit || 60,
        settingsData.time_slots ? JSON.stringify(settingsData.time_slots) : null,
        settingsData.content_filter !== false ? 1 : 0,
        settingsData.age_rating || 'all',
        now,
        now
    ).run();
    return settingsData.setting_id;
}

export async function updateParentSettings(db, settingId, settingsData) {
    const fields = [];
    const values = [];
    
    if (settingsData.daily_time_limit !== undefined) {
        fields.push('daily_time_limit = ?');
        values.push(settingsData.daily_time_limit);
    }
    if (settingsData.time_slots !== undefined) {
        fields.push('time_slots = ?');
        values.push(JSON.stringify(settingsData.time_slots));
    }
    if (settingsData.content_filter !== undefined) {
        fields.push('content_filter = ?');
        values.push(settingsData.content_filter ? 1 : 0);
    }
    if (settingsData.age_rating !== undefined) {
        fields.push('age_rating = ?');
        values.push(settingsData.age_rating);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(settingId);
    
    const sql = `UPDATE parent_settings SET ${fields.join(', ')} WHERE setting_id = ?`;
    await db.prepare(sql).bind(...values).run();
}

export async function deleteParentSettings(db, parentId, childId) {
    const sql = `DELETE FROM parent_settings WHERE parent_id = ? AND child_id = ?`;
    await db.prepare(sql).bind(parentId, childId).run();
}
```

### 4.2 使用日志操作 (functions/db/usage_logs.js)

```javascript
export async function createUsageLog(db, logData) {
    const sql = `
        INSERT INTO usage_logs (log_id, user_id, action_type, action_detail, duration, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.prepare(sql).bind(
        logData.log_id,
        logData.user_id,
        logData.action_type,
        logData.action_detail ? JSON.stringify(logData.action_detail) : null,
        logData.duration || 0,
        Date.now()
    ).run();
}

export async function getDailyUsage(db, userId, date) {
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    
    const sql = `
        SELECT SUM(duration) as total_duration
        FROM usage_logs
        WHERE user_id = ? AND created_at >= ? AND created_at <= ?
    `;
    const result = await db.prepare(sql).bind(userId, startOfDay, endOfDay).first();
    return result.total_duration || 0;
}

export async function getUsageStats(db, userId, startDate, endDate) {
    const sql = `
        SELECT 
            DATE(created_at / 1000, 'unixepoch') as date,
            SUM(duration) as duration
        FROM usage_logs
        WHERE user_id = ? AND created_at >= ? AND created_at <= ?
        GROUP BY DATE(created_at / 1000, 'unixepoch')
        ORDER BY date
    `;
    const result = await db.prepare(sql).bind(userId, startDate, endDate).all();
    return result.results;
}
```

## 5. 时长控制中间件

### 5.1 检查使用权限

```javascript
export async function checkUsagePermission(userId, env) {
    const user = await getUserById(env.DB, userId);
    if (!user || user.role !== 'child') {
        return { allowed: true };
    }
    
    if (!user.parent_id) {
        return { allowed: true };
    }
    
    const settings = await getParentSettings(env.DB, user.parent_id, userId);
    if (!settings) {
        return { allowed: true };
    }
    
    const dailyUsage = await getDailyUsage(env.DB, userId, new Date());
    if (dailyUsage >= settings.daily_time_limit * 60) {
        return {
            allowed: false,
            reason: 'daily_limit_exceeded',
            message: '今日使用时长已达上限'
        };
    }
    
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    
    if (settings.time_slots) {
        const timeSlots = JSON.parse(settings.time_slots);
        const isInSlot = timeSlots.some(slot => {
            return currentTimeStr >= slot.start && currentTimeStr <= slot.end;
        });
        
        if (!isInSlot) {
            return {
                allowed: false,
                reason: 'outside_allowed_time',
                message: '当前不在允许使用时段'
            };
        }
    }
    
    return { allowed: true };
}
```

## 6. 家长控制页面设计

### 6.1 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│                    家长控制页面                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 我的孩子们                                           │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ [头像] 小明  今日使用: 30分钟/60分钟  [设置]    │ │   │
│  │ │ [头像] 小红  今日使用: 45分钟/60分钟  [设置]    │ │   │
│  │ │ [+ 绑定新账户]                                  │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 小明的设置                                           │   │
│  │                                                       │   │
│  │ 每日使用时长限制：                                   │   │
│  │ [60] 分钟                                            │   │
│  │                                                       │   │
│  │ 允许使用时段：                                       │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ 时段1: [09:00] - [12:00]  [删除]               │ │   │
│  │ │ 时段2: [14:00] - [20:00]  [删除]               │ │   │
│  │ │ [+ 添加时段]                                    │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │ 内容过滤：[开启]                                     │   │
│  │                                                       │   │
│  │ 年龄分级：[全年龄 ▼]                                 │   │
│  │                                                       │   │
│  │                              [保存设置]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 小明的使用统计                                       │   │
│  │                                                       │   │
│  │ 本周使用时长：3小时15分钟                            │   │
│  │ 平均每日：45分钟                                     │   │
│  │ 最活跃时段：下午3点                                  │   │
│  │                                                       │   │
│  │ [柱状图：每日使用时长]                               │   │
│  │                                                       │   │
│  │ [查看详细报告]                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 7. 使用时长提醒

### 7.1 前端提醒组件

```javascript
class UsageReminder {
    constructor(userId) {
        this.userId = userId;
        this.startTime = Date.now();
        this.warningThreshold = 45 * 60 * 1000;
        this.checkInterval = 60 * 1000;
    }
    
    start() {
        this.timer = setInterval(() => {
            this.checkUsage();
        }, this.checkInterval);
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    
    async checkUsage() {
        const elapsed = Date.now() - this.startTime;
        
        if (elapsed >= this.warningThreshold) {
            this.showRestReminder();
            this.startTime = Date.now();
        }
        
        const permission = await checkPermission();
        if (!permission.allowed) {
            this.showLimitExceeded(permission.message);
            this.stop();
        }
    }
    
    showRestReminder() {
        const modal = document.createElement('div');
        modal.className = 'rest-reminder-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>休息提醒</h3>
                <p>你已经使用了45分钟，建议休息一下眼睛哦！</p>
                <button onclick="this.parentElement.parentElement.remove()">
                    知道了
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    showLimitExceeded(message) {
        const modal = document.createElement('div');
        modal.className = 'limit-exceeded-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>使用时间到</h3>
                <p>${message}</p>
                <button onclick="window.location.href='/'">
                    返回首页
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}
```

## 8. 敏感词列表

### 8.1 敏感词分类

```javascript
const SENSITIVE_WORDS = {
    violence: ['暴力', '血腥', '杀人', '死亡', '伤害', '殴打'],
    adult: ['色情', '裸体', '性感'],
    gambling: ['赌博', '赌钱', '下注'],
    drugs: ['毒品', '吸毒', '麻醉'],
    other: ['诈骗', '偷窃', '犯罪']
};

function getAllSensitiveWords() {
    return Object.values(SENSITIVE_WORDS).flat();
}

function filterContent(content) {
    const words = getAllSensitiveWords();
    let filtered = content;
    
    words.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    
    return filtered;
}
```

## 9. 错误处理

| 错误码 | 说明 |
|--------|------|
| PARENT_001 | 儿童账户不存在 |
| PARENT_002 | 儿童账户已被绑定 |
| PARENT_003 | 无权限操作此儿童账户 |
| PARENT_004 | 设置保存失败 |
| PARENT_005 | 时段格式错误 |

## 10. 文件结构

```
functions/
├── api/
│   └── parent/
│       ├── settings/
│       │   └── [childId].js - 家长设置API
│       ├── stats/
│       │   └── [childId].js - 使用统计API
│       ├── bind.js          - 绑定儿童账户API
│       └── children.js      - 儿童列表API
├── db/
│   ├── parent_settings.js   - 家长设置数据库操作
│   └── usage_logs.js        - 使用日志数据库操作
├── middleware/
│   └── usageCheck.js        - 使用权限检查中间件
└── services/
    ├── contentFilter.js     - 内容过滤服务
    └── timeManager.js       - 时间管理服务
```
