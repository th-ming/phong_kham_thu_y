package com.rexi.pkty.controller;

import com.rexi.pkty.entity.KhachHang;
import com.rexi.pkty.repository.KhachHangRepository;
import com.rexi.pkty.service.KhachHangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.rexi.pkty.entity.TaiKhoan;
import com.rexi.pkty.repository.TaiKhoanRepository;

@RestController
@RequestMapping("/api/khach-hang")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class KhachHangController {

    @Autowired
    private KhachHangService khachHangService;

    @Autowired
    private KhachHangRepository khachHangRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    // Báº¢O Máº¬T: Kiá»ƒm tra quyá»n nhÃ¢n viÃªn ná»™i bá»™
    private boolean isInternalStaff() {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser"))
            return false;
        String role = auth.getAuthorities().toString().toUpperCase();
        // Chá»‰ cho phÃ©p nhÃ¢n viÃªn ná»™i bá»™ xem danh sÃ¡ch khÃ¡ch
        return role.contains("ADMIN") || role.contains("STAFF") || role.contains("BAC_SI") || role.contains("QUANLY")
                || role.contains("KETOAN");
    }

    // Láº¥y danh sÃ¡ch khÃ¡ch hÃ ng
    @GetMapping
    public ResponseEntity<?> getAll() {
        if (!isInternalStaff()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem danh sÃ¡ch khÃ¡ch hÃ ng!"));
        }
        return ResponseEntity.ok(khachHangService.getAllKhachHang());
    }

    // Äáº¿m tá»•ng sá»‘ khÃ¡ch hÃ ng (cho Dashboard)
    @GetMapping("/count")
    public ResponseEntity<?> countAll() {
        if (!isInternalStaff()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem thá»‘ng kÃª!"));
        }
        return ResponseEntity.ok(khachHangRepository.count());
    }

    // TÃ¬m kiáº¿m khÃ¡ch hÃ ng theo SÄT (cho form Ä‘áº·t lá»‹ch cá»§a Admin)
    @GetMapping("/search")
    public ResponseEntity<?> searchBySdt(@RequestParam String sdt) {
        if (!isInternalStaff()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n tÃ¬m kiáº¿m khÃ¡ch hÃ ng!"));
        }
        return ResponseEntity.ok(khachHangRepository.findBySdtContaining(sdt));
    }

    // Láº¥y thÃ´ng tin 1 khÃ¡ch hÃ ng theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        // Báº¢O Máº¬T: Kiá»ƒm tra IDOR - NgÄƒn khÃ¡ch hÃ ng xem thÃ´ng tin cá»§a ngÆ°á»i khÃ¡c
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        if (username != null && !username.equals("anonymousUser")) {
            Optional<TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
            if (tkOpt.isPresent()) {
                TaiKhoan tk = tkOpt.get();
                if (tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-KH")) { // Là khách hàng
                    if (!tk.getId_khach_hang().equals(id)) {
                        return ResponseEntity.status(403).body(Map.of("message",
                                "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem thÃ´ng tin cá»§a ngÆ°á»i khÃ¡c!"));
                    }
                }
            }
        }

        return khachHangRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Cáº­p nháº­t thÃ´ng tin khÃ¡ch hÃ ng (DÃ¹ng Stored Procedure)
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody KhachHang kh) {
        try {
            // Báº¢O Máº¬T: Kiá»ƒm tra IDOR (XÃ¡c minh quyá»n sá»Ÿ há»¯u)
            org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext()
                    .getAuthentication();
            String username = (auth != null) ? auth.getName() : null;

            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: YÃªu cáº§u khÃ´ng cÃ³ Token xÃ¡c thá»±c há»£p lá»‡!"));
            }

            Optional<TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
            boolean isKhachHang = false;
            boolean isOwner = false;

            if (tkOpt.isPresent()) {
                TaiKhoan tk = tkOpt.get();
                isKhachHang = tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-KH");
                isOwner = tk.getId_khach_hang() != null && tk.getId_khach_hang().equals(id);

                if (isKhachHang && !isOwner) {
                    return ResponseEntity.status(403).body(Map.of("message",
                            "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n chá»‰nh sá»­a thÃ´ng tin cá»§a ngÆ°á»i khÃ¡c!"));
                }
            }

            List<Map<String, Object>> result = khachHangRepository.callSpUpdateKhachHang(
                    id,
                    kh.getTen_khach_hang(),
                    kh.getEmail(),
                    kh.getSdt(),
                    kh.getDia_chi());

            if (result != null && !result.isEmpty()) {
                // GHI LOG
                if (!isKhachHang) {
                    auditLogService.logAction("Cáº¬P NHáº¬T", "KhachHang", "Cáº­p nháº­t thÃ´ng tin khÃ¡ch hÃ ng ID " + id);
                }
                return ResponseEntity.ok(result.get(0));
            }
            return ResponseEntity.ok(Map.of("message", "Cáº­p nháº­t thÃ nh cÃ´ng!"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lá»—i cáº­p nháº­t: " + e.getMessage()));
        }
    }

    // VÃ´ hiá»‡u hÃ³a tÃ i khoáº£n (VÃ¹ng nguy hiá»ƒm)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivate(@PathVariable String id) {
        try {
            // Báº¢O Máº¬T: Kiá»ƒm tra IDOR (XÃ¡c minh quyá»n sá»Ÿ há»¯u)
            org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext()
                    .getAuthentication();
            String username = (auth != null) ? auth.getName() : null;

            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: YÃªu cáº§u khÃ´ng cÃ³ Token xÃ¡c thá»±c há»£p lá»‡!"));
            }

            Optional<TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
            boolean isKhachHang = false;
            boolean isOwner = false;
            if (tkOpt.isPresent()) {
                TaiKhoan tk = tkOpt.get();
                isKhachHang = tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-KH");
                isOwner = tk.getId_khach_hang() != null && tk.getId_khach_hang().equals(id);
                if (isKhachHang && !isOwner) {
                    return ResponseEntity.status(403).body(Map.of("message",
                            "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n vÃ´ hiá»‡u hÃ³a tÃ i khoáº£n cá»§a ngÆ°á»i khÃ¡c!"));
                }
            }

            khachHangRepository.deactivateAccountByKhachHangId(id);

            // Báº¢O Máº¬T: KhÃ³a luÃ´n tÃ i khoáº£n Ä‘Äƒng nháº­p Ä‘á»ƒ ngÄƒn cháº·n viá»‡c khÃ¡ch hÃ ng dÃ¹ng máº­t
            // kháº©u cÅ© Ä‘Äƒng nháº­p láº¡i
            Optional<TaiKhoan> tkToLock = taiKhoanRepository.findByIdKhachHang(id);
            if (tkToLock.isPresent()) {
                TaiKhoan tkLocked = tkToLock.get();
                tkLocked.setTrang_thai("ÄÃ£ khÃ³a");
                taiKhoanRepository.save(tkLocked);
            }

            // GHI LOG
            if (!isKhachHang) {
                auditLogService.logAction("VÃ” HIá»†U HÃ“A", "KhachHang", "VÃ´ hiá»‡u hÃ³a khÃ¡ch hÃ ng ID " + id);
            }

            return ResponseEntity.ok(Map.of("message", "VÃ´ hiá»‡u hÃ³a tÃ i khoáº£n thÃ nh cÃ´ng!"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lá»—i: " + e.getMessage()));
        }
    }

    // Phá»¥c há»“i / Má»Ÿ khÃ³a tÃ i khoáº£n (Chá»‰ dÃ nh cho Admin)
    @PutMapping("/{id}/unlock")
    public ResponseEntity<?> unlock(@PathVariable String id) {
        try {
            // Báº¢O Máº¬T: Kiá»ƒm tra quyá»n Admin
            org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext()
                    .getAuthentication();
            String currentRole = (auth != null && auth.getAuthorities() != null) ? auth.getAuthorities().toString()
                    : "";

            if (!currentRole.toUpperCase().contains("ADMIN")) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Chá»‰ Admin má»›i cÃ³ quyá»n má»Ÿ khÃ³a tÃ i khoáº£n!"));
            }

            // Má»Ÿ khÃ³a há»“ sÆ¡ KhÃ¡ch hÃ ng (Bá» Ä‘Ã¡nh dáº¥u xÃ³a)
            khachHangRepository.findById(id).ifPresent(kh -> {
                kh.setDa_xoa(false);
                khachHangRepository.save(kh);
            });

            // Má»Ÿ khÃ³a quyá»n Ä‘Äƒng nháº­p
            Optional<TaiKhoan> tkToUnlock = taiKhoanRepository.findByIdKhachHang(id);
            if (tkToUnlock.isPresent()) {
                TaiKhoan tkUnlocked = tkToUnlock.get();
                tkUnlocked.setTrang_thai("Hoáº¡t Ä‘á»™ng");
                taiKhoanRepository.save(tkUnlocked);
            }

            // GHI LOG
            auditLogService.logAction("Má»ž KHÃ“A", "KhachHang", "Phá»¥c há»“i vÃ  má»Ÿ khÃ³a khÃ¡ch hÃ ng ID " + id);

            return ResponseEntity.ok(Map.of("message", "ÄÃ£ phá»¥c há»“i vÃ  má»Ÿ khÃ³a tÃ i khoáº£n thÃ nh cÃ´ng!"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lá»—i: " + e.getMessage()));
        }
    }
}

