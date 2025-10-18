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
            <div class="qr-container" id="qr-${ticket.id_ticket}">
                <div class="qr-placeholder">Generando QR...</div>
            </div>
        </div>
    `).join('');

    // Generar códigos QR para cada ticket
    setTimeout(() => {
        ticketsFiltrados.forEach(ticket => {
            const qrContainer = document.getElementById(`qr-${ticket.id_ticket}`);
            if (qrContainer) {
                qrContainer.innerHTML = ''; // Limpiar placeholder
                new QRCode(qrContainer, {
                    text: ticket.codigo_acceso,
                    width: 150,
                    height: 150,
                    colorDark: "#1e40af",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                
                // Hacer el QR clickeable para ampliar
                qrContainer.addEventListener('click', () => {
                    mostrarQRGrande(ticket.codigo_acceso);
                });
            }
        });
    }, 100);
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

// Mostrar QR en pantalla completa
function mostrarQRGrande(codigo) {
    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="text-align: center; color: white;">
            <h2 style="margin-bottom: 20px;">Código de Acceso</h2>
            <div id="qr-fullscreen" style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px;"></div>
            <p style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${codigo}</p>
            <p style="color: #94a3b8; margin-bottom: 30px;">Presenta este código al salir</p>
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="background: #1e40af; color: white; border: none; padding: 15px 40px; 
                           border-radius: 10px; font-size: 16px; cursor: pointer; font-weight: bold;">
                Cerrar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Generar QR grande
    setTimeout(() => {
        new QRCode(document.getElementById('qr-fullscreen'), {
            text: codigo,
            width: 280,
            height: 280,
            colorDark: "#1e40af",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }, 100);
    
    // Cerrar al hacer clic fuera del QR
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
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
