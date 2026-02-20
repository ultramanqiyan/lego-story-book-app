import { getParentSettings, createParentSettings, updateParentSettings } from '../../db/parent_settings.js';
import { getDailyUsage, getWeeklyUsage, getMonthlyUsage } from '../../db/usage_logs.js';
import { requireAuth } from '../../middleware/auth.js';

export async function onRequestGet(context) {
    const authResult = await requireAuth(context);
    if (authResult.error) {
        return authResult.error;
    }
    
    const { env, user, request } = context;
    const url = new URL(request.url);
    const report = url.searchParams.get('report');
    
    try {
        let settings = await getParentSettings(env.DB, user.userId);
        
        if (!settings) {
            settings = await createParentSettings(env.DB, user.userId, {
                daily_time_limit: 60,
                rest_reminder_interval: 30,
                content_filter_level: 'standard',
                is_parent_mode: false,
                parent_password: null
            });
        }
        
        if (report === 'daily') {
            const dailyUsage = await getDailyUsage(env.DB, user.userId);
            return new Response(JSON.stringify({
                settings,
                usage: dailyUsage
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (report === 'weekly') {
            const weeklyUsage = await getWeeklyUsage(env.DB, user.userId);
            return new Response(JSON.stringify({
                settings,
                usage: weeklyUsage
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (report === 'monthly') {
            const monthlyUsage = await getMonthlyUsage(env.DB, user.userId);
            return new Response(JSON.stringify({
                settings,
                usage: monthlyUsage
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify(settings), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get parent settings error:', error);
        return new Response(JSON.stringify({ error: '获取家长设置失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const authResult = await requireAuth(context);
    if (authResult.error) {
        return authResult.error;
    }
    
    const { env, user, request } = context;
    
    try {
        const body = await request.json();
        const { daily_time_limit, rest_reminder_interval, content_filter_level, parent_password } = body;
        
        const updateData = {};
        if (daily_time_limit !== undefined) updateData.daily_time_limit = daily_time_limit;
        if (rest_reminder_interval !== undefined) updateData.rest_reminder_interval = rest_reminder_interval;
        if (content_filter_level !== undefined) updateData.content_filter_level = content_filter_level;
        if (parent_password !== undefined) updateData.parent_password = parent_password;
        
        let settings = await getParentSettings(env.DB, user.userId);
        
        if (!settings) {
            settings = await createParentSettings(env.DB, user.userId, updateData);
        } else {
            settings = await updateParentSettings(env.DB, user.userId, updateData);
        }
        
        return new Response(JSON.stringify(settings), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Update parent settings error:', error);
        return new Response(JSON.stringify({ error: '更新家长设置失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
