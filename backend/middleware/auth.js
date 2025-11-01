const jwt = require('jsonwebtoken');
const securityLogger = require('./security-logger');
const pool = require('../config/database');

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'parkpay_secret_key_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// 🔐 MIDDLEWARE DE VERIFICACIÓN JWT - ANTI BURP SUITE
const verificarToken = async (req, res, next) => {
    try {
        // 🐛 DEBUG: Log para producción
        console.log('🔐 Verificando token JWT...');
        console.log('Headers recibidos:', {
            authorization: req.headers.authorization ? 'PRESENTE' : 'AUSENTE',
            'x-request-source': req.headers['x-request-source'],
            'user-agent': req.headers['user-agent']
        });
        
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token de acceso requerido',
                mensaje: 'Debe proporcionar un token de autenticación válido'
            });
        }

        const token = authHeader.substring(7); // Remover "Bearer "

        // Verificar headers de seguridad adicionales
        const requestNonce = req.headers['x-request-nonce'];
        const requestTime = req.headers['x-request-time'];
        const requestSource = req.headers['x-request-source'];

        if (!requestSource || requestSource !== 'parkpay-frontend') {
            return res.status(403).json({
                error: 'Origen de request no autorizado',
                mensaje: 'Request debe venir del frontend oficial'
            });
        }

        // Verificar tiempo del request (anti-replay attack)
        if (requestTime) {
            const requestTimestamp = parseInt(requestTime);
            const currentTime = Date.now();
            const timeDiff = Math.abs(currentTime - requestTimestamp);
            
            // Request no puede ser más viejo de 5 minutos
            if (timeDiff > 5 * 60 * 1000) {
                return res.status(403).json({
                    error: 'Request expirado',
                    mensaje: 'El request es demasiado antiguo'
                });
            }
        }

        // Verificar y decodificar el token JWT
        console.log('🔑 JWT_SECRET disponible:', JWT_SECRET ? 'SÍ' : 'NO');
        console.log('🎫 Token recibido (primeros 20 chars):', token.substring(0, 20) + '...');
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verificar que el usuario aún existe en la base de datos
        const userResult = await pool.query(
            'SELECT id_usuario, nombre, apellido, email, rol FROM Usuarios WHERE id_usuario = $1',
            [decoded.id_usuario]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'Usuario no encontrado',
                mensaje: 'El usuario del token no existe'
            });
        }

        const usuario = userResult.rows[0];

        // Agregar datos del usuario al request
        req.user = {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol || 'cliente'
        };

        console.log(`✅ Token válido para usuario: ${usuario.email} (${usuario.rol})`);
        next();

    } catch (error) {
        console.error('❌ Error verificando token:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido',
                mensaje: 'El token proporcionado no es válido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado',
                mensaje: 'El token ha expirado, inicie sesión nuevamente'
            });
        }

        return res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: 'Error al verificar autenticación'
        });
    }
};

// 🛡️ MIDDLEWARE DE VERIFICACIÓN DE ADMIN
const verificarAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Usuario no autenticado',
                mensaje: 'Debe estar autenticado para acceder'
            });
        }

        // Verificar si es administrador
        const esAdmin = req.user.rol === 'admin' || 
                      req.user.email?.includes('@parkpay.com');

        if (!esAdmin) {
            console.warn(`🚨 Intento de acceso admin por: ${req.user.email}`);
            return res.status(403).json({
                error: 'Acceso denegado',
                mensaje: 'Solo los administradores pueden acceder a este recurso'
            });
        }

        console.log(`👑 Acceso admin autorizado para: ${req.user.email}`);
        next();

    } catch (error) {
        console.error('❌ Error verificando permisos admin:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: 'Error al verificar permisos'
        });
    }
};

// 🔐 FUNCIÓN PARA GENERAR TOKEN JWT
const generarToken = (usuario) => {
    const payload = {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        rol: usuario.rol || 'cliente'
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'parkpay-backend',
        audience: 'parkpay-frontend'
    });
};

// 🛡️ RATE LIMITING POR IP
const requestCounts = new Map();

