const fs = require('fs');
const path = require('path');

// Use built-in zip support via child_process and powershell to extract XML
const { execSync } = require('child_process');

const docxPath = path.resolve('Báo cáo thực tập/baocao 2206 v43_fixed.docx');
const tempDir = path.resolve('scripts/_docx_temp');

try {
  // Create temp dir
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  // Extract docx (it's a zip) using powershell
  execSync(`powershell -Command "Expand-Archive -Path '${docxPath}' -DestinationPath '${tempDir}' -Force"`);

  // Read document.xml
  const xmlPath = path.join(tempDir, 'word', 'document.xml');
  const xml = fs.readFileSync(xmlPath, 'utf8');

  // Extract all text runs and reconstruct paragraphs
  // Split by paragraph tags
  const paragraphs = xml.split(/<w:p[ >]/);
  
  for (const para of paragraphs) {
    // Extract all text within this paragraph
    const textMatches = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
    const text = textMatches.map(m => m[1]).join('').trim();
    
    if (!text) continue;
    
    // Check if this looks like a heading (contains 4.XX or "Chương")
    if (/^4\.\d/.test(text) || /^Chương\s/i.test(text) || /^4\.6/.test(text) || /^4\.7/.test(text) || /^4\.8/.test(text) || /^4\.9/.test(text) || /^4\.1/.test(text)) {
      console.log(text.substring(0, 300));
    }
  }

  // Cleanup
  fs.rmSync(tempDir, { recursive: true });
} catch (e) {
  console.error('Error:', e.message);
}
