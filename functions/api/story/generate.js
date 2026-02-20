import { getBookById, updateBookChapterCount } from '../../db/books.js';
import { getBookRoles, getCurrentProtagonist } from '../../db/book_roles.js';
import { getLatestChapter, createChapter } from '../../db/chapters.js';
import { createPuzzle } from '../../db/puzzles.js';
import { requireAuth } from '../../middleware/auth.js';
import { generateId } from '../../db/helpers.js';

const PUZZLE_PROMPTS = {
    pattern: `【图形规律模式】
在故事中设置一个图形规律谜题：
场景：遇到彩色积木、灯光、图案等需要找规律的情况
问题：找出规律，预测下一个元素
选项：4个选项（A/B/C/D），每个选项1-5个字
难度：适合6-12岁儿童，规律简单明了`,
    
    calculation: `【简单计算模式】
在故事中设置一个简单计算谜题：
场景：分配物品、计算数量、时间计算等
问题：100以内的加减法应用题
选项：4个选项（A/B/C/D），每个选项1-5个字
难度：适合6-12岁儿童，无乘除法`,
    
    common: `【生活常识模式】
在故事中设置一个生活常识谜题：
场景：遇到物品分类、找不同、常识判断等
问题：找出不同类或回答常识问题
选项：4个选项（A/B/C/D），每个选项1-5个字
难度：适合6-12岁儿童，基于观察和常识`
};

function buildStoryPrompt(params) {
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

export async function onRequestPost(context) {
    try {
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
        
        const { book_id, chapter_roles, plot, puzzle_probability = 0.5 } = await context.request.json();
        
        const book = await getBookById(context.env.DB, book_id);
        if (!book || book.user_id !== authResult.userId) {
            return new Response(JSON.stringify({
                success: false,
                error: '书籍不存在或无权限'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (book.chapter_count >= 100) {
            return new Response(JSON.stringify({
                success: false,
                error: '本书籍已达章节上限，请创建新书籍'
            }), {
                status: 400,
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
