# 前端页面设计文档

## 1. 页面列表

| 页面 | 路由 | 说明 |
|------|------|------|
| 主页 | `/` | 系统入口页 |
| 登录页 | `/login` | 用户登录 |
| 故事创作页 | `/story-create` | 核心创作流程 |
| 书架页 | `/bookshelf` | 书籍列表管理 |
| 书籍详情页 | `/book` | 章节阅读与管理 |
| 人仔管理页 | `/characters` | 人仔CRUD |
| 冒险工坊页 | `/adventure` | 创作工具 |
| 家长控制页 | `/parent` | 家长功能 |
| 分享访问页 | `/share` | 分享内容查看 |

## 2. 主页设计

### 2.1 页面结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>乐高故事书籍</title>
    <link rel="stylesheet" href="/css/variables.css">
    <link rel="stylesheet" href="/css/reset.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/pages.css">
</head>
<body>
    <nav class="navbar">
        <!-- 导航栏 -->
    </nav>
    
    <main class="main-content">
        <section class="hero-section">
            <h1 class="hero-title">🧱 乐高故事书籍</h1>
            <p class="hero-subtitle">创建属于你自己的乐高冒险故事</p>
            <a href="/story-create" class="btn btn-primary btn-large">开始创作</a>
        </section>
        
        <section class="features-section">
            <h2 class="section-title">功能特色</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🎭</div>
                    <h3>丰富人仔</h3>
                    <p>12个预设人仔，支持自定义创建</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📖</div>
                    <h3>故事创作</h3>
                    <p>AI辅助生成精彩故事内容</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🧩</div>
                    <h3>互动解密</h3>
                    <p>趣味谜题增强阅读体验</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">👨‍👩‍👧‍👦</div>
                    <h3>家长控制</h3>
                    <p>安全健康的使用环境</p>
                </div>
            </div>
        </section>
    </main>
    
    <footer class="footer">
        <p>© 2024 乐高故事书籍 - 激发儿童创造力</p>
    </footer>
    
    <script src="/js/app.js"></script>
</body>
</html>
```

### 2.2 主页样式

```css
.hero-section {
    text-align: center;
    padding: 80px 20px;
    background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
    border-bottom: 4px solid #333;
}

.hero-title {
    font-size: 48px;
    margin-bottom: 20px;
    color: #333;
}

.hero-subtitle {
    font-size: 24px;
    color: #333;
    margin-bottom: 40px;
}

.features-section {
    padding: 60px 20px;
}

.section-title {
    text-align: center;
    font-size: 32px;
    margin-bottom: 40px;
    color: #333;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
    max-width: 1200px;
    margin: 0 auto;
}

.feature-card {
    background: white;
    border-radius: 16px;
    border: 3px solid #333;
    box-shadow: 0 4px 0 #333;
    padding: 30px;
    text-align: center;
}

.feature-icon {
    font-size: 48px;
    margin-bottom: 20px;
}

.feature-card h3 {
    font-size: 20px;
    margin-bottom: 10px;
    color: #333;
}

.feature-card p {
    font-size: 16px;
    color: #666;
}
```

## 3. 登录页设计

### 3.1 页面结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - 乐高故事书籍</title>
    <link rel="stylesheet" href="/css/variables.css">
    <link rel="stylesheet" href="/css/reset.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/pages.css">
</head>
<body class="login-page">
    <div class="login-container">
        <div class="login-card">
            <h1 class="login-title">🧱 乐高故事书籍</h1>
            <form id="login-form" class="login-form">
                <div class="input-group">
                    <label class="input-label" for="username">用户名</label>
                    <input type="text" id="username" class="input-field" placeholder="请输入用户名" required>
                </div>
                <div class="input-group">
                    <label class="input-label" for="password">密码</label>
                    <input type="password" id="password" class="input-field" placeholder="请输入密码" required>
                </div>
                <button type="submit" class="btn btn-primary btn-large btn-full">登录</button>
            </form>
            <div class="login-footer">
                <p>还没有账号？请联系管理员创建</p>
            </div>
        </div>
    </div>
    
    <script src="/js/pages/login.js"></script>
</body>
</html>
```

### 3.2 登录页JavaScript

