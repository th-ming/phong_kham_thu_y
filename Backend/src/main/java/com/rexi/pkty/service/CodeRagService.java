package com.rexi.pkty.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Service
public class CodeRagService {

    private static final int MAX_FILE_BYTES = 450_000;
    private static final int MAX_FILES_SCANNED = 700;
    private static final int MAX_RESULTS = 8;
    private static final int MAX_LINES_PER_FILE = 8;

    private static final Set<String> CODE_EXTENSIONS = Set.of(
            ".java", ".ts", ".tsx", ".js", ".jsx", ".css", ".properties", ".xml", ".md"
    );

    private static final List<String> SKIPPED_PATH_PARTS = List.of(
            "\\node_modules\\", "\\dist\\", "\\dev-dist\\", "\\output\\", "\\target\\",
            "\\.git\\", "\\.idea\\", "\\.vscode\\", "\\videos\\", "\\uploads\\"
    );

    private static final Pattern SECRET_LINE = Pattern.compile(
            "(?i)(api[_-]?key|secret|password|mat[_-]?khau|token|authorization|bearer|jwt|private[_-]?key)"
    );
    private static final Pattern TECHNICAL_IDENTIFIER = Pattern.compile(
            "(?i)(data-ai-id\\s*[:=]?\\s*)?([a-z][a-z0-9_]*-[a-z0-9_-]+)"
    );

    public String search(String rawQuery) {
        String query = Objects.toString(rawQuery, "").trim();
        if (query.isBlank()) {
            return "Cần từ khóa để tra cứu RAG mã nguồn. Ví dụ: trang hóa đơn, nút thêm dịch vụ, api đăng nhập, tool agent.";
        }

        Path repoRoot = resolveRepoRoot();
        List<Path> roots = List.of(
                repoRoot.resolve("Frontend/src"),
                repoRoot.resolve("Backend/src/main/java"),
                repoRoot.resolve("Backend/src/main/resources"),
                repoRoot.resolve("Backend/src/test/java")
        );

        String normalizedQuery = expandQueryTerms(normalize(query));
        List<String> tokens = queryTokens(normalizedQuery);
        List<String> exactTerms = new ArrayList<>(extractExactTerms(query));
        if (isLoginEndpointQuery(normalizedQuery)) {
            exactTerms.add("login");
        }
        if (tokens.isEmpty()) {
            return "Từ khóa quá ngắn để tra cứu RAG mã nguồn: " + query;
        }

        List<Path> files = collectFiles(roots);
        List<FileHit> hits = new ArrayList<>();
        for (Path file : files) {
            FileHit hit = scoreFile(repoRoot, file, normalizedQuery, tokens, exactTerms);
            if (hit != null && hit.score() > 0) {
                hits.add(hit);
            }
        }

        hits.sort(Comparator.comparingInt(FileHit::score).reversed()
                .thenComparing(hit -> hit.relativePath().length()));

        if (!exactTerms.isEmpty()) {
            List<FileHit> exactHits = hits.stream()
                    .filter(hit -> hit.lines().stream().anyMatch(line -> containsAnyExactTerm(line.snippet(), exactTerms)))
                    .toList();
            if (exactHits.isEmpty()) {
                return "RAG mã nguồn không tìm thấy dòng chứa đúng định danh "
                        + String.join(", ", exactTerms)
                        + " cho truy vấn \"" + query + "\". Rexi sẽ không suy đoán file/dòng; hãy kiểm tra lại data-ai-id, route, API, component hoặc function.";
            }
            hits = exactHits;
        }

        if (hits.isEmpty()) {
            return "RAG mã nguồn không tìm thấy file khớp với \"" + query + "\". Thử hỏi bằng tên màn hình, route, API, component, controller, service hoặc data-ai-id cụ thể hơn.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("RAG mã nguồn động cho \"").append(query).append("\" (file + dòng gần nhất, đã che secret nếu có):\n");
        if (!exactTerms.isEmpty()) {
            sb.append("Độ chắc chắn: CAO khi kết quả có dòng chứa đúng định danh ")
                    .append(String.join(", ", exactTerms))
                    .append(". Các dòng kế bên chỉ là ngữ cảnh trực tiếp.\n");
        } else {
            sb.append("Độ chắc chắn: TRUNG BÌNH. Nếu không có dòng chứa đúng tên file/route/API/data-ai-id/function, không được coi kết quả là kết luận chắc chắn.\n");
        }
        int limit = Math.min(MAX_RESULTS, hits.size());
        for (int i = 0; i < limit; i++) {
            FileHit hit = hits.get(i);
            sb.append("\n").append(i + 1).append(". ").append(hit.relativePath())
                    .append(" [score ").append(hit.score()).append("]\n");
            if (!hit.summary().isBlank()) {
                sb.append("- Vai trò: ").append(hit.summary()).append("\n");
            }
            for (LineHit line : hit.lines()) {
                sb.append("- Dòng ").append(line.lineNumber()).append(": ")
                        .append(line.snippet()).append("\n");
            }
        }
        sb.append("\nCách đọc: nếu kết quả là route trong App.tsx thì đó là trang; nếu là Controller thì đó là API; nếu là TSX component thì đó là UI/nút/form.");
        sb.append("\nLuật chống bịa: chỉ khẳng định file/dòng khi dòng được liệt kê có chứa định danh/từ khóa liên quan trực tiếp; nếu không, phải nói chưa đủ bằng chứng và yêu cầu thêm tên màn hình, route, API, component hoặc data-ai-id.");
        return sb.toString();
    }

