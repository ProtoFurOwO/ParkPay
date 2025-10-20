// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

let emailActual = '';
let codigoGenerado = '';

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
            mensaje: `La contraseña debe tener: ${errores.join(', ')}`
        };
    }
    
    return { valida: true };
}

function showMessage(message, type) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

function cambiarPaso(numeroPaso) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step${numeroPaso}`).classList.add('active');
    
    const descripciones = {
        1: 'Ingresa tu email para recuperar tu cuenta',
        2: 'Revisa tu correo e ingresa el código de 6 dígitos',
        3: 'Crea una nueva contraseña segura'
    };
    
    document.getElementById('stepDescription').textContent = descripciones[numeroPaso];
}

// PASO 1: Solicitar código de recuperación
async function solicitarCodigo(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    emailActual = email;
    
    const btnSolicitar = document.getElementById('btnSolicitar');
    btnSolicitar.disabled = true;
    btnSolicitar.textContent = '📨 Enviando...';
    
    try {
        const response = await fetch(`${API_URL}/auth/solicitar-recuperacion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Guardar código temporalmente (en producción esto vendría en el email)
            codigoGenerado = data.codigo;
            
            showMessage(`✅ Código enviado a ${email}. Revisa tu bandeja de entrada.`, 'success');
            
            // Avanzar al paso 2
            setTimeout(() => {
                cambiarPaso(2);
            }, 2000);
        } else {
            showMessage(data.error || 'Error al solicitar recuperación', 'error');
            btnSolicitar.disabled = false;
            btnSolicitar.textContent = '📨 Enviar Código de Recuperación';
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión al servidor', 'error');
        btnSolicitar.disabled = false;
        btnSolicitar.textContent = '📨 Enviar Código de Recuperación';
    }
}

// PASO 2: Verificar código
async function verificarCodigo(event) {
    event.preventDefault();
    
    const codigoIngresado = document.getElementById('codigo').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/verificar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: emailActual,
                codigo: codigoIngresado
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('✅ Código correcto! Ahora crea tu nueva contraseña', 'success');
            
            setTimeout(() => {
                cambiarPaso(3);
            }, 1500);
        } else {
            showMessage(data.error || 'Código incorrecto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión al servidor', 'error');
    }
}

// PASO 3: Cambiar contraseña
async function cambiarContraseña(event) {
    event.preventDefault();
    
    const nuevaPassword = document.getElementById('nuevaPassword').value;
    const confirmarPassword = document.getElementById('confirmarPassword').value;
    
    // Validar que coincidan
    if (nuevaPassword !== confirmarPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }
    
    // Validar contraseña fuerte
    const validation = validarContraseña(nuevaPassword);
    if (!validation.valida) {
        showMessage(validation.mensaje, 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/cambiar-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: emailActual,
                nueva_password: nuevaPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('✅ ¡Contraseña cambiada exitosamente! Redirigiendo...', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage(data.error || 'Error al cambiar contraseña', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión al servidor', 'error');
    }
}

function volverAPaso1() {
    cambiarPaso(1);
    document.getElementById('codigo').value = '';
}
