// Configuración para desarrollo local
const LOCAL_CONFIG = {
    // URL del backend local
    API_URL: 'http://localhost:3000/api',
    
    // Configuración de ambiente
    ENVIRONMENT: 'local',
    
    // Logs más detallados en desarrollo
    DEBUG_MODE: true,
    
    // Configuración de cache (deshabilitado en local)
    DISABLE_CACHE: true
};

// Función para detectar si estamos en desarrollo local
function isLocalEnvironment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
}

// Función para obtener la URL de la API según el ambiente
function getApiUrl() {
    if (isLocalEnvironment()) {
        return LOCAL_CONFIG.API_URL;
    }
    // En producción usar la URL de Render
    return 'https://parkpay-backend-1ti1.onrender.com/api';
}

// Función de log mejorada para desarrollo
function debugLog(message, data = null) {
    if (isLocalEnvironment() && LOCAL_CONFIG.DEBUG_MODE) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`🔧 [${timestamp}] ${message}`, data || '');
    }
}

// Helper para requests con detección automática de ambiente
async function apiRequest(endpoint, options = {}) {
    const url = `${getApiUrl()}${endpoint}`;
    
    debugLog(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        debugLog(`✅ API Response: ${response.status} ${response.statusText}`);
        
        return response;
    } catch (error) {
        debugLog(`❌ API Error: ${error.message}`);
        throw error;
    }
}

// Exportar para uso global
window.LOCAL_CONFIG = LOCAL_CONFIG;
window.isLocalEnvironment = isLocalEnvironment;
window.getApiUrl = getApiUrl;
window.debugLog = debugLog;
window.apiRequest = apiRequest;

// Log de inicialización
debugLog(`🔧 Entorno detectado: ${isLocalEnvironment() ? 'LOCAL' : 'PRODUCCION'}`);
debugLog(`🔗 API URL: ${getApiUrl()}`);