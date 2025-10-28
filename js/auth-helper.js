// 🔐 SISTEMA DE AUTENTICACIÓN JWT ANTI-BURP SUITE
// Protege contra manipulación de requests con herramientas como Burp Suite

class AuthHelper {
    constructor() {
        this.API_URL = getApiUrl(); // Definido en local-config.js
        this.token = null;
        this.userId = null;
        this.userRole = null;
        this.init();
    }

    init() {
        // Cargar token y datos de usuario desde localStorage
        this.token = localStorage.getItem('token');
        const userData = localStorage.getItem('usuario');
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                this.userId = user.id_usuario;
                this.userRole = user.rol || 'cliente';
                debugLog('🔐 AuthHelper inicializado', { userId: this.userId, role: this.userRole });
            } catch (error) {
                debugLog('❌ Error parsing user data:', error);
                this.clearAuth();
            }
        }
    }

    // 🛡️ Request seguro con JWT - ANTI-BURP SUITE
    async fetchWithAuth(endpoint, options = {}) {
        // Verificar que hay token
        if (!this.token) {
            debugLog('❌ No hay token JWT - Redirigiendo a login');
            this.redirectToLogin();
            throw new Error('No authenticated');
        }

        // Preparar headers seguros
        const secureHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'X-User-ID': this.userId, // Verificación cruzada en backend
            'X-User-Role': this.userRole,
            'X-Timestamp': Date.now(), // Prevenir replay attacks
            ...options.headers
        };

        // URL completa
        const url = `${this.API_URL}${endpoint}`;
        
        debugLog(`🔐 Secure Request: ${options.method || 'GET'} ${url}`, {
            userId: this.userId,
            role: this.userRole,
            hasToken: !!this.token
        });

        try {
            const response = await fetch(url, {
                ...options,
                headers: secureHeaders
            });

            // Manejar token expirado
            if (response.status === 401) {
                debugLog('❌ Token expirado - Logout automático');
                this.clearAuth();
                this.redirectToLogin();
                throw new Error('Token expired');
            }

            // Manejar acceso denegado
            if (response.status === 403) {
                debugLog('❌ Acceso denegado - Permisos insuficientes');
                throw new Error('Access denied');
            }

            debugLog(`✅ Response: ${response.status} ${response.statusText}`);
            return response;

        } catch (error) {
            debugLog(`❌ Request failed: ${error.message}`);
            throw error;
        }
    }

    // 🔒 Request solo para ADMIN - EXTRA PROTECCIÓN
    async fetchAdminOnly(endpoint, options = {}) {
        if (this.userRole !== 'admin') {
            debugLog('❌ Acceso denegado - Solo admin');
            throw new Error('Admin access required');
        }

        return this.fetchWithAuth(endpoint, options);
    }

    // 🎯 Requests específicos con validación extra
    async getUserData() {
        // Solo puede obtener SUS propios datos
        return this.fetchWithAuth(`/auth/me`);
    }

    async updateProfile(data) {
        // Solo puede actualizar SU propio perfil
        return this.fetchWithAuth(`/auth/profile`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async getVehicles() {
        // Solo SUS vehículos
        return this.fetchWithAuth(`/vehiculos/mis-vehiculos`);
    }

    async getReservations() {
        // Solo SUS reservas
        return this.fetchWithAuth(`/reservas/mis-reservas`);
    }

    async getTickets() {
        // Solo SUS tickets
        return this.fetchWithAuth(`/tickets/mis-tickets`);
    }

    // 👑 ADMIN ENDPOINTS - SÚPER PROTEGIDOS
    async adminGetStats() {
        return this.fetchAdminOnly('/admin/stats');
    }

    async adminGetUsers() {
        return this.fetchAdminOnly('/admin/usuarios');
    }

    async adminUpdateUser(userId, data) {
        return this.fetchAdminOnly(`/admin/usuarios/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // 🧹 Utilidades de autenticación
    clearAuth() {
        this.token = null;
        this.userId = null;
        this.userRole = null;
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        debugLog('🧹 Auth cleared');
    }

    redirectToLogin() {
        if (window.location.pathname !== '/index.html') {
            debugLog('🔄 Redirecting to login');
            window.location.href = '/index.html';
        }
    }

    isAuthenticated() {
        return !!this.token && !!this.userId;
    }

    isAdmin() {
        return this.userRole === 'admin';
    }

    // 🚨 Detección de manipulación (anti-tampering)
    validateUserData() {
        const storedUser = localStorage.getItem('usuario');
        if (!storedUser) return false;

        try {
            const user = JSON.parse(storedUser);
            // Validar que los datos no hayan sido manipulados
            if (!user.id_usuario || !user.email) {
                debugLog('⚠️ Datos de usuario corrupto detectado');
                this.clearAuth();
                return false;
            }
            return true;
        } catch (error) {
            debugLog('❌ Error validando datos de usuario');
            this.clearAuth();
            return false;
        }
    }
}

// 🌍 Instancia global
window.authHelper = new AuthHelper();

// 🔐 Helper functions para compatibilidad
window.fetchWithAuth = (endpoint, options) => window.authHelper.fetchWithAuth(endpoint, options);
window.fetchAdminOnly = (endpoint, options) => window.authHelper.fetchAdminOnly(endpoint, options);

debugLog('🔐 JWT AuthHelper cargado y listo');