const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const outputFile = path.join(__dirname, '../src/ai-elements.json');

let elementsDb = [];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (f.endsWith('.tsx') || f.endsWith('.jsx')) {
        callback(dirPath);
      }
    }
  });
}

// Hàm chuyển text thành slug
const toSlug = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Regex tìm các thẻ button, input, select chưa có data-ai-id
  // Giới hạn ở mức cơ bản để tránh làm hỏng JSX
  const tagRegex = /<(button|input|select)(\s+[^>]*?)?>/g;
  
  content = content.replace(tagRegex, (match, tag, attrs) => {
    if (attrs && attrs.includes('data-ai-id=')) {
        return match; // Đã có
    }
    
    // Tạo id ngẫu nhiên kết hợp tên file
    const fileName = path.basename(filePath, path.extname(filePath));
    const randomId = Math.random().toString(36).substring(2, 6);
    const aiId = `${tag}-${toSlug(fileName)}-${randomId}`;
    
    elementsDb.push({
        id: aiId,
        tag: tag,
        file: filePath.replace(srcDir, '')
    });
    
    hasChanges = true;
    
    // Thêm data-ai-id vào thẻ
    if (match.endsWith('/>')) {
        return `<${tag} data-ai-id="${aiId}"${attrs ? attrs.replace(/\/$/, '') : ' '}/>`;
    } else {
        return `<${tag} data-ai-id="${aiId}"${attrs ? attrs.replace(/>$/, '') : ' '}>`;
    }
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath.replace(srcDir, '')}`);
  }
}

console.log("Scanning directory for interactive elements...");
walkDir(srcDir, processFile);

fs.writeFileSync(outputFile, JSON.stringify(elementsDb, null, 2), 'utf8');
console.log(`Finished! Generated mapping for ${elementsDb.length} elements at ${outputFile}`);
