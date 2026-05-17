# UltimateOptimizer.ps1 - System Optimizer for Rexi Project (V2 - Turbo)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Threshold = 80  # Ha nguong xuong 80% de may luon muot
$SleepTime = 10  # Kiem tra nhanh hon (moi 10 giay)
$LogFile = "d:\QLy Phòng Khám Thú Y\logs\deep_optimize.log"

if (!(Test-Path "d:\QLy Phòng Khám Thú Y\logs")) { 
    New-Item -ItemType Directory "d:\QLy Phòng Khám Thú Y\logs" -Force | Out-Null
}

# Win32 API to empty working set
$psapi = '[DllImport("psapi.dll")] public static extern bool EmptyWorkingSet(IntPtr hProcess);'
$type = Add-Type -MemberDefinition $psapi -Name "Win32Utils" -Namespace "Win32" -PassThru -ErrorAction SilentlyContinue

Write-Host "--- REXI TURBO OPTIMIZER V2 ACTIVATED ---" -ForegroundColor Magenta
Write-Host "Monitoring threshold: $Threshold%" -ForegroundColor Cyan

# Ham don dep cac ung dung khong lien quan
function Clean-UnrelatedProcesses {
    $junk = @("wpscloudsvr", "CrossDeviceService", "kilo", "OneDrive", "Teams", "Cortana")
    foreach ($name in $junk) {
        Get-Process $name -ErrorAction SilentlyContinue | Stop-Process -Force
    }
}

while ($true) {
    try {
        $usage = Get-WmiObject Win32_OperatingSystem
        $MemoryUsage = [Math]::Round(($usage.TotalVisibleMemorySize - $usage.FreePhysicalMemory) / $usage.TotalVisibleMemorySize * 100, 2)

        # Luon don dep cac ung dung rac (khong can doi RAM cao)
        Clean-UnrelatedProcesses

        if ($MemoryUsage -gt $Threshold) {
            $time = Get-Date -Format 'HH:mm:ss'
            Write-Host "[$time] RAM usage $MemoryUsage%. Deep cleaning..." -ForegroundColor Yellow
            
            # 1. Giai phong Working Set
            if ($null -ne $type) {
                Get-Process | Where-Object { $_.WorkingSet64 -gt 15MB } | ForEach-Object {
                    try { $type::EmptyWorkingSet($_.Handle) | Out-Null } catch {}
                }
            }

            # 2. Diet Zombie Java/Node (Giu lai cai moi nhat)
            $javaProcesses = Get-Process java -ErrorAction SilentlyContinue
            if ($javaProcesses.Count -gt 1) {
                $javaProcesses | Sort-Object StartTime | Select-Object -First ($javaProcesses.Count - 1) | Stop-Process -Force
            }
            
            $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
            if ($nodeProcesses.Count -gt 2) { # Node thuong co 2-3 process cho 1 app, neu > 3 thi co the la zombie
                $nodeProcesses | Sort-Object StartTime | Select-Object -First ($nodeProcesses.Count - 2) | Stop-Process -Force
            }

            # 3. Don dep Explorer (Restart neu qua nang)
            $exp = Get-Process explorer
            if ($exp.WorkingSet64 -gt 300MB) {
                Stop-Process -Name explorer -Force
            }

            Write-Host "Optimization Complete! Current RAM: $([Math]::Round($MemoryUsage, 1))%" -ForegroundColor Green
        }
    } catch { }
    Start-Sleep -Seconds $SleepTime
}

