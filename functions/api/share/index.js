import { createShare, getSharesByUserId, getShareById, updateShareViewCount, deactivateShare } from '../../db/shares.js';
import { getBookById } from '../../db/books.js';
import { getChaptersByBookId } from '../../db/chapters.js';
import { requireAuth } from '../../middleware/auth.js';
import { generateId } from '../../db/helpers.js';

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
        
        const { book_id, share_type, password } = await context.request.json();
        
        const book = await getBookById(context.env.DB, book_id);
        if (!book) {
            return new Response(JSON.stringify({
                success: false,
                error: '书籍不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (book.user_id !== authResult.userId) {
            return new Response(JSON.stringify({
                success: false,
                error: '无权限操作此书籍'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (share_type === 'private') {
            const passwordRegex = /^\d{4,6}$/;
            if (!password || !passwordRegex.test(password)) {
                return new Response(JSON.stringify({
                    success: false,
                    error: '密码格式错误'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        const shareId = generateId('share');
        
        await createShare(context.env.DB, {
            share_id: shareId,
            book_id: book_id,
            user_id: authResult.userId,
            share_type: share_type || 'public',
            password: password
        });
        
        const url = new URL(context.request.url);
        const shareUrl = `${url.origin}/share?id=${shareId}`;
        
        return new Response(JSON.stringify({
            success: true,
            share: {
                share_id: shareId,
                share_url: shareUrl,
                qr_code_url: `${url.origin}/api/share/qr/${shareId}`,
                share_type: share_type || 'public'
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Create share error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '创建分享错误'
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
        
        const shares = await getSharesByUserId(context.env.DB, authResult.userId);
        
        return new Response(JSON.stringify({
            success: true,
            shares: shares
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get shares error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '获取分享列表错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
