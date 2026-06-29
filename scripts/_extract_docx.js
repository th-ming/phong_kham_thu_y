const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const docxPath = path.join('Báo cáo thực tập', 'baocao 2206 v43_fixed.docx');
const tempDir = path.join(__dirname, '_docx_temp');

try {
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  // Use PowerShell to extract docx (it's a zip)
  const cmd = `powershell -Command "Expand-Archive -Path '${docxPath}' -DestinationPath '${tempDir}' -Force"`;
  execSync(cmd, { cwd: process.cwd() });

  const xmlPath = path.join(tempDir, 'word', 'document.xml');
  const xml = fs.readFileSync(xmlPath, 'utf8');

  // Split by paragraph tags
  const paragraphs = xml.split(/<w:p[ >]/);
  
  let inChapter4 = false;
  let chapter4Text = [];
  
  for (const para of paragraphs) {
    const textMatches = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
    const text = textMatches.map(m => m[1]).join('').trim();
    
    if (!text) continue;
    
    // Detect chapter 4 start
    if (/^Chương\s*4/i.test(text) || /^4\.\s/.test(text) || /^CHƯƠNG\s*4/i.test(text)) {
      inChapter4 = true;
      chapter4Text.push('=== CHƯƠNG 4 ===');
    }
    
    // Detect chapter 5 start (stop)
    if (inChapter4 && (/^Chương\s*5/i.test(text) || /^5\.\s/.test(text) || /^CHƯƠNG\s*5/i.test(text))) {
      inChapter4 = false;
      break;
    }
    
    if (inChapter4) {
      chapter4Text.push(text);
    }
  }

  if (chapter4Text.length > 0) {
    console.log(chapter4Text.join('\n'));
  } else {
    // If chapter 4 not found, print all headings to help locate
    console.log('=== KHÔNG TÌM THẤY CHƯƠNG 4. DANH SÁCH HEADINGS: ===');
    for (const para of paragraphs) {
      const textMatches = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
      const text = textMatches.map(m => m[1]).join('').trim();
      if (text && (/Chương|CHƯƠNG|Chapter|^\d+\.\d+\s|^\d+\.\s/i.test(text))) {
        console.log(text);
      }
    }
  }

  // Cleanup
  fs.rmSync(tempDir, { recursive: true });
} catch (e) {
  console.error('Error:', e.message);
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
}
