# UltimateOptimizer.ps1 - System Optimizer for Rexi Project
# Automatically manages RAM and background processes.

$Threshold = 85  # Target: 85% RAM usage
$SleepTime = 10  # Check interval: 10 seconds
$LogFile = "d:\QLy Phòng Khám Thú Y\logs\deep_optimize.log"

if (!(Test-Path "d:\QLy Phòng Khám Thú Y\logs")) { 
    New-Item -ItemType Directory "d:\QLy Phòng Khám Thú Y\logs" | Out-Null
}

# Win32 API to empty working set
$psapi = '[DllImport("psapi.dll")] public static extern bool EmptyWorkingSet(IntPtr hProcess);'
$type = Add-Type -MemberDefinition $psapi -Name "Win32Utils" -Namespace "Win32" -PassThru -ErrorAction SilentlyContinue

Write-Host "--- CHIEN DICH TOI UU TOAN DIEN DA KICH HOAT! ---" -ForegroundColor Magenta
Write-Host "Nguong tu dong: $Threshold%" -ForegroundColor Cyan

while ($true) {
    try {
        $ComputerMemory = Get-WmiObject -Class win32_operatingsystem
        $TotalMem = $ComputerMemory.TotalVisibleMemorySize
        $FreeMem = $ComputerMemory.FreePhysicalMemory
        $MemoryUsage = [Math]::Round((($TotalMem - $FreeMem) / $TotalMem * 100), 2)

        if ($MemoryUsage -gt $Threshold) {
            $time = Get-Date -Format 'HH:mm:ss'
            $logMsg = "[$time] RAM cham nguong $MemoryUsage%! Dang tong ve sinh..."
            Write-Host $logMsg -ForegroundColor Red
            $logMsg | Out-File -FilePath $LogFile -Append

            # Empty Working Set for large processes
            if ($null -ne $type) {
                Get-Process | Where-Object { $_.WorkingSet64 -gt 30MB } | ForEach-Object {
                    try { 
                        $type::EmptyWorkingSet($_.Handle) | Out-Null 
                    } catch {
                        # Skip system/protected processes
                    }
                }
            }

            # Kill heavy specific processes
            Get-Process Antigravity -ErrorAction SilentlyContinue | Where-Object { $_.WorkingSet64 -gt 500MB } | Stop-Process -Force
            Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.WorkingSet64 -gt 500MB } | Stop-Process -Force

            # Optimize language server
            Get-Process language_server_windows_x64 -ErrorAction SilentlyContinue | ForEach-Object {
                if ($null -ne $type) {
                    try { $type::EmptyWorkingSet($_.Handle) | Out-Null } catch {}
                }
            }

            # Clean up large logs
            Get-ChildItem "d:\QLy Phòng Khám Thú Y\BackendPKTY\logs\*.log" -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 20MB } | Remove-Item -Force

            Write-Host "Done: Da toi uu xong!" -ForegroundColor Green
        }
    } catch {
        # Catch any unexpected loop errors
    }

    Start-Sleep -Seconds $SleepTime
}
