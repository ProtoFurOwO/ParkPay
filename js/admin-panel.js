// Configuración de la API
const API_URL = 'http://localhost:3000/api';

// Variables globales
let admin = null;
let usuarios = [];
let vehiculos = [];
let cajones = [];
let tickets = [];
let tarifas = [];

// Inicializar panel
window.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay sesión de admin
    const adminData = localStorage.getItem('admin');
    
    if (!adminData) {
        window.location.href = 'admin.html';
        return;
    }
    
    admin = JSON.parse(adminData);
    const nombreCompleto = `${admin.nombre} ${admin.apellido}`;
    document.getElementById('adminName').textContent = `Admin: ${nombreCompleto}`;
    
    // Cargar datos iniciales
    loadStats();
    loadUsuarios();
});

// ═══════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`);
        const stats = await response.json();
        
        document.getElementById('statUsuarios').textContent = stats.total_usuarios;
        document.getElementById('statVehiculos').textContent = stats.total_vehiculos;
        document.getElementById('statCajonesOcupados').textContent = stats.cajones_ocupados;
        document.getElementById('statTicketsActivos').textContent = stats.tickets_activos;
        document.getElementById('statRecaudado').textContent = `$${parseFloat(stats.total_recaudado).toFixed(2)}`;
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// NAVEGACIÓN DE TABS
// ═══════════════════════════════════════════════════════════════

function showTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover active de todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar tab seleccionado
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
    
    // Cargar datos según el tab
    switch(tabName) {
        case 'usuarios':
            loadUsuarios();
            break;
        case 'vehiculos':
            loadVehiculos();
            break;
        case 'cajones':
            loadCajones();
            break;
        case 'tickets':
            loadTickets();
            break;
        case 'tarifas':
            loadTarifas();
            break;
    }
}

// ═══════════════════════════════════════════════════════════════
// CRUD USUARIOS
// ═══════════════════════════════════════════════════════════════

