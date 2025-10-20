@echo off
echo ========================================
echo   CONFIGURAR SENDGRID EN 5 MINUTOS
echo ========================================
echo.
echo Este script te guiara para configurar SendGrid
echo.
echo PASO 1: Crear cuenta SendGrid
echo -----------------------------------
echo 1. Ve a: https://sendgrid.com
echo 2. Click en "Start for Free"
echo 3. Completa el registro
echo.
pause
echo.
echo PASO 2: Verificar email remitente
echo -----------------------------------
echo 1. Settings ^> Sender Authentication
echo 2. Click "Verify a Single Sender"
echo 3. Usa tu email personal (Gmail, Outlook, etc.)
echo 4. Confirma el email que te llegara
echo.
pause
echo.
echo PASO 3: Crear API Key
echo -----------------------------------
echo 1. Settings ^> API Keys
echo 2. Create API Key
echo 3. Name: ParkPay_Recuperacion
echo 4. Permissions: Restricted Access
echo 5. Mail Send: FULL ACCESS
echo 6. Copia el API Key (empieza con SG.)
echo.
pause
echo.
echo PASO 4: Configurar en Render
echo -----------------------------------
echo 1. Ve a: https://dashboard.render.com
echo 2. Selecciona: parkpay-backend
echo 3. Environment ^> Add Environment Variable
echo.
echo Agrega estas 2 variables:
echo   SENDGRID_API_KEY = [tu API key]
echo   SENDGRID_FROM_EMAIL = [tu email verificado]
echo.
echo 4. Save Changes
echo.
pause
echo.
echo ========================================
echo   CONFIGURACION COMPLETA!
echo ========================================
echo.
echo El backend en Render se reiniciara automaticamente
echo y comenzara a enviar emails profesionales.
echo.
echo Para probar:
echo 1. Ve a: https://parkpay.vercel.app
echo 2. Click en "Olvide mi contrasena"
echo 3. Ingresa tu email
echo 4. Revisa tu correo (incluye spam)
echo.
echo Documentacion completa: SENDGRID_SETUP.md
echo.
pause