```javascript
class LoginPage {
    constructor() {
        this.form = document.getElementById('login-form');
        this.init();
    }
    
    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            toast.error('请填写用户名和密码');
            return;
        }
        
        loading.show('登录中...');
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user.user_id);
                toast.success('登录成功');
                setTimeout(() => {
                    window.location.href = '/story-create';
                }, 1000);
            } else {
                toast.error(data.error || '登录失败');
            }
        } catch (error) {
            toast.error('网络错误，请重试');
        } finally {
            loading.hide();
        }
    }
}

new LoginPage();
```

## 4. 故事创作页设计

### 4.1 页面结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>故事创作 - 乐高故事书籍</title>
    <link rel="stylesheet" href="/css/variables.css">
    <link rel="stylesheet" href="/css/reset.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/pages.css">
</head>
<body>
    <nav class="navbar">
        <!-- 导航栏 -->
    </nav>
    
    <main class="main-content">
        <div class="story-create-container">
            <!-- 步骤指示器 -->
            <div class="step-indicator">
                <div class="step active" data-step="0">
                    <span class="step-number">1</span>
                    <span class="step-label">选择书籍</span>
                </div>
                <div class="step" data-step="1">
                    <span class="step-number">2</span>
                    <span class="step-label">选择角色</span>
                </div>
                <div class="step" data-step="2">
                    <span class="step-number">3</span>
                    <span class="step-label">选择情节</span>
                </div>
                <div class="step" data-step="3">
                    <span class="step-number">4</span>
                    <span class="step-label">生成故事</span>
                </div>
            </div>
            
            <!-- 步骤内容 -->
            <div class="step-content">
                <!-- 步骤0: 选择书籍 -->
                <div class="step-panel active" id="step-0">
                    <h2>选择书籍</h2>
                    <div class="book-selection">
                        <div class="create-new-book">
                            <input type="radio" name="book-option" id="new-book" value="new" checked>
                            <label for="new-book">创建新书籍</label>
                            <input type="text" id="new-book-name" class="input-field" placeholder="输入书籍名称">
                        </div>
                        <div class="existing-books">
                            <input type="radio" name="book-option" id="existing-book" value="existing">
                            <label for="existing-book">选择已有书籍续写</label>
                            <div id="book-list" class="book-grid">
                                <!-- 书籍列表 -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 步骤1: 选择角色 -->
                <div class="step-panel" id="step-1">
                    <h2>选择角色</h2>
                    <div class="character-selection">
                        <div class="preset-characters">
                            <h3>预设人仔</h3>
                            <div id="preset-characters-grid" class="character-grid">
                                <!-- 预设人仔网格 -->
                            </div>
                        </div>
                        <div class="custom-characters">
                            <h3>自定义人仔</h3>
                            <div id="custom-characters-grid" class="character-grid">
                                <!-- 自定义人仔网格 -->
                            </div>
                            <button class="btn btn-secondary" onclick="openCreateCharacterModal()">
                                + 创建人仔
                            </button>
                        </div>
                    </div>
                    <div class="selected-characters">
                        <h3>已选角色</h3>
                        <div id="selected-characters-list">
                            <!-- 已选角色列表 -->
                        </div>
                    </div>
                </div>
                
                <!-- 步骤2: 选择情节 -->
                <div class="step-panel" id="step-2">
                    <h2>选择情节</h2>
                    <div class="plot-selection">
                        <div class="preset-plots">
                            <h3>预设情节</h3>
                            <div id="preset-plots-grid" class="plot-grid">
                                <!-- 预设情节网格 -->
                            </div>
                        </div>
                        <div class="custom-plot">
                            <h3>自定义情节</h3>
                            <textarea id="custom-plot-input" class="input-field" placeholder="输入自定义情节描述（最多100字）" maxlength="100"></textarea>
                            <button class="btn btn-secondary" onclick="startVoiceInput()">
                                🎤 语音输入
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 步骤3: 生成故事 -->
                <div class="step-panel" id="step-3">
                    <h2>生成故事</h2>
                    <div id="story-result" class="story-result">
                        <!-- 故事结果 -->
                    </div>
                    <div id="prompt-display" class="prompt-display">
                        <!-- 提示词展示 -->
                    </div>
                </div>
            </div>
            
            <!-- 步骤导航 -->
            <div class="step-navigation">
                <button id="prev-btn" class="btn btn-secondary" onclick="prevStep()" disabled>上一步</button>
                <button id="next-btn" class="btn btn-primary" onclick="nextStep()">下一步</button>
            </div>
        </div>
    </main>
    
    <!-- 创建人仔弹窗 -->
    <div class="modal" id="create-character-modal">
        <!-- 弹窗内容 -->
    </div>
    
    <script src="/js/pages/story-create.js"></script>
