let parentSettings = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!App.checkAuth()) return;
    checkParentMode();
    initTabs();
    initForms();
});

async function checkParentMode() {
    try {
        parentSettings = await App.api('/api/parent/settings');
        if (parentSettings.is_parent_mode || !parentSettings.parent_password) showDashboard();
        else showLogin();
    } catch (e) { showLogin(); }
}

function showLogin() {
    document.getElementById('parentLogin').style.display = 'flex';
    document.getElementById('parentDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('parentLogin').style.display = 'none';
    document.getElementById('parentDashboard').style.display = 'block';
    loadSettings();
    loadUsageReport('daily');
}

function initTabs() {
    document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');
        };
    });
}

function initForms() {
    document.getElementById('parentVerifyForm').onsubmit = async (e) => {
        e.preventDefault();
        try { await App.api('/api/parent/verify', { method: 'POST', body: JSON.stringify({ password: document.getElementById('parentPassword').value }) }); showDashboard(); }
        catch (err) { App.showToast(err.message, 'error'); }
    };
    document.getElementById('exitParentMode').onclick = async () => {
        try { await App.api('/api/parent/exit', { method: 'POST' }); window.location.href = '/'; } catch (e) {}
    };
    document.getElementById('saveSettings').onclick = saveSettings;
    document.getElementById('setPasswordForm').onsubmit = async (e) => {
        e.preventDefault();
        const p1 = document.getElementById('newPassword').value;
        const p2 = document.getElementById('confirmNewPassword').value;
        if (p1 !== p2) { App.showToast('密码不一致', 'error'); return; }
        if (p1.length < 4) { App.showToast('密码至少4位', 'error'); return; }
        try { await App.api('/api/parent/settings', { method: 'POST', body: JSON.stringify({ parent_password: p1 }) }); App.showToast('设置成功', 'success'); e.target.reset(); }
        catch (err) { App.showToast(err.message, 'error'); }
    };
    document.querySelectorAll('.usage-filters .filter-btn').forEach(btn => {
        btn.onclick = () => { document.querySelectorAll('.usage-filters .filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); loadUsageReport(btn.dataset.range); };
    });
}

async function loadSettings() {
    try {
        const s = await App.api('/api/parent/settings');
        parentSettings = s;
        document.getElementById('dailyTimeLimit').value = s.daily_time_limit || 60;
        document.getElementById('restReminder').value = s.rest_reminder_interval || 30;
        document.getElementById('contentFilter').value = s.content_filter_level || 'standard';
    } catch (e) {}
}

async function saveSettings() {
    try { await App.api('/api/parent/settings', { method: 'POST', body: JSON.stringify({ daily_time_limit: parseInt(document.getElementById('dailyTimeLimit').value), rest_reminder_interval: parseInt(document.getElementById('restReminder').value), content_filter_level: document.getElementById('contentFilter').value }) }); App.showToast('已保存', 'success'); }
    catch (err) { App.showToast(err.message, 'error'); }
}

async function loadUsageReport(range) {
    try {
        const data = await App.api(`/api/parent/settings?report=${range}`);
        const total = data.usage?.reduce((s, u) => s + (u.duration || 0), 0) || 0;
        document.getElementById('totalUsage').textContent = App.formatDuration(total);
        const list = document.getElementById('usageList');
        list.innerHTML = data.usage?.length ? data.usage.map(u => `<li><span>${u.date}</span><span>${App.formatDuration(u.duration || 0)}</span></li>`).join('') : '<li>暂无记录</li>';
    } catch (e) {}
}