async function loadUsuarios() {
    try {
        const response = await fetch(`${API_URL}/admin/usuarios`);
        usuarios = await response.json();
        
        const tbody = document.querySelector('#tablaUsuarios tbody');
        tbody.innerHTML = '';
        
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay usuarios registrados</td></tr>';
            return;
        }
        
        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');
            const numVehiculos = usuario.total_vehiculos || 0;
            
            tr.innerHTML = `
                <td>${usuario.id_usuario}</td>
                <td>${usuario.nombre} ${usuario.apellido}</td>
                <td>${usuario.email}</td>
                <td><span class="vehiculos-badge">${numVehiculos} vehículo(s)</span></td>
                <td>${new Date(usuario.fecha_registro).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-delete" onclick="deleteUsuario(${usuario.id_usuario})">🗑️ Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showMessage('Error al cargar usuarios', 'error');
    }
}

function showCreateUserModal() {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <h2>Crear Usuario</h2>
                <form onsubmit="createUsuario(event)">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="modalNombre" required>
                    </div>
                    <div class="form-group">
                        <label>Apellido</label>
                        <input type="text" id="modalApellido" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="modalEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="modalPassword" required minlength="6">
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-success">Crear Usuario</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function createUsuario(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('modalNombre').value;
    const apellido = document.getElementById('modalApellido').value;
    const email = document.getElementById('modalEmail').value;
    const password = document.getElementById('modalPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/admin/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, apellido, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Usuario creado exitosamente', 'success');
            closeModal();
            loadUsuarios();
            loadStats();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al crear usuario', 'error');
    }
}

async function deleteUsuario(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario? Se eliminarán también sus vehículos.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/usuarios/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            loadUsuarios();
            loadStats();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al eliminar usuario', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// CRUD VEHÍCULOS
// ═══════════════════════════════════════════════════════════════

async function loadVehiculos() {
    try {
        const response = await fetch(`${API_URL}/admin/vehiculos`);
        vehiculos = await response.json();
        
        const tbody = document.querySelector('#tablaVehiculos tbody');
        tbody.innerHTML = '';
        
        if (vehiculos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay vehículos registrados</td></tr>';
            return;
        }
        
        vehiculos.forEach(vehiculo => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${vehiculo.id_vehiculo}</td>
                <td><strong>${vehiculo.placa}</strong></td>
                <td>${vehiculo.marca || 'N/A'}</td>
                <td>${vehiculo.modelo || 'N/A'}</td>
                <td>${vehiculo.color || 'N/A'}</td>
                <td>${vehiculo.propietario}<br><small>${vehiculo.email}</small></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" onclick="editVehiculo(${vehiculo.id_vehiculo})">✏️ Editar</button>
                        <button class="btn-small btn-delete" onclick="deleteVehiculo(${vehiculo.id_vehiculo})">🗑️ Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Error al cargar vehículos:', error);
        showMessage('Error al cargar vehículos', 'error');
    }
}

async function deleteVehiculo(id) {
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/vehiculos/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            loadVehiculos();
            loadStats();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al eliminar vehículo', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// CRUD CAJONES
// ═══════════════════════════════════════════════════════════════

async function loadCajones() {
    try {
        const response = await fetch(`${API_URL}/admin/cajones`);
        cajones = await response.json();
        
        const tbody = document.querySelector('#tablaCajones tbody');
        tbody.innerHTML = '';
        
        cajones.forEach(cajon => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cajon.id_cajon}</td>
                <td><strong>${cajon.numero_cajon}</strong></td>
                <td>${cajon.ubicacion_piso}</td>
                <td>${cajon.tipo}</td>
                <td><span class="status-badge status-${cajon.estado.toLowerCase()}">${cajon.estado}</span></td>
                <td>${cajon.tarifa_descripcion || 'Sin tarifa'}</td>
                <td>$${parseFloat(cajon.costo_por_hora).toFixed(2)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" onclick="editarCajon(${cajon.id_cajon})">✏️ Editar</button>
                        <button class="btn-small btn-status" onclick="cambiarEstadoCajon(${cajon.id_cajon}, '${cajon.estado}')">🔄 Estado</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Error al cargar cajones:', error);
        showMessage('Error al cargar cajones', 'error');
    }
}

function cambiarEstadoCajon(id, estadoActual) {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <h2>Cambiar Estado del Cajón</h2>
                <p>Estado actual: <strong>${estadoActual}</strong></p>
                <form onsubmit="updateEstadoCajon(event, ${id})">
                    <div class="form-group">
                        <label>Nuevo Estado</label>
                        <select id="modalEstado" class="form-control" required>
                            <option value="Disponible">Disponible</option>
                            <option value="Ocupado">Ocupado</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Reservado">Reservado</option>
                        </select>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-success">Actualizar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function editarCajon(id) {
    const cajon = cajones.find(c => c.id_cajon === id);
    
    // Cargar tarifas disponibles
    const tarifasResponse = await fetch(`${API_URL}/admin/tarifas`);
    const tarifasDisponibles = await tarifasResponse.json();
    
    const tarifasOptions = tarifasDisponibles.map(t => 
        `<option value="${t.id_tarifa}" ${t.id_tarifa === cajon.id_tarifa ? 'selected' : ''}>
            ${t.descripcion} - $${parseFloat(t.costo_por_hora).toFixed(2)}/hora
        </option>`
    ).join('');
    
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <h2>Editar Cajón ${cajon.numero_cajon}</h2>
                <form onsubmit="updateCajon(event, ${id})">
                    <div class="form-group">
                        <label>Tipo de Cajón</label>
                        <select id="modalTipo" class="form-control" required>
                            <option value="Normal" ${cajon.tipo === 'Normal' ? 'selected' : ''}>🚗 Normal</option>
                            <option value="Discapacitado" ${cajon.tipo === 'Discapacitado' ? 'selected' : ''}>♿ Discapacitado</option>
                            <option value="Eléctrico" ${cajon.tipo === 'Eléctrico' ? 'selected' : ''}>⚡ Eléctrico</option>
                            <option value="Moto" ${cajon.tipo === 'Moto' ? 'selected' : ''}>🏍️ Moto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tarifa</label>
                        <select id="modalTarifa" class="form-control" required>
                            ${tarifasOptions}
                        </select>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-success">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function updateCajon(event, id) {
    event.preventDefault();
    
    const tipo = document.getElementById('modalTipo').value;
    const id_tarifa = parseInt(document.getElementById('modalTarifa').value);
    
    try {
        const response = await fetch(`${API_URL}/admin/cajones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo, id_tarifa })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Cajón actualizado exitosamente', 'success');
            closeModal();
            loadCajones();
            loadStats();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al actualizar cajón', 'error');
    }
}

