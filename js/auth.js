// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

// === FUNCIONES JWT ===
function guardarToken(token) {
    console.log('🔐 Guardando token:', token ? 'Recibido' : 'VACÍO');
    if (!token) {
        console.error('❌ Token es nulo o vacío, no se puede guardar');
        return false;
    }
    
    try {
        localStorage.setItem('jwt_token', token);
        console.log('✅ Token guardado en localStorage');
        
        // Verificar que realmente se guardó
        const tokenGuardado = localStorage.getItem('jwt_token');
        if (tokenGuardado === token) {
            console.log('✅ Verificación: Token confirmado en localStorage');
            return true;
        } else {
            console.error('❌ Error: Token no se guardó correctamente');
            return false;
        }
    } catch (error) {
        console.error('❌ Error al guardar token en localStorage:', error);
        return false;
    }
}

function obtenerToken() {
    return localStorage.getItem('jwt_token');
}

function eliminarToken() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('vehiculos');
}

// === FUNCIONES JWT ===
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

// Auto-logout si token expira
function verificarTokenValido() {
    if (tokenExpirado()) {
        eliminarToken();
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            window.location.href = 'index.html';
        }
        return false;
    }
    return true;
}

// Verificar token cada 5 minutos
setInterval(verificarTokenValido, 5 * 60 * 1000);

// Validar contraseña fuerte
function validarContraseña(password) {
    const errores = [];
    
    // Mínimo 6 caracteres
    if (password.length < 6) {
        errores.push('mínimo 6 caracteres');
    }
    
    // Al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
        errores.push('al menos 1 mayúscula');
    }
    
    // Al menos un número
    if (!/[0-9]/.test(password)) {
        errores.push('al menos 1 número');
    }
    
    if (errores.length > 0) {
        return {
            valida: false,
            mensaje: `🔒 La contraseña debe tener: ${errores.join(', ')}`
        };
    }
    
    return { valida: true };
}

// Funciones de UI
function showLoginForm() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
}

function showRegisterForm() {
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
}

function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    
    setTimeout(() => {
        messageBox.className = 'message-box';
    }, 5000);
}

// Manejar Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Verificar que el token existe en la respuesta
            if (!data.token) {
                console.error('❌ Backend no envió token:', data);
                showMessage('Error: No se recibió token de autenticación', 'error');
                return;
            }
            
            // Guardar JWT token y datos del usuario
            guardarToken(data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            localStorage.setItem('vehiculos', JSON.stringify(data.vehiculos));
            
            console.log('✅ Token guardado:', data.token.substring(0, 20) + '...');
            showMessage(`¡Bienvenido! Token válido por ${data.expiresIn}. Redirigiendo...`, 'success');
            
            setTimeout(() => {
                window.location.href = 'inicio.html';
            }, 1500);
        } else {
            showMessage(data.error || 'Error al iniciar sesión', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Verifica que el servidor esté corriendo.', 'error');
    }
}

// Manejar Registro
async function handleRegister(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('regNombre').value;
    const apellido = document.getElementById('regApellido').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const tipoVehiculo = document.getElementById('regTipoVehiculo').value;
    const placa = document.getElementById('regPlaca').value.toUpperCase();
    const marca = document.getElementById('regMarca').value;
    const modelo = document.getElementById('regModelo').value;
    const color = document.getElementById('regColor').value;
    
    // Validación de contraseña fuerte
    const passwordValidation = validarContraseña(password);
    if (!passwordValidation.valida) {
        showMessage(passwordValidation.mensaje, 'error');
        return;
    }
    
    if (!tipoVehiculo) {
        showMessage('Por favor selecciona el tipo de vehículo', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                apellido,
                email,
                password,
                tipo: tipoVehiculo, // ← Nuevo campo
                placa,
                marca,
                modelo,
                color
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Verificar que el token existe en la respuesta
            if (!data.token) {
                console.error('❌ Backend no envió token en registro:', data);
                showMessage('¡Registro exitoso! Ahora puedes iniciar sesión', 'success');
                setTimeout(() => {
                    showLoginForm();
                }, 2000);
                return;
            }
            
            // Guardar JWT token inmediatamente después del registro
            guardarToken(data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            localStorage.setItem('vehiculos', JSON.stringify([data.vehiculo]));
            
            showMessage('¡Registro exitoso! Redirigiendo...', 'success');
            
            setTimeout(() => {
                window.location.href = 'inicio.html';
            }, 1500);
            
            // Limpiar formulario
            document.getElementById('registerForm').querySelector('form').reset();
        } else {
            showMessage(data.error || 'Error al registrarse', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Verifica que el servidor esté corriendo.', 'error');
    }
}

// Verificar si ya hay sesión iniciada
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuario');
    const token = obtenerToken();
    
    // Si hay usuario pero no token, limpiar todo
    if (usuario && !token) {
        eliminarToken();
        return;
    }
    
    // Si hay token válido y estamos en index, redirigir a inicio
    if (token && !tokenExpirado() && window.location.pathname.includes('index.html')) {
        window.location.href = 'inicio.html';
    }
});
