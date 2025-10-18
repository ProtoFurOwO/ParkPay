# 📐 Documentación UML - Sistema ParkPay
## Diagramas de Componentes y Modelo de Capas

---

## 📦 1. DIAGRAMA DE COMPONENTES UML

### Vista General del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SISTEMA PARKPAY                                 │
│                     (Gestión de Estacionamiento)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌────────────────┐         ┌─────────────────┐
│   FRONTEND    │          │    BACKEND     │         │  BASE DE DATOS  │
│  (Capa Vista) │◄────────►│ (Capa Lógica)  │◄───────►│  (PostgreSQL)   │
└───────────────┘   HTTP   └────────────────┘   SQL   └─────────────────┘
```

---

### Diagrama Detallado de Componentes

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CAPA DE PRESENTACIÓN                              │
│                           (FRONTEND - HTML/CSS/JS)                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐        │
│  │  index.html     │  │  estacionami-   │  │   admin.html     │        │
│  │  ┌───────────┐  │  │  ento.html      │  │  ┌────────────┐  │        │
│  │  │Login/     │  │  │  ┌───────────┐  │  │  │Panel Admin │  │        │
│  │  │Registro   │  │  │  │Selección  │  │  │  │CRUD        │  │        │
│  │  │de Usuario │  │  │  │de Cajones │  │  │  │Completo    │  │        │
│  │  └───────────┘  │  │  └───────────┘  │  │  └────────────┘  │        │
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘        │
│           │                    │                     │                   │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼─────────┐        │
│  │  auth.js        │  │  parking.js     │  │ admin-panel.js   │        │
│  │ ┌────────────┐  │  │ ┌────────────┐  │  │ ┌──────────────┐ │        │
│  │ │Validación  │  │  │ │Renderizado │  │  │ │Gestión CRUD  │ │        │
│  │ │Formularios │  │  │ │de Cajones  │  │  │ │Cajones/      │ │        │
│  │ │API Calls   │  │  │ │Cálculo     │  │  │ │Tarifas/      │ │        │
│  │ └────────────┘  │  │ │Tarifas     │  │  │ │Tickets       │ │        │
│  └────────┬────────┘  │ └────────────┘  │  │ └──────────────┘ │        │
│           │           └────────┬────────┘  └────────┬─────────┘        │
│           │                    │                     │                   │
│  ┌────────▼──────────────────────────────────────────▼─────────┐        │
│  │                     styles.css                               │        │
│  │  ┌───────────────────────────────────────────────────────┐  │        │
│  │  │ Estilos Globales | Componentes | Responsive Design   │  │        │
│  │  └───────────────────────────────────────────────────────┘  │        │
│  └──────────────────────────────────────────────────────────────┘        │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                │ HTTP/REST API
                                │
┌───────────────────────────────▼──────────────────────────────────────────┐
│                         CAPA DE APLICACIÓN                                │
│                          (BACKEND - Node.js/Express)                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                      server.js                               │        │
│  │  ┌───────────────────────────────────────────────────────┐   │        │
│  │  │ • Configuración Express                               │   │        │
│  │  │ • Middleware (CORS, Body Parser)                      │   │        │
│  │  │ • Enrutamiento Principal                              │   │        │
│  │  │ • Servidor HTTP en Puerto 3000                        │   │        │
│  │  └───────────────────────────────────────────────────────┘   │        │
│  └────────────────────────┬─────────────────────────────────────┘        │
│                           │                                               │
│           ┌───────────────┼───────────────┬────────────────┐             │
│           │               │               │                │             │
│  ┌────────▼─────┐ ┌───────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐      │
│  │ routes/      │ │ routes/      │ │ routes/    │ │ routes/     │      │
│  │ auth.js      │ │ cajones.js   │ │ tickets.js │ │ admin.js    │      │
│  ├──────────────┤ ├──────────────┤ ├────────────┤ ├─────────────┤      │
│  │POST /login   │ │GET /cajones  │ │POST /crear │ │POST /login  │      │
│  │POST /register│ │GET /         │ │POST /pagar │ │GET /stats   │      │
│  │              │ │disponibles   │ │            │ │GET /usuarios│      │
│  │              │ │              │ │            │ │GET /cajones │      │
│  │              │ │              │ │            │ │GET /tickets │      │
│  │              │ │              │ │            │ │GET /tarifas │      │
│  │              │ │              │ │            │ │PUT /cajones │      │
│  │              │ │              │ │            │ │DELETE /...  │      │
│  └──────┬───────┘ └──────┬───────┘ └─────┬──────┘ └──────┬──────┘      │
│         │                │               │                │             │
│         └────────────────┼───────────────┼────────────────┘             │
│                          │               │                              │
│                  ┌───────▼───────────────▼───────┐                      │
│                  │   config/database.js          │                      │
│                  │  ┌─────────────────────────┐  │                      │
│                  │  │ Pool de Conexiones      │  │                      │
│                  │  │ Configuración PostgreSQL│  │                      │
│                  │  │ Variables de Entorno    │  │                      │
│                  │  └─────────────────────────┘  │                      │
│                  └───────────────┬───────────────┘                      │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
                                   │ SQL Queries
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                         CAPA DE DATOS                                    │
│                      (PostgreSQL Database)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐          │
│  │   Usuarios     │  │   Vehiculos    │  │ CajonesEsta-    │          │
│  │                │  │                │  │ cionamiento     │          │
│  │ • id_usuario   │  │ • id_vehiculo  │  │                 │          │
│  │ • nombre       │  │ • id_usuario FK│  │ • id_cajon      │          │
│  │ • apellido     │  │ • placa        │  │ • numero_cajon  │          │
│  │ • email        │  │ • marca        │  │ • ubicacion_piso│          │
│  │ • password_hash│  │ • modelo       │  │ • tipo          │          │
│  │ • es_admin     │  │ • color        │  │ • estado        │          │
│  └────────┬───────┘  └────────┬───────┘  │ • id_tarifa FK  │          │
│           │ 1                 │ 1        └────────┬────────┘          │
│           │                   │                   │ N                  │
│           │                   │                   │                    │
│           │         N         │         N         │                    │
│           └───────────────────┼───────────────────┘                    │
│                               │                                        │
│                       ┌───────▼────────┐                               │
│                       │ TicketsEstancia│                               │
│                       │                │                               │
│                       │ • id_ticket    │                               │
│                       │ • id_usuario FK│                               │
│                       │ • id_vehiculo FK                               │
│                       │ • id_cajon FK  │                               │
│                       │ • codigo_acceso│                               │
│                       │ • fecha_entrada│                               │
│                       │ • fecha_salida │                               │
│                       │ • monto_total  │                               │
│                       │ • estado       │                               │
│                       └────────────────┘                               │
│                                                                         │
│  ┌────────────────┐                                                    │
│  │    Tarifas     │─────────────────────┐                             │
│  │                │                     │ 1                            │
│  │ • id_tarifa    │                     │                              │
│  │ • descripcion  │                     └──► CajonesEstacionamiento    │
│  │ • costo_por_hora                          (Relación N:1)            │
│  └────────────────┘                                                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │              CONSTRAINTS & INDICES                       │          │
│  │  • PRIMARY KEYS en todas las tablas                      │          │
│  │  • FOREIGN KEYS con ON DELETE CASCADE                    │          │
│  │  • UNIQUE en email (Usuarios), placa (Vehiculos)         │          │
│  │  • CHECK en tipos ENUM (tipo_cajon, estado_cajon, etc.)  │          │
│  │  • INDICES en columnas de búsqueda frecuente             │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 2. MODELO DE CAPAS (ARQUITECTURA N-TIER)

### 2.1 Capa de Presentación (Frontend)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RESPONSABILIDADES:                                              │
│  • Interfaz gráfica de usuario (UI/UX)                          │
│  • Validación de formularios del lado del cliente               │
│  • Renderizado dinámico de componentes                          │
│  • Manejo de eventos del usuario                                │
│  • Comunicación con Backend vía AJAX/Fetch                      │
│                                                                  │
│  COMPONENTES:                                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. MÓDULO DE AUTENTICACIÓN (index.html + auth.js)       │   │
│  │    • Formulario de Login                                 │   │
│  │    • Formulario de Registro de Usuario                   │   │
│  │    • Validación de campos (email, contraseña)            │   │
│  │    • Almacenamiento de sesión (localStorage)             │   │
│  │    • Redirección según rol (usuario/admin)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 2. MÓDULO DE ESTACIONAMIENTO (estacionamiento.html +     │   │
│  │                                parking.js)               │   │
│  │    • Renderizado de cajones (2 pisos, 15 c/u)            │   │
│  │    • Sistema de colores:                                 │   │
│  │      - Verde: Disponible                                 │   │
│  │      - Rojo: Ocupado                                     │   │
│  │      - Azul: Seleccionado                                │   │
│  │    • Cálculo de tarifa en tiempo real                    │   │
│  │    • Confirmación de pago                                │   │
│  │    • Generación de código de acceso                      │   │
│  │    • Auto-actualización cada 10 segundos                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 3. MÓDULO ADMINISTRATIVO (admin.html +                   │   │
│  │                            admin-panel.js)               │   │
│  │    • Dashboard con estadísticas en tiempo real           │   │
│  │    • Panel de gestión de Usuarios                        │   │
│  │    • Panel de gestión de Vehículos                       │   │
│  │    • Panel de gestión de Cajones (cambio estado/tarifa)  │   │
│  │    • Panel de gestión de Tickets (finalizar/eliminar)    │   │
│  │    • Panel de gestión de Tarifas (CRUD completo)         │   │
│  │    • Modales para operaciones CRUD                       │   │
│  │    • Notificaciones tipo toast                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 4. MÓDULO DE ESTILOS (css/styles.css)                    │   │
│  │    • Diseño responsivo (mobile-first)                    │   │
│  │    • Tema oscuro/moderno                                 │   │
│  │    • Animaciones y transiciones                          │   │
│  │    • Componentes reutilizables (botones, modales, etc.)  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TECNOLOGÍAS:                                                    │
│  • HTML5 (estructura semántica)                                 │
│  • CSS3 (Flexbox, Grid, Variables CSS)                          │
│  • JavaScript ES6+ (async/await, modules)                       │
│  • Fetch API (comunicación HTTP)                                │
│  • LocalStorage (persistencia de sesión)                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP REST API
                             │ (JSON)
                             ▼
```

