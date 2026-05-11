package com.rexi.pkty.controller;

import com.rexi.pkty.entity.FileDinhKem;
import com.rexi.pkty.repository.FileDinhKemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * Quáº£n lÃ½ File ÄÃ­nh kÃ¨m (Upload / Download / Delete)
 * LÆ°u file vÃ o thÆ° má»¥c uploads/ trong project
 */
@RestController
@RequestMapping("/api/file-dinh-kem")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class FileDinhKemController {

    private static final Logger logger = Logger.getLogger(FileDinhKemController.class.getName());
    private static final String UPLOAD_DIR = "uploads";
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Autowired
    private FileDinhKemRepository fileDinhKemRepository;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    // Báº¢O Máº¬T: HÃ m kiá»ƒm tra quyá»n thao tÃ¡c vá»›i file
    private boolean hasPermission() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser"))
            return false;
        String role = auth.getAuthorities().toString().toUpperCase();
        return role.contains("ADMIN") || role.contains("BAC_SI") || role.contains("STAFF");
    }

    // Láº¥y danh sÃ¡ch file Ä‘Ã£ upload
    @GetMapping
    public ResponseEntity<?> getAllFiles() {
        if (!hasPermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem tÃ i liá»‡u cá»§a há»‡ thá»‘ng!"));
        }
        try {
            // Tá»± Ä‘á»™ng tráº£ vá» danh sÃ¡ch tá»« Database
            return ResponseEntity.ok(fileDinhKemRepository.findAll());
        } catch (Exception e) {
            logger.severe("Lá»—i khi liá»‡t kÃª danh sÃ¡ch file: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i Ä‘á»c danh sÃ¡ch file: " + e.getMessage()));
        }
    }

    // Upload file má»›i
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "id_ho_so_benh_an", required = false) String idHoSoBenhAn) {
        if (!hasPermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n táº£i tÃ i liá»‡u lÃªn!"));
        }
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "File trá»‘ng!"));
            }

            if (file.getSize() > MAX_FILE_SIZE) {
                return ResponseEntity.badRequest().body(Map.of("message", "File quÃ¡ lá»›n! Tá»‘i Ä‘a 10MB."));
            }

            // Báº¢O Máº¬T: Khai bÃ¡o Whitelist - Chá»‰ cho phÃ©p cÃ¡c Ä‘á»‹nh dáº¡ng an toÃ n
            String originalFilename = StringUtils
                    .cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
            String fileExtension = originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase()
                    : "";
            List<String> allowedExtensions = Arrays.asList(".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx",
                    ".mp4", ".mov");

            if (!allowedExtensions.contains(fileExtension)) {
                return ResponseEntity.badRequest().body(Map.of("message",
                        "Äá»‹nh dáº¡ng file khÃ´ng Ä‘Æ°á»£c phÃ©p táº£i lÃªn! Há»‡ thá»‘ng chá»‰ há»— trá»£ áº¢nh, Video ngáº¯n vÃ  TÃ i liá»‡u."));
            }

            // PhÃ¢n loáº¡i thÆ° má»¥c
            String contentType = file.getContentType();
            String subFolder = "others/";
            String loaiFile = "KhÃ¡c";

            if (contentType != null) {
                if (contentType.startsWith("image/")) {
                    subFolder = "images/";
                    loaiFile = "HÃ¬nh áº£nh";
                } else if (contentType.startsWith("video/")) {
                    subFolder = "videos/";
                    loaiFile = "Video";
                } else if (contentType.equals("application/pdf") || contentType.contains("document")
                        || contentType.contains("msword")) {
                    subFolder = "docs/";
                    loaiFile = "TÃ i liá»‡u";
                }
            }

            // Táº¡o thÆ° má»¥c váº­t lÃ½ náº¿u chÆ°a cÃ³
            Path uploadPath = Paths.get(UPLOAD_DIR + "/" + subFolder);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Xá»­ lÃ½ tÃªn file báº±ng UUID trÃ¡nh trÃ¹ng láº·p
            String newFileName = UUID.randomUUID().toString() + fileExtension;

            Path filePath = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/" + UPLOAD_DIR + "/" + subFolder + newFileName;

            // LÆ°u vÃ o Database
            FileDinhKem newFile = new FileDinhKem();
            newFile.setId("FILE-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            newFile.setTenFile(originalFilename);
            newFile.setDuongDan(fileUrl);
            newFile.setLoai(loaiFile);
            newFile.setKichThuoc(file.getSize());
            if (idHoSoBenhAn != null && !idHoSoBenhAn.isEmpty()) {
                newFile.setIdHoSoBenhAn(idHoSoBenhAn);
            }
            fileDinhKemRepository.save(newFile);

            Map<String, Object> result = new HashMap<>();
            result.put("message", "Upload thÃ nh cÃ´ng!");
            result.put("ten_file", originalFilename);
            result.put("loai", loaiFile);
            result.put("kich_thuoc", file.getSize());
            result.put("duong_dan", fileUrl);

            logger.info("ÄÃ£ táº£i lÃªn file: " + newFileName + " (" + file.getSize() + " bytes)");
            // GHI LOG
            auditLogService.logAction("UPLOAD", "FileDinhKem", "Táº£i lÃªn file Ä‘Ã­nh kÃ¨m: " + originalFilename);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.severe("Lá»—i khi táº£i lÃªn file: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i upload file: " + e.getMessage()));
        }
    }

    // XÃ³a file (Báº¢O Máº¬T: Chá»‰ Admin, BÃ¡c sÄ© hoáº·c NhÃ¢n viÃªn má»›i Ä‘Æ°á»£c xÃ³a)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable String id) {
        if (!hasPermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a tÃ i liá»‡u cá»§a há»‡ thá»‘ng!"));
        }
        try {
            return fileDinhKemRepository.findById(id).map(file -> {
                try {
                    // Láº¥y Ä‘Æ°á»ng dáº«n vÃ  xÃ³a file váº­t lÃ½
                    String filePathStr = file.getDuongDan().replaceFirst("^/", "");
                    Path filePath = Paths.get(filePathStr);
                    Files.deleteIfExists(filePath);

                    // XÃ³a dÃ²ng dá»¯ liá»‡u trong DB
                    fileDinhKemRepository.delete(file);
                    org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                            .getContext().getAuthentication();
                    logger.info("File bá»‹ xÃ³a bá»Ÿi " + (auth != null ? auth.getName() : "KhÃ´ng rÃµ") + ": "
                            + file.getTenFile());
                    // GHI LOG
                    auditLogService.logAction("XÃ“A", "FileDinhKem", "XÃ³a file: " + file.getTenFile());
                    return ResponseEntity.ok(Map.of("message", "ÄÃ£ xÃ³a file thÃ nh cÃ´ng"));
                } catch (IOException e) {
                    logger.severe("Lá»—i khi xÃ³a file váº­t lÃ½: " + e.getMessage());
                    return ResponseEntity.status(500).body(Map.of("message", "Lá»—i xÃ³a file váº­t lÃ½: " + e.getMessage()));
                }
            }).orElse(ResponseEntity.status(404).body(Map.of("message", "KhÃ´ng tÃ¬m tháº¥y file cáº§n xÃ³a.")));
        } catch (Exception e) {
            logger.severe("Lá»—i khi xÃ³a file: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i xÃ³a file: " + e.getMessage()));
        }
    }
}

