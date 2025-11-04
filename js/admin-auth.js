// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

// Verificar conexión al cargar
console.log('🔍 Iniciando admin-auth.js...');
console.log('🌐 API URL configurada:', API_URL);

// Validar contraseña fuerte
function validarContraseña(password) {
    const errores = [];
    
    if (password.length < 6) {
        errores.push('mínimo 6 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
        errores.push('al menos 1 mayúscula');
    }
    
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

// Al cargar la página, verificar si ya existe un admin
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🔍 Verificando conexión con el servidor...');
    
    try {
        const response = await fetch(`${API_URL}/admin/check-admin`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Conexión exitosa:', data);
        
        document.getElementById('loadingBox').style.display = 'none';
        
        if (data.existe_admin) {
            // Ya existe admin, mostrar login
            document.getElementById('loginAdminForm').classList.add('active');
            document.getElementById('loginAdminForm').style.display = 'block';
        } else {
            // No existe admin, mostrar registro
            document.getElementById('registerAdminForm').classList.add('active');
            document.getElementById('registerAdminForm').style.display = 'block';
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        console.log('🔍 URL utilizada:', `${API_URL}/admin/check-admin`);
        
        const loadingBox = document.getElementById('loadingBox');
        loadingBox.innerHTML = `
            <div style="color: #ef4444; text-align: center; padding: 20px;">
                <h3>Error de conexión</h3>
                <p>No se pudo conectar con el servidor backend.</p>
                <p><strong>URL:</strong> ${API_URL}</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px;">
                    🔄 Reintentar
                </button>
            </div>
        `;
        
        showMessage('Error de conexión al servidor. Verifica que el backend esté funcionando.', 'error');
    }
});

// Registrar administrador (primera vez)
async function handleRegisterAdmin(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const nombre_completo = document.getElementById('regNombreCompleto').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    
    // Validaciones
    if (password !== passwordConfirm) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }
    
    // Validación de contraseña fuerte
    const passwordValidation = validarContraseña(password);
    if (!passwordValidation.valida) {
        showMessage(passwordValidation.mensaje, 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password,
                nombre_completo
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('¡Administrador registrado exitosamente! Redirigiendo...', 'success');
            
            // 🔐 Después del registro, hacer login automático para obtener token
            try {
                const loginResponse = await fetch(`${API_URL}/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const loginData = await loginResponse.json();
                
                if (loginResponse.ok && loginData.token) {
                    // Guardar datos del admin Y el token JWT
                    localStorage.setItem('admin', JSON.stringify(loginData.admin));
                    localStorage.setItem('parkpay_token', loginData.token);
                    localStorage.setItem('token', loginData.token); // Compatible con versión antigua
                }
            } catch (error) {
                console.error('Error en login automático:', error);
            }
            
            setTimeout(() => {
                window.location.href = 'admin-panel.html';
            }, 1500);
        } else {
            showMessage(data.error || 'Error al registrar administrador', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Verifica que el servidor esté corriendo.', 'error');
    }
}

// Login de administrador
async function handleLoginAdmin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('¡Bienvenido! Redirigiendo...', 'success');
            
            // 🔐 Guardar datos del admin Y el token JWT
            localStorage.setItem('admin', JSON.stringify(data.admin));
            
            // 🔑 IMPORTANTE: Guardar token JWT para auth-helper.js
            if (data.token) {
                localStorage.setItem('parkpay_token', data.token);
                localStorage.setItem('token', data.token); // Compatible con versión antigua
            }
            
            setTimeout(() => {
                window.location.href = 'admin-panel.html';
            }, 1500);
        } else {
            showMessage(data.error || 'Error al iniciar sesión', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Verifica que el servidor esté corriendo.', 'error');
    }
}

// Mostrar mensajes
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    
    setTimeout(() => {
        messageBox.className = 'message-box';
    }, 5000);
}
