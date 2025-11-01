// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

// Variables globales
let usuario = null;
let vehiculos = [];
let cajones = [];
let selectedSpot = null;
let selectedCajon = null;
let selectedVehiculo = null; // Vehículo seleccionado actualmente

// Inicializar la página
window.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay sesión
    const usuarioData = localStorage.getItem('usuario');
    const vehiculosData = localStorage.getItem('vehiculos');
    
    if (!usuarioData) {
        window.location.href = 'index.html';
        return;
    }
    
    usuario = JSON.parse(usuarioData);
    vehiculos = JSON.parse(vehiculosData);
    
    // Mostrar información del usuario
    document.getElementById('userName').textContent = `${usuario.nombre} ${usuario.apellido}`;
    
    // Cargar vehículos del usuario
    loadUserVehicles();
    
    // Cargar cajones
    loadCajones();
    
    // Actualizar estado de cajones cada 10 segundos
    setInterval(() => {
        loadCajones();
    }, 10000); // 10 segundos
});

// Cargar vehículos del usuario - 🔐 CON JWT
async function loadUserVehicles() {
    try {
        const response = await window.authHelper.get(`/usuarios/${usuario.id_usuario}/vehiculos`);
        const data = await response.json();
        
        if (response.ok) {
            vehiculos = data;
            localStorage.setItem('vehiculos', JSON.stringify(vehiculos));
            displayVehicleSelector();
            
            // Seleccionar el primer vehículo por defecto
            if (vehiculos.length > 0) {
                selectedVehiculo = vehiculos[0];
                displayVehicleInfo();
            }
        } else {
            showMessage('Error al cargar vehículos', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión al servidor', 'error');
    }
}

// Mostrar selector de vehículos
function displayVehicleSelector() {
    const selector = document.getElementById('vehicleSelector');
    
    if (vehiculos.length === 0) {
        selector.innerHTML = '<option value="">No tienes vehículos registrados</option>';
        return;
    }
    
    selector.innerHTML = vehiculos.map((v, index) => {
        const tipoIcon = v.tipo === 'MOTOCICLETA' ? '🏍️' : v.tipo === 'ELECTRICO' ? '⚡' : '🚗';
        return `<option value="${index}">${tipoIcon} ${v.placa} - ${v.tipo}</option>`;
    }).join('');
    
    selector.value = '0'; // Seleccionar el primero
}

// Cuando cambia el vehículo seleccionado
function onVehicleChange() {
    const selector = document.getElementById('vehicleSelector');
    const index = parseInt(selector.value);
    
    if (!isNaN(index) && vehiculos[index]) {
        selectedVehiculo = vehiculos[index];
        displayVehicleInfo();
        
        // Recargar cajones para actualizar compatibilidad
        loadCajones();
        
        // Limpiar selección actual si hay
        if (selectedSpot) {
            cancelBooking();
        }
    }
}

// Mostrar información del vehículo
function displayVehicleInfo() {
    const vehicleDetails = document.getElementById('vehicleDetails');
    
    if (!selectedVehiculo) {
        vehicleDetails.innerHTML = '<p>Selecciona un vehículo</p>';
        return;
    }
    
    const vehiculo = selectedVehiculo;
    
    // Icono según tipo de vehículo
    let tipoIcon = '🚗';
    if (vehiculo.tipo === 'MOTOCICLETA') tipoIcon = '🏍️';
    else if (vehiculo.tipo === 'ELECTRICO') tipoIcon = '⚡';
    
    vehicleDetails.innerHTML = `
        <div class="vehicle-detail">
            <span>Tipo:</span>
            <strong>${tipoIcon} ${vehiculo.tipo}</strong>
        </div>
        <div class="vehicle-detail">
            <span>Placa:</span>
            <strong>${vehiculo.placa}</strong>
        </div>
        ${vehiculo.marca ? `
            <div class="vehicle-detail">
                <span>Marca:</span>
                <strong>${vehiculo.marca}</strong>
            </div>
        ` : ''}
        ${vehiculo.modelo ? `
            <div class="vehicle-detail">
                <span>Modelo:</span>
                <strong>${vehiculo.modelo}</strong>
            </div>
        ` : ''}
        ${vehiculo.color ? `
            <div class="vehicle-detail">
                <span>Color:</span>
                <strong>${vehiculo.color}</strong>
            </div>
        ` : ''}
    `;
}

// Cargar cajones del estacionamiento - 🔐 CON JWT
async function loadCajones() {
    try {
        const response = await window.authHelper.get('/cajones');
        const data = await response.json();
        
        if (response.ok) {
            cajones = data;
            displayCajones();
        } else {
            showMessage('Error al cargar los cajones', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión al servidor', 'error');
    }
}

// Mostrar cajones en el mapa
function displayCajones() {
    const pisoA = document.getElementById('pisoA');
    const pisoB = document.getElementById('pisoB');
    
    pisoA.innerHTML = '';
    pisoB.innerHTML = '';
    
    cajones.forEach(cajon => {
        const spotElement = createSpotElement(cajon);
        
        if (cajon.ubicacion_piso === 'Piso A') {
            pisoA.appendChild(spotElement);
        } else if (cajon.ubicacion_piso === 'Piso B') {
            pisoB.appendChild(spotElement);
        }
    });
}

// Crear elemento visual de un cajón
function createSpotElement(cajon) {
    const spot = document.createElement('div');
    
    // Obtener el tipo de vehículo del usuario seleccionado
    const tipoVehiculoUsuario = selectedVehiculo ? selectedVehiculo.tipo : null;
    
    // Verificar si el cajón es compatible con el vehículo del usuario
    const esCompatible = esCajonCompatible(cajon.tipo, tipoVehiculoUsuario);
    
    // Determinar el estado visual del cajón
    let estadoClase = 'available';
    let esSeleccionable = false;
    
    if (cajon.estado === 'Ocupado') {
        estadoClase = 'occupied';
    } else if (cajon.estado === 'Mantenimiento') {
        estadoClase = 'occupied';
    } else if (cajon.estado === 'Disponible') {
        if (esCompatible) {
            estadoClase = 'available';
            esSeleccionable = true;
        } else {
            // Cajón disponible pero NO compatible con el tipo de vehículo
            estadoClase = 'incompatible';
        }
    }
    
    spot.className = `spot ${estadoClase}`;
    spot.dataset.cajonId = cajon.id_cajon;
    spot.dataset.estado = cajon.estado;
    spot.dataset.tipo = cajon.tipo;
    
    // Tipo de cajón (ícono)
    let tipoIcon = '🚗';
    if (cajon.tipo === 'DISCAPACITADO') tipoIcon = '♿';
    else if (cajon.tipo === 'MOTOCICLETA') tipoIcon = '🏍️';
    else if (cajon.tipo === 'ELECTRICO') tipoIcon = '⚡';
    
    spot.innerHTML = `
        <div class="spot-number">${cajon.numero_cajon}</div>
        <div class="spot-type">${tipoIcon} ${cajon.tipo}</div>
    `;
    
    // Solo permitir click si está disponible Y es compatible
    if (esSeleccionable) {
        spot.addEventListener('click', () => selectSpot(cajon, spot));
        spot.style.cursor = 'pointer';
    } else {
        spot.style.cursor = 'not-allowed';
    }
    
    return spot;
}

// Verificar si un cajón es compatible con el tipo de vehículo
function esCajonCompatible(tipoCajon, tipoVehiculo) {
    if (!tipoVehiculo) return false;
    
    // Reglas de compatibilidad:
    // 1. MOTOCICLETA solo en cajones de MOTOCICLETA
    if (tipoVehiculo === 'MOTOCICLETA') {
        return tipoCajon === 'MOTOCICLETA';
    }
    
    // 2. AUTOMOVIL pueden usar cajones: AUTOMOVIL, DISCAPACITADO
    if (tipoVehiculo === 'AUTOMOVIL') {
        return tipoCajon === 'AUTOMOVIL' || tipoCajon === 'DISCAPACITADO';
    }
    
    // 3. ELECTRICO pueden usar cajones: ELECTRICO, AUTOMOVIL, DISCAPACITADO
    if (tipoVehiculo === 'ELECTRICO') {
        return tipoCajon === 'ELECTRICO' || tipoCajon === 'AUTOMOVIL' || tipoCajon === 'DISCAPACITADO';
    }
    
    return false;
}

// Seleccionar un cajón
function selectSpot(cajon, spotElement) {
    // Remover selección anterior
    const previousSelected = document.querySelector('.spot.selected');
    if (previousSelected) {
        previousSelected.classList.remove('selected');
        previousSelected.classList.add('available');
    }
    
    // Agregar nueva selección
    spotElement.classList.remove('available');
    spotElement.classList.add('selected');
    
    selectedSpot = spotElement;
    selectedCajon = cajon;
    
    // Mostrar formulario de reserva
    showBookingForm(cajon);
}

// Mostrar formulario de reserva
function showBookingForm(cajon) {
    const bookingForm = document.getElementById('bookingForm');
    const selectedSpotInfo = document.getElementById('selectedSpotInfo');
    
    selectedSpotInfo.innerHTML = `
        <h4>Cajón Seleccionado: ${cajon.numero_cajon}</h4>
        <p><strong>Ubicación:</strong> ${cajon.ubicacion_piso}</p>
        <p><strong>Tipo:</strong> ${cajon.tipo}</p>
        <p><strong>Tarifa:</strong> ${cajon.tarifa_descripcion}</p>
    `;
    
    // Mostrar costo por hora
    document.getElementById('costPerHour').textContent = `$${parseFloat(cajon.costo_por_hora).toFixed(2)}`;
    
    bookingForm.style.display = 'block';
    
    // Calcular costo inicial
    calculateCost();
}

// Calcular costo estimado
function calculateCost() {
    if (!selectedCajon) return;
    
    const hours = parseInt(document.getElementById('hoursInput').value) || 1;
    const costPerHour = parseFloat(selectedCajon.costo_por_hora);
    const totalCost = hours * costPerHour;
    
    document.getElementById('totalHours').textContent = hours;
    document.getElementById('totalCost').innerHTML = `<strong>$${totalCost.toFixed(2)}</strong>`;
}

// Cancelar reserva
function cancelBooking() {
    if (selectedSpot) {
        selectedSpot.classList.remove('selected');
        selectedSpot.classList.add('available');
    }
    
    selectedSpot = null;
    selectedCajon = null;
    
    document.getElementById('bookingForm').style.display = 'none';
}

// Confirmar reserva y crear ticket
async function confirmBooking() {
    if (!selectedCajon || !selectedVehiculo) {
        showMessage('Debes seleccionar un vehículo y un cajón', 'error');
        return;
    }
    
    const hours = parseInt(document.getElementById('hoursInput').value);
    
    if (hours < 1 || hours > 24) {
        showMessage('Las horas deben estar entre 1 y 24', 'error');
        return;
    }
    
    try {
        const response = await secureRequest(`${API_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_vehiculo: selectedVehiculo.id_vehiculo,
                id_cajon: selectedCajon.id_cajon,
                horas_estimadas: hours
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Mostrar modal de éxito con QR
            showSuccessModal(data.ticket, selectedCajon, hours);
            
            // Actualizar el estado del cajón en el array local
            const cajonIndex = cajones.findIndex(c => c.id_cajon === selectedCajon.id_cajon);
            if (cajonIndex !== -1) {
                cajones[cajonIndex].estado = 'Ocupado';
            }
            
            // Actualizar visualmente el cajón a ocupado
            selectedSpot.classList.remove('selected', 'available');
            selectedSpot.classList.add('occupied');
            selectedSpot.dataset.estado = 'Ocupado';
            
            // Remover el evento click del cajón ocupado
            selectedSpot.style.cursor = 'not-allowed';
            selectedSpot.replaceWith(selectedSpot.cloneNode(true));
            
            // Ocultar formulario
            document.getElementById('bookingForm').style.display = 'none';
            
            selectedSpot = null;
            selectedCajon = null;
        } else {
            showMessage(data.error || 'Error al crear la reserva', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión al servidor', 'error');
    }
}

// Mostrar modal de éxito con QR
function showSuccessModal(ticket, cajon, hours) {
    const modal = document.getElementById('successModal');
    
    // Llenar información
    document.getElementById('successCode').textContent = ticket.codigo_acceso;
    document.getElementById('successSpot').textContent = cajon.numero_cajon + ' - ' + cajon.ubicacion_piso;
    document.getElementById('successVehicle').textContent = selectedVehiculo.placa;
    document.getElementById('successHours').textContent = hours;
    
    // Calcular monto
    const monto = (hours * parseFloat(cajon.costo_por_hora)).toFixed(2);
    document.getElementById('successAmount').textContent = monto;
    
    // Generar QR
    const qrContainer = document.getElementById('successQR');
    qrContainer.innerHTML = ''; // Limpiar QR anterior
    
    new QRCode(qrContainer, {
        text: ticket.codigo_acceso,
        width: 200,
        height: 200,
        colorDark: "#1e40af",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Mostrar modal
    modal.style.display = 'flex';
}

// Cerrar modal y redirigir al inicio
function closeSuccessModal() {
    window.location.href = 'inicio.html';
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('vehiculos');
    window.location.href = 'index.html';
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

// ============================================================================
// FUNCIONES PARA SISTEMA DE RESERVAS
// ============================================================================

// Detectar cambio en tipo de reserva
function onReservationTypeChange() {
    const tipo = document.querySelector('input[name="reservationType"]:checked').value;
    const futureFields = document.getElementById('futureReservationFields');
    const confirmButton = document.getElementById('confirmButton');
    
    if (tipo === 'despues') {
        futureFields.style.display = 'block';
        confirmButton.innerHTML = '📅 Crear Reserva';
        
        // Establecer fecha mínima (1 hora desde ahora)
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const minDateTime = now.toISOString().slice(0, 16);
        document.getElementById('reservationDateTime').min = minDateTime;
        document.getElementById('reservationDateTime').value = minDateTime;
    } else {
        futureFields.style.display = 'none';
        confirmButton.innerHTML = '💳 Pagar y Ocupar Lugar';
    }
}

// Modificar la función confirmBooking para detectar el tipo
const originalConfirmBooking = confirmBooking;

confirmBooking = async function() {
    const tipo = document.querySelector('input[name="reservationType"]:checked').value;
    
    if (tipo === 'ahora') {
        // Crear reserva instantánea (30 min para llegar)
        return crearReservaInstantanea();
    } else {
        // Crear reserva futura (fecha/hora específica)
        return crearReservaFutura();
    }
};

// Crear reserva instantánea (30 minutos para llegar)
async function crearReservaInstantanea() {
    if (!selectedCajon || !selectedVehiculo) {
        showMessage('Debes seleccionar un vehículo y un cajón', 'error');
        return;
    }
    
    const hours = parseInt(document.getElementById('hoursInput').value);
    
    if (hours < 1 || hours > 24) {
        showMessage('Las horas deben estar entre 1 y 24', 'error');
        return;
    }
    
    const duracionMinutos = hours * 60;
    const montoTotal = hours * parseFloat(selectedCajon.costo_por_hora);
    
    try {
        console.log('🔄 Creando reserva instantánea...', {
            id_usuario: usuario.id_usuario,
            id_vehiculo: selectedVehiculo.id_vehiculo,
            id_cajon: selectedCajon.id_cajon,
            duracion_minutos: duracionMinutos,
            monto_total: montoTotal
        });

        const response = await window.authHelper.post('/reservas/instante', {
            id_usuario: usuario.id_usuario,
            id_vehiculo: selectedVehiculo.id_vehiculo,
            id_cajon: selectedCajon.id_cajon,
            duracion_minutos: duracionMinutos,
            monto_total: montoTotal
        });
        
        console.log('📡 Respuesta del servidor:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📦 Data recibida:', data);
        
        if (response.ok) {
            // Mostrar modal de éxito - ahora es una reserva, no un ticket
            showReservaInstantaneaModal(data.reserva, selectedCajon, hours);
            
            // Ocultar formulario
            document.getElementById('bookingForm').style.display = 'none';
            selectedSpot = null;
            selectedCajon = null;
        } else {
            console.error('❌ Error del servidor:', data);
            showMessage(data.error || 'Error al crear la reserva', 'error');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        showMessage('Error de conexión al servidor: ' + error.message, 'error');
    }
}


// Crear reserva futura
async function crearReservaFutura() {
    if (!selectedCajon || !selectedVehiculo) {
        showMessage('Debes seleccionar un vehículo y un cajón', 'error');
        return;
    }
    
    const fechaLlegada = document.getElementById('reservationDateTime').value;
    if (!fechaLlegada) {
        showMessage('Debes seleccionar la fecha y hora de llegada', 'error');
        return;
    }
    
    const hours = parseInt(document.getElementById('hoursInput').value);
    
    if (hours < 1 || hours > 24) {
        showMessage('Las horas deben estar entre 1 y 24', 'error');
        return;
    }
    
    // Calcular ventana de escaneo (3 horas desde la hora seleccionada)
    const fechaInicio = new Date(fechaLlegada);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setHours(fechaFin.getHours() + 3);
    
    const duracionMinutos = hours * 60;
    const montoTotal = hours * parseFloat(selectedCajon.costo_por_hora);
    
    try {
        console.log('🔄 Creando reserva futura...', {
            id_usuario: usuario.id_usuario,
            id_vehiculo: selectedVehiculo.id_vehiculo,
            id_cajon: selectedCajon.id_cajon,
            fecha_inicio: fechaInicio.toISOString(),
            fecha_fin: fechaFin.toISOString(),
            duracion_minutos: duracionMinutos,
            monto_total: montoTotal
        });

        const response = await secureRequest(`${API_URL}/reservas/futura`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_usuario: usuario.id_usuario,
                id_vehiculo: selectedVehiculo.id_vehiculo,
                id_cajon: selectedCajon.id_cajon,
                fecha_inicio: fechaInicio.toISOString(),
                fecha_fin: fechaFin.toISOString(),
                duracion_minutos: duracionMinutos,
                monto_total: montoTotal
            })
        });
        
        console.log('📡 Respuesta del servidor:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📦 Data recibida:', data);
        
        if (response.ok) {
            // Mostrar modal de éxito con información de reserva
            showReservaSuccessModal(data.reserva, selectedCajon, hours, fechaInicio);
            
            // Ocultar formulario
            document.getElementById('bookingForm').style.display = 'none';
            selectedSpot = null;
            selectedCajon = null;
        } else {
            console.error('❌ Error del servidor:', data);
            showMessage(data.error || 'Error al crear la reserva', 'error');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        showMessage('Error de conexión al servidor: ' + error.message, 'error');
    }
}

// Mostrar modal de éxito para reserva futura
function showReservaSuccessModal(reserva, cajon, hours, fechaLlegada) {
    const modal = document.getElementById('successModal');
    
    if (!modal) {
        console.error('❌ Modal no encontrado');
        showMessage('Reserva creada exitosamente. Código: ' + reserva.codigo_acceso, 'success');
        setTimeout(() => window.location.href = 'inicio.html', 2000);
        return;
    }
    
    // Llenar información
    const successCode = document.getElementById('successCode');
    const successSpot = document.getElementById('successSpot');
    const successVehicle = document.getElementById('successVehicle');
    const successHours = document.getElementById('successHours');
    const successAmount = document.getElementById('successAmount');
    const qrContainer = document.getElementById('successQR');
    
    if (successCode) successCode.textContent = reserva.codigo_acceso;
    if (successSpot) successSpot.textContent = cajon.numero_cajon + ' - ' + cajon.ubicacion_piso;
    if (successVehicle) successVehicle.textContent = selectedVehiculo.placa;
    if (successHours) successHours.textContent = hours;
    
    // Convertir monto_total a número antes de usar toFixed
    if (successAmount) {
        const montoTotal = typeof reserva.monto_total === 'string' 
            ? parseFloat(reserva.monto_total) 
            : reserva.monto_total;
        successAmount.textContent = montoTotal.toFixed(2);
    }
    
    // Generar QR
    if (qrContainer) {
        qrContainer.innerHTML = ''; // Limpiar QR anterior
        
        new QRCode(qrContainer, {
            text: reserva.codigo_acceso,
            width: 200,
            height: 200,
            colorDark: "#1e40af",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    
    // Cambiar el título del modal
    const modalTitle = modal.querySelector('h2');
    if (modalTitle) {
        modalTitle.textContent = '📅 ¡Reserva Programada!';
    }
    
    // Agregar información de fecha (buscar el div con background eff6ff)
    const detailsDiv = modal.querySelector('div[style*="eff6ff"]');
    if (detailsDiv && fechaLlegada) {
        const fechaInfo = `<p style="margin: 8px 0; color: #334155;"><strong style="color: #1e40af;">📆 Fecha llegada:</strong> ${fechaLlegada.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</p>`;
        detailsDiv.innerHTML = fechaInfo + detailsDiv.innerHTML;
    }
    
    // Agregar mensaje especial
    const specialMessage = modal.querySelector('p[style*="color: #64748b"]');
    if (specialMessage) {
        specialMessage.textContent = 'Guarda este código. Podrás escanear el QR desde la hora indicada hasta 3 horas después.';
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
}

// Mostrar modal de éxito para reserva instantánea (30 min para llegar)
function showReservaInstantaneaModal(reserva, cajon, hours) {
    const modal = document.getElementById('successModal');
    
    if (!modal) {
        console.error('❌ Modal no encontrado');
        showMessage('Reserva creada exitosamente. Código: ' + reserva.codigo_acceso, 'success');
        setTimeout(() => window.location.href = 'inicio.html', 2000);
        return;
    }
    
    // Llenar información
    const successCode = document.getElementById('successCode');
    const successSpot = document.getElementById('successSpot');
    const successVehicle = document.getElementById('successVehicle');
    const successHours = document.getElementById('successHours');
    const successAmount = document.getElementById('successAmount');
    const qrContainer = document.getElementById('successQR');
    
    if (successCode) successCode.textContent = reserva.codigo_acceso;
    if (successSpot) successSpot.textContent = cajon.numero_cajon + ' - ' + cajon.ubicacion_piso;
    if (successVehicle) successVehicle.textContent = selectedVehiculo.placa;
    if (successHours) successHours.textContent = hours;
    
    // Convertir monto_total a número antes de usar toFixed
    if (successAmount) {
        const montoTotal = typeof reserva.monto_total === 'string' 
            ? parseFloat(reserva.monto_total) 
            : reserva.monto_total;
        successAmount.textContent = montoTotal.toFixed(2);
    }
    
    // Generar QR
    if (qrContainer) {
        qrContainer.innerHTML = ''; // Limpiar QR anterior
        
        new QRCode(qrContainer, {
            text: reserva.codigo_acceso,
            width: 200,
            height: 200,
            colorDark: "#1e40af",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    
    // Cambiar el título del modal
    const modalTitle = modal.querySelector('h2');
    if (modalTitle) {
        modalTitle.textContent = '⚡ ¡Reserva Instantánea!';
    }
    
    // Cambiar el mensaje
    const specialMessage = modal.querySelector('p[style*="color: #64748b"]');
    if (specialMessage) {
        specialMessage.textContent = '⏰ Tienes 30 minutos para llegar y escanear este QR en la entrada del estacionamiento.';
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
}
