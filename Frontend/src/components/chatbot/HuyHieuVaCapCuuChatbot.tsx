import React from "react";
import { normalizeSearchText } from "../../utils";

export const HuyHieuLamSangChatbot: React.FC<{
    msg: any;
    isClinicalUser: boolean;
    isDark: boolean;
}> = ({ msg, isClinicalUser, isDark }) => {
    if (!msg || msg.type !== "ai" || msg.isError) return null;
    const text = String(msg.text || "");
    const normalized = normalizeSearchText(text);
    const hasMedicalSignal = [
        "thuoc", "duoc", "lieu", "khang sinh", "phac do", "dieu tri", "chan doan",
        "xet nghiem", "benh", "trieu chung", "cap cuu", "ngo doc", "gay me"
    ].some(keyword => normalized.includes(keyword));
    if (!hasMedicalSignal && !msg.treatmentData && !msg.isEmergency) return null;

    const badge = isClinicalUser
        ? {
            icon: "clinical_notes",
            label: "Tham khảo cho bác sĩ",
            detail: "Cần đối chiếu khám trực tiếp, cân nặng, tiền sử và xét nghiệm trước khi quyết định.",
            color: "#be123c",
            bg: isDark ? "rgba(190, 18, 60, 0.16)" : "rgba(255, 241, 242, 0.96)",
            border: "rgba(190, 18, 60, 0.32)"
        }
        : {
            icon: "health_and_safety",
            label: "Tư vấn an toàn",
            detail: "Không thay thế bác sĩ; không tự dùng thuốc kê đơn hoặc kháng sinh.",
            color: "#0f766e",
            bg: isDark ? "rgba(15, 118, 110, 0.16)" : "rgba(240, 253, 250, 0.96)",
            border: "rgba(15, 118, 110, 0.28)"
        };

    return (
        <div style={{
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 9px',
            borderRadius: '8px',
            background: badge.bg,
            border: `1px solid ${badge.border}`,
            color: badge.color,
            fontSize: '0.72rem',
            fontWeight: 900,
            lineHeight: 1.25
        }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{badge.icon}</span>
            <span>{badge.label}</span>
            <span style={{ fontWeight: 700, opacity: 0.82 }}>{badge.detail}</span>
        </div>
    );
};

export const BangCapCuuChatbot: React.FC<{
    isClinicSide: boolean;
    onOpenReception: () => void;
    onOpenDoctorSchedule: () => void;
    onShareLocation: () => void;
}> = ({ isClinicSide, onOpenReception, onOpenDoctorSchedule, onShareLocation }) => {
    if (isClinicSide) {
        return (
            <div style={{
                marginTop: '12px', padding: '16px', borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.15)', border: '1.5px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)', color: '#fca5a5'
            }}>
                <div style={{ fontWeight: 950, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '0.9rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', animation: 'blink 1s infinite' }}>emergency</span>
                    🚨 ALARM: QUY TRÌNH LÂM SÀNG CẤP CỨU THÚ Y KHẨN CẤP
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.95, marginBottom: '12px', fontWeight: 600, lineHeight: 1.5 }}>
                    - **Dị vật/Ngạt thở:** Thực hiện thủ thuật Heimlich cơ học ngay. Chuẩn bị đặt nội khí quản + nguồn oxy hỗ trợ thở.<br />
                    - **Co giật nặng:** Thiết lập đường truyền IV khẩn cấp. Chuẩn bị tiêm tĩnh mạch Diazepam **liều 0.5 - 1.0 mg/kg** hoặc đặt trực tràng.<br />
                    - **Chảy máu cấp:** Băng ép lực ổn định, truyền dịch chống sốc.
                </div>
                <div className="responsive-grid-2">
                    <button data-ai-id="button-chatbot-tahq" onClick={onOpenReception} style={{
                        background: '#ef4444', color: 'white', border: 'none',
                        borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment_ind</span>
                        MỞ TIẾP ĐÓN NHANH
                    </button>
                    <button data-ai-id="button-chatbot-sgm6" onClick={onOpenDoctorSchedule} style={{
                        background: 'transparent', border: '1.5px solid #ef4444', color: '#ef4444',
                        borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>medical_information</span>
                        BÁC SĨ ĐANG TRỰC
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            marginTop: '12px', padding: '16px', borderRadius: '16px',
            background: 'rgba(244, 63, 94, 0.15)', border: '1.5px solid rgba(244, 63, 94, 0.4)',
            boxShadow: '0 0 15px rgba(244, 63, 94, 0.2)', color: '#fda4af'
        }}>
            <div style={{ fontWeight: 950, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fb7185', fontSize: '0.9rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', animation: 'blink 1.5s infinite' }}>medical_services</span>
                🚨 HƯỚNG DẪN SƠ CỨU KHẨN CẤP CHO BÉ YÊU
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.95, marginBottom: '12px', fontWeight: 600, lineHeight: 1.5 }}>
                - **Hóc xương/Dị vật:** Thực hiện thủ thuật Heimlich (Mèo/Chó nhỏ: dốc ngược lưng, vỗ 5 lần vào giữa 2 bả vai; Chó lớn: ôm bụng giật mạnh lên trên).<br />
                - **Ngộ độc:** Đưa bé đến ngay Rexi hoặc trạm thú y gần nhất. Tuyệt đối không tự ý gây nôn trừ khi có chỉ định bác sĩ qua hotline.<br />
                - **Đường dây nóng Cấp cứu:** Gọi trực tiếp số hotline **0353.374.156**
            </div>
            <div className="emergency-customer-actions">
                <a data-ai-id="link_emergency_hotline" href="tel:***REMOVED***-VIETQR_ACCOUNT_NO" className="emergency-customer-action" style={{
                    textDecoration: 'none', background: '#fb7185', color: 'white',
                    borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                    GỌI HOTLINE KHẨN
                </a>
                <a data-ai-id="link_emergency_directions" href="https://www.google.com/maps/search/?api=1&query=Ph%C3%B2ng+kh%C3%A1m+th%C3%BA+y+Rexi+S%E1%BB%91+68+Ng%C3%B5+10+Ng%C3%B4+Xu%C3%A2n+Qu%E1%BA%A3ng+Tr%C3%A2u+Qu%E1%BB%B3+Gia+L%C3%A2m+H%C3%A0+N%E1%BB%99i" target="_blank" rel="noreferrer" className="emergency-customer-action" style={{
                    textDecoration: 'none', background: 'transparent', border: '1.5px solid #fb7185', color: '#fb7185',
                    borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>explore</span>
                    ĐƯỜNG ĐẾN PHÒNG KHÁM
                </a>
                <button data-ai-id="button-chatbot-share-location" type="button" onClick={onShareLocation} className="emergency-customer-action emergency-customer-location-action" style={{
                    background: '#0ea5e9', color: 'white', border: 'none',
                    borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>my_location</span>
                    GỬI VỊ TRÍ CỦA TÔI
                </button>
            </div>
        </div>
    );
};
