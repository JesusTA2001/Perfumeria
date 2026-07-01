@echo off
echo ====================================
echo Iniciando servidores de Perfumeria...
echo ====================================
echo.

cd /d "C:\Users\jesus\OneDrive\Escritorio\perfumeria\perfumes"

echo [1/2] Iniciando Backend API (Puerto 4000)...
start "Backend API Server" cmd /k "npm run api"
timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Frontend React (Puerto 3000)...
start "Frontend React Server" cmd /k "set PORT=3000 && npm start"

echo.
echo ====================================
echo Servidores iniciados!
echo ====================================
echo Backend: http://localhost:4000/api
echo Frontend: http://localhost:3000
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
