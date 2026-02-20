import { getChapterById, getChapterWithPuzzle, deleteChapter } from '../../../db/chapters.js';
import { getBookById, updateBookChapterCount } from '../../../db/books.js';
import { deletePuzzleByChapterId } from '../../../db/puzzles.js';
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
        
        const chapterId = context.params.id;
        const chapter = await getChapterWithPuzzle(context.env.DB, chapterId);
        
        if (!chapter) {
            return new Response(JSON.stringify({
                success: false,
                error: '章节不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const book = await getBookById(context.env.DB, chapter.book_id);
        if (!book || book.user_id !== authResult.userId) {
            return new Response(JSON.stringify({
                success: false,
                error: '无权限访问此章节'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({
            success: true,
            chapter: chapter
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get chapter error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '获取章节错误'
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
        
        const chapterId = context.params.id;
        const chapter = await getChapterById(context.env.DB, chapterId);
        
        if (!chapter) {
            return new Response(JSON.stringify({
                success: false,
                error: '章节不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const book = await getBookById(context.env.DB, chapter.book_id);
        if (!book || book.user_id !== authResult.userId) {
            return new Response(JSON.stringify({
                success: false,
                error: '无权限访问此章节'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        await deletePuzzleByChapterId(context.env.DB, chapterId);
        await deleteChapter(context.env.DB, chapterId);
        await updateBookChapterCount(context.env.DB, book.book_id, book.chapter_count - 1);
        
        return new Response(JSON.stringify({
            success: true
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Delete chapter error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '删除章节错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
