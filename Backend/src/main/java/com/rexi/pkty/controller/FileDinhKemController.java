package com.rexi.pkty.controller;

import com.rexi.pkty.entity.FileDinhKem;
import com.rexi.pkty.repository.FileDinhKemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.logging.Logger;

/** QL File Đính kèm (Upload/Download/Delete) lưu thư mục uploads/ */
@RestController
@RequestMapping("/api/file-dinh-kem")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class FileDinhKemController {

    private static final Logger logger = Logger.getLogger(FileDinhKemController.class.getName());
    private static final String UPLOAD_DIR = "uploads";
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Map<String, Set<String>> ALLOWED_FILE_TYPES = Map.of(
            ".jpg", Set.of("image/jpeg"),
            ".jpeg", Set.of("image/jpeg"),
            ".png", Set.of("image/png"),
            ".gif", Set.of("image/gif"),
            ".pdf", Set.of("application/pdf"),
            ".doc", Set.of("application/msword"),
            ".docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            ".mp4", Set.of("video/mp4"),
            ".mov", Set.of("video/quicktime")
    );

    @Autowired
    private FileDinhKemRepository fileDinhKemRepository;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    // Fix lỗi encoding tiếng Việt
    private com.rexi.pkty.entity.FileDinhKem fixFileEncoding(com.rexi.pkty.entity.FileDinhKem file) {
        if (file == null) return null;
        file.setLoai(com.rexi.pkty.util.VietnameseTextFixer.fix(file.getLoai()));
        file.setTenFile(com.rexi.pkty.util.VietnameseTextFixer.fix(file.getTenFile()));
        return file;
    }

    // Check quyền thao tác file
    private boolean hasPermission() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser"))
            return false;
        String role = auth.getAuthorities().toString().toUpperCase();
        return role.contains("ADMIN") || role.contains("QUAN_LY") || role.contains("BAC_SI") || role.contains("Y_TA");
    }

    // Lấy danh sách file đã upload
    @GetMapping
    public ResponseEntity<?> getAllFiles() {
        if (!hasPermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem tài liệu của hệ thống!"));
        }
        try {
            // Trả list file từ DB + fix lỗi encoding tiếng Việt
            List<com.rexi.pkty.entity.FileDinhKem> files = fileDinhKemRepository.findAll();
            files.forEach(this::fixFileEncoding);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            logger.severe("Lỗi khi liệt kê danh sách file: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi đọc danh sách file: " + e.getMessage()));
        }
    }

    // Upload file mới
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "id_ho_so_benh_an", required = false) String idHoSoBenhAn) {
        if (!hasPermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền tải tài liệu lên!"));
        }
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "File trống!"));
            }

            if (file.getSize() > MAX_FILE_SIZE) {
                return ResponseEntity.badRequest().body(Map.of("message", "File quá lớn! Tối đa 10MB."));
            }

            // Check whitelist định dạng an toàn
            String originalFilename = StringUtils
                    .cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
            String fileExtension = originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase()
                    : "";
            if (!ALLOWED_FILE_TYPES.containsKey(fileExtension)) {
                return ResponseEntity.badRequest().body(Map.of("message",
                        "Định dạng file không được phép tải lên! Hệ thống chỉ hỗ trợ Ảnh, Video ngắn và Tài liệu."));
            }

            String contentType = detectFileType(file);
            if (!ALLOWED_FILE_TYPES.get(fileExtension).contains(contentType)) {
                return ResponseEntity.badRequest().body(Map.of("message",
                        "Nội dung file không khớp với định dạng khai báo!"));
            }

            // Phân loại folder lưu trữ
            String subFolder = "others/";
            String loaiFile = "Khác";

            if (contentType != null) {
                if (contentType.startsWith("image/")) {
                    subFolder = "images/";
                    loaiFile = "Hình ảnh";
                } else if (contentType.startsWith("video/")) {
                    subFolder = "videos/";
                    loaiFile = "Video";
                } else if (contentType.equals("application/pdf") || contentType.contains("document")
                        || contentType.contains("msword")) {
                    subFolder = "docs/";
                    loaiFile = "Tài liệu";
                }
            }

            // Create folder vật lý nếu chưa có
            Path uploadPath = Paths.get(UPLOAD_DIR + "/" + subFolder);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Gen tên file qua UUID tránh trùng
            String newFileName = UUID.randomUUID().toString() + fileExtension;

            Path filePath = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/" + UPLOAD_DIR + "/" + subFolder + newFileName;

            // Lưu vào Database
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
            result.put("message", "Upload thành công!");
            result.put("ten_file", originalFilename);
            result.put("loai", loaiFile);
            result.put("kich_thuoc", file.getSize());
            result.put("duong_dan", fileUrl);

            logger.info("Đã tải lên file: " + newFileName + " (" + file.getSize() + " bytes)");
            // GHI LOG
            auditLogService.logAction("UPLOAD", "FileDinhKem", "Tải lên file đính kèm: " + originalFilename);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.severe("Lỗi khi tải lên file: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi tải file lên: " + e.getMessage()));
        }
    }

    // Xóa file (ADMIN, BAC_SI, Y_TA)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable String id) {
        if (!hasPermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xóa tài liệu của hệ thống!"));
        }
        try {
            return fileDinhKemRepository.findById(id).map(file -> {
                try {
                    // Xóa file vật lý
                    String filePathStr = file.getDuongDan().replaceFirst("^/", "");
                    Path uploadRoot = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
                    Path filePath = Paths.get(filePathStr).toAbsolutePath().normalize();
                    if (!filePath.startsWith(uploadRoot)) {
                        logger.warning("Từ chối xóa file ngoài thư mục uploads: " + filePath);
                        return ResponseEntity.status(400).body(Map.of("message", "Đường dẫn file không hợp lệ."));
                    }
                    Files.deleteIfExists(filePath);

                    // Xóa record trong DB
                    fileDinhKemRepository.delete(file);
                    org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                            .getContext().getAuthentication();
                    logger.info("File bị xóa bởi " + (auth != null ? auth.getName() : "Không rõ") + ": "
                            + file.getTenFile());
                    // GHI LOG
                    auditLogService.logAction("XÓA", "FileDinhKem", "Xóa file: " + file.getTenFile());
                    return ResponseEntity.ok(Map.of("message", "Đã xóa file thành công"));
                } catch (IOException e) {
                    logger.severe("Lỗi khi xóa file vật lý: " + e.getMessage());
                    return ResponseEntity.status(500).body(Map.of("message", "Lỗi xóa file vật lý: " + e.getMessage()));
                }
            }).orElse(ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy file cần xóa.")));
        } catch (Exception e) {
            logger.severe("Lỗi khi xóa file: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi xóa file: " + e.getMessage()));
        }
    }

    private String detectFileType(MultipartFile file) throws IOException {
        byte[] header = new byte[12];
        int read;
        try (BufferedInputStream input = new BufferedInputStream(file.getInputStream())) {
            read = input.read(header);
        }
        if (read >= 3 && (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (read >= 8
                && (header[0] & 0xFF) == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
                && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A) {
            return "image/png";
        }
        if (read >= 6
                && header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46
                && header[3] == 0x38 && (header[4] == 0x37 || header[4] == 0x39) && header[5] == 0x61) {
            return "image/gif";
        }
        if (read >= 4 && header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46) {
            return "application/pdf";
        }
        if (read >= 8
                && (header[0] & 0xFF) == 0xD0 && (header[1] & 0xFF) == 0xCF
                && (header[2] & 0xFF) == 0x11 && (header[3] & 0xFF) == 0xE0
                && (header[4] & 0xFF) == 0xA1 && (header[5] & 0xFF) == 0xB1
                && header[6] == 0x1A && (header[7] & 0xFF) == 0xE1) {
            return "application/msword";
        }
        if (read >= 4 && header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        if (read >= 12 && header[4] == 0x66 && header[5] == 0x74 && header[6] == 0x79 && header[7] == 0x70) {
            if (header[8] == 0x71 && header[9] == 0x74 && header[10] == 0x20 && header[11] == 0x20) {
                return "video/quicktime";
            }
            return "video/mp4";
        }
        return "application/octet-stream";
    }
}
