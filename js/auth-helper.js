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
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        return 'https://parkpay-backend-1ti1.onrender.com/api';
    }

    // Generar nonce único por sesión (anti-replay attacks)
    generateNonce() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Obtener token JWT desde localStorage
    getToken() {
        return localStorage.getItem(this.tokenKey);
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
        return !!(token && user);
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

        const url = `${this.apiUrl}${endpoint}`;
        
        try {
            console.log(`🔐 Secure Request: ${options.method || 'GET'} ${endpoint}`);
            
            const response = await fetch(url, requestConfig);
            
            // Verificar respuesta de autenticación
            if (response.status === 401) {
                console.warn('🚨 Token expirado o inválido');
                this.logout();
                window.location.href = '/index.html';
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
            
        } catch (error) {
            console.error('❌ Error en request seguro:', error);
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
                // Guardar token y datos de usuario
                localStorage.setItem(this.tokenKey, data.token);
                localStorage.setItem(this.userKey, JSON.stringify(data.usuario));
                
                console.log('✅ Login exitoso con JWT');
                return data;
            } else {
                throw new Error(data.mensaje || 'Error en login');
            }
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    }

    // Logout seguro
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        console.log('✅ Logout exitoso');
    }

    // Middleware para proteger páginas
    protectPage() {
        if (!this.isAuthenticated()) {
            console.warn('🚨 Acceso no autorizado - Redirigiendo al login');
            window.location.href = '/index.html';
            return false;
        }
        return true;
    }

    // Middleware para proteger páginas de admin
    protectAdminPage() {
        if (!this.isAuthenticated()) {
            console.warn('🚨 No autenticado - Redirigiendo al login');
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

// Log de inicialización
console.log('🔐 AuthHelper inicializado');
console.log(`🌐 API URL: ${window.authHelper.apiUrl}`);
console.log(`👤 Autenticado: ${window.authHelper.isAuthenticated()}`);
console.log(`👑 Admin: ${window.authHelper.isAdmin()}`);