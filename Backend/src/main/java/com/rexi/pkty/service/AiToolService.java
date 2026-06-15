package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.security.RoleAccessPolicy;
import com.rexi.pkty.util.DatabaseDialect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.logging.Logger;

// * * ─Éß╗ïnh ngh─⌐a v├á thß╗▒c thi 10 tools thß╗▒c tß║┐ cho ReAct Agent (Level 5). * Mß╗ùi tool l├á mß╗Öt h├ánh ─æß╗Öng cß╗Ñ thß╗â vß╗¢i DB hoß║╖c dß╗ïch vß╗Ñ ngo├ái.
@Service
public class AiToolService {

    private static final Logger logger = Logger.getLogger(AiToolService.class.getName());
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmailService emailService;

    @Autowired(required = false)
    private CodeRagService codeRagService;

    @Autowired
    @Lazy
    private AiToolService self;

    private final ObjectMapper mapper = new ObjectMapper();

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    // SCHEMA M├ö Tß║ó TOOLS ΓÇö inject v├áo system prompt
    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    public String getToolsSchemaForRole(String userRole) {
        if (RoleAccessPolicy.isCustomerRole(userRole)) {
            return getCustomerToolsSchema();
        }
        return getStaffToolsSchemaForRole(userRole);
    }

    private String getStaffToolsSchemaForRole(String userRole) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
            Bß║ín l├á agent nß╗Öi bß╗Ö ph├▓ng kh├ím. CHß╗ê ─æ╞░ß╗úc gß╗ìi c├íc tool trong danh s├ích d╞░ß╗¢i ─æ├óy (theo quyß╗ün vai tr├▓).
            Khi cß║ºn thß╗▒c hiß╗çn, trß║ú vß╗ü JSON: {"tool": "<t├¬n_tool>", "params": {<tham_sß╗æ>}}
            
            TOOLS ─É╞»ß╗óC PH├ëP Vß╗ÜI VAI TR├Æ HIß╗åN Tß║áI:
            """);
        appendToolIfAllowed(sb, userRole, "tim_lich_hen_hom_nay",
            "Lß║Ñy danh s├ích lß╗ïch hß║╣n kh├ím. C├│ thß╗â lß╗ìc theo t├¬n b├íc s─⌐ bß║▒ng 'tu_khoa_bac_si'. Truyß╗ün 'pham_vi'='all' ─æß╗â lß║Ñy to├án bß╗Ö lß╗ïch sß╗¡, mß║╖c ─æß╗ïnh chß╗ë h├┤m nay.", "{\"pham_vi\": \"hom_nay|all\", \"tu_khoa_bac_si\": \"Minh\"}");
        appendToolIfAllowed(sb, userRole, "tim_khach_hang",
            "T├¼m kh├ích h├áng theo t├¬n, S─ÉT hoß║╖c Email. ─Éiß╗ün 'mß╗¢i' hoß║╖c ─æß╗â trß╗æng ─æß╗â t├¼m kh├ích h├áng ─æ─âng k├╜ h├┤m nay.", "{\"tu_khoa\": \"...\"}");
        appendToolIfAllowed(sb, userRole, "tim_thu_cung",
            "T├¼m th├║ c╞░ng theo t├¬n, lo├ái hoß║╖c ID.", "{\"tu_khoa\": \"...\"}");
        appendToolIfAllowed(sb, userRole, "xem_benh_an",
            "Xem lß╗ïch sß╗¡ bß╗çnh ├ín th├║ c╞░ng.", "{\"id_thu_cung\": \"...\"}");
        appendToolIfAllowed(sb, userRole, "tim_lich_trong",
            "T├¼m khung giß╗¥ trß╗æng theo ng├áy.", "{\"ngay\": \"YYYY-MM-DD\"}");
        appendToolIfAllowed(sb, userRole, "dat_lich_hen",
            "Tß║ío lß╗ïch hß║╣n mß╗¢i (phß║úi hß╗Åi x├íc nhß║¡n tr╞░ß╗¢c).",
            "{\"id_khach_hang\":\"...\",\"id_thu_cung\":\"...\",\"id_bac_si\":\"...\",\"id_dich_vu\":\"...\",\"ngay_kham\":\"YYYY-MM-DD\",\"gio_kham\":\"HH:mm\",\"ghi_chu\":\"...\"}");
        appendToolIfAllowed(sb, userRole, "huy_lich_hen",
            "Hß╗ºy lß╗ïch hß║╣n. Kh├ích h├áng chß╗ë ─æ╞░ß╗úc hß╗ºy lß╗ïch cß╗ºa ch├¡nh m├¼nh; nß╗Öi bß╗Ö c├│ thß╗â hß╗ºy hß╗Ö sau khi x├íc ─æß╗ïnh ─æ├║ng lß╗ïch.",
            "{\"id_lich_hen\":\"...\",\"tu_khoa_khach\":\"t├¬n/S─ÉT nß║┐u ch╞░a c├│ m├ú lß╗ïch\",\"thoi_gian\":\"hom_nay|chieu_nay|ngay_mai\"}");
        appendToolIfAllowed(sb, userRole, "them_thu_cung",
            "Th├¬m th├║ c╞░ng mß╗¢i. Kh├ích h├áng chß╗ë ─æ╞░ß╗úc th├¬m cho ch├¡nh t├ái khoß║ún ─æang ─æ─âng nhß║¡p.",
            "{\"ten_thu_cung\":\"...\",\"loai\":\"Ch├│|M├¿o|...\",\"giong\":\"...\",\"gioi_tinh\":\"─Éß╗▒c|C├íi|Kh├┤ng x├íc ─æß╗ïnh\",\"mau_sac\":\"...\",\"trong_luong\":\"3.2\",\"ngay_sinh\":\"YYYY-MM-DD\",\"ghi_chu\":\"...\",\"id_khach_hang\":\"chß╗ë nß╗Öi bß╗Ö mß╗¢i truyß╗ün\"}");
        appendToolIfAllowed(sb, userRole, "cap_nhat_benh_an",
            "Cß║¡p nhß║¡t th├┤ng tin bß╗çnh ├ín chuy├¬n m├┤n. Chß╗ë b├íc s─⌐/y t├í/quß║ún trß╗ï l├óm s├áng ─æ╞░ß╗úc d├╣ng.",
            "{\"id_ho_so_benh_an\":\"...\",\"trieu_chung\":\"...\",\"chan_doan\":\"...\",\"phac_do_dieu_tri\":\"...\",\"huong_dan_cham_soc\":\"...\"}");
        String khoThuocDesc = (RoleAccessPolicy.normalizeRole(userRole).equals("bac_si") || RoleAccessPolicy.normalizeRole(userRole).equals("y_ta"))
            ? "Kiß╗âm tra tß╗ôn kho thuß╗æc. D├╣ng ─æß╗â tra cß╗⌐u xem thuß╗æc ─æß╗ïnh k├¬ c├▓n kh├┤ng hoß║╖c tham khß║úo th├ánh phß║ºn."
            : "Kiß╗âm tra tß╗ôn kho thuß╗æc. ─É├óy l├á dß╗» liß╗çu kho, kh├┤ng tß╗▒ biß║┐n th├ánh chß╗ë ─æß╗ïnh ─æiß╗üu trß╗ï v├¼ vai tr├▓ kh├┤ng phß║úi l├óm s├áng.";
        appendToolIfAllowed(sb, userRole, "xem_kho_thuoc", khoThuocDesc, "{\"tu_khoa\": \"\"}");
        appendToolIfAllowed(sb, userRole, "thong_ke_doanh_thu",
            "Thß╗æng k├¬ doanh thu.", "{\"khoang_thoi_gian\": \"hom_nay|tuan_nay|thang_nay\"}");
        appendToolIfAllowed(sb, userRole, "thong_ke_ca_kham_bac_si",
            "Thß╗æng k├¬ sß╗æ ca kh├ím/lß╗ïch hß║╣n theo b├íc s─⌐. D├╣ng cho c├óu hß╗Åi b├íc s─⌐ n├áo nhiß╗üu ca nhß║Ñt, ├¡t ca nhß║Ñt, tß║úi/bß║¡n nhß║Ñt.",
            "{\"khoang_thoi_gian\": \"hom_nay|tuan_nay|thang_nay|all\", \"sap_xep\": \"nhieu_nhat|it_nhat\"}");
        appendToolIfAllowed(sb, userRole, "thong_ke_khach_hang_hom_nay",
            "─Éß║┐m kh├ích h├áng mß╗¢i h├┤m nay v├á ph├ón t├¡ch xu h╞░ß╗¢ng lß╗ïch hß║╣n h├┤m nay tß╗½ dß╗» liß╗çu hß╗ç thß╗æng. Kh├┤ng ─æ╞░ß╗úc tß╗▒ ╞░ß╗¢c l╞░ß╗úng nß║┐u DB thiß║┐u dß╗» liß╗çu.",
            "{\"gom_xu_huong\": \"true|false\"}");
        appendToolIfAllowed(sb, userRole, "tim_kiem_web",
            "T├¼m th├┤ng tin y khoa tr├¬n web.", "{\"query\": \"...\"}");
        appendToolIfAllowed(sb, userRole, "gui_email_don_le",
            "Gß╗¡i email (phß║úi hß╗Åi x├íc nhß║¡n tr╞░ß╗¢c).", "{\"email\":\"...\",\"tieu_de\":\"...\",\"noi_dung\":\"...\"}");
        appendToolIfAllowed(sb, userRole, "kiem_tra_cau_hinh_ai",
            "Kiß╗âm tra cß║Ñu h├¼nh AI (kh├┤ng tiß║┐t lß╗Ö API key).", "{}");
        appendToolIfAllowed(sb, userRole, "kiem_tra_kien_truc_he_thong",
            "Xem bß║ún ─æß╗ô m├ú nguß╗ôn, luß╗ông Agent v├á provider ─æang d├╣ng ß╗ƒ mß╗⌐c kiß║┐n tr├║c.", "{}");
        appendToolIfAllowed(sb, userRole, "tra_cuu_ma_nguon",
            "Tra cß╗⌐u RAG m├ú nguß╗ôn theo tß╗½ kh├│a. Trß║ú file, route/API, d├▓ng code gß║ºn nhß║Ñt v├á snippet ─æ├ú che secret. D├╣ng khi admin hß╗Åi chß╗⌐c n─âng nß║▒m ß╗ƒ ─æ├óu, trang n├áo, file n├áo, d├▓ng n├áo.",
            "{\"tu_khoa\":\"trang h├│a ─æ╞ín|n├║t th├¬m dß╗ïch vß╗Ñ|api ─æ─âng nhß║¡p|agent provider|...\"}");
        appendToolIfAllowed(sb, userRole, "kiem_tra_phan_he",
            "Xem ph├ón hß╗ç v├á route hß╗ç thß╗æng.", "{}");
        appendToolIfAllowed(sb, userRole, "xem_hoa_don",
            "Xem h├│a ─æ╞ín theo trß║íng th├íi.", "{\"trang_thai\": \"CHO_THANH_TOAN|DA_THANH_TOAN|all\"}");
        appendToolIfAllowed(sb, userRole, "thao_tac_tai_khoan",
            "Kh├│a/mß╗ƒ kh├│a/x├│a mß╗üm t├ái khoß║ún (bß║»t buß╗Öc x├íc nhß║¡n tr╞░ß╗¢c).",
            "{\"id_khach_hang\":\"...\",\"hanh_dong\":\"KHOA|XOA|MO_KHOA\",\"xac_nhan\":true}");
        appendToolIfAllowed(sb, userRole, "tim_tai_khoan_bi_khoa",
            "Danh s├ích t├ái khoß║ún bß╗ï kh├│a.", "{}");
        appendToolIfAllowed(sb, userRole, "tra_cuu_tai_lieu_y_khoa",
            "Tra cß╗⌐u t├ái liß╗çu VNUA, gi├ío tr├¼nh th├║ y, ph├íc ─æß╗ô ─æiß╗üu trß╗ï sß║┐p ─æ├ú tß║úi l├¬n hß╗ç thß╗æng.", "{\"tu_khoa\":\"...\"}");
        sb.append("""
            
            Khi ─æß╗º th├┤ng tin: {"final_answer": "<c├óu trß║ú lß╗¥i>"}
            TUYß╗åT ─Éß╗ÉI kh├┤ng gß╗ìi tool kh├┤ng c├│ trong danh s├ích tr├¬n. Nß║┐u user y├¬u cß║ºu dß╗» liß╗çu ngo├ái quyß╗ün, giß║úi th├¡ch v├á h╞░ß╗¢ng dß║½n mß╗ƒ ─æ├║ng ph├ón hß╗ç tr├¬n web.
            """);
        return sb.toString();
    }

    private void appendToolIfAllowed(StringBuilder sb, String userRole, String tool, String desc, String params) {
        if (RoleAccessPolicy.canUseAgentTool(userRole, tool)) {
            sb.append("\n- ").append(tool).append(": ").append(desc).append(" Params: ").append(params);
        }
    }

    public String getCustomerToolsSchema() {
        return """
            Bß║ín l├á mß╗Öt agent hß╗ù trß╗ú kh├ích h├áng cß╗ºa ph├▓ng kh├ím th├║ y Rexi.
            Kh├ích h├áng chß╗ë ─æ╞░ß╗úc d├╣ng c├íc TOOL an to├án sau. Tuyß╗çt ─æß╗æi kh├┤ng truy vß║Ñn danh s├ích kh├ích h├áng, t├ái khoß║ún, bß╗çnh ├ín nß╗Öi bß╗Ö, h├│a ─æ╞ín to├án hß╗ç thß╗æng, doanh thu, kho thuß╗æc hay thao t├íc t├ái khoß║ún.
            Khi cß║ºn thß╗▒c hiß╗çn mß╗Öt h├ánh ─æß╗Öng, h├úy trß║ú vß╗ü CH├ìNH X├üC ─æß╗ïnh dß║íng JSON sau (kh├┤ng k├¿m text kh├íc):
            {"tool": "<t├¬n_tool>", "params": {<tham_sß╗æ>}}

            DANH S├üCH TOOLS KH├üCH H├ÇNG ─É╞»ß╗óC D├ÖNG:

            1. tim_lich_trong
               M├┤ tß║ú: T├¼m khung giß╗¥ trß╗æng c├▓n khß║ú dß╗Ñng ─æß╗â ─æß║╖t lß╗ïch kh├ím theo ng├áy.
               Params: {"ngay": "YYYY-MM-DD"}

            2. huy_lich_hen
               M├┤ tß║ú: Hß╗ºy lß╗ïch hß║╣n cß╗ºa ch├¡nh kh├ích h├áng ─æang ─æ─âng nhß║¡p. Kh├┤ng ─æ╞░ß╗úc hß╗ºy lß╗ïch cß╗ºa kh├ích kh├íc.
               Params: {"id_lich_hen": "m├ú lß╗ïch nß║┐u c├│", "thoi_gian": "hom_nay|chieu_nay|ngay_mai nß║┐u ch╞░a c├│ m├ú"}

            3. them_thu_cung
               M├┤ tß║ú: Th├¬m th├║ c╞░ng cho ch├¡nh kh├ích h├áng ─æang ─æ─âng nhß║¡p. Kh├┤ng ─æ╞░ß╗úc truyß╗ün ID kh├ích h├áng kh├íc.
               Params: {"ten_thu_cung":"...","loai":"Ch├│|M├¿o|...","giong":"...","gioi_tinh":"─Éß╗▒c|C├íi|Kh├┤ng x├íc ─æß╗ïnh","mau_sac":"...","trong_luong":"3.2","ngay_sinh":"YYYY-MM-DD","ghi_chu":"..."}

            4. danh_sach_thu_cung_cua_toi
               M├┤ tß║ú: Xem danh s├ích th├║ c╞░ng cß╗ºa ch├¡nh kh├ích h├áng ─æang ─æ─âng nhß║¡p. Kh├┤ng nhß║¡n id_khach_hang tß╗½ ng╞░ß╗¥i d├╣ng.
               Params: {}

            5. tim_kiem_web
               M├┤ tß║ú: T├¼m kiß║┐m th├┤ng tin y khoa, tin tß╗⌐c th├║ y mß╗¢i nhß║Ñt tr├¬n internet.
               Params: {"query": "nß╗Öi dung cß║ºn t├¼m"}

            6. kiem_tra_phan_he
               M├┤ tß║ú: Xem danh s├ích ph├ón hß╗ç, route v├á quyß╗ün truy cß║¡p ch├¡nh trong hß╗ç thß╗æng.
               Params: {} (kh├┤ng cß║ºn tham sß╗æ)

            7. tra_cuu_tai_lieu_y_khoa
               M├┤ tß║ú: Tra cß╗⌐u t├ái liß╗çu VNUA/gi├ío tr├¼nh th├║ y ─æ├ú ─æ╞░ß╗úc Rexi nß║íp. Kh├ích h├áng chß╗ë ─æ╞░ß╗úc nhß║¡n giß║úi th├¡ch an to├án, kh├┤ng nhß║¡n liß╗üu d├╣ng hay chß╗ë ─æß╗ïnh thuß╗æc k├¬ ─æ╞ín.
               Params: {"tu_khoa": "..."}

