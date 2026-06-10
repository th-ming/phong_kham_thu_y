# ============================================================
# ⏰ THIẾT LẬP BẢO TRÌ TỰ ĐỘNG HÀNG TUẦN
# ============================================================
# Chạy 1 lần duy nhất với quyền Administrator
# Tạo 2 Scheduled Tasks:
#   1. SYSTEM level: dọn Windows Temp, crash dumps, Recycle Bin
#   2. User level: dọn browser cache, user Temp
# ============================================================

#Requires -RunAsAdministrator

Write-Host "⏰ THIẾT LẬP BẢO TRÌ TỰ ĐỘNG HÀNG TUẦN" -ForegroundColor Cyan
Write-Host ""

$currentUser = $env:USERNAME
$userProfile = $env:USERPROFILE -replace '\\$',''
Write-Host "   👤 User hiện tại: $currentUser" -ForegroundColor Yellow
Write-Host "   📁 Profile path: $userProfile" -ForegroundColor Yellow
Write-Host ""

# ============================================================
# TẠO SCRIPTS
# ============================================================

# Script 1: Dọn hệ thống (chạy với SYSTEM)
$cleanSystemScript = @"
# CleanSystem.ps1 - Chạy tự động với quyền SYSTEM
`$ErrorActionPreference = "SilentlyContinue"

# Dọn Windows Temp
Remove-Item "C:\Windows\Temp\*.*" -Recurse -Force -ErrorAction SilentlyContinue

# Dọn crash dumps
Remove-Item "C:\Users\*\AppData\Local\CrashDumps\*.*" -Recurse -Force -ErrorAction SilentlyContinue

# Dọn Prefetch
Remove-Item "C:\Windows\Prefetch\*.*" -Recurse -Force -ErrorAction SilentlyContinue

# Dọn Windows Update cache cũ
Stop-Service wuauserv -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Windows\SoftwareDistribution\Download\*.*" -Recurse -Force -ErrorAction SilentlyContinue
Start-Service wuauserv -ErrorAction SilentlyContinue

# Dọn Recycle Bin (all users)
`$shell = New-Object -ComObject Shell.Application
`$shell.Namespace(10).Items() | ForEach-Object { `$_.InvokeVerb("delete") }

# Ghi log
`$logTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path "D:\maintenance_log.txt" -Value "[`$logTime] [SYSTEM] Đã dọn Windows Temp, crash dumps, Recycle Bin"
"@

# Script 2: Dọn user-level (chạy với user thật)
$cleanUserScript = @"
# CleanUser.ps1 - Chạy tự động với user $currentUser
`$ErrorActionPreference = "SilentlyContinue"
`$user = "$currentUser"
`$profilePath = "$userProfile"

# Dọn Temp của user
Remove-Item "`$profilePath\AppData\Local\Temp\*.*" -Recurse -Force -ErrorAction SilentlyContinue

