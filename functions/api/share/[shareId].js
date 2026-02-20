import { getShareById, updateShareViewCount, deactivateShare } from '../../db/shares.js';
import { getBookById } from '../../db/books.js';
import { getChaptersByBookId } from '../../db/chapters.js';
import { requireAuth } from '../../middleware/auth.js';

export async function onRequestGet(context) {
    const { request, env, params } = context;
    const shareId = params.shareId;
    
    try {
        const share = await getShareById(env.DB, shareId);
        
        if (!share) {
            return new Response(JSON.stringify({ error: '分享不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!share.is_active) {
            return new Response(JSON.stringify({ error: '分享已失效' }), {
                status: 410,
                headers: { 'Content-Type': 'application/json' }
            });
        
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return new Response(JSON.stringify({ error: '分享已过期' }), {
                status: 410,
                headers: { 'Content-Type': 'application/json' }
            });
        
        const url = new URL(request.url);
        const password = url.searchParams.get('password');
        
        if (share.password && share.password !== password) {
            return new Response(JSON.stringify({ error: '密码错误', requirePassword: true }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        await updateShareViewCount(env.DB, shareId);
        
        const book = await getBookById(env.DB, share.book_id);
        const chapters = await getChaptersByBookId(env.DB, share.book_id);
        
        const shareData = {
            share_id: share.share_id,
            book: {
                book_id: book.book_id,
                title: book.title,
                cover_image: book.cover_image,
                theme: book.theme,
                age_range: book.age_range
            },
            chapters: chapters.map(ch => ({
                chapter_id: ch.chapter_id,
                chapter_number: ch.chapter_number,
                title: ch.title,
                content: ch.content,
                image_url: ch.image_url
            })),
            created_at: share.created_at
        };
        
        return new Response(JSON.stringify(shareData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get share error:', error);
        return new Response(JSON.stringify({ error: '获取分享失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete(context) {
    const authResult = await requireAuth(context);
    if (authResult.error) {
        return authResult.error;
    }
    
    const { env, params, user } = context;
    const shareId = params.shareId;
    
    try {
        const share = await getShareById(env.DB, shareId);
        
        if (!share) {
            return new Response(JSON.stringify({ error: '分享不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const book = await getBookById(env.DB, share.book_id);
        if (book.user_id !== user.userId) {
            return new Response(JSON.stringify({ error: '无权操作此分享' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        await deactivateShare(env.DB, shareId);
        
        return new Response(JSON.stringify({ message: '分享已取消' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Delete share error:', error);
        return new Response(JSON.stringify({ error: '取消分享失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
