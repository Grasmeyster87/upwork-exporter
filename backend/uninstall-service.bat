@echo off
SETLOCAL

REM 🔧 Ім'я служби з node-windows
SET SERVICENAME=UpworkJobExporter
SET REGKEY=HKLM\SYSTEM\CurrentControlSet\Services\%SERVICENAME%

REM 🔍 Перевірка існування служби
sc query "%SERVICENAME%" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Служба "%SERVICENAME%" не знайдена. Пропускаємо...
) ELSE (
    echo 🛑 Зупинка та видалення служби "%SERVICENAME%"...
    sc stop "%SERVICENAME%" >nul 2>&1
    sc delete "%SERVICENAME%" >nul 2>&1
    echo ✅ Служба видалена.
)

REM 🧹 Видалення ключа реєстру (на всяк випадок)
reg delete "%REGKEY%" /f >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Ключ реєстру не знайдено або не видалено.
) ELSE (
    echo 🧽 Ключ реєстру видалено.
)

REM 📦 Запуск NodeJS скрипту для очищення директорій
cd /d "%~dp0"
IF EXIST uninstall-service.js (
    echo ▶️ Запуск Node скрипту uninstall-service.js...
    node uninstall-service.js
) ELSE (
    echo ⚠️ JS-файл uninstall-service.js не знайдено.
)

ENDLOCAL