---

### 2.2 Capa de Lógica de Negocio (Backend)

```
┌─────────────────────────────────────────────────────────────────┐
│                 CAPA DE LÓGICA DE NEGOCIO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RESPONSABILIDADES:                                              │
│  • Procesamiento de solicitudes HTTP                            │
│  • Validación de datos del lado del servidor                    │
│  • Lógica de negocio (reglas, cálculos)                         │
│  • Autenticación y autorización                                 │
│  • Gestión de transacciones                                     │
│  • Comunicación con la base de datos                            │
│                                                                  │
│  COMPONENTES:                                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. SERVIDOR PRINCIPAL (server.js)                        │   │
│  │    • Configuración de Express                            │   │
│  │    • Middleware CORS (permitir peticiones frontend)      │   │
│  │    • Body Parser (procesar JSON)                         │   │
│  │    • Enrutamiento a módulos específicos                  │   │
│  │    • Manejo de errores global                            │   │
│  │    • Inicialización del servidor (puerto 3000)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 2. MÓDULO DE AUTENTICACIÓN (routes/auth.js)              │   │
│  │                                                           │   │
│  │    ENDPOINTS:                                             │   │
│  │    POST /api/auth/register                               │   │
│  │      • Validar datos (nombre, email, contraseña, placa)  │   │
│  │      • Verificar email único                             │   │
│  │      • Hashear contraseña (bcrypt)                       │   │
│  │      • Crear usuario en BD                               │   │
│  │      • Crear vehículo asociado                           │   │
│  │                                                           │   │
│  │    POST /api/auth/login                                  │   │
│  │      • Buscar usuario por email                          │   │
│  │      • Verificar contraseña hasheada                     │   │
│  │      • Retornar datos de usuario + vehículos             │   │
│  │                                                           │   │
│  │    REGLAS DE NEGOCIO:                                     │   │
│  │    • Email debe ser único                                │   │
│  │    • Contraseña mínimo 6 caracteres                      │   │
│  │    • Hash con bcrypt (10 rounds)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 3. MÓDULO DE CAJONES (routes/cajones.js)                 │   │
│  │                                                           │   │
│  │    ENDPOINTS:                                             │   │
│  │    GET /api/cajones                                      │   │
│  │      • Retornar TODOS los cajones con tarifa             │   │
│  │      • JOIN con tabla Tarifas                            │   │
│  │      • Ordenar por piso y número                         │   │
│  │                                                           │   │
│  │    GET /api/cajones/disponibles                          │   │
│  │      • Filtrar solo cajones en estado 'Disponible'       │   │
│  │      • Excluir cajones en mantenimiento/reservados       │   │
│  │                                                           │   │
│  │    REGLAS DE NEGOCIO:                                     │   │
│  │    • Solo mostrar cajones disponibles a usuarios         │   │
│  │    • Incluir información de tarifa asociada              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 4. MÓDULO DE TICKETS (routes/tickets.js)                 │   │
│  │                                                           │   │
│  │    ENDPOINTS:                                             │   │
│  │    POST /api/tickets/crear                               │   │
│  │      • Verificar cajón disponible                        │   │
│  │      • Generar código de acceso único (6 dígitos)        │   │
│  │      • Crear ticket en BD                                │   │
│  │      • Retornar código de acceso                         │   │
│  │                                                           │   │
│  │    POST /api/tickets/pagar                               │   │
│  │      • TRANSACCIÓN (BEGIN...COMMIT)                      │   │
│  │      • Validar datos (cajón, horas, vehículo)            │   │
│  │      • Calcular monto total (horas * tarifa)             │   │
│  │      • Crear ticket con estado 'ACTIVO'                  │   │
│  │      • Cambiar cajón a 'Ocupado'                         │   │
│  │      • Si falla, ROLLBACK completo                       │   │
│  │                                                           │   │
│  │    REGLAS DE NEGOCIO:                                     │   │
│  │    • Un cajón solo puede tener 1 ticket activo           │   │
│  │    • Código de acceso único por ticket                   │   │
│  │    • Monto = horas_estimadas * costo_por_hora            │   │
│  │    • Al crear ticket, cajón pasa a 'Ocupado'             │   │
│  │    • Transacción atómica (todo o nada)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 5. MÓDULO ADMINISTRATIVO (routes/admin.js)               │   │
│  │                                                           │   │
│  │    AUTENTICACIÓN:                                         │   │
│  │    GET /api/admin/check-admin                            │   │
│  │    POST /api/admin/register (solo si no hay admin)       │   │
│  │    POST /api/admin/login                                 │   │
│  │                                                           │   │
│  │    ESTADÍSTICAS:                                          │   │
│  │    GET /api/admin/stats                                  │   │
│  │      • Total usuarios (sin admins)                       │   │
│  │      • Total vehículos registrados                       │   │
│  │      • Cajones ocupados actualmente                      │   │
│  │      • Tickets activos                                   │   │
│  │      • Total recaudado (tickets finalizados)             │   │
│  │                                                           │   │
│  │    CRUD USUARIOS:                                         │   │
│  │    GET /api/admin/usuarios                               │   │
│  │    POST /api/admin/usuarios                              │   │
│  │    DELETE /api/admin/usuarios/:id                        │   │
│  │                                                           │   │
│  │    CRUD VEHÍCULOS:                                        │   │
│  │    GET /api/admin/vehiculos                              │   │
│  │    DELETE /api/admin/vehiculos/:id                       │   │
│  │                                                           │   │
│  │    CRUD CAJONES:                                          │   │
│  │    GET /api/admin/cajones                                │   │
│  │    PATCH /api/admin/cajones/:id/estado                   │   │
│  │    PUT /api/admin/cajones/:id (editar tipo y tarifa)     │   │
│  │                                                           │   │
│  │    CRUD TICKETS:                                          │   │
│  │    GET /api/admin/tickets                                │   │
│  │    PATCH /api/admin/tickets/:id/finalizar                │   │
│  │    DELETE /api/admin/tickets/:id                         │   │
│  │                                                           │   │
│  │    CRUD TARIFAS:                                          │   │
│  │    GET /api/admin/tarifas                                │   │
│  │    POST /api/admin/tarifas                               │   │
│  │    PUT /api/admin/tarifas/:id                            │   │
│  │    DELETE /api/admin/tarifas/:id (si no está en uso)     │   │
│  │                                                           │   │
│  │    REGLAS DE NEGOCIO:                                     │   │
│  │    • Solo 1 administrador puede registrarse              │   │
│  │    • Admin es usuario con es_admin = TRUE                │   │
│  │    • No se puede eliminar tarifa en uso                  │   │
│  │    • Al finalizar ticket, liberar cajón automáticamente  │   │
│  │    • Al eliminar ticket activo, liberar cajón            │   │
│  │    • Protección contra eliminación de admin              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 6. MÓDULO DE BASE DE DATOS (config/database.js)          │   │
│  │    • Pool de conexiones PostgreSQL                       │   │
│  │    • Configuración desde .env                            │   │
│  │    • Manejo de errores de conexión                       │   │
│  │    • Reutilización de conexiones                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TECNOLOGÍAS:                                                    │
│  • Node.js v18+ (runtime JavaScript)                            │
│  • Express.js v4 (framework web)                                │
│  • bcryptjs (hashing de contraseñas)                            │
│  • pg (cliente PostgreSQL)                                      │
│  • dotenv (variables de entorno)                                │
│  • cors (permitir peticiones cross-origin)                      │
│                                                                  │
│  PATRONES DE DISEÑO:                                             │
│  • MVC (Model-View-Controller modificado)                       │
│  • Repository Pattern (acceso a datos)                          │
│  • Transaction Script (lógica de negocio en endpoints)          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                             │
                             │ SQL Queries
                             │ (Transacciones)
                             ▼
```

---

