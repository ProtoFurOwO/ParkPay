// Configuración de la API
const API_URL = 'https://parkpay-backend-1ti1.onrender.com/api';

// Variables globales
let usuario = null;
let vehiculos = [];
let cajones = [];
let selectedSpot = null;
let selectedCajon = null;

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
    
    // Mostrar información del vehículo
    displayVehicleInfo();
    
    // Cargar cajones
    loadCajones();
    
    // Actualizar estado de cajones cada 10 segundos
    setInterval(() => {
        loadCajones();
    }, 10000); // 10 segundos
});

// Mostrar información del vehículo
function displayVehicleInfo() {
    const vehicleDetails = document.getElementById('vehicleDetails');
    
    if (vehiculos.length > 0) {
        const vehiculo = vehiculos[0];
        
        // Icono según tipo de vehículo
        let tipoIcon = '🚗';
        if (vehiculo.tipo === 'Motocicleta') tipoIcon = '🏍️';
        else if (vehiculo.tipo === 'Eléctrico') tipoIcon = '⚡';
        
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
    } else {
        vehicleDetails.innerHTML = '<p>No tienes vehículos registrados</p>';
    }
}

// Cargar cajones del estacionamiento
async function loadCajones() {
    try {
        const response = await fetch(`${API_URL}/cajones`);
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
    
    // Obtener el tipo de vehículo del usuario
    const tipoVehiculoUsuario = vehiculos.length > 0 ? vehiculos[0].tipo : null;
    
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
    if (cajon.tipo === 'Discapacitado') tipoIcon = '♿';
    else if (cajon.tipo === 'Motocicleta') tipoIcon = '🏍️';
    else if (cajon.tipo === 'Eléctrico') tipoIcon = '⚡';
    
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
    // 1. Motocicletas solo en cajones de Motocicleta
    if (tipoVehiculo === 'Motocicleta') {
        return tipoCajon === 'Motocicleta';
    }
    
    // 2. Automóviles pueden usar cajones: Automóvil, Discapacitado (si aplica)
    if (tipoVehiculo === 'Automóvil') {
        return tipoCajon === 'Automóvil' || tipoCajon === 'Discapacitado';
    }
    
    // 3. Eléctricos pueden usar cajones: Eléctrico, Automóvil, Discapacitado
    if (tipoVehiculo === 'Eléctrico') {
        return tipoCajon === 'Eléctrico' || tipoCajon === 'Automóvil' || tipoCajon === 'Discapacitado';
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
    if (!selectedCajon || vehiculos.length === 0) {
        showMessage('Faltan datos para la reserva', 'error');
        return;
    }
    
    const hours = parseInt(document.getElementById('hoursInput').value);
    
    if (hours < 1 || hours > 24) {
        showMessage('Las horas deben estar entre 1 y 24', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_vehiculo: vehiculos[0].id_vehiculo,
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
    document.getElementById('successVehicle').textContent = vehiculos[0].placa;
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
