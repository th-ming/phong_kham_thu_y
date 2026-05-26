# git.ps1 - Custom Git Command Interceptor for REXI PKTY
# Bắt buộc tự động push bảo toàn mã nguồn trước khi thực thi bất kỳ lệnh git nào khác.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Lấy các tham số dòng lệnh gốc
$originalArgs = $args

Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "🛡️ [REX-AI-AUTO-PUSH] PHÁT HIỆN THAO TÁC GIT - BẢO VỆ MÃ NGUỒN TỐI THƯỢNG" -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan

# Thực hiện tự động push để bảo toàn toàn bộ code mới nhất của trước khi chạy lệnh khác
Write-Host "🛡️ Đang quét bảo mật tìm API Key nhạy cảm trong các file thay đổi..." -ForegroundColor Yellow

# Lấy danh sách các file đang thay đổi
$changedFiles = git.exe diff --name-only
$leakedKeysFound = $false
$allowedExtensions = @(".java", ".ts", ".tsx", ".js", ".jsx", ".properties", ".env", ".py", ".json", ".md", ".txt", ".html", ".xml", ".yml", ".yaml", ".spec.ts", ".spec.js")

foreach ($file in $changedFiles) {
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    if ($allowedExtensions -contains $ext -and (Test-Path $file -PathType Leaf)) {
        $content = Get-Content -Raw -Path $file -ErrorAction SilentlyContinue
        if ($content) {
            # Quét các mẫu key nhạy cảm (Gemini, Groq, OpenRouter)
            if ($content -match "AIzaSy[A-Za-z0-9_\-]{35}" -or $content -match "gsk_[A-Za-z0-9]{48}" -or $content -match "sk-or-v1-[a-f0-9]{64}") {
                Write-Host "🚨 PHÁT HIỆN RÒ RỈ: Tìm thấy API Key nhạy cảm trong file: $file" -ForegroundColor Red
                $leakedKeysFound = $true
            }
        }
    }
}

if ($leakedKeysFound) {
    Write-Host "❌ CHẶN PUSH TỰ ĐỘNG: Lệnh Git đã bị HỦY để tránh rò rỉ API Key lên GitHub!" -ForegroundColor Red
    Write-Host "👉 Vui lòng loại bỏ hoặc ẩn các API Key trên rồi thử lại nhé sếp." -ForegroundColor Yellow
    Exit 1
}

Write-Host "🚀 Đang tự động sao lưu và đẩy toàn bộ code mới nhất lên GitHub..." -ForegroundColor Yellow
git.exe add .
# Tạo commit tin nhắn kèm mốc thời gian
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
git.exe commit -m "Auto backup before git command [$timestamp]"
$branch = git.exe branch --show-current
git.exe push origin $branch

if ($?) {
    Write-Host "✅ Bảo toàn và đẩy code mới nhất lên GitHub thành công!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Cảnh báo: Không thể push lên GitHub (Có thể do không có thay đổi hoặc chưa cấu hình upstream), vẫn tiếp tục lệnh..." -ForegroundColor Yellow
}
Write-Host "-------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "🎯 Đang thực thi lệnh Git gốc: git $originalArgs" -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""

# Gọi Git thật sự (git.exe) để thực thi lệnh ban đầu của
git.exe $originalArgs
