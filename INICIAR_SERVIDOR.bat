@echo off
echo =========================================
echo   Iniciando Servidor ParkPay Backend
echo =========================================
echo.

cd backend

echo Verificando dependencias...
if not exist "node_modules\" (
    echo Instalando dependencias por primera vez...
    call npm install
    echo.
)

echo Iniciando servidor en http://localhost:3000
echo Presiona Ctrl+C para detener el servidor
echo.
node server.js

pause
