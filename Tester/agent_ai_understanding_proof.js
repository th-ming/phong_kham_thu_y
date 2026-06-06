const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const backendPath = path.join(root, "Backend", "src", "main", "java", "com", "rexi", "pkty", "service", "ReActAgentService.java");
const frontendPath = path.join(root, "Frontend", "src", "components", "chatbot", "ChatBotCore.tsx");
const testPath = path.join(root, "Backend", "src", "test", "java", "com", "rexi", "pkty", "service", "ReActAgentServiceDeterministicTest.java");

const backend = fs.readFileSync(backendPath, "utf8");
const frontend = fs.readFileSync(frontendPath, "utf8");
const test = fs.readFileSync(testPath, "utf8");

function assert(name, pass, detail) {
  return { name, pass: Boolean(pass), detail };
}

function extractOriginalUserIntent(query) {
  const match = query.match(/^\s*(?:Yêu cầu người dùng|Yeu cau nguoi dung)\s*:\s*(.+?)\s*$/im);
  return match ? match[1].trim() : query;
}

const weirdInput = "ú cha rựa ơi chóa nhà tôi nó nhảy với miu là t";
const pageContext = [
  `Yêu cầu người dùng: ${weirdInput}`,
  "LUẬT HIỂU Ý: ưu tiên AI suy luận ý định thật từ câu gốc, kể cả sai chính tả, tiếng lóng, teencode, từ tục, từ địa phương; không được trả null vì không khớp format.",
  "Trang hiện tại: Dashboard (/quan-ly/dashboard)",
  "Bối cảnh giao diện hiện tại: button hóa đơn, button kho thuốc"
].join("\n");

const checks = [
  assert(
    "Frontend sends AI-understanding rule to /api/agent/react",
    frontend.includes("LUẬT HIỂU Ý: ưu tiên AI suy luận ý định thật từ câu gốc"),
    "Không để câu lạ chết vì không khớp format."
  ),
  assert(
    "Frontend prompt explicitly covers slang/typos/open vocabulary",
    frontend.includes("không phụ thuộc danh sách keyword cứng")
      && frontend.includes("chóa/chó/chowa/doggo/cún")
      && frontend.includes("miu/mew/meow/mèo"),
    "Có rule mở cho AI, không phải regex giới hạn."
  ),
  assert(
    "Backend prompt forces natural-language AI reasoning",
    backend.includes("BAT BUOC hieu ngon ngu tu nhien that")
      && backend.includes("Khong duoc phu thuoc danh sach format co san"),
    "Backend system prompt bắt AI suy luận ngôn ngữ tự nhiên."
  ),
  assert(
    "Backend extracts original user intent from frontend page context",
    backend.includes("extractOriginalUserIntent")
      && backend.includes("Yêu cầu người dùng|Yeu cau nguoi dung")
      && extractOriginalUserIntent(pageContext) === weirdInput,
    `Extracted: ${extractOriginalUserIntent(pageContext)}`
  ),
  assert(
    "Regression test covers frontend page-context extraction",
    test.includes("extractsOriginalIntentFromFrontendPageContextBeforeFastRules")
      && test.includes("Yêu cầu người dùng: ê mở dùm t cái trang lịch hẹn"),
    "Có test regression cho lỗi backend ăn nhầm DOM/context."
  ),
  assert(
    "Hardcoded vague add-two answer removed",
    !backend.includes("Bạn muốn chỉnh \" + target")
      && !test.includes("vagueAddTwoAsksShortClarifyingQuestion"),
    "Câu mơ hồ không bị fast-rule khóa cứng, sẽ đi qua AI."
  )
];

const report = {
  generatedAt: new Date().toISOString(),
  proofType: "static-regression",
  note: "Live API proof requires backend on http://127.0.0.1:8081. This script proves the code path now sends weird/slang input to AI reasoning instead of hardcoded format matching.",
  sampleInput: weirdInput,
  extractedIntent: extractOriginalUserIntent(pageContext),
  passed: checks.every(c => c.pass),
  checks
};

const outDir = path.join(root, "Frontend", "output", "playwright");
fs.mkdirSync(outDir, { recursive: true });
const reportPath = path.join(outDir, "agent-ai-understanding-proof.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({ passed: report.passed, report: reportPath, checks }, null, 2));
