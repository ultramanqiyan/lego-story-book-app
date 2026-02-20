# 故事生成子系统设计文档

## 1. 子系统概述

故事生成子系统负责调用AI API生成故事内容，包括故事文本生成、章节名称生成、谜题生成等功能。

## 2. 功能模块

### 2.1 故事生成模块

#### 2.1.1 生成故事
- 函数名：`generateStory(params)`
- 输入：书籍角色、前情提要、本章角色、本章情节
- 输出：故事内容（含章节名称、内容、谜题）
- 流程：
  1. 构建AI提示词
  2. 随机选择解谜类型
  3. 调用Doubao API
  4. 解析返回结果
  5. 返回结构化数据

#### 2.1.2 构建提示词
- 函数名：`buildPrompt(params)`
- 输入：故事参数
- 输出：完整提示词
- 流程：
  1. 组装书籍角色信息
  2. 添加前情提要（如有）
  3. 添加本章角色
  4. 添加本章情节
  5. 添加解谜类型提示词
  6. 返回完整提示词

### 2.2 谜题生成模块

#### 2.2.1 随机选择谜题类型
- 函数名：`selectPuzzleType()`
- 输入：无
- 输出：谜题类型（pattern/calculation/common）
- 规则：随机选择三种类型之一

#### 2.2.2 谜题生成概率
- 默认概率：50%
- 可配置
- 函数：`shouldGeneratePuzzle(probability = 0.5)`

### 2.3 文本高亮模块

#### 2.3.1 关键词高亮
- 函数名：`highlightKeywords(content, roles)`
- 输入：故事内容、角色列表
- 输出：高亮后的HTML内容
- 规则：
  - 关键人物：红色高亮（角色自定义名称）
  - 关键动作：紫色高亮
  - 情感词：绿色高亮
  - 地点词：黄色高亮

#### 2.3.2 高亮样式
```css
.highlight-character {
    background-color: #ffcccc;
    border-radius: 4px;
    font-weight: bold;
    padding: 0 2px;
}

.highlight-action {
    background-color: #e6ccff;
    border-radius: 4px;
    font-weight: bold;
    padding: 0 2px;
}

.highlight-emotion {
    background-color: #ccffcc;
    border-radius: 4px;
    font-weight: bold;
    padding: 0 2px;
}

.highlight-location {
    background-color: #ffffcc;
    border-radius: 4px;
    font-weight: bold;
    padding: 0 2px;
}
```

## 3. AI提示词设计

### 3.1 完整提示词模板

```
你是一个儿童故事作家，正在创作一个连续的乐高主题故事。

【书籍角色】
{
  "角色1": {
    "自定义名称": "小蝙蝠",
    "原始名称": "乐高蝙蝠侠",
    "性格": "勇敢、正义、严肃",
    "说话方式": "低沉有力"
  },
  "角色2": {
    "自定义名称": "蜘蛛侠阿明",
    "原始名称": "乐高蜘蛛侠",
    "性格": "活泼、幽默、善良",
    "说话方式": "轻松俏皮"
  }
}

【前情提要】
{前一章的故事概要，第一章时为空}

【本章角色】
{本章参与的角色自定义名称列表}

【本章情节】
{用户选择的情节描述}

【解谜要求】
{随机选择以下一种解谜类型提示词}

请生成下一章故事（100-200字），要求：
与前文情节连贯
使用角色的自定义名称（如"小蝙蝠"而非"乐高蝙蝠侠"）
符合角色性格和说话方式
在关键节点（如遇到大门、遇到NPC、发现宝箱）设置谜题
返回JSON格式：{"title": "章节名称", "content": "故事内容", "puzzle": {...}}
```

### 3.2 解谜类型提示词

#### 3.2.1 图形规律模式
```
【图形规律模式】
在故事中设置一个图形规律谜题：
场景：遇到彩色积木、灯光、图案等需要找规律的情况
问题：找出规律，预测下一个元素
选项：4个选项（A/B/C/D），每个选项1-5个字
难度：适合6-12岁儿童，规律简单明了
示例：红、黄、蓝、红、黄、__，下一个是什么颜色？
```

#### 3.2.2 简单计算模式
```
【简单计算模式】
在故事中设置一个简单计算谜题：
场景：分配物品、计算数量、时间计算等
问题：100以内的加减法应用题
选项：4个选项（A/B/C/D），每个选项1-5个字
难度：适合6-12岁儿童，无乘除法
示例：你有5块积木，又拿了3块，现在有几块？
```

#### 3.2.3 生活常识模式
```
【生活常识模式】
在故事中设置一个生活常识谜题：
场景：遇到物品分类、找不同、常识判断等
问题：找出不同类或回答常识问题
选项：4个选项（A/B/C/D），每个选项1-5个字
难度：适合6-12岁儿童，基于观察和常识
示例：书本、铅笔、苹果、橡皮，哪个不一样？
```