### 2.3 Capa de Datos (Database)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE DATOS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RESPONSABILIDADES:                                              │
│  • Persistencia de datos                                        │
│  • Integridad referencial                                       │
│  • Optimización de consultas                                    │
│  • Respaldo y recuperación                                      │
│  • Control de concurrencia                                      │
│                                                                  │
│  ENTIDADES Y RELACIONES:                                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TABLA: Usuarios                                          │   │
│  │                                                           │   │
│  │ COLUMNAS:                                                 │   │
│  │  • id_usuario (SERIAL PRIMARY KEY)                       │   │
│  │  • nombre (VARCHAR(50) NOT NULL)                         │   │
│  │  • apellido (VARCHAR(50) NOT NULL)                       │   │
│  │  • email (VARCHAR(100) UNIQUE NOT NULL)                  │   │
│  │  • password_hash (VARCHAR(255) NOT NULL)                 │   │
│  │  • telefono (VARCHAR(15))                                │   │
│  │  • es_admin (BOOLEAN DEFAULT FALSE)                      │   │
│  │  • fecha_registro (TIMESTAMP DEFAULT NOW())              │   │
│  │                                                           │   │
│  │ INDICES:                                                  │   │
│  │  • idx_usuario_email ON (email)                          │   │
│  │  • idx_usuario_admin ON (es_admin)                       │   │
│  │                                                           │   │
│  │ CONSTRAINTS:                                              │   │
│  │  • UNIQUE (email)                                        │   │
│  │  • CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+')  │   │
│  │                                                           │   │
│  │ RELACIONES:                                               │   │
│  │  • 1:N con Vehiculos                                     │   │
│  │  • 1:N con TicketsEstancia                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TABLA: Vehiculos                                         │   │
│  │                                                           │   │
│  │ COLUMNAS:                                                 │   │
│  │  • id_vehiculo (SERIAL PRIMARY KEY)                      │   │
│  │  • id_usuario (INTEGER FOREIGN KEY → Usuarios)           │   │
│  │  • placa (VARCHAR(20) UNIQUE NOT NULL)                   │   │
│  │  • marca (VARCHAR(50) NOT NULL)                          │   │
│  │  • modelo (VARCHAR(50) NOT NULL)                         │   │
│  │  • color (VARCHAR(30) NOT NULL)                          │   │
│  │                                                           │   │
│  │ INDICES:                                                  │   │
│  │  • idx_vehiculo_usuario ON (id_usuario)                  │   │
│  │  • idx_vehiculo_placa ON (placa)                         │   │
│  │                                                           │   │
│  │ CONSTRAINTS:                                              │   │
│  │  • UNIQUE (placa)                                        │   │
│  │  • FOREIGN KEY (id_usuario)                              │   │
│  │    REFERENCES Usuarios(id_usuario)                       │   │
│  │    ON DELETE CASCADE                                     │   │
│  │                                                           │   │
│  │ RELACIONES:                                               │   │
│  │  • N:1 con Usuarios                                      │   │
│  │  • 1:N con TicketsEstancia                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TABLA: Tarifas                                           │   │
│  │                                                           │   │
│  │ COLUMNAS:                                                 │   │
│  │  • id_tarifa (SERIAL PRIMARY KEY)                        │   │
│  │  • descripcion (VARCHAR(100))                            │   │
│  │  • costo_por_hora (DECIMAL(10,2) NOT NULL)               │   │
│  │                                                           │   │
│  │ CONSTRAINTS:                                              │   │
│  │  • CHECK (costo_por_hora >= 0)                           │   │
│  │                                                           │   │
│  │ RELACIONES:                                               │   │
│  │  • 1:N con CajonesEstacionamiento                        │   │
│  │                                                           │   │
│  │ VENTAJA DE NORMALIZACIÓN:                                 │   │
│  │  ✅ Cambiar una tarifa actualiza todos los cajones       │   │
│  │  ✅ Sin redundancia de precios                           │   │
│  │  ✅ Histórico de tarifas posible                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TABLA: CajonesEstacionamiento                            │   │
│  │                                                           │   │
│  │ COLUMNAS:                                                 │   │
│  │  • id_cajon (SERIAL PRIMARY KEY)                         │   │
│  │  • numero_cajon (VARCHAR(10) UNIQUE NOT NULL)            │   │
│  │  • ubicacion_piso (VARCHAR(5) NOT NULL)                  │   │
│  │  • tipo (tipo_cajon ENUM)                                │   │
│  │    - 'Normal', 'Discapacitado', 'Eléctrico', 'Moto'      │   │
│  │  • estado (estado_cajon ENUM)                            │   │
│  │    - 'Disponible', 'Ocupado', 'Mantenimiento',           │   │
│  │      'Reservado'                                         │   │
│  │  • id_tarifa (INTEGER FOREIGN KEY → Tarifas)             │   │
│  │                                                           │   │
│  │ INDICES:                                                  │   │
│  │  • idx_cajon_numero ON (numero_cajon)                    │   │
│  │  • idx_cajon_estado ON (estado)                          │   │
│  │  • idx_cajon_piso ON (ubicacion_piso)                    │   │
│  │  • idx_cajon_tarifa ON (id_tarifa)                       │   │
│  │                                                           │   │
│  │ CONSTRAINTS:                                              │   │
│  │  • UNIQUE (numero_cajon)                                 │   │
│  │  • FOREIGN KEY (id_tarifa)                               │   │
│  │    REFERENCES Tarifas(id_tarifa)                         │   │
│  │    ON DELETE RESTRICT                                    │   │
│  │                                                           │   │
│  │ RELACIONES:                                               │   │
│  │  • N:1 con Tarifas                                       │   │
│  │  • 1:N con TicketsEstancia                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TABLA: TicketsEstancia                                   │   │
│  │                                                           │   │
│  │ COLUMNAS:                                                 │   │
│  │  • id_ticket (SERIAL PRIMARY KEY)                        │   │
│  │  • codigo_acceso (VARCHAR(10) UNIQUE NOT NULL)           │   │
│  │  • id_usuario (INTEGER FOREIGN KEY → Usuarios)           │   │
│  │  • id_vehiculo (INTEGER FOREIGN KEY → Vehiculos)         │   │
│  │  • id_cajon (INTEGER FOREIGN KEY → Cajones)              │   │
│  │  • fecha_hora_entrada (TIMESTAMP DEFAULT NOW())          │   │
│  │  • fecha_hora_salida (TIMESTAMP)                         │   │
│  │  • horas_estimadas (INTEGER)                             │   │
│  │  • monto_total (DECIMAL(10,2))                           │   │
│  │  • monto_cobrado (DECIMAL(10,2))                         │   │
│  │  • estado (estado_ticket ENUM)                           │   │
│  │    - 'ACTIVO', 'FINALIZADO', 'PAGADO'                    │   │
│  │                                                           │   │
│  │ INDICES:                                                  │   │
│  │  • idx_ticket_usuario ON (id_usuario)                    │   │
│  │  • idx_ticket_cajon ON (id_cajon)                        │   │
│  │  • idx_ticket_estado ON (estado)                         │   │
│  │  • idx_ticket_fecha ON (fecha_hora_entrada)              │   │
│  │                                                           │   │
│  │ CONSTRAINTS:                                              │   │
│  │  • UNIQUE (codigo_acceso)                                │   │
│  │  • FOREIGN KEY (id_usuario, id_vehiculo, id_cajon)       │   │
│  │    ON DELETE CASCADE                                     │   │
│  │  • CHECK (monto_total >= 0)                              │   │
│  │                                                           │   │
│  │ TRIGGERS:                                                 │   │
│  │  • after_insert_ticket → Cambiar cajón a 'Ocupado'       │   │
│  │  • after_update_ticket → Liberar cajón si finalizado     │   │
│  │                                                           │   │
│  │ RELACIONES:                                               │   │
│  │  • N:1 con Usuarios                                      │   │
│  │  • N:1 con Vehiculos                                     │   │
│  │  • N:1 con CajonesEstacionamiento                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TECNOLOGÍAS:                                                    │
│  • PostgreSQL 14+                                               │
│  • Encoding: UTF-8                                              │
│  • Timezone: America/Mexico_City                                │
│                                                                  │
│  CARACTERÍSTICAS AVANZADAS:                                      │
│  • ACID Transactions (Atomicidad, Consistencia, Aislamiento,   │
│    Durabilidad)                                                 │
│  • Foreign Keys con ON DELETE CASCADE/RESTRICT                  │
│  • ENUM Types (tipo_cajon, estado_cajon, estado_ticket)        │
│  • Indices para optimización de consultas                      │
│  • Constraints para integridad de datos                        │
│  • Triggers automáticos (opcional)                             │
│                                                                  │
│  NORMALIZACIÓN:                                                  │
│  ✅ 1NF: Valores atómicos en todas las columnas                 │
│  ✅ 2NF: Sin dependencias parciales                             │
│  ✅ 3NF: Tarifas separadas (sin dependencias transitivas)       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 3. FLUJO DE DATOS ENTRE CAPAS

### 3.1 Flujo de Registro de Usuario

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUJO: REGISTRO DE USUARIO                     │
└──────────────────────────────────────────────────────────────────┘

[USUARIO] Llena formulario de registro
    ↓
[CAPA PRESENTACIÓN - index.html + auth.js]
    ↓
    1. Validar campos en frontend
       • Email formato válido
       • Contraseña mínimo 6 caracteres
       • Todos los campos requeridos
    ↓
    2. Enviar petición HTTP POST
       Endpoint: http://localhost:3000/api/auth/register
       Body: {
         nombre: "Juan",
         apellido: "Pérez",
         email: "juan@example.com",
         password: "123456",
         telefono: "1234567890",
         placa: "ABC-123",
         marca: "Toyota",
         modelo: "Corolla",
         color: "Blanco"
       }
    ↓
[CAPA LÓGICA - backend/routes/auth.js]
    ↓
    3. Validar datos en backend
       • Verificar campos requeridos
       • Validar formato de email
       • Verificar longitud de contraseña
    ↓
    4. Hashear contraseña
       password_hash = bcrypt.hash("123456", 10)
       → "$2a$10$N9qo8uLOickgx2ZMRZoMye..."
    ↓
[CAPA DATOS - PostgreSQL]
    ↓
    5. Iniciar transacción
       BEGIN;
    ↓
    6. Verificar email único
       SELECT COUNT(*) FROM Usuarios WHERE email = 'juan@example.com'
       → Si existe: ROLLBACK + error "Email ya existe"
    ↓
    7. Insertar usuario
       INSERT INTO Usuarios (nombre, apellido, email, password_hash, telefono)
       VALUES ('Juan', 'Pérez', 'juan@example.com', '$2a$10$...', '1234567890')
       RETURNING id_usuario;
       → id_usuario = 5
    ↓
    8. Insertar vehículo
       INSERT INTO Vehiculos (id_usuario, placa, marca, modelo, color)
       VALUES (5, 'ABC-123', 'Toyota', 'Corolla', 'Blanco')
       RETURNING id_vehiculo;
       → id_vehiculo = 8
    ↓
    9. Confirmar transacción
       COMMIT;
    ↓
[CAPA LÓGICA - Respuesta]
    ↓
    10. Retornar JSON exitoso
        {
          "message": "Usuario registrado exitosamente",
          "usuario": {
            "id_usuario": 5,
            "nombre": "Juan",
            "apellido": "Pérez",
            "email": "juan@example.com"
          },
          "vehiculo": {
            "id_vehiculo": 8,
            "placa": "ABC-123"
          }
        }
    ↓
[CAPA PRESENTACIÓN - Respuesta]
    ↓
    11. Guardar en localStorage
        localStorage.setItem('usuario', JSON.stringify(usuario))
    ↓
    12. Redirigir a estacionamiento.html
        window.location.href = 'estacionamiento.html'
    ↓
