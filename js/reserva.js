// API Base URL
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

// Variables globales
let tipoReserva = null;
let horasSeleccionadas = 2;
let cajonSeleccionado = null;
let vehiculoSeleccionado = null;
let vehiculos = [];
let costoHora = 25;

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    await cargarVehiculos(user.id_usuario);
    configurarFechaMinima();
});

// ============================================================================
// CARGAR VEHÍCULOS DEL USUARIO
// ============================================================================

async function cargarVehiculos(idUsuario) {
    try {
        const response = await fetch(`${API_URL}/usuarios/${idUsuario}/vehiculos`);
        vehiculos = await response.json();

        if (vehiculos.length === 0) {
            alert('Necesitas agregar un vehículo primero');
            window.location.href = 'perfil.html';
            return;
        }

        // Llenar selects
        const selectInstante = document.getElementById('vehiculo-instante');
        const selectFutura = document.getElementById('vehiculo-futura');

        const opciones = vehiculos.map(v => 
            `<option value="${v.id_vehiculo}" data-tipo="${v.tipo}">${v.placa} - ${v.marca} ${v.modelo} (${v.tipo})</option>`
        ).join('');

        selectInstante.innerHTML = opciones;
        selectFutura.innerHTML = opciones;

        // Seleccionar el primero por defecto
        vehiculoSeleccionado = vehiculos[0];

    } catch (error) {
        console.error('Error al cargar vehículos:', error);
        alert('Error al cargar tus vehículos');
    }
}

// ============================================================================
// CONFIGURAR FECHA MÍNIMA (HOY + 1 HORA)
// ============================================================================

function configurarFechaMinima() {
    const fechaInput = document.getElementById('fecha-inicio');
    const now = new Date();
    now.setHours(now.getHours() + 1); // Mínimo 1 hora en el futuro
    
    const fecha = now.toISOString().split('T')[0];
    fechaInput.setAttribute('min', fecha);
    fechaInput.value = fecha;

    // Hora actual + 1 hora
    const hora = `${String(now.getHours()).padStart(2, '0')}:00`;
    document.getElementById('hora-inicio').value = hora;
}

// ============================================================================
// PASO 1: SELECCIONAR TIPO DE RESERVA
// ============================================================================

function seleccionarTipo(tipo) {
    tipoReserva = tipo;
    
    document.getElementById('paso-tipo').classList.remove('active');
    
    if (tipo === 'instante') {
        document.getElementById('paso-instante').classList.add('active');
        buscarCajonInstante();
    } else {
        document.getElementById('paso-futura').classList.add('active');
    }
}

function volverATipo() {
    document.querySelectorAll('.step-section').forEach(s => s.classList.remove('active'));
    document.getElementById('paso-tipo').classList.add('active');
    tipoReserva = null;
    cajonSeleccionado = null;
}

// ============================================================================
// RESERVA INSTANTE: BUSCAR CAJÓN DISPONIBLE AHORA
// ============================================================================

async function buscarCajonInstante() {
    const selectVehiculo = document.getElementById('vehiculo-instante');
    const idVehiculo = selectVehiculo.value;
    const tipoVehiculo = selectVehiculo.options[selectVehiculo.selectedIndex].dataset.tipo;

    const cajonDiv = document.getElementById('cajon-instante');
    cajonDiv.innerHTML = '<div class="loading">Buscando cajón disponible...</div>';

    try {
        // Buscar cajones disponibles AHORA hasta AHORA + 30 min
        const now = new Date();
        const fin = new Date(now.getTime() + 30 * 60000); // +30 minutos

        const response = await fetch(
            `${API_URL}/reservas/disponibles?fecha_inicio=${now.toISOString()}&fecha_fin=${fin.toISOString()}&tipo_vehiculo=${tipoVehiculo}`
        );

        const data = await response.json();

        if (data.cajones_disponibles.length === 0) {
            cajonDiv.innerHTML = '<div class="error">⚠️ No hay cajones disponibles en este momento</div>';
            return;
        }

        // Tomar el primer cajón disponible
        const cajon = data.cajones_disponibles[0];
        cajonSeleccionado = cajon;
        costoHora = parseFloat(cajon.costo_por_hora);

        cajonDiv.innerHTML = `
            <div class="cajon-card selected">
                <div class="cajon-numero">${cajon.numero_cajon}</div>
                <div class="cajon-detalles">
                    <p><strong>Piso:</strong> ${cajon.ubicacion_piso}</p>
                    <p><strong>Tipo:</strong> ${cajon.tipo}</p>
                    <p><strong>Tarifa:</strong> $${cajon.costo_por_hora}/hora</p>
                </div>
            </div>
        `;

        actualizarResumenCosto();

    } catch (error) {
        console.error('Error al buscar cajón:', error);
        cajonDiv.innerHTML = '<div class="error">Error al buscar cajón disponible</div>';
    }
}

