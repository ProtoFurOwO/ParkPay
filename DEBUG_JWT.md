# 🚨 JWT NO APARECE - PASOS DE SOLUCIÓN

## 🔍 Problema Detectado:
No aparece `jwt_token` en localStorage después de login/registro.

## ✅ Soluciones Aplicadas:

### 1. ⚡ CONFIGURAR JWT_SECRET EN RENDER (URGENTE):
```
Ve a: https://dashboard.render.com
→ parkpay-backend 
→ Environment 
→ Add Environment Variable:

JWT_SECRET = parkpay_super_secret_key_production_2025

→ Save Changes
```

### 2. 🔧 FUNCIONES JWT MOVIDAS A auth.js:
- ✅ guardarToken() ahora está en auth.js
- ✅ obtenerToken() disponible
- ✅ eliminarToken() mejorado

### 3. 🧪 PRUEBA INMEDIATA:
Después de configurar JWT_SECRET en Render:

1. **Espera 2 minutos** (Render reinicia)
2. **Refresh** https://parkpay.vercel.app
3. **Login/Registro** → Deberías ver el token
4. **F12** → Application → Local Storage → `jwt_token`

## 🔍 DEBUGGING:

### A. **Verificar Respuesta del Backend** (F12 Network):
```javascript
// Abre Developer Tools → Network
// Haz login y busca la petición a /auth/login
// Revisa la Response - debe incluir "token": "eyJ..."
```

### B. **Test Manual en Console**:
```javascript
// Después de login, ejecuta en console:
console.log('Token:', localStorage.getItem('jwt_token'));
console.log('Usuario:', localStorage.getItem('usuario'));
```

### C. **Verificar Render Logs**:
1. Ve a Render Dashboard
2. parkpay-backend → Logs
3. Busca errores relacionados a JWT

## 🎯 ACCIÓN INMEDIATA:
1. **Configura JWT_SECRET en Render** ← MÁS IMPORTANTE
2. Espera reinicio (2 min)
3. Prueba login
4. Reporta qué ves en Network/Console