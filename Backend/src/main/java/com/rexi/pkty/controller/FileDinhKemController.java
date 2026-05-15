package com.rexi.pkty.controller;

import com.rexi.pkty.entity.FileDinhKem;
import com.rexi.pkty.repository.FileDinhKemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.logging.Logger;

/**
 * Quản lý File Đính kèm (Upload / Download / Delete)
 * Lưu file vào thư mục uploads/ trong project
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

    // BẢO MẬT: Hàm kiểm tra quyền thao tác với file
    private boolean hasPermission() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser"))
            return false;
        String role = auth.getAuthorities().toString().toUpperCase();
        return role.contains("ADMIN") || role.contains("BAC_SI") || role.contains("STAFF");
    }

    // Lấy danh sách file đã upload
    @GetMapping
    public ResponseEntity<?> getAllFiles() {
        if (!hasPermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem tài liệu của hệ thống!"));
        }
        try {
            // Tự động trả về danh sách từ Database
            return ResponseEntity.ok(fileDinhKemRepository.findAll());
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

            // BẢO MẬT: Khai báo Whitelist - Chỉ cho phép các định dạng an toàn
            String originalFilename = StringUtils
                    .cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
            String fileExtension = originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase()
                    : "";
            List<String> allowedExtensions = Arrays.asList(".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx",
                    ".mp4", ".mov");

            if (!allowedExtensions.contains(fileExtension)) {
                return ResponseEntity.badRequest().body(Map.of("message",
                        "Định dạng file không được phép tải lên! Hệ thống chỉ hỗ trợ Ảnh, Video ngắn và Tài liệu."));
            }

            // Phân loại thư mục
            String contentType = file.getContentType();
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

            // Tạo thư mục vật lý nếu chưa có
            Path uploadPath = Paths.get(UPLOAD_DIR + "/" + subFolder);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Xử lý tên file bằng UUID tránh trùng lặp
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
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi upload file: " + e.getMessage()));
        }
    }

    // Xóa file (BẢO MẬT: Chỉ Admin, Bác sĩ hoặc Nhân viên mới được xóa)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable String id) {
        if (!hasPermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xóa tài liệu của hệ thống!"));
        }
        try {
            return fileDinhKemRepository.findById(id).map(file -> {
                try {
                    // Lấy đường dẫn và xóa file vật lý
                    String filePathStr = file.getDuongDan().replaceFirst("^/", "");
                    Path filePath = Paths.get(filePathStr);
                    Files.deleteIfExists(filePath);

                    // Xóa dòng dữ liệu trong DB
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
}
