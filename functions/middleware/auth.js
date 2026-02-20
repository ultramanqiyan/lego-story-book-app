import { getUserById } from '../db/users.js';

export async function requireAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: '未提供认证信息' };
    }
    
    const token = authHeader.substring(7);
    const sessionData = await validateToken(token, env);
    
    if (!sessionData) {
        return { valid: false, error: '无效的认证信息' };
    }
    
    const user = await getUserById(env.DB, sessionData.userId);
    if (!user) {
        return { valid: false, error: '用户不存在' };
    }
    
    return { valid: true, userId: sessionData.userId, user: user };
}

async function validateToken(token, env) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp < Date.now()) return null;
        
        return { userId: payload.userId };
    } catch {
        return null;
    }
}

export function generateToken(userId) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ userId, exp: Date.now() + 86400000 }));
    const signature = btoa('signature');
    return `${header}.${payload}.${signature}`;
}

export function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = crypto.subtle.digestSync('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
