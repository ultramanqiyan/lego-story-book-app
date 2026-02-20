# 乐高故事书籍系统 - 设计文档概览

## 1. 系统概述

### 1.1 项目背景
创建一个乐高小镇故事书籍功能，让用户可以创建、管理和阅读自己的乐高主题故事书籍。

### 1.2 目标用户
- 主要用户：儿童（6-12岁）
- 次要用户：家长辅助创作

### 1.3 技术架构
- 前端：HTML/CSS/JavaScript（静态页面）
- 后端：Cloudflare Pages Functions
- 数据库：Cloudflare D1
- 图片存储：Cloudflare R2
- AI服务：火山引擎（Doubao、Seedream）

## 2. 系统架构设计

### 2.1 子系统划分

```
┌─────────────────────────────────────────────────────────────┐
│                    乐高故事书籍系统                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 用户管理    │  │ 人仔管理    │  │ 角色管理    │         │
│  │ 子系统      │  │ 子系统      │  │ 子系统      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 情节管理    │  │ 故事生成    │  │ 解密互动    │         │
│  │ 子系统      │  │ 子系统      │  │ 子系统      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 章节管理    │  │ 书籍管理    │  │ 分享管理    │         │
│  │ 子系统      │  │ 子系统      │  │ 子系统      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐                                            │
│  │ 家长控制    │                                            │
│  │ 子系统      │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | HTML/CSS/JavaScript | 静态页面，无框架 |
| 后端 | Cloudflare Pages Functions | Serverless函数 |
| 数据库 | Cloudflare D1 | SQLite兼容 |
| 存储 | Cloudflare R2 | 对象存储 |
| AI文本 | 火山引擎 Doubao API | 故事生成 |
| AI图像 | 火山引擎 Seedream API | 图生图 |
| 语音 | SiliconFlow API | 语音识别 |

### 2.3 部署架构

```
┌─────────────────────────────────────────┐
│           Cloudflare Pages              │
├─────────────────────────────────────────┤
│  静态资源 (HTML/CSS/JS)                 │
│  ├─ /index.html                         │
│  ├─ /story-create.html                  │
│  ├─ /bookshelf.html                     │
│  ├─ /book.html                          │
│  ├─ /characters.html                    │
│  ├─ /adventure.html                     │
│  ├─ /parent.html                        │
│  ├─ /share.html                         │
│  └─ /login.html                         │
├─────────────────────────────────────────┤
│  Page Functions (API)                   │
│  ├─ /api/auth/*                         │
│  ├─ /api/characters/*                   │
│  ├─ /api/books/*                        │
│  ├─ /api/chapters/*                     │
│  ├─ /api/story/*                        │
│  ├─ /api/puzzle/*                       │
│  ├─ /api/share/*                        │
│  ├─ /api/parent/*                       │
│  ├─ /api/speech                         │
│  └─ /api/generate                       │
├─────────────────────────────────────────┤
│  Cloudflare D1 (数据库)                 │
│  └─ lego_story_db                       │
├─────────────────────────────────────────┤
│  Cloudflare R2 (存储)                   │
│  └─ lego-images                         │
└─────────────────────────────────────────┘
```

## 3. 页面路由设计

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 主页 | 系统入口页 |
| `/login` | 登录页 | 用户登录 |
| `/story-create` | 故事创作页 | 核心创作流程 |
| `/bookshelf` | 书架页 | 书籍列表管理 |
| `/book` | 书籍详情页 | 章节阅读与管理 |
| `/characters` | 人仔管理页 | 人仔CRUD |
| `/adventure` | 冒险工坊页 | 创作工具 |
| `/parent` | 家长控制页 | 家长功能 |
| `/share` | 分享访问页 | 分享内容查看 |

## 4. API路由设计

### 4.1 认证API
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/user` - 获取当前用户

### 4.2 人仔API
- `GET /api/characters/preset` - 获取预设人仔列表
- `GET /api/characters/custom` - 获取自定义人仔列表
- `POST /api/characters/custom` - 创建自定义人仔
- `PUT /api/characters/custom/:id` - 更新自定义人仔
- `DELETE /api/characters/custom/:id` - 删除自定义人仔

### 4.3 书籍API
- `GET /api/books` - 获取书籍列表
- `GET /api/books/:id` - 获取书籍详情
- `POST /api/books` - 创建书籍
- `PUT /api/books/:id` - 更新书籍
- `DELETE /api/books/:id` - 删除书籍
- `GET /api/books/:id/roles` - 获取书籍角色
- `POST /api/books/:id/roles` - 添加书籍角色
- `PUT /api/books/:id/roles/:roleId` - 更新书籍角色
- `DELETE /api/books/:id/roles/:roleId` - 删除书籍角色

### 4.4 章节API
- `GET /api/chapters/book/:bookId` - 获取书籍章节列表
- `GET /api/chapters/:id` - 获取章节详情
- `POST /api/chapters` - 创建章节
- `DELETE /api/chapters/:id` - 删除章节

### 4.5 故事API
- `POST /api/story/generate` - 生成故事
- `POST /api/story_new/` - 生成故事（Doubao API）

### 4.6 谜题API
- `POST /api/puzzle/verify` - 验证谜题答案
- `GET /api/puzzle/record/:chapterId` - 获取答题记录

### 4.7 分享API
- `POST /api/share/create` - 创建分享
- `GET /api/share/:shareId` - 获取分享内容
- `DELETE /api/share/:shareId` - 删除分享

### 4.8 家长控制API
- `GET /api/parent/settings` - 获取家长设置
- `POST /api/parent/settings` - 更新家长设置
- `GET /api/parent/stats` - 获取使用统计
- `POST /api/parent/bind` - 绑定儿童账户

### 4.9 其他API
- `POST /api/speech` - 语音识别
- `POST /api/generate` - 图生图

## 5. 数据库设计概览

### 5.1 数据表列表

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| characters | 人仔表 |
| books | 书籍表 |
| book_roles | 书籍角色表 |
| chapters | 章节表 |
| puzzles | 谜题表 |
| puzzle_records | 答题记录表 |
| shares | 分享表 |
| parent_settings | 家长设置表 |
| usage_logs | 使用日志表 |

详细设计见：[02_database.md](./02_database.md)

## 6. 子系统详细设计

| 子系统 | 文档 |
|--------|------|
| 用户管理子系统 | [03_user_subsystem.md](./03_user_subsystem.md) |
| 人仔管理子系统 | [04_character_subsystem.md](./04_character_subsystem.md) |
| 角色管理子系统 | [05_role_subsystem.md](./05_role_subsystem.md) |
| 情节管理子系统 | [06_plot_subsystem.md](./06_plot_subsystem.md) |
| 故事生成子系统 | [07_story_subsystem.md](./07_story_subsystem.md) |
| 解密互动子系统 | [08_puzzle_subsystem.md](./08_puzzle_subsystem.md) |
| 章节管理子系统 | [09_chapter_subsystem.md](./09_chapter_subsystem.md) |
| 书籍管理子系统 | [10_book_subsystem.md](./10_book_subsystem.md) |
| 分享管理子系统 | [11_share_subsystem.md](./11_share_subsystem.md) |
| 家长控制子系统 | [12_parent_subsystem.md](./12_parent_subsystem.md) |

## 7. 前端模块设计

| 模块 | 文档 |
|------|------|
| 公共组件 | [13_frontend_common.md](./13_frontend_common.md) |
| 页面组件 | [14_frontend_pages.md](./14_frontend_pages.md) |

## 8. 设计原则

### 8.1 高内聚低耦合
- 每个子系统独立封装，对外提供清晰接口
- 子系统内部模块高度内聚
- 子系统之间通过API通信，减少直接依赖

### 8.2 代码规范
- 每个代码文件不超过800行
- 函数单一职责
- 命名规范统一

### 8.3 安全性
- API密钥通过环境变量配置
- 用户数据隔离
- 敏感操作需要验证

### 8.4 可维护性
- 代码注释清晰
- 模块划分合理
- 测试覆盖完整
