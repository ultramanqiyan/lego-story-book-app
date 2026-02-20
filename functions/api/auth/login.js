import { getUserByUsername, createUser } from '../../db/users.js';
import { requireAuth, generateToken, hashPassword } from '../../middleware/auth.js';

export async function onRequestPost(context) {
    try {
        const { username, password } = await context.request.json();
        
        if (!username || !password) {
            return new Response(JSON.stringify({
                success: false,
                error: '请填写用户名和密码'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const user = await getUserByUsername(context.env.DB, username);
        
        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                error: '用户名不存在'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const passwordHash = hashPassword(password);
        if (user.password_hash !== passwordHash) {
            return new Response(JSON.stringify({
                success: false,
                error: '密码错误'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const token = generateToken(user.user_id);
        
        return new Response(JSON.stringify({
            success: true,
            user: {
                user_id: user.user_id,
                username: user.username,
                avatar: user.avatar,
                role: user.role
            },
            token: token
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '登录服务错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

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
        
        return new Response(JSON.stringify({
            success: true,
            user: {
                user_id: authResult.user.user_id,
                username: authResult.user.username,
                avatar: authResult.user.avatar,
                role: authResult.user.role
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get user error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '获取用户信息错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
