// 🔐 HELPER DE AUTENTICACIÓN JWT - ANTI BURP SUITE
// Este helper hace que NO se puedan interceptar/modificar requests con Burp Suite

class AuthHelper {
    constructor() {
        this.apiUrl = this.getApiUrl();
        this.tokenKey = 'parkpay_token';
        this.userKey = 'parkpay_user';
        this.requestNonce = this.generateNonce();
    }

    // Detectar ambiente (local vs producción)
    getApiUrl() {
        // Solo usar localhost si realmente estamos en desarrollo local
        if (window.location.hostname === 'localhost' && window.location.port === '5500') {
            return 'http://localhost:3000/api';
        }
        // Siempre usar producción en cualquier otro caso (incluido Vercel)
        return 'https://parkpay-backend-1ti1.onrender.com/api';
    }

    // Generar nonce único por sesión (anti-replay attacks)
    generateNonce() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Obtener token JWT desde localStorage
    getToken() {
        const token = localStorage.getItem(this.tokenKey);
        return token;
    }

    // Obtener datos de usuario
    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        
        // TAMBIÉN verificar las claves del código existente
        const usuarioExistente = localStorage.getItem('usuario');
        
        return !!(token && user) || !!usuarioExistente;
    }

    // Verificar si es administrador
    isAdmin() {
        const user = this.getUser();
        return user && (user.rol === 'admin' || user.email?.includes('@parkpay.com'));
    }

    // 🔐 REQUEST SEGURO CON JWT - ANTI BURP SUITE
    async secureRequest(endpoint, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        // Headers de seguridad anti-interceptación
        const secureHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Request-Nonce': this.requestNonce,
            'X-Request-Time': Date.now().toString(),
            'X-Request-Source': 'parkpay-frontend',
            ...options.headers
        };

        // Configuración del request
        const requestConfig = {
            ...options,
            headers: secureHeaders,
            credentials: 'include', // Incluir cookies
            mode: 'cors'
        };

        // 🛠️ FIX: Detectar si endpoint ya es URL completa o solo ruta
        let url;
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            // Ya es URL completa, usarla tal como está
            url = endpoint;
        } else {
            // Es solo una ruta, agregar base URL
            url = `${this.apiUrl}${endpoint}`;
        }
        
        try {
            const response = await fetch(url, requestConfig);
            
            // Verificar respuesta de autenticación
            if (response.status === 401) {
                this.logout();
                window.location.href = '/index.html';
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
            
        } catch (error) {
            throw error;
        }
    }

    // GET request seguro
    async get(endpoint) {
        return this.secureRequest(endpoint, { method: 'GET' });
    }

    // POST request seguro
    async post(endpoint, data) {
        return this.secureRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request seguro
    async put(endpoint, data) {
        return this.secureRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request seguro
    async delete(endpoint) {
        return this.secureRequest(endpoint, { method: 'DELETE' });
    }

    // Login con JWT
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-Source': 'parkpay-frontend'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Guardar token y datos de usuario (COMPATIBILIDAD CON CÓDIGO EXISTENTE)
                localStorage.setItem(this.tokenKey, data.token);
                localStorage.setItem(this.userKey, JSON.stringify(data.usuario));
                
                // TAMBIÉN guardar en las claves que usa el resto del código
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                localStorage.setItem('vehiculos', JSON.stringify(data.vehiculos || []));
                
                return data;
            } else {
                throw new Error(data.mensaje || 'Error en login');
            }
            
        } catch (error) {
            throw error;
        }
    }

    // Logout seguro
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        
        // TAMBIÉN limpiar las claves del código existente
        localStorage.removeItem('usuario');
        localStorage.removeItem('vehiculos');
    }

    // Middleware para proteger páginas
    protectPage() {
        if (!this.isAuthenticated()) {
            window.location.href = '/index.html';
            return false;
        }
        return true;
    }

    // Middleware para proteger páginas de admin
    protectAdminPage() {
        if (!this.isAuthenticated()) {
            window.location.href = '/index.html';
            return false;
        }
        
        if (!this.isAdmin()) {
            console.warn('🚨 Acceso denegado - No es administrador');
            alert('Acceso denegado: Solo administradores pueden acceder');
            window.location.href = '/inicio.html';
            return false;
        }
        
        return true;
    }
}

// Instancia global del helper
window.authHelper = new AuthHelper();

// 🔑 FUNCIONES GLOBALES PARA COMPATIBILIDAD
window.secureRequest = (endpoint, options) => window.authHelper.secureRequest(endpoint, options);
window.login = (email, password) => window.authHelper.login(email, password);
window.logout = () => window.authHelper.logout();
window.isAuthenticated = () => window.authHelper.isAuthenticated();
window.getCurrentUser = () => window.authHelper.getCurrentUser();
window.isAdmin = () => window.authHelper.isAdmin();