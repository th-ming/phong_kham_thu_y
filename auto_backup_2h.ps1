$repoPath = "d:\QLy Phòng Khám Thú Y"
Set-Location $repoPath

while ($true) {
    Start-Sleep -Seconds 7200
    
    $status = git.exe status --porcelain
    if (![string]::IsNullOrWhiteSpace($status)) {
        $dateStr = Get-Date -Format "dd-MM-yyyy"
        
        $logStr = git.exe log --oneline --grep="^$dateStr \+ v"
        $nextVersion = 1
        
        if (![string]::IsNullOrWhiteSpace($logStr)) {
            $versions = $logStr -split "`n" | ForEach-Object {
                if ($_ -match "\+ v(\d+)$") {
                    [int]$matches[1]
                }
            }
            if ($versions) {
                $maxVersion = ($versions | Measure-Object -Maximum).Maximum
                $nextVersion = $maxVersion + 1
            }
        }
        
        $commitMsg = "$dateStr + v$nextVersion"
        git.exe add .
        git.exe commit -m $commitMsg
        
        $branch = git.exe branch --show-current
        git.exe push origin $branch
    }
}
