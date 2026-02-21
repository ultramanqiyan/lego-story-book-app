# 前端代码完整性测试用例

## 1. JS文件非空检查

### 1.1 核心JS文件非空检查

| 用例ID | TC_FRONT_001 |
|--------|--------------|
| 测试名称 | 核心JS文件非空检查 |
| 前置条件 | 项目已构建 |
| 测试步骤 | 1. 检查static/js/app.js文件<br>2. 验证文件行数 > 0<br>3. 验证文件包含必要函数定义 |
| 预期结果 | 文件非空，包含App对象定义 |
| 优先级 | P0 |

### 1.2 页面JS文件非空检查

| 用例ID | TC_FRONT_002 |
|--------|--------------|
| 测试名称 | 页面JS文件非空检查 |
| 前置条件 | 项目已构建 |
| 测试步骤 | 依次检查以下文件非空：<br>1. static/js/auth.js<br>2. static/js/bookshelf.js<br>3. static/js/characters.js<br>4. static/js/story-create.js<br>5. static/js/book.js<br>6. static/js/parent.js<br>7. static/js/home.js<br>8. static/js/adventure.js<br>9. static/js/share-view.js |
| 预期结果 | 所有文件行数 > 0 |
| 优先级 | P0 |

## 2. 函数定义完整性检查

### 2.1 app.js核心函数检查

| 用例ID | TC_FRONT_003 |
|--------|--------------|
| 测试名称 | app.js核心函数检查 |
| 前置条件 | app.js文件存在 |
| 测试步骤 | 验证以下函数/方法存在：<br>1. App.isAuthenticated()<br>2. App.setAuth()<br>3. App.clearAuth()<br>4. App.api()<br>5. App.showToast()<br>6. App.checkAuth() |
| 预期结果 | 所有核心函数存在且可调用 |
| 优先级 | P0 |

### 2.2 auth.js函数检查

| 用例ID | TC_FRONT_004 |
|--------|--------------|
| 测试名称 | auth.js函数检查 |
| 前置条件 | auth.js文件存在 |
| 测试步骤 | 验证以下功能存在：<br>1. DOMContentLoaded事件监听<br>2. 登录表单提交处理<br>3. 注册表单提交处理<br>4. 调用App.api('/api/auth/login') |
| 预期结果 | 所有功能正确实现 |
| 优先级 | P0 |

### 2.3 bookshelf.js函数检查

| 用例ID | TC_FRONT_005 |
|--------|--------------|
| 测试名称 | bookshelf.js函数检查 |
| 前置条件 | bookshelf.js文件存在 |
| 测试步骤 | 验证以下函数存在：<br>1. loadBooks()<br>2. renderBooks()<br>3. createBookCard()<br>4. toggleArchive()<br>5. initFilterTabs() |
| 预期结果 | 所有函数存在且可调用 |
| 优先级 | P0 |

### 2.4 characters.js函数检查

| 用例ID | TC_FRONT_006 |
|--------|--------------|
| 测试名称 | characters.js函数检查 |
| 前置条件 | characters.js文件存在 |
| 测试步骤 | 验证以下函数存在：<br>1. loadPresetCharacters()<br>2. loadCustomCharacters()<br>3. renderCharacters()<br>4. openCreateModal()<br>5. createCharacter() |
| 预期结果 | 所有函数存在且可调用 |
| 优先级 | P0 |

### 2.5 story-create.js函数检查

| 用例ID | TC_FRONT_007 |
|--------|--------------|
| 测试名称 | story-create.js函数检查 |
| 前置条件 | story-create.js文件存在 |
| 测试步骤 | 验证以下函数存在：<br>1. loadBooks()<br>2. loadCharacters()<br>3. selectBook()<br>4. selectCharacter()<br>5. generateStory() |
| 预期结果 | 所有函数存在且可调用 |
| 优先级 | P0 |

### 2.6 book.js函数检查

| 用例ID | TC_FRONT_008 |
|--------|--------------|
| 测试名称 | book.js函数检查 |
| 前置条件 | book.js文件存在 |
| 测试步骤 | 验证以下函数存在：<br>1. loadBook()<br>2. loadChapters()<br>3. renderChapters()<br>4. showChapter()<br>5. shareBook() |
| 预期结果 | 所有函数存在且可调用 |
| 优先级 | P0 |

### 2.7 adventure.js函数检查

