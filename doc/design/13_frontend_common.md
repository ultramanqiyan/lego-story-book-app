# 前端公共组件设计文档

## 1. 组件概述

前端公共组件是整个系统共享的UI组件，包括导航栏、按钮、弹窗、表单等基础组件。

## 2. 样式规范

### 2.1 色彩规范

```css
:root {
    --primary-color: #FFD700;
    --primary-dark: #FFA500;
    --secondary-color: #4CAF50;
    --danger-color: #f44336;
    --text-color: #333333;
    --text-light: #666666;
    --background-color: #f5f5f5;
    --card-background: #ffffff;
    --border-color: #dddddd;
    --shadow-color: rgba(0, 0, 0, 0.1);
}
```

### 2.2 乐高积木风格

```css
.lego-style {
    border-radius: 12px;
    border: 3px solid #333;
    box-shadow: 0 4px 0 #333;
    background: linear-gradient(180deg, var(--primary-color) 0%, var(--primary-dark) 100%);
}

.lego-button {
    padding: 12px 24px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
}

.lego-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #333;
}

.lego-button:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #333;
}
```

### 2.3 响应式断点

```css
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .container {
        padding: 20px;
    }
}

@media (min-width: 1025px) {
    .container {
        padding: 30px;
        max-width: 1200px;
        margin: 0 auto;
    }
}
```

## 3. 导航栏组件

### 3.1 组件结构

```html
<nav class="navbar">
    <div class="navbar-brand">
        <a href="/" class="logo">🧱 乐高故事</a>
    </div>
    <div class="navbar-menu">
        <a href="/story-create" class="nav-item">故事创作</a>
        <a href="/bookshelf" class="nav-item">书架</a>
        <a href="/characters" class="nav-item">人仔管理</a>
        <div class="nav-dropdown">
            <span class="nav-item">更多 ▼</span>
            <div class="dropdown-content">
                <a href="/adventure">冒险工坊</a>
                <a href="/parent">家长控制</a>
            </div>
        </div>
    </div>
    <div class="navbar-user">
        <span id="username">用户名</span>
        <button id="logout-btn" class="logout-btn">🚪 退出</button>
    </div>
</nav>
```

### 3.2 组件样式

```css
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 30px;
    background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
    border-bottom: 4px solid #333;
    box-shadow: 0 4px 0 #333;
}

.navbar-brand .logo {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    text-decoration: none;
}

.navbar-menu {
    display: flex;
    gap: 20px;
}

.nav-item {
    color: #333;
    text-decoration: none;
    font-weight: bold;
    padding: 8px 16px;
    border-radius: 8px;
    transition: background-color 0.2s;
}

.nav-item:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

.nav-dropdown {
    position: relative;
}

.dropdown-content {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 150px;
    z-index: 1000;
}

.nav-dropdown:hover .dropdown-content {
    display: block;
}

.dropdown-content a {
    display: block;
    padding: 12px 16px;
    color: #333;
    text-decoration: none;
}

.dropdown-content a:hover {
    background-color: #f5f5f5;
}

.logout-btn {
    background: linear-gradient(180deg, #f44336 0%, #d32f2f 100%);
    color: white;
    border: 3px solid #333;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-weight: bold;
}
```

### 3.3 导航栏JavaScript

```javascript
class Navbar {
    constructor() {
        this.init();
    }
    
    init() {
        this.checkAuth();
        this.bindEvents();
    }
    
    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        try {
            const response = await fetch('/api/auth/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                document.getElementById('username').textContent = data.user.username;
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
    
    bindEvents() {
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }
    
    async logout() {
        const token = localStorage.getItem('token');
        
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Logout failed:', error);
        }
        
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/login';
    }
}

new Navbar();
```

## 4. 按钮组件

### 4.1 按钮类型

```css
.btn {
    display: inline-block;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 12px;
    border: 3px solid #333;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    text-decoration: none;
}

.btn-primary {
    background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
    color: #333;
    box-shadow: 0 4px 0 #333;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #333;
}

.btn-primary:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #333;
}

.btn-secondary {
    background: linear-gradient(180deg, #4CAF50 0%, #45a049 100%);
    color: white;
    box-shadow: 0 4px 0 #2d6a2f;
}

.btn-danger {
    background: linear-gradient(180deg, #f44336 0%, #d32f2f 100%);
    color: white;
    box-shadow: 0 4px 0 #a52822;
}

.btn-disabled {
    background: #cccccc;
    color: #666666;
    cursor: not-allowed;
    box-shadow: none;
}

.btn-small {
    padding: 8px 16px;
    font-size: 14px;
}

.btn-large {
    padding: 16px 32px;
    font-size: 18px;
}
```

## 5. 弹窗组件

### 5.1 弹窗结构

```html
<div class="modal" id="modal">
    <div class="modal-overlay" onclick="closeModal()"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">弹窗标题</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            弹窗内容
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="confirmModal()">确认</button>
        </div>
    </div>
</div>
```

### 5.2 弹窗样式

```css
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
}

.modal.active {
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
}

.modal-content {
    position: relative;
    background: white;
    border-radius: 16px;
    border: 4px solid #333;
    box-shadow: 0 8px 0 #333;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 2px solid #eee;
}

.modal-title {
    margin: 0;
    font-size: 20px;
    color: #333;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.modal-body {
    padding: 20px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 20px;
    border-top: 2px solid #eee;
}
```

