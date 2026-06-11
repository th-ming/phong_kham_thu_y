from playwright.sync_api import sync_playwright

HTML_CONTENT = """
<!DOCTYPE html>
<html>
<body>
    <video id="vid" src="http://localhost:3005/img/meonhayfooter.mp4" muted></video>
    <canvas id="canvas"></canvas>
    <script>
        const vid = document.getElementById('vid');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        vid.addEventListener('loadeddata', () => {
            vid.currentTime = 8;
        });
        
        vid.addEventListener('seeked', () => {
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;
            // Draw frame
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            
            // Enhance image: crush blacks to make background perfectly black, increase brightness of the rest
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for(let i=0; i<data.length; i+=4) {
                let r = data[i], g = data[i+1], b = data[i+2];
                // If it's very dark (close to black background), make it pure black
                if (r < 40 && g < 40 && b < 40) {
                    data[i] = 0;
                    data[i+1] = 0;
                    data[i+2] = 0;
                } else {
                    // Brighten and increase contrast for the cat
                    data[i] = Math.min(255, r * 1.2);
                    data[i+1] = Math.min(255, g * 1.2);
                    data[i+2] = Math.min(255, b * 1.2);
                }
            }
            ctx.putImageData(imgData, 0, 0);
            
            // Output as base64
            window.extractedImage = canvas.toDataURL('image/webp', 0.9);
        });
    </script>
</body>
</html>
"""

def run():
    import os
    # Write temp html
    with open("temp_extract.html", "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)
        
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"file:///{os.path.abspath('temp_extract.html')}")
        
        # Wait for the extractedImage to be populated
        page.wait_for_function("window.extractedImage !== undefined", timeout=15000)
        base64_img = page.evaluate("window.extractedImage")
        
        if base64_img:
            import base64
            # Strip the header 'data:image/webp;base64,'
            header, encoded = base64_img.split(",", 1)
            img_data = base64.b64decode(encoded)
            
            dest_path = r"D:\QLy Phòng Khám Thú Y\Frontend\public\img\meo_vay_tay_cover.webp"
            with open(dest_path, "wb") as f:
                f.write(img_data)
            print(f"Extracted frame saved to {dest_path}")
        else:
            print("Failed to extract frame.")
            
        browser.close()
    
    os.remove("temp_extract.html")

if __name__ == '__main__':
    run()
