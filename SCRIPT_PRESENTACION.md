# 🎤 Script de Presentación - Sistema de Recuperación de Contraseñas

## ⏱️ Duración: 3-4 minutos

---

## 🎯 Introducción (30 segundos)

**[Mostrar página de login]**

> "Además de las funcionalidades principales de ParkPay, implementamos un **sistema completo de seguridad** que incluye dos características importantes:"

1. ✅ **Validación de contraseñas fuertes**
2. ✅ **Sistema de recuperación de contraseñas**

---

## 🔒 Parte 1: Validación de Contraseñas (45 segundos)

**[Intentar registrar con contraseña débil]**

> "El sistema **no permite contraseñas débiles**. Todas las contraseñas deben cumplir con:"

- Mínimo 6 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 número

**[Mostrar mensaje de error en pantalla]**

> "Si la contraseña no cumple, el sistema **muestra exactamente qué falta**, guiando al usuario."

**[Registrar con contraseña fuerte: `Test123`]**

> "Con una contraseña fuerte, el registro procede sin problemas."

---

## 📧 Parte 2: Sistema de Recuperación (2 minutos)

### **Paso 1: Solicitar Código (30 seg)**

**[Click en "¿Olvidaste tu contraseña?"]**

> "Si un usuario olvida su contraseña, puede recuperarla fácilmente desde aquí."

**[Ingresar email registrado]**

> "Ingresa el email registrado y..."

**[Click en "Enviar Código"]**

> "...el sistema genera un **código de 6 dígitos único** y lo envía por email."

### **Paso 2: Mostrar Email Recibido (45 seg)**

**[Tomar teléfono/laptop alternativo]**

> "Aquí está el email recibido en tiempo real."

**[Mostrar email en pantalla/proyección]**

> "Como pueden ver, usamos **SendGrid**, un servicio profesional de envío de emails que garantiza:"

- ✅ No llega a spam
- ✅ Diseño HTML profesional con los colores de ParkPay
- ✅ Información clara y segura

**[Señalar el código en el email]**

> "El código está **destacado visualmente** y tiene una **advertencia de expiración de 10 minutos**."

### **Paso 3: Verificar Código (30 seg)**

**[Volver a la página web]**

**[Ingresar código del email]**

> "Copiamos el código del email y lo ingresamos aquí."

**[Click en "Verificar Código"]**

> "El sistema valida el código en el backend y..."

**[Mostrar paso 3]**

> "...si es correcto, permite crear una nueva contraseña."

### **Paso 4: Nueva Contraseña (45 seg)**

**[Intentar contraseña débil primero]**

> "Si intentamos una contraseña débil como `123456`..."

**[Mostrar error]**

> "...el sistema nuevamente **valida y rechaza**."

**[Ingresar contraseña fuerte: `Nueva123`]**

> "Con una contraseña fuerte, el cambio se realiza exitosamente."

**[Mostrar redirección a login]**

> "Y somos redirigidos al login para iniciar sesión con la nueva contraseña."

**[Login exitoso]**

> "Como ven, el sistema funciona perfectamente de extremo a extremo."

---

## 🔒 Parte 3: Seguridad Implementada (30 seg)

**[Volver a slides/pantalla de código]**

> "Detrás de este flujo simple, implementamos varias **medidas de seguridad**:"

### **Seguridad del Sistema:**

1. 🔐 **Códigos de un solo uso** - Una vez usado, no sirve de nuevo
2. ⏱️ **Expiración automática** - 10 minutos después del envío
3. 🚫 **Límite de intentos** - Máximo 3 intentos fallidos
4. 🕵️ **No revela información** - No dice si un email existe o no
5. 🔒 **Hash seguro** - Contraseñas con bcrypt (salt rounds 10)

### **Stack Tecnológico:**

- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Backend**: Node.js + Express
- **Email**: SendGrid API (100 emails/día gratis)
- **Base de Datos**: PostgreSQL (Supabase)
- **Hosting**: Vercel (frontend) + Render (backend)

---

## ✨ Cierre (30 seg)

> "Este sistema de recuperación es completamente **funcional y profesional**, usando las mismas tecnologías que aplicaciones reales en producción."

