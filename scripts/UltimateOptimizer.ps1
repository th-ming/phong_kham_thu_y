# UltimateOptimizer.ps1 - System Optimizer for Rexi Project
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Threshold = 90  # Canh bao khi RAM vuot qua 90%
$SleepTime = 15  # Kiem tra moi 15 giay
$LogFile = "d:\QLy Phòng Khám Thú Y\logs\deep_optimize.log"

if (!(Test-Path "d:\QLy Phòng Khám Thú Y\logs")) { 
    New-Item -ItemType Directory "d:\QLy Phòng Khám Thú Y\logs" -Force | Out-Null
}

# Win32 API to empty working set
$psapi = '[DllImport("psapi.dll")] public static extern bool EmptyWorkingSet(IntPtr hProcess);'
$type = Add-Type -MemberDefinition $psapi -Name "Win32Utils" -Namespace "Win32" -PassThru -ErrorAction SilentlyContinue

Write-Host "--- HE THONG VE SI RAM REXI DA SAN SANG! ---" -ForegroundColor Magenta
Write-Host "Nguong kich hoat: $Threshold%" -ForegroundColor Cyan

while ($true) {
    try {
        $usage = Get-WmiObject Win32_OperatingSystem
        $MemoryUsage = [Math]::Round(($usage.TotalVisibleMemorySize - $usage.FreePhysicalMemory) / $usage.TotalVisibleMemorySize * 100, 2)

        if ($MemoryUsage -gt $Threshold) {
            $time = Get-Date -Format 'HH:mm:ss'
            $logMsg = "[$time] RAM dang cao ($MemoryUsage%). Dang giai phong bo nho..."
            Write-Host $logMsg -ForegroundColor Yellow
            $logMsg | Out-File -FilePath $LogFile -Append

            # 1. Giai phong Working Set cho toan bo tien trinh lon
            if ($null -ne $type) {
                Get-Process | Where-Object { $_.WorkingSet64 -gt 20MB } | ForEach-Object {
                    try { $type::EmptyWorkingSet($_.Handle) | Out-Null } catch {}
                }
            }

            # 2. Xu ly cac tien trinh "ngon" RAM dac thu
            Get-Process Antigravity -ErrorAction SilentlyContinue | Where-Object { $_.WorkingSet64 -gt 800MB } | ForEach-Object {
                Write-Host "Don dep AI Agent ($($_.Id))..." -ForegroundColor DarkGray
                try { $type::EmptyWorkingSet($_.Handle) | Out-Null } catch {}
            }

            # 3. Tim va diet cac tien trinh Java/Node bi treo (Zombie)
            $javaProcesses = Get-Process java -ErrorAction SilentlyContinue
            if ($javaProcesses.Count -gt 1) {
                Write-Host "Phat hien $($javaProcesses.Count) tien trinh Java. Dang xu ly zombie..." -ForegroundColor Red
                $javaProcesses | Sort-Object StartTime | Select-Object -First ($javaProcesses.Count - 1) | Stop-Process -Force
            }

            # 4. Don dep Language Server neu no qua nang
            Get-Process language_server* -ErrorAction SilentlyContinue | Where-Object { $_.WorkingSet64 -gt 400MB } | ForEach-Object {
                try { $type::EmptyWorkingSet($_.Handle) | Out-Null } catch {}
            }

            # 5. Don dep log Backend neu qua nang
            Get-ChildItem "d:\QLy Phòng Khám Thú Y\Backend\logs\*.log" -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 20MB } | Remove-Item -Force

            Write-Host "Da giai phong xong! RAM hien tai: $([Math]::Round($MemoryUsage, 1))%" -ForegroundColor Green
        }
    } catch {
        # Silent fail to keep the loop running
    }

    Start-Sleep -Seconds $SleepTime
}
