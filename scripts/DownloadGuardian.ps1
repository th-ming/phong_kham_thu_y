<#
.SYNOPSIS
    Download Guardian - Quet ma doc real-time cho thu muc Downloads
.DESCRIPTION
    Giam sat thu muc Downloads, tu dong quet file moi bang Windows Defender
    va bao cao khi phat hien ma doc / virus / threat.
.NOTES
    Chay voi PowerShell 5.1+ tren Windows 10/11
    Can Windows Defender (MpCmdRun.exe) da cai dat
#>

# ============================================================
#  CAU HINH
# ============================================================

$DownloadPath = Join-Path $env:USERPROFILE "Downloads"
$LogDir       = Join-Path $env:USERPROFILE ".download-guardian"
$LogFile      = Join-Path $LogDir  "guardian.log"
$DebounceDir  = Join-Path $LogDir  ".seen"

# MpCmdRun.exe path
$MpCmdPaths = @(
    "C:\Program Files\Windows Defender\MpCmdRun.exe",
    "C:\Program Files (x86)\Windows Defender\MpCmdRun.exe",
    "$env:ProgramFiles\Windows Defender\MpCmdRun.exe"
)

# Extensions nguy hiem - uu tien quet
$DangerousExtensions = @(
    ".exe", ".msi", ".bat", ".cmd", ".ps1", ".vbs", ".js",
    ".wsf", ".scr", ".com", ".pif", ".reg", ".dll", ".sys",
    ".docm", ".xlsm", ".pptm", ".hta", ".cpl", ".inf"
)

# ============================================================
#  KHOI TAO
# ============================================================

foreach ($d in @($LogDir, $DebounceDir)) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# Tim MpCmdRun.exe
$MpCmd = $null
foreach ($p in $MpCmdPaths) {
    if (Test-Path $p) { $MpCmd = $p; break }
}

if (-not $MpCmd) {
    Write-Host ""
    Write-Host "  [LOI] Khong tim thay Windows Defender MpCmdRun.exe!" -ForegroundColor Red
    Write-Host "  Hay dam bao Windows Defender da duoc bat tren may." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ============================================================
#  BANNER
# ============================================================

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "    DOWNLOAD GUARDIAN - Quet Ma Doc Real-time" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Thu muc:   $DownloadPath" -ForegroundColor White
Write-Host "  Scanner:   $MpCmd" -ForegroundColor White
Write-Host "  Log:       $LogFile" -ForegroundColor White
Write-Host "  Time:      $(Get-Date -Format 'HH:mm:ss dd/MM/yyyy')" -ForegroundColor White
Write-Host ""

if (-not (Test-Path $DownloadPath)) {
    Write-Host "  [WARN] Thu muc Downloads khong ton tai. Dang tao..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DownloadPath -Force | Out-Null
}

# ============================================================
#  TOAST NOTIFICATION (Windows 10/11)
#  Phai load WinRT types TRUOC khi register event
# ============================================================

try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null
} catch {}

# ============================================================
#  FILE SYSTEM WATCHER
# ============================================================

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $DownloadPath
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::Size -bor [System.IO.NotifyFilters]::LastWrite