async function updateEstadoCajon(event, id) {
    event.preventDefault();
    
    const estado = document.getElementById('modalEstado').value;
    
    try {
        const response = await fetch(`${API_URL}/admin/cajones/${id}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            closeModal();
            loadCajones();
            loadStats();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al actualizar estado', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// CRUD TICKETS
// ═══════════════════════════════════════════════════════════════

async function loadTickets() {
    try {
        const response = await fetch(`${API_URL}/admin/tickets`);
        tickets = await response.json();
        
        const tbody = document.querySelector('#tablaTickets tbody');
        tbody.innerHTML = '';
        
        if (tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No hay tickets registrados</td></tr>';
            return;
        }
        
        tickets.forEach(ticket => {
            const tr = document.createElement('tr');
            const entrada = new Date(ticket.fecha_hora_entrada).toLocaleString();
            const salida = ticket.fecha_hora_salida ? new Date(ticket.fecha_hora_salida).toLocaleString() : 'En curso';
            const monto = ticket.monto_cobrado ? `$${parseFloat(ticket.monto_cobrado).toFixed(2)}` : '-';
            
            tr.innerHTML = `
                <td>${ticket.id_ticket}</td>
                <td><small>${ticket.codigo_acceso}</small></td>
                <td>${ticket.cliente}</td>
                <td><strong>${ticket.placa}</strong></td>
                <td>${ticket.numero_cajon}</td>
                <td><small>${entrada}</small></td>
                <td><small>${salida}</small></td>
                <td>${monto}</td>
                <td><span class="status-badge status-${ticket.estado.toLowerCase()}">${ticket.estado}</span></td>
                <td>
                    <div class="action-buttons">
                        ${ticket.estado === 'ACTIVO' ? 
                            `<button class="btn-small btn-finalize" onclick="finalizarTicket(${ticket.id_ticket})">✅ Finalizar</button>` : 
                            `<button class="btn-small btn-delete" onclick="deleteTicket(${ticket.id_ticket})">🗑️ Eliminar</button>`
                        }
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Error al cargar tickets:', error);
        showMessage('Error al cargar tickets', 'error');
    }
}

function finalizarTicket(id) {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <h2>Finalizar Ticket</h2>
                <p>Ingresa el monto cobrado:</p>
                <form onsubmit="confirmarFinalizarTicket(event, ${id})">
                    <div class="form-group">
                        <label>Monto Total</label>
                        <input type="number" id="modalMonto" step="0.01" min="0" required placeholder="0.00">
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-success">Finalizar Ticket</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function confirmarFinalizarTicket(event, id) {
    event.preventDefault();
    
    const monto_cobrado = parseFloat(document.getElementById('modalMonto').value);
    
    try {
        const response = await fetch(`${API_URL}/admin/tickets/${id}/finalizar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monto_cobrado })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Ticket finalizado exitosamente', 'success');
            closeModal();
            loadTickets();
            loadStats();
            loadCajones();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al finalizar ticket', 'error');
    }
}

async function deleteTicket(id) {
    if (!confirm('¿Estás seguro de eliminar este ticket? El cajón se liberará automáticamente.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/tickets/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            loadTickets();
            loadStats();
            loadCajones();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al eliminar ticket', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// CRUD TARIFAS
// ═══════════════════════════════════════════════════════════════

async function loadTarifas() {
    try {
        const response = await fetch(`${API_URL}/admin/tarifas`);
        tarifas = await response.json();
        
        const tbody = document.querySelector('#tablaTarifas tbody');
        tbody.innerHTML = '';
        
        tarifas.forEach(tarifa => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tarifa.id_tarifa}</td>
                <td><strong>${tarifa.descripcion}</strong></td>
                <td>$${parseFloat(tarifa.costo_por_hora).toFixed(2)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" onclick="editTarifa(${tarifa.id_tarifa})">✏️ Editar</button>
                        <button class="btn-small btn-delete" onclick="deleteTarifa(${tarifa.id_tarifa})">🗑️ Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Error al cargar tarifas:', error);
        showMessage('Error al cargar tarifas', 'error');
    }
}

function showCreateTarifaModal() {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <h2>Crear Tarifa</h2>
                <form onsubmit="createTarifa(event)">
                    <div class="form-group">
                        <label>Descripción</label>
                        <input type="text" id="modalDescripcion" required placeholder="Ej: Tarifa VIP">
                    </div>
                    <div class="form-group">
                        <label>Costo por Hora ($)</label>
                        <input type="number" id="modalCosto" step="0.01" min="0" required placeholder="0.00">
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-success">Crear Tarifa</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function createTarifa(event) {
    event.preventDefault();
    
    const descripcion = document.getElementById('modalDescripcion').value;
    const costo_por_hora = parseFloat(document.getElementById('modalCosto').value);
    
    try {
        const response = await fetch(`${API_URL}/admin/tarifas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion, costo_por_hora })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Tarifa creada exitosamente', 'success');
            closeModal();
            loadTarifas();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al crear tarifa', 'error');
    }
}

