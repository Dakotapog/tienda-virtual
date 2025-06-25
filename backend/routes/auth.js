const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getQuery } = require('../models/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_cambiala_en_produccion';

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token requerido',
            message: 'Se requiere autenticación para acceder a este recurso'
        });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido',
                message: 'El token de autenticación no es válido'
            });
        }
        
        req.user = user;
        next();
    });
};

// ==========================================
// REGISTRO DE USUARIO
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        console.log(`👤 Intento de registro - Usuario: ${username}, Email: ${email}`);
        
        // Validaciones básicas
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Username, email y password son requeridos'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password muy corto',
                message: 'El password debe tener al menos 6 caracteres'
            });
        }
        
        // Verificar si el usuario ya existe
        const existingUser = await getQuery(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Usuario ya existe',
                message: 'El username o email ya están registrados'
            });
        }
        
        // Encriptar password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Crear usuario
        const result = await runQuery(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        
        console.log(`✅ Usuario registrado exitosamente - ID: ${result.lastID}`);
        
        // Crear token JWT
        const token = jwt.sign(
            { id: result.lastID, username, email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: result.lastID,
                    username,
                    email
                },
                token
            }
        });
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo registrar el usuario'
        });
    }
});

// ==========================================
// LOGIN DE USUARIO
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        const identifier = email || username; // soporte para ambos
        console.log(`🔐 Intento de login - Identificador: ${identifier}`);

        // Validación
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Email o username y password son requeridos'
            });
        }

        // Buscar usuario por username o email
        const user = await getQuery(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [identifier, identifier]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'Las credenciales no son válidas'
            });
        }

        // Comparar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Password incorrecto',
                message: 'Las credenciales no son válidas'
            });
        }

        console.log(`✅ Login exitoso - Usuario: ${user.username}`);

        // Crear token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                token
            }
        });

    }   catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ==========================================
// OBTENER PERFIL DEL USUARIO
// ==========================================
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`👤 Obteniendo perfil - Usuario ID: ${userId}`);
        
        const user = await getQuery(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'El usuario no existe'
            });
        }
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    created_at: user.created_at
                }
            },
            message: 'Perfil obtenido exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo obtener el perfil'
        });
    }
});

// ==========================================
// VERIFICAR TOKEN
// ==========================================
router.post('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token requerido',
            message: 'No se proporcionó token de autenticación'
        });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido',
                message: 'El token de autenticación no es válido'
            });
        }
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            },
            message: 'Token válido'
        });
    });
});

// ==========================================
// RENOVAR TOKEN
// ==========================================
router.post('/refresh', authenticateToken, (req, res) => {
    try {
        const user = req.user;
        
        // Crear nuevo token con nueva expiración
        const newToken = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            data: {
                token: newToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            },
            message: 'Token renovado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error renovando token:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo renovar el token'
        });
    }
});

// ==========================================
// ESTADO DEL SERVICIO DE AUTENTICACIÓN
// ==========================================
router.get('/status', (req, res) => {
    res.json({
        success: true,
        data: {
            service: 'Authentication Service',
            status: 'active',
            version: '1.0.0',
            timestamp: new Date().toISOString()
        },
        message: 'Servicio de autenticación funcionando correctamente'
    });
});

// ✅ EXPORTAR TANTO EL ROUTER COMO EL MIDDLEWARE
module.exports = {
    router,
    authenticateToken
};