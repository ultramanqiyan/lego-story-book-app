import { getBookRoleById, updateBookRole, deleteBookRole, checkCustomNameExists, getCurrentProtagonist, clearProtagonist, setProtagonist } from '../../../../../db/book_roles.js';
import { getBookById } from '../../../../../db/books.js';
import { requireAuth } from '../../../../../middleware/auth.js';

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
        const roleId = context.params.roleId;
        
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
        
        const role = await getBookRoleById(context.env.DB, roleId);
        if (!role || role.book_id !== bookId) {
            return new Response(JSON.stringify({
                success: false,
                error: '角色不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const { custom_name, role_type } = await context.request.json();
        
        if (custom_name) {
            const nameExists = await checkCustomNameExists(context.env.DB, bookId, custom_name, roleId);
            if (nameExists) {
                return new Response(JSON.stringify({
                    success: false,
                    error: '自定义名称已存在'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        if (role_type === 'protagonist' && role.role_type !== 'protagonist') {
            await clearProtagonist(context.env.DB, bookId);
        }
        
        await updateBookRole(context.env.DB, roleId, {
            custom_name,
            role_type
        });
        
        return new Response(JSON.stringify({
            success: true
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Update book role error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '更新书籍角色错误'
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
        const roleId = context.params.roleId;
        
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
        
        const role = await getBookRoleById(context.env.DB, roleId);
        if (!role || role.book_id !== bookId) {
            return new Response(JSON.stringify({
                success: false,
                error: '角色不存在'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (role.is_protagonist === 1) {
            return new Response(JSON.stringify({
                success: false,
                error: '不能删除主角，请先更换主角'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        await deleteBookRole(context.env.DB, roleId);
        
        return new Response(JSON.stringify({
            success: true
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Delete book role error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '删除书籍角色错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
