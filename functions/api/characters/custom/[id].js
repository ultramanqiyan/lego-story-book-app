import { getCharacterById, updateCharacter, deleteCharacter, checkCharacterInUse } from '../../../../db/characters.js';
import { requireAuth } from '../../../../middleware/auth.js';

export async function onRequestPut(context) {
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
        
        const characterId = context.params.id;
        const character = await getCharacterById(context.env.DB, characterId);
        
        if (!character) {
            return new Response(JSON.stringify({
                success: false,
                error: '人仔不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (character.creator_id !== authResult.userId) {
            return new Response(JSON.stringify({
                success: false,
                error: '无权限操作此人仔'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const { name, description, personality, speaking_style } = await context.request.json();
        
        await updateCharacter(context.env.DB, characterId, {
            name,
            description,
            personality,
            speaking_style
        });
        
        return new Response(JSON.stringify({
            success: true
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Update character error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '更新人仔错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete(context) {
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
        
        const characterId = context.params.id;
        const character = await getCharacterById(context.env.DB, characterId);
        
        if (!character) {
            return new Response(JSON.stringify({
                success: false,
                error: '人仔不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (character.creator_id !== authResult.userId) {
            return new Response(JSON.stringify({
                success: false,
                error: '无权限操作此人仔'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const inUse = await checkCharacterInUse(context.env.DB, characterId);
        
        await deleteCharacter(context.env.DB, characterId);
        
        return new Response(JSON.stringify({
            success: true,
            warning: inUse ? '该人仔已在故事中使用，删除后角色将显示为默认形象' : null
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Delete character error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '删除人仔错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
