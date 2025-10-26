@echo off
title ParkPay - Desarrollo Local
color 0A

echo.
echo  ██████╗  █████╗ ██████╗ ██╗  ██╗██████╗  █████╗ ██╗   ██╗
echo  ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗██╔══██╗╚██╗ ██╔╝
echo  ██████╔╝███████║██████╔╝█████╔╝ ██████╔╝███████║ ╚████╔╝ 
echo  ██╔═══╝ ██╔══██║██╔══██╗██╔═██╗ ██╔═══╝ ██╔══██║  ╚██╔╝  
echo  ██║     ██║  ██║██║  ██║██║  ██╗██║     ██║  ██║   ██║   
echo  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝   
echo.
echo  🔧 MODO DESARROLLO LOCAL
echo  ═══════════════════════════════════════════════════════════
echo.

echo ⏳ Verificando dependencias...
cd backend
if not exist node_modules (
    echo 📦 Instalando dependencias del backend...
    npm install
)

echo.
echo 🚀 Iniciando servicios...
echo.

:: Iniciar backend en nueva ventana
start "🔗 ParkPay Backend" cmd /k "echo 🔗 BACKEND PARKPAY - PUERTO 3000 && echo ═══════════════════════════════════ && node server.js"

:: Esperar un poco para que el backend inicie
timeout /t 3 /nobreak >nul

:: Regresar al directorio raíz
cd ..

:: Iniciar frontend en nueva ventana  
start "🌐 ParkPay Frontend" cmd /k "echo 🌐 FRONTEND PARKPAY - PUERTO 8080 && echo ═══════════════════════════════════ && npx http-server -p 8080 -c-1 --cors"

echo ✅ Servicios iniciados correctamente!
echo.
echo 📍 URLs de desarrollo:
echo    🔗 Backend:  http://localhost:3000
echo    🌐 Frontend: http://localhost:8080
echo    ❤️  Health:   http://localhost:3000/api/health
echo.
echo 🔍 Para debugging:
echo    - Backend logs: Ver ventana "ParkPay Backend"
echo    - Frontend: Abrir DevTools en navegador
echo    - BD: Usar misma BD de producción (Supabase)
echo.
echo 🛑 Para detener: Cerrar ambas ventanas de terminal
echo.
pause