| 用例ID | TC_FRONT_009 |
|--------|--------------|
| 测试名称 | adventure.js函数检查 |
| 前置条件 | adventure.js文件存在 |
| 测试步骤 | 验证以下功能存在：<br>1. DOMContentLoaded事件监听<br>2. 页面初始化函数<br>3. 工具交互函数 |
| 预期结果 | 所有功能正确实现 |
| 优先级 | P1 |

## 3. DOM元素绑定检查

### 3.1 登录页DOM绑定检查

| 用例ID | TC_FRONT_010 |
|--------|--------------|
| 测试名称 | 登录页DOM绑定检查 |
| 前置条件 | 登录页加载完成 |
| 测试步骤 | 验证以下元素事件绑定：<br>1. #loginForm submit事件<br>2. #registerForm submit事件<br>3. #showRegister click事件<br>4. #showLogin click事件 |
| 预期结果 | 所有事件正确绑定 |
| 优先级 | P0 |

### 3.2 书架页DOM绑定检查

| 用例ID | TC_FRONT_011 |
|--------|--------------|
| 测试名称 | 书架页DOM绑定检查 |
| 前置条件 | 书架页加载完成，用户已登录 |
| 测试步骤 | 验证以下元素事件绑定：<br>1. .filter-tabs .tab-btn click事件<br>2. .btn-read click事件<br>3. .btn-share click事件<br>4. .btn-archive click事件 |
| 预期结果 | 所有事件正确绑定 |
| 优先级 | P0 |

## 4. API调用正确性检查

### 4.1 认证API调用检查

| 用例ID | TC_FRONT_012 |
|--------|--------------|
| 测试名称 | 认证API调用检查 |
| 前置条件 | auth.js加载完成 |
| 测试步骤 | 验证以下API调用：<br>1. POST /api/auth/login (登录)<br>2. POST /api/auth/login?is_register=true (注册)<br>3. POST /api/auth/logout (登出) |
| 预期结果 | API路径和参数正确 |
| 优先级 | P0 |

### 4.2 书籍API调用检查

| 用例ID | TC_FRONT_013 |
|--------|--------------|
| 测试名称 | 书籍API调用检查 |
| 前置条件 | bookshelf.js加载完成 |
| 测试步骤 | 验证以下API调用：<br>1. GET /api/books (获取书籍列表)<br>2. PATCH /api/books/:id (更新书籍) |
| 预期结果 | API路径和参数正确 |
| 优先级 | P0 |

### 4.3 角色API调用检查

| 用例ID | TC_FRONT_014 |
|--------|--------------|
| 测试名称 | 角色API调用检查 |
| 前置条件 | characters.js加载完成 |
| 测试步骤 | 验证以下API调用：<br>1. GET /api/characters/preset (预设角色)<br>2. GET /api/characters/custom (自定义角色)<br>3. POST /api/characters/custom (创建角色)<br>4. DELETE /api/characters/custom/:id (删除角色) |
| 预期结果 | API路径和参数正确 |
| 优先级 | P0 |

### 4.4 故事生成API调用检查

| 用例ID | TC_FRONT_015 |
|--------|--------------|
| 测试名称 | 故事生成API调用检查 |
| 前置条件 | story-create.js加载完成 |
| 测试步骤 | 验证以下API调用：<br>1. POST /api/story/generate (生成故事)<br>2. GET /api/books (获取书籍列表)<br>3. GET /api/characters/preset (获取预设角色) |
| 预期结果 | API路径和参数正确 |
| 优先级 | P0 |

## 5. 依赖加载检查

### 5.1 页面依赖加载检查

| 用例ID | TC_FRONT_016 |
|--------|--------------|
| 测试名称 | 页面依赖加载检查 |
| 前置条件 | 页面HTML加载完成 |
| 测试步骤 | 检查以下页面是否正确加载app.js：<br>1. index.html<br>2. login.html<br>3. bookshelf.html<br>4. characters.html<br>5. story-create.html<br>6. book.html<br>7. parent.html<br>8. adventure.html<br>9. share.html |
| 预期结果 | 所有页面都包含 `<script src="/js/app.js">` |
| 优先级 | P0 |

### 5.2 App对象可用性检查

