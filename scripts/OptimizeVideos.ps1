
# OptimizeVideos.ps1 - Cỗ máy phẫu thuật Video của Sếp
# HƯỚNG DẪN: 
# Tải FFmpeg tại: https://www.gyan.dev/ffmpeg/builds/ffmpeg-git-full.7z
# Giải nén và thêm thư mục 'bin' vào PATH của Windows (hoặc chép file ffmpeg.exe vào thư mục dự án này).
# Chạy script này để gọt giũa toàn bộ video.

$PublicImg = "d:\QLy Phòng Khám Thú Y\Frontend\public\img"

Write-Host "🎬 Bắt đầu phẫu thuật video cho Sếp..." -ForegroundColor Cyan

# Hàm gọt video (Cắt 15% trên, 20% dưới, chuyển sang webm)
function Optimize-Video($fileName, $startTime, $duration) {
    $input = "$PublicImg\$fileName.mp4"
    $output = "$PublicImg\$fileName.webm"
    
    if (Test-Path $input) {
        Write-Host "✂️ Đang xử lý: $fileName..." -ForegroundColor Yellow
        # Lệnh FFmpeg: Cắt thời gian + Gọt cạnh + Nén WebM (VP9)
        # crop=in_w:in_h*0.65:0:in_h*0.15 (Lấy 65% chiều cao, bắt đầu từ vị trí 15% từ trên xuống)
        $timeArgs = if ($duration) { "-ss $startTime -t $duration" } else { "" }
        
        $command = "ffmpeg -i `"$input`" $timeArgs -vf `"crop=in_w:in_h*0.65:0:in_h*0.15`" -c:v libvpx-vp9 -crf 30 -b:v 0 -an -y `"$output`""
        Invoke-Expression $command
        
        Write-Host "✅ Đã xong: $fileName.webm" -ForegroundColor Green
    } else {
        Write-Host "❌ Không tìm thấy file: $input" -ForegroundColor Red
    }
}

# Bé mèo chạy (Chỉ lấy 4 giây đầu, gọt trên dưới)
Optimize-Video "video_meo_chay" "00:00:00.2" "4"

# Bé chó chào (Gọt trên dưới, giữ nguyên độ dài)
Optimize-Video "video_cho_chao" $null $null

# Bé mèo chào (Gọt trên dưới, giữ nguyên độ dài)
Optimize-Video "video_meo_chao" $null $null

Write-Host "🚀 TẤT CẢ VIDEO ĐÃ ĐƯỢC TỐI ƯU! Sếp hãy vào code và đổi đuôi .mp4 sang .webm nhé!" -ForegroundColor Cyan
