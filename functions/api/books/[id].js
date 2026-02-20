import { getBookById, updateBook, archiveBook, restoreBook, deleteBook, updateBookChapterCount } from '../../../db/books.js';
import { getBookRoles } from '../../../db/book_roles.js';
import { getChaptersByBookId } from '../../../db/chapters.js';
import { requireAuth } from '../../../middleware/auth.js';

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
        
        const bookId = context.params.id;
        const book = await getBookById(context.env.DB, bookId);
        
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
        
        const roles = await getBookRoles(context.env.DB, bookId);
        
        return new Response(JSON.stringify({
            success: true,
            book: {
                ...book,
                roles: roles
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get book error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '获取书籍错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

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
        
        const bookId = context.params.id;
        const book = await getBookById(context.env.DB, bookId);
        
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
        
        const { title, cover_image } = await context.request.json();
        
        await updateBook(context.env.DB, bookId, {
            title,
            cover_image
        });
        
        return new Response(JSON.stringify({
            success: true
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Update book error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '更新书籍错误'
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
        
        const bookId = context.params.id;
        const book = await getBookById(context.env.DB, bookId);
        
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
        
        await archiveBook(context.env.DB, bookId);
        
        return new Response(JSON.stringify({
            success: true,
            message: '书籍已移至回收站，30天后将永久删除'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Delete book error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '删除书籍错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
