// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

// === FUNCIONES JWT ===
function obtenerToken() {
    return localStorage.getItem('jwt_token');
}

function obtenerHeadersAutorizacion() {
    const token = obtenerToken();
    return token ? {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    } : {
        'Content-Type': 'application/json'
    };
}

// Verificar si token está expirado
function tokenExpirado() {
    const token = obtenerToken();
    if (!token) return true;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        return true;
    }
}

// Limpiar toda la sesión
function logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('vehiculos');
    localStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

// Auto-logout si token expira
function verificarTokenValido() {
    if (tokenExpirado()) {
        logout();
        return false;
    }
    return true;
}

// Verificar token cada 5 minutos en páginas protegidas
if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
    setInterval(verificarTokenValido, 5 * 60 * 1000);
    
    // Verificar al cargar la página
    if (!verificarTokenValido()) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
}

// Función global para hacer requests autenticados
async function fetchConAuth(url, options = {}) {
    const headers = obtenerHeadersAutorizacion();
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    });
    
    // Si token expiró, hacer logout automático
    if (response.status === 401) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        logout();
        return null;
    }
    
    return response;
}

// Mostrar información del token (para debugging)
function infoToken() {
    const token = obtenerToken();
    if (!token) {
        console.log('No hay token');
        return;
    }
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token info:', {
            usuario: payload.email,
            expira: new Date(payload.exp * 1000),
            esValido: !tokenExpirado()
        });
    } catch (e) {
        console.log('Token inválido');
    }
}

// Disponible globalmente para debugging
window.infoToken = infoToken;
window.logout = logout;