> "SendGrid nos da **100 emails diarios gratis**, más que suficiente para un sistema de estacionamiento."

> "Y lo mejor: **no llega a spam** gracias a la infraestructura de IPs verificadas de SendGrid."

**[Mostrar documentación brevemente]**

> "Toda la implementación está documentada en detalle, incluyendo guías de configuración y troubleshooting."

---

## 🎯 Puntos Clave a Enfatizar

1. ✅ **Sistema completo y funcional** (no es solo demo)
2. ✅ **Seguridad profesional** (validaciones, expiración, límites)
3. ✅ **Tecnologías reales** (SendGrid, bcrypt, PostgreSQL)
4. ✅ **Experiencia de usuario** (diseño intuitivo, mensajes claros)
5. ✅ **Gratuito 100%** (sin costos de operación)

---

## ⚠️ Consejos para la Demo

### **Antes de Presentar:**
- [ ] Prueba el flujo completo 2 veces
- [ ] Ten un email de respaldo registrado
- [ ] Verifica que no hay emails en spam antes
- [ ] Ten screenshots del email por si falla en vivo
- [ ] Carga la página en una pestaña aparte (backup)

### **Si Algo Sale Mal:**

**❌ No llega el email:**
- Revisa spam inmediatamente
- Muestra screenshot preparado
- Explica: "En demo a veces Gmail demora 1-2 min"

**❌ Código incorrecto:**
- Verifica que no expiró (10 min)
- Copia-pega directamente del email
- Si falla, solicita uno nuevo

**❌ Error de servidor:**
- Render puede dormir después de 15 min inactivo
- Haz una petición de "calentamiento" antes
- Ten plan B con screenshots

### **Trucos Profesionales:**

1. **Pre-carga el email** antes de presentar (ya recibido)
2. **Usa dos monitores/devices** (uno para email, otro para web)
3. **Practica transiciones** entre pantallas
4. **Habla mientras carga** (no dejes silencios)
5. **Mantén confianza** incluso si hay pequeños errores

---

## 📱 Configuración Visual Recomendada

### **Proyección Principal:**
- Navegador en pantalla completa
- Zoom al 125% (mejor visibilidad)
- Ocultar bookmarks/extensiones
- Modo claro (mejor contraste con proyector)

### **Device Secundario (Email):**
- Teléfono con Gmail app (más rápido)
- O laptop con email en otra pantalla
- Ten email ya abierto y listo

### **Consola de Desarrollador (Opcional):**
- Si mencionas logs, ten consola lista
- Filter: "Email de recuperación"
- Solo mostrar si pregunta el profesor

---

## 🎓 Preguntas Frecuentes (Preparadas)

**P: ¿Por qué 10 minutos de expiración?**
> R: Es el estándar de la industria. Suficiente tiempo para el usuario, pero no tanto que sea riesgo de seguridad.

**P: ¿Qué pasa si alguien solicita 100 códigos?**
> R: SendGrid tiene límite de 100 emails/día, y podríamos agregar rate limiting (5 solicitudes/hora por email).

**P: ¿Por qué no usar solo preguntas de seguridad?**
> R: Las preguntas son menos seguras (respuestas adivinables). Email es estándar moderno y más seguro.

**P: ¿Costo de SendGrid en producción real?**
> R: Plan gratuito: 100/día. Plan básico: $15/mes = 50,000 emails. Muy escalable.

**P: ¿Qué pasa si el email del usuario ya no existe?**
> R: Deberían tener método alternativo (soporte, verificación de identidad). Esto es estándar.

---

## ✅ Checklist Final Pre-Presentación

**5 minutos antes:**
- [ ] Abrir https://parkpay.vercel.app en Chrome
- [ ] Abrir Gmail en teléfono/laptop secundario
- [ ] Verificar conexión a internet estable
- [ ] Cerrar aplicaciones innecesarias
- [ ] Probar un flujo completo rápido
- [ ] Verificar que Render backend está activo (hacer una petición)
- [ ] Tener agua cerca (hidratarse)
- [ ] Respirar profundo 😌

**¡Éxito en tu presentación! 🚀🎉**