    private boolean containsAnyExactTerm(String value, List<String> exactTerms) {
        String normalizedValue = normalize(value);
        for (String exactTerm : exactTerms) {
            if (normalizedValue.contains(exactTerm)) {
                return true;
            }
        }
        return false;
    }

    private boolean isLoginEndpointQuery(String normalizedQuery) {
        return containsAnyText(normalizedQuery, "dang nhap", "login", "auth")
                && containsAnyText(normalizedQuery, "api", "endpoint", "controller", "route", "dong", "line");
    }

    private boolean containsAnyText(String value, String... candidates) {
        if (value == null) return false;
        for (String candidate : candidates) {
            if (value.contains(candidate)) {
                return true;
            }
        }
        return false;
    }

    private Path resolveRepoRoot() {
        Path cwd = Paths.get("").toAbsolutePath().normalize();
        if (Files.exists(cwd.resolve("Frontend/src")) && Files.exists(cwd.resolve("Backend/src/main/java"))) {
            return cwd;
        }
        if (cwd.getFileName() != null && cwd.getFileName().toString().equalsIgnoreCase("Backend")) {
            Path parent = cwd.getParent();
            if (parent != null && Files.exists(parent.resolve("Frontend/src"))) {
                return parent;
            }
        }
        Path parent = cwd.getParent();
        if (parent != null && Files.exists(parent.resolve("Frontend/src")) && Files.exists(parent.resolve("Backend/src/main/java"))) {
            return parent;
        }
        return cwd;
    }

    private List<Path> collectFiles(List<Path> roots) {
        List<Path> files = new ArrayList<>();
        for (Path root : roots) {
            if (!Files.exists(root)) continue;
            try (Stream<Path> stream = Files.walk(root)) {
                stream.filter(Files::isRegularFile)
                        .filter(this::isCodeFile)
                        .filter(path -> !isSkipped(path))
                        .limit(MAX_FILES_SCANNED)
                        .forEach(files::add);
            } catch (IOException ignored) {
                // Bỏ qua root lỗi quyền/encoding, các root còn lại vẫn đủ để Agent định vị code.
            }
        }
        return files;
    }

    private boolean isCodeFile(Path path) {
        String name = path.getFileName().toString().toLowerCase(Locale.ROOT);
        return CODE_EXTENSIONS.stream().anyMatch(name::endsWith);
    }

    private boolean isSkipped(Path path) {
        String value = path.toAbsolutePath().normalize().toString().toLowerCase(Locale.ROOT);
        return SKIPPED_PATH_PARTS.stream().anyMatch(part -> value.contains(part.toLowerCase(Locale.ROOT)));
    }