# ============================================================
#  EVENT HANDLER - Self-contained (chay trong runspace rieng)
#  Khong duoc goi function tu parent scope!
# ============================================================

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $name = $Event.SourceEventArgs.Name

    # === CONFIG (su dung $using: de lay tu parent scope) ===
    $mpCmd      = $using:MpCmd
    # NOTE: phai dong bo voi $DangerousExtensions o config chinh tren dau file
    $dangerExt  = @(".exe",".msi",".bat",".cmd",".ps1",".vbs",".js",".wsf",".scr",".com",".pif",".reg",".dll",".sys",".docm",".xlsm",".pptm",".hta",".cpl",".inf")
    $logDirPath = $using:LogDir
    $logFile    = $using:LogFile
    $debounceDir = Join-Path $logDirPath ".seen"

    # === BO QUA FILE TEMP ===
    if ($name -match '\.(crdownload|part|tmp|partial)$') { return }
    if ($name -match '^\~') { return }
    if ([string]::IsNullOrWhiteSpace($name)) { return }

    # === DEBOUNCE: file-based (chong scan nhieu lan) ===
    $debounceKey = $name.Replace(' ','_')
    $debounceFile = Join-Path $debounceDir $debounceKey
    if (Test-Path $debounceFile) {
        $lastSeen = (Get-Item $debounceFile).LastWriteTime
        if (((Get-Date) - $lastSeen).TotalSeconds -lt 10) {
            return  # Da quet trong 10 giay qua, bo qua
        }
    }
    Set-Content -Path $debounceFile -Value (Get-Date -Format 'o') -Encoding UTF8 -Force

    # === DOI DOWNLOAD HOAN TAT ===
    Start-Sleep -Seconds 2
    if (-not (Test-Path $path)) { return }

    # Doi file khong bi lock (download xong)
    $maxWait = 30
    $waited  = 0
    while ($waited -lt $maxWait) {
        try {
            $fs = [System.IO.File]::Open($path, 'Open', 'Read', 'None')
            $fs.Close(); $fs.Dispose()
            break
        } catch {
            Start-Sleep -Seconds 1
            $waited++
        }
    }
    if ($waited -ge $maxWait) { return }

    # === KICH THUOC FILE ===
    try {
        $fileSize = (Get-Item $path).Length
    } catch { return }

    if ($fileSize -lt 100) { return }  # File qua nho

    # === PHAN LOAI ===
    $ext = [System.IO.Path]::GetExtension($name).ToLower()
    $isDangerous = $dangerExt -contains $ext
    $priority = if ($isDangerous) { "UU TIEN" } else { "Thuong" }
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    # === LOG ===
    $logLine = "[$ts] [INFO] Quet: $name ($([math]::Round($fileSize/1KB,1)) KB) [$priority]"
    Add-Content -Path $logFile -Value $logLine -Encoding UTF8
    Write-Host "  [INFO]    Quet: $name ($([math]::Round($fileSize/1KB,1)) KB) [$priority]" -ForegroundColor Gray

    # === QUET VOI WINDOWS DEFENDER ===
    try {
        $scanResult = & $mpCmd -Scan -ScanType 3 -File "$path" 2>&1
        $exitCode = $LASTEXITCODE
        $resultText = $scanResult -join "`n"

        if ($resultText -match "found no threats") {
            # === AN TOAN ===
            $okLine = "[$ts] [OK] An toan: $name"
            Add-Content -Path $logFile -Value $okLine -Encoding UTF8
            Write-Host "  [OK]      An toan: $name" -ForegroundColor Green

            # Toast: an toan
            try {
                $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
                $xml.LoadXml("<toast duration=`"short`"><visual><binding template=`"ToastGeneric`"><text>&#x2705; File an toan</text><text>$name - Khong phat hien ma doc</text></binding></visual></toast>")
                $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
                [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Download Guardian").Show($toast)
            } catch {}
        }
        elseif ($resultText -match "Threat" -or $exitCode -eq 2) {
            # === NGUY HIEM ===
            $threatMatch = [regex]::Match($resultText, "Threat(?:\s+Name)?:?\s*(.+)")
            $threatName = if ($threatMatch.Success) { $threatMatch.Groups[1].Value.Trim() } else { "Unknown Threat" }

            $dangerLine = "[$ts] [DANGER] NGUY HIEM: $name - Threat: $threatName"
            Add-Content -Path $logFile -Value $dangerLine -Encoding UTF8
            $pathLine = "[$ts] [DANGER] File path: $path"
            Add-Content -Path $logFile -Value $pathLine -Encoding UTF8
            Write-Host "  [DANGER]  NGUY HIEM: $name - Threat: $threatName" -ForegroundColor Red -BackgroundColor Black

            # Luu chi tiet
            $detailLog = Join-Path $logDirPath "THREAT_$(Get-Date -Format 'yyyyMMdd_HHmmss')_$name.log"
            Set-Content -Path $detailLog -Value $resultText -Encoding UTF8

            # Toast: Nguy hiem!
            try {
                $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
                $xml.LoadXml("<toast duration=`"long`" scenario=`"urgent`"><visual><binding template=`"ToastGeneric`"><text>&#x1F6A8; PHAT HIEN MA DOC!</text><text>File: $name</text><text>Threat: $threatName</text><text>Da quet va ghi nhan. Hay xoa file nay!</text></binding></visual><audio src=`"ms-winsoundevent:Notification.Reminder`"/></toast>")
                $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
                [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Download Guardian").Show($toast)
            } catch {}

            # BalloonTip fallback
            try {
                Add-Type -AssemblyName System.Windows.Forms
                $notify = New-Object System.Windows.Forms.NotifyIcon
                $notify.Icon = [System.Drawing.SystemIcons]::Warning
                $notify.BalloonTipTitle = "PHAT HIEN MA DOC!"
                $notify.BalloonTipText  = "File: $name`nThreat: $threatName"
                $notify.BalloonTipIcon  = [System.Windows.Forms.ToolTipIcon]::Error
                $notify.Visible = $true
                $notify.ShowBalloonTip(10000)
                Start-Sleep -Seconds 3
                $notify.Dispose()
            } catch {}
        }
        else {
            $warnLine = "[$ts] [WARN] Quet xong (exit=$exitCode): $name"
            Add-Content -Path $logFile -Value $warnLine -Encoding UTF8
            Write-Host "  [WARN]    Quet xong (exit=$exitCode): $name" -ForegroundColor Yellow
        }
    }
    catch {
        $errLine = "[$ts] [WARN] Loi quet '$name': $_"
        Add-Content -Path $logFile -Value $errLine -Encoding UTF8
        Write-Host "  [WARN]    Loi quet '$name'" -ForegroundColor Yellow
    }
}

# ============================================================
#  REGISTER EVENTS & RUN
# ============================================================

$createdEvent = Register-ObjectEvent $watcher "Created" -Action $action
$changedEvent = Register-ObjectEvent $watcher "Changed" -Action $action

Write-Host "  [OK]      Da khoi tao thanh cong!" -ForegroundColor Green
Write-Host ""
Write-Host "  Dang giam sat... Mo trinh duyet va tai file de thu!" -ForegroundColor Green
Write-Host "  Nhan Ctrl+C de dung." -ForegroundColor Yellow
Write-Host ""

# ============================================================
#  MAIN LOOP
# ============================================================

$script:cleanupCounter = 0

try {
    while ($true) {
        Start-Sleep -Seconds 1

        # Cleanup debounce files cu (xoa sau 1 gio, moi 30 giay)
        $script:cleanupCounter++
        if ($script:cleanupCounter -ge 30) {
            $script:cleanupCounter = 0
            try {
                $cutoff = (Get-Date).AddHours(-1)
                Get-ChildItem -Path $DebounceDir -File -ErrorAction SilentlyContinue |
                    Where-Object { $_.LastWriteTime -lt $cutoff } |
                    Remove-Item -Force -ErrorAction SilentlyContinue
            } catch {}
        }
    }
}
finally {
    Write-Host ""
    Write-Host "  Dang dung Download Guardian..." -ForegroundColor Cyan
    Unregister-Event -SourceIdentifier $createdEvent.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $changedEvent.Name -ErrorAction SilentlyContinue
    $watcher.Dispose()
    Write-Host "  Da dung thanh cong. Tam biet!" -ForegroundColor Cyan
    Write-Host ""
}
