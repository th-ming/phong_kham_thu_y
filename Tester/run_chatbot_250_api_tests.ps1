param(
  [int]$StartId = 1,
  [int]$EndId = 250
)
$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Api = "http://127.0.0.1:8081"
$Paste224 = "C:\Users\84916\.codex\attachments\e35230b3-8783-4d90-8ca1-61d3d733000d\pasted-text.txt"
$OutDir = Join-Path $Root "output"
$JsonOut = Join-Path $OutDir ("chatbot_{0}_{1}_real_api_results.json" -f $StartId, $EndId)
$MdOut = Join-Path $OutDir ("chatbot_{0}_{1}_real_api_results.md" -f $StartId, $EndId)

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function PostJsonUtf8($uri, $obj, $headers) {
  if ($null -eq $headers) { $headers = @{} }
  $json = $obj | ConvertTo-Json -Depth 20
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType "application/json; charset=utf-8" -Body $bytes -TimeoutSec 8
}

function Write-Reports($results, $jsonPath, $mdPath) {
  try {
    $results | ConvertTo-Json -Depth 20 | Set-Content -Encoding UTF8 -Path $jsonPath
  } catch [System.IO.IOException] {
    $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $jsonPath = $jsonPath -replace "\.json$", "_$stamp.json"
    $mdPath = $mdPath -replace "\.md$", "_$stamp.md"
    $results | ConvertTo-Json -Depth 20 | Set-Content -Encoding UTF8 -Path $jsonPath
  }

  $md = New-Object System.Text.StringBuilder
  [void]$md.AppendLine("# Real API chatbot test results $StartId-$EndId")
  [void]$md.AppendLine("")
  [void]$md.AppendLine("- Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
  [void]$md.AppendLine("- Chat thuong endpoint: /api/chat")
  [void]$md.AppendLine("- Rexi Agent endpoint: /api/agent/react")
  [void]$md.AppendLine("- Test runner does not generate fake DB data. Missing prompts are marked MISSING_TEST_PROMPT.")
  [void]$md.AppendLine("")
  foreach ($r in $results) {
    [void]$md.AppendLine("## Cau $($r.id)")
    [void]$md.AppendLine("")
    [void]$md.AppendLine("Role test: $($r.role)")
    [void]$md.AppendLine("")
    [void]$md.AppendLine("Cau hoi:")
    [void]$md.AppendLine('```text')
    [void]$md.AppendLine($r.question)
    [void]$md.AppendLine('```')
    [void]$md.AppendLine("")
    [void]$md.AppendLine("Ky vong:")
    [void]$md.AppendLine('```text')
    [void]$md.AppendLine($r.expected)
    [void]$md.AppendLine('```')
    [void]$md.AppendLine("")
    [void]$md.AppendLine("Chat thuong ($($r.chat_thuong_status)):")
    [void]$md.AppendLine('```text')
    [void]$md.AppendLine($r.chat_thuong_answer)
    [void]$md.AppendLine('```')
    [void]$md.AppendLine("")
    [void]$md.AppendLine("Rexi Agent ($($r.rexi_agent_status), provider=$($r.rexi_agent_provider), tools=$($r.rexi_agent_tools)):")
    [void]$md.AppendLine('```text')
    [void]$md.AppendLine($r.rexi_agent_answer)
    [void]$md.AppendLine('```')
    [void]$md.AppendLine("")
  }
  $md.ToString() | Set-Content -Encoding UTF8 -Path $mdPath
  [pscustomobject]@{ total = $results.Count; json = $jsonPath; markdown = $mdPath } | Format-Table -AutoSize
}

function Login($username, $password) {
  return (PostJsonUtf8 "$Api/api/auth/login" @{ username = $username; password = $password } @{}).token
}

function Parse-PastedTests($path) {
  $lines = Get-Content -Encoding UTF8 -Path $path
  $items = @{}
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    if ($line -match '^\d+$') {
      $id = [int]$line
      if ($id -lt 1 -or $id -gt 250) { continue }
      $question = ""
      $expected = ""
      $j = $i + 1
      while ($j -lt $lines.Count -and [string]::IsNullOrWhiteSpace($lines[$j])) { $j++ }
      if ($j -lt $lines.Count) { $question = $lines[$j].Trim() }
      $j++
      while ($j -lt $lines.Count -and [string]::IsNullOrWhiteSpace($lines[$j])) { $j++ }
      if ($j -lt $lines.Count) { $expected = $lines[$j].Trim() }
      $items[$id] = [pscustomobject]@{ id = $id; question = $question; expected = $expected }
    }
  }
  return $items
}

function RoleForCase($id, $question, $expected) {
  $text = (($question + " " + $expected).ToLowerInvariant())
  if ($id -eq 246 -or $text.Contains("check admin") -or $text.Contains("@admin") -or $text.Contains("admin")) { return "admin" }
  if ($id -eq 248 -or $text.Contains("quan ly") -or $text.Contains("quản lý") -or $text.Contains("manager")) { return "quanly" }
  if ($id -eq 247 -or $text.Contains("role doctor") -or $text.Contains("bs minh") -or $text.Contains("bác sĩ")) { return "bacsi" }
  return "bacsi"
}