            Khi ─æ├ú c├│ ─æß╗º th├┤ng tin ─æß╗â trß║ú lß╗¥i CUß╗ÉI C├ÖNG (kh├┤ng cß║ºn gß╗ìi tool th├¬m),
            h├úy trß║ú vß╗ü: {"final_answer": "<c├óu trß║ú lß╗¥i ─æß║ºy ─æß╗º cho ng╞░ß╗¥i d├╣ng>"}
            """;
    }

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    // DISPATCHER ΓÇö thß╗▒c thi tool theo t├¬n
    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    public String executeTool(String toolName, Map<String, Object> params) {
        return executeTool(toolName, params, null);
    }

    public String executeTool(String toolName, Map<String, Object> params, String userRole) {
        return executeTool(toolName, params, userRole, null);
    }


    public String executeTool(String toolName, Map<String, Object> params, String userRole, String username) {
        logger.info("[TOOL EXEC] ─Éang chß║íy tool: " + toolName + " | Params: " + params);
        if (userRole != null && !RoleAccessPolicy.canUseAgentTool(userRole, toolName)) {
            return RoleAccessPolicy.permissionDeniedMessage(toolName, userRole);
        }
        try {
            return switch (toolName) {
                case "tim_lich_hen_hom_nay" -> toolTimLichHenHomNay(params);
                case "tim_khach_hang"        -> toolTimKhachHang((String) params.getOrDefault("tu_khoa", ""));
                case "tim_thu_cung"          -> toolTimThuCung((String) params.getOrDefault("tu_khoa", ""));
                case "xem_benh_an"           -> toolXemBenhAn((String) params.getOrDefault("id_thu_cung", ""));
                case "tim_lich_trong"        -> toolTimLichTrong((String) params.getOrDefault("ngay", LocalDate.now(VN_ZONE).toString()));
                // Gß╗ìi qua proxy self ─æß╗â @Transactional hoß║ít ─æß╗Öng (Spring AOP proxy pattern)
                case "dat_lich_hen"          -> self.toolDatLichHen(params);
                case "huy_lich_hen"          -> toolHuyLichHen(params, userRole, username);
                case "them_thu_cung"         -> toolThemThuCung(params, userRole, username);
                case "danh_sach_thu_cung_cua_toi" -> toolDanhSachThuCungCuaToi(username);
                case "cap_nhat_benh_an"      -> toolCapNhatBenhAn(params);
                case "xem_kho_thuoc"         -> toolXemKhoThuoc((String) params.getOrDefault("tu_khoa", ""));
                case "thong_ke_doanh_thu"    -> toolThongKeDoanhThu((String) params.getOrDefault("khoang_thoi_gian", "hom_nay"));
                case "thong_ke_ca_kham_bac_si" -> toolThongKeCaKhamBacSi(params);
                case "thong_ke_khach_hang_hom_nay" -> toolThongKeKhachHangHomNay(params);
                case "tim_kiem_web"          -> toolTimKiemWeb((String) params.getOrDefault("query", ""));
                case "gui_email_don_le"      -> toolGuiEmailDonLe(params);
                case "kiem_tra_cau_hinh_ai"  -> toolKiemTraCauHinhAi();
                case "kiem_tra_kien_truc_he_thong" -> toolKiemTraKienTrucHeThong();
                case "tra_cuu_ma_nguon"      -> toolTraCuuMaNguon((String) params.getOrDefault("tu_khoa", ""));
                case "kiem_tra_phan_he"      -> toolKiemTraPhanHe();
                case "xem_hoa_don"           -> toolXemHoaDon((String) params.getOrDefault("trang_thai", "all"));
                case "thao_tac_tai_khoan"    -> toolThaoTacTaiKhoan(params);
                case "tim_tai_khoan_bi_khoa"       -> toolTimTaiKhoanBiKhoa();
                case "tra_cuu_tai_lieu_y_khoa"     -> toolTraCuuTaiLieuYKhoa((String) params.getOrDefault("tu_khoa", ""), userRole);
                // --- Tools lich lam viec nhan su ---
                case "getStaffSchedule", "getstaffschedule", "tim_lich_lam_bac_si" -> toolGetStaffSchedule(params);
                case "getSlotUsage", "getslotusage" -> toolGetSlotUsage(params);
                case "checkConflict", "checkconflict" -> toolCheckConflict(params);
                case "findOverlapStaff", "findoverlapstaff" -> toolFindOverlapStaff(params);
                case "findFreeStaff", "findfreestaff" -> toolFindFreeStaff(params);
                case "suggestSchedule", "suggestschedule" -> toolSuggestSchedule(params);
                case "autoSchedule", "autoschedule" -> toolAutoSchedule(params);
                case "overrideDoctorSlot", "overridedoctorslot" -> toolOverrideDoctorSlot(params);

                default -> "Lß╗ùi: Tool '" + toolName + "' kh├┤ng tß╗ôn tß║íi.";
            };
        } catch (Exception e) {
            logger.severe("[TOOL ERROR] Tool " + toolName + " thß║Ñt bß║íi: " + e.getMessage());
            return "Lß╗ùi khi thß╗▒c thi tool " + toolName + ": " + e.getMessage();
        }
    }

    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    // IMPLEMENTATIONS
    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

    private String toolTimLichHenHomNay(Map<String, Object> params) {
        String phamVi = params != null ? Objects.toString(params.getOrDefault("pham_vi", "hom_nay"), "hom_nay").trim().toLowerCase() : "hom_nay";
        boolean isAll = phamVi.equals("all") || phamVi.equals("lich_su") || phamVi.equals("toan_bo");
        String doctorKeyword = params != null ? Objects.toString(params.getOrDefault("tu_khoa_bac_si", ""), "").trim() : "";
        String loaiNgay = params != null ? Objects.toString(params.getOrDefault("loai_ngay", "ngay_kham"), "ngay_kham").trim().toLowerCase() : "ngay_kham";
        boolean byCreatedDate = loaiNgay.equals("ngay_tao") || loaiNgay.equals("dat_lich") || loaiNgay.equals("created");
        String dateColumn = byCreatedDate ? "lh.ngay_tao" : "lh.ngay_kham";
        LocalDate today = LocalDate.now(VN_ZONE);

        StringBuilder sql = new StringBuilder(
            "SELECT lh.id_lich_hen, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, " +
            "dv.ten_dich_vu, nv.ho_ten AS ten_bac_si, lh.ngay_kham, lh.gio_kham, lh.trang_thai " +
            "FROM LichHen lh " +
            "JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
            "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
            "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
            "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
            "WHERE 1=1 "
        );
        List<Object> queryParams = new ArrayList<>();
        if (!isAll) {
            LocalDate start = switch (phamVi) {
                case "hom_qua", "yesterday" -> today.minusDays(1);
                case "hom_kia", "truoc_hom_qua" -> today.minusDays(2);
                default -> today;
            };
            sql.append("AND CAST(").append(dateColumn).append(" AS DATE) = ? ");
            queryParams.add(java.sql.Date.valueOf(start));
        }
        if (!doctorKeyword.isBlank()) {
            sql.append("AND LOWER(nv.ho_ten) LIKE LOWER(?) ");
            queryParams.add("%" + doctorKeyword + "%");
        }
        if (isAll) {
            sql.append("ORDER BY ").append(dateColumn).append(" DESC, lh.gio_kham DESC ");
        } else {
            sql.append("ORDER BY lh.gio_kham ");
        }
        sql.append("OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");

        var rows = jdbcTemplate.queryForList(sql.toString(), queryParams.toArray());
        if (rows.isEmpty()) {
            String scope = isAll ? "trong hß╗ç thß╗æng" : phamVi.replace("_", " ");
            String doctorText = doctorKeyword.isBlank() ? "" : " cß╗ºa b├íc s─⌐ khß╗¢p '" + doctorKeyword + "'";
            return "Kh├┤ng t├¼m thß║Ñy lß╗ïch hß║╣n" + (byCreatedDate ? " ─æ╞░ß╗úc ─æß║╖t" : " kh├ím") + doctorText + " " + scope + ".";
        }
        String scopeTitle = isAll ? "Lß╗ïch hß║╣n t├¼m thß║Ñy" : "Lß╗ïch hß║╣n " + phamVi.replace("_", " ");
        if (byCreatedDate) scopeTitle += " theo ng├áy ─æß║╖t";
        if (!doctorKeyword.isBlank()) scopeTitle += " cß╗ºa b├íc s─⌐ khß╗¢p '" + doctorKeyword + "'";
        StringBuilder sb = new StringBuilder(scopeTitle + " (" + rows.size() + " ca):\n");
        for (var r : rows) {
            sb.append("- ").append(r.get("ngay_kham")).append(" ").append(r.get("gio_kham")).append(" | ")
              .append(r.get("ten_khach_hang")).append(" | B├⌐: ").append(r.get("ten_thu_cung"))
              .append(" | Dß╗ïch vß╗Ñ: ").append(r.get("ten_dich_vu"))
              .append(" | BS: ").append(r.get("ten_bac_si"))
              .append(" | TT: ").append(r.get("trang_thai")).append("\n");
        }
        return sb.toString();
    }

    private String normalizeVietnamese(String input) {
        if (input == null) return "";
        return input
                .replaceAll("[├á├íß║íß║ú├ú├óß║ºß║Ñß║¡ß║⌐ß║½─âß║▒ß║»ß║╖ß║│ß║╡]", "a")
                .replaceAll("[├¿├⌐ß║╣ß║╗ß║╜├¬ß╗üß║┐ß╗çß╗âß╗à]", "e")
                .replaceAll("[├¼├¡ß╗ïß╗ë─⌐]", "i")
                .replaceAll("[├▓├│ß╗ìß╗Å├╡├┤ß╗ôß╗æß╗Öß╗òß╗ù╞íß╗¥ß╗¢ß╗úß╗ƒß╗í]", "o")
                .replaceAll("[├╣├║ß╗Ñß╗º┼⌐╞░ß╗½ß╗⌐ß╗▒ß╗¡ß╗»]", "u")
                .replaceAll("[ß╗│├╜ß╗╡ß╗╖ß╗╣]", "y")
                .replaceAll("[─æ]", "d");
    }

    private String toolTimKhachHang(String tuKhoa) {
        String normalizedKw = tuKhoa != null ? normalizeVietnamese(tuKhoa.toLowerCase().trim()) : "";
        boolean isQueryTodayNew = normalizedKw.isEmpty() 
                                  || normalizedKw.equals("moi") 
                                  || normalizedKw.equals("hom nay") 
                                  || normalizedKw.equals("khach hang moi")
                                  || normalizedKw.equals("moi nhat")
                                  || normalizedKw.equals("khach hang moi hom nay");

        if (isQueryTodayNew) {
            LocalDate today = LocalDate.now(VN_ZONE);
            String sql = "SELECT id_khach_hang, ten_khach_hang, sdt, email, dia_chi, ngay_tao " +
                         "FROM KhachHang " +
                         "WHERE (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) " +
                         "AND CAST(ngay_tao AS DATE) = ? " +
                         "ORDER BY ngay_tao DESC OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY";
            var matchedRows = jdbcTemplate.queryForList(sql, java.sql.Date.valueOf(today));
            if (matchedRows.isEmpty()) {
                return "H├┤m nay ph├▓ng kh├ím ch╞░a ghi nhß║¡n kh├ích h├áng ─æ─âng k├╜ mß╗¢i n├áo sß║┐p ╞íi! ≡ƒÉ╛";
            }
            StringBuilder sb = new StringBuilder("Danh s├ích kh├ích h├áng ─æ─âng k├╜ mß╗¢i h├┤m nay (" + matchedRows.size() + " ng╞░ß╗¥i):\n");
            for (var r : matchedRows) {
                sb.append("- T├¬n: ").append(r.get("ten_khach_hang"))
                  .append(" | S─ÉT: ").append(r.get("sdt"))
                  .append(" | ID: ").append(r.get("id_khach_hang")).append("\n");
            }
            return sb.toString();
        }
        
        String[] keywords = tuKhoa.trim().split("\\s+");
        StringBuilder sql = new StringBuilder(
            "SELECT id_khach_hang, ten_khach_hang, sdt, email, dia_chi " +
            "FROM KhachHang WHERE (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) "
        );
        
        List<Object> args = new ArrayList<>();
        sql.append(" AND (sdt LIKE ? OR email LIKE ? OR (1=1 ");
        args.add("%" + tuKhoa.trim() + "%");
        args.add("%" + tuKhoa.trim() + "%");
        
        for (String kw : keywords) {
            sql.append(" AND LOWER(COALESCE(ten_khach_hang, '')) LIKE LOWER(?) ");
            args.add("%" + kw + "%");
        }
        sql.append(")) OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");

        var matchedRows = jdbcTemplate.queryForList(sql.toString(), args.toArray());

        if (matchedRows.isEmpty()) return "Kh├┤ng t├¼m thß║Ñy kh├ích h├áng n├áo vß╗¢i tß╗½ kh├│a: " + tuKhoa;
        
        StringBuilder sb = new StringBuilder("Kß║┐t quß║ú t├¼m kiß║┐m (hiß╗ân thß╗ï tß╗æi ─æa 5 ng╞░ß╗¥i):\n");
        for (int i = 0; i < Math.min(matchedRows.size(), 5); i++) {
            var r = matchedRows.get(i);
            sb.append("- T├¬n: ").append(r.get("ten_khach_hang"))
              .append(" | S─ÉT: ").append(r.get("sdt"))
              .append(" | ID: ").append(r.get("id_khach_hang")).append("\n");
        }
        if (matchedRows.size() > 5) {
            sb.append("... v├á c├íc ng╞░ß╗¥i kh├íc (h├úy t├¼m kiß║┐m cß╗Ñ thß╗â h╞ín).\n");
        }
        return sb.toString();
    }

    private String toolTimTaiKhoanBiKhoa() {
        String sql = "SELECT tk.id_tai_khoan, tk.ten_dang_nhap, tk.id_khach_hang, tk.id_nhan_vien, tk.trang_thai, kh.ten_khach_hang, kh.sdt, nv.ho_ten " +
                     "FROM TaiKhoan tk " +
                     "LEFT JOIN KhachHang kh ON tk.id_khach_hang = kh.id_khach_hang " +
                     "LEFT JOIN NhanVien nv ON tk.id_nhan_vien = nv.id_nhan_vien " +
                     "WHERE tk.trang_thai = '─É├ú kh├│a' OR tk.trang_thai = 'inactive'";
        var rows = jdbcTemplate.queryForList(sql);
        if (rows.isEmpty()) return "Hiß╗çn tß║íi kh├┤ng c├│ t├ái khoß║ún n├áo ─æang bß╗ï kh├│a.";
        
        StringBuilder sb = new StringBuilder("Danh s├ích t├ái khoß║ún ─æang bß╗ï kh├│a (" + rows.size() + " t├ái khoß║ún):\n");
        for (var r : rows) {
            String ten = r.get("ho_ten") != null ? r.get("ho_ten").toString() : 
                         (r.get("ten_khach_hang") != null ? r.get("ten_khach_hang").toString() : "N/A");
            String sdt = r.get("sdt") != null ? r.get("sdt").toString() : "N/A";
            sb.append("- T├¬n ─æ─âng nhß║¡p: ").append(r.get("ten_dang_nhap"))
              .append(" | ID t├ái khoß║ún: ").append(r.get("id_tai_khoan"))
              .append(" | ID kh├ích h├áng: ").append(r.get("id_khach_hang") != null ? r.get("id_khach_hang") : "N/A")
              .append(" | Chß╗º t├ái khoß║ún: ").append(ten)
              .append(" | S─ÉT: ").append(sdt)
              .append(" | Trß║íng th├íi: ").append(r.get("trang_thai")).append("\n");
        }
        return sb.toString();
    }

    private String toolThongKeKhachHangHomNay(Map<String, Object> params) {
        LocalDate today = LocalDate.now(VN_ZONE);
        Integer newCustomerCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM KhachHang " +
            "WHERE (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) AND CAST(ngay_tao AS DATE) = ?",
            Integer.class,
            java.sql.Date.valueOf(today)
        );

        StringBuilder sb = new StringBuilder();
        sb.append("Rexi tra dß╗» liß╗çu hß╗ç thß╗æng ng├áy ").append(today).append(":\n");
        sb.append("- Sß╗æ kh├ích h├áng mß╗¢i h├┤m nay: ").append(Objects.requireNonNullElse(newCustomerCount, 0)).append(" kh├ích h├áng.\n");

        boolean includeTrend = params == null
            || Boolean.parseBoolean(Objects.toString(params.getOrDefault("gom_xu_huong", "true"), "true"));
        if (!includeTrend) {
            return sb.toString().trim();
        }

        List<Map<String, Object>> appointmentRows = jdbcTemplate.queryForList(
            "SELECT COALESCE(dv.ten_dich_vu, '') AS ten_dich_vu, COALESCE(lh.ly_do, '') AS ly_do " +
            "FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
            "WHERE lh.ngay_kham = ? " +
            "ORDER BY lh.id_lich_hen OFFSET 0 ROWS FETCH NEXT 200 ROWS ONLY",
            java.sql.Date.valueOf(today)
        );

        if (appointmentRows.isEmpty()) {
            sb.append("- Xu h╞░ß╗¢ng h├┤m nay: ch╞░a c├│ lß╗ïch hß║╣n h├┤m nay trong hß╗ç thß╗æng, n├¬n Rexi kh├┤ng t├¡nh tß╗╖ lß╗ç xu h╞░ß╗¢ng.");
            return sb.toString().trim();
        }

        Map<String, Integer> categories = new LinkedHashMap<>();
        for (Map<String, Object> row : appointmentRows) {
            String service = Objects.toString(row.get("ten_dich_vu"), "");
            String reason = Objects.toString(row.get("ly_do"), "");
            String category = classifyAppointmentTrend(service + " " + reason);
            categories.merge(category, 1, Integer::sum);
        }

        sb.append("- Xu h╞░ß╗¢ng lß╗ïch hß║╣n h├┤m nay (").append(appointmentRows.size()).append(" lß╗ïch hß║╣n):\n");
        categories.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .forEach(entry -> {
                int percent = Math.round((entry.getValue() * 100.0f) / appointmentRows.size());
                sb.append("  + ").append(percent).append("% ")
                    .append(entry.getKey())
                    .append(" (").append(entry.getValue()).append(" lß╗ïch hß║╣n)\n");
            });
        sb.append("C├íc tß╗╖ lß╗ç tr├¬n chß╗ë t├¡nh tß╗½ lß╗ïch hß║╣n c├│ trong DB h├┤m nay; Rexi kh├┤ng suy ─æo├ín ngo├ái dß╗» liß╗çu n├áy.");
        return sb.toString().trim();
    }

    private String classifyAppointmentTrend(String text) {
        String q = normalizeVietnamese(Objects.toString(text, "").toLowerCase(Locale.ROOT));
        if (q.isBlank()) return "ch╞░a r├╡ l├╜ do kh├ím";
        if (containsTrendAny(q, "cap cuu", "chan thuong", "bi thuong", "vet thuong", "gay xuong", "chay mau", "tai nan")) {
            return "kh├ím do chß║Ñn th╞░╞íng/cß║Ñp cß╗⌐u";
        }
        if (containsTrendAny(q, "tiem", "vacxin", "vaccine", "phong benh", "tiem chung")) {
            return "ti├¬m ph├▓ng/ch─âm s├│c dß╗▒ ph├▓ng";
        }
        if (containsTrendAny(q, "dinh duong", "thuc an", "an uong", "tu van")) {
            return "t╞░ vß║Ñn dinh d╞░ß╗íng/ch─âm s├│c";
        }
        if (containsTrendAny(q, "hanh vi", "stress", "lo au", "can pha", "huan luyen")) {
            return "t╞░ vß║Ñn h├ánh vi";
        }
        if (containsTrendAny(q, "om", "benh", "sot", "non", "oi", "tieu chay", "bo an", "met", "ho", "viem", "ngua", "gai", "da lieu")) {
            return "kh├ím bß╗çnh/triß╗çu chß╗⌐ng bß║Ñt th╞░ß╗¥ng";
        }
        if (containsTrendAny(q, "tong quat", "dinh ky", "kiem tra", "kham suc khoe", "kham da khoa")) {
            return "kh├ím tß╗òng qu├ít/─æß╗ïnh kß╗│";
        }
        return "ch╞░a r├╡ l├╜ do kh├ím";
    }

    private boolean containsTrendAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) return true;
        }
        return false;
    }

    private String toolTimThuCung(String tuKhoa) {
        if (tuKhoa == null || tuKhoa.trim().isEmpty()) return "Vui l├▓ng cung cß║Ñp tß╗½ kh├│a t├¼m kiß║┐m.";
        
        StringBuilder sql = new StringBuilder(
            "SELECT tc.id_thu_cung, tc.ten_thu_cung, tc.loai, tc.giong, " +
            "tc.trong_luong, tc.ngay_sinh, kh.ten_khach_hang, kh.sdt " +
            "FROM ThuCung tc JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
            "WHERE (tc.da_xoa IS NULL OR LOWER(CAST(tc.da_xoa AS varchar)) IN ('0', 'false')) "
        );
        
        String[] keywords = tuKhoa.trim().split("\\s+");
        List<Object> args = new ArrayList<>();
        
        for (String kw : keywords) {
            sql.append(" AND (LOWER(COALESCE(tc.ten_thu_cung, '')) LIKE LOWER(?) ")
               .append(" OR LOWER(COALESCE(tc.loai, '')) LIKE LOWER(?)) ");
            args.add("%" + kw + "%");
            args.add("%" + kw + "%");
        }

        sql.append(" OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");
        var matchedRows = jdbcTemplate.queryForList(sql.toString(), args.toArray());

        if (matchedRows.isEmpty()) return "Kh├┤ng t├¼m thß║Ñy th├║ c╞░ng n├áo vß╗¢i tß╗½ kh├│a: " + tuKhoa;
        
        StringBuilder sb = new StringBuilder("T├¼m thß║Ñy " + matchedRows.size() + " th├║ c╞░ng (hiß╗ân thß╗ï tß╗æi ─æa 5):\n");
        int count = 0;
        for (var r : matchedRows) {
            if (count >= 5) break;
            sb.append("- ID: ").append(r.get("id_thu_cung"))
              .append(" | T├¬n: ").append(r.get("ten_thu_cung"))
              .append(" | Lo├ái: ").append(r.get("loai")).append(" - ").append(r.get("giong"))
              .append(" | ").append(r.get("trong_luong") != null ? r.get("trong_luong") : "ch╞░a r├╡").append("kg")
              .append(" | Sinh: ").append(r.get("ngay_sinh") != null ? r.get("ngay_sinh") : "ch╞░a r├╡")
              .append(" | Chß╗º: ").append(r.get("ten_khach_hang")).append(" (").append(r.get("sdt")).append(")\n");
            count++;
        }
        return sb.toString();
    }

    private String toolDanhSachThuCungCuaToi(String username) {
        String customerId = resolveCustomerId(null, username);
        if (customerId == null || customerId.isBlank()) {
            return "Kh├┤ng x├íc ─æß╗ïnh ─æ╞░ß╗úc t├ái khoß║ún kh├ích h├áng ─æang ─æ─âng nhß║¡p.";
        }

        var rows = jdbcTemplate.queryForList(
            "SELECT id_thu_cung, ten_thu_cung, loai, giong, gioi_tinh, mau_sac, trong_luong, ngay_sinh, ghi_chu " +
            "FROM ThuCung WHERE id_khach_hang = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) " +
            "ORDER BY ten_thu_cung ASC",
            customerId
        );

        if (rows.isEmpty()) {
            return "T├ái khoß║ún cß╗ºa bß║ín hiß╗çn ch╞░a c├│ th├║ c╞░ng n├áo trong hß╗ç thß╗æng.";
        }

        StringBuilder sb = new StringBuilder("Th├║ c╞░ng cß╗ºa bß║ín hiß╗çn c├│ " + rows.size() + " b├⌐:\n");
        for (var row : rows) {
            sb.append("- ").append(row.get("ten_thu_cung"))
                .append(" | Lo├ái: ").append(valueOrUnknown(row.get("loai")))
                .append(" | Giß╗æng: ").append(valueOrUnknown(row.get("giong")));
            Object gioiTinh = row.get("gioi_tinh");
            if (gioiTinh != null && !gioiTinh.toString().isBlank()) {
                sb.append(" | Giß╗¢i t├¡nh: ").append(gioiTinh);
            }
            Object trongLuong = row.get("trong_luong");
            if (trongLuong != null) {
                sb.append(" | C├ón nß║╖ng: ").append(trongLuong).append(" kg");
            }
            Object ngaySinh = row.get("ngay_sinh");
            if (ngaySinh != null) {
                sb.append(" | Ng├áy sinh: ").append(ngaySinh);
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    private String valueOrUnknown(Object value) {
        String text = value == null ? "" : value.toString().trim();
        return text.isBlank() ? "Ch╞░a cß║¡p nhß║¡t" : text;
    }

    private String toolXemBenhAn(String idThuCung) {
        String sql = "SELECT ba.ngay_kham, ba.trieu_chung, ba.chan_doan, ba.phac_do_dieu_tri, " +
                     "ba.huong_dan_cham_soc, nv.ho_ten AS ten_bac_si " +
                     "FROM HoSoBenhAn ba " +
                     "LEFT JOIN NhanVien nv ON ba.id_bac_si = nv.id_nhan_vien " +
                     "WHERE ba.id_thu_cung = ? ORDER BY ba.ngay_kham DESC OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY";
        var rows = jdbcTemplate.queryForList(sql, idThuCung);
        if (rows.isEmpty()) return "Th├║ c╞░ng ID " + idThuCung + " ch╞░a c├│ bß╗çnh ├ín n├áo.";
        StringBuilder sb = new StringBuilder("Bß╗çnh ├ín gß║ºn nhß║Ñt:\n");
        for (var r : rows) {
            sb.append("- Ng├áy: ").append(r.get("ngay_kham"))
              .append(" | Triß╗çu chß╗⌐ng: ").append(r.get("trieu_chung"))
              .append(" | Chß║⌐n ─æo├ín: ").append(r.get("chan_doan"))
              .append(" | Ph├íc ─æß╗ô: ").append(r.get("phac_do_dieu_tri"))
              .append(" | BS: ").append(r.get("ten_bac_si")).append("\n");
        }
        return sb.toString();
    }

    private String toolTimLichTrong(String ngay) {
        // T├¼m tß║Ñt cß║ú giß╗¥ ─æ├ú ─æß║╖t trong ng├áy ─æ├│
        String sql = "SELECT gio_kham FROM LichHen WHERE ngay_kham = ? AND trang_thai != 'DA_HUY'";
        var bookedSlots = jdbcTemplate.queryForList(sql, String.class, ngay);
        List<String> allSlots = List.of("08:00","08:30","09:00","09:30","10:00","10:30","11:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00");
        List<String> available = new ArrayList<>();
        for (String slot : allSlots) {
            boolean taken = bookedSlots.stream().anyMatch(b -> b != null && b.startsWith(slot));
            if (!taken) available.add(slot);
        }
        if (available.isEmpty()) return "Ng├áy " + ngay + " ─æ├ú k├¡n lß╗ïch. H├úy chß╗ìn ng├áy kh├íc.";
        return "Ng├áy " + ngay + " c├▓n " + available.size() + " khung giß╗¥ trß╗æng: " + String.join(", ", available);
    }

    @Transactional
    String toolDatLichHen(Map<String, Object> p) {
        try {
            String idKhachHang = Objects.toString(p.get("id_khach_hang"), "").trim();
            String idThuCung = Objects.toString(p.get("id_thu_cung"), "").trim();
            String idBacSi = Objects.toString(p.get("id_bac_si"), "").trim();
            String idDichVu = Objects.toString(p.get("id_dich_vu"), "").trim();
            String ngayKhamText = Objects.toString(p.get("ngay_kham"), "").trim();
            String gioKhamText = Objects.toString(p.get("gio_kham"), "").trim();
            if (idKhachHang.isBlank() || idThuCung.isBlank() || idBacSi.isBlank()
                    || idDichVu.isBlank() || ngayKhamText.isBlank() || gioKhamText.isBlank()) {
                return "Lß╗ùi ─æß║╖t lß╗ïch: thiß║┐u th├┤ng tin bß║»t buß╗Öc gß╗ôm kh├ích h├áng, th├║ c╞░ng, b├íc s─⌐, dß╗ïch vß╗Ñ, ng├áy kh├ím v├á giß╗¥ kh├ím.";
            }
            LocalDate ngayKham = LocalDate.parse(ngayKhamText);
            LocalTime gioKham = LocalTime.parse(gioKhamText.length() == 5 ? gioKhamText : gioKhamText.substring(0, 5));
            LocalDate today = LocalDate.now(VN_ZONE);
            if (ngayKham.isBefore(today)) {
                return "Lß╗ùi ─æß║╖t lß╗ïch: kh├┤ng thß╗â ─æß║╖t lß╗ïch v├áo ng├áy trong qu├í khß╗⌐.";
            }
            if (ngayKham.equals(today) && gioKham.isBefore(LocalTime.now(VN_ZONE).plusMinutes(30))) {
                return "Lß╗ùi ─æß║╖t lß╗ïch: giß╗¥ kh├ím phß║úi c├ích thß╗¥i ─æiß╗âm hiß╗çn tß║íi tß╗æi thiß╗âu 30 ph├║t.";
            }

            // Validate all entities exist before proceeding
            Integer customerExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM KhachHang WHERE id_khach_hang = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))",
                Integer.class, idKhachHang);
            Integer petExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ThuCung WHERE id_thu_cung = ? AND id_khach_hang = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))",
                Integer.class, idThuCung, idKhachHang);
            Integer doctorExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NhanVien WHERE id_nhan_vien = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))",
                Integer.class, idBacSi);
            Integer serviceExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM DichVu WHERE id_dich_vu = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))",
                Integer.class, idDichVu);

            // Null-safe validation
            if (customerExists == null || customerExists == 0) return "Lß╗ùi ─æß║╖t lß╗ïch: kh├┤ng t├¼m thß║Ñy kh├ích h├áng hß╗úp lß╗ç.";
            if (petExists == null || petExists == 0) return "Lß╗ùi ─æß║╖t lß╗ïch: th├║ c╞░ng kh├┤ng thuß╗Öc kh├ích h├áng n├áy hoß║╖c ─æ├ú bß╗ï x├│a.";
            if (doctorExists == null || doctorExists == 0) return "Lß╗ùi ─æß║╖t lß╗ïch: kh├┤ng t├¼m thß║Ñy b├íc s─⌐ hß╗úp lß╗ç.";
            if (serviceExists == null || serviceExists == 0) return "Lß╗ùi ─æß║╖t lß╗ïch: kh├┤ng t├¼m thß║Ñy dß╗ïch vß╗Ñ hß╗úp lß╗ç.";

            Integer thoiLuongMoi = jdbcTemplate.queryForObject(
                "SELECT thoi_luong_phut FROM DichVu WHERE id_dich_vu = ?",
                Integer.class, idDichVu);
            if (thoiLuongMoi == null || thoiLuongMoi <= 0) thoiLuongMoi = 30;
            LocalTime gioKetThuc = gioKham.plusMinutes(thoiLuongMoi);
            int gioKhamMinute = gioKham.getHour() * 60 + gioKham.getMinute();
            int gioKetThucMinute = gioKetThuc.getHour() * 60 + gioKetThuc.getMinute();

            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
            String busyStartMinute = pg
                ? "(EXTRACT(HOUR FROM lh.gio_kham::time) * 60 + EXTRACT(MINUTE FROM lh.gio_kham::time))::int"
                : "(DATEPART(HOUR, lh.gio_kham) * 60 + DATEPART(MINUTE, lh.gio_kham))";

            // Check duplicate: c├╣ng b├íc s─⌐ + khoß║úng thß╗¥i gian bß╗ï chß╗ông lß║Ñn
            Integer duplicateDoctorSlot = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                "WHERE lh.ngay_kham = ? AND lh.id_bac_si = ? " +
                "AND " + busyStartMinute + " < ? " +
                "AND " + busyStartMinute + " + COALESCE(dv.thoi_luong_phut, 30) > ? " +
                "AND (lh.trang_thai IS NULL OR lh.trang_thai NOT IN ('─É├ú hß╗ºy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hß║┐t hß║ín'))",
                Integer.class, java.sql.Date.valueOf(ngayKham), idBacSi,
                gioKetThucMinute, gioKhamMinute);
            if (duplicateDoctorSlot != null && duplicateDoctorSlot > 0) {
                return "Lß╗ùi ─æß║╖t lß╗ïch: khung giß╗¥ n├áy bß╗ï tr├╣ng thß╗¥i gian vß╗¢i lß╗ïch kh├ím kh├íc cß╗ºa b├íc s─⌐ ─æ├ú chß╗ìn. H├úy chß╗ìn giß╗¥ kh├íc.";
            }

            // Check duplicate: c├╣ng th├║ c╞░ng + khoß║úng thß╗¥i gian bß╗ï chß╗ông lß║Ñn
            Integer duplicatePetSlot = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                "WHERE lh.ngay_kham = ? AND lh.id_thu_cung = ? " +
                "AND " + busyStartMinute + " < ? " +
                "AND " + busyStartMinute + " + COALESCE(dv.thoi_luong_phut, 30) > ? " +
                "AND (lh.trang_thai IS NULL OR lh.trang_thai NOT IN ('─É├ú hß╗ºy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hß║┐t hß║ín'))",
                Integer.class, java.sql.Date.valueOf(ngayKham), idThuCung,
                gioKetThucMinute, gioKhamMinute);
            if (duplicatePetSlot != null && duplicatePetSlot > 0) {
                return "Lß╗ùi ─æß║╖t lß╗ïch: th├║ c╞░ng n├áy ─æ├ú c├│ lß╗ïch hß║╣n tr├╣ng khoß║úng thß╗¥i gian. Vui l├▓ng chß╗ìn giß╗¥ kh├íc cho b├⌐.";
            }

            String newId = "LH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String lyDo = Objects.toString(p.getOrDefault("ghi_chu", ""), "").trim();
            if (lyDo.isBlank()) lyDo = "─Éß║╖t lß╗ïch qua Rexi AI Agent";

            String sql = "INSERT INTO LichHen (id_lich_hen, id_khach_hang, id_thu_cung, id_bac_si, id_dich_vu, ngay_kham, gio_kham, ly_do, trang_thai) " +
                         "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CHO_XAC_NHAN')";
            jdbcTemplate.update(sql,
                newId,
                idKhachHang, idThuCung, idBacSi,
                idDichVu, java.sql.Date.valueOf(ngayKham), gioKham.toString(),
                lyDo);
            return "Γ£à ─Éß║╖t lß╗ïch th├ánh c├┤ng! M├ú lß╗ïch hß║╣n: " + newId + " v├áo " + ngayKham + " l├║c " + gioKham;
        } catch (Exception e) {
            return "Lß╗ùi ─æß║╖t lß╗ïch: " + e.getMessage();
        }
    }

    private String toolHuyLichHen(Map<String, Object> p, String userRole, String username) {
        String idLichHen = Objects.toString(p.getOrDefault("id_lich_hen", ""), "").trim();
        String tuKhoaKhach = Objects.toString(p.getOrDefault("tu_khoa_khach", ""), "").trim();
        String thoiGian = normalizeVietnamese(Objects.toString(p.getOrDefault("thoi_gian", ""), "").toLowerCase().trim());
        boolean isCustomer = RoleAccessPolicy.isCustomerRole(userRole);

        try {
            String customerId = null;
            if (isCustomer) {
                if (username == null || username.isBlank()) {
                    return "Cß║ºn ─æ─âng nhß║¡p t├ái khoß║ún kh├ích h├áng ─æß╗â hß╗ºy lß╗ïch cß╗ºa ch├¡nh m├¼nh.";
                }
                List<Map<String, Object>> accounts = jdbcTemplate.queryForList(
                    "SELECT id_khach_hang FROM TaiKhoan WHERE ten_dang_nhap = ? AND id_khach_hang IS NOT NULL",
                    username);
                if (accounts.isEmpty()) {
                    return "Kh├┤ng x├íc ─æß╗ïnh ─æ╞░ß╗úc hß╗ô s╞í kh├ích h├áng cß╗ºa t├ái khoß║ún hiß╗çn tß║íi, n├¬n ch╞░a thß╗â hß╗ºy lß╗ïch.";
                }
                customerId = Objects.toString(accounts.get(0).get("id_khach_hang"), "");
            }

            List<Map<String, Object>> matches;
            if (!idLichHen.isBlank()) {
                String sql = "SELECT lh.id_lich_hen, lh.id_khach_hang, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, lh.ngay_kham, lh.gio_kham, lh.trang_thai " +
                        "FROM LichHen lh LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                        "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung WHERE lh.id_lich_hen = ? ORDER BY lh.ngay_kham OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY";
                matches = jdbcTemplate.queryForList(sql, idLichHen);
            } else {
                StringBuilder sql = new StringBuilder(
                    "SELECT lh.id_lich_hen, lh.id_khach_hang, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, lh.ngay_kham, lh.gio_kham, lh.trang_thai " +
                    "FROM LichHen lh LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                    "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                    "WHERE lh.trang_thai NOT IN ('DA_HUY', '─É├ú hß╗ºy', 'da_huy', 'TU_CHOI', 'Hß║┐t hß║ín') ");
                List<Object> args = new ArrayList<>();
                if (isCustomer) {
                    sql.append("AND lh.id_khach_hang = ? ");
                    args.add(customerId);
                } else if (!tuKhoaKhach.isBlank()) {
                    sql.append("AND (LOWER(COALESCE(kh.ten_khach_hang, '')) LIKE LOWER(?) OR kh.sdt LIKE ?) ");
                    args.add("%" + tuKhoaKhach + "%");
                    args.add("%" + tuKhoaKhach + "%");
                } else {
                    return "Cß║ºn m├ú lß╗ïch hß║╣n hoß║╖c t├¬n/S─ÉT kh├ích h├áng ─æß╗â hß╗ºy ─æ├║ng lß╗ïch, tr├ính hß╗ºy nhß║ºm.";
                }
                
                LocalDate today = LocalDate.now(VN_ZONE);
                if (thoiGian.contains("chieu_nay") || thoiGian.contains("chieu nay")) {
                    sql.append("AND lh.ngay_kham = ? AND lh.gio_kham >= '12:00:00' ");
                    args.add(java.sql.Date.valueOf(today));
                } else if (thoiGian.contains("hom_nay") || thoiGian.contains("hom nay")) {
                    sql.append("AND lh.ngay_kham = ? ");
                    args.add(java.sql.Date.valueOf(today));
                } else if (thoiGian.contains("ngay_mai") || thoiGian.contains("ngay mai")) {
                    sql.append("AND lh.ngay_kham = ? ");
                    args.add(java.sql.Date.valueOf(today.plusDays(1)));
                }
                sql.append("ORDER BY lh.ngay_kham, lh.gio_kham OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY");
                matches = jdbcTemplate.queryForList(sql.toString(), args.toArray());
            }

            if (matches.isEmpty()) {
                return "Kh├┤ng t├¼m thß║Ñy lß╗ïch hß║╣n ph├╣ hß╗úp ─æß╗â hß╗ºy. T├┤i kh├┤ng tß╗▒ hß╗ºy nß║┐u ch╞░a x├íc ─æß╗ïnh ─æ├║ng lß╗ïch.";
            }
            if (isCustomer) {
                for (Map<String, Object> row : matches) {
                    if (!Objects.toString(row.get("id_khach_hang"), "").equals(customerId)) {
                        return "Cß║únh b├ío bß║úo mß║¡t: kh├ích h├áng chß╗ë ─æ╞░ß╗úc hß╗ºy lß╗ïch cß╗ºa ch├¡nh m├¼nh.";
                    }
                }
            }
            if (matches.size() > 1) {
                StringBuilder sb = new StringBuilder("T├¼m thß║Ñy nhiß╗üu lß╗ïch ph├╣ hß╗úp, cß║ºn chß╗ìn m├ú lß╗ïch ─æß╗â hß╗ºy ch├¡nh x├íc:\n");
                for (Map<String, Object> row : matches) {
                    sb.append("- ").append(row.get("id_lich_hen"))
                      .append(" | ").append(row.get("ten_khach_hang"))
                      .append(" | ").append(row.get("ten_thu_cung"))
                      .append(" | ").append(row.get("ngay_kham"))
                      .append(" ").append(row.get("gio_kham")).append("\n");
                }
                return sb.toString();
            }

            Map<String, Object> target = matches.get(0);
            String targetId = Objects.toString(target.get("id_lich_hen"), "");
            Integer usageCount = jdbcTemplate.queryForObject(
                "SELECT (SELECT COUNT(*) FROM HoSoBenhAn WHERE id_lich_hen = ?) + (SELECT COUNT(*) FROM HoaDon WHERE id_lich_hen = ?)",
                Integer.class, targetId, targetId);
            if (Objects.requireNonNullElse(usageCount, 0) > 0) {
                return "Kh├┤ng thß╗â hß╗ºy lß╗ïch " + targetId + " v├¼ ─æ├ú c├│ h├│a ─æ╞ín hoß║╖c hß╗ô s╞í bß╗çnh ├ín li├¬n kß║┐t. Cß║ºn quß║ún l├╜ xß╗¡ l├╜ thß╗º c├┤ng.";
            }
            jdbcTemplate.update("UPDATE LichHen SET trang_thai = 'DA_HUY' WHERE id_lich_hen = ?", targetId);
            return "─É├ú hß╗ºy lß╗ïch hß║╣n " + targetId + " cho " + target.get("ten_khach_hang") + " - b├⌐ " + target.get("ten_thu_cung") + ".";
        } catch (Exception e) {
            return "Lß╗ùi hß╗ºy lß╗ïch hß║╣n: " + e.getMessage();
        }
    }

    private String toolCapNhatBenhAn(Map<String, Object> p) {
        String id = Objects.toString(p.getOrDefault("id_ho_so_benh_an", ""), "").trim();
        if (id.isBlank()) {
            return "Cß║ºn id_ho_so_benh_an ─æß╗â cß║¡p nhß║¡t ─æ├║ng bß╗çnh ├ín. T├┤i kh├┤ng cß║¡p nhß║¡t theo t├¬n m╞í hß╗ô ─æß╗â tr├ính ghi nhß║ºm hß╗ô s╞í.";
        }

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("trieu_chung", Objects.toString(p.getOrDefault("trieu_chung", ""), "").trim());
        fields.put("chan_doan", Objects.toString(p.getOrDefault("chan_doan", ""), "").trim());
        fields.put("phac_do_dieu_tri", Objects.toString(p.getOrDefault("phac_do_dieu_tri", ""), "").trim());
        fields.put("huong_dan_cham_soc", Objects.toString(p.getOrDefault("huong_dan_cham_soc", ""), "").trim());

        List<String> sets = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            if (!entry.getValue().isBlank()) {
                sets.add(entry.getKey() + " = ?");
                args.add(entry.getValue());
            }
        }
        if (sets.isEmpty()) {
            return "Cß║ºn ├¡t nhß║Ñt mß╗Öt nß╗Öi dung chuy├¬n m├┤n ─æß╗â cß║¡p nhß║¡t bß╗çnh ├ín.";
        }

        try {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM HoSoBenhAn WHERE id_ho_so_benh_an = ?",
                Integer.class, id);
            if (Objects.requireNonNullElse(exists, 0) == 0) {
                return "Kh├┤ng t├¼m thß║Ñy bß╗çnh ├ín " + id + ".";
            }
            args.add(id);
            int rows = jdbcTemplate.update("UPDATE HoSoBenhAn SET " + String.join(", ", sets) + " WHERE id_ho_so_benh_an = ?", args.toArray());
            return rows > 0 ? "─É├ú cß║¡p nhß║¡t bß╗çnh ├ín " + id + ". Nß╗Öi dung ─æ├ú ghi theo quyß╗ün l├óm s├áng." : "Kh├┤ng c├│ bß╗çnh ├ín n├áo ─æ╞░ß╗úc cß║¡p nhß║¡t.";
        } catch (Exception e) {
            return "Lß╗ùi cß║¡p nhß║¡t bß╗çnh ├ín: " + e.getMessage();
        }
    }

    private String toolXemKhoThuoc(String tuKhoa) {
        boolean isSearch = tuKhoa != null && !tuKhoa.trim().isEmpty();
        int limit = isSearch ? 5 : 10;

        StringBuilder sql = new StringBuilder(
            "SELECT t.ten_thuoc, t.don_vi, t.gia_ban, " +
            "COALESCE(SUM(l.so_luong_ton), 0) AS so_luong_ton, MAX(l.han_su_dung) AS han_su_dung " +
            "FROM Thuoc t LEFT JOIN LoThuoc l ON t.id_thuoc = l.id_thuoc " +
            "WHERE (t.da_xoa IS NULL OR LOWER(CAST(t.da_xoa AS varchar)) IN ('0', 'false')) "
        );

        List<Object> args = new ArrayList<>();
        if (isSearch) {
            String[] keywords = tuKhoa.trim().split("\\s+");
            for (String kw : keywords) {
                sql.append(" AND LOWER(COALESCE(t.ten_thuoc, '')) LIKE LOWER(?) ");
                args.add("%" + kw + "%");
            }
        }

        sql.append(" GROUP BY t.id_thuoc, t.ten_thuoc, t.don_vi, t.gia_ban ");

        if (!isSearch) {
            // Nß║┐u ko c├│ tß╗½ kh├│a, SQL Server tß╗▒ ─æß╗Öng sort theo sß╗æ l╞░ß╗úng tß╗ôn t─âng dß║ºn
            sql.append(" ORDER BY COALESCE(SUM(l.so_luong_ton), 0) ASC ");
        } else {
            sql.append(" ORDER BY t.ten_thuoc ASC ");
        }
        sql.append(" OFFSET 0 ROWS FETCH NEXT 15 ROWS ONLY");

        var matchedRows = jdbcTemplate.queryForList(sql.toString(), args.toArray());

        if (matchedRows.isEmpty()) return "Kh├┤ng t├¼m thß║Ñy thuß╗æc n├áo.";
        
        StringBuilder sb = new StringBuilder("Kho thuß╗æc (hiß╗ân thß╗ï tß╗æi ─æa " + limit + " kß║┐t quß║ú):\n");
        int count = 0;
        for (var r : matchedRows) {
            if (count >= limit) break;
            sb.append("- ").append(r.get("ten_thuoc"))
              .append(" | SL: ").append(r.get("so_luong_ton")).append(" ").append(r.get("don_vi"))
              .append(" | Gi├í: ").append(r.get("gia_ban")).append("─æ")
              .append(" | HSD: ").append(r.get("han_su_dung") != null ? r.get("han_su_dung") : "N/A").append("\n");
            count++;
        }
        return sb.toString();
    }

    private String toolThongKeDoanhThu(String khoang) {
        LocalDate today = LocalDate.now(VN_ZONE);
        java.time.LocalDateTime startDate;
        java.time.LocalDateTime endDate;
        java.time.LocalDateTime compareStart = null;
        java.time.LocalDateTime compareEnd = null;
        boolean isAll = false;

        switch (khoang) {
            case "hom_qua", "yesterday" -> {
                startDate = today.minusDays(1).atStartOfDay();
                endDate = today.atStartOfDay();
                compareStart = today.minusDays(2).atStartOfDay();
                compareEnd = startDate;
            }
            case "hom_kia", "truoc_hom_qua" -> {
                startDate = today.minusDays(2).atStartOfDay();
                endDate = today.minusDays(1).atStartOfDay();
                compareStart = today.minusDays(3).atStartOfDay();
                compareEnd = startDate;
            }
            case "tuan_nay" -> {
                startDate = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)).atStartOfDay();
                endDate = startDate.plusWeeks(1);
                compareStart = startDate.minusWeeks(1);
                compareEnd = startDate;
            }
            case "thang_nay" -> {
                startDate = java.time.YearMonth.from(today).atDay(1).atStartOfDay();
                endDate = startDate.plusMonths(1);
                compareStart = startDate.minusMonths(1);
                compareEnd = startDate;
            }
            case "all", "toan_bo", "lich_su" -> {
                startDate = null;
                endDate = null;
                isAll = true;
            }
            default -> { // hom_nay
                startDate = today.atStartOfDay();
                endDate = startDate.plusDays(1);
                compareStart = today.minusDays(1).atStartOfDay();
                compareEnd = startDate;
            }
        }

        try {
            String paidFilter = "(trang_thai = 'DA_THANH_TOAN' OR trang_thai_thanh_toan = 'DA_THANH_TOAN')";
            String sql = "SELECT COUNT(*) AS so_hoa_don, COALESCE(SUM(tong_tien_cuoi), 0) AS tong_doanh_thu, " +
                          "COALESCE(AVG(tong_tien_cuoi), 0) AS trung_binh FROM HoaDon WHERE " +
                          paidFilter + (isAll ? "" : " AND ngay_lap_hoa_don >= ? AND ngay_lap_hoa_don < ?");
            var row = isAll ? jdbcTemplate.queryForMap(sql) : jdbcTemplate.queryForMap(sql, startDate, endDate);
            java.math.BigDecimal current = new java.math.BigDecimal(Objects.toString(row.get("tong_doanh_thu"), "0"));
            String compareText = "";
            if (compareStart != null && compareEnd != null) {
                String compareSql = "SELECT COALESCE(SUM(tong_tien_cuoi), 0) FROM HoaDon WHERE " + paidFilter +
                        " AND ngay_lap_hoa_don >= ? AND ngay_lap_hoa_don < ?";
                java.math.BigDecimal previous = jdbcTemplate.queryForObject(compareSql, java.math.BigDecimal.class, compareStart, compareEnd);
                previous = previous == null ? java.math.BigDecimal.ZERO : previous;
                java.math.BigDecimal diff = current.subtract(previous);
                if (previous.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    java.math.BigDecimal pct = diff.multiply(java.math.BigDecimal.valueOf(100)).divide(previous, 2, java.math.RoundingMode.HALF_UP);
                    compareText = String.format(" | So vß╗¢i kß╗│ tr╞░ß╗¢c: %s%s VN─É (%s%s%%)",
                            diff.signum() >= 0 ? "+" : "", diff.toPlainString(), pct.signum() >= 0 ? "+" : "", pct.toPlainString());
                } else {
                    compareText = " | Kß╗│ tr╞░ß╗¢c doanh thu = 0 n├¬n kh├┤ng t├¡nh ─æ╞░ß╗úc % t─âng/giß║úm ─æ├íng tin cß║¡y";
                }
            }
            return String.format("Thß╗æng k├¬ %s: %s h├│a ─æ╞ín | Doanh thu: %s VN─É | TB/h├│a ─æ╞ín: %s VN─É%s",
                khoang.replace("_", " "), row.get("so_hoa_don"), current.toPlainString(), row.get("trung_binh"), compareText);
        } catch (Exception e) {
            return "Lß╗ùi thß╗æng k├¬: " + e.getMessage();
        }
    }

    private String toolThongKeCaKhamBacSi(Map<String, Object> params) {
        String khoang = params != null ? Objects.toString(params.getOrDefault("khoang_thoi_gian", "all"), "all").trim().toLowerCase() : "all";
        String sapXep = params != null ? Objects.toString(params.getOrDefault("sap_xep", "nhieu_nhat"), "nhieu_nhat").trim().toLowerCase() : "nhieu_nhat";
        boolean ascending = sapXep.equals("it_nhat") || sapXep.equals("it_ca") || sapXep.equals("thap_nhat");

        LocalDate today = LocalDate.now(VN_ZONE);
        StringBuilder sql = new StringBuilder(
            "SELECT COALESCE(nv.ho_ten, 'Ch╞░a g├ín b├íc s─⌐') AS ten_bac_si, " +
            "COUNT(*) AS tong_ca, " +
            "SUM(CASE WHEN lh.trang_thai = 'DA_HUY' OR lh.trang_thai = '─É├ú hß╗ºy' THEN 1 ELSE 0 END) AS so_ca_huy, " +
            "SUM(CASE WHEN lh.trang_thai IS NULL OR (lh.trang_thai <> 'DA_HUY' AND lh.trang_thai <> '─É├ú hß╗ºy') THEN 1 ELSE 0 END) AS so_ca_hieu_luc " +
            "FROM LichHen lh " +
            "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
            "WHERE lh.id_bac_si IS NOT NULL "
        );
        List<Object> queryParams = new ArrayList<>();

        switch (khoang) {
            case "hom_nay", "today" -> {
                sql.append("AND lh.ngay_kham = ? ");
                queryParams.add(java.sql.Date.valueOf(today));
                khoang = "hom_nay";
            }
            case "tuan_nay" -> {
                LocalDate start = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                LocalDate end = start.plusWeeks(1);
                sql.append("AND lh.ngay_kham >= ? AND lh.ngay_kham < ? ");
                queryParams.add(java.sql.Date.valueOf(start));
                queryParams.add(java.sql.Date.valueOf(end));
            }
            case "thang_nay" -> {
                LocalDate start = java.time.YearMonth.from(today).atDay(1);
                LocalDate end = start.plusMonths(1);
                sql.append("AND lh.ngay_kham >= ? AND lh.ngay_kham < ? ");
                queryParams.add(java.sql.Date.valueOf(start));
                queryParams.add(java.sql.Date.valueOf(end));
            }
            default -> khoang = "all";
        }

        // D├╣ng subquery bß╗ìc ngo├ái ─æß╗â ├íp TOP sau ORDER BY ΓÇö SQL Server kh├┤ng cho TOP trß╗▒c tiß║┐p vß╗¢i GROUP BY alias
        String innerSql = "SELECT COALESCE(nv.ho_ten, 'Ch╞░a g├ín b├íc s─⌐') AS ten_bac_si, " +
            "COUNT(*) AS tong_ca, " +
            "SUM(CASE WHEN lh.trang_thai = 'DA_HUY' OR lh.trang_thai = '─É├ú hß╗ºy' THEN 1 ELSE 0 END) AS so_ca_huy, " +
            "SUM(CASE WHEN lh.trang_thai IS NULL OR (lh.trang_thai <> 'DA_HUY' AND lh.trang_thai <> '─É├ú hß╗ºy') THEN 1 ELSE 0 END) AS so_ca_hieu_luc " +
            "FROM LichHen lh LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
            "WHERE lh.id_bac_si IS NOT NULL ";
        // Th├¬m ─æiß╗üu kiß╗çn thß╗¥i gian tß╗½ sql ─æ├ú build (chß╗⌐a WHERE ... AND ...)
        // Ta chß╗ë lß║Ñy phß║ºn WHERE ─æ├ú append sau "WHERE lh.id_bac_si IS NOT NULL "
        String whereExtra = sql.toString().substring(sql.toString().indexOf("WHERE lh.id_bac_si IS NOT NULL ") + "WHERE lh.id_bac_si IS NOT NULL ".length());
        String finalSql = innerSql + whereExtra +
            "GROUP BY COALESCE(nv.ho_ten, 'Ch╞░a g├ín b├íc s─⌐') " +
            "ORDER BY so_ca_hieu_luc " + (ascending ? "ASC" : "DESC") +
            ", tong_ca " + (ascending ? "ASC" : "DESC") +
            ", ten_bac_si ASC " +
            "OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY";
        sql = new StringBuilder(finalSql);

        var rows = jdbcTemplate.queryForList(sql.toString(), queryParams.toArray());
        if (rows.isEmpty()) {
            return "Ch╞░a c├│ dß╗» liß╗çu ca kh├ím theo b├íc s─⌐ cho phß║ím vi " + khoang.replace("_", " ") + ".";
        }

        String title = ascending ? "B├íc s─⌐ c├│ ├¡t ca kh├ím nhß║Ñt" : "B├íc s─⌐ c├│ nhiß╗üu ca kh├ím nhß║Ñt";
        StringBuilder sb = new StringBuilder(title + " (" + khoang.replace("_", " ") + "):\n");
        for (var row : rows) {
            sb.append("- ").append(row.get("ten_bac_si"))
                .append(": ").append(row.get("so_ca_hieu_luc")).append(" ca hiß╗çu lß╗▒c")
                .append(" / ").append(row.get("tong_ca")).append(" tß╗òng ca");
            Object canceled = row.get("so_ca_huy");
            if (canceled != null) {
                sb.append(" | Hß╗ºy: ").append(canceled);
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    private String toolTimKiemWeb(String query) {
        if (query == null || query.trim().isEmpty()) {
            return "Vui l├▓ng cung cß║Ñp nß╗Öi dung cß║ºn t├¼m kiß║┐m.";
        }

        return tryDuckDuckGoSearch(query.trim());
    }

    private String tryDuckDuckGoSearch(String query) {
        try {
            String encodedQuery = java.net.URLEncoder.encode(query, "UTF-8");
            String urlStr = "https://html.duckduckgo.com/html/";
            java.net.URL url = new java.net.URL(urlStr);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(7000);
            try (var os = conn.getOutputStream()) { os.write(("q=" + encodedQuery).getBytes()); }
            StringBuilder resp = new StringBuilder();
            try (var br = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                String line; while ((line = br.readLine()) != null) resp.append(line);
            }
            var titlePattern = java.util.regex.Pattern.compile("class=\"result__a\" href=\"([^\"]+)\">([^<]+)<");
            var snippetPattern = java.util.regex.Pattern.compile("class=\"result__snippet\"[^>]*>(.*?)</a>");
            String html = resp.toString();
            var m = titlePattern.matcher(html);
            var snippetMatcher = snippetPattern.matcher(html);
            List<String> snippets = new ArrayList<>();
            while (snippetMatcher.find() && snippets.size() < 5) {
                snippets.add(stripHtmlEntities(snippetMatcher.group(1)));
            }
            StringBuilder result = new StringBuilder("Kß║┐t quß║ú web ─æ├ú chß║»t lß╗ìc cho \"" + query + "\":\n");
            int count = 0;
            while (m.find() && count < 3) {
                String title = stripHtmlEntities(m.group(2));
                String snippet = count < snippets.size() ? snippets.get(count) : "";
                result.append(count + 1).append(". ").append(title).append("\n")
                    .append("   ├¥ ch├¡nh: ").append(snippet.isBlank() ? "Nguß╗ôn n├áy c├│ thß╗â li├¬n quan nh╞░ng kh├┤ng c├│ ─æoß║ín m├┤ tß║ú ngß║»n." : snippet).append("\n")
                    .append("   Nguß╗ôn: ").append(cleanDuckDuckGoUrl(m.group(1))).append("\n");
                count++;
            }
            if (count > 0) {
        return result.toString();
            }
            return "Kh├┤ng t├¼m thß║Ñy kß║┐t quß║ú web.";
        } catch (Exception e) {
            return "Lß╗ùi t├¼m kiß║┐m web: " + e.getMessage();
        }
    }

    private String stripHtmlEntities(String value) {
        if (value == null) return "";
        return value.replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#x27;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replaceAll("<[^>]+>", "")
                .trim();
    }

    private String cleanDuckDuckGoUrl(String rawUrl) {
        if (rawUrl == null) return "";
        String decoded = stripHtmlEntities(rawUrl);
        try {
            if (decoded.contains("uddg=")) {
                String query = java.net.URI.create(decoded).getRawQuery();
                if (query != null) {
                    for (String part : query.split("&")) {
                        if (part.startsWith("uddg=")) {
                            return java.net.URLDecoder.decode(part.substring(5), java.nio.charset.StandardCharsets.UTF_8);
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return decoded;
    }

    private String toolGuiEmailDonLe(Map<String, Object> p) {
        try {
            String email = (String) p.get("email");
            String tieuDe = (String) p.get("tieu_de");
            String noiDung = (String) p.get("noi_dung");
            emailService.sendMassEmail(email, tieuDe, noiDung);
            return "Γ£à ─É├ú gß╗¡i email ─æß║┐n " + email + " th├ánh c├┤ng!";
        } catch (Exception e) {
            return "Lß╗ùi gß╗¡i email: " + e.getMessage();
        }
    }

    private String toolKiemTraCauHinhAi() {
        String sql = "SELECT ten_cau_hinh, gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh IN " +
            "('groq_api_key','groq_model','groq_vision_model','gemini_api_key','gemini_model','openrouter_api_key','openrouter_model','ai_action_policy')";
        var rows = jdbcTemplate.queryForList(sql);
        Map<String, String> values = new HashMap<>();
        for (var row : rows) {
            values.put(String.valueOf(row.get("ten_cau_hinh")), row.get("gia_tri") == null ? "" : String.valueOf(row.get("gia_tri")));
        }
        return "Trß║íng th├íi cß║Ñu h├¼nh AI:\n"
            + "- Groq key: " + maskConfigured(values.get("groq_api_key")) + " | model: " + safeValue(values.get("groq_model")) + " | vision: " + safeValue(values.get("groq_vision_model")) + "\n"
            + "- Gemini key: " + maskConfigured(values.get("gemini_api_key")) + " | model: " + safeValue(values.get("gemini_model")) + "\n"
            + "- OpenRouter key: " + maskConfigured(values.get("openrouter_api_key")) + " | model: " + safeValue(values.get("openrouter_model")) + "\n"
            + "- Action policy: " + (values.getOrDefault("ai_action_policy", "").isBlank() ? "ch╞░a cß║Ñu h├¼nh" : "─æ├ú cß║Ñu h├¼nh") + "\n"
            + "L╞░u ├╜: API key ─æ╞░ß╗úc che ─æß╗â bß║úo mß║¡t. Backend ─æß╗ìc trß╗▒c tiß║┐p c├íc gi├í trß╗ï n├áy tß╗½ bß║úng CauHinhHeThong mß╗ùi lß║ºn gß╗ìi AI.";
    }

    private String toolKiemTraPhanHe() {
        return """
            Ph├ón hß╗ç ch├¡nh ─æang hoß║ít ─æß╗Öng:
            - Tß╗òng quan quß║ún trß╗ï: /quan-ly/dashboard
            - B├ío c├ío & Thß╗æng k├¬: /quan-ly/bao-cao-thong-ke
            - Quß║ún l├╜ lß╗ïch hß║╣n: /quan-ly/lich-hen
            - ─Éiß╗üu h├ánh nh├ón sß╗▒: /quan-ly/lich-lam-viec
            - Nh├ón sß╗▒ & Ph├ón quyß╗ün: /quan-ly/nhan-vien-phan-quyen
            - Kh├ích h├áng & Th├║ c╞░ng: /quan-ly/khach-hang-thu-cung
            - Danh mß╗Ñc dß╗ïch vß╗Ñ: /quan-ly/dich-vu
            - Kh├ím bß╗çnh & K├¬ ─æ╞ín: /quan-ly/kham-benh
            - Hß╗ô s╞í bß╗çnh ├ín: /quan-ly/ho-so-benh-an
            - ─É╞ín thuß╗æc: /quan-ly/don-thuoc
            - X├⌐t nghiß╗çm: /quan-ly/xet-nghiem
            - Kho tß╗çp y tß║┐: /quan-ly/file-dinh-kem
            - Kho thuß╗æc: /quan-ly/kho-thuoc
            - Nhß║¡p kho & Kiß╗âm k├¬: /quan-ly/nhap-kho
            - H├│a ─æ╞ín & Thanh to├ín: /quan-ly/hoa-don
            - T├ái ch├¡nh - Kß║┐ to├ín: /quan-ly/ke-toan
            - Marketing: /quan-ly/marketing
            - Cß║Ñu h├¼nh hß╗ç thß╗æng: /quan-ly/cau-hinh
            - Ph├ón hß╗ç chß╗⌐c n─âng: /quan-ly/chuc-nang
            - Cß╗òng kh├ích h├áng: /khach-hang/dashboard
            """;
    }

    private String toolKiemTraKienTrucHeThong() {
        return """
            Bß║ún ─æß╗ô kiß║┐n tr├║c Rexi AI/Agent hiß╗çn tß║íi:
            - Frontend/src/components/ChatBot.tsx: giao diß╗çn chat nß╗òi, tab Trß╗ú l├╜ Rexi v├á Rexi Agent, nhß║¡n giß╗ìng n├│i, prewarm AI khi mß╗ƒ chatbot.
            - Backend/src/main/java/com/rexi/pkty/controller/ChatController.java: API chat th╞░ß╗¥ng, ph├ón tuyß║┐n y├¬u cß║ºu nhanh/DB/AI, cß║Ñp cß╗⌐u th├║ y local triage, persona kh├ích h├áng, endpoint /api/chat/prewarm.
            - Backend/src/main/java/com/rexi/pkty/controller/AgentController.java: API Rexi Agent nß╗Öi bß╗Ö, gß╗ôm /api/agent/react, gß╗ìi tool trß╗▒c tiß║┐p v├á orchestration.
            - Backend/src/main/java/com/rexi/pkty/service/ReActAgentService.java: v├▓ng lß║╖p ReAct Reason -> Act -> Observe, chß╗ìn tool, gß╗ìi model theo thß╗⌐ tß╗▒ OpenRouter -> Gemini -> Groq.
            - Backend/src/main/java/com/rexi/pkty/service/AiToolService.java: registry tool v├á thß╗▒c thi tool thß║¡t vß╗¢i database/email/web/system map.
            - Backend/src/main/java/com/rexi/pkty/service/CodeRagService.java: RAG m├ú nguß╗ôn ─æß╗Öng, scan Frontend/src v├á Backend/src ─æß╗â trß║ú file/d├▓ng/snippet ─æ├ú che secret.
            - Backend/src/main/java/com/rexi/pkty/service/GroqService.java: adapter Groq, prewarm, xoay v├▓ng/cooldown API key.
            - Backend/src/main/java/com/rexi/pkty/service/GeminiService.java: adapter Gemini cho fallback model.
            - Backend/src/main/java/com/rexi/pkty/service/OpenRouterService.java: adapter OpenRouter, provider ╞░u ti├¬n ─æß║ºu ti├¬n cß╗ºa ReAct Agent.
            - Backend/src/main/java/com/rexi/pkty/security/RoleAccessPolicy.java: chß║╖n/mß╗ƒ tool theo vai tr├▓, kh├┤ng cho kh├ích qu├⌐t dß╗» liß╗çu nß╗Öi bß╗Ö.
            - Backend/src/main/java/com/rexi/pkty/security/SecurityConfig.java: cß║Ñu h├¼nh bß║úo mß║¡t, CORS v├á filter x├íc thß╗▒c.

