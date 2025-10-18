// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

// Variables globales
let usuario = null;
let allTickets = [];
let currentFilter = 'todos';

// Inicializar página
window.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión
    const usuarioData = localStorage.getItem('usuario');
    
    if (!usuarioData) {
        window.location.href = 'index.html';
        return;
    }

    usuario = JSON.parse(usuarioData);
    
    // Cargar tickets
    await cargarTickets();
});

// Cargar tickets del usuario
async function cargarTickets() {
    try {
        const response = await fetch(`${API_URL}/tickets/usuario/${usuario.id_usuario}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar tickets');
        }

        allTickets = await response.json();
        mostrarTickets();
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al cargar los tickets', 'error');
        
        document.getElementById('ticketsList').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Error al cargar tickets</h3>
                <p>Por favor, intenta de nuevo más tarde</p>
            </div>
        `;
    }
}

// Filtrar tickets
function filterTickets(filter) {
    currentFilter = filter;
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    mostrarTickets();
}

// Mostrar tickets filtrados
function mostrarTickets() {
    const container = document.getElementById('ticketsList');
    
    // Filtrar según selección
    let ticketsFiltrados = allTickets;
    
    if (currentFilter !== 'todos') {
        ticketsFiltrados = allTickets.filter(ticket => 
            ticket.estado.toLowerCase() === currentFilter.toLowerCase()
        );
    }

    // Si no hay tickets
    if (ticketsFiltrados.length === 0) {
        const mensaje = currentFilter === 'todos' 
            ? 'No tienes tickets registrados'
            : `No tienes tickets ${currentFilter}s`;
            
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎫</div>
                <h3>${mensaje}</h3>
                <p>Tus tickets aparecerán aquí</p>
            </div>
        `;
        return;
    }

    // Ordenar por fecha (más recientes primero)
    ticketsFiltrados.sort((a, b) => 
        new Date(b.fecha_hora_entrada) - new Date(a.fecha_hora_entrada)
    );

    // Mostrar tickets
    container.innerHTML = ticketsFiltrados.map(ticket => `
        <div class="ticket-card">
            <div class="ticket-header">
                <div class="ticket-code">🎫 ${ticket.codigo_acceso}</div>
                <div class="ticket-status ${ticket.estado.toLowerCase()}">
                    ${ticket.estado}
                </div>
            </div>
            <div class="ticket-info">
                <div class="ticket-info-row">
                    <span class="ticket-info-label">📍 Cajón:</span>
                    <span>${ticket.numero_cajon || 'N/A'}</span>
                </div>
                <div class="ticket-info-row">
                    <span class="ticket-info-label">🚗 Vehículo:</span>
                    <span>${ticket.placa || 'N/A'}</span>
                </div>
                <div class="ticket-info-row">
                    <span class="ticket-info-label">📅 Entrada:</span>
                    <span>${formatearFecha(ticket.fecha_hora_entrada)}</span>
                </div>
                ${ticket.fecha_hora_salida ? `
                    <div class="ticket-info-row">
                        <span class="ticket-info-label">🚪 Salida:</span>
                        <span>${formatearFecha(ticket.fecha_hora_salida)}</span>
                    </div>
                ` : `
                    <div class="ticket-info-row">
                        <span class="ticket-info-label">⏱️ Estado:</span>
                        <span style="color: #10b981; font-weight: bold;">En uso</span>
                    </div>
                `}
            </div>
            ${ticket.monto_cobrado ? `
                <div class="ticket-amount">
                    💵 $${parseFloat(ticket.monto_cobrado).toFixed(2)}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Formatear fecha
function formatearFecha(fechaString) {
    const fecha = new Date(fechaString);
    
    const opciones = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return fecha.toLocaleDateString('es-MX', opciones);
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
