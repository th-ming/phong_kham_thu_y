# ============================================================
# 🚀 REXI SYSTEM OPTIMIZER - TỐI ƯU TOÀN DIỆN
# ============================================================
# Chạy với quyền Administrator để có hiệu quả tốt nhất
# ============================================================

param(
    [switch]$AutoMode  # Chạy không cần xác nhận
)

$ErrorActionPreference = "SilentlyContinue"
$script:restartRequired = $false

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 REXI SYSTEM OPTIMIZER v1.0              ║" -ForegroundColor Cyan
Write-Host "║   Tối ưu Windows - Giải phóng ổ C - Tăng tốc ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  CẢNH BÁO: Nên chạy với quyền Administrator để tối ưu tốt nhất!" -ForegroundColor Yellow
    Write-Host "   Hãy: Right-click -> Run as Administrator`n" -ForegroundColor Yellow
    if (-not $AutoMode) {
        $choice = Read-Host "❓ Tiếp tục? (Y/N, mặc định Y)"
        if ($choice -eq 'N' -or $choice -eq 'n') { exit }
    }
}

# ============================================================
# KIỂM TRA DUNG LƯỢNG HIỆN TẠI
# ============================================================
function Check-DiskSpace {
    Write-Host "📊 KIỂM TRA DUNG LƯỢNG HIỆN TẠI..." -ForegroundColor Green
    $drives = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
    foreach ($d in $drives) {
        $total = [math]::Round($d.Size/1GB, 1)
        $free = [math]::Round($d.FreeSpace/1GB, 1)
        $used = [math]::Round(($d.Size - $d.FreeSpace)/1GB, 1)
        $pct = [math]::Round(($d.Size - $d.FreeSpace)/$d.Size * 100, 1)
        
        $color = if ($pct -gt 90) { "Red" } elseif ($pct -gt 75) { "Yellow" } else { "Green" }
        Write-Host "   $($d.DeviceID)  Tổng: ${total}GB | Đã dùng: ${used}GB | Trống: $free`GB | Đầy: ${pct}%" -ForegroundColor $color
    }
    Write-Host ""
}

# ============================================================
# 1. TẮT HIBERNATION (free ~6-8GB)
# ============================================================
function Disable-Hibernation {
    Write-Host "🔌 [1/8] TẮT HIBERNATION (tiết kiệm ~6-8GB trên ổ C)..." -ForegroundColor Green
    $current = (powercfg /a 2>&1) -match "Hibernation"
    powercfg -h off 2>&1 | Out-Null
    if ($?) {
        Write-Host "   ✅ Đã tắt Hibernation - giải phóng ~6-8GB" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Không thể tắt Hibernation (có thể đã tắt rồi)" -ForegroundColor Yellow
    }
}

