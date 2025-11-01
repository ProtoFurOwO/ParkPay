// 📊 SISTEMA DE LOGS DE SEGURIDAD AVANZADO
const fs = require('fs').promises;
const path = require('path');

class SecurityLogger {
    constructor() {
        this.logFile = path.join(__dirname, '../logs/security.log');
        this.ensureLogDirectory();
    }

    async ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        try {
            await fs.access(logDir);
        } catch {
            await fs.mkdir(logDir, { recursive: true });
        }
    }

    async logSecurityEvent(event) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            ...event
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        
        try {
            await fs.appendFile(this.logFile, logLine);
            console.log(`🔒 Evento de seguridad registrado: ${event.type}`);
        } catch (error) {
            console.error('Error escribiendo log de seguridad:', error);
        }
    }

    // Log de intento de login sospechoso
    async logSuspiciousLogin(ip, userAgent, email = null) {
        await this.logSecurityEvent({
            type: 'SUSPICIOUS_LOGIN_ATTEMPT',
            level: 'WARNING',
            ip: ip,
            userAgent: userAgent,
            email: email,
            description: 'Intento de login desde herramienta automatizada'
        });
    }

    // Log de rate limit excedido
    async logRateLimitExceeded(type, identifier, ip) {
        await this.logSecurityEvent({
            type: 'RATE_LIMIT_EXCEEDED',
            level: 'WARNING',
            rateLimitType: type, // 'IP' o 'USER'
            identifier: identifier,
            ip: ip,
            description: `Rate limit excedido para ${type}: ${identifier}`
        });
    }

    // Log de burp suite detectado
    async logBurpSuiteDetected(ip, userAgent, url, method) {
        await this.logSecurityEvent({
            type: 'BURP_SUITE_DETECTED',
            level: 'CRITICAL',
            ip: ip,
            userAgent: userAgent,
            url: url,
            method: method,
            description: 'Burp Suite o herramienta automatizada detectada'
        });
    }

    // Log de JWT inválido
    async logInvalidJWT(ip, token, reason) {
        await this.logSecurityEvent({
            type: 'INVALID_JWT',
            level: 'WARNING',
            ip: ip,
            tokenPrefix: token ? token.substring(0, 20) + '...' : 'null',
            reason: reason,
            description: 'Token JWT inválido detectado'
        });
    }

    // Log de acceso no autorizado
    async logUnauthorizedAccess(ip, userAgent, url, userId = null) {
        await this.logSecurityEvent({
            type: 'UNAUTHORIZED_ACCESS',
            level: 'WARNING',
            ip: ip,
            userAgent: userAgent,
            url: url,
            userId: userId,
            description: 'Intento de acceso no autorizado'
        });
    }
}

module.exports = new SecurityLogger();