</body>
</html>
```

### 4.2 故事创作页JavaScript

```javascript
class StoryCreatePage {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 4;
        this.selectedBook = null;
        this.selectedCharacters = [];
        this.selectedPlot = null;
        this.init();
    }
    
    init() {
        this.loadBooks();
        this.loadPresetCharacters();
        this.loadCustomCharacters();
        this.loadPresetPlots();
        this.checkUrlParams();
    }
    
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('bookId');
        if (bookId) {
            this.preselectBook(bookId);
        }
    }
    
    async loadBooks() {
        const response = await fetch('/api/books', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const data = await response.json();
        this.renderBookList(data.books);
    }
    
    renderBookList(books) {
        const container = document.getElementById('book-list');
        container.innerHTML = books.map(book => `
            <div class="book-card" data-book-id="${book.book_id}" onclick="selectBook('${book.book_id}')">
                <div class="book-cover">${book.cover_image ? `<img src="${book.cover_image}">` : '📚'}</div>
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-chapters">${book.chapter_count}章</div>
                </div>
            </div>
        `).join('');
    }
    
    async loadPresetCharacters() {
        const response = await fetch('/api/characters/preset');
        const data = await response.json();
        this.renderPresetCharacters(data.characters);
    }
    
    renderPresetCharacters(characters) {
        const container = document.getElementById('preset-characters-grid');
        container.innerHTML = characters.map(char => `
            <div class="character-card" data-character-id="${char.character_id}" onclick="toggleCharacter('${char.character_id}')">
                <img src="data:image/png;base64,${char.image_base64}" alt="${char.name}">
                <div class="character-name">${char.name}</div>
                <div class="character-traits">${char.personality}</div>
            </div>
        `).join('');
    }
    
    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            if (this.validateCurrentStep()) {
                this.currentStep++;
                this.updateStepDisplay();
                
                if (this.currentStep === this.totalSteps - 1) {
                    this.generateStory();
                }
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }
    
    validateCurrentStep() {
        switch (this.currentStep) {
            case 0:
                return this.validateBookSelection();
            case 1:
                return this.validateCharacterSelection();
            case 2:
                return this.validatePlotSelection();
            default:
                return true;
        }
    }
    
    validateBookSelection() {
        const newBookRadio = document.getElementById('new-book');
        if (newBookRadio.checked) {
            const bookName = document.getElementById('new-book-name').value.trim();
            if (!bookName) {
                toast.error('请输入书籍名称');
                return false;
            }
        } else if (!this.selectedBook) {
            toast.error('请选择一本书籍');
            return false;
        }
        return true;
    }
    
    validateCharacterSelection() {
        if (this.selectedCharacters.length === 0) {
            toast.error('请至少选择一个角色');
            return false;
        }
        
        const hasProtagonist = this.selectedCharacters.some(c => c.roleType === 'protagonist');
        if (!hasProtagonist) {
            toast.error('请选择一个主角');
            return false;
        }
        
        return true;
    }
    
    validatePlotSelection() {
        const customPlot = document.getElementById('custom-plot-input').value.trim();
        if (!this.selectedPlot && !customPlot) {
            toast.error('请选择或输入情节');
            return false;
        }
        return true;
    }
    
    updateStepDisplay() {
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.toggle('active', index <= this.currentStep);
        });
        
        document.querySelectorAll('.step-panel').forEach((panel, index) => {
            panel.classList.toggle('active', index === this.currentStep);
        });
        
        document.getElementById('prev-btn').disabled = this.currentStep === 0;
        document.getElementById('next-btn').textContent = 
            this.currentStep === this.totalSteps - 2 ? '生成故事' : '下一步';
    }
    
    async generateStory() {
        loading.show('正在生成故事...');
        
        try {
            const response = await fetch('/api/story/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    book_id: this.selectedBook,
                    chapter_roles: this.selectedCharacters.map(c => c.customName),
                    plot: this.selectedPlot || document.getElementById('custom-plot-input').value.trim()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.renderStoryResult(data.chapter, data.prompt_used);
                toast.success('故事生成成功');
            } else {
                toast.error(data.error || '故事生成失败');
            }
        } catch (error) {
            toast.error('网络错误，请重试');
        } finally {
            loading.hide();
        }
    }
    
    renderStoryResult(chapter, promptUsed) {
        const container = document.getElementById('story-result');
        container.innerHTML = `
            <div class="chapter-result">
                <h3>${chapter.title}</h3>
                <div class="chapter-content">${this.highlightKeywords(chapter.content)}</div>
                ${chapter.puzzle ? this.renderPuzzle(chapter.puzzle) : ''}
            </div>
        `;
        
        this.renderPromptDisplay(promptUsed);
    }
    
    renderPuzzle(puzzle) {
        return `
            <div class="puzzle-section">
                <h4>谜题</h4>
                <p class="puzzle-question">${puzzle.question}</p>
                <div class="puzzle-options">
                    ${puzzle.options.map((option, index) => `
                        <button class="puzzle-option" data-answer="${['A', 'B', 'C', 'D'][index]}" onclick="selectPuzzleAnswer(this, '${chapter.chapter_id}', '${puzzle.puzzle_id}')">
                            ${option}
                        </button>
                    `).join('')}
                </div>
                <div class="puzzle-hint" style="display: none;"></div>
            </div>
        `;
    }
    
    highlightKeywords(content) {
        return highlightKeywords(content, this.selectedCharacters);
    }
}