### 5.3 弹窗JavaScript

```javascript
class Modal {
    constructor(id) {
        this.modal = document.getElementById(id);
        this.onConfirm = null;
    }
    
    open(title, content, onConfirm = null) {
        this.modal.querySelector('.modal-title').textContent = title;
        this.modal.querySelector('.modal-body').innerHTML = content;
        this.onConfirm = onConfirm;
        this.modal.classList.add('active');
    }
    
    close() {
        this.modal.classList.remove('active');
    }
    
    confirm() {
        if (this.onConfirm) {
            this.onConfirm();
        }
        this.close();
    }
}

function openModal(title, content, onConfirm) {
    window.currentModal = new Modal('modal');
    window.currentModal.open(title, content, onConfirm);
}

function closeModal() {
    if (window.currentModal) {
        window.currentModal.close();
    }
}

function confirmModal() {
    if (window.currentModal) {
        window.currentModal.confirm();
    }
}
```

## 6. 表单组件

### 6.1 输入框

```css
.input-group {
    margin-bottom: 20px;
}

.input-label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #333;
}

.input-field {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
    border: 3px solid #333;
    border-radius: 12px;
    box-shadow: 0 2px 0 #333 inset;
    transition: border-color 0.2s;
}

.input-field:focus {
    outline: none;
    border-color: #FFD700;
}

.input-error {
    color: #f44336;
    font-size: 14px;
    margin-top: 4px;
}

.input-field.error {
    border-color: #f44336;
}
```

### 6.2 下拉选择框

```css
.select-field {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
    border: 3px solid #333;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
}

.select-field:focus {
    outline: none;
    border-color: #FFD700;
}
```

### 6.3 复选框

```css
.checkbox-group {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}

.checkbox-input {
    width: 24px;
    height: 24px;
    border: 3px solid #333;
    border-radius: 6px;
    cursor: pointer;
    appearance: none;
    background: white;
}

.checkbox-input:checked {
    background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
}

.checkbox-input:checked::after {
    content: '✓';
    display: block;
    text-align: center;
    color: #333;
    font-weight: bold;
    line-height: 18px;
}
```

## 7. 卡片组件

### 7.1 卡片样式

```css
.card {
    background: white;
    border-radius: 16px;
    border: 3px solid #333;
    box-shadow: 0 4px 0 #333;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 0 #333;
}

.card-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-bottom: 3px solid #333;
}

.card-body {
    padding: 16px;
}

.card-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
    color: #333;
}

.card-text {
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
}

.card-actions {
    display: flex;
    gap: 8px;
}
```

## 8. Toast提示组件

### 8.1 Toast样式

```css
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.toast {
    padding: 16px 24px;
    border-radius: 12px;
    border: 3px solid #333;
    box-shadow: 0 4px 0 #333;
    font-weight: bold;
    animation: slideIn 0.3s ease;
}

.toast-success {
    background: linear-gradient(180deg, #4CAF50 0%, #45a049 100%);
    color: white;
}

.toast-error {
    background: linear-gradient(180deg, #f44336 0%, #d32f2f 100%);
    color: white;
}

.toast-warning {
    background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
    color: #333;
}

.toast-info {
    background: linear-gradient(180deg, #2196F3 0%, #1976D2 100%);
    color: white;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
```

### 8.2 Toast JavaScript

```javascript
class Toast {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }
    
    success(message) {
        this.show(message, 'success');
    }
    
    error(message) {
        this.show(message, 'error');
    }
    
    warning(message) {
        this.show(message, 'warning');
    }
    
    info(message) {
        this.show(message, 'info');
    }
}

const toast = new Toast();
```

## 9. 加载组件

### 9.1 加载动画

```css
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 4000;
}

.loading-spinner {
    width: 60px;
    height: 60px;
    border: 6px solid #FFD700;
    border-top-color: #333;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-text {
    margin-top: 20px;
    font-size: 18px;
    font-weight: bold;
    color: #333;
}
```

### 9.2 加载JavaScript

```javascript
class Loading {
    constructor() {
        this.overlay = null;
    }
    
    show(text = '加载中...') {
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = `
            <div style="text-align: center;">
                <div class="loading-spinner"></div>
                <div class="loading-text">${text}</div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    }
    
    hide() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}

const loading = new Loading();
```

## 10. 文件结构

```
static/
├── css/
│   ├── variables.css      - CSS变量
│   ├── reset.css          - 样式重置
│   ├── components.css     - 组件样式
│   └── pages.css          - 页面样式
├── js/
│   ├── utils/
│   │   ├── auth.js        - 认证工具
│   │   ├── api.js         - API工具
│   │   └── helpers.js     - 辅助函数
│   ├── components/
│   │   ├── navbar.js      - 导航栏组件
│   │   ├── modal.js       - 弹窗组件
│   │   ├── toast.js       - 提示组件
│   │   └── loading.js     - 加载组件
│   └── app.js             - 应用入口
└── images/
    ├── icons/             - 图标
    └── characters/        - 人仔图片
```
