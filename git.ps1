# git.ps1 - Custom Git Command Interceptor for REXI PKTY
# Bắt buộc tự động push bảo toàn mã nguồn trước khi thực thi bất kỳ lệnh git nào khác.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Lấy các tham số dòng lệnh gốc
$originalArgs = $args

Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "🛡️ [REX-AI-AUTO-PUSH] PHÁT HIỆN THAO TÁC GIT - BẢO VỆ MÃ NGUỒN TỐI THƯỢNG" -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan

# Thực hiện tự động push để bảo toàn toàn bộ code mới nhất của sếp trước khi chạy lệnh khác
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

# Gọi Git thật sự (git.exe) để thực thi lệnh ban đầu của sếp
git.exe $originalArgs
