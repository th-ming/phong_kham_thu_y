package com.rexi.pkty.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Bộ xử lý lỗi tập trung cho toàn hệ thống Rexi.
 */
@RestControllerAdvice
public class BoXuLyLoiHeThong {

    /**
     * Xử lý lỗi khi dữ liệu đầu vào không khớp với các quy tắc bảo mật
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        // Trả về thông báo lỗi đầu tiên để hiển thị cho người dùng
        String firstError = errors.values().stream().findFirst().orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", firstError));
    }

    /**
     * Xử lý lỗi các lỗi hệ thống không mong muốn khác
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalException(Exception ex) {
        return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống: " + ex.getMessage()));
    }
}