    private FileHit scoreFile(Path repoRoot, Path file, String normalizedQuery, List<String> tokens, List<String> exactTerms) {
        try {
            if (Files.size(file) > MAX_FILE_BYTES) return null;
            List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
            String relative = repoRoot.relativize(file.toAbsolutePath().normalize()).toString().replace("\\", "/");
            String normalizedPath = normalize(relative);

            if (!exactTerms.isEmpty()) {
                List<LineHit> exactLineHits = findLineHits(lines, normalizedQuery, tokens, exactTerms);
                if (exactLineHits.isEmpty()) {
                    return null;
                }
                int exactScore = 300 + exactLineHits.size() * 20;
                for (String exactTerm : exactTerms) {
                    if (normalizedPath.contains(exactTerm)) exactScore += 60;
                }
                exactScore += metadataBoost(relative, "", tokens);
                return new FileHit(relative, exactScore, summarizeFile(relative, lines), exactLineHits);
            }

            String fullText = normalize(String.join("\n", lines));

            int score = 0;
            if (normalizedPath.contains(normalizedQuery)) score += 35;
            for (String exactTerm : exactTerms) {
                if (normalizedPath.contains(exactTerm)) score += 60;
                if (fullText.contains(exactTerm)) score += 240;
            }
            for (String token : tokens) {
                if (normalizedPath.contains(token)) score += 12;
                score += Math.min(18, countOccurrences(fullText, token) * tokenWeight(token));
            }
            if (fullText.contains(normalizedQuery)) score += 30;
            score += metadataBoost(relative, fullText, tokens);

            List<LineHit> lineHits = findLineHits(lines, normalizedQuery, tokens, exactTerms);
            if (lineHits.isEmpty() && score > 0) {
                lineHits = fallbackImportantLines(lines);
            }
            if (score <= 0 && lineHits.isEmpty()) return null;
            return new FileHit(relative, score + lineHits.size() * 3, summarizeFile(relative, lines), lineHits);
        } catch (Exception ignored) {
            return null;
        }
    }

    private int metadataBoost(String relative, String fullText, List<String> tokens) {
        int score = 0;
        String lower = relative.toLowerCase(Locale.ROOT);
        if (lower.endsWith("app.tsx") && containsAny(tokens, "route", "trang", "quan", "ly", "khach", "hang")) score += 30;
        if (lower.contains("/controller/") && containsAny(tokens, "api", "endpoint", "controller")) score += 26;
        if (lower.endsWith("/authcontroller.java") && containsAny(tokens, "dang", "nhap", "login", "auth", "xac", "thuc")) score += 120;
        if (lower.endsWith("/agentcontroller.java") && containsAny(tokens, "agent", "react", "tool")) score += 90;
        if (lower.contains("/components/header.tsx") && containsAny(tokens, "header", "dat", "lich", "booking", "mau", "color", "background")) score += 140;
        if (lower.contains("/components/chatbot/") && containsAny(tokens, "chatbot", "chat", "bot", "khung", "message", "mau", "color", "background")) score += 120;
        if (lower.endsWith("/styles/index.css") && containsAny(tokens, "css", "style", "theme", "mau", "color", "background", "primary", "surface")) score += 100;
        if (lower.contains("/service/") && containsAny(tokens, "service", "tool", "agent", "logic", "xu", "ly")) score += 18;
        if (lower.contains("/pages/") && containsAny(tokens, "trang", "page", "man", "hinh", "ui")) score += 18;
        if (fullText.contains("@requestmapping") || fullText.contains("@getmapping") || fullText.contains("@postmapping")) score += containsAny(tokens, "api", "endpoint") ? 18 : 0;
        if (fullText.contains("data-ai-id")) score += containsAny(tokens, "nut", "button", "form", "input", "data", "ai", "id") ? 18 : 0;
        return score;
    }

    private boolean containsAny(List<String> tokens, String... candidates) {
        Set<String> tokenSet = new HashSet<>(tokens);
        for (String candidate : candidates) {
            if (tokenSet.contains(candidate)) return true;
        }
        return false;
    }

