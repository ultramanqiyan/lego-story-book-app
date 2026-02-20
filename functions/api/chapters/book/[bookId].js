import { getChaptersByBookId, getChapterById, getChapterWithPuzzle, deleteChapter } from '../../db/chapters.js';
import { getBookById, updateBookChapterCount } from '../../db/books.js';
import { deletePuzzleByChapterId } from '../../db/puzzles.js';
import { requireAuth } from '../../middleware/auth.js';

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
        
        const bookId = context.params.bookId;
        const book = await getBookById(context.env.DB, bookId);
        
        if (!book || book.user_id !== authResult.userId) {
            return new Response(JSON.stringify({
                success: false,
                error: '书籍不存在或无权限'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const url = new URL(context.request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
        
        const result = await getChaptersByBookId(context.env.DB, bookId, page, pageSize);
        
        return new Response(JSON.stringify({
            success: true,
            chapters: result.chapters,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get chapters error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '获取章节错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