function Compact($value) {
  if ($null -eq $value) { return "" }
  return ([string]$value).Replace("`r`n", "`n").Trim()
}

function FirstText($obj) {
  if ($null -eq $obj) { return "" }
  if ($null -ne $obj.reply) { return $obj.reply }
  if ($null -ne $obj.finalAnswer) { return $obj.finalAnswer }
  if ($null -ne $obj.message) { return $obj.message }
  return ($obj | ConvertTo-Json -Depth 8)
}

$tests = Parse-PastedTests $Paste224

$schedule = @{
  241 = @("bac si Minh tuan nay da dang ky nhung lich lam nao", 'getStaffSchedule staff Minh week this')
  242 = @("9h sang mai da co may bac si truc roi", 'getSlotUsage time 09:00 date tomorrow')
  243 = @("bac si Minh voi bac si Hong ca nao trung nhau tuan sau", 'findOverlapStaff Minh Hong week next')
  244 = @("giup toi xem phan bo them bac si Lan vao ca nao cho hop ly, 9h da full 3 BS roi", 'suggest schedule from real DB, no fake slot')
  245 = @("dieu huong vao trang xep lich roi xem y ta Mai tuan nay truc ca nao", 'navigate schedule then getStaffSchedule Mai nurse this week')
  246 = @("code check slot toi da 3 bac si nam file nao", 'admin code lookup real file lines')
  247 = @("toi la BS Minh, cho toi them ca 9h sang mai", 'doctor cannot override full slot')
  248 = @("toi la quan ly, ep them BS Minh vao 9h sang mai du da 3 BS", 'manager override with log')
  249 = @("ke toan voi le tan ai ranh chieu thu 4 tuan sau de hop", 'findFreeStaff accountant reception Wed PM next week')
  250 = @("AI tu xep lich toi uu cho 5 BS tuan sau, tranh trung ca mo", 'autoSchedule 5 doctors avoid surgery overlap')
}
foreach ($k in $schedule.Keys) {
  $tests[[int]$k] = [pscustomobject]@{ id = [int]$k; question = $schedule[$k][0]; expected = $schedule[$k][1] }
}

$tokens = @{
  admin = Login "admin" "admin@rexi.com"
  quanly = Login "quanly" "quanly@rexi.com"
  bacsi = Login "bacsi" "bacsi@rexi.com"
}

$results = @()
for ($id = $StartId; $id -le $EndId; $id++) {
  if (-not $tests.ContainsKey($id)) {
    $results += [pscustomobject]@{
      id = $id
      role = ""
      question = "MISSING_TEST_PROMPT"
      expected = "No prompt for this id in current pasted files."
      chat_thuong_status = "SKIP"
      chat_thuong_answer = "MISSING_TEST_PROMPT"
      rexi_agent_status = "SKIP"
      rexi_agent_provider = ""
      rexi_agent_tools = ""
      rexi_agent_answer = "MISSING_TEST_PROMPT"
    }
    continue
  }

  $test = $tests[$id]
  $role = RoleForCase $id $test.question $test.expected
  $headers = @{ Authorization = "Bearer " + $tokens[$role] }
  $chatRoles = @("admin", "quanly", "bacsi")
  $chatRole = $chatRoles[$id % $chatRoles.Count]
  $chatHeaders = @{ Authorization = "Bearer " + $tokens[$chatRole] }

  $chatStatus = "OK"
  $chatAnswer = ""
  try {
    $chat = PostJsonUtf8 "$Api/api/chat" @{ history = @(@{ role = "user"; content = $test.question }) } $chatHeaders
    $chatAnswer = Compact (FirstText $chat)
  } catch {
    $chatStatus = "ERR"
    $chatAnswer = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message } else { $_.Exception.Message }
  }

  Start-Sleep -Milliseconds 150

  $agentStatus = "OK"
  $agentProvider = ""
  $agentTools = ""
  $agentAnswer = ""
  try {
    $agent = PostJsonUtf8 "$Api/api/agent/react" @{ query = $test.question } $headers
    $agentProvider = Compact $agent.provider
    $agentTools = (@($agent.steps | ForEach-Object { if ($_.tool) { $_.tool } }) -join ",")
    $agentAnswer = Compact $agent.finalAnswer
  } catch {
    $agentStatus = "ERR"
    $agentAnswer = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message } else { $_.Exception.Message }
  }

  $results += [pscustomobject]@{
    id = $id
    role = $role
    question = $test.question
    expected = $test.expected
    chat_thuong_status = $chatStatus
    chat_thuong_answer = $chatAnswer
    rexi_agent_status = $agentStatus
    rexi_agent_provider = $agentProvider
    rexi_agent_tools = $agentTools
    rexi_agent_answer = $agentAnswer
  }

  Write-Host ("Completed case {0}/{1}" -f $id, $EndId)
  Start-Sleep -Milliseconds 1100
}

Write-Reports $results $JsonOut $MdOut

[pscustomobject]@{
  total = $results.Count
  json = $JsonOut
  markdown = $MdOut
  missing_questions = @($results | Where-Object { $_.question -eq "MISSING_TEST_PROMPT" } | Select-Object -ExpandProperty id)
}
