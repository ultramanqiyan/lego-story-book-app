import { getCustomCharactersByUserId, createCharacter, updateCharacter, deleteCharacter, checkCharacterInUse, getCharacterById } from '../../../db/characters.js';
import { requireAuth } from '../../../middleware/auth.js';
import { generateId } from '../../../db/helpers.js';

const VALID_PERSONALITIES = [
    '勇敢、正义、严肃', '活泼、幽默、善良', '热血、坚韧、乐观',
    '威猛、古老、神秘', '优雅、善良、勇敢', '忠诚、勇敢、正直',
    '智慧、神秘、慈祥', '好奇、勇敢、科学', '豪爽、自由、机智',
    '敏捷、聪慧、友善', '精确、理性、忠诚', '正义、无私、强大'
];

const VALID_SPEAKING_STYLES = [
    '低沉有力', '轻松俏皮', '充满干劲', '低沉咆哮', '温柔甜美',
    '庄重有力', '古老深奥', '专业冷静', '粗犷豪迈', '清脆悦耳',
    '机械平稳', '坚定有力'
];

export async function onRequestGet(context) {
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
        
        const characters = await getCustomCharactersByUserId(context.env.DB, authResult.userId);
        
        return new Response(JSON.stringify({
            success: true,
            characters: characters
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get custom characters error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '获取自定义人仔错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
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
        
        const { name, image_base64, description, personality, speaking_style } = await context.request.json();
        
        if (!name || name.trim() === '') {
            return new Response(JSON.stringify({
                success: false,
                error: '人仔名称不能为空'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (name.length > 20) {
            return new Response(JSON.stringify({
                success: false,
                error: '人仔名称超过20字符'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (description && description.length > 100) {
            return new Response(JSON.stringify({
                success: false,
                error: '人设描述超过100字符'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!VALID_PERSONALITIES.includes(personality)) {
            return new Response(JSON.stringify({
                success: false,
                error: '无效的性格类型'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!VALID_SPEAKING_STYLES.includes(speaking_style)) {
            return new Response(JSON.stringify({
                success: false,
                error: '无效的说话方式'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const characterId = generateId('character');
        
        await createCharacter(context.env.DB, {
            character_id: characterId,
            name: name,
            image_base64: image_base64,
            description: description,
            personality: personality,
            speaking_style: speaking_style,
            creator_id: authResult.userId
        });
        
        return new Response(JSON.stringify({
            success: true,
            character_id: characterId
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Create character error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '创建人仔错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