function editTarifa(id) {
    const tarifa = tarifas.find(t => t.id_tarifa === id);
    
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <h2>Editar Tarifa</h2>
                <form onsubmit="updateTarifa(event, ${id})">
                    <div class="form-group">
                        <label>Descripción</label>
                        <input type="text" id="modalDescripcion" value="${tarifa.descripcion}" required>
                    </div>
                    <div class="form-group">
                        <label>Costo por Hora ($)</label>
                        <input type="number" id="modalCosto" value="${tarifa.costo_por_hora}" step="0.01" min="0" required>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-success">Actualizar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function updateTarifa(event, id) {
    event.preventDefault();
    
    const descripcion = document.getElementById('modalDescripcion').value;
    const costo_por_hora = parseFloat(document.getElementById('modalCosto').value);
    
    try {
        const response = await fetch(`${API_URL}/admin/tarifas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion, costo_por_hora })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Tarifa actualizada exitosamente', 'success');
            closeModal();
            loadTarifas();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al actualizar tarifa', 'error');
    }
}

async function deleteTarifa(id) {
    if (!confirm('¿Estás seguro de eliminar esta tarifa? No se podrá eliminar si hay cajones usándola.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/tarifas/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            loadTarifas();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al eliminar tarifa', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

function closeModal(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('modalContainer').innerHTML = '';
    }
}

function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    
    setTimeout(() => {
        messageBox.className = 'message-box';
    }, 5000);
}

function logoutAdmin() {
    if (confirm('¿Cerrar sesión de administrador?')) {
        localStorage.removeItem('admin');
        window.location.href = 'admin.html';
    }
}

// Editar usuario y vehículo (funciones básicas)
function editUsuario(id) {
    showMessage('Función de editar usuario - Implementar según necesidades', 'info');
}

function editVehiculo(id) {
    showMessage('Función de editar vehículo - Implementar según necesidades', 'info');
}
