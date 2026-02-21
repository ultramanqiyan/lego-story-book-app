const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const staticJsDir = path.join(projectRoot, 'static', 'js');

const testResults = {
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

function checkFileExists(filePath) {
    return fs.existsSync(filePath);
}

function getFileLines(filePath) {
    if (!fs.existsSync(filePath)) return 0;
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').filter(line => line.trim().length > 0).length;
}

function fileContains(filePath, patterns) {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, 'utf-8');
    return patterns.every(pattern => content.includes(pattern));
}

console.log('\n========================================');
console.log('前端代码完整性测试');
console.log('========================================\n');

console.log('1. JS文件非空检查');
console.log('-'.repeat(40));

const jsFiles = [
    { name: 'app.js', minLines: 50, requiredPatterns: ['App.', 'isAuthenticated', 'api'] },
    { name: 'auth.js', minLines: 30, requiredPatterns: ['DOMContentLoaded', 'loginForm'] },
    { name: 'bookshelf.js', minLines: 30, requiredPatterns: ['loadBooks', 'renderBooks'] },
    { name: 'characters.js', minLines: 30, requiredPatterns: ['loadCharacters', 'DOMContentLoaded'] },
    { name: 'story-create.js', minLines: 30, requiredPatterns: ['loadCharacters', 'generateStory'] },
    { name: 'book.js', minLines: 30, requiredPatterns: ['loadBook', 'showChapter'] },
    { name: 'parent.js', minLines: 20, requiredPatterns: ['DOMContentLoaded', 'loadSettings'] },
    { name: 'home.js', minLines: 5, requiredPatterns: ['DOMContentLoaded'] },
    { name: 'adventure.js', minLines: 30, requiredPatterns: ['loadAdventure', 'showChapter'] },
    { name: 'share-view.js', minLines: 20, requiredPatterns: ['loadShare', 'DOMContentLoaded'] }
];

jsFiles.forEach(file => {
    const filePath = path.join(staticJsDir, file.name);
    const exists = checkFileExists(filePath);
    const lines = getFileLines(filePath);
    
    if (!exists) {
        log(`文件存在: ${file.name}`, 'failed', '文件不存在');
    } else if (lines === 0) {
        log(`文件非空: ${file.name}`, 'failed', '文件为空（0行）');
    } else if (lines < file.minLines) {
        log(`文件行数: ${file.name}`, 'failed', `行数不足（${lines}行，最少需要${file.minLines}行）`);
    } else {
        log(`文件非空: ${file.name}`, 'passed', `${lines}行`);
    }
});

console.log('\n2. 核心函数定义检查');
console.log('-'.repeat(40));

const functionChecks = [
    { file: 'app.js', patterns: ['App.isAuthenticated', 'App.api', 'App.checkAuth', 'App.showToast'], name: 'App核心方法' },
    { file: 'auth.js', patterns: ['addEventListener', 'App.api'], name: '认证事件绑定' },
    { file: 'bookshelf.js', patterns: ['function loadBooks', 'function renderBooks', 'function createBookCard'], name: '书架页面函数' },
    { file: 'characters.js', patterns: ['function loadCharacters', 'function loadPresetCharacters', 'function loadCustomCharacters'], name: '角色管理函数' },
    { file: 'story-create.js', patterns: ['function loadCharacters', 'function generateStory', 'function selectCharacter'], name: '故事创建函数' },
    { file: 'book.js', patterns: ['function loadBook', 'function showChapter', 'function loadPuzzle'], name: '书籍详情函数' },
    { file: 'adventure.js', patterns: ['function loadAdventure', 'function showChapter', 'function answerPuzzle'], name: '冒险模式函数' }
];

functionChecks.forEach(check => {
    const filePath = path.join(staticJsDir, check.file);
    const hasAllPatterns = fileContains(filePath, check.patterns);
    
    if (hasAllPatterns) {
        log(`函数定义: ${check.name}`, 'passed', '所有必需函数已定义');
    } else {
        const missing = check.patterns.filter(p => !fileContains(filePath, [p]));
        log(`函数定义: ${check.name}`, 'failed', `缺少: ${missing.join(', ')}`);
    }
});

console.log('\n3. API调用检查');
console.log('-'.repeat(40));

const apiChecks = [
    { file: 'auth.js', apiPattern: '/api/auth/login', name: '登录API' },
    { file: 'bookshelf.js', apiPattern: '/api/books', name: '书籍列表API' },
    { file: 'characters.js', apiPattern: '/api/characters', name: '角色API' },
    { file: 'story-create.js', apiPattern: '/api/story/generate', name: '故事生成API' },
    { file: 'book.js', apiPattern: '/api/books/', name: '书籍详情API' },
    { file: 'parent.js', apiPattern: '/api/parent', name: '家长控制API' }
];

apiChecks.forEach(check => {
    const filePath = path.join(staticJsDir, check.file);
    const hasApiCall = fileContains(filePath, [check.apiPattern]);
    
    if (hasApiCall) {
        log(`API调用: ${check.name}`, 'passed', `正确调用 ${check.apiPattern}`);
    } else {
        log(`API调用: ${check.name}`, 'failed', `未找到 ${check.apiPattern} 调用`);
    }
});

console.log('\n4. DOMContentLoaded事件检查');
console.log('-'.repeat(40));

jsFiles.forEach(file => {
    const filePath = path.join(staticJsDir, file.name);
    const hasDomReady = fileContains(filePath, ['DOMContentLoaded']);
    
    if (hasDomReady) {
        log(`事件绑定: ${file.name}`, 'passed', '包含DOMContentLoaded事件');
    } else {
        log(`事件绑定: ${file.name}`, 'failed', '缺少DOMContentLoaded事件');
    }
});

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

const reportPath = path.join(__dirname, 'frontend_test_report.json');
fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
console.log(`\n测试报告已保存到: ${reportPath}`);

if (testResults.failed > 0) {
    process.exit(1);
}

module.exports = testResults;
