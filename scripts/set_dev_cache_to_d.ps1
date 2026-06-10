# ============================================================
# 📦 CHUYỂN DEV CACHE (npm/pip/yarn) SANG Ổ D:
# ============================================================
# Chạy 1 lần duy nhất, sau đó các cache sẽ tự động lưu trên D:
# ============================================================

Write-Host "📦 CHUYỂN DEV CACHE SANG Ổ D:" -ForegroundColor Cyan

# Tạo thư mục cache trên D:
$cacheDirs = @(
    "D:\npm-cache",
    "D:\yarn-cache",
    "D:\pip-cache"
)

foreach ($dir in $cacheDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "   📁 Đã tạo $dir" -ForegroundColor Green
    }
}

# npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm config set cache "D:\npm-cache" --global 2>&1 | Out-Null
    Write-Host "   ✅ npm cache → D:\npm-cache" -ForegroundColor Green
}

# yarn
if (Get-Command yarn -ErrorAction SilentlyContinue) {
    yarn config set cache-folder "D:\yarn-cache" --global 2>&1 | Out-Null
    Write-Host "   ✅ yarn cache → D:\yarn-cache" -ForegroundColor Green
}

# pip
if (Get-Command pip -ErrorAction SilentlyContinue) {
    pip config set global.cache-dir "D:\pip-cache" 2>&1 | Out-Null
    Write-Host "   ✅ pip cache → D:\pip-cache" -ForegroundColor Green
}

# .npm (global)
$npmGlobal = "$env:USERPROFILE\.npm"
if (Test-Path $npmGlobal) {
    Remove-Item "$npmGlobal\_cacache" -Recurse -Force -ErrorAction SilentlyContinue
    # Tạo symlink (yêu cầu Admin)
    cmd /c "mklink /D `"$npmGlobal\_cacache`" `"D:\npm-cache`"" 2>$null
    if ($?) {
        Write-Host "   ✅ Đã symlink .npm cache sang D:" -ForegroundColor Green
    }
}

# Xoá cache cũ trên C:
Write-Host "   🗑️ Xoá cache cũ trên C:..." -ForegroundColor Yellow
Remove-Item "$env:LOCALAPPDATA\npm-cache\*" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ HOÀN TẤT! Từ giờ npm/pip/yarn sẽ dùng cache trên D:" -ForegroundColor Green
Write-Host "   (Không còn lo đầy ổ C nữa!)" -ForegroundColor Green
