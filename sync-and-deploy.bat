@echo off
echo.
echo ========================================
echo    SHADOWLOGS IMAGE AUTO-SYNC
echo ========================================
echo.

REM Sync images and update products
node sync-images.js

REM Check if sync was successful
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo    DEPLOYING TO FIREBASE
    echo ========================================
    echo.
    firebase deploy --only hosting
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo    ✅ ALL DONE!
        echo ========================================
        echo.
    ) else (
        echo.
        echo ❌ Deployment failed
        echo.
    )
) else (
    echo.
    echo ❌ Image sync failed
    echo.
)

pause
