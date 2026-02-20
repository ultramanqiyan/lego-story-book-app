# 人仔管理子系统设计文档

## 1. 子系统概述

人仔管理子系统负责预设人仔和自定义人仔的管理，包括人仔的创建、查询、更新、删除等功能。

## 2. 功能模块

### 2.1 预设人仔模块

#### 2.1.1 获取预设人仔列表
- 函数名：`getPresetCharacters()`
- 输入：无
- 输出：预设人仔列表（12个）
- 流程：
  1. 查询is_preset=1的人仔
  2. 返回完整列表

#### 2.1.2 获取单个预设人仔
- 函数名：`getPresetCharacter(characterId)`
- 输入：人仔ID
- 输出：人仔详情
- 流程：
  1. 验证人仔ID格式
  2. 查询人仔信息
  3. 返回详情

### 2.2 自定义人仔模块

#### 2.2.1 获取用户自定义人仔列表
- 函数名：`getCustomCharacters(userId)`
- 输入：用户ID
- 输出：自定义人仔列表
- 流程：
  1. 验证用户ID
  2. 查询creator_id=userId的人仔
  3. 返回列表

#### 2.2.2 创建自定义人仔
- 函数名：`createCustomCharacter(userId, characterData)`
- 输入：用户ID、人仔数据
- 输出：人仔ID
- 流程：
  1. 验证用户ID
  2. 验证人仔名称（必填，最多20字符）
  3. 验证人设描述（可选，最多100字符）
  4. 验证性格类型（从预设列表选择）
  5. 验证说话方式（从预设列表选择）
  6. 调用图生图API生成乐高风格图片
  7. 生成人仔ID
  8. 存储到数据库
  9. 返回人仔ID

#### 2.2.3 更新自定义人仔
- 函数名：`updateCustomCharacter(userId, characterId, characterData)`
- 输入：用户ID、人仔ID、更新数据
- 输出：成功/失败
- 流程：
  1. 验证人仔存在且属于该用户
  2. 更新指定字段
  3. 返回成功

#### 2.2.4 删除自定义人仔
- 函数名：`deleteCustomCharacter(userId, characterId)`
- 输入：用户ID、人仔ID
- 输出：成功/失败
- 流程：
  1. 验证人仔存在且属于该用户
  2. 检查是否被书籍角色引用
  3. 如被引用，标记引用记录
  4. 删除人仔记录
  5. 返回成功

### 2.3 图生图模块

#### 2.3.1 生成乐高风格图片
- 函数名：`generateLegoImage(imageBase64)`
- 输入：原始图片base64
- 输出：乐高风格图片base64
- 流程：
  1. 验证图片格式（JPG/PNG）
  2. 调用火山引擎Seedream API
  3. 获取生成图片URL
  4. 下载图片并转base64
  5. 返回base64

## 3. 预设数据

### 3.1 预设人仔列表

| ID | 名称 | 人设 | 性格 | 说话方式 |
|----|------|------|------|----------|
| preset_batman | 乐高蝙蝠侠 | 哥谭暗夜骑士 | 勇敢、正义、严肃 | 低沉有力 |
| preset_spiderman | 乐高蜘蛛侠 | 友好邻居英雄 | 活泼、幽默、善良 | 轻松俏皮 |
| preset_naruto | 乐高火影忍者 | 忍者村忍者 | 热血、坚韧、乐观 | 充满干劲 |
| preset_dinosaur | 乐高恐龙 | 史前巨兽 | 威猛、古老、神秘 | 低沉咆哮 |
| preset_princess | 乐高公主 | 童话王国 | 优雅、善良、勇敢 | 温柔甜美 |
| preset_knight | 乐高骑士 | 中世纪战士 | 忠诚、勇敢、正直 | 庄重有力 |
| preset_wizard | 乐高巫师 | 魔法大师 | 智慧、神秘、慈祥 | 古老深奥 |
| preset_astronaut | 乐高宇航员 | 太空探索者 | 好奇、勇敢、科学 | 专业冷静 |
| preset_pirate | 乐高海盗 | 七海冒险家 | 豪爽、自由、机智 | 粗犷豪迈 |
| preset_elf | 乐高精灵 | 森林守护者 | 敏捷、聪慧、友善 | 清脆悦耳 |
| preset_robot | 乐高机器人 | 未来科技 | 精确、理性、忠诚 | 机械平稳 |
| preset_superman | 乐高超人 | 氪星之子 | 正义、无私、强大 | 坚定有力 |

