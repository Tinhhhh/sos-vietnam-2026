@echo off
chcp 65001 >nul
echo ========================================================
echo   DANG NANG CAP NODE.JS LEN PHIEN BAN 20.20.2 (LTS)
echo ========================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [LOI] Vui long chuot phai vao file nay va chon "Run as administrator"!
    echo.
    pause
    exit /b 1
)

set "SOURCE_DIR=%APPDATA%\fnm\aliases\default"
set "TARGET_DIR=C:\Program Files\nodejs"
set "BACKUP_DIR=C:\Program Files\nodejs_v16_backup"

if not exist "%SOURCE_DIR%\node.exe" (
    echo [LOI] Khong tim thay ban Node 20 tai: %SOURCE_DIR%
    pause
    exit /b 1
)

if not exist "%BACKUP_DIR%" (
    echo [*] Dang sao luu Node 16 cu sang "%BACKUP_DIR%"...
    xcopy /E /I /Y /Q "%TARGET_DIR%" "%BACKUP_DIR%" >nul
)

echo [*] Dang sao chep Node 20 vao "%TARGET_DIR%"...
xcopy /E /I /Y /Q "%SOURCE_DIR%\*" "%TARGET_DIR%\" >nul

echo.
echo ========================================================
echo   NANG CAP THANH CONG!
echo ========================================================
"%TARGET_DIR%\node.exe" -v
echo.
echo Hay khoi dong lai Terminal hoac IntelliJ de ap dung!
pause
