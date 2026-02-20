# 解密互动子系统设计文档

## 1. 子系统概述

解密互动子系统负责谜题验证、答题记录、提示机制等功能，实现故事中的互动解密体验。

## 2. 功能模块

### 2.1 谜题验证模块

#### 2.1.1 验证答案
- 函数名：`verifyAnswer(puzzleId, userAnswer)`
- 输入：谜题ID、用户答案（A/B/C/D）
- 输出：验证结果
- 流程：
  1. 获取谜题信息
  2. 比对用户答案与正确答案
  3. 记录答题结果
  4. 返回验证结果

#### 2.1.2 答题判定逻辑
- 直接比对选项字母（A/B/C/D）
- 无需文字匹配
- 区分大小写不敏感

### 2.2 答题记录模块

#### 2.2.1 记录答题
- 函数名：`recordAnswer(userId, puzzleId, chapterId, userAnswer, isCorrect, attempts)`
- 输入：用户ID、谜题ID、章节ID、用户答案、是否正确、尝试次数
- 输出：记录ID
- 流程：
  1. 生成记录ID
  2. 插入答题记录
  3. 返回记录ID

#### 2.2.2 获取答题记录
- 函数名：`getAnswerRecord(userId, puzzleId)`
- 输入：用户ID、谜题ID
- 输出：答题记录
- 流程：
  1. 查询答题记录
  2. 返回最新记录

#### 2.2.3 更新尝试次数
- 函数名：`updateAttempts(recordId, attempts)`
- 输入：记录ID、尝试次数
- 输出：成功/失败

### 2.3 提示机制模块

#### 2.3.1 检查是否需要提示
- 函数名：`shouldShowHint(attempts)`
- 输入：尝试次数
- 输出：是否显示提示
- 规则：尝试次数 >= 2 时显示提示

#### 2.3.2 获取提示内容
- 函数名：`getHint(puzzleId)`
- 输入：谜题ID
- 输出：提示内容

### 2.4 尝试次数控制模块

#### 2.4.1 最大尝试次数
- 默认：3次
- 可配置

#### 2.4.2 检查尝试次数
- 函数名：`checkAttempts(userId, puzzleId)`
- 输入：用户ID、谜题ID
- 输出：剩余尝试次数

#### 2.4.3 温和惩罚剧情
- 第3次错误后触发
- 不直接卡关
- 示例："门没打开，再想想办法"

## 3. 谜题数据结构

### 3.1 谜题对象
```javascript
{
    "puzzle_id": "puzzle_xxx",
    "chapter_id": "chapter_xxx",
    "question": "红、黄、蓝、红、黄、__，下一个是什么颜色？",
    "option_a": "A. 红色",
    "option_b": "B. 黄色",
    "option_c": "C. 蓝色",
    "option_d": "D. 绿色",
    "correct_answer": "C",
    "hint": "仔细观察颜色的排列顺序",
    "puzzle_type": "pattern"
}
```

### 3.2 答题记录对象
```javascript
{
    "record_id": "record_xxx",
    "user_id": "user_xxx",
    "puzzle_id": "puzzle_xxx",
    "chapter_id": "chapter_xxx",
    "user_answer": "A",
    "is_correct": 0,
    "attempts": 1,
    "answer_time": 1700000000000
}
```

## 4. API接口设计

### 4.1 验证谜题答案
```
POST /api/puzzle/verify
Headers:
  Authorization: Bearer {token}
Request:
{
  "puzzle_id": "string",
  "chapter_id": "string",
  "user_answer": "A"
}
Response (正确):
{
  "success": true,
  "is_correct": true,
  "message": "答对了！"
}

Response (错误):
{
  "success": true,
  "is_correct": false,
  "message": "再试一次吧！",
  "remaining_attempts": 2,
  "hint": "仔细观察颜色的排列顺序"
}

Response (用完尝试次数):
{
  "success": true,
  "is_correct": false,
  "message": "门没打开，再想想办法",
  "penalty_story": "虽然答案不对，但故事还要继续..."
}
```

### 4.2 获取答题记录
```
GET /api/puzzle/record/:chapterId
Headers:
  Authorization: Bearer {token}
Response:
{
  "success": true,
  "record": {
    "record_id": "string",
    "user_answer": "A",
    "is_correct": 0,
    "attempts": 2
  }
}
```

## 5. 验证API实现

### 5.1 验证谜题答案 (functions/api/puzzle/verify.js)

