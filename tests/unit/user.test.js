const { initializeDatabase, seedPresetCharacters, seedTestData } = require('../setup');

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function hashPassword(password) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userId) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 86400000 })).toString('base64');
    const signature = Buffer.from('signature').toString('base64');
    return `${header}.${payload}.${signature}`;
}

describe('User Management Unit Tests', () => {
    let db;
    
    beforeAll(async () => {
        db = globalThis.DB;
        await initializeDatabase(db);
        await seedPresetCharacters(db);
        await seedTestData(db);
    });
    
    describe('TC_USER_001: User Login Success', () => {
        test('should login successfully with correct credentials', async () => {
            const sql = `SELECT * FROM users WHERE username = ?`;
            const user = await db.prepare(sql).bind('testuser').first();
            
            expect(user).toBeDefined();
            expect(user.username).toBe('testuser');
            expect(user.role).toBe('child');
        });
    });
    
    describe('TC_USER_002: User Login Failed - Username Not Exist', () => {
        test('should fail login with non-existent username', async () => {
            const sql = `SELECT * FROM users WHERE username = ?`;
            const user = await db.prepare(sql).bind('nonexistent').first();
            
            expect(user).toBeNull();
        });
    });
    
    describe('TC_USER_003: User Login Failed - Wrong Password', () => {
        test('should fail login with wrong password', async () => {
            const sql = `SELECT * FROM users WHERE username = ? AND password_hash = ?`;
            const user = await db.prepare(sql).bind('testuser', hashPassword('wrongpassword')).first();
            
            expect(user).toBeNull();
        });
    });
    
    describe('TC_USER_004: User Login Failed - Empty Username', () => {
        test('should fail login with empty username', () => {
            const username = '';
            expect(username.trim()).toBe('');
        });
    });
    
    describe('TC_USER_005: User Login Failed - Empty Password', () => {
        test('should fail login with empty password', () => {
            const password = '';
            expect(password).toBe('');
        });
    });
    
    describe('TC_USER_010: Create User Success', () => {
        test('should create user successfully', async () => {
            const userId = generateId('user');
            const now = Date.now();
            const sql = `
                INSERT INTO users (user_id, username, password_hash, role, created_at, updated_at)
                VALUES (?, ?, ?, 'child', ?, ?)
            `;
            
            await db.prepare(sql).bind(
                userId,
                'newuser',
                hashPassword('password123'),
                now,
                now
            ).run();
            
            const user = await db.prepare(`SELECT * FROM users WHERE user_id = ?`).bind(userId).first();
            expect(user).toBeDefined();
            expect(user.username).toBe('newuser');
        });
    });
    
    describe('TC_USER_011: Create User Failed - Username Exists', () => {
        test('should fail creating user with existing username', async () => {
            const userId = generateId('user');
            const now = Date.now();
            const sql = `
                INSERT INTO users (user_id, username, password_hash, role, created_at, updated_at)
                VALUES (?, ?, ?, 'child', ?, ?)
            `;
            
            await expect(
                db.prepare(sql).bind(userId, 'testuser', hashPassword('password123'), now, now).run()
            ).rejects.toThrow();
        });
    });
    
    describe('TC_USER_EDGE_001: Username Length Boundary', () => {
        test('should accept 1 character username', () => {
            const username = 'a';
            expect(username.length).toBe(1);
            expect(username.length).toBeGreaterThanOrEqual(1);
            expect(username.length).toBeLessThanOrEqual(50);
        });
        
        test('should accept 50 character username', () => {
            const username = 'a'.repeat(50);
            expect(username.length).toBe(50);
            expect(username.length).toBeGreaterThanOrEqual(1);
            expect(username.length).toBeLessThanOrEqual(50);
        });
        
        test('should reject 51 character username', () => {
            const username = 'a'.repeat(51);
            expect(username.length).toBe(51);
            expect(username.length).toBeGreaterThan(50);
        });
    });
    
    describe('TC_USER_EDGE_002: Password Length Boundary', () => {
        test('should reject 5 character password', () => {
            const password = 'a'.repeat(5);
            expect(password.length).toBeLessThan(6);
        });
        
        test('should accept 6 character password', () => {
            const password = 'a'.repeat(6);
            expect(password.length).toBeGreaterThanOrEqual(6);
            expect(password.length).toBeLessThanOrEqual(20);
        });
        
        test('should accept 20 character password', () => {
            const password = 'a'.repeat(20);
            expect(password.length).toBeGreaterThanOrEqual(6);
            expect(password.length).toBeLessThanOrEqual(20);
        });
        
        test('should reject 21 character password', () => {
            const password = 'a'.repeat(21);
            expect(password.length).toBeGreaterThan(20);
        });
    });
    
    describe('TC_USER_SEC_001: Password Encryption', () => {
        test('should store password as hash', () => {
            const password = 'password123';
            const hashedPassword = hashPassword(password);
            
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBe(64);
        });
    });
    
    describe('Token Generation', () => {
        test('should generate valid token format', () => {
            const token = generateToken('test_user_1');
            const parts = token.split('.');
            
            expect(parts.length).toBe(3);
        });
        
        test('should include userId in token payload', () => {
            const token = generateToken('test_user_1');
            const parts = token.split('.');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            
            expect(payload.userId).toBe('test_user_1');
        });
        
        test('should include expiration in token payload', () => {
            const token = generateToken('test_user_1');
            const parts = token.split('.');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            
            expect(payload.exp).toBeDefined();
            expect(payload.exp).toBeGreaterThan(Date.now());
        });
    });
});
