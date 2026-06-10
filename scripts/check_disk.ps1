Get-PSDrive C,D | Select-Object Name, @{N='FreeGB';E={[math]::Round($_.Free/1GB,2)}}, @{N='UsedGB';E={[math]::Round(($_.Used)/1GB,2)}}, @{N='TotalGB';E={[math]::Round(($_.Used+$_.Free)/1GB,2)}}