### 3.2 性格类型预设列表

```javascript
const PERSONALITY_OPTIONS = [
    '勇敢、正义、严肃',
    '活泼、幽默、善良',
    '热血、坚韧、乐观',
    '威猛、古老、神秘',
    '优雅、善良、勇敢',
    '忠诚、勇敢、正直',
    '智慧、神秘、慈祥',
    '好奇、勇敢、科学',
    '豪爽、自由、机智',
    '敏捷、聪慧、友善',
    '精确、理性、忠诚',
    '正义、无私、强大'
];
```

### 3.3 说话方式预设列表

```javascript
const SPEAKING_STYLE_OPTIONS = [
    '低沉有力',
    '轻松俏皮',
    '充满干劲',
    '低沉咆哮',
    '温柔甜美',
    '庄重有力',
    '古老深奥',
    '专业冷静',
    '粗犷豪迈',
    '清脆悦耳',
    '机械平稳',
    '坚定有力'
];
```

## 4. API接口设计

### 4.1 获取预设人仔列表
```
GET /api/characters/preset
Response:
{
  "success": true,
  "characters": [
    {
      "character_id": "string",
      "name": "string",
      "image_base64": "string",
      "description": "string",
      "personality": "string",
      "speaking_style": "string"
    }
  ]
}
```

### 4.2 获取自定义人仔列表
```
GET /api/characters/custom
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "characters": [
    {
      "character_id": "string",
      "name": "string",
      "image_base64": "string",
      "description": "string",
      "personality": "string",
      "speaking_style": "string",
      "created_at": number
    }
  ]
}
```

### 4.3 创建自定义人仔
```
POST /api/characters/custom
Headers:
  Authorization: Bearer {token}
Request:
{
  "name": "string",
  "image_base64": "string",
  "description": "string",
  "personality": "string",
  "speaking_style": "string"
}
Response:
{
  "success": true,
  "character_id": "string"
}
```

### 4.4 更新自定义人仔
```
PUT /api/characters/custom/:id
Headers:
  Authorization: Bearer {token}
Request:
{
  "name": "string",
  "description": "string",
  "personality": "string",
  "speaking_style": "string"
}
Response:
{
  "success": true
}
```

### 4.5 删除自定义人仔
```
DELETE /api/characters/custom/:id
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "warning": "string" // 如果被引用
}
```

### 4.6 生成乐高风格图片
```
POST /api/generate
Request:
{
  "image": "string", // base64
  "prompt": "string"
}
Response:
{
  "success": true,
  "imageUrl": "string"
}
```

## 5. 数据库操作函数

### 5.1 人仔操作 (functions/db/characters.js)