new StoryCreatePage();
```

## 5. 书架页设计

### 5.1 页面结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>书架 - 乐高故事书籍</title>
    <link rel="stylesheet" href="/css/variables.css">
    <link rel="stylesheet" href="/css/reset.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/pages.css">
</head>
<body>
    <nav class="navbar">
        <!-- 导航栏 -->
    </nav>
    
    <main class="main-content">
        <div class="bookshelf-container">
            <div class="bookshelf-header">
                <h1>我的书架</h1>
                <button class="btn btn-primary" onclick="createNewBook()">+ 新书籍</button>
            </div>
            
            <div id="book-grid" class="book-grid">
                <!-- 书籍网格 -->
            </div>
            
            <div class="pagination">
                <!-- 分页 -->
            </div>
            
            <div class="trash-section">
                <h2>回收站</h2>
                <div id="trash-list" class="trash-list">
                    <!-- 回收站书籍 -->
                </div>
            </div>
        </div>
    </main>
    
    <script src="/js/pages/bookshelf.js"></script>
</body>
</html>
```

## 6. 书籍详情页设计

### 6.1 页面结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>书籍详情 - 乐高故事书籍</title>
    <link rel="stylesheet" href="/css/variables.css">
    <link rel="stylesheet" href="/css/reset.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/pages.css">
</head>
<body>
    <nav class="navbar">
        <!-- 导航栏 -->
    </nav>
    
    <main class="main-content">
        <div class="book-detail-container">
            <div class="book-info-section">
                <div class="book-cover">
                    <img id="book-cover-img" src="" alt="">
                </div>
                <div class="book-meta">
                    <h1 id="book-title"></h1>
                    <p id="book-chapters"></p>
                    <p id="book-created"></p>
                    <div class="book-actions">
                        <button class="btn btn-secondary" onclick="editBookTitle()">编辑书名</button>
                        <button class="btn btn-secondary" onclick="manageRoles()">管理角色</button>
                        <button class="btn btn-secondary" onclick="shareBook()">分享</button>
                        <button class="btn btn-danger" onclick="deleteBook()">删除</button>
                    </div>
                </div>
            </div>
            
            <div class="chapters-section">
                <h2>章节列表</h2>
                <div id="chapter-list" class="chapter-list">
                    <!-- 章节列表 -->
                </div>
                <button class="btn btn-primary" onclick="continueStory()">继续生成故事</button>
            </div>
            
            <div class="roles-section">
                <h2>角色管理</h2>
                <div id="roles-list" class="roles-list">
                    <!-- 角色列表 -->
                </div>
                <button class="btn btn-secondary" onclick="addRole()">+ 添加角色</button>
            </div>
        </div>
    </main>
    
    <script src="/js/pages/book.js"></script>
