import { getBooksByUserId, createBook, getBookById, updateBook, archiveBook, restoreBook, deleteBook, getArchivedBooks } from '../../db/books.js';
import { requireAuth } from '../../middleware/auth.js';
import { generateId } from '../../db/helpers.js';

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
        
        const url = new URL(context.request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
        const status = url.searchParams.get('status') || 'active';
        
        const result = await getBooksByUserId(context.env.DB, authResult.userId, status, page, pageSize);
        
        return new Response(JSON.stringify({
            success: true,
            books: result.books,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get books error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '获取书籍错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

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
        
        const { title, cover_image } = await context.request.json();
        
        if (!title || title.trim() === '') {
            return new Response(JSON.stringify({
                success: false,
                error: '书籍名称不能为空'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (title.length > 50) {
            return new Response(JSON.stringify({
                success: false,
                error: '书籍名称超过50字符'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const bookId = generateId('book');
        
        await createBook(context.env.DB, {
            book_id: bookId,
            user_id: authResult.userId,
            title: title,
            cover_image: cover_image
        });
        
        return new Response(JSON.stringify({
            success: true,
            book_id: bookId
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Create book error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '创建书籍错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
