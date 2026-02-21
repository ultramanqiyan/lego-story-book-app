const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8789;
const DATA_DIR = path.join(__dirname, 'tests', 'local', 'test_data');

function generateId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userId) {
    const payload = JSON.stringify({ userId: userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    return Buffer.from(payload).toString('base64');
}

function verifyToken(token) {
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (payload.exp < Date.now()) return null;
        return payload.userId;
    } catch (e) {
        return null;
    }
}

function loadJSON(file) {
    const filePath = path.join(DATA_DIR, file);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
}

function saveJSON(file, data) {
    const filePath = path.join(DATA_DIR, file);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const presetChars = [
    { character_id: 'preset_1', name: '小明', is_preset: true, avatar_emoji: '👦', personality: '勇敢、好奇' },
    { character_id: 'preset_2', name: '小红', is_preset: true, avatar_emoji: '👧', personality: '聪明、善良' },
    { character_id: 'preset_3', name: '小强', is_preset: true, avatar_emoji: '🧒', personality: '强壮、忠诚' },
    { character_id: 'preset_4', name: '小美', is_preset: true, avatar_emoji: '👩', personality: '优雅、有创意' },
    { character_id: 'preset_5', name: '小智', is_preset: true, avatar_emoji: '🧑', personality: '智慧、冷静' },
    { character_id: 'preset_6', name: '小勇', is_preset: true, avatar_emoji: '👦', personality: '冒险、热情' }
];

const server = http.createServer(function(req, res) {
    const url = new URL(req.url, 'http://localhost:' + PORT);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (url.pathname.startsWith('/api/')) {
        handleAPI(req, res, url);
        return;
    }

    let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
    let ext = path.extname(filePath).toLowerCase();
    
    if (!ext) {
        if (fs.existsSync(filePath + '.html')) {
            filePath = filePath + '.html';
            ext = '.html';
        } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
            filePath = path.join(filePath, 'index.html');
            ext = '.html';
        }
    }
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
    }
});

