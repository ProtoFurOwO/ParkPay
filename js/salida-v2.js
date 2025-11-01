// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

let checkoutData = null;
let html5QrcodeScanner = null;
let scannerActive = false;
let tieneExtraSinPagar = false;

// ESCÁNER QR - Función mejorada basada en entrada.html
function toggleScanner() {
    const readerDiv = document.getElementById('reader');
    const btnToggle = document.getElementById('btnToggleScanner');
    
    if (!scannerActive) {
        try {
            console.log('📸 Iniciando escáner QR...');
            
            // Mostrar el div del reader
            readerDiv.style.display = 'block';
            btnToggle.textContent = '🛑 Detener Escáner';
            btnToggle.style.background = '#ef4444';
            
            // Crear e inicializar el escáner
            html5QrcodeScanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: 250 },
                false // verbose = false
            );
            
            html5QrcodeScanner.render(onScanSuccess, onScanError);
            scannerActive = true;
            console.log('✅ Escáner QR iniciado correctamente');
            
        } catch (error) {
            console.error('❌ Error al iniciar escáner:', error);
            showMessage('Error al iniciar el escáner. Verifica los permisos de cámara.', 'error');
            readerDiv.style.display = 'none';
            btnToggle.textContent = '📸 Activar Escáner QR';
            btnToggle.style.background = '#6366f1';
        }
    } else {
        // Detener escáner
        try {
            console.log('🛑 Deteniendo escáner...');
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear().then(() => {
                    console.log('✅ Escáner detenido');
                }).catch(err => {
                    console.error('Error al detener:', err);
                });
            }
            readerDiv.style.display = 'none';
            btnToggle.textContent = '📸 Activar Escáner QR';
            btnToggle.style.background = '#6366f1';
            scannerActive = false;
        } catch (error) {
            console.error('❌ Error al detener escáner:', error);
        }
    }
}

function onScanSuccess(decodedText, decodedResult) {
    console.log(`✅ Código escaneado exitosamente: ${decodedText}`);
    
    // Detener el escáner
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }
    
    const readerDiv = document.getElementById('reader');
    const btnToggle = document.getElementById('btnToggleScanner');
    
    readerDiv.style.display = 'none';
    btnToggle.textContent = '📸 Activar Escáner QR';
    btnToggle.style.background = '#6366f1';
    scannerActive = false;
    
    // Poner el código en el input
    document.getElementById('codigoInput').value = decodedText;
    
    // Procesar automáticamente
    procesarCheckout();
}

function onScanError(errorMessage) {
    // Ignorar errores de escaneo continuo (no hacer nada)
}

