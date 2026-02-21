const { chromium } = require('playwright');
const http = require('http');

const BASE_URL = 'http://localhost:8789';

let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

function log(name, status, message) {
    const icon = status === 'passed' ? '✓' : status === 'failed' ? '✗' : '⊘';
    console.log(`  ${icon} ${name}: ${message}`);
    testResults.total++;
    if (status === 'passed') testResults.passed++;
    else if (status === 'failed') testResults.failed++;
    testResults.tests.push({ name, status, message });
}

async function checkServer() {
    return new Promise((resolve) => {
        const req = http.get(BASE_URL + '/', (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function runTests() {
    console.log('\n========================================');
    console.log('乐高故事书系统 - E2E网页端测试');
    console.log('========================================\n');

    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.log('错误: 服务器未运行，请先启动 server.js');
        process.exit(1);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let token = null;

    // ========== 1. 页面加载测试 ==========
    console.log('1. 页面加载测试');
    console.log('-'.repeat(40));

    try {
        await page.goto(BASE_URL + '/');
        const title = await page.title();
        if (title.includes('乐高')) {
            log('首页加载', 'passed', '标题: ' + title);
        } else {
            log('首页加载', 'failed', '标题不正确: ' + title);
        }
    } catch (e) {
        log('首页加载', 'failed', e.message);
    }

    try {
        await page.goto(BASE_URL + '/login.html');
        const hasLoginForm = await page.$('#loginForm') !== null;
        if (hasLoginForm) {
            log('登录页加载', 'passed', '登录表单存在');
        } else {
            log('登录页加载', 'failed', '登录表单不存在');
        }
    } catch (e) {
        log('登录页加载', 'failed', e.message);
    }

    try {
        await page.goto(BASE_URL + '/bookshelf.html');
        await page.waitForTimeout(500);
        const url = page.url();
        if (url.includes('login')) {
            log('书架页重定向', 'passed', '未登录正确重定向到登录页');
        } else {
            log('书架页重定向', 'failed', '未登录未正确重定向');
        }
    } catch (e) {
        log('书架页重定向', 'failed', e.message);
    }

    // ========== 2. 用户注册测试 ==========
    console.log('\n2. 用户注册测试');
    console.log('-'.repeat(40));

    const timestamp = Date.now();
    const testUsername = 'e2e_user_' + timestamp;

    try {
        await page.goto(BASE_URL + '/login.html');
        await page.click('#showRegister');
        await page.waitForTimeout(200);
        
        await page.fill('#regUsername', testUsername);
        await page.fill('#regPassword', 'test123456');
        await page.fill('#regConfirmPassword', 'test123456');
        await page.fill('#regNickname', 'E2E测试用户');
        await page.selectOption('#regAge', '6-8');
        
        await page.click('#registerForm button[type="submit"]');
        await page.waitForTimeout(1000);
        
        const url = page.url();
        if (url.includes('bookshelf')) {
            log('用户注册', 'passed', '注册成功并跳转到书架');
        } else {
            const toast = await page.$('.toast');
            if (toast) {
                const toastText = await toast.textContent();
                log('用户注册', 'failed', '提示: ' + toastText);
            } else {
                log('用户注册', 'failed', '注册失败，未跳转');
            }
        }
    } catch (e) {
        log('用户注册', 'failed', e.message);
    }

    // ========== 3. 书架页测试 ==========
    console.log('\n3. 书架页测试');
    console.log('-'.repeat(40));

    try {
        await page.goto(BASE_URL + '/bookshelf.html');
        await page.waitForTimeout(1000);
        
        const booksGrid = await page.$('#booksGrid');
        const emptyState = await page.$('#emptyState');
        
        if (booksGrid) {
            const isVisible = await booksGrid.isVisible();
            if (isVisible) {
                log('书架页显示', 'passed', '书籍网格正确显示');
            } else if (emptyState && await emptyState.isVisible()) {
                log('书架页显示', 'passed', '空状态正确显示');
            } else {
                log('书架页显示', 'failed', '内容未正确显示');
            }
        } else {
            log('书架页显示', 'failed', '书籍网格元素不存在');
        }
    } catch (e) {
        log('书架页显示', 'failed', e.message);
    }

    // ========== 4. 角色管理页测试 ==========
    console.log('\n4. 角色管理页测试');
    console.log('-'.repeat(40));

    try {
        await page.goto(BASE_URL + '/characters.html');
        await page.waitForTimeout(1000);
        
        const presetChars = await page.$$('#presetCharacters .character-card');
        if (presetChars.length > 0) {
            log('预设角色显示', 'passed', `显示${presetChars.length}个预设角色`);
        } else {
            log('预设角色显示', 'failed', '预设角色未显示');
        }
        
        const createBtn = await page.$('#createCharacterBtn');
        if (createBtn) {
            log('创建角色按钮', 'passed', '按钮存在');
        } else {
            log('创建角色按钮', 'failed', '按钮不存在');
        }
    } catch (e) {
        log('角色管理页', 'failed', e.message);
    }

    // ========== 5. 故事创建页测试 ==========
    console.log('\n5. 故事创建页测试');
    console.log('-'.repeat(40));

    try {
        await page.goto(BASE_URL + '/story-create.html');
        await page.waitForTimeout(1000);
        
        const stepIndicator = await page.$('.progress-steps');
        if (stepIndicator) {
            log('步骤指示器', 'passed', '步骤指示器存在');
        } else {
            log('步骤指示器', 'failed', '步骤指示器不存在');
        }
        
        const characterGrid = await page.$('#presetCharacters');
        if (characterGrid) {
            log('角色选择区', 'passed', '角色选择区存在');
        } else {
            log('角色选择区', 'failed', '角色选择区不存在');
        }
        
        const nextBtn = await page.$('#nextBtn');
        if (nextBtn) {
            log('下一步按钮', 'passed', '按钮存在');
        } else {
            log('下一步按钮', 'failed', '按钮不存在');
        }
    } catch (e) {
        log('故事创建页', 'failed', e.message);
    }

    // ========== 6. 家长控制页测试 ==========
    console.log('\n6. 家长控制页测试');
    console.log('-'.repeat(40));

    try {
        await page.goto(BASE_URL + '/parent.html');
        await page.waitForTimeout(1000);
        
        const parentLogin = await page.$('#parentLogin');
        const parentDashboard = await page.$('#parentDashboard');
        
        if (parentLogin && await parentLogin.isVisible()) {
            log('家长登录界面', 'passed', '登录界面正确显示');
        } else if (parentDashboard && await parentDashboard.isVisible()) {
            log('家长控制面板', 'passed', '控制面板正确显示');
        } else {
            log('家长控制页', 'failed', '界面未正确显示');
        }
    } catch (e) {
        log('家长控制页', 'failed', e.message);
    }

    // ========== 7. 登出测试 ==========
    console.log('\n7. 登出测试');
    console.log('-'.repeat(40));

    try {
        await page.goto(BASE_URL + '/bookshelf.html');
        await page.waitForTimeout(500);
        
        const logoutBtn = await page.$('.logout-btn, #logoutBtn');
        if (logoutBtn) {
            await logoutBtn.click();
            await page.waitForTimeout(1000);
            
            const url = page.url();
            if (url.includes('login') || url === BASE_URL + '/') {
                log('用户登出', 'passed', '登出成功并跳转');
            } else {
                log('用户登出', 'failed', '登出后未正确跳转');
            }
        } else {
            log('用户登出', 'skipped', '登出按钮未找到');
        }
    } catch (e) {
        log('用户登出', 'failed', e.message);
    }

    // ========== 8. JavaScript错误检查 ==========
    console.log('\n8. JavaScript错误检查');
    console.log('-'.repeat(40));

    const pages = [
        { name: '首页', url: '/' },
        { name: '登录页', url: '/login.html' },
        { name: '书架页', url: '/bookshelf.html' },
        { name: '角色页', url: '/characters.html' },
        { name: '创建故事页', url: '/story-create.html' },
        { name: '家长控制页', url: '/parent.html' }
    ];

    for (const p of pages) {
        try {
            const errors = [];
            page.on('pageerror', error => {
                errors.push(error.message);
            });
            
            await page.goto(BASE_URL + p.url);
            await page.waitForTimeout(1000);
            
            if (errors.length === 0) {
                log(`JS错误检查: ${p.name}`, 'passed', '无JS错误');
            } else {
                log(`JS错误检查: ${p.name}`, 'failed', `发现${errors.length}个错误`);
            }
        } catch (e) {
            log(`JS错误检查: ${p.name}`, 'failed', e.message);
        }
    }

    await browser.close();

    // ========== 测试总结 ==========
    console.log('\n========================================');
    console.log('测试结果汇总');
    console.log('========================================');
    console.log(`总计: ${testResults.total} 个测试`);
    console.log(`通过: ${testResults.passed} 个`);
    console.log(`失败: ${testResults.failed} 个`);
    console.log(`通过率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
        console.log('\n失败的测试:');
        testResults.tests.filter(t => t.status === 'failed').forEach(t => {
            console.log(`  - ${t.name}: ${t.message}`);
        });
    }

    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, 'e2e_test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n测试报告已保存到: ${reportPath}`);

    return testResults;
}

runTests().catch(console.error);