// ============================================================================
// SELECCIONAR HORAS
// ============================================================================

function seleccionarHoras(horas) {
    horasSeleccionadas = horas;
    
    // Actualizar botones activos
    document.querySelectorAll('.btn-hora').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Limpiar input custom
    document.getElementById('horas-custom').value = '';
    
    actualizarResumenCosto();
}

// Escuchar cambios en input custom
document.addEventListener('DOMContentLoaded', () => {
    const customInput = document.getElementById('horas-custom');
    if (customInput) {
        customInput.addEventListener('input', (e) => {
            const valor = parseInt(e.target.value);
            if (valor > 0 && valor <= 24) {
                horasSeleccionadas = valor;
                document.querySelectorAll('.btn-hora').forEach(btn => btn.classList.remove('active'));
                actualizarResumenCosto();
            }
        });
    }
});

// ============================================================================
// ACTUALIZAR RESUMEN DE COSTO
// ============================================================================

function actualizarResumenCosto() {
    const total = costoHora * horasSeleccionadas;
    
    document.getElementById('resumen-horas').textContent = `${horasSeleccionadas} ${horasSeleccionadas === 1 ? 'hora' : 'horas'}`;
    document.getElementById('resumen-tarifa').textContent = `$${costoHora.toFixed(2)}`;
    document.getElementById('resumen-total').textContent = `$${total.toFixed(2)}`;
}

// ============================================================================
// CONFIRMAR RESERVA INSTANTE
// ============================================================================

async function confirmarReservaInstante() {
    const user = JSON.parse(localStorage.getItem('user'));
    const selectVehiculo = document.getElementById('vehiculo-instante');
    const idVehiculo = selectVehiculo.value;

    if (!cajonSeleccionado) {
        alert('No hay cajón disponible');
        return;
    }

    const duracionMinutos = horasSeleccionadas * 60;
    const montoTotal = costoHora * horasSeleccionadas;

    const data = {
        id_usuario: user.id_usuario,
        id_vehiculo: parseInt(idVehiculo),
        id_cajon: cajonSeleccionado.id_cajon,
        duracion_minutos: duracionMinutos,
        monto_total: montoTotal
    };

    try {
        const response = await fetch(`${API_URL}/reservas/instante`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error al crear reserva');
        }

        mostrarExito(result.reserva, cajonSeleccionado, horasSeleccionadas, montoTotal, true);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear reserva: ' + error.message);
    }
}

// ============================================================================
// RESERVA FUTURA: BUSCAR DISPONIBILIDAD
// ============================================================================

async function buscarDisponibilidad() {
    const selectVehiculo = document.getElementById('vehiculo-futura');
    const tipoVehiculo = selectVehiculo.options[selectVehiculo.selectedIndex].dataset.tipo;
    
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const horaInicio = document.getElementById('hora-inicio').value;
    const duracionEstancia = parseInt(document.getElementById('duracion-futura').value);
    const ventanaEscaneo = parseInt(document.getElementById('ventana-escaneo').value);

    if (!fechaInicio || !horaInicio) {
        alert('Por favor completa fecha y hora de llegada');
        return;
    }

    // Construir fechas
    const inicio = new Date(`${fechaInicio}T${horaInicio}`);
    const fin = new Date(inicio.getTime() + ventanaEscaneo * 3600000); // +ventana horas

    const btnBuscar = document.getElementById('btn-buscar');
    btnBuscar.disabled = true;
    btnBuscar.textContent = 'Buscando...';

    try {
        const response = await fetch(
            `${API_URL}/reservas/disponibles?fecha_inicio=${inicio.toISOString()}&fecha_fin=${fin.toISOString()}&tipo_vehiculo=${tipoVehiculo}`
        );

        const data = await response.json();
        const listaCajones = document.getElementById('lista-cajones');
        const divCajones = document.getElementById('cajones-disponibles');

        if (data.cajones_disponibles.length === 0) {
            listaCajones.innerHTML = '<div class="error">No hay cajones disponibles en ese horario</div>';
            divCajones.style.display = 'block';
            return;
        }

        // Mostrar cajones
        listaCajones.innerHTML = data.cajones_disponibles.map(cajon => `
            <div class="cajon-card" onclick="seleccionarCajonFutura(${JSON.stringify(cajon).replace(/"/g, '&quot;')})">
                <div class="cajon-numero">${cajon.numero_cajon}</div>
                <div class="cajon-detalles">
                    <p><strong>Piso:</strong> ${cajon.ubicacion_piso}</p>
                    <p><strong>Tipo:</strong> ${cajon.tipo}</p>
                    <p><strong>Tarifa:</strong> $${cajon.costo_por_hora}/hora</p>
                </div>
            </div>
        `).join('');

        divCajones.style.display = 'block';

    } catch (error) {
        console.error('Error:', error);
        alert('Error al buscar disponibilidad');
    } finally {
        btnBuscar.disabled = false;
        btnBuscar.textContent = 'Buscar Cajones Disponibles';
    }
}