[USUARIO] Ve el mapa de cajones disponibles
```

---

### 3.2 Flujo de Pago y Ocupación de Cajón

```
┌──────────────────────────────────────────────────────────────────┐
│                FLUJO: PAGO Y OCUPACIÓN DE CAJÓN                   │
└──────────────────────────────────────────────────────────────────┘

[USUARIO] Selecciona cajón A-05 verde (disponible)
    ↓
[CAPA PRESENTACIÓN - estacionamiento.html + parking.js]
    ↓
    1. Pintar cajón de azul (seleccionado)
    ↓
    2. Usuario ingresa 3 horas
    ↓
    3. Calcular costo en tiempo real
       costo = 3 horas × $25.00 = $75.00
       Mostrar: "Costo Total: $75.00"
    ↓
    4. Usuario hace click en "Pagar y Ocupar"
    ↓
    5. Confirmar con el usuario
       confirm("¿Deseas ocupar el cajón A-05 por 3 horas ($75.00)?")
    ↓
    6. Enviar petición HTTP POST
       Endpoint: http://localhost:3000/api/tickets/pagar
       Body: {
         id_cajon: 5,
         id_usuario: 5,
         id_vehiculo: 8,
         horas_estimadas: 3,
         monto_total: 75.00
       }
    ↓
[CAPA LÓGICA - backend/routes/tickets.js]
    ↓
    7. Validar datos
       • id_cajon existe
       • id_usuario existe
       • id_vehiculo pertenece al usuario
       • horas_estimadas > 0
    ↓
[CAPA DATOS - PostgreSQL - TRANSACCIÓN CRÍTICA]
    ↓
    8. Iniciar transacción
       BEGIN;
    ↓
    9. Verificar cajón disponible (LOCK)
       SELECT estado FROM CajonesEstacionamiento
       WHERE id_cajon = 5 FOR UPDATE;
       
       → Si estado != 'Disponible':
         ROLLBACK + error "Cajón no disponible"
    ↓
    10. Generar código de acceso único
        código = Math.random().toString().substring(2, 8)
        → "473829"
    ↓
    11. Crear ticket
        INSERT INTO TicketsEstancia (
          codigo_acceso, id_usuario, id_vehiculo, id_cajon,
          fecha_hora_entrada, horas_estimadas, monto_total, estado
        )
        VALUES (
          '473829', 5, 8, 5,
          CURRENT_TIMESTAMP, 3, 75.00, 'ACTIVO'
        )
        RETURNING id_ticket;
        → id_ticket = 12
    ↓
    12. Marcar cajón como ocupado
        UPDATE CajonesEstacionamiento
        SET estado = 'Ocupado'
        WHERE id_cajon = 5;
    ↓
    13. Confirmar transacción
        COMMIT;
    ↓
[CAPA LÓGICA - Respuesta]
    ↓
    14. Retornar JSON exitoso
        {
          "success": true,
          "message": "Cajón ocupado exitosamente",
          "codigo_acceso": "473829",
          "ticket": {
            "id_ticket": 12,
            "cajón": "A-05",
            "horas": 3,
            "monto": 75.00
          }
        }
    ↓
[CAPA PRESENTACIÓN - Respuesta]
    ↓
    15. Mostrar modal de éxito
        "¡Pago exitoso!"
        "Tu código de acceso es: 473829"
        "Guarda este código para salir del estacionamiento"
    ↓
    16. Actualizar vista de cajones
        • Cambiar cajón A-05 a rojo (ocupado)
        • Recargar cajones desde backend
    ↓
[USUARIO] Ve el cajón A-05 ahora en rojo (ocupado)
         Guarda código 473829 para salir
```

---

### 3.3 Flujo de Edición de Cajón (Admin)

```
┌──────────────────────────────────────────────────────────────────┐
│              FLUJO: ADMIN CAMBIA TARIFA DE CAJÓN                  │
└──────────────────────────────────────────────────────────────────┘

[ADMIN] Inicia sesión en admin.html
    ↓
[CAPA PRESENTACIÓN - admin.html + admin-panel.js]
    ↓
    1. Cargar panel de cajones
       GET /api/admin/cajones
    ↓
    2. Mostrar tabla con todos los cajones
       ┌──────┬──────┬─────────┬────────────┬───────────┐
       │ Cajón│ Piso │  Tipo   │   Estado   │  Tarifa   │
       ├──────┼──────┼─────────┼────────────┼───────────┤
       │ A-05 │  A   │ Normal  │ Disponible │ $25/hora  │
       │ ...  │  ... │   ...   │    ...     │   ...     │
       └──────┴──────┴─────────┴────────────┴───────────┘
    ↓
    3. Admin hace click en "✏️ Editar" del cajón A-05
    ↓
    4. Abrir modal de edición
       • Cargar tarifas disponibles
         GET /api/admin/tarifas
         → [
             { id: 1, descripcion: "Normal", costo: 25.00 },
             { id: 2, descripcion: "Premium", costo: 50.00 }
           ]
       • Mostrar selector de tipo (Normal, Eléctrico, etc.)
       • Mostrar selector de tarifa (preseleccionado: Tarifa Normal)
    ↓
    5. Admin selecciona:
       • Tipo: "Eléctrico"
       • Tarifa: "Premium ($50.00/hora)"
    ↓
    6. Admin hace click en "Guardar Cambios"
    ↓
    7. Enviar petición HTTP PUT
       Endpoint: http://localhost:3000/api/admin/cajones/5
       Body: {
         tipo: "Eléctrico",
         id_tarifa: 2
       }
    ↓
[CAPA LÓGICA - backend/routes/admin.js]
    ↓
    8. Validar datos
       • tipo debe ser: Normal, Discapacitado, Eléctrico, o Moto
       • id_tarifa debe existir
    ↓
[CAPA DATOS - PostgreSQL]
    ↓
    9. Verificar que tarifa existe
       SELECT id_tarifa FROM Tarifas WHERE id_tarifa = 2;
       → Si no existe: error "Tarifa no encontrada"
    ↓
    10. Actualizar cajón
        UPDATE CajonesEstacionamiento
        SET tipo = 'Eléctrico', id_tarifa = 2
        WHERE id_cajon = 5
        RETURNING *;
        
        → Resultado:
        {
          id_cajon: 5,
          numero_cajon: 'A-05',
          tipo: 'Eléctrico',      ← CAMBIADO
          estado: 'Disponible',
          id_tarifa: 2             ← CAMBIADO
        }
    ↓
[CAPA LÓGICA - Respuesta]
    ↓
    11. Retornar JSON exitoso
        {
          "message": "Cajón actualizado exitosamente",
          "cajon": { ... }
        }
    ↓
[CAPA PRESENTACIÓN - Respuesta]
    ↓
    12. Cerrar modal
    ↓
    13. Mostrar notificación toast
        "✅ Cajón A-05 actualizado exitosamente"
    ↓
    14. Recargar tabla de cajones
        GET /api/admin/cajones
        
        Nueva tabla:
        ┌──────┬──────┬───────────┬────────────┬───────────┐
        │ Cajón│ Piso │   Tipo    │   Estado   │  Tarifa   │
        ├──────┼──────┼───────────┼────────────┼───────────┤
        │ A-05 │  A   │ Eléctrico │ Disponible │ $50/hora  │← ACTUALIZADO
        │ ...  │  ... │    ...    │    ...     │   ...     │
        └──────┴──────┴───────────┴────────────┴───────────┘
    ↓
[ADMIN] Ve el cajón A-05 actualizado
        Ahora tipo "Eléctrico" con tarifa $50/hora
        
DEMOSTRACIÓN DE NORMALIZACIÓN:
✅ El cajón NO guarda "$50" directamente
✅ Guarda id_tarifa = 2 (referencia a tabla Tarifas)
✅ Si después cambias la Tarifa Premium a $60:
   → El cajón A-05 automáticamente costará $60/hora
   → Sin necesidad de actualizar el cajón
```

---

## 🎯 4. VENTAJAS DEL MODELO DE CAPAS

```
┌──────────────────────────────────────────────────────────────┐
│           VENTAJAS DE LA ARQUITECTURA N-TIER                 │
└──────────────────────────────────────────────────────────────┘

1. ✅ SEPARACIÓN DE RESPONSABILIDADES
   ┌────────────────┬──────────────────────────────────────┐
   │ Capa           │ Responsabilidad                      │
   ├────────────────┼──────────────────────────────────────┤
   │ Presentación   │ UI/UX, validación cliente            │
   │ Lógica Negocio │ Reglas, cálculos, autenticación      │
   │ Datos          │ Persistencia, integridad             │
   └────────────────┴──────────────────────────────────────┘

2. ✅ MANTENIBILIDAD
   • Cambiar frontend NO afecta backend
   • Cambiar BD NO afecta frontend
   • Bugs aislados por capa

3. ✅ ESCALABILIDAD
   • Frontend en servidor web (Apache/Nginx)
   • Backend en servidor Node.js (puede replicarse)
   • BD en servidor PostgreSQL (puede clusterizarse)

4. ✅ REUTILIZACIÓN
   • API REST puede usarse desde:
     - Aplicación web
     - Aplicación móvil
     - Aplicación de escritorio
   • Misma lógica de negocio para todos

5. ✅ SEGURIDAD
   • Validación doble (cliente + servidor)
   • Contraseñas hasheadas en backend
   • SQL injection prevenido (prepared statements)
   • XSS prevenido (sanitización)

6. ✅ TESTING
   • Frontend: tests de UI (Selenium, Cypress)
   • Backend: tests unitarios (Jest, Mocha)
   • BD: tests de integridad (SQL scripts)
```

---

## 📝 5. PARA TU PRESENTACIÓN

### Puntos clave a mencionar:

```
┌──────────────────────────────────────────────────────────────┐
│           GUÍA PARA PRESENTACIÓN AL PROFESOR                 │
└──────────────────────────────────────────────────────────────┘

1️⃣ "Utilizamos una Arquitectura de 3 Capas (N-Tier)"
   • Capa de Presentación (HTML/CSS/JS)
   • Capa de Lógica de Negocio (Node.js/Express)
   • Capa de Datos (PostgreSQL)
   
   [Mostrar diagrama ASCII del documento]