```javascript
const MAX_ATTEMPTS = 3;

export async function onRequestPost(context) {
    try {
        const { puzzle_id, chapter_id, user_answer } = await context.request.json();
        
        const authResult = await requireAuth(context.request, context.env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({
                success: false,
                error: authResult.error
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const userId = authResult.userId;
        
        const puzzle = await getPuzzleById(context.env.DB, puzzle_id);
        if (!puzzle) {
            return new Response(JSON.stringify({
                success: false,
                error: '谜题不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const existingRecord = await getAnswerRecord(context.env.DB, userId, puzzle_id);
        let attempts = existingRecord ? existingRecord.attempts + 1 : 1;
        
        const normalizedUserAnswer = user_answer.toUpperCase();
        const normalizedCorrectAnswer = puzzle.correct_answer.toUpperCase();
        const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        
        if (existingRecord) {
            await updateAnswerRecord(context.env.DB, existingRecord.record_id, {
                user_answer: normalizedUserAnswer,
                is_correct: isCorrect ? 1 : 0,
                attempts: attempts,
                answer_time: Date.now()
            });
        } else {
            await createAnswerRecord(context.env.DB, {
                record_id: generateId('record'),
                user_id: userId,
                puzzle_id: puzzle_id,
                chapter_id: chapter_id,
                user_answer: normalizedUserAnswer,
                is_correct: isCorrect ? 1 : 0,
                attempts: attempts,
                answer_time: Date.now()
            });
        }
        
        if (isCorrect) {
            return new Response(JSON.stringify({
                success: true,
                is_correct: true,
                message: '答对了！'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const remainingAttempts = MAX_ATTEMPTS - attempts;
        
        if (remainingAttempts <= 0) {
            return new Response(JSON.stringify({
                success: true,
                is_correct: false,
                message: '门没打开，再想想办法',
                penalty_story: generatePenaltyStory(puzzle.puzzle_type)
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const showHint = attempts >= 2;
        
        return new Response(JSON.stringify({
            success: true,
            is_correct: false,
            message: '再试一次吧！',
            remaining_attempts: remainingAttempts,
            hint: showHint ? puzzle.hint : null
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Puzzle verification error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '谜题验证服务错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function generatePenaltyStory(puzzleType) {
    const penaltyStories = {
        pattern: '虽然颜色没选对，但聪明的你发现了一个隐藏的开关，门缓缓打开了...',
        calculation: '虽然数字不对，但你的朋友们帮你找到了另一条路...',
        common: '虽然答案不太对，但意外发现了新的线索...'
    };
    return penaltyStories[puzzleType] || '故事继续...';
}
```

## 6. 选择题界面设计

### 6.1 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│                    解密互动界面                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  故事内容区域（在关键节点停止）                              │
│  ...他们来到了一扇神秘的大门前，门上有一排彩色积木...        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 谜题区域                                             │   │
│  │                                                       │   │
│  │  红、黄、蓝、红、黄、__，下一个是什么颜色？           │   │
│  │                                                       │   │
│  │  ┌──────────┐  ┌──────────┐                         │   │
│  │  │ A. 红色  │  │ B. 黄色  │                         │   │
│  │  └──────────┘  └──────────┘                         │   │
│  │  ┌──────────┐  ┌──────────┐                         │   │
│  │  │ C. 蓝色  │  │ D. 绿色  │                         │   │
│  │  └──────────┘  └──────────┘                         │   │
│  │                                                       │   │
│  │  剩余机会：2                                          │   │
│  │                                                       │   │
│  │  💡 提示：仔细观察颜色的排列顺序                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 按钮样式

```css
.puzzle-option {
    background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
    border: 3px solid #333;
    border-radius: 12px;
    padding: 15px 30px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 0 #333;
}

.puzzle-option:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #333;
}

.puzzle-option:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #333;
}

.puzzle-option.correct {
    background: linear-gradient(180deg, #4CAF50 0%, #45a049 100%);
    animation: correctPulse 0.5s ease;
}

.puzzle-option.wrong {
    background: linear-gradient(180deg, #f44336 0%, #d32f2f 100%);
    animation: wrongShake 0.5s ease;
}

@keyframes correctPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

@keyframes wrongShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}
```

### 6.3 前端交互逻辑

```javascript
class PuzzleInteraction {
    constructor(puzzleId, chapterId) {
        this.puzzleId = puzzleId;
        this.chapterId = chapterId;
        this.maxAttempts = 3;
    }
    
    async selectOption(option) {
        const button = document.querySelector(`[data-option="${option}"]`);
        button.classList.add('selected');
        
        const response = await fetch('/api/puzzle/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                puzzle_id: this.puzzleId,
                chapter_id: this.chapterId,
                user_answer: option
            })
        });
        
        const result = await response.json();
        
        if (result.is_correct) {
            button.classList.remove('selected');
            button.classList.add('correct');
            this.playSound('correct');
            this.showSuccessMessage(result.message);
            setTimeout(() => {
                this.unlockNextChapter();
            }, 1500);
        } else {
            button.classList.remove('selected');
            button.classList.add('wrong');
            this.playSound('wrong');
            
            if (result.remaining_attempts > 0) {
                this.updateRemainingAttempts(result.remaining_attempts);
                if (result.hint) {
                    this.showHint(result.hint);
                }
                setTimeout(() => {
                    button.classList.remove('wrong');
                }, 500);
            } else {
                this.showPenaltyStory(result.penalty_story);
            }
        }
    }
    
    playSound(type) {
        const audio = new Audio(`/sounds/${type}.mp3`);
        audio.play();
    }
    
    updateRemainingAttempts(remaining) {
        document.getElementById('remaining-attempts').textContent = remaining;
    }
    
    showHint(hint) {
        const hintElement = document.getElementById('hint-area');
        hintElement.textContent = `💡 提示：${hint}`;
        hintElement.style.display = 'block';
    }
    
    showSuccessMessage(message) {
        const messageElement = document.getElementById('result-message');
        messageElement.textContent = `🎉 ${message}`;
        messageElement.className = 'success-message';
        messageElement.style.display = 'block';
    }
    
    showPenaltyStory(story) {
        const storyElement = document.getElementById('penalty-story');
        storyElement.textContent = story;
        storyElement.style.display = 'block';
    }
    
    unlockNextChapter() {
        window.location.href = `/book?chapter=next`;
    }
}
```