| 用例ID | TC_FRONT_017 |
|--------|--------------|
| 测试名称 | App对象可用性检查 |
| 前置条件 | 页面加载完成 |
| 测试步骤 | 在浏览器控制台执行：<br>1. typeof App !== 'undefined'<br>2. typeof App.api === 'function'<br>3. typeof App.checkAuth === 'function' |
| 预期结果 | App对象存在且方法可用 |
| 优先级 | P0 |

## 6. 页面功能完整性检查

### 6.1 登录页功能完整性

| 用例ID | TC_FRONT_018 |
|--------|--------------|
| 测试名称 | 登录页功能完整性 |
| 前置条件 | 登录页加载完成 |
| 测试步骤 | 1. 输入用户名密码<br>2. 点击登录<br>3. 验证API调用<br>4. 验证跳转 |
| 预期结果 | 登录功能正常工作 |
| 优先级 | P0 |

### 6.2 书架页功能完整性

| 用例ID | TC_FRONT_019 |
|--------|--------------|
| 测试名称 | 书架页功能完整性 |
| 前置条件 | 书架页加载完成，用户已登录 |
| 测试步骤 | 1. 验证书籍列表加载<br>2. 点击筛选标签<br>3. 点击阅读按钮<br>4. 点击归档按钮 |
| 预期结果 | 所有功能正常工作 |
| 优先级 | P0 |

### 6.3 角色管理页功能完整性

| 用例ID | TC_FRONT_020 |
|--------|--------------|
| 测试名称 | 角色管理页功能完整性 |
| 前置条件 | 角色管理页加载完成，用户已登录 |
| 测试步骤 | 1. 验证预设角色加载<br>2. 验证自定义角色加载<br>3. 点击创建角色<br>4. 填写表单并提交 |
| 预期结果 | 所有功能正常工作 |
| 优先级 | P0 |

## 7. 错误处理检查

### 7.1 API错误处理检查

| 用例ID | TC_FRONT_021 |
|--------|--------------|
| 测试名称 | API错误处理检查 |
| 前置条件 | 页面加载完成 |
| 测试步骤 | 1. 模拟API返回错误<br>2. 验证错误提示显示<br>3. 验证页面不崩溃 |
| 预期结果 | 错误正确处理，用户看到提示 |
| 优先级 | P1 |

### 7.2 网络错误处理检查

| 用例ID | TC_FRONT_022 |
|--------|--------------|
| 测试名称 | 网络错误处理检查 |
| 前置条件 | 页面加载完成 |
| 测试步骤 | 1. 断开网络<br>2. 触发API调用<br>3. 验证错误提示 |
| 预期结果 | 显示网络错误提示，页面不崩溃 |
| 优先级 | P1 |

## 8. 自动化测试脚本要求

### 8.1 静态检查脚本

```javascript
// 检查所有JS文件非空
const fs = require('fs');
const path = require('path');

const jsFiles = [
    'static/js/app.js',
    'static/js/auth.js',
    'static/js/bookshelf.js',
    'static/js/characters.js',
    'static/js/story-create.js',
    'static/js/book.js',
    'static/js/parent.js',
    'static/js/home.js',
    'static/js/adventure.js',
    'static/js/share-view.js'
];

jsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim()).length;
    console.log(`${file}: ${lines} lines`);
    if (lines === 0) {
        throw new Error(`${file} is empty!`);
    }
});
```

### 8.2 函数定义检查脚本

```javascript
// 检查关键函数定义
const requiredFunctions = {
    'static/js/app.js': ['App.isAuthenticated', 'App.api', 'App.checkAuth'],
    'static/js/auth.js': ['DOMContentLoaded', 'loginForm', 'registerForm'],
    'static/js/bookshelf.js': ['loadBooks', 'renderBooks', 'createBookCard'],
    'static/js/characters.js': ['loadPresetCharacters', 'loadCustomCharacters'],
    'static/js/story-create.js': ['loadBooks', 'loadCharacters', 'generateStory'],
    'static/js/book.js': ['loadBook', 'loadChapters', 'showChapter']
};
```

## 9. 测试执行优先级

| 优先级 | 测试类型 | 说明 |
|--------|----------|------|
| P0 | JS文件非空检查 | 必须首先通过 |
| P0 | 核心函数定义检查 | 必须通过才能继续 |
| P0 | API调用检查 | 确保前后端通信正确 |
| P1 | DOM绑定检查 | 确保交互正常 |
| P1 | 错误处理检查 | 确保健壮性 |
