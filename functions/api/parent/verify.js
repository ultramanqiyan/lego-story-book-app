import { getParentSettings, updateParentSettings } from '../../db/parent_settings.js';
import { requireAuth } from '../../middleware/auth.js';

export async function onRequestPost(context) {
    const authResult = await requireAuth(context);
    if (authResult.error) {
        return authResult.error;
    }
    
    const { env, user, request } = context;
    
    try {
        const body = await request.json();
        const { password } = body;
        
        const settings = await getParentSettings(env.DB, user.userId);
        
        if (!settings || !settings.parent_password) {
            return new Response(JSON.stringify({ error: '未设置家长密码' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (settings.parent_password !== password) {
            return new Response(JSON.stringify({ error: '密码错误' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        await updateParentSettings(env.DB, user.userId, { is_parent_mode: true });
        
        return new Response(JSON.stringify({ message: '验证成功', isParentMode: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Parent verify error:', error);
        return new Response(JSON.stringify({ error: '验证失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