            Nguy├¬n tß║»c tß╗▒ nhß║¡n thß╗⌐c cß╗ºa Agent:
            - Khi admin hß╗Åi chß╗⌐c n─âng nß║▒m ß╗ƒ file n├áo/trang n├áo/d├▓ng n├áo, phß║úi d├╣ng tool tra_cuu_ma_nguon ─æß╗â ─æß╗ìc RAG m├ú nguß╗ôn ─æß╗Öng v├á trß║ú file + d├▓ng gß║ºn nhß║Ñt.
            - Nß║┐u admin hß╗Åi model/provider/key cß║Ñu h├¼nh, phß║úi d├╣ng tool kiem_tra_cau_hinh_ai; kh├┤ng bao giß╗¥ tiß║┐t lß╗Ö API key.
            - Nß║┐u admin hß╗Åi chß╗⌐c n─âng n├áo nß║▒m ß╗ƒ ─æ├óu, kß║┐t hß╗úp bß║ún ─æß╗ô kiß║┐n tr├║c n├áy vß╗¢i RAG m├ú nguß╗ôn ─æß╗Öng; kh├┤ng bß╗ïa line nß║┐u RAG kh├┤ng t├¼m thß║Ñy.
            - Nß║┐u y├¬u cß║ºu thao t├íc dß╗» liß╗çu thß║¡t, phß║úi d├╣ng tool ─æ├║ng quyß╗ün hoß║╖c hß╗Åi x├íc nhß║¡n khi h├ánh ─æß╗Öng nhß║íy cß║úm.
            """;
    }

    private record SourceIndexEntry(
        String id,
        String title,
        String keywords,
        String files,
        String routes,
        String tools,
        String notes
    ) {}

    private static final List<SourceIndexEntry> SOURCE_INDEX = List.of(
        new SourceIndexEntry(
            "chatbot_voice_ui",
            "ChatBot, voice/micro, context frontend",
            "chatbot chat bot mic micro voice giß╗ìng n├│i opera speech recognition dom context prewarm tab agent trß╗ú l├╜ n├║t gß╗¡i send input shell core",
            "Frontend/src/components/chatbot/ChatBotCore.tsx; Frontend/src/components/chatbot/ChatbotShell.tsx; Frontend/src/components/ChatBot.tsx; Frontend/src/components/VoiceInput.tsx; Frontend/src/utils/agentPermissions.ts",
            "/api/chat; /api/chat/prewarm; /api/agent/react; /api/agent/tool",
            "Kh├┤ng c├│ tool DB trß╗▒c tiß║┐p; frontend quyß║┐t ─æß╗ïnh context v├á gß╗ìi Agent/Chat.",
            "Xß╗¡ l├╜ UI chat nß╗òi, tab Trß╗ú l├╜ Rexi/Rexi Agent, nhß║¡n giß╗ìng n├│i, context trang, streaming/fallback v├á prewarm."
        ),
        new SourceIndexEntry(
            "standard_chat",
            "Chat th╞░ß╗¥ng kh├ích h├áng",
            "chat th╞░ß╗¥ng standard chat kh├ích h├áng cß║Ñp cß╗⌐u triage db local groq persona prewarm",
            "Backend/src/main/java/com/rexi/pkty/controller/ChatController.java; Backend/src/main/java/com/rexi/pkty/service/GroqService.java",
            "/api/chat; /api/chat/stream; /api/chat/prewarm",
            "local_triage; ChatRoute QUICK_LOCAL/DB_LOCAL/MEDICAL_AI/WEB_AI/CHAT_AI",
            "Chat th╞░ß╗¥ng ╞░u ti├¬n trß║ú lß╗¥i nhanh/local triage/DB local, chß╗ë gß╗ìi AI khi cß║ºn. Kh├┤ng d├╣ng Rexi Agent ReAct."
        ),
        new SourceIndexEntry(
            "react_agent_core",
            "Rexi Agent ReAct nß╗Öi bß╗Ö",
            "agent re act react reason act observe admin model provider openrouter gemini groq tool",
            "Backend/src/main/java/com/rexi/pkty/controller/AgentController.java; Backend/src/main/java/com/rexi/pkty/service/ReActAgentService.java; Backend/src/main/java/com/rexi/pkty/service/AiToolService.java",
            "/api/agent/react; /api/agent/tool; /api/agent/swarm-orchestration",
            "Tß║Ñt cß║ú tool trong AiToolService theo RoleAccessPolicy.",
            "V├▓ng lß║╖p Agent chß╗ìn tool, quan s├ít kß║┐t quß║ú, rß╗ôi trß║ú final_answer. Provider fallback: OpenRouter -> Gemini -> Groq."
        ),
        new SourceIndexEntry(
            "ai_provider_config",
            "Cß║Ñu h├¼nh provider/model/API key",
            "ai provider model api key groq gemini openrouter cß║Ñu h├¼nh cau hinh prewarm cooldown xoay v├▓ng key hß║┐t hß║ín",
            "Backend/src/main/java/com/rexi/pkty/service/GroqService.java; Backend/src/main/java/com/rexi/pkty/service/GeminiService.java; Backend/src/main/java/com/rexi/pkty/service/OpenRouterService.java; Backend/src/main/resources/application.properties",
            "/api/chat/prewarm; /api/agent/react",
            "kiem_tra_cau_hinh_ai",
            "Kh├┤ng bao giß╗¥ trß║ú API key. Muß╗æn biß║┐t model/provider thß╗▒c tß║┐ phß║úi gß╗ìi kiem_tra_cau_hinh_ai, kß║┐t quß║ú chß╗ë che key."
        ),
        new SourceIndexEntry(
            "permissions_security",
            "Ph├ón quyß╗ün, JWT, bß║úo mß║¡t tool",
            "quyß╗ün ph├ón quyß╗ün role admin quß║ún l├╜ kh├ích h├áng bß║úo mß║¡t jwt security tool permission policy frontend backend",
            "Backend/src/main/java/com/rexi/pkty/security/RoleAccessPolicy.java; Backend/src/main/java/com/rexi/pkty/security/RexiSecurityRoles.java; Backend/src/main/java/com/rexi/pkty/SecurityConfig.java; Backend/src/main/java/com/rexi/pkty/security/JwtFilter.java; Frontend/src/utils/permissions.ts; Frontend/src/utils/agentPermissions.ts",
            "/api/agent/react; /api/agent/tool; c├íc route /quan-ly/* theo ADMIN_ROUTE_ROLES",
            "RoleAccessPolicy.canUseAgentTool; canUseAgentTool frontend",
            "Backend l├á nguß╗ôn chß║╖n quyß╗ün cuß╗æi c├╣ng. Tool m├ú nguß╗ôn/cß║Ñu h├¼nh AI chß╗ë admin; kh├ích kh├┤ng ─æ╞░ß╗úc xem dß╗» liß╗çu nß╗Öi bß╗Ö."
        ),
        new SourceIndexEntry(
            "appointment_booking",
            "─Éß║╖t lß╗ïch, lß╗ïch trß╗æng, x├íc nhß║¡n lß╗ïch",
            "─æß║╖t lß╗ïch lß╗ïch hß║╣n lß╗ïch trß╗æng b├íc s─⌐ dß╗ïch vß╗Ñ kh├ích h├áng th├║ c╞░ng x├íc nhß║¡n booking appointment",
            "Backend/src/main/java/com/rexi/pkty/controller/AgentController.java; Backend/src/main/java/com/rexi/pkty/service/AiToolService.java; Frontend/src/pages/customer/DatLichHen.tsx; Frontend/src/pages/admin/QuanLyLichHen.tsx",
            "/api/agent/react; /api/agent/tool; /api/lich-hen; /api/dich-vu; /api/thu-cung",
            "tim_lich_trong; dat_lich_hen; tim_lich_hen_hom_nay; tim_khach_hang; tim_thu_cung",
            "H├ánh ─æß╗Öng tß║ío lß╗ïch phß║úi ─æß╗º dß╗» liß╗çu v├á n├¬n hß╗Åi x├íc nhß║¡n tr╞░ß╗¢c khi ─æß║╖t."
        ),
        new SourceIndexEntry(
            "customer_pet_records",
            "Kh├ích h├áng, th├║ c╞░ng, hß╗ô s╞í bß╗çnh ├ín",
            "kh├ích h├áng th├║ c╞░ng bß╗çnh ├ín hß╗ô s╞í kh├ím bß╗çnh ─æ╞ín thuß╗æc x├⌐t nghiß╗çm file y tß║┐ customer pet record",
            "Backend/src/main/java/com/rexi/pkty/service/AiToolService.java; Frontend/src/pages/admin/QuanLyKhachHangThuCung.tsx; Frontend/src/pages/admin/QuanLyHoSoBenhAn.tsx; Frontend/src/pages/admin/ChiTietHoSoBenhAn.tsx; Frontend/src/pages/customer/HoSoBenhAn.tsx",
            "/api/khach-hang; /api/thu-cung; /api/ho-so-benh-an",
            "tim_khach_hang; tim_thu_cung; xem_benh_an",
            "Dß╗» liß╗çu bß╗çnh ├ín l├á nhß║íy cß║úm, chß╗ë vai tr├▓ ─æ╞░ß╗úc cß║Ñp quyß╗ün mß╗¢i tra cß╗⌐u."
        ),
        new SourceIndexEntry(
            "invoice_finance_inventory",
            "H├│a ─æ╞ín, kß║┐ to├ín, kho thuß╗æc",
            "h├│a ─æ╞ín thanh to├ín kß║┐ to├ín doanh thu kho thuß╗æc nhß║¡p kho tß╗ôn kho thuß╗æc invoice finance inventory",
            "Backend/src/main/java/com/rexi/pkty/service/AiToolService.java; Frontend/src/pages/admin/QuanLyHoaDon.tsx; Frontend/src/pages/admin/KeToanDashboard.tsx; Frontend/src/pages/admin/QuanLyKhoThuoc.tsx; Frontend/src/pages/admin/QuanLyNhapKho.tsx",
            "/api/hoa-don; /api/kho; /api/agent/tool",
            "xem_hoa_don; thong_ke_doanh_thu; xem_kho_thuoc",
            "T├ái ch├¡nh/kho l├á dß╗» liß╗çu nß╗Öi bß╗Ö, phß║úi theo role finance/inventory."
        ),
        new SourceIndexEntry(
            "account_admin",
            "T├ái khoß║ún, nh├ón vi├¬n, mß╗ƒ kh├│a/x├│a mß╗üm",
            "t├ái khoß║ún nh├ón vi├¬n ph├ón quyß╗ün mß╗ƒ kh├│a kh├│a x├│a mß╗üm admin account employee user password",
            "Backend/src/main/java/com/rexi/pkty/controller/AdminAccountController.java; Backend/src/main/java/com/rexi/pkty/controller/NhanVienController.java; Backend/src/main/java/com/rexi/pkty/service/AiToolService.java; Frontend/src/pages/admin/QuanLyNhanVienPhanQuyen.tsx",
            "/api/admin/tai-khoan; /api/nhan-vien; /api/agent/tool",
            "tim_tai_khoan_bi_khoa; thao_tac_tai_khoan",
            "Thao t├íc t├ái khoß║ún l├á nhß║íy cß║úm, bß║»t buß╗Öc x├íc ─æß╗ïnh ─æ├║ng ─æß╗æi t╞░ß╗úng v├á hß╗Åi x├íc nhß║¡n tr╞░ß╗¢c."
        ),
        new SourceIndexEntry(
            "marketing_swarm",
            "Marketing email v├á Swarm Agent",
            "marketing email swarm campaign chiß║┐n dß╗ïch gß╗¡i mail kh├ích h├áng dataagent creative reviewer",
            "Backend/src/main/java/com/rexi/pkty/controller/AgentController.java; Backend/src/main/java/com/rexi/pkty/service/EmailService.java; Frontend/src/pages/admin/QuanLyMarketing.tsx; Frontend/src/components/ChatBot.tsx",
            "/api/agent/swarm-orchestration; /api/agent/bulk-send-email",
            "gui_email_don_le; tim_kiem_web",
            "Kh├┤ng tß║ío dß╗» liß╗çu demo giß║ú khi DB rß╗ùng, tr├ính gß╗¡i nhß║ºm. Gß╗¡i email cß║ºn duyß╗çt/x├íc nhß║¡n."
        ),
        new SourceIndexEntry(
            "frontend_routes",
            "Route v├á m├án h├¼nh frontend",
            "route trang frontend sidebar protected route dashboard cß║Ñu h├¼nh chß╗⌐c n─âng admin customer",
            "Frontend/src/App.tsx; Frontend/src/components/ProtectedRoute.tsx; Frontend/src/components/SidebarAdmin.tsx; Frontend/src/components/SidebarKhachHang.tsx; Frontend/src/utils/permissions.ts",
            "/quan-ly/*; /khach-hang/*; /dang-nhap",
            "kiem_tra_phan_he",
            "Frontend route guard chß╗ë hß╗ù trß╗ú UX; backend vß║½n phß║úi kiß╗âm quyß╗ün khi ─æß╗ìc/sß╗¡a dß╗» liß╗çu."
        ),
        new SourceIndexEntry(
            "system_health_errors",
            "Health, lß╗ùi hß╗ç thß╗æng, log, DB",
            "backend health lß╗ùi sql server sa login database db kß║┐t nß╗æi compile startup system error",
            "Backend/src/main/resources/application.properties; Backend/src/main/java/com/rexi/pkty/controller/SystemController.java; Backend/src/main/java/com/rexi/pkty/exception/BoXuLyLoiHeThong.java",
            "/api/system/health",
            "Kh├┤ng c├│ tool sß╗¡a DB config tß╗▒ ─æß╗Öng.",
            "Health 200 ngh─⌐a backend l├¬n. SQL Server login failed l├á lß╗ùi m├┤i tr╞░ß╗¥ng/cß║Ñu h├¼nh DB, kh├┤ng n├¬n ─æß╗â Agent bß╗ïa dß╗» liß╗çu khi DB lß╗ùi."
        )
    );

    private String toolTraCuuMaNguon(String tuKhoa) {
        String query = normalizeVietnamese(Objects.toString(tuKhoa, "").toLowerCase().trim());
        if (query.isBlank()) {
            return "Cß║ºn tß╗½ kh├│a ─æß╗â tra cß╗⌐u RAG m├ú nguß╗ôn. V├¡ dß╗Ñ: chatbot mic, agent model, ph├ón quyß╗ün tool, ─æß║╖t lß╗ïch, h├│a ─æ╞ín, n├║t th├¬m dß╗ïch vß╗Ñ, api ─æ─âng nhß║¡p.";
        }

        List<Map.Entry<Integer, SourceIndexEntry>> scored = new ArrayList<>();
        for (SourceIndexEntry entry : SOURCE_INDEX) {
            int score = scoreSourceIndexEntry(query, entry);
            if (score > 0) {
                scored.add(Map.entry(score, entry));
            }
        }
        scored.sort((a, b) -> Integer.compare(b.getKey(), a.getKey()));

        StringBuilder sb = new StringBuilder();
        if (!scored.isEmpty()) {
            sb.append("Bß║ún ─æß╗ô module khß╗¢p cho \"").append(tuKhoa).append("\" (tß╗æi ─æa 4 mß╗Ñc):\n");
            int limit = Math.min(4, scored.size());
            for (int i = 0; i < limit; i++) {
                SourceIndexEntry e = scored.get(i).getValue();
                sb.append("\n").append(i + 1).append(". ").append(e.title()).append(" [").append(e.id()).append("]\n")
                    .append("- Files: ").append(e.files()).append("\n")
                    .append("- Routes/API: ").append(e.routes()).append("\n")
                    .append("- Tools/li├¬n kß║┐t: ").append(e.tools()).append("\n")
                    .append("- Ghi ch├║: ").append(e.notes()).append("\n");
            }
            sb.append("\n");
        } else {
            sb.append("Bß║ún ─æß╗ô module t─⌐nh ch╞░a c├│ mß╗Ñc khß╗¢p. Chuyß╗ân sang RAG m├ú nguß╗ôn ─æß╗Öng.\n\n");
        }

        CodeRagService rag = codeRagService != null ? codeRagService : new CodeRagService();
        try {
            sb.append(rag.search(tuKhoa));
        } catch (Exception ex) {
            sb.append("RAG m├ú nguß╗ôn ─æß╗Öng lß╗ùi: ").append(ex.getMessage()).append("\n");
            if (scored.isEmpty()) {
                sb.append("Kh├┤ng t├¼m thß║Ñy module khß╗¢p trong index m├ú nguß╗ôn whitelist cho tß╗½ kh├│a: ").append(tuKhoa)
                    .append(". C├│ thß╗â hß╗Åi rß╗Öng h╞ín theo nh├│m: chatbot, agent, provider AI, ph├ón quyß╗ün, ─æß║╖t lß╗ïch, kh├ích h├áng, bß╗çnh ├ín, h├│a ─æ╞ín, kho, marketing, route frontend, health.");
            }
        }
        sb.append("\n\nLuß║¡t bß║úo mß║¡t: chß╗ë trß║ú vß╗ï tr├¡ code, route/API v├á snippet ngß║»n ─æ├ú che secret; kh├┤ng suy ─æo├ín API key, mß║¡t khß║⌐u, token hay nß╗Öi dung file nhß║íy cß║úm.");
        return sb.toString();
    }

    private int scoreSourceIndexEntry(String query, SourceIndexEntry entry) {
        String haystack = normalizeVietnamese((
            entry.id() + " " + entry.title() + " " + entry.keywords() + " " + entry.files() + " " + entry.routes() + " " + entry.tools() + " " + entry.notes()
        ).toLowerCase());
        int score = 0;
        for (String token : query.split("\\s+")) {
            if (token.length() < 2) continue;
            if (haystack.contains(token)) {
                score += token.length() >= 5 ? 3 : 1;
            }
        }
        if (haystack.contains(query)) {
            score += 8;
        }
        return score;
    }

    private String toolXemHoaDon(String trangThai) {
        boolean filter = trangThai != null && !trangThai.isBlank() && !"all".equalsIgnoreCase(trangThai);
        String sql = "SELECT hd.id_hoa_don, hd.ngay_lap_hoa_don, hd.tong_tien_cuoi, hd.trang_thai, kh.ten_khach_hang, kh.sdt " +
            "FROM HoaDon hd LEFT JOIN KhachHang kh ON hd.id_khach_hang = kh.id_khach_hang " +
            (filter ? "WHERE hd.trang_thai = ? " : "") +
            "ORDER BY hd.ngay_lap_hoa_don DESC OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY";
        var rows = filter ? jdbcTemplate.queryForList(sql, trangThai) : jdbcTemplate.queryForList(sql);
        if (rows.isEmpty()) return "Kh├┤ng t├¼m thß║Ñy h├│a ─æ╞ín ph├╣ hß╗úp.";
        StringBuilder sb = new StringBuilder("Danh s├ích h├│a ─æ╞ín (" + rows.size() + " d├▓ng mß╗¢i nhß║Ñt):\n");
        for (var row : rows) {
            sb.append("- #").append(row.get("id_hoa_don"))
                .append(" | ").append(row.get("ten_khach_hang"))
                .append(" | S─ÉT: ").append(row.get("sdt"))
                .append(" | Tß╗òng: ").append(row.get("tong_tien_cuoi"))
                .append(" | TT: ").append(row.get("trang_thai"))
                .append(" | Ng├áy: ").append(row.get("ngay_lap_hoa_don"))
                .append("\n");
        }
        return sb.toString();
    }

    private String maskConfigured(String value) {
        return value == null || value.trim().isEmpty() ? "ch╞░a cß║Ñu h├¼nh" : "─æ├ú cß║Ñu h├¼nh";
    }

    private String safeValue(String value) {
        return value == null || value.trim().isEmpty() ? "d├╣ng fallback m├┤i tr╞░ß╗¥ng" : value.trim();
    }

    private String toolThaoTacTaiKhoan(Map<String, Object> p) {
        try {
            String id = (String) p.get("id_khach_hang");
            String idTaiKhoan = (String) p.get("id_tai_khoan");
            String action = (String) p.get("hanh_dong");
            if ((id == null || id.isBlank()) && (idTaiKhoan == null || idTaiKhoan.isBlank())) {
                return "Lß╗ùi: Thiß║┐u ID kh├ích h├áng hoß║╖c ID t├ái khoß║ún.";
            }
            if ("XOA".equalsIgnoreCase(action) || "KHOA".equalsIgnoreCase(action)) {
                if (!isConfirmedAccountAction(p)) {
                    return "Cß║ºn x├íc nhß║¡n r├╡ tr╞░ß╗¢c khi kh├│a/x├│a t├ái khoß║ún. Gß╗¡i th├¬m tham sß╗æ xac_nhan=true sau khi admin/quß║ún l├╜ ─æ├ú x├íc nhß║¡n thao t├íc.";
                }
                String customerId = resolveCustomerId(id, idTaiKhoan);
                if (customerId == null || customerId.isBlank()) return "Lß╗ùi: Kh├┤ng t├¼m thß║Ñy kh├ích h├áng cß║ºn thao t├íc.";
                int rows = jdbcTemplate.update("UPDATE KhachHang SET da_xoa = true WHERE id_khach_hang = ?", customerId);
                jdbcTemplate.update("UPDATE TaiKhoan SET trang_thai = '─É├ú kh├│a' WHERE id_khach_hang = ?", customerId);
                if (rows > 0) return "Γ£à ─É├ú " + action.toLowerCase() + " t├ái khoß║ún kh├ích h├áng " + customerId + " th├ánh c├┤ng.";
                else return "Lß╗ùi: Kh├┤ng t├¼m thß║Ñy kh├ích h├áng ID " + customerId;
            }
            if ("MO_KHOA".equalsIgnoreCase(action) || "MOKHOA".equalsIgnoreCase(action) || "UNLOCK".equalsIgnoreCase(action)) {
                String customerId = resolveCustomerId(id, idTaiKhoan);
                if (customerId == null || customerId.isBlank()) return "Lß╗ùi: Kh├┤ng t├¼m thß║Ñy kh├ích h├áng cß║ºn mß╗ƒ kh├│a.";
                int customerRows = jdbcTemplate.update("UPDATE KhachHang SET da_xoa = false WHERE id_khach_hang = ?", customerId);
                int accountRows = jdbcTemplate.update("UPDATE TaiKhoan SET trang_thai = 'Hoß║ít ─æß╗Öng' WHERE id_khach_hang = ?", customerId);
                if (customerRows > 0 || accountRows > 0) {
                    return "Γ£à ─É├ú mß╗ƒ kh├│a t├ái khoß║ún kh├ích h├áng " + customerId + " th├ánh c├┤ng.";
                }
                return "Lß╗ùi: Kh├┤ng t├¼m thß║Ñy t├ái khoß║ún kh├ích h├áng ID " + customerId;
            }
            return "Lß╗ùi: H├ánh ─æß╗Öng kh├┤ng hß╗úp lß╗ç. Chß╗ë hß╗ù trß╗ú KHOA, XOA hoß║╖c MO_KHOA.";
        } catch (Exception e) {
            return "Lß╗ùi thao t├íc t├ái khoß║ún: " + e.getMessage();
        }
    }

    private boolean isConfirmedAccountAction(Map<String, Object> params) {
        Object confirmed = params.get("xac_nhan");
        if (confirmed == null) {
            confirmed = params.get("confirm");
        }
        if (confirmed instanceof Boolean value) {
            return value;
        }
        if (confirmed instanceof String value) {
            String normalized = value.trim().toLowerCase();
            return normalized.equals("true") || normalized.equals("yes") || normalized.equals("xac_nhan");
        }
        return false;
    }

    private String resolveCustomerId(String idKhachHang, String idTaiKhoan) {
        if (idKhachHang != null && !idKhachHang.isBlank()) return idKhachHang;
        if (idTaiKhoan == null || idTaiKhoan.isBlank()) return null;
        var rows = jdbcTemplate.queryForList(
            "SELECT id_khach_hang FROM TaiKhoan WHERE id_tai_khoan = ? OR ten_dang_nhap = ?",
            idTaiKhoan,
            idTaiKhoan
        );
        if (rows.isEmpty()) return null;
        Object value = rows.get(0).get("id_khach_hang");
        return value != null ? value.toString() : null;
    }

    private String toolThemThuCung(Map<String, Object> p, String userRole, String username) {
        String ten = Objects.toString(p.get("ten_thu_cung"), "").trim();
        if (ten.isBlank()) {
            return "Lß╗ùi: Thiß║┐u t├¬n th├║ c╞░ng cß║ºn th├¬m.";
        }

        String role = RoleAccessPolicy.normalizeRole(userRole);
        String customerId = Objects.toString(p.get("id_khach_hang"), "").trim();
        if (RoleAccessPolicy.isCustomerRole(role) || role.isBlank()) {
            customerId = resolveCustomerId(null, username);
            if (customerId == null || customerId.isBlank()) {
                return "Lß╗ùi: Kh├┤ng x├íc ─æß╗ïnh ─æ╞░ß╗úc t├ái khoß║ún kh├ích h├áng ─æang ─æ─âng nhß║¡p.";
            }
        } else if (customerId.isBlank()) {
            customerId = resolveCustomerId(null, username);
        }

        if (customerId == null || customerId.isBlank()) {
            return "Lß╗ùi: Thiß║┐u ID kh├ích h├áng ─æß╗â th├¬m th├║ c╞░ng.";
        }

        Integer ownerExists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM KhachHang WHERE id_khach_hang = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))",
            Integer.class,
            customerId
        );
        if (ownerExists == null || ownerExists == 0) {
            return "Lß╗ùi: Kh├┤ng t├¼m thß║Ñy kh├ích h├áng " + customerId + ".";
        }

        var existing = jdbcTemplate.queryForList(
            "SELECT id_thu_cung FROM ThuCung WHERE id_khach_hang = ? AND ten_thu_cung = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) ORDER BY id_thu_cung OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            customerId,
            ten
        );
        if (!existing.isEmpty()) {
            return "─É├ú c├│ th├║ c╞░ng " + ten + " trong t├ái khoß║ún n├áy. ID: " + existing.get(0).get("id_thu_cung") + ".";
        }

        String id = "TC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String loai = Objects.toString(p.getOrDefault("loai", "Ch╞░a x├íc ─æß╗ïnh"), "Ch╞░a x├íc ─æß╗ïnh").trim();
        String giong = Objects.toString(p.getOrDefault("giong", ""), "").trim();
        String gioiTinh = Objects.toString(p.getOrDefault("gioi_tinh", "Kh├┤ng x├íc ─æß╗ïnh"), "Kh├┤ng x├íc ─æß╗ïnh").trim();
        String mauSac = Objects.toString(p.getOrDefault("mau_sac", ""), "").trim();
        String ghiChu = Objects.toString(p.getOrDefault("ghi_chu", "Th├¬m bß╗ƒi Rexi Agent"), "Th├¬m bß╗ƒi Rexi Agent").trim();
        Double trongLuong = parseDoubleOrNull(p.get("trong_luong"));
        LocalDate ngaySinh = parseDateOrNull(p.get("ngay_sinh"));

        jdbcTemplate.update(
            "INSERT INTO ThuCung (id_thu_cung, id_khach_hang, ten_thu_cung, loai, giong, ngay_sinh, gioi_tinh, mau_sac, trong_luong, ghi_chu, da_xoa, ngay_tao) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, CURRENT_TIMESTAMP)",
            id,
            customerId,
            ten,
            loai,
            giong,
            ngaySinh,
            gioiTinh,
            mauSac,
            trongLuong,
            ghiChu
        );
        return "─É├ú th├¬m th├║ c╞░ng " + ten + " cho t├ái khoß║ún " + customerId + ". ID: " + id + ".";
    }

    private Double parseDoubleOrNull(Object value) {
        if (value == null) return null;
        String raw = Objects.toString(value, "").replace(",", ".").trim();
        if (raw.isBlank()) return null;
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDate parseDateOrNull(Object value) {
        if (value == null) return null;
        String raw = Objects.toString(value, "").trim();
        if (raw.isBlank()) return null;
        try {
            return LocalDate.parse(raw);
        } catch (Exception e) {
            return null;
        }
    }

    private String toolTraCuuTaiLieuYKhoa(String tuKhoa, String userRole) {
        StringBuilder sb = new StringBuilder();
        try {
            boolean isSearch = tuKhoa != null && !tuKhoa.trim().isEmpty();
            
            // 1. ─Éß╗ìc t├ái liß╗çu VNUA tß╗½ file RAG t─⌐nh cß╗▒c kß╗│ tß╗æi ╞░u.
            java.nio.file.Path path = java.util.List.of(
                    java.nio.file.Paths.get("uploads/docs/DANH_SACH_TAI_LIEU_VNUA.md"),
                    java.nio.file.Paths.get("../uploads/docs/DANH_SACH_TAI_LIEU_VNUA.md")
                ).stream()
                .filter(java.nio.file.Files::exists)
                .findFirst()
                .orElse(java.nio.file.Paths.get("uploads/docs/DANH_SACH_TAI_LIEU_VNUA.md"));
            if (java.nio.file.Files.exists(path)) {
                List<String> staticLines = java.nio.file.Files.readAllLines(path, java.nio.charset.StandardCharsets.UTF_8);
                sb.append("≡ƒôÜ [Hß╗å THß╗ÉNG RAG] ─Éang truy xuß║Ñt gi├ío tr├¼nh VNUA tß╗½ th╞░ viß╗çn t─⌐nh:\n");

                boolean foundInStatic = false;
                String normalizedSearch = isSearch ? normalizeVietnamese(tuKhoa.toLowerCase()) : "";
                String currentSubject = "T├ái liß╗çu VNUA";
                StringBuilder currentBlock = new StringBuilder();
                for (String line : staticLines) {
                    if (line.startsWith("## ")) {
                        foundInStatic = appendVnuaIndexBlock(sb, currentSubject, currentBlock.toString(), normalizedSearch, isSearch) || foundInStatic;
                        currentSubject = line.replace("#", "").trim();
                        currentBlock.setLength(0);
                    } else if (!line.startsWith("# ")) {
                        currentBlock.append(line).append("\n");
                    }
                }
                foundInStatic = appendVnuaIndexBlock(sb, currentSubject, currentBlock.toString(), normalizedSearch, isSearch) || foundInStatic;

                if (foundInStatic) {
                    String[] lines = sb.toString().split("\\R");
                    if (lines.length > 80) {
                        StringBuilder trimmed = new StringBuilder();
                        int kept = 0;
                        for (String line : lines) {
                            if (line.startsWith("≡ƒôÜ") || line.startsWith("- M├┤n") || line.startsWith("  - File") || line.startsWith("  - Link mß╗ƒ PDF") || line.startsWith("  - Link ngo├ái") || line.startsWith("  - ─É╞░ß╗¥ng dß║½n") || line.startsWith("  - Tß╗½ kh├│a")) {
                                trimmed.append(line).append("\n");
                                kept++;
                            }
                            if (kept >= 80) {
                                trimmed.append("... ─æ├ú r├║t gß╗ìn danh s├ích, h├úy t├¼m tß╗½ kh├│a cß╗Ñ thß╗â h╞ín nß║┐u cß║ºn.\n");
                                break;
                            }
                        }
                        sb.setLength(0);
                        sb.append(trimmed);
                    }
                }

                if (!foundInStatic && isSearch) {
                    sb.append("(Kh├┤ng t├¼m thß║Ñy gi├ío tr├¼nh VNUA t─⌐nh n├áo khß╗¢p trß╗▒c tiß║┐p vß╗¢i tß╗½ kh├│a '").append(tuKhoa).append("')\n");
                }
                sb.append("\n");
            }

            // 2. Kß║┐t hß╗úp truy vß║Ñn Database bß║úng file_dinh_kem (nß║┐u sau n├áy sß║┐p upload th├¬m file vß║¡t l├╜ mß╗¢i)
            String sql = "SELECT id, ten_file, duong_dan, loai, kich_thuoc " +
                         "FROM file_dinh_kem " +
                         "WHERE loai = 'T├ái liß╗çu' OR ten_file LIKE '%.pdf' OR ten_file LIKE '%.docx'";
            
            List<Map<String, Object>> dbRows;
            if (isSearch) {
                String searchSql = sql + " AND (LOWER(COALESCE(ten_file, '')) LIKE LOWER(?))";
                dbRows = jdbcTemplate.queryForList(searchSql, "%" + tuKhoa.trim() + "%");
            } else {
                dbRows = jdbcTemplate.queryForList(sql);
            }

            if (!dbRows.isEmpty()) {
                sb.append("≡ƒôé [T├ÇI LIß╗åU Tß║óI L├èN] Ph├ít hiß╗çn ").append(dbRows.size()).append(" t├ái liß╗çu sß║┐p vß╗½a upload l├¬n hß╗ç thß╗æng:\n");
                for (int i = 0; i < Math.min(dbRows.size(), 5); i++) {
                    var r = dbRows.get(i);
                    double sizeMb = (r.get("kich_thuoc") != null) ? ((Long) r.get("kich_thuoc")) / (1024.0 * 1024.0) : 0.0;
                    sb.append(String.format("  - %s | ID: %s | %.2f MB\n", r.get("ten_file"), r.get("id"), sizeMb));
                    sb.append("    Γ₧ö Mß╗ƒ xem nhanh: ").append(r.get("duong_dan")).append("\n");
                }
                if (dbRows.size() > 5) {
                    sb.append("  ... v├á mß╗Öt sß╗æ t├ái liß╗çu tß║úi l├¬n kh├íc.\n");
                }
            }

            if (sb.length() == 0) {
                return "Kh├┤ng t├¼m thß║Ñy bß║Ñt kß╗│ t├ái liß╗çu y khoa VNUA n├áo ph├╣ hß╗úp vß╗¢i tß╗½ kh├│a: \"" + (isSearch ? tuKhoa : "tß║Ñt cß║ú") + "\".";
            }

            sb.append("\nH╞░ß╗¢ng dß║½n cho AI: H├úy ─æ╞░a ra chß║⌐n ─æo├ín dß╗▒a tr├¬n t├ái liß╗çu VNUA n├áy v├á cung cß║Ñp ─æ╞░ß╗¥ng dß║½n Link tß║úi/xem PDF trß╗▒c tiß║┐p cho sß║┐p bß║Ñm mß╗ƒ nh├⌐!");
            return sb.toString();
        } catch (Exception e) {
            return "Lß╗ùi khi truy xuß║Ñt t├ái liß╗çu y khoa: " + e.getMessage();
        }
    }

    private boolean appendVnuaIndexBlock(StringBuilder sb, String subject, String block, String normalizedSearch, boolean isSearch) {
        if (block == null || block.isBlank()) return false;
        String normalizedBlock = normalizeVietnamese((subject + "\n" + block).toLowerCase());
        if (isSearch && !normalizedBlock.contains(normalizedSearch)) return false;

        sb.append("- M├┤n [").append(subject).append("]:\n");
        for (String rawLine : block.split("\\R")) {
            String line = rawLine.trim();
            if (line.startsWith("- File:") || line.startsWith("- ─É╞░ß╗¥ng dß║½n") || line.startsWith("- Link ngo├ái") || line.startsWith("- Tß╗½ kh├│a")) {
                sb.append("  ").append(line).append("\n");
                if (line.startsWith("- File:")) {
                    String fileName = line.substring("- File:".length()).trim();
                    sb.append("  - Link mß╗ƒ PDF: ").append(toVnuaPublicPdfUrl(fileName)).append("\n");
                }
            }
        }
        return true;
    }

    private String toVnuaPublicPdfUrl(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "/vnua-docs/";
        }
        return "/vnua-docs/" + java.net.URLEncoder.encode(fileName, java.nio.charset.StandardCharsets.UTF_8)
                .replace("+", "%20");
    }

    // ─── Implementations: Schedule Tools ───────────────────────────────────────

    private String toolGetStaffSchedule(java.util.Map<String, Object> p) {
        String staff = java.util.Objects.toString(p.getOrDefault("staff",""),"").trim();
        String week  = java.util.Objects.toString(p.getOrDefault("week","this"),"").trim();
        java.time.LocalDate today = java.time.LocalDate.now(VN_ZONE);
        java.time.LocalDate ws = today.with(java.time.DayOfWeek.MONDAY);
        if ("next".equals(week)) ws = ws.plusWeeks(1);
        java.time.LocalDate we = ws.plusDays(6);
        try {
            java.util.List<Object> qp = new java.util.ArrayList<>();
            StringBuilder sql = new StringBuilder(
                "SELECT l.ngay_lam, l.gio_bat_dau, l.gio_ket_thuc, l.ghi_chu, nv.ho_ten " +
                "FROM LichLamViecNhanVien l JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien " +
                "WHERE l.ngay_lam >= ? AND l.ngay_lam <= ? ");
            qp.add(java.sql.Date.valueOf(ws)); qp.add(java.sql.Date.valueOf(we));
            if (!staff.isBlank()) { sql.append("AND LOWER(nv.ho_ten) LIKE LOWER(?) "); qp.add("%" + staff + "%"); }
            sql.append("ORDER BY l.ngay_lam, l.gio_bat_dau ");
            sql.append(com.rexi.pkty.util.DatabaseDialect.paginationSql(com.rexi.pkty.util.DatabaseDialect.isPostgres(jdbcTemplate), 20, 0));
            var rows = jdbcTemplate.queryForList(sql.toString(), qp.toArray());
            if (rows.isEmpty()) return "Khong tim thay lich lam viec" + (staff.isBlank() ? "" : " cua " + staff) + " tu " + ws + " den " + we + ".";
            StringBuilder sb = new StringBuilder("Lich lam viec " + (staff.isBlank() ? "toan bo nhan su" : staff) + " (" + ("next".equals(week) ? "tuan sau" : "tuan nay") + " " + ws + " -> " + we + "):\n");
            for (var r : rows) { sb.append("- ").append(r.get("ngay_lam")).append(" | ").append(r.get("ho_ten")).append(" | ").append(r.get("gio_bat_dau")).append("-").append(r.get("gio_ket_thuc")).append("\n"); }
            return sb.toString().trim();
        } catch (Exception e) { return "Loi tra lich lam viec: " + e.getMessage(); }
    }

    private String toolGetSlotUsage(java.util.Map<String, Object> p) {
        String dateStr = java.util.Objects.toString(p.getOrDefault("date","today"),"").trim();
        String timeStr = java.util.Objects.toString(p.getOrDefault("time",""),"").trim();
        java.time.LocalDate date = "tomorrow".equals(dateStr) ? java.time.LocalDate.now(VN_ZONE).plusDays(1) : java.time.LocalDate.now(VN_ZONE);
        if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) { try { date = java.time.LocalDate.parse(dateStr); } catch (Exception ignored) {} }
        try {
            java.util.List<Object> qp = new java.util.ArrayList<>();
            StringBuilder sql = new StringBuilder("SELECT nv.ho_ten, l.gio_bat_dau, l.gio_ket_thuc FROM LichLamViecNhanVien l JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien WHERE CAST(l.ngay_lam AS DATE) = ? ");
            qp.add(java.sql.Date.valueOf(date));
            if (!timeStr.isBlank()) { sql.append("AND l.gio_bat_dau <= ? AND l.gio_ket_thuc >= ? "); qp.add(timeStr); qp.add(timeStr); }
            sql.append(com.rexi.pkty.util.DatabaseDialect.paginationSql(com.rexi.pkty.util.DatabaseDialect.isPostgres(jdbcTemplate), 20, 0));
            var rows = jdbcTemplate.queryForList(sql.toString(), qp.toArray());
            if (rows.isEmpty()) return "Chua co nhan su nao dang ky ca" + (timeStr.isBlank() ? "" : " " + timeStr) + " ngay " + date + ".";
            StringBuilder sb = new StringBuilder("Slot ngay " + date + (timeStr.isBlank() ? "" : " luc " + timeStr) + " (" + rows.size() + " nhan su):\n");
            for (var r : rows) sb.append("- ").append(r.get("ho_ten")).append(" (").append(r.get("gio_bat_dau")).append("-").append(r.get("gio_ket_thuc")).append(")\n");
            if (rows.size() >= 3) sb.append("⚠️ Slot da du 3 nhan su. Can quyen quan ly/admin de override.");
            return sb.toString().trim();
        } catch (Exception e) { return "Loi kiem tra slot: " + e.getMessage(); }
    }

    private String toolCheckConflict(java.util.Map<String, Object> p) {
        String staff = java.util.Objects.toString(p.getOrDefault("staff",""),"").trim();
        String dateStr = java.util.Objects.toString(p.getOrDefault("date","today"),"").trim();
        String timeStr = java.util.Objects.toString(p.getOrDefault("time",""),"").trim();
        java.time.LocalDate date = "tomorrow".equals(dateStr) ? java.time.LocalDate.now(VN_ZONE).plusDays(1) : java.time.LocalDate.now(VN_ZONE);
        if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) { try { date = java.time.LocalDate.parse(dateStr); } catch (Exception ignored) {} }
        try {
            java.util.List<Object> qp = new java.util.ArrayList<>();
            StringBuilder sql = new StringBuilder("SELECT nv.ho_ten, l.ngay_lam, l.gio_bat_dau, l.gio_ket_thuc FROM LichLamViecNhanVien l JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien WHERE CAST(l.ngay_lam AS DATE) = ? ");
            qp.add(java.sql.Date.valueOf(date));
            if (!staff.isBlank()) { sql.append("AND LOWER(nv.ho_ten) LIKE LOWER(?) "); qp.add("%" + staff + "%"); }
            if (!timeStr.isBlank()) { sql.append("AND l.gio_bat_dau <= ? AND l.gio_ket_thuc >= ? "); qp.add(timeStr); qp.add(timeStr); }
            sql.append(com.rexi.pkty.util.DatabaseDialect.paginationSql(com.rexi.pkty.util.DatabaseDialect.isPostgres(jdbcTemplate), 10, 0));
            var rows = jdbcTemplate.queryForList(sql.toString(), qp.toArray());
            if (rows.isEmpty()) return "Khong phat hien xung dot lich" + (staff.isBlank() ? "" : " cho " + staff) + " ngay " + date + ".";
            StringBuilder sb = new StringBuilder("Phat hien " + rows.size() + " ca da dang ky ngay " + date + ":\n");
            for (var r : rows) sb.append("- ").append(r.get("ho_ten")).append(": ").append(r.get("gio_bat_dau")).append("-").append(r.get("gio_ket_thuc")).append("\n");
            if (rows.size() >= 3) sb.append("⚠️ Slot full (>=3 nhan su). Can override neu muon them.");
            return sb.toString().trim();
        } catch (Exception e) { return "Loi kiem tra xung dot: " + e.getMessage(); }
    }

    private String toolFindOverlapStaff(java.util.Map<String, Object> p) {
        String week = java.util.Objects.toString(p.getOrDefault("week","this"),"").trim();
        java.time.LocalDate ws = java.time.LocalDate.now(VN_ZONE).with(java.time.DayOfWeek.MONDAY);
        if ("next".equals(week)) ws = ws.plusWeeks(1);
        java.time.LocalDate we = ws.plusDays(6);
        try {
            String sql = "SELECT a.ngay_lam, na.ho_ten AS nhan_su, a.gio_bat_dau AS bat_a, a.gio_ket_thuc AS ket_a, b.gio_bat_dau AS bat_b, b.gio_ket_thuc AS ket_b FROM LichLamViecNhanVien a JOIN LichLamViecNhanVien b ON a.id_nhan_vien = b.id_nhan_vien AND a.ngay_lam = b.ngay_lam AND a.id_lich_lam_viec < b.id_lich_lam_viec AND a.gio_bat_dau < b.gio_ket_thuc AND b.gio_bat_dau < a.gio_ket_thuc JOIN NhanVien na ON a.id_nhan_vien = na.id_nhan_vien WHERE a.ngay_lam >= ? AND a.ngay_lam <= ? ORDER BY a.ngay_lam";
            var rows = jdbcTemplate.queryForList(sql, java.sql.Date.valueOf(ws), java.sql.Date.valueOf(we));
            if (rows.isEmpty()) return "Khong phat hien ca trung lich trong " + ("next".equals(week) ? "tuan sau" : "tuan nay") + " (" + ws + " -> " + we + ").";
            StringBuilder sb = new StringBuilder("Phat hien " + rows.size() + " cap ca trung:\n");
            for (var r : rows) sb.append("- ").append(r.get("ngay_lam")).append(" | ").append(r.get("nhan_su")).append(" | Ca A: ").append(r.get("bat_a")).append("-").append(r.get("ket_a")).append(" <-> Ca B: ").append(r.get("bat_b")).append("-").append(r.get("ket_b")).append("\n");
            return sb.toString().trim();
        } catch (Exception e) { return "Loi tim ca trung: " + e.getMessage(); }
    }

    private String toolFindFreeStaff(java.util.Map<String, Object> p) {
        String dateStr = java.util.Objects.toString(p.getOrDefault("date","today"),"").trim();
        java.time.LocalDate date = "tomorrow".equals(dateStr) ? java.time.LocalDate.now(VN_ZONE).plusDays(1) : java.time.LocalDate.now(VN_ZONE);
        if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) { try { date = java.time.LocalDate.parse(dateStr); } catch (Exception ignored) {} }
        try {
            var rows = jdbcTemplate.queryForList("SELECT nv.ho_ten, nv.chuc_vu FROM NhanVien nv WHERE nv.id_nhan_vien NOT IN (SELECT l.id_nhan_vien FROM LichLamViecNhanVien l WHERE CAST(l.ngay_lam AS DATE) = ?) ORDER BY nv.ho_ten", java.sql.Date.valueOf(date));
            if (rows.isEmpty()) return "Tat ca nhan su deu co lich ngay " + date + ". Khong ai ranh.";
            StringBuilder sb = new StringBuilder("Nhan su ranh ngay " + date + " (" + rows.size() + " nguoi):\n");
            for (var r : rows) sb.append("- ").append(r.get("ho_ten")).append(" (").append(r.get("chuc_vu")).append(")\n");
            return sb.toString().trim();
        } catch (Exception e) { return "Loi tim nhan su ranh: " + e.getMessage(); }
    }

    private String toolSuggestSchedule(java.util.Map<String, Object> p) {
        String staff = java.util.Objects.toString(p.getOrDefault("staff",""),"").trim();
        String week  = java.util.Objects.toString(p.getOrDefault("week","next"),"").trim();
        if (staff.isBlank()) return "Thieu ten nhan su de goi y lich. Vui long cung cap ten.";
        java.time.LocalDate ws = java.time.LocalDate.now(VN_ZONE).with(java.time.DayOfWeek.MONDAY);
        if (!"this".equals(week)) ws = ws.plusWeeks(1);
        java.time.LocalDate we = ws.plusDays(6);
        try {
            var busy = jdbcTemplate.queryForList("SELECT DISTINCT CAST(l.ngay_lam AS DATE) AS d FROM LichLamViecNhanVien l JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien WHERE LOWER(nv.ho_ten) LIKE LOWER(?) AND l.ngay_lam >= ? AND l.ngay_lam <= ?", "%" + staff + "%", java.sql.Date.valueOf(ws), java.sql.Date.valueOf(we));
            java.util.Set<String> busyDays = new java.util.HashSet<>();
            for (var r : busy) busyDays.add(java.util.Objects.toString(r.get("d"),""));
            StringBuilder sb = new StringBuilder("Goi y xep lich cho " + staff + " tuan " + ("this".equals(week) ? "nay" : "sau") + ":\n");
            boolean any = false;
            for (java.time.LocalDate d = ws; !d.isAfter(we); d = d.plusDays(1)) {
                if (d.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) continue;
                if (!busyDays.contains(d.toString())) { sb.append("✅ ").append(d).append(" (").append(d.getDayOfWeek()).append(") — Ranh, co the xep ca\n"); any = true; }
            }
            if (!any) sb.append("⚠️ Tuan nay " + staff + " da kin lich ca tuan.\n");
            return sb.toString().trim();
        } catch (Exception e) { return "Loi goi y lich: " + e.getMessage(); }
    }

    private String toolAutoSchedule(java.util.Map<String, Object> p) {
        String week = java.util.Objects.toString(p.getOrDefault("week","next"),"").trim();
        java.time.LocalDate ws = java.time.LocalDate.now(VN_ZONE).with(java.time.DayOfWeek.MONDAY);
        if (!"this".equals(week)) ws = ws.plusWeeks(1);
        java.time.LocalDate we = ws.plusDays(6);
        try {
            var staff = jdbcTemplate.queryForList("SELECT nv.id_nhan_vien, nv.ho_ten, nv.chuc_vu FROM NhanVien nv ORDER BY nv.ho_ten");
            var existing = jdbcTemplate.queryForList("SELECT l.id_nhan_vien, CAST(l.ngay_lam AS DATE) AS d FROM LichLamViecNhanVien l WHERE l.ngay_lam >= ? AND l.ngay_lam <= ?", java.sql.Date.valueOf(ws), java.sql.Date.valueOf(we));
            java.util.Map<String,java.util.Set<String>> busyMap = new java.util.HashMap<>();
            for (var r : existing) { String sid = java.util.Objects.toString(r.get("id_nhan_vien"),""); busyMap.computeIfAbsent(sid, k -> new java.util.HashSet<>()).add(java.util.Objects.toString(r.get("d"),"")); }
            StringBuilder sb = new StringBuilder("📋 Goi y lich tu dong tuan " + ("this".equals(week) ? "nay" : "sau") + " (" + ws + " -> " + we + "):\n");
            for (var s : staff) {
                String sid = java.util.Objects.toString(s.get("id_nhan_vien"),"");
                java.util.Set<String> busy = busyMap.getOrDefault(sid, new java.util.HashSet<>());
                sb.append("\n🔹 ").append(s.get("ho_ten")).append(" (").append(s.get("chuc_vu")).append("):\n");
                for (java.time.LocalDate d = ws; !d.isAfter(we); d = d.plusDays(1)) {
                    if (d.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) continue;
                    sb.append("  ").append(busy.contains(d.toString()) ? "✅" : "⬜").append(" ").append(d).append("\n");
                }
            }
            sb.append("\nℹ️ (✅ da co lich, ⬜ chua xep)");
            return sb.toString().trim();
        } catch (Exception e) { return "Loi tu dong xep lich: " + e.getMessage(); }
    }

    private String toolOverrideDoctorSlot(java.util.Map<String, Object> p) {
        String staff  = java.util.Objects.toString(p.getOrDefault("staff",""),"").trim();
        String date   = java.util.Objects.toString(p.getOrDefault("date",""),"").trim();
        String time   = java.util.Objects.toString(p.getOrDefault("time",""),"").trim();
        String reason = java.util.Objects.toString(p.getOrDefault("reason","Quan ly yeu cau override"),"").trim();
        if (staff.isBlank()) return "Override that bai: thieu ten bac si can ep ca.";
        return String.format(
            "⚠️ XAC NHAN OVERRIDE:\n- Bac si: %s\n- Ngay: %s\n- Ca: %s\n- Ly do: %s\n" +
            "Slot da vuot gioi han 3 bac si. Vui long truy cap [/quan-ly/lich-lam-viec] de xac nhan thu cong.",
            staff, date.isBlank() ? "hom nay" : date, time.isBlank() ? "chua xac dinh" : time, reason);
    }


}
