// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

let checkoutData = null;

// Procesar checkout
async function procesarCheckout() {
    const codigoInput = document.getElementById('codigoInput');
    const codigo = codigoInput.value.trim().toUpperCase();

    if (!codigo) {
        showMessage('Por favor ingresa un código de acceso', 'error');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
        const response = await fetch(`${API_URL}/tickets/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ codigo_acceso: codigo })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al procesar salida');
        }

        // Guardar datos para confirmación
        checkoutData = data;

        // Mostrar resumen
        mostrarResumen(data);

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al procesar salida', 'error');
        btn.disabled = false;
        btn.textContent = 'Procesar Salida';
    }
}

// Mostrar resumen de cobro
function mostrarResumen(data) {
    const inputSection = document.getElementById('inputSection');
    const summarySection = document.getElementById('summarySection');
    const summaryContent = document.getElementById('summaryContent');

    const { ticket, cobro } = data;
    const tieneExtra = parseFloat(cobro.monto_extra) > 0;

    let html = `
        <div class="summary-row">
            <span class="summary-label">🎫 Código:</span>
            <span class="summary-value">${ticket.codigo_acceso}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">📍 Cajón:</span>
            <span class="summary-value">${ticket.cajon}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">🚗 Vehículo:</span>
            <span class="summary-value">${ticket.placa}</span>
        </div>
        <hr class="divider">
        <div class="summary-row">
            <span class="summary-label">⏱️ Tiempo pagado:</span>
            <span class="summary-value">${cobro.horas_reservadas} horas</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">⏱️ Tiempo usado:</span>
            <span class="summary-value">${cobro.horas_reales} horas</span>
        </div>
    `;

    if (tieneExtra) {
        const exceso = parseFloat(cobro.exceso);
        const tieneMult = cobro.tiene_multa;

        html += `
            <div class="summary-row extra-charge-row">
                <span class="summary-label">⚠️ Tiempo adicional:</span>
                <span class="summary-value">${cobro.horas_exceso_cobradas} hora(s)</span>
            </div>
        `;
    }

    html += `
        <hr class="divider">
        <div class="summary-row">
            <span class="summary-label">💵 Monto original:</span>
            <span class="summary-value">$${cobro.monto_original}</span>
        </div>
    `;

    if (tieneExtra) {
        html += `
            <div class="summary-row">
                <span class="summary-label">💵 Tiempo adicional:</span>
                <span class="summary-value">$${cobro.monto_exceso}</span>
            </div>
        `;

        if (parseFloat(cobro.multa) > 0) {
            html += `
                <div class="summary-row">
                    <span class="summary-label">⚠️ Cargo por exceso:</span>
                    <span class="summary-value">$${cobro.multa}</span>
                </div>
            `;
        }
    }

    summaryContent.innerHTML = html;
    document.getElementById('totalAmount').textContent = `$${cobro.total}`;

    // Mostrar sección de resumen
    inputSection.style.display = 'none';
    summarySection.classList.add('active');
}

// Confirmar salida
function confirmarSalida() {
    if (!checkoutData) {
        showMessage('Error: No hay datos de checkout', 'error');
        return;
    }

    // Mostrar mensaje de éxito
    showMessage('✅ Salida procesada. ¡Hasta pronto!', 'success');

    // Redirigir al inicio después de 2 segundos
    setTimeout(() => {
        window.location.href = 'inicio.html';
    }, 2000);
}

// Cancelar
function cancelar() {
    document.getElementById('inputSection').style.display = 'block';
    document.getElementById('summarySection').classList.remove('active');
    document.getElementById('codigoInput').value = '';
    checkoutData = null;

    const btn = document.querySelector('.btn-checkout');
    btn.disabled = false;
    btn.textContent = 'Procesar Salida';
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

// Permitir enter para procesar
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('codigoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            procesarCheckout();
        }
    });
});
