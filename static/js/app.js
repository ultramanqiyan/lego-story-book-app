const API_BASE = '';

const App = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),

    isAuthenticated() {
        return !!this.token;
    },

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    async api(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            this.clearAuth();
            window.location.href = '/login';
            return;
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '请求失败');
        }

        return data;
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes}分钟`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
    },

    getThemeName(theme) {
        const themes = {
            space: '太空探险',
            ocean: '海底世界',
            forest: '森林奇遇',
            castle: '城堡传说',
            city: '城市英雄',
            dinosaur: '恐龙时代'
        };
        return themes[theme] || theme;
    },

    checkAuth(redirect = true) {
        if (!this.isAuthenticated()) {
            if (redirect) {
                window.location.href = '/login';
            }
            return false;
        }
        return true;
    },

    init() {
        document.querySelectorAll('.logout-btn, #logoutBtn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await this.api('/api/auth/logout', { method: 'POST' });
                } catch (err) {
                    console.error('Logout error:', err);
                }
                this.clearAuth();
                window.location.href = '/';
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
