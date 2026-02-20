document.addEventListener('DOMContentLoaded', () => {
    if (App.isAuthenticated()) {
        window.location.href = '/bookshelf';
        return;
    }

    initAuthForms();
});

function initAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const data = await App.api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            App.setAuth(data.token, data.user);
            App.showToast('登录成功！', 'success');
            
            setTimeout(() => {
                window.location.href = '/bookshelf';
            }, 500);
        } catch (err) {
            App.showToast(err.message, 'error');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const nickname = document.getElementById('regNickname').value;
        const age = document.getElementById('regAge').value;

        if (password !== confirmPassword) {
            App.showToast('两次输入的密码不一致', 'error');
            return;
        }

        try {
            const data = await App.api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    password,
                    nickname: nickname || username,
                    age_range: age,
                    is_register: true
                })
            });

            App.setAuth(data.token, data.user);
            App.showToast('注册成功！', 'success');
            
            setTimeout(() => {
                window.location.href = '/bookshelf';
            }, 500);
        } catch (err) {
            App.showToast(err.message, 'error');
        }
    });
}