## 4. API接口设计

### 4.1 生成故事接口
```
POST /api/story/generate
Headers:
  Authorization: Bearer {token}
Request:
{
  "book_id": "string",
  "chapter_roles": ["角色自定义名称1", "角色自定义名称2"],
  "plot": "string",
  "puzzle_probability": 0.5
}
Response:
{
  "success": true,
  "chapter": {
    "title": "string",
    "content": "string",
    "puzzle": {
      "question": "string",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "answer": "B",
      "hint": "string",
      "type": "pattern"
    }
  },
  "prompt_used": "string"
}
```

### 4.2 Doubao API调用

```javascript
export async function onRequestPost(context) {
    try {
        const { book_id, chapter_roles, plot, puzzle_probability } = await context.request.json();
        
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
        
        const book = await getBookById(context.env.DB, book_id);
        if (!book || book.user_id !== userId) {
            return new Response(JSON.stringify({
                success: false,
                error: '书籍不存在或无权限'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const roles = await getBookRoles(context.env.DB, book_id);
        const previousChapter = await getLatestChapter(context.env.DB, book_id);
        
        const prompt = buildStoryPrompt({
            roles,
            previousChapter,
            chapterRoles: chapter_roles,
            plot,
            puzzleProbability: puzzle_probability
        });
        
        const apiKey = context.env.DOUBAO_API_KEY || 'ee51832f-f233-45ec-9262-00e1d2a66ba1';
        
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'doubao-1-5-pro-32k-250115',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return new Response(JSON.stringify({
                success: false,
                error: errorData.error?.message || '故事生成失败'
            }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        let storyResult;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                storyResult = JSON.parse(jsonMatch[0]);
            } else {
                storyResult = {
                    title: '新的冒险',
                    content: content,
                    puzzle: null
                };
            }
        } catch (parseError) {
            storyResult = {
                title: '新的冒险',
                content: content,
                puzzle: null
            };
        }
        
        const chapterNumber = book.chapter_count + 1;
        const chapterId = generateId('chapter');
        
        await createChapter(context.env.DB, {
            chapter_id: chapterId,
            book_id: book_id,
            chapter_number: chapterNumber,
            title: storyResult.title,
            content: storyResult.content,
            has_puzzle: storyResult.puzzle ? 1 : 0,
            prompt_used: prompt,
            created_at: Date.now()
        });
        
        if (storyResult.puzzle) {
            await createPuzzle(context.env.DB, {
                puzzle_id: generateId('puzzle'),
                chapter_id: chapterId,
                question: storyResult.puzzle.question,
                option_a: storyResult.puzzle.options[0],
                option_b: storyResult.puzzle.options[1],
                option_c: storyResult.puzzle.options[2],
                option_d: storyResult.puzzle.options[3],
                correct_answer: storyResult.puzzle.answer,
                hint: storyResult.puzzle.hint,
                puzzle_type: storyResult.puzzle.type,
                created_at: Date.now()
            });
        }
        
        await updateBookChapterCount(context.env.DB, book_id, chapterNumber);
        
        return new Response(JSON.stringify({
            success: true,
            chapter: {
                chapter_id: chapterId,
                chapter_number: chapterNumber,
                title: storyResult.title,
                content: storyResult.content,
                puzzle: storyResult.puzzle
            },
            prompt_used: prompt
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Story generation error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '故事生成服务错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

## 5. 提示词构建函数

### 5.1 构建故事提示词 (functions/services/promptBuilder.js)

```javascript
const PUZZLE_PROMPTS = {
    pattern: `【图形规律模式】
在故事中设置一个图形规律谜题：
场景：遇到彩色积木、灯光、图案等需要找规律的情况
问题：找出规律，预测下一个元素
选项：4个选项（A/B/C/D），每个选项1-5个字
难度：适合6-12岁儿童，规律简单明了
示例：红、黄、蓝、红、黄、__，下一个是什么颜色？`,
    
    calculation: `【简单计算模式】
在故事中设置一个简单计算谜题：
场景：分配物品、计算数量、时间计算等
问题：100以内的加减法应用题
选项：4个选项（A/B/C/D），每个选项1-5个字
难度：适合6-12岁儿童，无乘除法
示例：你有5块积木，又拿了3块，现在有几块？`,
    
    common: `【生活常识模式】
在故事中设置一个生活常识谜题：
场景：遇到物品分类、找不同、常识判断等
问题：找出不同类或回答常识问题
选项：4个选项（A/B/C/D），每个选项1-5个字
难度：适合6-12岁儿童，基于观察和常识
示例：书本、铅笔、苹果、橡皮，哪个不一样？`
};

