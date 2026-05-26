$ErrorActionPreference = "Stop"

# Chuyển RAM ảo sang ổ D để ổ C đỡ nghẹt; máy này C còn ít dung lượng,
# còn D dư hơn 200GB nên để pagefile ở đây hợp lý hơn cho Docker + SQL Server.
$computer = Get-CimInstance -ClassName Win32_ComputerSystem
$computer | Set-CimInstance -Property @{ AutomaticManagedPagefile = $false }

Get-CimInstance -ClassName Win32_PageFileSetting | Remove-CimInstance

New-CimInstance -ClassName Win32_PageFileSetting -Property @{
    Name        = "D:\pagefile.sys"
    InitialSize = 16384
    MaximumSize = 32768
} | Out-Null

Write-Host "Da chuyen RAM ao sang D:\pagefile.sys (16GB -> 32GB)."
Write-Host "Restart may de Windows ap dung hoan toan."
Pause