</body>
</html>
```

## 7. 人仔管理页设计

### 7.1 页面结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>人仔管理 - 乐高故事书籍</title>
    <link rel="stylesheet" href="/css/variables.css">
    <link rel="stylesheet" href="/css/reset.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/pages.css">
</head>
<body>
    <nav class="navbar">
        <!-- 导航栏 -->
    </nav>
    
    <main class="main-content">
        <div class="characters-container">
            <div class="characters-header">
                <h1>人仔管理</h1>
                <button class="btn btn-primary" onclick="openCreateCharacterModal()">+ 创建人仔</button>
            </div>
            
            <div class="preset-section">
                <h2>预设人仔</h2>
                <div id="preset-characters" class="character-grid">
                    <!-- 预设人仔网格 -->
                </div>
            </div>
            
            <div class="custom-section">
                <h2>自定义人仔</h2>
                <div id="custom-characters" class="character-grid">
                    <!-- 自定义人仔网格 -->
                </div>
            </div>
        </div>
    </main>
    
    <!-- 创建人仔弹窗 -->
    <div class="modal" id="create-character-modal">
        <div class="modal-overlay"></div>
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3>创建人仔</h3>
                <button class="modal-close" onclick="closeModal('create-character-modal')">×</button>
            </div>
            <div class="modal-body">
                <div class="create-character-layout">
                    <div class="upload-section">
                        <h4>上传图片</h4>
                        <div id="upload-area" class="upload-area">
                            <input type="file" id="character-image" accept="image/jpeg,image/png" onchange="handleImageUpload(event)">
                            <div class="upload-placeholder">
                                <span>📷 点击或拖拽上传图片</span>
                                <span>支持 JPG/PNG 格式</span>
                            </div>
                        </div>
                        <button class="btn btn-secondary" onclick="generateLegoImage()" id="generate-btn" disabled>
                            生成乐高人仔
                        </button>
                    </div>
                    <div class="preview-section">
                        <h4>预览</h4>
                        <div id="preview-area" class="preview-area">
                            <img id="preview-image" src="" alt="">
                        </div>
                    </div>
                </div>
                <div class="character-form">
                    <div class="input-group">
                        <label class="input-label">人仔名称 *</label>
                        <input type="text" id="character-name" class="input-field" maxlength="20" placeholder="最多20个字符">
                    </div>
                    <div class="input-group">
                        <label class="input-label">人设描述</label>
                        <textarea id="character-description" class="input-field" maxlength="100" placeholder="最多100个字符"></textarea>
                    </div>
                    <div class="input-group">
                        <label class="input-label">性格类型 *</label>
                        <select id="character-personality" class="select-field">
                            <!-- 性格选项 -->
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">说话方式 *</label>
                        <select id="character-speaking-style" class="select-field">
                            <!-- 说话方式选项 -->
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('create-character-modal')">取消</button>
                <button class="btn btn-primary" onclick="createCharacter()">创建</button>
            </div>
        </div>
    </div>
    
    <script src="/js/pages/characters.js"></script>
</body>
</html>
```

## 8. 文件结构

```
/
├── index.html              - 主页
├── login.html              - 登录页
├── story-create.html       - 故事创作页
├── bookshelf.html          - 书架页
├── book.html               - 书籍详情页
├── characters.html         - 人仔管理页
├── adventure.html          - 冒险工坊页
├── parent.html             - 家长控制页
├── share.html              - 分享访问页
├── static/
│   ├── css/
│   │   ├── variables.css
│   │   ├── reset.css
│   │   ├── components.css
│   │   └── pages.css
│   ├── js/
│   │   ├── utils/
│   │   │   ├── auth.js
│   │   │   ├── api.js
│   │   │   └── helpers.js
│   │   ├── components/
│   │   │   ├── navbar.js
│   │   │   ├── modal.js
│   │   │   ├── toast.js
│   │   │   └── loading.js
│   │   ├── pages/
│   │   │   ├── login.js
│   │   │   ├── story-create.js
│   │   │   ├── bookshelf.js
│   │   │   ├── book.js
│   │   │   └── characters.js
│   │   └── app.js
│   └── images/
│       ├── icons/
│       └── characters/
└── functions/
    └── api/
        └── ...
```