const rateLimitByIP = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const currentTime = Date.now();
        
        if (!requestCounts.has(clientIP)) {
            requestCounts.set(clientIP, { count: 1, resetTime: currentTime + windowMs });
            return next();
        }

        const clientData = requestCounts.get(clientIP);
        
        if (currentTime > clientData.resetTime) {
            // Reset del contador
            clientData.count = 1;
            clientData.resetTime = currentTime + windowMs;
            return next();
        }

        if (clientData.count >= maxRequests) {
            console.warn(`🚨 Rate limit excedido para IP: ${clientIP}`);
            
            // Log del evento de seguridad
            securityLogger.logRateLimitExceeded('IP', clientIP, clientIP);
            
            return res.status(429).json({
                error: 'Demasiadas solicitudes',
                mensaje: 'Ha excedido el límite de solicitudes por minuto'
            });
        }

        clientData.count++;
        next();
    };
};

// 🛡️ RATE LIMITING POR USUARIO AUTENTICADO
const userRequestCounts = new Map();

const rateLimitByUser = (maxRequests = 50, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        // Solo aplicar si hay usuario autenticado
        if (!req.usuario || !req.usuario.id_usuario) {
            return next();
        }

        const userId = req.usuario.id_usuario;
        const currentTime = Date.now();
        
        if (!userRequestCounts.has(userId)) {
            userRequestCounts.set(userId, { count: 1, resetTime: currentTime + windowMs });
            return next();
        }

        const userData = userRequestCounts.get(userId);
        
        if (currentTime > userData.resetTime) {
            // Reset del contador
            userData.count = 1;
            userData.resetTime = currentTime + windowMs;
            return next();
        }

        if (userData.count >= maxRequests) {
            console.warn(`🚨 Rate limit excedido para usuario: ${userId} (${req.usuario.email})`);
            
            // Log del evento de seguridad
            securityLogger.logRateLimitExceeded('USER', userId, req.ip);
            
            return res.status(429).json({
                error: 'Demasiadas solicitudes por usuario',
                mensaje: 'Ha excedido el límite de solicitudes por usuario. Espere antes de intentar nuevamente.',
                nextRetry: new Date(userData.resetTime).toISOString()
            });
        }

        userData.count++;
        next();
    };
};

// 🛡️ MIDDLEWARE COMBINADO DE PROTECCIÓN ANTI-BURP
const proteccionAntiBurp = (req, res, next) => {
    // 1. Rate limiting por IP (100 req/15min)
    rateLimitByIP(100, 15 * 60 * 1000)(req, res, (err) => {
        if (err) return;
        
        // 2. Rate limiting por usuario autenticado (50 req/15min)
        rateLimitByUser(50, 15 * 60 * 1000)(req, res, next);
    });
};

// 🚨 DETECCIÓN DE ATAQUES AUTOMATIZADOS
const detectarBurpSuite = (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const suspiciousHeaders = [
        'Burp Suite Professional',
        'Burp Suite Community',
        'python-requests',
        'curl/',
        'Postman',
        'HTTPie'
    ];

    // Detectar herramientas automatizadas
    const isSuspicious = suspiciousHeaders.some(header => 
        userAgent.toLowerCase().includes(header.toLowerCase())
    );

    if (isSuspicious) {
        console.warn(`🚨 ATAQUE DETECTADO: User-Agent sospechoso: ${userAgent} desde IP: ${req.ip}`);
        
        // Log del ataque
        securityLogger.logBurpSuiteDetected(req.ip, userAgent, req.originalUrl, req.method);
        
        return res.status(403).json({
            error: 'Acceso denegado',
            mensaje: 'Herramienta automatizada detectada. Acceso no autorizado.',
            codigo: 'AUTOMATED_TOOL_DETECTED'
        });
    }

    next();
};

module.exports = {
    verificarToken,
    verificarAdmin,
    generarToken,
    rateLimitByIP,
    rateLimitByUser,
    proteccionAntiBurp,
    detectarBurpSuite,
    JWT_SECRET
};