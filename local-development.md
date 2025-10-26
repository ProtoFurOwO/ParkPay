# 🚀 DESARROLLO LOCAL - PARKPAY

## 📋 Configuración para Testing Local

### **1. Backend Local**
```bash
# En directorio /backend
npm install
node server.js
```
**URL:** http://localhost:3000

### **2. Frontend Local**
```bash
# Servidor HTTP simple
npx http-server -p 8080 -c-1
```
**URL:** http://localhost:8080

### **3. Configuración de Environment**

#### **Backend (.env_local)**
```env
# Copia de .env pero para desarrollo local
DATABASE_URL=postgresql://...  # Supabase (misma BD)
PORT=3000
NODE_ENV=development
JWT_SECRET=parkpay_local_dev_secret
JWT_EXPIRES_IN=24h
```

#### **Frontend (local-config.js)**
```javascript
// Configuración para desarrollo local
const LOCAL_CONFIG = {
    API_URL: 'http://localhost:3000/api',
    ENVIRONMENT: 'local'
};
```

### **4. Scripts de Desarrollo**

#### **start-local.bat**
```batch
@echo off
echo Iniciando ParkPay en modo desarrollo local...
cd backend
start "Backend" cmd /k "node server.js"
cd ..
start "Frontend" cmd /k "npx http-server -p 8080 -c-1"
echo.
echo ✅ Backend: http://localhost:3000
echo ✅ Frontend: http://localhost:8080
echo.
pause
```

### **5. Testing Flow**
1. **Cambiar código** en branch feature/jwt-security
2. **Probar localmente** con start-local.bat
3. **Verificar que funciona** en localhost
4. **Commitear** solo cuando esté 100% funcional
5. **Push** a GitHub (auto-deploy a producción)

### **6. Ventajas**
- ✅ Testing instantáneo sin deployments
- ✅ Debug con console.log sin afectar users
- ✅ Rollback rápido si algo falla
- ✅ Misma BD de producción (datos reales)
- ✅ No spam de commits por testing