2️⃣ "La base de datos está en Tercera Forma Normal (3NF)"
   • Mostrar tabla Tarifas separada de Cajones
   • Explicar: "Un cajón NO guarda el precio, guarda una
     referencia (id_tarifa). Si cambio el precio de una
     tarifa, TODOS los cajones que la usan se actualizan
     automáticamente"
   
   [Mostrar en pgAdmin: cambiar una tarifa y que afecte
    múltiples cajones]

3️⃣ "Implementamos CRUD completo en todas las entidades"
   
   Usuarios:
   ✅ Create: Registro desde panel admin
   ✅ Read: Lista de usuarios
   ✅ Update: (no implementado, pero se puede agregar)
   ✅ Delete: Eliminar usuario (cascade a vehículos)
   
   Cajones:
   ✅ Create: init_db.sql (ya existen 30)
   ✅ Read: Vista de cajones con tarifas
   ✅ Update: Cambiar tipo, estado, tarifa
   ✅ Delete: (no recomendado, pero se puede)
   
   Tarifas:
   ✅ Create: Crear nueva tarifa
   ✅ Read: Listar tarifas con # de cajones
   ✅ Update: Editar descripción y costo
   ✅ Delete: Solo si no está en uso (integridad)
   
   Tickets:
   ✅ Create: Usuario paga y ocupa cajón
   ✅ Read: Historial completo
   ✅ Update: Finalizar ticket (libera cajón)
   ✅ Delete: Eliminar ticket (libera cajón)
   
   [Demostrar cada operación en el panel admin]

4️⃣ "Usamos Transacciones ACID para garantizar consistencia"
   
   Ejemplo: Pagar y ocupar cajón
   • Si falla crear ticket → cajón NO se ocupa
   • Si falla ocupar cajón → ticket NO se crea
   • TODO o NADA (atomicidad)
   
   [Mostrar código de transacción en tickets.js]

5️⃣ "Implementamos Integridad Referencial"
   
   • No puedes crear ticket para cajón inexistente
   • No puedes eliminar tarifa que está en uso
   • Si eliminas usuario, sus vehículos se eliminan (CASCADE)
   • Si eliminas ticket activo, cajón se libera automáticamente
   
   [Intentar eliminar una tarifa en uso y mostrar el error]

6️⃣ "API REST siguiendo estándares HTTP"
   
   • GET: Obtener datos
   • POST: Crear nuevos recursos
   • PUT/PATCH: Actualizar recursos
   • DELETE: Eliminar recursos
   
   Códigos de respuesta:
   • 200: Éxito
   • 201: Creado
   • 400: Error de cliente
   • 404: No encontrado
   • 500: Error de servidor
   
   [Mostrar Postman o DevTools con peticiones]

7️⃣ "Seguridad implementada"
   
   • Contraseñas hasheadas con bcrypt (10 rounds)
   • Prepared statements (previene SQL injection)
   • Validación doble (cliente + servidor)
   • CORS configurado
   
   [Mostrar contraseña en BD: hash vs texto plano]

DEMOSTRACIÓN EN VIVO:
1. Login como usuario → seleccionar cajón → pagar
2. Ver en pgAdmin que el cajón cambió a "Ocupado"
3. Login como admin → finalizar ticket
4. Ver en pgAdmin que el cajón volvió a "Disponible"
5. Admin crea nueva tarifa → asigna a cajón
6. Intentar eliminar tarifa en uso → error
```

---

**¡Éxito en tu presentación! // filepath: c:\Users\alarf\OneDrive\Documentos\Quinto Semestre\Quinto Semestre Codes\PP\DOCUMENTACION_UML.md
# 📐 Documentación UML - Sistema ParkPay
## Diagramas de Componentes y Modelo de Capas

---

## 📦 1. DIAGRAMA DE COMPONENTES UML

### Vista General del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SISTEMA PARKPAY                                 │
│                     (Gestión de Estacionamiento)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌────────────────┐         ┌─────────────────┐
│   FRONTEND    │          │    BACKEND     │         │  BASE DE DATOS  │
│  (Capa Vista) │◄────────►│ (Capa Lógica)  │◄───────►│  (PostgreSQL)   │
└───────────────┘   HTTP   └────────────────┘   SQL   └─────────────────┘
```

---

### Diagrama Detallado de Componentes

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CAPA DE PRESENTACIÓN                              │
│                           (FRONTEND - HTML/CSS/JS)                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐        │
│  │  index.html     │  │  estacionami-   │  │   admin.html     │        │
│  │  ┌───────────┐  │  │  ento.html      │  │  ┌────────────┐  │        │
│  │  │Login/     │  │  │  ┌───────────┐  │  │  │Panel Admin │  │        │
│  │  │Registro   │  │  │  │Selección  │  │  │  │CRUD        │  │        │
│  │  │de Usuario │  │  │  │de Cajones │  │  │  │Completo    │  │        │
│  │  └───────────┘  │  │  └───────────┘  │  │  └────────────┘  │        │
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘        │
│           │                    │                     │                   │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼─────────┐        │
│  │  auth.js        │  │  parking.js     │  │ admin-panel.js   │        │
│  │ ┌────────────┐  │  │ ┌────────────┐  │  │ ┌──────────────┐ │        │
│  │ │Validación  │  │  │ │Renderizado │  │  │ │Gestión CRUD  │ │        │
│  │ │Formularios │  │  │ │de Cajones  │  │  │ │Cajones/      │ │        │
│  │ │API Calls   │  │  │ │Cálculo     │  │  │ │Tarifas/      │ │        │
│  │ └────────────┘  │  │ │Tarifas     │  │  │ │Tickets       │ │        │
│  └────────┬────────┘  │ └────────────┘  │  │ └──────────────┘ │        │
│           │           └────────┬────────┘  └────────┬─────────┘        │
│           │                    │                     │                   │
│  ┌────────▼──────────────────────────────────────────▼─────────┐        │
│  │                     styles.css                               │        │
│  │  ┌───────────────────────────────────────────────────────┐  │        │
│  │  │ Estilos Globales | Componentes | Responsive Design   │  │        │
│  │  └───────────────────────────────────────────────────────┘  │        │
│  └──────────────────────────────────────────────────────────────┘        │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                │ HTTP/REST API
                                │
┌───────────────────────────────▼──────────────────────────────────────────┐
│                         CAPA DE APLICACIÓN                                │
│                          (BACKEND - Node.js/Express)                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                      server.js                               │        │
│  │  ┌───────────────────────────────────────────────────────┐   │        │
│  │  │ • Configuración Express                               │   │        │
│  │  │ • Middleware (CORS, Body Parser)                      │   │        │
│  │  │ • Enrutamiento Principal                              │   │        │
│  │  │ • Servidor HTTP en Puerto 3000                        │   │        │
│  │  └───────────────────────────────────────────────────────┘   │        │
│  └────────────────────────┬─────────────────────────────────────┘        │
│                           │                                               │
│           ┌───────────────┼───────────────┬────────────────┐             │
│           │               │               │                │             │
│  ┌────────▼─────┐ ┌───────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐      │
│  │ routes/      │ │ routes/      │ │ routes/    │ │ routes/     │      │
│  │ auth.js      │ │ cajones.js   │ │ tickets.js │ │ admin.js    │      │
│  ├──────────────┤ ├──────────────┤ ├────────────┤ ├─────────────┤      │
│  │POST /login   │ │GET /cajones  │ │POST /crear │ │POST /login  │      │
│  │POST /register│ │GET /         │ │POST /pagar │ │GET /stats   │      │
│  │              │ │disponibles   │ │            │ │GET /usuarios│      │
│  │              │ │              │ │            │ │GET /cajones │      │
│  │              │ │              │ │            │ │GET /tickets │      │
│  │              │ │              │ │            │ │GET /tarifas │      │
│  │              │ │              │ │            │ │PUT /cajones │      │
│  │              │ │              │ │            │ │DELETE /...  │      │
│  └──────┬───────┘ └──────┬───────┘ └─────┬──────┘ └──────┬──────┘      │
│         │                │               │                │             │
│         └────────────────┼───────────────┼────────────────┘             │
│                          │               │                              │
│                  ┌───────▼───────────────▼───────┐                      │
│                  │   config/database.js          │                      │
│                  │  ┌─────────────────────────┐  │                      │
│                  │  │ Pool de Conexiones      │  │                      │
│                  │  │ Configuración PostgreSQL│  │                      │
│                  │  │ Variables de Entorno    │  │                      │
│                  │  └─────────────────────────┘  │                      │
│                  └───────────────┬───────────────┘                      │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
                                   │ SQL Queries
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                         CAPA DE DATOS                                    │
│                      (PostgreSQL Database)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐          │
│  │   Usuarios     │  │   Vehiculos    │  │ CajonesEsta-    │          │
│  │                │  │                │  │ cionamiento     │          │
│  │ • id_usuario   │  │ • id_vehiculo  │  │                 │          │
│  │ • nombre       │  │ • id_usuario FK│  │ • id_cajon      │          │
│  │ • apellido     │  │ • placa        │  │ • numero_cajon  │          │
│  │ • email        │  │ • marca        │  │ • ubicacion_piso│          │
│  │ • password_hash│  │ • modelo       │  │ • tipo          │          │
│  │ • es_admin     │  │ • color        │  │ • estado        │          │
│  └────────┬───────┘  └────────┬───────┘  │ • id_tarifa FK  │          │
│           │ 1                 │ 1        └────────┬────────┘          │
│           │                   │                   │ N                  │
│           │                   │                   │                    │
│           │         N         │         N         │                    │
│           └───────────────────┼───────────────────┘                    │
│                               │                                        │
│                       ┌───────▼────────┐                               │
│                       │ TicketsEstancia│                               │
│                       │                │                               │
│                       │ • id_ticket    │                               │
│                       │ • id_usuario FK│                               │
│                       │ • id_vehiculo FK                               │
│                       │ • id_cajon FK  │                               │
│                       │ • codigo_acceso│                               │
│                       │ • fecha_entrada│                               │
│                       │ • fecha_salida │                               │
│                       │ • monto_total  │                               │
│                       │ • estado       │                               │
│                       └────────────────┘                               │
│                                                                         │
│  ┌────────────────┐                                                    │
│  │    Tarifas     │─────────────────────┐                             │
│  │                │                     │ 1                            │
│  │ • id_tarifa    │                     │                              │
│  │ • descripcion  │                     └──► CajonesEstacionamiento    │
│  │ • costo_por_hora                          (Relación N:1)            │
│  └────────────────┘                                                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │              CONSTRAINTS & INDICES                       │          │
│  │  • PRIMARY KEYS en todas las tablas                      │          │
│  │  • FOREIGN KEYS con ON DELETE CASCADE                    │          │
│  │  • UNIQUE en email (Usuarios), placa (Vehiculos)         │          │
│  │  • CHECK en tipos ENUM (tipo_cajon, estado_cajon, etc.)  │          │
│  │  • INDICES en columnas de búsqueda frecuente             │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 2. MODELO DE CAPAS (ARQUITECTURA N-TIER)

