// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

// Variables globales
let usuario = null;
let vehiculos = [];

// Inicializar página
window.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión
    const usuarioData = localStorage.getItem('usuario');
    
    if (!usuarioData) {
        window.location.href = 'index.html';
        return;
    }

    usuario = JSON.parse(usuarioData);
    
    // Cargar datos
    cargarPerfilUsuario();
    await cargarVehiculos();
});

// Cargar información del perfil
function cargarPerfilUsuario() {
    document.getElementById('userName').textContent = `${usuario.nombre} ${usuario.apellido}`;
    document.getElementById('userEmail').textContent = usuario.email;
    
    // Formatear fecha de registro
    const fecha = new Date(usuario.fecha_registro);
    const fechaFormateada = fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('memberSince').textContent = `Miembro desde ${fechaFormateada}`;
}

// Cargar vehículos del usuario
async function cargarVehiculos() {
    try {
        const response = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}/vehiculos`);
        
        if (!response.ok) {
            throw new Error('Error al cargar vehículos');
        }

        vehiculos = await response.json();
        mostrarVehiculos();
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al cargar los vehículos', 'error');
        
        // Mostrar estado vacío con error
        document.getElementById('vehiclesList').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>No se pudieron cargar los vehículos</p>
            </div>
        `;
    }
}

// Mostrar lista de vehículos
function mostrarVehiculos() {
    const container = document.getElementById('vehiclesList');
    
    if (vehiculos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🚗</div>
                <p>No tienes vehículos registrados</p>
                <small style="color: #94a3b8;">Agrega tu primer vehículo para empezar</small>
            </div>
        `;
        return;
    }

    container.innerHTML = vehiculos.map(vehiculo => `
        <div class="vehicle-card">
            <div class="vehicle-plate">${vehiculo.placa || 'Sin placa'}</div>
            <div class="vehicle-info">
                ${vehiculo.tipo ? `<span>🚙 ${vehiculo.tipo}</span>` : ''}
                ${vehiculo.marca ? `<span>🏢 ${vehiculo.marca}</span>` : ''}
                ${vehiculo.modelo ? `<span>🚘 ${vehiculo.modelo}</span>` : ''}
                ${vehiculo.color ? `<span>🎨 ${vehiculo.color}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// Abrir modal de agregar vehículo
function openAddVehicleModal() {
    document.getElementById('addVehicleModal').classList.add('active');
    document.getElementById('addVehicleForm').reset();
}

// Cerrar modal de agregar vehículo
function closeAddVehicleModal() {
    document.getElementById('addVehicleModal').classList.remove('active');
}

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
    const modal = document.getElementById('addVehicleModal');
    if (e.target === modal) {
        closeAddVehicleModal();
    }
});

// Enviar formulario de nuevo vehículo
async function submitVehicle(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Agregando...';

    const formData = {
        placa: document.getElementById('placa').value.trim().toUpperCase(),
        tipo: document.getElementById('tipo').value,
        marca: document.getElementById('marca').value.trim() || null,
        modelo: document.getElementById('modelo').value.trim() || null,
        color: document.getElementById('color').value.trim() || null
    };

    try {
        const response = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}/vehiculos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al agregar vehículo');
        }

        // Éxito
        showMessage('✅ Vehículo agregado exitosamente', 'success');
        closeAddVehicleModal();
        
        // Recargar lista de vehículos
        await cargarVehiculos();
        
        // Actualizar localStorage si es necesario
        const vehiculosActualizados = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}/vehiculos`).then(r => r.json());
        localStorage.setItem('vehiculos', JSON.stringify(vehiculosActualizados));

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al agregar vehículo', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Agregar Vehículo';
    }
}

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('usuario');
        localStorage.removeItem('vehiculos');
        window.location.href = 'index.html';
    }
}

// Mostrar mensajes
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = type;
    messageBox.style.display = 'block';

    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}
