# Script vá ReActAgentService.java
# 1. Bỏ toàn bộ handleDeterministicClinicAgentQuery call + method
# 2. Đưa Groq lên đầu provider fallback
# 3. Mở rộng isAffirmation

$file = "Backend\src\main\java\com\rexi\pkty\service\ReActAgentService.java"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# ===== PATCH 1: Xóa call handleDeterministicClinicAgentQuery trong run() =====
$old1 = @"
        if (normalizedQuery.matches("^(hi|hello|helo|chao|xin chao|alo|hey|test)$")) {
            String greeting = "D" + [char]7841 + ", Rexi Agent " + [char]273 + "ang ho" + [char]7841 + "t " + [char]273 + [char]7897 + "ng b" + [char]236 + "nh th" + [char]432 + [char]7901 + "ng. B" + [char]7841 + "n c" + [char]7847 + "n t" + [char]244 + "i h" + [char]7895 + " tr" + [char]7907 + " " + [char]273 + [char]7863 + "t l" + [char]7883 + "ch, xem h" + [char]7891 + " s" + [char]417 + ", tra c" + [char]7913 + "u l" + [char]7883 + "ch h" + [char]7865 + "n hay t" + [char]236 + "m th" + [char]244 + "ng tin th" + [char]250 + " y n" + [char]224 + "o?";
            steps.add(new ReActStep("FINAL", greeting, null, null, null));
            return new ReActResult(greeting, steps);
        }

        ReActResult deterministicVetResult = handleDeterministicClinicAgentQuery(
                originalUserIntent,
                normalizedQuery,
                userRole,
                steps
        );
        if (deterministicVetResult != null) {
            return deterministicVetResult;
        }
"@

Write-Host "Checking file size: $($content.Length) chars"

# Tìm và in dòng 62-76 để debug
$lines = $content -split "`r`n"
Write-Host "Total lines: $($lines.Count)"
for ($i = 61; $i -le 76; $i++) {
    Write-Host "Line $($i+1): $($lines[$i])"
}
