import { getBookRoles, createBookRole, updateBookRole, deleteBookRole, checkCustomNameExists, getCurrentProtagonist, clearProtagonist, setProtagonist, getBookRoleById } from '../../../../db/book_roles.js';
import { getBookById } from '../../../../db/books.js';
import { getCharacterById } from '../../../../db/characters.js';
import { requireAuth } from '../../../../middleware/auth.js';
import { generateId } from '../../../../db/helpers.js';

const VALID_ROLE_TYPES = ['protagonist', 'supporting', 'villain', 'passerby'];

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
        
        if (!book || book.user_id !== authResult.userId) {
            return new Response(JSON.stringify({
                success: false,
                error: '书籍不存在或无权限'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const roles = await getBookRoles(context.env.DB, bookId);
        
        return new Response(JSON.stringify({
            success: true,
            roles: roles
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get book roles error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '获取书籍角色错误'
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
        
        const bookId = context.params.id;
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
        
        const { character_id, custom_name, role_type } = await context.request.json();
        
        if (!custom_name || custom_name.trim() === '') {
            return new Response(JSON.stringify({
                success: false,
                error: '自定义名称不能为空'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (custom_name.length > 20) {
            return new Response(JSON.stringify({
                success: false,
                error: '自定义名称超过20字符'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const nameExists = await checkCustomNameExists(context.env.DB, bookId, custom_name);
        if (nameExists) {
            return new Response(JSON.stringify({
                success: false,
                error: '自定义名称已存在'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!VALID_ROLE_TYPES.includes(role_type)) {
            return new Response(JSON.stringify({
                success: false,
                error: '无效的角色类型'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const character = await getCharacterById(context.env.DB, character_id);
        if (!character) {
            return new Response(JSON.stringify({
                success: false,
                error: '人仔不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (role_type === 'protagonist') {
            const currentProtagonist = await getCurrentProtagonist(context.env.DB, bookId);
            if (currentProtagonist) {
                return new Response(JSON.stringify({
                    success: false,
                    error: '书籍已有主角'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        const roleId = generateId('role');
        
        await createBookRole(context.env.DB, {
            role_id: roleId,
            book_id: bookId,
            character_id: character_id,
            custom_name: custom_name,
            role_type: role_type
        });
        
        return new Response(JSON.stringify({
            success: true,
            role_id: roleId
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Create book role error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '添加书籍角色错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