// Procesar checkout
async function procesarCheckout() {
    const codigoInput = document.getElementById('codigoInput');
    const codigo = codigoInput.value.trim().toUpperCase();

    if (!codigo) {
        showMessage('Por favor ingresa un código de acceso', 'error');
        return;
    }

    const btn = document.querySelector('#inputSection .btn-checkout');
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
    const montoExtra = parseFloat(cobro.monto_extra || 0);
    const tieneExtra = montoExtra > 0;

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
            <span class="summary-value">${cobro.horas_reservadas || cobro.horas_estadia || 0} horas</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">⏱️ Tiempo usado:</span>
            <span class="summary-value">${cobro.horas_reales || cobro.horas_estadia || 0} horas</span>
        </div>
    `;

    if (tieneExtra) {
        html += `
            <div class="summary-row extra-charge-row">
                <span class="summary-label">⚠️ Tiempo adicional:</span>
                <span class="summary-value">${cobro.horas_exceso || 0} hora(s)</span>
            </div>
        `;
    }

    html += `
        <hr class="divider">
        <div class="summary-row">
            <span class="summary-label">💵 Monto original:</span>
            <span class="summary-value">$${cobro.monto_original || cobro.total_pagar || 0}</span>
        </div>
    `;

    if (tieneExtra) {
        html += `
            <div class="summary-row">
                <span class="summary-label">💵 Tiempo adicional:</span>
                <span class="summary-value">$${montoExtra.toFixed(2)}</span>
            </div>
        `;

        if (parseFloat(cobro.multa || 0) > 0) {
            html += `
                <div class="summary-row">
                    <span class="summary-label">⚠️ Cargo por exceso:</span>
                    <span class="summary-value">$${cobro.multa}</span>
                </div>
            `;
        }
    }

    summaryContent.innerHTML = html;
    document.getElementById('totalAmount').textContent = `$${cobro.total || cobro.total_pagar || 0}`;

    // Mostrar/Ocultar botón de pago si hay tiempo extra SIN PAGAR
    if (tieneExtra) {
        document.getElementById('paymentSection').style.display = 'block';
        document.getElementById('btnConfirmar').disabled = true;
        document.getElementById('btnConfirmar').style.background = '#94a3b8';
        tieneExtraSinPagar = true;
    } else {
        document.getElementById('paymentSection').style.display = 'none';
        document.getElementById('btnConfirmar').disabled = false;
        document.getElementById('btnConfirmar').style.background = '';
        tieneExtraSinPagar = false;
    }

    // Mostrar sección de resumen
    inputSection.style.display = 'none';
    summarySection.classList.add('active');
}

// PAGAR TIEMPO EXTRA
async function pagarTiempoExtra() {
    if (!checkoutData) {
        showMessage('Error: No hay datos de checkout', 'error');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Procesando pago...';

    try {
        // Simular pago (aquí conectarías con tu sistema de pagos real)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Marcar como pagado
        tieneExtraSinPagar = false;
        
        // Habilitar botón de confirmar
        document.getElementById('btnConfirmar').disabled = false;
        document.getElementById('btnConfirmar').style.background = '';
        
        // Ocultar sección de pago
        document.getElementById('paymentSection').style.display = 'none';

        showMessage('✅ Pago procesado exitosamente', 'success');

        // TODO: Aquí deberías actualizar el ticket en el backend para marcar el pago extra
        // await fetch(`${API_URL}/tickets/pagar-extra`, { ... });

    } catch (error) {
        console.error('Error al pagar:', error);
        showMessage('Error al procesar el pago', 'error');
        btn.disabled = false;
        btn.textContent = '💳 Pagar Tiempo Extra';
    }
}

// Confirmar salida
async function confirmarSalida() {
    if (!checkoutData) {
        showMessage('Error: No hay datos de checkout', 'error');
        return;
    }

    if (tieneExtraSinPagar) {
        showMessage('Debe pagar el tiempo extra antes de salir', 'error');
        return;
    }

    const btn = document.getElementById('btnConfirmar');
    btn.disabled = true;
    btn.textContent = 'Finalizando...';

    try {
        // Finalizar ticket en el backend
        const response = await fetch(`${API_URL}/tickets/finalizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                codigo_acceso: checkoutData.ticket.codigo_acceso 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al finalizar ticket');
        }

        // Mostrar mensaje de éxito
        showMessage('✅ Salida procesada. ¡Hasta pronto!', 'success');

        // Redirigir al inicio después de 2 segundos
        setTimeout(() => {
            window.location.href = 'inicio.html';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al confirmar salida', 'error');
        btn.disabled = false;
        btn.textContent = 'Confirmar y Salir';
    }
}

// Cancelar
function cancelar() {
    document.getElementById('inputSection').style.display = 'block';
    document.getElementById('summarySection').classList.remove('active');
    document.getElementById('codigoInput').value = '';
    checkoutData = null;
    tieneExtraSinPagar = false;

    const btn = document.querySelector('#inputSection .btn-checkout');
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
    console.log('🚀 Inicializando página de salida...');
    
    // Event listener para el campo de código
    document.getElementById('codigoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            procesarCheckout();
        }
    });
    
    // 📸 Event listener para el botón del escáner QR
    const btnToggleScanner = document.getElementById('btnToggleScanner');
    if (btnToggleScanner) {
        btnToggleScanner.addEventListener('click', toggleScanner);
        console.log('✅ Event listener del escáner QR configurado');
    }
    
    // 🔍 Event listener para el botón "Procesar Salida"
    const btnProcesarSalida = document.getElementById('btnProcesarSalida');
    if (btnProcesarSalida) {
        btnProcesarSalida.addEventListener('click', procesarCheckout);
        console.log('✅ Event listener del botón "Procesar Salida" configurado');
    }
    
    // 💳 Event listener para el botón "Pagar Tiempo Extra"
    const btnPagarExtra = document.getElementById('btnPagarExtra');
    if (btnPagarExtra) {
        btnPagarExtra.addEventListener('click', pagarTiempoExtra);
        console.log('✅ Event listener del botón "Pagar Tiempo Extra" configurado');
    }
    
    // ✅ Event listener para el botón "Confirmar y Salir"
    const btnConfirmar = document.getElementById('btnConfirmar');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarSalida);
        console.log('✅ Event listener del botón "Confirmar y Salir" configurado');
    }
    
    // ❌ Event listener para el botón "Cancelar"
    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelar);
        console.log('✅ Event listener del botón "Cancelar" configurado');
    }
    
    console.log('🎉 Todos los event listeners configurados correctamente');
});
