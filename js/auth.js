// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

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
            // Guardar datos del usuario en localStorage
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            localStorage.setItem('vehiculos', JSON.stringify(data.vehiculos));
            
            showMessage('¡Bienvenido! Redirigiendo...', 'success');
            
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
    
    // Validaciones
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
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
            showMessage('¡Registro exitoso! Ahora puedes iniciar sesión', 'success');
            
            // Limpiar formulario
            document.getElementById('registerForm').querySelector('form').reset();
            
            // Cambiar a formulario de login después de 2 segundos
            setTimeout(() => {
                showLoginForm();
            }, 2000);
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
    if (usuario && window.location.pathname.includes('index.html')) {
        window.location.href = 'inicio.html';
    }
});