export function buildStoryPrompt(params) {
    const { roles, previousChapter, chapterRoles, plot, puzzleProbability } = params;
    
    const rolesJson = {};
    roles.forEach((role, index) => {
        rolesJson[`角色${index + 1}`] = {
            '自定义名称': role.custom_name,
            '原始名称': role.character_name,
            '性格': role.personality,
            '说话方式': role.speaking_style
        };
    });
    
    let puzzlePrompt = '';
    if (Math.random() < puzzleProbability) {
        const puzzleTypes = ['pattern', 'calculation', 'common'];
        const selectedType = puzzleTypes[Math.floor(Math.random() * puzzleTypes.length)];
        puzzlePrompt = PUZZLE_PROMPTS[selectedType];
    }
    
    const prompt = `你是一个儿童故事作家，正在创作一个连续的乐高主题故事。

【书籍角色】
${JSON.stringify(rolesJson, null, 2)}

【前情提要】
${previousChapter ? previousChapter.content.substring(0, 100) + '...' : '这是第一章，暂无前情提要。'}

【本章角色】
${chapterRoles.join('、')}

【本章情节】
${plot}

${puzzlePrompt ? `【解谜要求】\n${puzzlePrompt}` : ''}

请生成下一章故事（100-200字），要求：
与前文情节连贯
使用角色的自定义名称（如"${roles[0]?.custom_name || '主人公'}"而非原始名称）
符合角色性格和说话方式
${puzzlePrompt ? '在关键节点（如遇到大门、遇到NPC、发现宝箱）设置谜题' : ''}
返回JSON格式：{"title": "章节名称", "content": "故事内容", "puzzle": {...}}`;

    return prompt;
}
```

## 6. 关键词高亮实现

### 6.1 高亮关键词列表

```javascript
const ACTION_WORDS = [
    '飞向', '跳跃', '奔跑', '战斗', '探索', '发现', '拯救', '追逐',
    '攀爬', '游泳', '飞翔', '旋转', '冲刺', '躲闪', '攻击', '防御',
    '寻找', '收集', '建造', '修复'
];

const EMOTION_WORDS = [
    '开心', '快乐', '勇敢', '害怕', '兴奋', '紧张', '感动', '惊讶',
    '愤怒', '悲伤', '期待', '满足', '自豪', '担心', '安心', '激动',
    '欣慰', '坚定', '犹豫'
];

const LOCATION_WORDS = [
    '城堡', '森林', '太空', '海底', '沙漠', '雪山', '火山', '洞穴',
    '城市', '村庄', '花园', '岛屿', '山脉', '河流', '星空', '云层',
    '迷宫', '宝藏', '遗迹', '基地'
];
```

### 6.2 高亮函数

```javascript
export function highlightKeywords(content, roles) {
    let result = content;
    
    roles.forEach(role => {
        const regex = new RegExp(role.custom_name, 'g');
        result = result.replace(regex, 
            `<span class="highlight-character">${role.custom_name}</span>`);
    });
    
    ACTION_WORDS.forEach(word => {
        const regex = new RegExp(word, 'g');
        result = result.replace(regex, 
            `<span class="highlight-action">${word}</span>`);
    });
    
    EMOTION_WORDS.forEach(word => {
        const regex = new RegExp(word, 'g');
        result = result.replace(regex, 
            `<span class="highlight-emotion">${word}</span>`);
    });
    
    LOCATION_WORDS.forEach(word => {
        const regex = new RegExp(word, 'g');
        result = result.replace(regex, 
            `<span class="highlight-location">${word}</span>`);
    });
    
    return result;
}
```

## 7. 故事连贯性处理

### 7.1 前情提要生成
- 获取上一章内容
- 提取关键信息（前100字）
- 添加到提示词中

### 7.2 角色一致性
- 使用角色自定义名称
- 保持角色性格和说话方式
- 角色关系延续

## 8. 错误处理

| 错误码 | 说明 |
|--------|------|
| STORY_001 | 书籍不存在 |
| STORY_002 | 无权限操作此书籍 |
| STORY_003 | 故事生成失败 |
| STORY_004 | AI返回格式错误 |
| STORY_005 | 章节数量已达上限 |

## 9. 文件结构

```
functions/
├── api/
│   └── story/
│       └── generate.js     - 故事生成API
├── services/
│   ├── promptBuilder.js    - 提示词构建
│   ├── highlighter.js      - 关键词高亮
│   └── storyValidator.js   - 故事验证
└── constants/
    ├── keywords.js         - 关键词常量
    └── puzzlePrompts.js    - 谜题提示词常量
```
