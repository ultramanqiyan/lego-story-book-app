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

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8789,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

function requestPage(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:8789${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', reject);
    });
}

async function runTests() {
    console.log('\n========================================');
    console.log('乐高故事书系统 - 网页端自动化测试');
    console.log('========================================\n');

    let token = null;
    let userId = null;
    let bookId = null;
    let characterId = null;

    // ========== 1. 页面加载测试 ==========
    console.log('1. 页面加载测试');
    console.log('-'.repeat(40));

    try {
        const home = await requestPage('/');
        if (home.status === 200 && home.data.includes('乐高故事书')) {
            log('首页加载', 'passed', '状态码200，内容正确');
        } else {
            log('首页加载', 'failed', `状态码${home.status}`);
        }
    } catch (e) {
        log('首页加载', 'failed', e.message);
    }

    try {
        const login = await requestPage('/login.html');
        if (login.status === 200 && login.data.includes('登录')) {
            log('登录页加载', 'passed', '状态码200，内容正确');
        } else {
            log('登录页加载', 'failed', `状态码${login.status}`);
        }
    } catch (e) {
        log('登录页加载', 'failed', e.message);
    }

    try {
        const bookshelf = await requestPage('/bookshelf.html');
        if (bookshelf.status === 200) {
            log('书架页加载', 'passed', '状态码200');
        } else {
            log('书架页加载', 'failed', `状态码${bookshelf.status}`);
        }
    } catch (e) {
        log('书架页加载', 'failed', e.message);
    }

    try {
        const characters = await requestPage('/characters.html');
        if (characters.status === 200) {
            log('角色页加载', 'passed', '状态码200');
        } else {
            log('角色页加载', 'failed', `状态码${characters.status}`);
        }
    } catch (e) {
        log('角色页加载', 'failed', e.message);
    }

    try {
        const storyCreate = await requestPage('/story-create.html');
        if (storyCreate.status === 200) {
            log('创建故事页加载', 'passed', '状态码200');
        } else {
            log('创建故事页加载', 'failed', `状态码${storyCreate.status}`);
        }
    } catch (e) {
        log('创建故事页加载', 'failed', e.message);
    }

    console.log('\n1.2 无后缀URL路由测试');
    console.log('-'.repeat(40));

    const noExtPaths = ['/bookshelf', '/characters', '/story-create', '/parent', '/login'];
    for (const p of noExtPaths) {
        try {
            const page = await requestPage(p);
            if (page.status === 200) {
                log(`路由: ${p}`, 'passed', '状态码200');
            } else {
                log(`路由: ${p}`, 'failed', `状态码${page.status}`);
            }
        } catch (e) {
            log(`路由: ${p}`, 'failed', e.message);
        }
    }

    // ========== 2. 用户注册测试 ==========
    console.log('\n2. 用户注册测试');
    console.log('-'.repeat(40));

    const timestamp = Date.now();
    const testUsername = `testuser_${timestamp}`;
    const testPassword = 'test123456';

    try {
        const register = await request('POST', '/api/auth/login', {
            username: testUsername,
            password: testPassword,
            nickname: '测试用户',
            age_range: '6-8',
            is_register: true
        });

        if (register.status === 200 && register.data.token) {
            token = register.data.token;
            userId = register.data.user.user_id;
            log('用户注册', 'passed', `用户名: ${testUsername}`);
        } else {
            log('用户注册', 'failed', register.data.error || '未返回token');
        }
    } catch (e) {
        log('用户注册', 'failed', e.message);
    }

    try {
        const duplicate = await request('POST', '/api/auth/login', {
            username: testUsername,
            password: testPassword,
            is_register: true
        });

        if (duplicate.status === 400 && duplicate.data.error === '用户名已存在') {
            log('重复注册检测', 'passed', '正确返回用户名已存在');
        } else {
            log('重复注册检测', 'failed', '未正确检测重复用户名');
        }
    } catch (e) {
        log('重复注册检测', 'failed', e.message);
    }

    // ========== 3. 用户登录测试 ==========
    console.log('\n3. 用户登录测试');
    console.log('-'.repeat(40));

    try {
        const login = await request('POST', '/api/auth/login', {
            username: testUsername,
            password: testPassword
        });

        if (login.status === 200 && login.data.token) {
            log('用户登录', 'passed', '登录成功');
        } else {
            log('用户登录', 'failed', login.data.error || '登录失败');
        }
    } catch (e) {
        log('用户登录', 'failed', e.message);
    }

    try {
        const wrongPwd = await request('POST', '/api/auth/login', {
            username: testUsername,
            password: 'wrongpassword'
        });

        if (wrongPwd.status === 401) {
            log('错误密码登录', 'passed', '正确拒绝登录');
        } else {
            log('错误密码登录', 'failed', '未正确拒绝错误密码');
        }
    } catch (e) {
        log('错误密码登录', 'failed', e.message);
    }

    try {
        const wrongUser = await request('POST', '/api/auth/login', {
            username: 'nonexistent_user',
            password: 'anypassword'
        });

        if (wrongUser.status === 401) {
            log('不存在用户登录', 'passed', '正确拒绝登录');
        } else {
            log('不存在用户登录', 'failed', '未正确拒绝不存在用户');
        }
    } catch (e) {
        log('不存在用户登录', 'failed', e.message);
    }

    // ========== 4. 预设角色测试 ==========
    console.log('\n4. 预设角色测试');
    console.log('-'.repeat(40));

    try {
        const presets = await request('GET', '/api/characters/preset');

        if (presets.status === 200 && Array.isArray(presets.data) && presets.data.length >= 6) {
            log('获取预设角色', 'passed', `返回${presets.data.length}个预设角色`);
        } else {
            log('获取预设角色', 'failed', '预设角色数量不足');
        }
    } catch (e) {
        log('获取预设角色', 'failed', e.message);
    }

    // ========== 5. 自定义角色测试 ==========
    console.log('\n5. 自定义角色测试');
    console.log('-'.repeat(40));

    try {
        const createChar = await request('POST', '/api/characters/custom', {
            name: '测试角色',
            appearance: { hair: 'black', outfit: 'hero' },
            personality: '勇敢、善良'
        }, token);

        if (createChar.status === 200 && createChar.data.character_id) {
            characterId = createChar.data.character_id;
            log('创建自定义角色', 'passed', `角色ID: ${characterId}`);
        } else {
            log('创建自定义角色', 'failed', createChar.data.error || '创建失败');
        }
    } catch (e) {
        log('创建自定义角色', 'failed', e.message);
    }

    try {
        const chars = await request('GET', '/api/characters/custom', null, token);

        if (chars.status === 200 && Array.isArray(chars.data)) {
            log('获取自定义角色列表', 'passed', `返回${chars.data.length}个角色`);
        } else {
            log('获取自定义角色列表', 'failed', '获取失败');
        }
    } catch (e) {
        log('获取自定义角色列表', 'failed', e.message);
    }

    try {
        const noAuth = await request('GET', '/api/characters/custom');

        if (noAuth.status === 401) {
            log('未登录访问角色', 'passed', '正确返回401');
        } else {
            log('未登录访问角色', 'failed', '未正确拒绝未授权访问');
        }
    } catch (e) {
        log('未登录访问角色', 'failed', e.message);
    }

    // ========== 6. 书籍管理测试 ==========
    console.log('\n6. 书籍管理测试');
    console.log('-'.repeat(40));

    try {
        const createBook = await request('POST', '/api/books', {
            title: '测试书籍',
            theme: 'space',
            age_range: '6-8'
        }, token);

        if (createBook.status === 200 && createBook.data.book_id) {
            bookId = createBook.data.book_id;
            log('创建书籍', 'passed', `书籍ID: ${bookId}`);
        } else {
            log('创建书籍', 'failed', createBook.data.error || '创建失败');
        }
    } catch (e) {
        log('创建书籍', 'failed', e.message);
    }

    try {
        const books = await request('GET', '/api/books', null, token);

        if (books.status === 200 && Array.isArray(books.data)) {
            log('获取书籍列表', 'passed', `返回${books.data.length}本书`);
        } else {
            log('获取书籍列表', 'failed', '获取失败');
        }
    } catch (e) {
        log('获取书籍列表', 'failed', e.message);
    }

    try {
        const noAuth = await request('GET', '/api/books');

        if (noAuth.status === 401) {
            log('未登录访问书籍', 'passed', '正确返回401');
        } else {
            log('未登录访问书籍', 'failed', '未正确拒绝未授权访问');
        }
    } catch (e) {
        log('未登录访问书籍', 'failed', e.message);
    }

    // ========== 7. 故事生成测试 ==========
    console.log('\n7. 故事生成测试');
    console.log('-'.repeat(40));

    try {
        const generate = await request('POST', '/api/story/generate', {
            title: '太空冒险',
            theme: 'space',
            character_id: characterId || 'preset_1',
            length: 'short'
        }, token);

        if (generate.status === 200 && generate.data.book_id) {
            log('生成故事', 'passed', `故事ID: ${generate.data.book_id}`);
        } else {
            log('生成故事', 'failed', generate.data.error || '生成失败');
        }
    } catch (e) {
        log('生成故事', 'failed', e.message);
    }

    try {
        const noAuth = await request('POST', '/api/story/generate', {
            title: '测试',
            theme: 'space'
        });

        if (noAuth.status === 401) {
            log('未登录生成故事', 'passed', '正确返回401');
        } else {
            log('未登录生成故事', 'failed', '未正确拒绝未授权访问');
        }
    } catch (e) {
        log('未登录生成故事', 'failed', e.message);
    }

    // ========== 8. 章节获取测试 ==========
    console.log('\n8. 章节获取测试');
    console.log('-'.repeat(40));

    if (bookId) {
        try {
            const chapters = await request('GET', `/api/chapters/book/${bookId}`);

            if (chapters.status === 200 && Array.isArray(chapters.data)) {
                log('获取章节列表', 'passed', `返回${chapters.data.length}章`);
            } else {
                log('获取章节列表', 'failed', '获取失败');
            }
        } catch (e) {
            log('获取章节列表', 'failed', e.message);
        }
    } else {
        log('获取章节列表', 'skipped', '无书籍ID');
    }

    // ========== 9. 家长控制测试 ==========
    console.log('\n9. 家长控制测试');
    console.log('-'.repeat(40));

    try {
        const settings = await request('GET', '/api/parent/settings', null, token);

        if (settings.status === 200) {
            log('获取家长设置', 'passed', '获取成功');
        } else {
            log('获取家长设置', 'failed', '获取失败');
        }
    } catch (e) {
        log('获取家长设置', 'failed', e.message);
    }

    try {
        const update = await request('POST', '/api/parent/settings', {
            daily_time_limit: 90,
            rest_reminder_interval: 20,
            content_filter_level: 'strict'
        }, token);

        if (update.status === 200 && update.data.daily_time_limit === 90) {
            log('更新家长设置', 'passed', '时长限制已更新为90分钟');
        } else {
            log('更新家长设置', 'failed', '更新失败');
        }
    } catch (e) {
        log('更新家长设置', 'failed', e.message);
    }

    try {
        const noAuth = await request('GET', '/api/parent/settings');

        if (noAuth.status === 401) {
            log('未登录访问家长设置', 'passed', '正确返回401');
        } else {
            log('未登录访问家长设置', 'failed', '未正确拒绝未授权访问');
        }
    } catch (e) {
        log('未登录访问家长设置', 'failed', e.message);
    }

    // ========== 10. 登出测试 ==========
    console.log('\n10. 登出测试');
    console.log('-'.repeat(40));

    try {
        const logout = await request('POST', '/api/auth/logout', null, token);

        if (logout.status === 200) {
            log('用户登出', 'passed', '登出成功');
        } else {
            log('用户登出', 'failed', '登出失败');
        }
    } catch (e) {
        log('用户登出', 'failed', e.message);
    }

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

    return testResults;
}

runTests().catch(console.error);