### 2.1 Capa de Presentación (Frontend)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RESPONSABILIDADES:                                              │
│  • Interfaz gráfica de usuario (UI/UX)                          │
│  • Validación de formularios del lado del cliente               │
│  • Renderizado dinámico de componentes                          │
│  • Manejo de eventos del usuario                                │
│  • Comunicación con Backend vía AJAX/Fetch                      │
│                                                                  │
│  COMPONENTES:                                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. MÓDULO DE AUTENTICACIÓN (index.html + auth.js)       │   │
│  │    • Formulario de Login                                 │   │
│  │    • Formulario de Registro de Usuario                   │   │
│  │    • Validación de campos (email, contraseña)            │   │
│  │    • Almacenamiento de sesión (localStorage)             │   │
│  │    • Redirección según rol (usuario/admin)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 2. MÓDULO DE ESTACIONAMIENTO (estacionamiento.html +     │   │
│  │                                parking.js)               │   │
│  │    • Renderizado de cajones (2 pisos, 15 c/u)            │   │
│  │    • Sistema de colores:                                 │   │
│  │      - Verde: Disponible                                 │   │
│  │      - Rojo: Ocupado                                     │   │
│  │      - Azul: Seleccionado                                │   │
│  │    • Cálculo de tarifa en tiempo real                    │   │
│  │    • Confirmación de pago                                │   │
│  │    • Generación de código de acceso                      │   │
│  │    • Auto-actualización cada 10 segundos                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 3. MÓDULO ADMINISTRATIVO (admin.html +                   │   │
│  │                            admin-panel.js)               │   │
│  │    • Dashboard con estadísticas en tiempo real           │   │
│  │    • Panel de gestión de Usuarios                        │   │
│  │    • Panel de gestión de Vehículos                       │   │
│  │    • Panel de gestión de Cajones (cambio estado/tarifa)  │   │
│  │    • Panel de gestión de Tickets (finalizar/eliminar)    │   │
│  │    • Panel de gestión de Tarifas (CRUD completo)         │   │
│  │    • Modales para operaciones CRUD                       │   │
│  │    • Notificaciones tipo toast                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 4. MÓDULO DE ESTILOS (css/styles.css)                    │   │
│  │    • Diseño responsivo (mobile-first)                    │   │
│  │    • Tema oscuro/moderno                                 │   │
│  │    • Animaciones y transiciones                          │   │
│  │    • Componentes reutilizables (botones, modales, etc.)  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TECNOLOGÍAS:                                                    │
│  • HTML5 (estructura semántica)                                 │
│  • CSS3 (Flexbox, Grid, Variables CSS)                          │
│  • JavaScript ES6+ (async/await, modules)                       │
│  • Fetch API (comunicación HTTP)                                │
│  • LocalStorage (persistencia de sesión)                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP REST API
                             │ (JSON)
                             ▼
```

---

### 2.2 Capa de Lógica de Negocio (Backend)

```
┌─────────────────────────────────────────────────────────────────┐
│                 CAPA DE LÓGICA DE NEGOCIO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RESPONSABILIDADES:                                              │
│  • Procesamiento de solicitudes HTTP                            │
│  • Validación de datos del lado del servidor                    │
│  • Lógica de negocio (reglas, cálculos)                         │
│  • Autenticación y autorización                                 │
│  • Gestión de transacciones                                     │
│  • Comunicación con la base de datos                            │
│                                                                  │
│  COMPONENTES:                                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. SERVIDOR PRINCIPAL (server.js)                        │   │
│  │    • Configuración de Express                            │   │
│  │    • Middleware CORS (permitir peticiones frontend)      │   │
│  │    • Body Parser (procesar JSON)                         │   │
│  │    • Enrutamiento a módulos específicos                  │   │
│  │    • Manejo de errores global                            │   │
│  │    • Inicialización del servidor (puerto 3000)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 2. MÓDULO DE AUTENTICACIÓN (routes/auth.js)              │   │
│  │                                                           │   │
│  │    ENDPOINTS:                                             │   │
│  │    POST /api/auth/register                               │   │
│  │      • Validar datos (nombre, email, contraseña, placa)  │   │
│  │      • Verificar email único                             │   │
│  │      • Hashear contraseña (bcrypt)                       │   │
│  │      • Crear usuario en BD                               │   │
│  │      • Crear vehículo asociado                           │   │
│  │                                                           │   │
│  │    POST /api/auth/login                                  │   │
│  │      • Buscar usuario por email                          │   │
│  │      • Verificar contraseña hasheada                     │   │
│  │      • Retornar datos de usuario + vehículos             │   │
│  │                                                           │   │
│  │    REGLAS DE NEGOCIO:                                     │   │
│  │    • Email debe ser único                                │   │
│  │    • Contraseña mínimo 6 caracteres                      │   │
│  │    • Hash con bcrypt (10 rounds)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 3. MÓDULO DE CAJONES (routes/cajones.js)                 │   │
│  │                                                           │   │
│  │    ENDPOINTS:                                             │   │
│  │    GET /api/cajones                                      │   │
│  │      • Retornar TODOS los cajones con tarifa             │   │
│  │      • JOIN con tabla Tarifas                            │   │
│  │      • Ordenar por piso y número                         │   │
│  │                                                           │   │
│  │    GET /api/cajones/disponibles                          │   │
│  │      • Filtrar solo cajones en estado 'Disponible'       │   │
│  │      • Excluir cajones en mantenimiento/reservados       │   │
│  │                                                           │   │
│  │    REGLAS DE NEGOCIO:                                     │   │
│  │    • Solo mostrar cajones disponibles a usuarios         │   │
│  │    • Incluir información de tarifa asociada              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 4. MÓDULO DE TICKETS (routes/tickets.js)                 │   │
│  │                                                           │   │
│  │    ENDPOINTS:                                             │   │
│  │    POST /api/tickets/crear                               │   │
│  │      • Verificar cajón disponible                        │   │
│  │      • Generar código de acceso único (6 dígitos)        │   │
│  │      • Crear ticket en BD                                │   │
│  │      • Retornar código de acceso                         │   │
│  │                                                           │   │
│  │    POST /api/tickets/pagar                               │   │
│  │      • TRANSACCIÓN (BEGIN...COMMIT)                      │   │
│  │      • Validar datos (cajón, horas, vehículo)            │   │
│  │      • Calcular monto total (horas * tarifa)             │   │
│  │      • Crear ticket con estado 'ACTIVO'                  │   │
│  │      • Cambiar cajón a 'Ocupado'                         │   │
│  │      • Si falla, ROLLBACK completo                       │   │
│  │                                                           │   │
│  │    REGLAS DE NEGOCIO:                                     │   │
│  │    • Un cajón solo puede tener 1 ticket activo           │   │
│  │    • Código de acceso único por ticket                   │   │
│  │    • Monto = horas_estimadas * costo_por_hora            │   │
│  │    • Al crear ticket, cajón pasa a 'Ocupado'             │   │
│  │    • Transacción atómica (todo o nada)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 5. MÓDULO ADMINISTRATIVO (routes/admin.js)               │   │
│  │                                                           │   │
│  │    AUTENTICACIÓN:                                         │   │
│  │    GET /api/admin/check-admin                            │   │
│  │    POST /api/admin/register (solo si no hay admin)       │   │
│  │    POST /api/admin/login                                 │   │
│  │                                                           │   │
│  │    ESTADÍSTICAS:                                          │   │
│  │    GET /api/admin/stats                                  │   │
│  │      • Total usuarios (sin admins)                       │   │
│  │      • Total vehículos registrados                       │   │
│  │      • Cajones ocupados actualmente                      │   │
│  │      • Tickets activos                                   │   │
│  │      • Total recaudado (tickets finalizados)             │   │
│  │                                                           │   │
│  │    CRUD USUARIOS:                                         │   │
│  │    GET /api/admin/usuarios                               │   │
│  │    POST /api/admin/usuarios                              │   │
│  │    DELETE /api/admin/usuarios/:id                        │   │
│  │                                                           │   │
│  │    CRUD VEHÍCULOS:                                        │   │
│  │    GET /api/admin/vehiculos                              │   │
│  │    DELETE /api/admin/vehiculos/:id                       │   │
│  │                                                           │   │
│  │    CRUD CAJONES:                                          │   │
│  │    GET /api/admin/cajones                                │   │
│  │    PATCH /api/admin/cajones/:id/estado                   │   │
│  │    PUT /api/admin/cajones/:id (editar tipo y tarifa)     │   │
│  │                                                           │   │
│  │    CRUD TICKETS:                                          │   │
│  │    GET /api/admin/tickets                                │   │
│  │    PATCH /api/admin/tickets/:id/finalizar                │   │
│  │    DELETE /api/admin/tickets/:id                         │   │
│  │                                                           │   │
│  │    CRUD TARIFAS:                                          │   │
│  │    GET /api/admin/tarifas                                │   │
│  │    POST /api/admin/tarifas                               │   │
│  │    PUT /api/admin/tarifas/:id                            │   │
│  │    DELETE /api/admin/tarifas/:id (si no está en uso)     │   │
│  │                                                           │   │
│  │    REGLAS DE NEGOCIO:                                     │   │
│  │    • Solo 1 administrador puede registrarse              │   │
│  │    • Admin es usuario con es_admin = TRUE                │   │
│  │    • No se puede eliminar tarifa en uso                  │   │
│  │    • Al finalizar ticket, liberar cajón automáticamente  │   │
│  │    • Al eliminar ticket activo, liberar cajón            │   │
│  │    • Protección contra eliminación de admin              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 6. MÓDULO DE BASE DE DATOS (config/database.js)          │   │
│  │    • Pool de conexiones PostgreSQL                       │   │
│  │    • Configuración desde .env                            │   │
│  │    • Manejo de errores de conexión                       │   │
│  │    • Reutilización de conexiones                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TECNOLOGÍAS:                                                    │
│  • Node.js v18+ (runtime JavaScript)                            │
│  • Express.js v4 (framework web)                                │
│  • bcryptjs (hashing de contraseñas)                            │
│  • pg (cliente PostgreSQL)                                      │
│  • dotenv (variables de entorno)                                │
│  • cors (permitir peticiones cross-origin)                      │
│                                                                  │
│  PATRONES DE DISEÑO:                                             │
│  • MVC (Model-View-Controller modificado)                       │
│  • Repository Pattern (acceso a datos)                          │
│  • Transaction Script (lógica de negocio en endpoints)          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                             │
                             │ SQL Queries
                             │ (Transacciones)
                             ▼