// ============================================================================
// SELECCIONAR CAJÓN FUTURA
// ============================================================================

function seleccionarCajonFutura(cajon) {
    cajonSeleccionado = cajon;
    costoHora = parseFloat(cajon.costo_por_hora);

    // Marcar como seleccionado
    document.querySelectorAll('.cajon-card').forEach(c => c.classList.remove('selected'));
    event.target.closest('.cajon-card').classList.add('selected');

    // Actualizar resumen
    const duracion = parseInt(document.getElementById('duracion-futura').value);
    const total = costoHora * duracion;

    document.getElementById('resumen-horas-futura').textContent = `${duracion} ${duracion === 1 ? 'hora' : 'horas'}`;
    document.getElementById('resumen-tarifa-futura').textContent = `$${costoHora.toFixed(2)}`;
    document.getElementById('resumen-total-futura').textContent = `$${total.toFixed(2)}`;

    document.getElementById('resumen-futura').style.display = 'block';
    document.getElementById('botones-futura').style.display = 'flex';
}

// ============================================================================
// CONFIRMAR RESERVA FUTURA
// ============================================================================

async function confirmarReservaFutura() {
    const user = JSON.parse(localStorage.getItem('user'));
    const selectVehiculo = document.getElementById('vehiculo-futura');
    const idVehiculo = selectVehiculo.value;

    if (!cajonSeleccionado) {
        alert('Selecciona un cajón primero');
        return;
    }

    const fechaInicio = document.getElementById('fecha-inicio').value;
    const horaInicio = document.getElementById('hora-inicio').value;
    const duracionEstancia = parseInt(document.getElementById('duracion-futura').value);
    const ventanaEscaneo = parseInt(document.getElementById('ventana-escaneo').value);

    // Construir fechas
    const inicio = new Date(`${fechaInicio}T${horaInicio}`);
    const fin = new Date(inicio.getTime() + ventanaEscaneo * 3600000);

    const duracionMinutos = duracionEstancia * 60;
    const montoTotal = costoHora * duracionEstancia;

    const data = {
        id_usuario: user.id_usuario,
        id_vehiculo: parseInt(idVehiculo),
        id_cajon: cajonSeleccionado.id_cajon,
        fecha_inicio: inicio.toISOString(),
        fecha_fin: fin.toISOString(),
        duracion_minutos: duracionMinutos,
        monto_total: montoTotal
    };

    try {
        const response = await fetch(`${API_URL}/reservas/futura`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error al crear reserva');
        }

        mostrarExito(result.reserva, cajonSeleccionado, duracionEstancia, montoTotal, false);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear reserva: ' + error.message);
    }
}

// ============================================================================
// MOSTRAR MODAL DE ÉXITO
// ============================================================================

function mostrarExito(reserva, cajon, horas, total, esInstante) {
    // Generar QR
    document.getElementById('qr-code').innerHTML = '';
    new QRCode(document.getElementById('qr-code'), {
        text: reserva.codigo_acceso,
        width: 200,
        height: 200
    });

    // Llenar información
    document.getElementById('codigo-reserva').textContent = reserva.codigo_acceso;
    document.getElementById('info-cajon').textContent = cajon.numero_cajon;
    document.getElementById('info-duracion').textContent = `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    document.getElementById('info-total').textContent = `$${total.toFixed(2)}`;

    // Mensaje personalizado
    const mensajeDiv = document.getElementById('mensaje-exito');
    if (esInstante) {
        mensajeDiv.innerHTML = `
            <p>⏰ <strong>Tienes 30 minutos para llegar</strong></p>
            <p>Escanea el QR al entrar al estacionamiento</p>
        `;
    } else {
        const fechaInicio = new Date(reserva.fecha_inicio_reserva);
        const opciones = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        mensajeDiv.innerHTML = `
            <p>📅 <strong>Reserva confirmada para:</strong></p>
            <p>${fechaInicio.toLocaleDateString('es-MX', opciones)}</p>
            <p>Podrás escanear el QR al llegar en la ventana de tiempo seleccionada</p>
        `;
    }

    // Mostrar modal
    document.getElementById('modal-exito').classList.add('show');
}

function cerrarModal() {
    document.getElementById('modal-exito').classList.remove('show');
    window.location.href = 'inicio.html';
}