```javascript
export async function getPresetCharacters(db) {
    const sql = `SELECT * FROM characters WHERE is_preset = 1`;
    const result = await db.prepare(sql).all();
    return result.results;
}

export async function getCharacterById(db, characterId) {
    const sql = `SELECT * FROM characters WHERE character_id = ?`;
    const result = await db.prepare(sql).bind(characterId).first();
    return result;
}

export async function getCustomCharactersByUserId(db, userId) {
    const sql = `SELECT * FROM characters WHERE creator_id = ? AND is_preset = 0`;
    const result = await db.prepare(sql).bind(userId).all();
    return result.results;
}

export async function createCharacter(db, characterData) {
    const sql = `
        INSERT INTO characters (character_id, name, image_base64, description, personality, speaking_style, creator_id, is_preset, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `;
    const now = Date.now();
    await db.prepare(sql).bind(
        characterData.character_id,
        characterData.name,
        characterData.image_base64,
        characterData.description || null,
        characterData.personality,
        characterData.speaking_style,
        characterData.creator_id,
        now,
        now
    ).run();
    return characterData.character_id;
}

export async function updateCharacter(db, characterId, characterData) {
    const fields = [];
    const values = [];
    
    if (characterData.name) {
        fields.push('name = ?');
        values.push(characterData.name);
    }
    if (characterData.description !== undefined) {
        fields.push('description = ?');
        values.push(characterData.description);
    }
    if (characterData.personality) {
        fields.push('personality = ?');
        values.push(characterData.personality);
    }
    if (characterData.speaking_style) {
        fields.push('speaking_style = ?');
        values.push(characterData.speaking_style);
    }
    if (characterData.image_base64) {
        fields.push('image_base64 = ?');
        values.push(characterData.image_base64);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(characterId);
    
    const sql = `UPDATE characters SET ${fields.join(', ')} WHERE character_id = ?`;
    await db.prepare(sql).bind(...values).run();
}

export async function deleteCharacter(db, characterId) {
    const sql = `DELETE FROM characters WHERE character_id = ?`;
    await db.prepare(sql).bind(characterId).run();
}

export async function checkCharacterInUse(db, characterId) {
    const sql = `SELECT COUNT(*) as count FROM book_roles WHERE character_id = ?`;
    const result = await db.prepare(sql).bind(characterId).first();
    return result.count > 0;
}
```

## 6. 创建人仔流程

```
┌─────────────────────────────────────────────────────────────┐
│                    创建自定义人仔流程                         │
├─────────────────────────────────────────────────────────────┤
│  1. 用户点击"创建人仔"按钮                                    │
│     ↓                                                       │
│  2. 弹出创建弹窗                                             │
│     ├─ 左侧：图片上传区域                                     │
│     ├─ 右侧：生成结果预览区域                                 │
│     └─ 底部：人仔属性输入                                     │
│     ↓                                                       │
│  3. 上传照片（JPG/PNG）                                      │
│     ↓                                                       │
│  4. 点击"生成乐高人仔"按钮                                    │
│     ↓                                                       │
│  5. 调用图生图API                                            │
│     ↓                                                       │
│  6. 预览生成的乐高风格图片                                    │
│     ↓                                                       │
│  7. 输入人仔名称（必填，最多20字符）                          │
│     ↓                                                       │
│  8. 选择性格类型（下拉选择）                                  │
│     ↓                                                       │
│  9. 选择说话方式（下拉选择）                                  │
│     ↓                                                       │
│  10. 点击"创建"保存人仔                                       │
│     ↓                                                       │
│  11. 人仔保存到用户人仔库                                     │
└─────────────────────────────────────────────────────────────┘
```

## 7. 删除人仔处理逻辑

```
┌─────────────────────────────────────────────────────────────┐
│                    删除自定义人仔流程                         │
├─────────────────────────────────────────────────────────────┤
│  1. 用户点击删除按钮                                         │
│     ↓                                                       │
│  2. 检查人仔是否被书籍角色引用                                │
│     ├─ 未被引用 → 直接删除                                   │
│     └─ 已被引用 → 显示警告提示                               │
│         "该人仔已在故事中使用，删除后角色将显示为默认形象"      │
│         ↓                                                   │
│         用户确认删除                                         │
│         ↓                                                   │
│         更新引用记录，替换为默认灰色人仔图片                   │
│         ↓                                                   │
│         删除人仔记录                                         │
└─────────────────────────────────────────────────────────────┘
```

## 8. 错误处理

| 错误码 | 说明 |
|--------|------|
| CHAR_001 | 人仔不存在 |
| CHAR_002 | 人仔名称不能为空 |
| CHAR_003 | 人仔名称超过20字符 |
| CHAR_004 | 人设描述超过100字符 |
| CHAR_005 | 无效的性格类型 |
| CHAR_006 | 无效的说话方式 |
| CHAR_007 | 图片格式不支持 |
| CHAR_008 | 图片生成失败 |
| CHAR_009 | 无权限操作此人仔 |

## 9. 文件结构

```
functions/
├── api/
│   └── characters/
│       ├── preset.js       - 预设人仔API
│       └── custom/
│           ├── index.js    - 自定义人仔列表API
│           ├── create.js   - 创建人仔API
│           ├── update.js   - 更新人仔API
│           └── delete.js   - 删除人仔API
├── db/
│   └── characters.js       - 人仔数据库操作
└── services/
    └── imageGenerator.js   - 图生图服务
```
