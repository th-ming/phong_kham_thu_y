
# OptimizeVideos.ps1 - Co may phau thuat Video cua Sep
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
# HUONG DAN: 
# Tai FFmpeg tai: https://www.gyan.dev/ffmpeg/builds/ffmpeg-git-full.7z
# Giai nen va them thu muc 'bin' vao PATH cua Windows (hoac chep file ffmpeg.exe vao thu muc du an nay).
# Chay script nay de got giua toan bo video.

$PublicImg = "d:\QLy Phòng Khám Thú Y\Frontend\public\img"

Write-Host "🎬 Bat dau phau thuat video cho Sep..." -ForegroundColor Cyan

# Ham got video (Cat 15% tren, 20% duoi, chuyen sang webm)
function Optimize-Video($fileName, $startTime, $duration) {
    $input = "$PublicImg\$fileName.mp4"
    $output = "$PublicImg\$fileName.webm"
    
    if (Test-Path $input) {
        Write-Host "✂️ Dang xu ly: $fileName..." -ForegroundColor Yellow
        # Lenh FFmpeg: Cat thoi gian + Got canh + Nen WebM (VP9)
        # crop=in_w:in_h*0.65:0:in_h*0.15 (Lay 65% chieu cao, bat dau tu vi tri 15% tu tren xuong)
        $timeArgs = if ($duration) { "-ss $startTime -t $duration" } else { "" }
        
        $command = "ffmpeg -i `"$input`" $timeArgs -vf `"crop=in_w:in_h*0.65:0:in_h*0.15`" -c:v libvpx-vp9 -crf 30 -b:v 0 -an -y `"$output`""
        Invoke-Expression $command
        
        Write-Host "✅ Da xong: $fileName.webm" -ForegroundColor Green
    } else {
        Write-Host "❌ Khong tim thay file: $input" -ForegroundColor Red
    }
}

# Be meo chay (Chi lay 4 giay dau, got tren duoi)
Optimize-Video "video_meo_chay" "00:00:00.2" "4"

# Be cho chao (Got tren duoi, giu nguyen do dai)
Optimize-Video "video_cho_chao" $null $null

# Be meo chao (Got tren duoi, giu nguyen do dai)
Optimize-Video "video_meo_chao" $null $null

Write-Host "🚀 TAT CA VIDEO DA DUOC TOI UU! Sep hay vao code va doi duoi .mp4 sang .webm nhe!" -ForegroundColor Cyan
