import { getPuzzleById } from '../../db/puzzles.js';
import { getAnswerRecord, createAnswerRecord, updateAnswerRecord } from '../../db/puzzle_records.js';
import { requireAuth } from '../../middleware/auth.js';
import { generateId } from '../../db/helpers.js';

const MAX_ATTEMPTS = 3;

const PENALTY_STORIES = {
    pattern: '虽然颜色没选对，但聪明的你发现了一个隐藏的开关，门缓缓打开了...',
    calculation: '虽然数字不对，但你的朋友们帮你找到了另一条路...',
    common: '虽然答案不太对，但意外发现了新的线索...'
};

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
        
        const { puzzle_id, chapter_id, user_answer } = await context.request.json();
        
        const puzzle = await getPuzzleById(context.env.DB, puzzle_id);
        if (!puzzle) {
            return new Response(JSON.stringify({
                success: false,
                error: '谜题不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const validAnswers = ['A', 'B', 'C', 'D'];
        const normalizedUserAnswer = user_answer.toUpperCase();
        if (!validAnswers.includes(normalizedUserAnswer)) {
            return new Response(JSON.stringify({
                success: false,
                error: '无效的答案格式'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const existingRecord = await getAnswerRecord(context.env.DB, authResult.userId, puzzle_id);
        let attempts = existingRecord ? existingRecord.attempts + 1 : 1;
        
        const normalizedCorrectAnswer = puzzle.correct_answer.toUpperCase();
        const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        
        if (existingRecord) {
            await updateAnswerRecord(context.env.DB, existingRecord.record_id, {
                user_answer: normalizedUserAnswer,
                is_correct: isCorrect ? 1 : 0,
                attempts: attempts,
                answer_time: Date.now()
            });
        } else {
            await createAnswerRecord(context.env.DB, {
                record_id: generateId('record'),
                user_id: authResult.userId,
                puzzle_id: puzzle_id,
                chapter_id: chapter_id,
                user_answer: normalizedUserAnswer,
                is_correct: isCorrect ? 1 : 0,
                attempts: attempts,
                answer_time: Date.now()
            });
        }
        
        if (isCorrect) {
            return new Response(JSON.stringify({
                success: true,
                is_correct: true,
                message: '答对了！'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const remainingAttempts = MAX_ATTEMPTS - attempts;
        
        if (remainingAttempts <= 0) {
            return new Response(JSON.stringify({
                success: true,
                is_correct: false,
                message: '门没打开，再想想办法',
                penalty_story: PENALTY_STORIES[puzzle.puzzle_type] || '故事继续...'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const showHint = attempts >= 2;
        
        return new Response(JSON.stringify({
            success: true,
            is_correct: false,
            message: '再试一次吧！',
            remaining_attempts: remainingAttempts,
            hint: showHint ? puzzle.hint : null
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Puzzle verification error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '谜题验证服务错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