# Dọn cache Chrome
`$chromePaths = @(
    "`$profilePath\AppData\Local\Google\Chrome\User Data\Default\Cache",
    "`$profilePath\AppData\Local\Google\Chrome\User Data\Default\Code Cache",
    "`$profilePath\AppData\Local\Google\Chrome\User Data\Default\Service Worker\CacheStorage"
)
foreach (`$p in `$chromePaths) {
    if (Test-Path `$p) { Remove-Item "`$p\*.*" -Recurse -Force -ErrorAction SilentlyContinue }
}

# Dọn cache Edge
`$edgePaths = @(
    "`$profilePath\AppData\Local\Microsoft\Edge\User Data\Default\Cache",
    "`$profilePath\AppData\Local\Microsoft\Edge\User Data\Default\Code Cache"
)
foreach (`$p in `$edgePaths) {
    if (Test-Path `$p) { Remove-Item "`$p\*.*" -Recurse -Force -ErrorAction SilentlyContinue }
}

# Dọn cache Opera
`$operaPath = "`$profilePath\AppData\Local\Opera Software\Opera Stable\Cache"
if (Test-Path `$operaPath) { Remove-Item "`$operaPath\*.*" -Recurse -Force -ErrorAction SilentlyContinue }

# Dọn cache CocCoc
`$coccocPath = "`$profilePath\AppData\Local\CocCoc\Browser\User Data\Default\Cache"
if (Test-Path `$coccocPath) { Remove-Item "`$coccocPath\*.*" -Recurse -Force -ErrorAction SilentlyContinue }

# Dọn npm cache
Remove-Item "`$profilePath\AppData\Local\npm-cache\*" -Recurse -Force -ErrorAction SilentlyContinue

# Dọn log files cũ
Get-ChildItem "`$profilePath\*.log" -ErrorAction SilentlyContinue | Where-Object { `$_.LastWriteTime -lt (Get-Date).AddDays(-14) } | Remove-Item -Force -ErrorAction SilentlyContinue

# Ghi log
`$logTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path "D:\maintenance_log.txt" -Value "[`$logTime] [USER] Đã dọn cache trình duyệt, Temp, npm cache"
"@

# Ghi scripts ra ổ D:
$scriptDir = "D:\"
$cleanSystemPath = Join-Path $scriptDir "clean_system.ps1"
$cleanUserPath = Join-Path $scriptDir "clean_user.ps1"

Set-Content -Path $cleanSystemPath -Value $cleanSystemScript -Force
Set-Content -Path $cleanUserPath -Value $cleanUserScript -Force

Write-Host "   ✅ Đã tạo scripts dọn dẹp trên D:\" -ForegroundColor Green

# ============================================================
# TẠO SCHEDULED TASKS
# ============================================================

# Task 1: SYSTEM-level - chạy 3:00 AM Chủ Nhật
$taskSysName = "RexiAutoClean_System"
$actionSys = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$cleanSystemPath`" -WindowStyle Hidden"
$triggerWeekly = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "03:00AM"
$settingsSys = New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principalSys = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

try {
    Register-ScheduledTask -TaskName $taskSysName -Action $actionSys -Trigger $triggerWeekly -Settings $settingsSys -Principal $principalSys -Force -ErrorAction Stop
    Write-Host "   ✅ Đã tạo Task '$taskSysName' (SYSTEM level)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Lỗi tạo $taskSysName : $($_.Exception.Message)" -ForegroundColor Yellow
}

# Task 2: User-level - chạy 3:15 AM Chủ Nhật (sau task system 15 phút)
$taskUserName = "RexiAutoClean_User"
$actionUser = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$cleanUserPath`" -WindowStyle Hidden"
$triggerUser = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "03:15AM"
$settingsUser = New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable $false
$principalUser = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$currentUser" -LogonType S4U -RunLevel Highest

try {
    Register-ScheduledTask -TaskName $taskUserName -Action $actionUser -Trigger $triggerUser -Settings $settingsUser -Principal $principalUser -Force -ErrorAction Stop
    Write-Host "   ✅ Đã tạo Task '$taskUserName' (User level)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Lỗi tạo $taskUserName : $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   → Thử tạo = InteractiveToken thay vì S4U..." -ForegroundColor Cyan
    
    # Fallback: dùng InteractiveToken
    try {
        $principalUser2 = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$currentUser" -LogonType Interactive -RunLevel Highest
        Register-ScheduledTask -TaskName $taskUserName -Action $actionUser -Trigger $triggerUser -Settings $settingsUser -Principal $principalUser2 -Force -ErrorAction Stop
        Write-Host "   ✅ Đã tạo Task '$taskUserName' (Interactive mode)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Không thể tạo $taskUserName. Làm thủ công:" -ForegroundColor Red
        Write-Host "      1. Mở taskschd.msc → Create Task" -ForegroundColor White
        Write-Host "      2. Run as user: $currentUser" -ForegroundColor White
        Write-Host "      3. Trigger: Weekly Sun 3:15AM" -ForegroundColor White
        Write-Host "      4. Action: powershell.exe -File `"$cleanUserPath`"" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "✅ HOÀN TẤT! Lịch dọn dẹp tự động:" -ForegroundColor Cyan
Write-Host "   📅 Chủ Nhật 3:00 AM → Dọn hệ thống (SYSTEM)" -ForegroundColor Green
Write-Host "   📅 Chủ Nhật 3:15 AM → Dọn user cache ($currentUser)" -ForegroundColor Green
Write-Host "   📝 Log file: D:\maintenance_log.txt" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Xem trong Task Scheduler (taskschd.msc) → tên 'RexiAutoClean_*'" -ForegroundColor Cyan
