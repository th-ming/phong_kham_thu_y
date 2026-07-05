package com.rexi.pkty.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

// Global Exception Handler, log loi chi tiet debug
@RestControllerAdvice
public class BoXuLyLoiHeThong {

    private static final Logger logger = Logger.getLogger(BoXuLyLoiHeThong.class.getName());

    // Handle validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        // Get first validation error message
        String firstError = errors.values().stream().findFirst().orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", firstError));
    }

    // Handle other system errors
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Khong co quyen truy cap."));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<?> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(Map.of("message", "Phuong thuc khong duoc ho tro."));
    }        // Fallback: log full stack trace debug, sanitize message before returning
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalException(Exception ex) {
        logger.log(Level.SEVERE, "[BoXuLyLoiHeThong] Lỗi hệ thống chưa xử lý: " + ex.getMessage(), ex);
        return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống: " + sanitizeError(ex) + ". Vui lòng thử lại sau."));
    }

    /** Loại bỏ thông tin nhạy cảm (SQL, path, stack trace) khỏi message trước khi trả client */
    private static String sanitizeError(Exception ex) {
        String msg = ex.getMessage();
        if (msg == null || msg.isBlank()) return "Không rõ nguyên nhân";
        // Nếu chứa từ khóa SQL/DB → thay bằng thông báo chung
        String lower = msg.toLowerCase();
        if (lower.contains("select ") || lower.contains("insert ") || lower.contains("update ")
            || lower.contains("from ") || lower.contains("where ") || lower.contains("column")
            || lower.contains("table") || lower.contains("constraint") || lower.contains("foreign key")) {
            return "Lỗi cơ sở dữ liệu nội bộ";
        }
        // Loại bỏ đường dẫn file
        msg = msg.replaceAll("[A-Z]:\\\\[^\\s\"']*", "[path]");
        msg = msg.replaceAll("/home/[^\\s\"']*", "[path]");
        // Cắt ngắn
        if (msg.length() > 200) msg = msg.substring(0, 200) + "...";
        return msg;
    }
}