# ============================================================
# 2. DỌN TEMP FILES (free ~10-20GB)
# ============================================================
function Clean-TempFiles {
    Write-Host "🗑️ [2/8] DỌN TEMP FILES (tiết kiệm ~10-20GB)..." -ForegroundColor Green
    
    $paths = @(
        "$env:TEMP\*.*",
        "$env:WINDIR\Temp\*.*",
        "$env:WINDIR\Prefetch\*.*",
        "$env:LOCALAPPDATA\Temp\*.*"
    )
    
    $totalFreed = 0
    foreach ($p in $paths) {
        $before = (Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue
        $after = (Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        $freed = [math]::Round(($before - $after)/1MB, 1)
        $totalFreed += $freed
    }
    Write-Host "   ✅ Đã dọn Temp files: ~${totalFreed}MB" -ForegroundColor Green
}

# ============================================================
# 3. DỌN DISK CLEANUP (free ~5-15GB)
# ============================================================
function Run-DiskCleanup {
    Write-Host "🧹 [3/8] DỌN WINDOWS DISK CLEANUP (tiết kiệm ~5-15GB)..." -ForegroundColor Green
    
    # Dùng CleanMgr với profile tối đa
    $sageset = 65535
    $stateKey = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches"
    
    # Tạo sageset với tất cả các mục được chọn
    if (Test-Path $stateKey) {
        Get-ChildItem $stateKey | ForEach-Object {
            $path = $_.PSPath
            try {
                Set-ItemProperty -Path $path -Name "StateFlags$sageset" -Value 2 -Type DWord -ErrorAction SilentlyContinue
            } catch {}
        }
    }
    
    # Chạy Disk Cleanup
    Start-Process -FilePath "cleanmgr.exe" -ArgumentList "/sagerun:$sageset" -NoNewWindow -Wait
    Write-Host "   ✅ Đã chạy Disk Cleanup" -ForegroundColor Green
    
    # Xoá thêm Windows Update Cache
    $wuFolder = "$env:WINDIR\SoftwareDistribution\Download"
    if (Test-Path $wuFolder) {
        $size = (Get-ChildItem $wuFolder -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        Stop-Service wuauserv -Force -ErrorAction SilentlyContinue
        Remove-Item "$wuFolder\*.*" -Recurse -Force -ErrorAction SilentlyContinue
        Start-Service wuauserv -ErrorAction SilentlyContinue
        Write-Host "   ✅ Đã xoá Windows Update cache" -ForegroundColor Green
    }
}

# ============================================================
# 4. CHUYỂN PAGEFILE SANG Ổ D (free ~8-16GB trên C)
# ============================================================
function Move-PageFileToD {
    Write-Host "🔄 [4/8] CHUYỂN PAGEFILE SANG Ổ D (tiết kiệm ~8-16GB trên ổ C)..." -ForegroundColor Green
    
    $computer = Get-WmiObject Win32_ComputerSystem -EnableAllPrivileges
    if ($computer) {
        # Set pagefile on C: to 0
        $cPagefile = Get-WmiObject -Class Win32_PageFileSetting -Filter "SettingID='pagefile.sys'" | Where-Object { $_.Name -like 'C:*' }
        if ($cPagefile) {
            $cPagefile.InitialSize = 0
            $cPagefile.MaximumSize = 0
            $cPagefile.Put() | Out-Null
        }
        
        # Set pagefile on D: to system managed
        # Chú ý: WMI pagefile settings cần tạo setting
        $dDrive = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='D:'"
        if ($dDrive) {
            # Xoá setting cũ nếu có
            $oldSettings = Get-WmiObject -Class Win32_PageFileSetting
            $oldSettings | ForEach-Object { $_.Delete() | Out-Null }
            
            # Tạo pagefile.sys trên D:\
            $newSetting = ([wmiclass]'Win32_PageFileSetting').CreateInstance()
            $newSetting.Name = "D:\pagefile.sys"
            $newSetting.InitialSize = 0  # 0 = system managed
            $newSetting.MaximumSize = 0   # 0 = system managed
            $newSetting.Put() | Out-Null
            
            $script:restartRequired = $true
            Write-Host "   ✅ Đã chuyển Pagefile sang D: (cần khởi động lại)" -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠️ Không thể truy cập WMI để chuyển pagefile" -ForegroundColor Yellow
        Write-Host "   📝 Hướng dẫn thủ công:" -ForegroundColor Cyan
        Write-Host "       1. Win+R → sysdm.cpl → Advanced → Performance Settings" -ForegroundColor White
        Write-Host "       2. Advanced → Virtual memory → Change" -ForegroundColor White
        Write-Host "       3. Bỏ tick 'Auto manage' → Chọn C: → No paging file → Set" -ForegroundColor White
        Write-Host "       4. Chọn D: → System managed size → Set → OK → Restart" -ForegroundColor White
    }
}

# ============================================================
# 5. DỌN CACHE TRÌNH DUYỆT (free ~5-15GB)
# ============================================================
function Clear-BrowserCaches {
    Write-Host "🌐 [5/8] DỌN CACHE 4 TRÌNH DUYỆT (tiết kiệm ~5-15GB)..." -ForegroundColor Green
    
    $cachePaths = @(
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker\CacheStorage",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Service Worker\CacheStorage",
        "$env:LOCALAPPDATA\Opera Software\Opera Stable\Cache",
        "$env:LOCALAPPDATA\CocCoc\Browser\User Data\Default\Cache",
        "$env:LOCALAPPDATA\CocCoc\Browser\User Data\Default\Code Cache"
    )
    
    $totalFreed = 0
    foreach ($p in $cachePaths) {
        if (Test-Path $p) {
            $sizeBefore = (Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
            Remove-Item "$p\*.*" -Recurse -Force -ErrorAction SilentlyContinue
            $freed = [math]::Round($sizeBefore/1MB, 1)
            $totalFreed += $freed
        }
    }
    Write-Host "   ✅ Đã dọn ~${totalFreed}MB cache trình duyệt" -ForegroundColor Green
}

# ============================================================
# 6. DỌN CACHE npm/pip/yarn (free ~5-10GB)
# ============================================================
function Clear-DevCaches {
    Write-Host "📦 [6/8] DỌN CACHE LẬP TRÌNH (npm/pip/yarn - tiết kiệm ~5-10GB)..." -ForegroundColor Green
    
    # npm cache
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $npmCache = npm cache ls 2>$null
        if ($npmCache) {
            $beforeSize = (Get-ChildItem "$env:APPDATA\npm-cache" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
            npm cache clean --force 2>&1 | Out-Null
            Write-Host "   ✅ Đã dọn npm cache" -ForegroundColor Green
        }
    }
    
    # pip cache
    if (Get-Command pip -ErrorAction SilentlyContinue) {
        pip cache purge 2>&1 | Out-Null
        Write-Host "   ✅ Đã dọn pip cache" -ForegroundColor Green
    }
}

# ============================================================
# 7. DỌN LOGS & CRASH DUMP
# ============================================================
function Clean-CrashDumps {
    Write-Host "📝 [7/8] DỌN CRASH DUMP & LOG FILES..." -ForegroundColor Green
    
    # Xoá Windows crash dumps
    Remove-Item "$env:LOCALAPPDATA\CrashDumps\*.*" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$env:WINDIR\Minidump\*.*" -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host "   ✅ Đã dọn crash dumps" -ForegroundColor Green
}

# ============================================================
# 8. CHUYỂN USER FOLDERS SANG D
# ============================================================
function Move-UserFoldersToD {
    Write-Host "📂 [8/8] CHUYỂN USER FOLDERS SANG Ổ D..." -ForegroundColor Green
    
    $dFolders = @{
        "Downloads"    = "D:\Users\84916\Downloads"
        "Documents"    = "D:\Users\84916\Documents"
        "Desktop"      = "D:\Users\84916\Desktop"
        "Pictures"     = "D:\Users\84916\Pictures"
        "Videos"       = "D:\Users\84916\Videos"
        "Music"        = "D:\Users\84916\Music"
    }
    
    $shell = New-Object -ComObject Shell.Application
    $userFolder = $shell.NameSpace("shell:UsersFilesFolder").Self.Path
    
    foreach ($folder in $dFolders.Keys) {
        $sourcePath = "$userFolder\$folder"
        $targetPath = $dFolders[$folder]
        
        if (Test-Path $sourcePath) {
            # Tạo thư mục đích nếu chưa có
            if (-not (Test-Path $targetPath)) {
                New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
            }
            
            # Di chuyển dữ liệu cũ sang
            Copy-Item "$sourcePath\*" "$targetPath\" -Recurse -Force -ErrorAction SilentlyContinue
            
            # Chuyển hướng thư mục
            $shellFolder = $shell.NameSpace($sourcePath)
            if ($shellFolder) {
                $shellFolder.Self.InvokeVerb("properties")
            }
            
            Write-Host "   📋 Cần chuyển thủ công '$folder':" -ForegroundColor Yellow
            Write-Host "      1. Mở '$sourcePath'" -ForegroundColor White
            Write-Host "      2. Right-click '$folder' → Properties → Location" -ForegroundColor White
            Write-Host "      3. Đổi đường dẫn thành '$targetPath'" -ForegroundColor White
            Write-Host "      4. Click Move → Yes" -ForegroundColor White
        }
    }
}

# ============================================================
# MAIN EXECUTION
# ============================================================

Check-DiskSpace

if (-not $AutoMode) {
    Write-Host "⚠️  SCRIPT NÀY SẼ THỰC HIỆN:" -ForegroundColor Yellow
    Write-Host "   1. 🔌 Tắt Hibernation (free ~6-8GB)" 
    Write-Host "   2. 🗑️ Dọn Temp files (free ~10-20GB)"
    Write-Host "   3. 🧹 Chạy Disk Cleanup (free ~5-15GB)"
    Write-Host "   4. 🔄 Chuyển Pagefile sang D: (free ~8-16GB)"
    Write-Host "   5. 🌐 Dọn cache 4 trình duyệt (free ~5-15GB)"
    Write-Host "   6. 📦 Dọn cache npm/pip (free ~5-10GB)"
    Write-Host "   7. 📝 Dọn crash dumps"
    Write-Host "   8. 📂 Hướng dẫn chuyển User Folders sang D:"
    Write-Host ""
    $confirm = Read-Host "❓ Tiếp tục? (Y/N)"
    if ($confirm -ne 'Y' -and $confirm -ne 'y') { Write-Host "Đã huỷ."; exit }
}

Write-Host ""
Write-Host "🔄 ĐANG XỬ LÝ..." -ForegroundColor Cyan
Write-Host ""

Disable-Hibernation
Clean-TempFiles
Run-DiskCleanup
Move-PageFileToD
Clear-BrowserCaches
Clear-DevCaches
Clean-CrashDumps
Move-UserFoldersToD

# ============================================================
# KẾT THÚC
# ============================================================
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ✅ HOÀN TẤT TỐI ƯU!                       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Check-DiskSpace

if ($script:restartRequired) {
    Write-Host "⚠️  CẦN KHỞI ĐỘNG LẠI MÁY ĐỂ ÁP DỤNG THAY ĐỔI!" -ForegroundColor Red
    if (-not $AutoMode) {
        $restart = Read-Host "❓ Khởi động lại ngay? (Y/N)"
        if ($restart -eq 'Y' -or $restart -eq 'y') {
            Restart-Computer -Force
        }
    }
}

Write-Host ""
Write-Host "💡 MẸO: Chạy script này mỗi tháng 1 lần để giữ máy luôn sạch!" -ForegroundColor Cyan
Write-Host "   Right-click optimize_system.ps1 → Run with PowerShell (Admin)" -ForegroundColor Cyan
Write-Host ""