```

---

### 2.3 Capa de Datos (Database)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE DATOS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RESPONSABILIDADES:                                              │
│  • Persistencia de datos                                        │
│  • Integridad referencial                                       │
│  • Optimización de consultas                                    │
│  • Respaldo y recuperación                                      │
│  • Control de concurrencia                                      │
│                                                                  │
│  ENTIDADES Y RELACIONES:                                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TABLA: Usuarios                                          │   │
│  │                                                           │   │
│  │ COLUMNAS:                                                 │   │
│  │  • id_usuario (SERIAL PRIMARY KEY)                       │   │
│  │  • nombre (VARCHAR(50) NOT NULL)                         │   │
│  │  • apellido (VARCHAR(50) NOT NULL)                       │   │
│  │  • email (VARCHAR(100) UNIQUE NOT NULL)                  │   │
│  │  • password_hash (VARCHAR(255) NOT NULL)                 │   │
│  │  • telefono (VARCHAR(15))                                │   │
│  │  • es_admin (BOOLEAN DEFAULT FALSE)                      │   │
│  │  • fecha_registro (TIMESTAMP DEFAULT NOW())              │   │
│  │                                                           │   │
│  │ INDICES:                                                  │   │
│  │  • idx_usuario_email ON (email)                          │   │
│  │  • idx_usuario_admin ON (es_admin)                       │   │
│  │                                                           │   │
│  │ CONSTRAINTS:                                              │   │
│  │  • UNIQUE (email)                                        │   │
│  │  • CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+')  │   │
│  │                                                           │   │
│  │ RELACIONES:                                               │   │
│  │  • 1:N con Vehiculos                                     │   │
│  │  • 1:N con TicketsEstancia                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TABLA: Vehiculos                                         │   │
│  │                                                           │   │
│  │ COLUMNAS:                                                 │   │
│  │  • id_vehiculo (SERIAL PRIMARY KEY)                      │   │
│  │  • id_usuario (INTEGER FOREIGN KEY → Usuarios)           │   │
│  │  • placa (VARCHAR(20) UNIQUE NOT NULL)                   │   │
│  │  • marca (VARCHAR(50) NOT NULL)                          │   │
│  │  • modelo (VARCHAR(50) NOT NULL)                         │   │
│  │  • color (VARCHAR(30) NOT NULL)                          │   │
│  │                                                           │   │
│  │ INDICES:                                                  │   │
│  │  • idx_vehiculo_usuario ON (id_usuario)                  │   │
│  │  • idx_vehiculo_placa ON (placa)                         │   │
│  │                                                           │   │
│  │ CONSTRAINTS:                                              │   │
│  │  • UNIQUE (placa)                                        │   │
│  │  • FOREIGN KEY (id_usuario)                              │   │
│  │    REFERENCES Usuarios(id_usuario)                       │   │
│  │    ON DELETE CASCADE                                     │   │
│  │                                                           │   │
│  │ RELACIONES:                                               │   │
│  │  • N:1 con Usuarios                                      │   │
│  │  • 1:N con TicketsEstancia                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TABLA: Tarifas                                           │   │
│  │                                                           │   │
│  │ COLUMNAS:                                                 │   │
│  │  • id_tarifa (SERIAL PRIMARY KEY)                        │   │
│  │  • descripcion (VARCHAR(100))                            │   │
│  │  • costo_por_hora (DECIMAL(10,2) NOT NULL)               │   │
│  │                                                           │   │
│  │ CONSTRAINTS:                                              │   │
│  │  • CHECK (costo_por_hora >= 0)                           │   │
│  │                                                           │   │
│  │ RELACIONES:                                               │   │
│  │  • 1:N con CajonesEstacionamiento                        │   │
│  │                                                           │   │
│  │ VENTAJA DE NORMALIZACIÓN:                                 │   │
│  │  ✅ Cambiar una tarifa actualiza todos los cajones       │   │
│  │  ✅ Sin redundancia de precios                           │   │
│  │  ✅ Histórico de tarifas posible                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TABLA: CajonesEstacionamiento                            │   │
│  │                                                           │   │
│  │ COLUMNAS:                                                 │   │
│  │  • id_cajon (SERIAL PRIMARY KEY)                         │   │
│  │  • numero_cajon (VARCHAR(10) UNIQUE NOT NULL)            │   │
│  │  • ubicacion_piso (VARCHAR(5) NOT NULL)                  │   │
│  │  • tipo (tipo_cajon ENUM)                                │   │
│  │    - 'Normal', 'Discapacitado', 'Eléctrico', 'Moto'      │   │
│  │  • estado (estado_cajon ENUM)                            │   │
│  │    - 'Disponible', 'Ocupado', 'Mantenimiento',           │   │
│  │      'Reservado'                                         │   │
│  │  • id_tarifa (INTEGER FOREIGN KEY → Tarifas)             │   │
│  │                                                           │   │
│  │ INDICES:                                                  │   │
│  │  • idx_cajon_numero ON (numero_cajon)                    │   │
│  │  • idx_cajon_estado ON (estado)                          │   │
│  │  • idx_cajon_piso ON (ubicacion_piso)                    │   │
│  │  • idx_cajon_tarifa ON (id_tarifa)                       │   │
│  │                                                           │   │
│  │ CONSTRAINTS:                                              │   │
│  │  • UNIQUE (numero_cajon)                                 │   │
│  │  • FOREIGN KEY (id_tarifa)                               │   │
│  │    REFERENCES Tarifas(id_tarifa)                         │   │
│  │    ON DELETE RESTRICT                                    │   │
│  │                                                           │   │
│  │ RELACIONES:                                               │   │
│  │  • N:1 con Tarifas                                       │   │
│  │  • 1:N con TicketsEstancia                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TABLA: TicketsEstancia                                   │   │
│  │                                                           │   │
│  │ COLUMNAS:                                                 │   │
│  │  • id_ticket (SERIAL PRIMARY KEY)                        │   │
│  │  • codigo_acceso (VARCHAR(10) UNIQUE NOT NULL)           │   │
│  │  • id_usuario (INTEGER FOREIGN KEY → Usuarios)           │   │
│  │  • id_vehiculo (INTEGER FOREIGN KEY → Vehiculos)         │   │
│  │  • id_cajon (INTEGER FOREIGN KEY → Cajones)              │   │
│  │  • fecha_hora_entrada (TIMESTAMP DEFAULT NOW())          │   │
│  │  • fecha_hora_salida (TIMESTAMP)                         │   │
│  │  • horas_estimadas (INTEGER)                             │   │
│  │  • monto_total (DECIMAL(10,2))                           │   │
│  │  • monto_cobrado (DECIMAL(10,2))                         │   │
│  │  • estado (estado_ticket ENUM)                           │   │
│  │    - 'ACTIVO', 'FINALIZADO', 'PAGADO'                    │   │
│  │                                                           │   │
│  │ INDICES:                                                  │   │
│  │  • idx_ticket_usuario ON (id_usuario)                    │   │
│  │  • idx_ticket_cajon ON (id_cajon)                        │   │
│  │  • idx_ticket_estado ON (estado)                         │   │
│  │  • idx_ticket_fecha ON (fecha_hora_entrada)              │   │
│  │                                                           │   │
│  │ CONSTRAINTS:                                              │   │
│  │  • UNIQUE (codigo_acceso)                                │   │
│  │  • FOREIGN KEY (id_usuario, id_vehiculo, id_cajon)       │   │
│  │    ON DELETE CASCADE                                     │   │
│  │  • CHECK (monto_total >= 0)                              │   │
│  │                                                           │   │
│  │ TRIGGERS:                                                 │   │
│  │  • after_insert_ticket → Cambiar cajón a 'Ocupado'       │   │
│  │  • after_update_ticket → Liberar cajón si finalizado     │   │
│  │                                                           │   │
│  │ RELACIONES:                                               │   │
│  │  • N:1 con Usuarios                                      │   │
│  │  • N:1 con Vehiculos                                     │   │
│  │  • N:1 con CajonesEstacionamiento                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TECNOLOGÍAS:                                                    │
│  • PostgreSQL 14+                                               │
│  • Encoding: UTF-8                                              │
│  • Timezone: America/Mexico_City                                │
│                                                                  │
│  CARACTERÍSTICAS AVANZADAS:                                      │
│  • ACID Transactions (Atomicidad, Consistencia, Aislamiento,   │
│    Durabilidad)                                                 │
│  • Foreign Keys con ON DELETE CASCADE/RESTRICT                  │
│  • ENUM Types (tipo_cajon, estado_cajon, estado_ticket)        │
│  • Indices para optimización de consultas                      │
│  • Constraints para integridad de datos                        │
│  • Triggers automáticos (opcional)                             │
│                                                                  │
│  NORMALIZACIÓN:                                                  │
│  ✅ 1NF: Valores atómicos en todas las columnas                 │
│  ✅ 2NF: Sin dependencias parciales                             │
│  ✅ 3NF: Tarifas separadas (sin dependencias transitivas)       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 3. FLUJO DE DATOS ENTRE CAPAS

### 3.1 Flujo de Registro de Usuario

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUJO: REGISTRO DE USUARIO                     │
└──────────────────────────────────────────────────────────────────┘

[USUARIO] Llena formulario de registro
    ↓
[CAPA PRESENTACIÓN - index.html + auth.js]
    ↓
    1. Validar campos en frontend
       • Email formato válido
       • Contraseña mínimo 6 caracteres
       • Todos los campos requeridos
    ↓
    2. Enviar petición HTTP POST
       Endpoint: http://localhost:3000/api/auth/register
       Body: {
         nombre: "Juan",
         apellido: "Pérez",
         email: "juan@example.com",
         password: "123456",
         telefono: "1234567890",
         placa: "ABC-123",
         marca: "Toyota",
         modelo: "Corolla",
         color: "Blanco"
       }
    ↓
[CAPA LÓGICA - backend/routes/auth.js]
    ↓
    3. Validar datos en backend
       • Verificar campos requeridos
       • Validar formato de email
       • Verificar longitud de contraseña
    ↓
    4. Hashear contraseña
       password_hash = bcrypt.hash("123456", 10)
       → "$2a$10$N9qo8uLOickgx2ZMRZoMye..."
    ↓
[CAPA DATOS - PostgreSQL]
    ↓
    5. Iniciar transacción
       BEGIN;
    ↓
    6. Verificar email único
       SELECT COUNT(*) FROM Usuarios WHERE email = 'juan@example.com'
       → Si existe: ROLLBACK + error "Email ya existe"
    ↓
    7. Insertar usuario
       INSERT INTO Usuarios (nombre, apellido, email, password_hash, telefono)
       VALUES ('Juan', 'Pérez', 'juan@example.com', '$2a$10$...', '1234567890')
       RETURNING id_usuario;
       → id_usuario = 5
    ↓
    8. Insertar vehículo
       INSERT INTO Vehiculos (id_usuario, placa, marca, modelo, color)
       VALUES (5, 'ABC-123', 'Toyota', 'Corolla', 'Blanco')
       RETURNING id_vehiculo;
       → id_vehiculo = 8
    ↓
    9. Confirmar transacción
       COMMIT;
    ↓
[CAPA LÓGICA - Respuesta]
    ↓
    10. Retornar JSON exitoso
        {
          "message": "Usuario registrado exitosamente",
          "usuario": {
            "id_usuario": 5,
            "nombre": "Juan",
            "apellido": "Pérez",
            "email": "juan@example.com"
          },
          "vehiculo": {
            "id_vehiculo": 8,
            "placa": "ABC-123"
          }
        }
    ↓
[CAPA PRESENTACIÓN - Respuesta]
    ↓
    11. Guardar en localStorage
        localStorage.setItem('usuario', JSON.stringify(usuario))
    ↓
    12. Redirigir a estacionamiento.html
        window.location.href = 'estacionamiento.html'
    ↓
[USUARIO] Ve el mapa de cajones disponibles
```

