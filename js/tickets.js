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

// Cargar tickets del usuario - 🔐 CON JWT
async function cargarTickets() {
    try {
        const response = await window.authHelper.get(`/tickets/usuario/${usuario.id_usuario}`);
        
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
    container.innerHTML = ticketsFiltrados.map(ticket => {
        const minutosRestantes = ticket.minutos_restantes ? Math.floor(ticket.minutos_restantes) : null;
        const mostrarExtender = ticket.estado === 'ACTIVO' && minutosRestantes !== null && minutosRestantes <= 20 && minutosRestantes > 0;

        return `
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
                ` : minutosRestantes !== null ? `
                    <div class="ticket-info-row">
                        <span class="ticket-info-label">⏱️ Tiempo restante:</span>
                        <span style="color: ${minutosRestantes <= 10 ? '#ef4444' : '#10b981'}; font-weight: bold;">
                            ${minutosRestantes} minutos
                        </span>
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
            ${mostrarExtender ? `
                <div style="margin: 15px 0; padding: 15px; background: #fef3c7; border-radius: 10px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #78350f;">
                        ¿Necesitas más tiempo?
                    </p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                        <button onclick="extenderTiempo(${ticket.id_ticket}, 15, ${ticket.costo_por_hora})" 
                                style="background: #10b981; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            +15min<br>$${(15/60 * ticket.costo_por_hora).toFixed(2)}
                        </button>
                        <button onclick="extenderTiempo(${ticket.id_ticket}, 30, ${ticket.costo_por_hora})" 
                                style="background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            +30min<br>$${(30/60 * ticket.costo_por_hora).toFixed(2)}
                        </button>
                        <button onclick="extenderTiempo(${ticket.id_ticket}, 60, ${ticket.costo_por_hora})" 
                                style="background: #1e40af; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            +1h<br>$${parseFloat(ticket.costo_por_hora).toFixed(2)}
                        </button>
                    </div>
                </div>
            ` : ''}
            ${ticket.estado === 'ACTIVO' ? `
                <div style="margin: 15px 0;">
                    <button onclick="verificarTiempoExtra('${ticket.codigo_acceso}')" 
                            class="btn-tiempo-extra"
                            style="background: #f59e0b; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; width: 100%; transition: all 0.3s ease;">
                        💳 Pagar Tiempo Extra
                    </button>
                </div>
            ` : ''}
            <div class="qr-container" id="qr-${ticket.id_ticket}">
                <div class="qr-placeholder">Generando QR...</div>
            </div>
        </div>
        `;
    }).join('');

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

// Extender tiempo de un ticket
async function extenderTiempo(idTicket, minutos, costoPorHora) {
    const costo = (minutos / 60) * costoPorHora;
    
    if (!confirm(`¿Agregar ${minutos} minutos por $${costo.toFixed(2)}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tickets/${idTicket}/extender`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ minutos_adicionales: minutos })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al extender tiempo');
        }

        showMessage(`✅ Tiempo extendido: +${minutos} min ($${data.costo_adicional})`, 'success');
        
        // Recargar tickets
        setTimeout(() => {
            cargarTickets();
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al extender tiempo', 'error');
    }
}

// 💳 Verificar y mostrar tiempo extra para pagar
async function verificarTiempoExtra(codigoAcceso) {
    try {
        showMessage('Calculando tiempo extra...', 'info');

        const response = await fetch(`${API_URL}/tickets/calcular-extra/${codigoAcceso}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al calcular tiempo extra');
        }

        const data = await response.json();
        
        if (!data.tiempo_extra.tiene_exceso) {
            showMessage('No hay tiempo extra que pagar en este momento', 'info');
            return;
        }

        // Mostrar modal de confirmación de pago
        mostrarModalPagoExtra(data);

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al verificar tiempo extra', 'error');
    }
}

// 🎫 Mostrar modal de pago de tiempo extra
function mostrarModalPagoExtra(data) {
    const { ticket, tiempo_extra } = data;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); display: flex; align-items: center; 
        justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div style="background: var(--dark-bg, #1e293b); border-radius: 15px; padding: 25px; max-width: 400px; width: 100%; color: var(--light-text, white);">
            <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: var(--warning-color, #f59e0b); font-size: 20px;">⚠️ Tiempo Extra</h3>
                <p style="margin: 5px 0 0 0; color: var(--gray-text, #94a3b8); font-size: 14px;">Ticket: ${ticket.codigo_acceso}</p>
            </div>
            
            <div style="background: var(--darker-bg, #0f172a); border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Tiempo reservado:</span>
                    <span style="font-weight: bold;">${ticket.horas_reservadas} horas</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Tiempo usado:</span>
                    <span style="font-weight: bold; color: var(--warning-color, #f59e0b);">${ticket.horas_reales} horas</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-top: 8px; border-top: 1px solid var(--border-color, #334155);">
                    <span>Tiempo extra:</span>
                    <span style="font-weight: bold; color: var(--danger-color, #ef4444);">${tiempo_extra.horas_exceso} horas</span>
                </div>
                
                <div style="background: rgba(239,68,68,0.1); border: 1px solid var(--danger-color, #ef4444); border-radius: 8px; padding: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Tiempo adicional:</span>
                        <span style="font-weight: bold;">$${tiempo_extra.monto_extra}</span>
                    </div>
                    ${tiempo_extra.multa > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Multa (50%):</span>
                            <span style="font-weight: bold;">$${tiempo_extra.multa}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; padding-top: 8px; border-top: 1px solid var(--danger-color, #ef4444);">
                        <span>TOTAL A PAGAR:</span>
                        <span style="color: var(--danger-color, #ef4444);">$${tiempo_extra.total_extra}</span>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="this.closest('.modal-overlay').remove()" 
                        style="flex: 1; background: var(--border-color, #334155); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer;">
                    Cancelar
                </button>
                <button onclick="pagarTiempoExtraAhora('${ticket.codigo_acceso}', ${tiempo_extra.total_extra})" 
                        style="flex: 1; background: var(--success-color, #10b981); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    💳 Pagar Ahora
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Cerrar modal al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 💰 Procesar pago de tiempo extra
async function pagarTiempoExtraAhora(codigoAcceso, montoTotal) {
    try {
        // Cerrar modal
        document.querySelector('.modal-overlay')?.remove();
        
        showMessage('Procesando pago...', 'info');

        const response = await fetch(`${API_URL}/tickets/pagar-extra`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                codigo_acceso: codigoAcceso,
                monto_pagado: montoTotal
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al procesar pago');
        }

        const resultado = await response.json();
        showMessage('✅ Pago procesado exitosamente. Ahora puede salir directamente.', 'success');
        
        // Recargar tickets para mostrar estado actualizado
        setTimeout(() => {
            cargarTickets();
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al procesar pago', 'error');
    }
}