    private List<LineHit> findLineHits(List<String> lines, String normalizedQuery, List<String> tokens, List<String> exactTerms) {
        Map<Integer, LineHit> exactAndContextHits = new LinkedHashMap<>();
        for (String exactTerm : exactTerms) {
            for (int i = 0; i < lines.size(); i++) {
                String normalizedLine = normalize(lines.get(i));
                if (!normalizedLine.contains(exactTerm)) continue;
                putLineHit(exactAndContextHits, i + 1, 500, lines.get(i));
                addNearbyContextLines(exactAndContextHits, lines, i, exactTerm);
            }
        }
        if (!exactAndContextHits.isEmpty()) {
            return exactAndContextHits.values().stream()
                    .sorted(Comparator.comparingInt(LineHit::score).reversed()
                            .thenComparingInt(LineHit::lineNumber))
                    .limit(MAX_LINES_PER_FILE)
                    .toList();
        }

        List<LineHit> hits = new ArrayList<>();
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i);
            String normalizedLine = normalize(line);
            int score = 0;
            if (normalizedLine.contains(normalizedQuery)) score += 40;
            for (String token : tokens) {
                if (normalizedLine.contains(token)) score += tokenWeight(token);
            }
            if (looksImportantCodeLine(normalizedLine)) score += 6;
            if (score > 0) {
                hits.add(new LineHit(i + 1, score, sanitizeLine(line)));
            }
        }
        hits.sort(Comparator.comparingInt(LineHit::score).reversed());
        return hits.stream().limit(MAX_LINES_PER_FILE).toList();
    }

    private void addNearbyContextLines(Map<Integer, LineHit> hits, List<String> lines, int zeroBasedIndex, String exactTerm) {
        int start = Math.max(0, zeroBasedIndex - 2);
        int end = Math.min(lines.size() - 1, zeroBasedIndex + 10);
        for (int j = start; j <= end; j++) {
            String normalizedLine = normalize(lines.get(j));
            boolean directStyleContext = normalizedLine.contains("background")
                    || normalizedLine.contains("color")
                    || normalizedLine.contains("style")
                    || normalizedLine.contains("className")
                    || normalizedLine.contains("onclick")
                    || normalizedLine.contains("disabled")
                    || normalizedLine.contains("data-ai-id")
                    || normalizedLine.contains(exactTerm);
            if (directStyleContext) {
                int score = normalizedLine.contains(exactTerm) ? 500 : 180 - Math.abs(j - zeroBasedIndex) * 8;
                putLineHit(hits, j + 1, score, lines.get(j));
            }
        }
    }

    private void putLineHit(Map<Integer, LineHit> hits, int lineNumber, int score, String line) {
        LineHit current = hits.get(lineNumber);
        if (current == null || score > current.score()) {
            hits.put(lineNumber, new LineHit(lineNumber, score, sanitizeLine(line)));
        }
    }

    private boolean looksImportantCodeLine(String normalizedLine) {
        return normalizedLine.contains("route path")
                || normalizedLine.contains("requestmapping")
                || normalizedLine.contains("getmapping")
                || normalizedLine.contains("postmapping")
                || normalizedLine.contains("data-ai-id")
                || normalizedLine.contains("class ")
                || normalizedLine.contains("const ")
                || normalizedLine.contains("function ");
    }

    private List<LineHit> fallbackImportantLines(List<String> lines) {
        List<LineHit> hits = new ArrayList<>();
        for (int i = 0; i < lines.size() && hits.size() < 2; i++) {
            String normalized = normalize(lines.get(i));
            if (looksImportantCodeLine(normalized)) {
                hits.add(new LineHit(i + 1, 1, sanitizeLine(lines.get(i))));
            }
        }
        return hits;
    }

    private String summarizeFile(String relative, List<String> lines) {
        String lower = relative.toLowerCase(Locale.ROOT);
        if (lower.endsWith("app.tsx")) return "Route map frontend: trang nào dùng component nào.";
        if (lower.contains("/pages/admin/")) return "Màn hình admin React.";
        if (lower.contains("/pages/customer/")) return "Màn hình khách hàng React.";
        if (lower.contains("/components/")) return "Component UI dùng lại.";
        if (lower.contains("/controller/")) return "Controller Spring Boot, nơi khai báo API endpoint.";
        if (lower.contains("/service/")) return "Service xử lý logic nghiệp vụ/tool/RAG.";
        if (lower.contains("/security/")) return "Bảo mật, JWT, phân quyền.";
        if (lines.stream().anyMatch(line -> line.contains("data-ai-id"))) return "UI có phần tử Agent có thể thao tác qua data-ai-id.";
        return "";
    }

    private int countOccurrences(String text, String token) {
        if (token.isBlank()) return 0;
        int count = 0;
        int index = 0;
        while ((index = text.indexOf(token, index)) >= 0) {
            count++;
            index += token.length();
        }
        return count;
    }

    private int tokenWeight(String token) {
        if (token.length() >= 8) return 8;
        if (token.length() >= 5) return 5;
        return 2;
    }

    private List<String> queryTokens(String normalizedQuery) {
        Set<String> stopWords = Set.of(
                "cai", "nay", "kia", "cho", "toi", "tui", "minh", "rexi", "agent",
                "o", "dau", "dong", "code", "file", "nao", "trong", "cua", "la", "va", "thi",
                "gi", "hoi", "xem", "tim", "kiem", "nhe", "nha", "um", "muon"
        );
        List<String> tokens = new ArrayList<>();
        for (String token : normalizedQuery.split("\\s+")) {
            String cleaned = token.replaceAll("[^a-z0-9_/-]", "").trim();
            if (cleaned.length() < 2 || stopWords.contains(cleaned)) continue;
            tokens.add(cleaned);
        }
        return tokens;
    }

    private List<String> extractExactTerms(String query) {
        List<String> terms = new ArrayList<>();
        Matcher matcher = TECHNICAL_IDENTIFIER.matcher(Objects.toString(query, ""));
        while (matcher.find()) {
            String term = normalize(matcher.group(2));
            if (term.length() >= 6 && !terms.contains(term)) {
                terms.add(term);
            }
        }
        return terms;
    }

    private String expandQueryTerms(String normalizedQuery) {
        String q = Objects.toString(normalizedQuery, "");
        List<String> extra = new ArrayList<>();
        if (containsAnyText(q, "mau chu", "doi mau chu", "chinh mau chu")) {
            extra.addAll(List.of("color", "font", "text", "var", "ink"));
        }
        if (containsAnyText(q, "mau nen", "doi mau nen", "chinh mau nen", "nen khung")) {
            extra.addAll(List.of("background", "backgroundcolor", "surface", "gray", "primary", "var"));
        }
        if (containsAnyText(q, "khung chat", "chatbot", "chat bot", "o chat")) {
            extra.addAll(List.of("chatbot", "chat", "bot", "chatbotcore", "chatbotshell", "message", "className"));
        }
        if (containsAnyText(q, "header", "dau trang", "thanh tren")) {
            extra.addAll(List.of("header", "nav", "logo", "booking", "dat", "lich"));
        }
        if (containsAnyText(q, "nut dat lich", "dat lich", "booking")) {
            extra.addAll(List.of("button", "data-ai-id", "button-header-datlich", "handlebookingredirect", "booking"));
        }
        if (extra.isEmpty()) return q;
        return (q + " " + String.join(" ", extra)).replaceAll("\\s+", " ").trim();
    }

    private String sanitizeLine(String line) {
        String compact = Objects.toString(line, "").replaceAll("\\s+", " ").trim();
        if (SECRET_LINE.matcher(compact).find()) {
            compact = compact.replaceAll("(?i)(=|:|Bearer\\s+)(\\s*['\"]?)[^,'\"\\s)}]+", "$1$2***");
        }
        if (compact.length() > 220) {
            compact = compact.substring(0, 217) + "...";
        }
        return compact;
    }

    private String normalize(String input) {
        String value = Normalizer.normalize(Objects.toString(input, "").toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("đ", "d");
        return value.replaceAll("[^a-z0-9_./:\\-\\s]", " ").replaceAll("\\s+", " ").trim();
    }

    private record FileHit(String relativePath, int score, String summary, List<LineHit> lines) {}

    private record LineHit(int lineNumber, int score, String snippet) {}
}
