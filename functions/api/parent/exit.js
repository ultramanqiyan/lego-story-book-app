import { getParentSettings, updateParentSettings } from '../../db/parent_settings.js';
import { requireAuth } from '../../middleware/auth.js';

export async function onRequestPost(context) {
    const authResult = await requireAuth(context);
    if (authResult.error) {
        return authResult.error;
    }
    
    const { env, user } = context;
    
    try {
        const settings = await getParentSettings(env.DB, user.userId);
        
        if (settings) {
            await updateParentSettings(env.DB, user.userId, { is_parent_mode: false });
        }
        
        return new Response(JSON.stringify({ message: '已退出家长模式', isParentMode: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Parent exit error:', error);
        return new Response(JSON.stringify({ error: '退出失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