## 7. 数据库操作函数

### 7.1 谜题操作 (functions/db/puzzles.js)

```javascript
export async function getPuzzleById(db, puzzleId) {
    const sql = `SELECT * FROM puzzles WHERE puzzle_id = ?`;
    const result = await db.prepare(sql).bind(puzzleId).first();
    return result;
}

export async function getPuzzleByChapterId(db, chapterId) {
    const sql = `SELECT * FROM puzzles WHERE chapter_id = ?`;
    const result = await db.prepare(sql).bind(chapterId).first();
    return result;
}

export async function createPuzzle(db, puzzleData) {
    const sql = `
        INSERT INTO puzzles (puzzle_id, chapter_id, question, option_a, option_b, option_c, option_d, correct_answer, hint, puzzle_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.prepare(sql).bind(
        puzzleData.puzzle_id,
        puzzleData.chapter_id,
        puzzleData.question,
        puzzleData.option_a,
        puzzleData.option_b,
        puzzleData.option_c,
        puzzleData.option_d,
        puzzleData.correct_answer,
        puzzleData.hint,
        puzzleData.puzzle_type,
        puzzleData.created_at
    ).run();
    return puzzleData.puzzle_id;
}
```

### 7.2 答题记录操作 (functions/db/puzzle_records.js)

```javascript
export async function getAnswerRecord(db, userId, puzzleId) {
    const sql = `SELECT * FROM puzzle_records WHERE user_id = ? AND puzzle_id = ?`;
    const result = await db.prepare(sql).bind(userId, puzzleId).first();
    return result;
}

export async function createAnswerRecord(db, recordData) {
    const sql = `
        INSERT INTO puzzle_records (record_id, user_id, puzzle_id, chapter_id, user_answer, is_correct, attempts, answer_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.prepare(sql).bind(
        recordData.record_id,
        recordData.user_id,
        recordData.puzzle_id,
        recordData.chapter_id,
        recordData.user_answer,
        recordData.is_correct,
        recordData.attempts,
        recordData.answer_time
    ).run();
    return recordData.record_id;
}

export async function updateAnswerRecord(db, recordId, updateData) {
    const sql = `
        UPDATE puzzle_records 
        SET user_answer = ?, is_correct = ?, attempts = ?, answer_time = ?
        WHERE record_id = ?
    `;
    await db.prepare(sql).bind(
        updateData.user_answer,
        updateData.is_correct,
        updateData.attempts,
        updateData.answer_time,
        recordId
    ).run();
}
```

## 8. 解密互动流程

```
┌─────────────────────────────────────────────────────────────┐
│                    解密互动流程                              │
├─────────────────────────────────────────────────────────────┤
│  1. 用户阅读故事内容                                        │
│     ↓                                                       │
│  2. 故事在关键节点停止，显示谜题                             │
│     ↓                                                       │
│  3. 显示4个选项按钮（A/B/C/D）                               │
│     ↓                                                       │
│  4. 用户点击选项                                             │
│     ↓                                                       │
│  5. 系统验证答案                                             │
│     ├─ 正确 → 显示成功动画 → 解锁下一章                      │
│     └─ 错误 → 显示错误动画                                   │
│         ├─ 尝试次数 < 2 → 显示"再试一次"                     │
│         ├─ 尝试次数 = 2 → 显示提示                           │
│         └─ 尝试次数 = 3 → 显示温和惩罚剧情 → 继续故事        │
└─────────────────────────────────────────────────────────────┘
```

## 9. 错误处理

| 错误码 | 说明 |
|--------|------|
| PUZZLE_001 | 谜题不存在 |
| PUZZLE_002 | 无效的答案格式 |
| PUZZLE_003 | 已达到最大尝试次数 |
| PUZZLE_004 | 答题记录不存在 |

## 10. 文件结构

```
functions/
├── api/
│   └── puzzle/
│       ├── verify.js        - 验证答案API
│       └── record/
│           └── [chapterId].js - 获取答题记录API
├── db/
│   ├── puzzles.js           - 谜题数据库操作
│   └── puzzle_records.js    - 答题记录数据库操作
└── services/
    └── puzzleValidator.js   - 谜题验证服务
```
