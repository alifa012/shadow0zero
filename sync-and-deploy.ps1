# SHADOWLOGS IMAGE AUTO-SYNC & DEPLOY
# PowerShell Script

Write-Host ""
Write-Host "========================================"
Write-Host "   SHADOWLOGS IMAGE AUTO-SYNC"
Write-Host "========================================"
Write-Host ""

# Run sync script
Write-Host "🔄 Syncing images..." -ForegroundColor Cyan
node sync-images.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================"
    Write-Host "   DEPLOYING TO FIREBASE"
    Write-Host "========================================"
    Write-Host ""
    
    firebase deploy --only hosting
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================"
        Write-Host "   ✅ ALL DONE!"
        Write-Host "========================================"
        Write-Host ""
        Write-Host "Your images are now live on the website!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Deployment failed" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "❌ Image sync failed" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