---

### 3.2 Flujo de Pago y Ocupación de Cajón

```
┌──────────────────────────────────────────────────────────────────┐
│                FLUJO: PAGO Y OCUPACIÓN DE CAJÓN                   │
└──────────────────────────────────────────────────────────────────┘

[USUARIO] Selecciona cajón A-05 verde (disponible)
    ↓
[CAPA PRESENTACIÓN - estacionamiento.html + parking.js]
    ↓
    1. Pintar cajón de azul (seleccionado)
    ↓
    2. Usuario ingresa 3 horas
    ↓
    3. Calcular costo en tiempo real
       costo = 3 horas × $25.00 = $75.00
       Mostrar: "Costo Total: $75.00"
    ↓
    4. Usuario hace click en "Pagar y Ocupar"
    ↓
    5. Confirmar con el usuario
       confirm("¿Deseas ocupar el cajón A-05 por 3 horas ($75.00)?")
    ↓
    6. Enviar petición HTTP POST
       Endpoint: http://localhost:3000/api/tickets/pagar
       Body: {
         id_cajon: 5,
         id_usuario: 5,
         id_vehiculo: 8,
         horas_estimadas: 3,
         monto_total: 75.00
       }
    ↓
[CAPA LÓGICA - backend/routes/tickets.js]
    ↓
    7. Validar datos
       • id_cajon existe
       • id_usuario existe
       • id_vehiculo pertenece al usuario
       • horas_estimadas > 0
    ↓
[CAPA DATOS - PostgreSQL - TRANSACCIÓN CRÍTICA]
    ↓
    8. Iniciar transacción
       BEGIN;
    ↓
    9. Verificar cajón disponible (LOCK)
       SELECT estado FROM CajonesEstacionamiento
       WHERE id_cajon = 5 FOR UPDATE;
       
       → Si estado != 'Disponible':
         ROLLBACK + error "Cajón no disponible"
    ↓
    10. Generar código de acceso único
        código = Math.random().toString().substring(2, 8)
        → "473829"
    ↓
    11. Crear ticket
        INSERT INTO TicketsEstancia (
          codigo_acceso, id_usuario, id_vehiculo, id_cajon,
          fecha_hora_entrada, horas_estimadas, monto_total, estado
        )
        VALUES (
          '473829', 5, 8, 5,
          CURRENT_TIMESTAMP, 3, 75.00, 'ACTIVO'
        )
        RETURNING id_ticket;
        → id_ticket = 12
    ↓
    12. Marcar cajón como ocupado
        UPDATE CajonesEstacionamiento
        SET estado = 'Ocupado'
        WHERE id_cajon = 5;
    ↓
    13. Confirmar transacción
        COMMIT;
    ↓
[CAPA LÓGICA - Respuesta]
    ↓
    14. Retornar JSON exitoso
        {
          "success": true,
          "message": "Cajón ocupado exitosamente",
          "codigo_acceso": "473829",
          "ticket": {
            "id_ticket": 12,
            "cajón": "A-05",
            "horas": 3,
            "monto": 75.00
          }
        }
    ↓
[CAPA PRESENTACIÓN - Respuesta]
    ↓
    15. Mostrar modal de éxito
        "¡Pago exitoso!"
        "Tu código de acceso es: 473829"
        "Guarda este código para salir del estacionamiento"
    ↓
    16. Actualizar vista de cajones
        • Cambiar cajón A-05 a rojo (ocupado)
        • Recargar cajones desde backend
    ↓
[USUARIO] Ve el cajón A-05 ahora en rojo (ocupado)
         Guarda código 473829 para salir
```

---

### 3.3 Flujo de Edición de Cajón (Admin)

```
┌──────────────────────────────────────────────────────────────────┐
│              FLUJO: ADMIN CAMBIA TARIFA DE CAJÓN                  │
└──────────────────────────────────────────────────────────────────┘

[ADMIN] Inicia sesión en admin.html
    ↓
[CAPA PRESENTACIÓN - admin.html + admin-panel.js]
    ↓
    1. Cargar panel de cajones
       GET /api/admin/cajones
    ↓
    2. Mostrar tabla con todos los cajones
       ┌──────┬──────┬─────────┬────────────┬───────────┐
       │ Cajón│ Piso │  Tipo   │   Estado   │  Tarifa   │
       ├──────┼──────┼─────────┼────────────┼───────────┤
       │ A-05 │  A   │ Normal  │ Disponible │ $25/hora  │
       │ ...  │  ... │   ...   │    ...     │   ...     │
       └──────┴──────┴─────────┴────────────┴───────────┘
    ↓
    3. Admin hace click en "✏️ Editar" del cajón A-05
    ↓
    4. Abrir modal de edición
       • Cargar tarifas disponibles
         GET /api/admin/tarifas
         → [
             { id: 1, descripcion: "Normal", costo: 25.00 },
             { id: 2, descripcion: "Premium", costo: 50.00 }
           ]
       • Mostrar selector de tipo (Normal, Eléctrico, etc.)
       • Mostrar selector de tarifa (preseleccionado: Tarifa Normal)
    ↓
    5. Admin selecciona:
       • Tipo: "Eléctrico"
       • Tarifa: "Premium ($50.00/hora)"
    ↓
    6. Admin hace click en "Guardar Cambios"
    ↓
    7. Enviar petición HTTP PUT
       Endpoint: http://localhost:3000/api/admin/cajones/5
       Body: {
         tipo: "Eléctrico",
         id_tarifa: 2
       }
    ↓
[CAPA LÓGICA - backend/routes/admin.js]
    ↓
    8. Validar datos
       • tipo debe ser: Normal, Discapacitado, Eléctrico, o Moto
       • id_tarifa debe existir
    ↓
[CAPA DATOS - PostgreSQL]
    ↓
    9. Verificar que tarifa existe
       SELECT id_tarifa FROM Tarifas WHERE id_tarifa = 2;
       → Si no existe: error "Tarifa no encontrada"
    ↓
    10. Actualizar cajón
        UPDATE CajonesEstacionamiento
        SET tipo = 'Eléctrico', id_tarifa = 2
        WHERE id_cajon = 5
        RETURNING *;
        
        → Resultado:
        {
          id_cajon: 5,
          numero_cajon: 'A-05',
          tipo: 'Eléctrico',      ← CAMBIADO
          estado: 'Disponible',
          id_tarifa: 2             ← CAMBIADO
        }
    ↓
[CAPA LÓGICA - Respuesta]
    ↓
    11. Retornar JSON exitoso
        {
          "message": "Cajón actualizado exitosamente",
          "cajon": { ... }
…