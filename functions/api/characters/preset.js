import { getPresetCharacters } from '../../db/characters.js';

export async function onRequestGet(context) {
    try {
        const characters = await getPresetCharacters(context.env.DB);
        
        return new Response(JSON.stringify({
            success: true,
            characters: characters
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get preset characters error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '获取预设人仔错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
