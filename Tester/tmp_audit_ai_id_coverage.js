const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('Frontend/src');
const CONTROL_TAGS = ['button', 'input', 'select', 'textarea', 'a'];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function summarizeMissing(items) {
  const byFile = new Map();
  for (const item of items) {
    const rel = path.relative(process.cwd(), item.file).replace(/\\/g, '/');
    if (!byFile.has(rel)) byFile.set(rel, []);
    byFile.get(rel).push(item);
  }
  return [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
}

const files = walk(ROOT);
const missing = [];
const present = [];
const malformed = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const tag of CONTROL_TAGS) {
    const re = new RegExp(`<${tag}\\b[\\s\\S]*?>`, 'gi');
    let m;
    while ((m = re.exec(text))) {
      const openTag = m[0];
      if (/^<input\b[^>]*type=["']hidden["']/i.test(openTag)) continue;
      const item = { file, line: lineOf(text, m.index), tag, snippet: openTag.replace(/\s+/g, ' ').slice(0, 220) };
      if (/data-ai-id\s*=/.test(openTag)) {
        present.push(item);
        if (/data-ai-id\s*=\s*{?\s*["']\s*["']/.test(openTag)) malformed.push(item);
      } else {
        missing.push(item);
      }
    }
  }
}

const actionFiles = [
  'Backend/src/main/java/com/rexi/pkty/controller/ChatController.java',
  'Backend/src/main/java/com/rexi/pkty/service/ReActAgentService.java',
  'Frontend/src/components/ActionExecutor.tsx',
  'Frontend/src/components/chatbot/ChatBotCore.tsx',
];
const actionTags = [];
for (const file of actionFiles) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const re = /\[(CLICK|FILL|SELECT|TOGGLE|DELETE|SCROLL|NAVIGATE):([^\]\n]+)\]/g;
  let m;
  while ((m = re.exec(text))) actionTags.push({ file, type: m[1], payload: m[2], line: lineOf(text, m.index) });
}

const allIds = new Set();
for (const item of present) {
  const m = item.snippet.match(/data-ai-id\s*=\s*(?:{`([^`]+)`}|{["']([^"']+)["']}|["']([^"']+)["'])/);
  const id = m?.[1] || m?.[2] || m?.[3];
  if (id && !id.includes('${')) allIds.add(id);
}

const suspiciousActionTags = actionTags.filter(t => {
  if (t.type === 'NAVIGATE' || t.type === 'SCROLL') return false;
  const id = t.payload.split('|')[0].split('=')[0].trim();
  if (!id || id.includes('${')) return false;
  return !allIds.has(id);
});

console.log(JSON.stringify({
  files: files.length,
  controls: present.length + missing.length,
  withDataAiId: present.length,
  missingDataAiId: missing.length,
  malformedDataAiId: malformed.length,
  actionTags: actionTags.length,
  suspiciousActionTags: suspiciousActionTags.length,
  topMissingFiles: summarizeMissing(missing).slice(0, 25).map(([file, items]) => ({ file, count: items.length, examples: items.slice(0, 5).map(x => ({ line: x.line, tag: x.tag, snippet: x.snippet })) })),
  suspiciousActionTagDetails: suspiciousActionTags.slice(0, 50),
}, null, 2));