function handleAPI(req, res, url) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
        const authHeader = req.headers.authorization;
        const token = authHeader ? authHeader.replace('Bearer ', '') : null;
        const currentUserId = token ? verifyToken(token) : null;

        res.setHeader('Content-Type', 'application/json');

        try {
            if (url.pathname === '/api/auth/login' && req.method === 'POST') {
                const data = JSON.parse(body);
                const username = data.username;
                const password = data.password;
                const is_register = data.is_register;
                const nickname = data.nickname;
                const age_range = data.age_range;
                
                const users = loadJSON('users.json');
                
                if (is_register) {
                    if (users.find(function(u) { return u.username === username; })) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: '用户名已存在' }));
                        return;
                    }
                    const newUser = {
                        user_id: generateId('user_'),
                        username: username,
                        password_hash: hashPassword(password),
                        nickname: nickname || username,
                        age_range: age_range || '6-8',
                        created_at: Date.now()
                    };
                    users.push(newUser);
                    saveJSON('users.json', users);
                    
                    const userToken = generateToken(newUser.user_id);
                    res.writeHead(200);
                    res.end(JSON.stringify({ token: userToken, user: { user_id: newUser.user_id, username: username, nickname: newUser.nickname } }));
                    return;
                }

                const user = users.find(function(u) { return u.username === username && u.password_hash === hashPassword(password); });
                if (!user) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: '用户名或密码错误' }));
                    return;
                }
                
                const userToken = generateToken(user.user_id);
                res.writeHead(200);
                res.end(JSON.stringify({ token: userToken, user: { user_id: user.user_id, username: user.username, nickname: user.nickname } }));
                return;
            }

            if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
                res.writeHead(200);
                res.end(JSON.stringify({ message: '登出成功' }));
                return;
            }

            if (url.pathname === '/api/characters/preset' && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify(presetChars));
                return;
            }

            if (url.pathname === '/api/characters/custom' && req.method === 'GET') {
                if (!currentUserId) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: '未登录' }));
                    return;
                }
                const characters = loadJSON('characters.json');
                const custom = characters.filter(function(c) { return c.user_id === currentUserId && !c.is_preset; });
                res.writeHead(200);
                res.end(JSON.stringify(custom));
                return;
            }

            if (url.pathname === '/api/characters/custom' && req.method === 'POST') {
                if (!currentUserId) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: '未登录' }));
                    return;
                }
                const data = JSON.parse(body);
                const characters = loadJSON('characters.json');
                const newChar = {
                    character_id: generateId('char_'),
                    user_id: currentUserId,
                    name: data.name,
                    appearance: data.appearance,
                    personality: data.personality,
                    is_preset: false,
                    created_at: Date.now()
                };
                characters.push(newChar);
                saveJSON('characters.json', characters);
                res.writeHead(200);
                res.end(JSON.stringify(newChar));
                return;
            }

            if (url.pathname === '/api/books' && req.method === 'GET') {
                if (!currentUserId) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: '未登录' }));
                    return;
                }
                const books = loadJSON('books.json');
                const userBooks = books.filter(function(b) { return b.user_id === currentUserId; });
                res.writeHead(200);
                res.end(JSON.stringify(userBooks));
                return;
            }

            if (url.pathname === '/api/books' && req.method === 'POST') {
                if (!currentUserId) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: '未登录' }));
                    return;
                }
                const data = JSON.parse(body);
                const books = loadJSON('books.json');
                const newBook = {
                    book_id: generateId('book_'),
                    user_id: currentUserId,
                    title: data.title,
                    theme: data.theme,
                    age_range: data.age_range || '6-8',
                    is_archived: false,
                    is_completed: false,
                    total_chapters: 0,
                    read_chapters: 0,
                    created_at: Date.now()
                };
                books.push(newBook);
                saveJSON('books.json', books);
                res.writeHead(200);
                res.end(JSON.stringify(newBook));
                return;
            }

            if (url.pathname === '/api/story/generate' && req.method === 'POST') {
                if (!currentUserId) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: '未登录' }));
                    return;
                }
                const data = JSON.parse(body);
                const books = loadJSON('books.json');
                const chapters = loadJSON('chapters.json');
                
                const newBook = {
                    book_id: generateId('book_'),
                    user_id: currentUserId,
                    title: data.title || '我的冒险故事',
                    theme: data.theme || 'space',
                    is_archived: false,
                    is_completed: false,
                    total_chapters: 3,
                    read_chapters: 0,
                    created_at: Date.now()
                };
                books.push(newBook);

                for (let i = 1; i <= 3; i++) {
                    chapters.push({
                        chapter_id: generateId('chap_'),
                        book_id: newBook.book_id,
                        chapter_number: i,
                        title: '第' + i + '章：新的冒险',
                        content: '这是第' + i + '章的故事内容。小明在这里遇到了许多有趣的事情...',
                        is_read: false,
                        created_at: Date.now()
                    });
                }
                
                saveJSON('books.json', books);
                saveJSON('chapters.json', chapters);
                res.writeHead(200);
                res.end(JSON.stringify({ book_id: newBook.book_id, message: '故事生成成功' }));
                return;
            }

            if (url.pathname.startsWith('/api/chapters/book/') && req.method === 'GET') {
                const parts = url.pathname.split('/');
                const bookId = parts[parts.length - 1];
                const chapters = loadJSON('chapters.json');
                const bookChapters = chapters.filter(function(c) { return c.book_id === bookId; });
                res.writeHead(200);
                res.end(JSON.stringify(bookChapters));
                return;
            }

            if (url.pathname === '/api/parent/settings' && req.method === 'GET') {
                if (!currentUserId) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: '未登录' }));
                    return;
                }
                const settings = loadJSON('parent_settings.json');
                const userSettings = settings.find(function(s) { return s.user_id === currentUserId; }) || {
                    daily_time_limit: 60,
                    rest_reminder_interval: 30,
                    content_filter_level: 'standard'
                };
                res.writeHead(200);
                res.end(JSON.stringify(userSettings));
                return;
            }

            if (url.pathname === '/api/parent/settings' && req.method === 'POST') {
                if (!currentUserId) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: '未登录' }));
                    return;
                }
                const data = JSON.parse(body);
                const settings = loadJSON('parent_settings.json');
                let userSettings = settings.find(function(s) { return s.user_id === currentUserId; });
                if (userSettings) {
                    Object.keys(data).forEach(function(key) {
                        userSettings[key] = data[key];
                    });
                } else {
                    userSettings = {
                        setting_id: generateId('set_'),
                        user_id: currentUserId,
                        daily_time_limit: data.daily_time_limit || 60,
                        rest_reminder_interval: data.rest_reminder_interval || 30,
                        content_filter_level: data.content_filter_level || 'standard'
                    };
                    settings.push(userSettings);
                }
                saveJSON('parent_settings.json', settings);
                res.writeHead(200);
                res.end(JSON.stringify(userSettings));
                return;
            }

            res.writeHead(404);
            res.end(JSON.stringify({ error: 'API not found' }));
        } catch (err) {
            console.error('API Error:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: '服务器错误' }));
        }
    });
}

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(path.join(DATA_DIR, 'characters.json'))) {
    saveJSON('characters.json', presetChars);
}

server.listen(PORT, function() {
    console.log('Server running at http://localhost:' + PORT);
    console.log('API endpoints available:');
    console.log('  POST /api/auth/login');
    console.log('  POST /api/auth/logout');
    console.log('  GET  /api/characters/preset');
    console.log('  GET  /api/characters/custom');
    console.log('  POST /api/characters/custom');
    console.log('  GET  /api/books');
    console.log('  POST /api/books');
    console.log('  POST /api/story/generate');
    console.log('  GET  /api/chapters/book/:bookId');
    console.log('  GET  /api/parent/settings');
    console.log('  POST /api/parent/settings');
});
