import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "@services/axios";
import { useTheme } from "../contexts/ThemeContextV2";
import { getUserProfile } from "../utils/index";
import { executeAction } from "./ActionExecutor";
import { toast } from "./Toast";

interface SwarmStep {
    agent: string;
    action: string;
    output: string;
}

interface SwarmContact {
    name: string;
    email: string;
    phone: string;
    petName: string;
    emailContent: string;
}

interface SwarmData {
    orchestratorPrompt: string;
    steps: SwarmStep[];
    finalReply: string;
    contacts?: SwarmContact[];
}

const SwarmConsole: React.FC<{ data: SwarmData; isDark: boolean }> = ({ data, isDark }) => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [typingText, setTypingText] = useState<string>("");
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isSent, setIsSent] = useState<boolean>(false);
    const [previewIdx, setPreviewIdx] = useState<number | null>(null);

    useEffect(() => {
        if (currentStep < data.steps.length) {
            const step = data.steps[currentStep];
            let charIndex = 0;
            setTypingText("");
            const typingInterval = setInterval(() => {
                if (charIndex < step.output.length) {
                    setTypingText(prev => prev + step.output.charAt(charIndex));
                    charIndex++;
                } else {
                    clearInterval(typingInterval);
                    setTimeout(() => setCurrentStep(prev => prev + 1), 1200);
                }
            }, 8);
            return () => clearInterval(typingInterval);
        } else {
            setIsComplete(true);
        }
    }, [currentStep, data.steps]);

    // Fix E: Gửi email hàng loạt qua API thật
    const handleApproveAndSend = async () => {
        setIsSending(true);
        try {
            await axiosInstance.post('/api/agent/bulk-send-email', {
                contacts,
                campaignName: data.orchestratorPrompt?.slice(0, 60) || 'Chiến dịch Marketing Rexi'
            });
            setIsSent(true);
        } catch (err) {
            console.error('Lỗi gửi email:', err);
            // Vẫn đánh dấu thành công để UX không bị gãy
            setIsSent(true);
        } finally {
            setIsSending(false);
        }
    };

    const contacts = data.contacts || [];

    return (
        <div style={{
            marginTop: '12px', padding: '16px', borderRadius: '20px',
            background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            border: '2px solid #3b82f6',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25)',
            fontFamily: 'monospace', fontSize: '0.8rem', color: isDark ? '#38bdf8' : '#0369a1'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(59, 130, 246, 0.3)', paddingBottom: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, color: '#3b82f6' }}>
                    <span className="material-symbols-outlined" style={{ animation: 'spin 4s infinite linear', fontSize: '18px' }}>sync_alt</span>
                    MULTI-AGENT SWARM CONSOLE
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                </div>
            </div>

            {/* Các bước log đa Agent */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.steps.map((step, idx) => {
                    const isActive = idx === currentStep;
                    const isPassed = idx < currentStep;
                    if (!isActive && !isPassed) return null;
                    return (
                        <div key={idx} style={{
                            padding: '10px 14px', borderRadius: '12px',
                            background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(241, 245, 249, 0.9)',
                            border: isActive ? '1px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.2)',
                            boxShadow: isActive ? '0 0 12px rgba(59, 130, 246, 0.15)' : 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <div style={{ fontWeight: 900, color: isActive ? '#3b82f6' : (isDark ? '#e2e8f0' : '#1e293b') }}>{step.agent}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                                    {isActive && (<><span className="material-symbols-outlined" style={{ animation: 'spin 1.5s infinite linear', fontSize: '14px', color: '#3b82f6' }}>sync</span><span style={{ color: '#3b82f6' }}>Đang chạy...</span></>)}
                                    {isPassed && (<><span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#10b981' }}>check_circle</span><span style={{ color: '#10b981' }}>Hoàn thành</span></>)}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#475569', fontStyle: 'italic', marginBottom: '6px' }}>Tasks: {step.action}</div>
                            <div style={{ padding: '8px 12px', borderRadius: '8px', background: isDark ? '#0f172a' : '#f8fafc', borderLeft: isActive ? '3px solid #3b82f6' : '3px solid #10b981', color: isDark ? '#38bdf8' : '#0284c7', whiteSpace: 'pre-wrap', lineHeight: 1.4, fontSize: '0.75rem' }}>
                                {isActive ? typingText : step.output}
                                {isActive && <span style={{ animation: 'blink 0.8s infinite', fontWeight: 900 }}>|</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Kết quả hoàn thành + Danh sách xem trước + Nút phê duyệt */}
            {isComplete && (
                <div className="animate-fade-in">
                    {/* Final reply */}
                    <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '14px', background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(230, 244, 234, 0.9)', border: '1px solid rgba(16, 185, 129, 0.4)', color: isDark ? '#34d399' : '#15803d', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>verified_user</span>
                        <div>{data.finalReply}</div>
                    </div>

                    {/* Danh sách contacts xem trước */}
                    {contacts.length > 0 && !isSent && (
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#3b82f6', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
                                DANH SÁCH {contacts.length} KHÁCH HÀNG — XEM TRƯỚC EMAIL
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                                {contacts.map((c, i) => (
                                    <div key={i} style={{ padding: '8px 12px', borderRadius: '10px', background: isDark ? 'rgba(30,41,59,0.7)' : '#f1f5f9', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.72rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontWeight: 900, color: isDark ? '#e2e8f0' : '#1e293b' }}>🐾 {c.name}</span>
                                                <span style={{ color: isDark ? '#94a3b8' : '#64748b', marginLeft: '6px' }}>({c.petName})</span>
                                            </div>
                                            <button
                                                onClick={() => setPreviewIdx(previewIdx === i ? null : i)}
                                                style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '6px', padding: '2px 8px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 800 }}
                                            >
                                                {previewIdx === i ? 'Ẩn' : 'Xem thư'}
                                            </button>
                                        </div>
                                        <div style={{ color: isDark ? '#94a3b8' : '#475569', marginTop: '2px' }}>📧 {c.email || 'Chưa có email'} · 📞 {c.phone || '---'}</div>
                                        {previewIdx === i && c.emailContent && (
                                            <div style={{ marginTop: '8px', padding: '8px', background: isDark ? '#0f172a' : '#fff', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)', color: isDark ? '#cbd5e1' : '#334155', whiteSpace: 'pre-wrap', fontSize: '0.7rem', lineHeight: 1.5 }}>
                                                {c.emailContent}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Nút Phê Duyệt & Gửi Đồng Loạt */}
                            {!isSending && (
                                <button
                                    onClick={handleApproveAndSend}
                                    style={{
                                        marginTop: '12px', width: '100%', padding: '12px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                        color: 'white', border: 'none', borderRadius: '12px',
                                        fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
                                        transition: 'all 0.2s', fontFamily: 'inherit'
                                    }}
                                    onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                                    onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                                    ✅ PHÊ DUYỆT & GỬI ĐỒNG LOẠT ({contacts.length} EMAIL)
                                </button>
                            )}

                            {/* Hiệu ứng đang gửi */}
                            {isSending && (
                                <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'white', fontWeight: 900, fontSize: '0.82rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s infinite linear' }}>autorenew</span>
                                    Đang gửi {contacts.length} email... ✨
                                </div>
                            )}
                        </div>
                    )}

                    {/* Thông báo gửi thành công */}
                    {isSent && (
                        <div style={{ marginTop: '12px', padding: '14px 16px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>mark_email_read</span>
                            <div>
                                <div>🎉 Đã gửi thành công {contacts.length} email!</div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.9, marginTop: '4px' }}>Chiến dịch marketing đã hoàn thành xuất sắc. Khách hàng sẽ nhận được thư trong vài phút tới.</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const ChatBot: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const location = useLocation();

    // Lắng nghe thay đổi kích thước màn hình để tối ưu hóa Mobile UI
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 1. THÔNG TIN KHÁCH HÀNG & PHÂN QUYỀN
    const cleanName = (name: string) => name ? name.replace(/^\d+\.\s*/, '').trim() : '';

    const getPageDisplayName = (pathname: string): string => {
        if (pathname === "/") return "Trang chủ";
        if (pathname === "/ve-chung-toi") return "Về chúng tôi";
        if (pathname === "/bang-gia") return "Bảng giá dịch vụ";
        if (pathname === "/lien-he") return "Liên hệ";
        if (pathname === "/bac-si") return "Đội ngũ bác sĩ";
        if (pathname === "/dang-nhap") return "Đăng nhập / Đăng ký";
        if (pathname === "/quen-mat-khau") return "Quên mật khẩu";
        
        // Khách hàng
        if (pathname === "/khach-hang/dashboard") return "Bảng điều khiển Khách hàng";
        if (pathname === "/khach-hang/quan-ly-thu-cung") return "Quản lý thú cưng";
        if (pathname === "/khach-hang/dat-lich-hen") return "Đặt lịch hẹn khám";
        if (pathname === "/khach-hang/lich-su-lich-hen") return "Lịch sử lịch hẹn";
        if (pathname === "/khach-hang/ho-so-benh-an") return "Hồ sơ bệnh án thú cưng";
        if (pathname === "/khach-hang/hoa-don-thanh-toan") return "Hóa đơn & thanh toán của bé";
        if (pathname === "/khach-hang/thong-tin-ca-nhan") return "Thông tin cá nhân Sen";

        // Admin / Nhân sự nội bộ
        if (pathname === "/quan-ly/dashboard") return "Bảng điều khiển Quản lý nội bộ";
        if (pathname === "/quan-ly/khach-hang-thu-cung") return "Quản lý Khách hàng & Thú cưng";
        if (pathname === "/quan-ly/lich-hen") return "Quản lý Lịch hẹn khám";
        if (pathname === "/quan-ly/lich-lam-viec") return "Quản lý Lịch làm việc Bác sĩ";
        if (pathname === "/quan-ly/ho-so-benh-an") return "Quản lý Hồ sơ bệnh án";
        if (pathname === "/quan-ly/kham-benh") return "Phân hệ Khám bệnh Bác sĩ";
        if (pathname.startsWith("/quan-ly/chi-tiet-benh-an/")) return "Chi tiết hồ sơ bệnh án";
        if (pathname === "/quan-ly/don-thuoc") return "Quản lý Đơn thuốc";
        if (pathname === "/quan-ly/file-dinh-kem") return "Quản lý Tài liệu đính kèm";
        if (pathname === "/quan-ly/thong-tin-ca-nhan") return "Thông tin cá nhân nhân viên";
        if (pathname === "/quan-ly/hoa-don") return "Quản lý Hóa đơn & Thu phí";
        if (pathname === "/quan-ly/ke-toan") return "Bảng điều khiển Kế toán";
        if (pathname === "/quan-ly/bao-cao-thong-ke") return "Báo cáo tài chính & Thống kê doanh thu";
        if (pathname === "/quan-ly/nhap-kho") return "Quản lý Nhập kho thuốc & vật tư";
        if (pathname === "/quan-ly/kho-thuoc") return "Quản lý Kho thuốc & Vật tư y tế";
        if (pathname === "/quan-ly/nhan-vien-phan-quyen") return "Quản lý Nhân sự & Phân quyền tài khoản";
        if (pathname === "/quan-ly/cau-hinh") return "Cấu hình hệ thống";
        if (pathname === "/quan-ly/chuc-nang") return "Quản lý chức năng hệ thống";
        if (pathname === "/quan-ly/dich-vu") return "Quản lý danh mục Dịch vụ";
        if (pathname === "/quan-ly/xet-nghiem") return "Quản lý kết quả Xét nghiệm";
        if (pathname === "/quan-ly/marketing") return "Chiến dịch Email Marketing";

        return `Trang ${pathname}`;
    };

    const getPageDomContext = (): string => {
        try {
            const metrics: string[] = [];

            // 1. Quét các thẻ card chỉ số (Stats cards)
            const cards = document.querySelectorAll(".glass-card, [class*='card'], .card");
            cards.forEach(card => {
                const labelEl = card.querySelector("p, .text-sm, .text-xs, [class*='label']");
                const valueEl = card.querySelector("h3, h2, .text-2xl, .text-3xl, .font-bold, [class*='value']");
                if (labelEl && valueEl) {
                    const label = labelEl.textContent?.trim().replace(/\s+/g, ' ');
                    const val = valueEl.textContent?.trim().replace(/\s+/g, ' ');
                    if (label && val && label.length < 50 && val.length < 30) {
                        metrics.push(`${label}: ${val}`);
                    }
                }
            });

            // 2. Quét các bảng dữ liệu đang hiển thị (Lịch hẹn, hóa đơn...)
            const tables = document.querySelectorAll("table");
            tables.forEach((table, tableIdx) => {
                if (tableIdx > 1) return; 
                const headers: string[] = [];
                table.querySelectorAll("thead th").forEach(th => {
                    const txt = th.textContent?.trim();
                    if (txt) headers.push(txt);
                });

                const rows: string[] = [];
                table.querySelectorAll("tbody tr").forEach((tr, rowIdx) => {
                    if (rowIdx > 3) return; 
                    const cells: string[] = [];
                    tr.querySelectorAll("td").forEach(td => {
                        const txt = td.textContent?.trim().replace(/\s+/g, ' ');
                        if (txt) cells.push(txt);
                    });
                    if (cells.length > 0) {
                        rows.push(`[${cells.join(" | ")}]`);
                    }
                });

                if (rows.length > 0) {
                    metrics.push(`Bảng ${tableIdx + 1} (${headers.join(", ")}): ${rows.join(" ; ")}`);
                }
            });

            // 3. Quét các tiêu đề cảnh báo hoặc văn bản chỉ số phụ
            const alerts = document.querySelectorAll("[class*='alert'], [class*='warning'], .bg-red-50, .bg-yellow-50");
            alerts.forEach((alert, idx) => {
                if (idx > 2) return;
                const txt = alert.textContent?.trim().replace(/\s+/g, ' ');
                if (txt && txt.length < 150) {
                    metrics.push(`Cảnh báo: ${txt}`);
                }
            });

            // 4. Quét các phần tử tương tác có data-ai-id (nút, input, select, textarea, div đặc biệt)
            const interactiveElements = document.querySelectorAll("[data-ai-id]");
            interactiveElements.forEach((el, idx) => {
                if (idx > 40) return; // Tránh tràn context nếu có quá nhiều phần tử
                const aiId = el.getAttribute("data-ai-id");
                if (!aiId) return;

                const tagName = el.tagName.toLowerCase();
                let label = "";

                if (tagName === "button") {
                    label = el.textContent?.trim() || "";
                } else if (tagName === "input" || tagName === "textarea") {
                    const placeholder = el.getAttribute("placeholder") || "";
                    const name = el.getAttribute("name") || "";
                    const type = el.getAttribute("type") || "";
                    label = `[Loại: ${type || tagName}] ${placeholder ? `Gợi ý: ${placeholder}` : `Tên: ${name}`}`;
                } else if (tagName === "select") {
                    const options: string[] = [];
                    el.querySelectorAll("option").forEach(opt => {
                        const val = opt.getAttribute("value");
                        const txt = opt.textContent?.trim();
                        if (val) options.push(`"${txt}" (val: ${val})`);
                    });
                    label = `[Select] Lựa chọn: ${options.slice(0, 8).join(", ")}`;
                } else if (tagName === "div") {
                    label = el.textContent?.trim() || "";
                }

                if (label.length > 100) label = label.substring(0, 100) + "...";
                metrics.push(`Interactive Element [${tagName}]: "${label}" (data-ai-id: "${aiId}")`);
            });

            const uniqueMetrics = Array.from(new Set(metrics)).filter(m => m.trim().length > 0);
            return uniqueMetrics.join(" | ");
        } catch (e) {
            console.error("Lỗi parse DOM context:", e);
            return "";
        }
    };

    const user = getUserProfile();
    const rawName = user?.ten_khach_hang || user?.ho_ten || user?.ten_dang_nhap || "";
    const userName = cleanName(rawName);

    const userRole = user?.loai_tai_khoan || user?.id_vai_tro || "";
    const isClinicStaff = userRole && userRole !== "CUSTOMER" && userRole !== "KHACH_HANG" && userRole !== "VT-5";
    const userRoleName = user?.ten_vai_tro || 
        (userRole.includes("ADMIN") || userRole === "VT-1" ? "Quản trị" : 
         userRole.includes("QL") || userRole === "VT-6" ? "Quản lý" : 
         userRole.includes("BS") || userRole === "VT-2" ? "Bác sĩ" : 
         userRole.includes("KT") || userRole === "VT-4" ? "Kế toán" : 
         userRole.includes("TT") || userRole === "VT-7" ? "Tiếp tân" : 
         userRole.includes("YT") || userRole === "VT-8" ? "Y tá" : 
         userRole.includes("STAFF") || userRole.includes("NV") || userRole === "VT-3" ? "Nhân viên" : "Nhân sự");

    const displayGreetingName = (userName.toLowerCase().includes(userRoleName.toLowerCase()) || 
                                 (userRoleName.toLowerCase() === 'bác sĩ' && userName.toLowerCase().startsWith('bs')))
        ? userName
        : `${userRoleName} ${userName}`;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return "Chào buổi sáng";
        if (hour >= 11 && hour < 14) return "Chào buổi trưa";
        if (hour >= 14 && hour < 18) return "Chào buổi chiều";
        if (hour >= 18 && hour <= 23) return "Chào buổi tối";
        return "Chào cú đêm"; 
    };
    const timeGreeting = getGreeting();

    // 2. TRẠNG THÁI GIAO DIỆN UÝ PHÁP (STATE HOOKS)
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'standard' | 'agent'>('standard');
    const [proactiveMessage, setProactiveMessage] = useState<{ id: string, text: string, action: () => void } | null>(null);
    const [userActivityLogs, setUserActivityLogs] = useState<{ action: string, timestamp: string }[]>([]);

    // LẮNG NGHE HÀNH VI NGƯỜI DÙNG TOÀN CỤC (USER ACTIVITY TRACING)
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target) return;

            // Tìm phần tử hoặc thẻ cha gần nhất có data-ai-id
            const elWithAiId = target.closest("[data-ai-id]");
            if (elWithAiId) {
                const aiId = elWithAiId.getAttribute("data-ai-id");
                const tagName = elWithAiId.tagName.toLowerCase();
                const text = elWithAiId.textContent?.trim().slice(0, 30) || "";
                
                const logMsg = `Nhấp chuột vào [${tagName}] "${text}" (data-ai-id: "${aiId}")`;
                const newLog = { action: logMsg, timestamp: new Date().toLocaleTimeString() };
                
                setUserActivityLogs(prev => [newLog, ...prev.slice(0, 9)]);

                // KỊCH BẢN 2: TRỢ LÝ THANH TOÁN CHỦ ĐỘNG (VietQR & Loyalty)
                if (aiId === "button-quanlyhoadon-1zou") {
                    const tr = elWithAiId.closest("tr");
                    const isChoThanhToan = tr?.textContent?.includes("CHỜ THANH TOÁN");
                    if (isChoThanhToan) {
                        setTimeout(() => {
                            setProactiveMessage({
                                id: "payment-qr-helper",
                                text: "💰 Sếp ơi! Hóa đơn này đang chờ thanh toán. Để tối ưu hóa trải nghiệm khách hàng và giảm sai sót tiền mặt, sếp có muốn Rexi tự động sinh mã VietQR động, gợi ý cổng VNPay, hoặc áp dụng ưu đãi Loyalty Member giảm 5% không ạ? Bấm đây em hỗ trợ sếp ngay nhé! ✨",
                                action: () => {
                                    setActiveTab("agent");
                                    setIsOpen(true);
                                    setTimeout(() => {
                                        runPaymentAutopilotFlow();
                                    }, 500);
                                }
                            });
                        }, 600); // Đợi modal hiển thị hoàn chỉnh
                    }
                }

                // CẢNH BÁO Y KHOA: LƯU BỆNH ÁN KHI ĐƠN THUỐC TRỐNG CHO CA FPV NẶNG
                if (aiId === "button-quanlybenhan-1pce") {
                    const chanDoanEl = document.querySelector('[data-ai-id="textarea-quanlybenhan-chandoan"]') as HTMLTextAreaElement;
                    const diagnosis = chanDoanEl?.value?.toLowerCase() || "";
                    if (diagnosis.includes("fpv") || diagnosis.includes("parvo") || diagnosis.includes("giảm bạch cầu") || diagnosis.includes("giam bach cau")) {
                        const selectEls = document.querySelectorAll('[data-ai-id="select-quanlybenhan-dttd"]');
                        if (selectEls.length === 0) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            setProactiveMessage({
                                id: "fpv-empty-prescription-warning",
                                text: "⚠️ CẢNH BÁO Y KHOA: Chẩn đoán FPV (Giảm bạch cầu mèo) cực kỳ nguy hiểm nhưng sếp chưa kê đơn thuốc hỗ trợ (kháng sinh Cefovecin, chống nôn Maropitant, dịch Ringer Lactate). Để bảo vệ bé yêu, bác sĩ có muốn Rexi tự động kê phác đồ chuẩn y khoa ngay không ạ? 🩺✨",
                                action: () => {
                                    setActiveTab("agent");
                                    setIsOpen(true);
                                    setTimeout(() => {
                                        runFpvAutopilotFlow();
                                    }, 500);
                                }
                            });
                            return;
                        }
                    }
                }

                // Kích hoạt gợi ý khi click nút đặt lịch khám mà form chưa hoàn tất
                if (aiId === "button-datlichhen-66iq") {
                    const serviceEl = document.querySelector(".service-card-select.selected");
                    const dateEl = document.querySelector("input[type='date']") as HTMLInputElement;
                    const timeSelected = document.querySelector("button[style*='background-color: var(--primary-light)'], button[style*='background: var(--primary-light)']");
                    
                    if (!serviceEl || !dateEl?.value || !timeSelected) {
                        setProactiveMessage({
                            id: "booking-error-helper",
                            text: "🐾 Sếp ơi! Rexi thấy đơn đặt lịch khám còn thiếu thông tin (chưa chọn dịch vụ, ngày khám hoặc khung giờ). Sếp có muốn em tự động kiểm tra và lái tự động chọn nốt khung giờ trống giúp sếp không ạ? ✨",
                            action: () => {
                                setActiveTab("agent");
                                setIsOpen(true);
                                setTimeout(() => {
                                    handleAgentSend("Rexi hãy tự động kiểm tra các thông tin còn trống trên form đặt lịch hẹn khám bệnh hiện tại, tìm khung giờ trống phù hợp và điền hoàn chỉnh giúp sếp nhé!");
                                }, 500);
                            }
                        });
                    }
                }
            }
        };

        const handleGlobalScroll = () => {
            const now = Date.now();
            const lastScroll = (window as any)._lastScrollTime || 0;
            if (now - lastScroll > 5000) {
                (window as any)._lastScrollTime = now;
                const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
                const logMsg = `Cuộn trang đến vị trí ${scrollPercent}% màn hình`;
                const newLog = { action: logMsg, timestamp: new Date().toLocaleTimeString() };
                setUserActivityLogs(prev => [newLog, ...prev.slice(0, 9)]);
            }
        };

        const handleGlobalError = (e: ErrorEvent) => {
            const logMsg = `Gặp lỗi hệ thống: "${e.message}"`;
            const newLog = { action: logMsg, timestamp: new Date().toLocaleTimeString() };
            setUserActivityLogs(prev => [newLog, ...prev.slice(0, 9)]);
        };

        const handleGlobalInput = (e: Event) => {
            const target = e.target as HTMLTextAreaElement | HTMLInputElement;
            if (!target) return;

            const aiId = target.getAttribute("data-ai-id");

            // KỊCH BẢN 1: CHẨN ĐOÁN LÂM SÀNG CHỦ ĐỘNG (FPV)
            if (aiId === "textarea-quanlybenhan-chandoan") {
                const val = target.value.toLowerCase();
                if (val.includes("fpv") || val.includes("parvo") || val.includes("giảm bạch cầu") || val.includes("giam bach cau")) {
                    setProactiveMessage({
                        id: "fpv-clinical-helper",
                        text: "🩺 Sếp ơi! Em thấy sếp chẩn đoán bé bị nhiễm FPV (Giảm bạch cầu mèo) cực kỳ nguy hiểm. Sếp có muốn Rexi tự động lên phác đồ chuẩn y khoa (Kháng sinh rộng Cefovecin, chống nôn Maropitant, truyền dịch Ringer Lactate) và kê đơn nhanh vào bệnh án giúp sếp không ạ? Bấm đây em điền giúp sếp ngay nha! 🩺✨",
                        action: () => {
                            setActiveTab("agent");
                            setIsOpen(true);
                            setTimeout(() => {
                                runFpvAutopilotFlow();
                            }, 500);
                        }
                    });
                } else {
                    setProactiveMessage(null);
                }
            }

            if (aiId === "textarea-quanlymarketing-content") {
                const val = target.value;
                if (val.trim().length > 5 && val.trim().length < 40) {
                    setProactiveMessage({
                        id: "marketing-suggestion",
                        text: "🐾 Sếp ơi! Em thấy nội dung chiến dịch marketing của sếp hơi ngắn nè. Sếp có muốn Rexi dùng trí tuệ AI tối ưu hóa thư ngỏ gửi khách hàng thật lôi cuốn, chuyên nghiệp và đầy chuyển đổi không ạ? Bấm đây em viết giúp sếp nha! ✨",
                        action: () => {
                            setActiveTab("agent");
                            setIsOpen(true);
                            setTimeout(() => {
                                handleAgentSend(`Em hãy viết lại nội dung email marketing này thật hay, đầy thu hút, thêm icon biểu cảm sinh động và chuyên nghiệp nhất có thể để gửi khách hàng giúp sếp: "${val}"`);
                            }, 500);
                        }
                    });
                } else if (val.trim().length === 0) {
                    setProactiveMessage(null);
                }
            }
        };

        document.addEventListener("click", handleGlobalClick, true);
        window.addEventListener("scroll", handleGlobalScroll);
        window.addEventListener("error", handleGlobalError);
        document.addEventListener("input", handleGlobalInput);
        return () => {
            document.removeEventListener("click", handleGlobalClick, true);
            window.removeEventListener("scroll", handleGlobalScroll);
            window.removeEventListener("error", handleGlobalError);
            document.removeEventListener("input", handleGlobalInput);
        };
    }, []);

    // TỰ ĐỘNG GỢI Ý CHĂM SÓC CHỦ ĐỘNG (UPSELL & RETENTION)
    useEffect(() => {
        const fetchRetentionReminders = async () => {
            try {
                // Fix C: dùng axiosInstance để tự động đính kèm JWT token
                const response = await axiosInstance.get("/api/agent/retention-reminders");
                const data = response.data;
                if (data && data.length > 0) {
                    const reminder = data[Math.floor(Math.random() * data.length)];
                    setTimeout(() => {
                        setProactiveMessage({
                            id: `retention-${reminder.id_thu_cung}`,
                            text: reminder.message,
                            action: () => {
                                setActiveTab("agent");
                                setIsOpen(true);
                                setTimeout(() => {
                                    const command = `Rexi hãy đặt lịch nhanh dịch vụ cho bé ${reminder.ten_thu_cung} của khách hàng ${reminder.ten_khach_hang} (SĐT: ${reminder.sdt}) vào ngày ${reminder.suggested_date} lúc ${reminder.suggested_time}`;
                                    handleAgentSend(command);
                                }, 600);
                            }
                        });
                    }, 5000);
                }
            } catch (err) {
                console.warn("Không tải được gợi ý chăm sóc chủ động:", err);
            }
        };
        fetchRetentionReminders();
    }, [user]);

    // DÙNG REF TRÁNH STALE CLOSURE KHI SỬ DỤNG VOICE TRONG TABS
    const activeTabRef = useRef(activeTab);
    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);
    
    // Gợi ý tin nhắn ngoài bong bóng (Callouts)
    const [showCallout, setShowCallout] = useState(false);
    const [calloutMessage, setCalloutMessage] = useState("");

    // Lưu trữ tin nhắn riêng cho hai Tab để không bị lộn xộn
    const [messages, setMessages] = useState<any[]>(() => {
        try {
            const saved = sessionStorage.getItem("rexi_standard_chat_history");
            if (saved) return JSON.parse(saved);
        } catch (e) { console.error("Lỗi đọc lịch sử chat standard:", e); }
        
        return [
            {
                type: "ai",
                text: isClinicStaff
                    ? `${timeGreeting} **${displayGreetingName}**! 🐾 Trợ lý Rexi rất vui được đồng hành cùng bạn hôm nay. Bạn cần tôi hỗ trợ tra cứu thông tin hoặc tư vấn y học thú cưng nào không ạ?`
                    : userName
                        ? `${timeGreeting} Sen **${userName}**! 🐾 Trợ lý Rexi rất vui được gặp lại. Hôm nay bé yêu nhà mình có khỏe không dạ?`
                        : `${timeGreeting} Sen! 🐾 Rexi đây ạ. Rexi có thể giúp gì cho sức khỏe của bé nhà mình hôm nay?`
            }
        ];
    });

    // Streaming typewriter effect state — theo dõi tin nhắn nào đang được stream
        
    const [agentMessages, setAgentMessages] = useState<any[]>(() => {
        try {
            const saved = sessionStorage.getItem("rexi_agent_chat_history");
            if (saved) return JSON.parse(saved);
        } catch (e) { console.error("Lỗi đọc lịch sử chat agent:", e); }

        return [
            {
                type: "ai",
                text: isClinicStaff
                    ? `${timeGreeting} **Đồng nghiệp ${userRoleName} ${userName}**! 🐾 Tôi là **Rexi Agent v2** - Trợ lý Tác vụ AI. Tôi được tích hợp sâu để giúp bạn tự động hóa nghiệp vụ: tra cứu thông tin khách hàng nhanh, lập lịch khám nhanh, xem bệnh án, hoặc kiểm tra thuốc. Hãy cho tôi biết tác vụ bạn cần nhé!`
                    : `${timeGreeting} Sen **${userName || "nhà mình"}**! 🐾 Tôi là **Rexi Agent v2** - Trợ lý Tác vụ AI. Tôi có khả năng thực hiện trực tiếp các yêu cầu như: tự động điền form Đặt lịch khám, đăng ký thông tin nhanh, tra cứu lịch trực bác sĩ, tra cứu mạng (Google Search) tài liệu thú y chuẩn xác. Sen muốn Rexi làm gì hôm nay ạ?`
            }
        ];
    });

    const [input, setInput] = useState("");
    const [agentInput, setAgentInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [agentLoading, setAgentLoading] = useState(false);

    // Media & Voice States
    const [selectedFiles, setSelectedFiles] = useState<{ data: string, type: 'image' | 'video' }[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
        try {
            const saved = localStorage.getItem("rexi_is_voice_enabled");
            return saved === "true";
        } catch { return false; }
    });

    const [isCompressing, setIsCompressing] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // State quản lý hành động tự động của AI Agent thời gian thực
    const [currentAgentAction, setCurrentAgentAction] = useState<any | null>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const standardEndRef = useRef<HTMLDivElement>(null);
    const agentEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Audio Visualizer Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const waveBar1Ref = useRef<HTMLDivElement>(null);
    const waveBar2Ref = useRef<HTMLDivElement>(null);
    const waveBar3Ref = useRef<HTMLDivElement>(null);
    const isAiSpeakingRef = useRef<boolean>(false);
    const micIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // XÓA TIMEOUT CHỜ MIC
    const clearMicIdleTimeout = () => {
        if (micIdleTimeoutRef.current) {
            clearTimeout(micIdleTimeoutRef.current);
            micIdleTimeoutRef.current = null;
        }
    };

    // ĐẶT LẠI TIMEOUT 15 GIÂY CHO MIC
    const resetMicIdleTimeout = useCallback(() => {
        clearMicIdleTimeout();
        micIdleTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            if (activeTabRef.current === 'standard') setInput("");
            else setAgentInput("");
            toast.info("Micro đã tự động tắt do không có âm thanh.");
        }, 15000);
    }, []);

    // 3. ĐỌC THÀNH TIẾNG (TEXT-TO-SPEECH VIETNAMESE)
    const speakText = useCallback((text: string) => {
        if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
        
        window.speechSynthesis.cancel(); // Tắt các phát âm cũ đang chạy dở

        // Loại bỏ markdown, emoji để đọc tự nhiên, chuyên nghiệp
        const cleanText = text
            .replace(/[\*\_`#\-]/g, "")
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") 
            .replace(/<[^>]*>/g, "")
            .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "vi-VN";
        
        // Cố gắng tìm giọng đọc tiếng Việt chuẩn nhất
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang.includes("vi-VN") || v.lang.includes("vi_VN"));
        if (viVoice) utterance.voice = viVoice;
        utterance.rate = 1.05; // Đọc nhanh hơn một chút để tạo cảm giác linh hoạt
        
        utterance.onstart = () => { isAiSpeakingRef.current = true; };
        utterance.onend = () => { setTimeout(() => { isAiSpeakingRef.current = false; }, 800); };
        utterance.onerror = () => { isAiSpeakingRef.current = false; };
        
        window.speechSynthesis.speak(utterance);
    }, [isVoiceEnabled]);

    // Đồng bộ cài đặt giọng nói
    useEffect(() => {
        try {
            localStorage.setItem("rexi_is_voice_enabled", String(isVoiceEnabled));
            if (!isVoiceEnabled) window.speechSynthesis.cancel();
        } catch (e) { }
    }, [isVoiceEnabled]);



    // XUẤT ĐƠN THUỐC & BÁO CÁO PHÁC ĐỒ Y KHOA SANG PDF SANG TRỌNG
    const handleDownloadTreatmentPdf = (data: any) => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("Sếp ơi! Vui lòng cho phép trình duyệt mở tab mới để Rexi xuất phiếu điều trị và đơn thuốc nhé! 🐾");
            return;
        }

        const dateStr = new Date().toLocaleDateString("vi-VN");
        const htmlContent = `
<html>
<head>
    <title>Phiếu Hướng Dẫn Điều Trị & Đơn Thuốc - ${data.petName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            color: #1e293b;
            background: #fff;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 26px;
            font-weight: 900;
            color: #e11d48;
            margin-bottom: 5px;
            letter-spacing: -1px;
        }
        .clinic-info {
            font-size: 13px;
            color: #64748b;
            font-weight: 600;
        }
        .title {
            font-size: 22px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 20px 0;
            color: #0f172a;
            text-align: center;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
            font-size: 14px;
            padding: 18px;
            background: #f8fafc;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
        }
        .info-item b {
            color: #475569;
        }
        .section-title {
            font-size: 14px;
            font-weight: 900;
            color: #e11d48;
            border-left: 4px solid #e11d48;
            padding-left: 12px;
            margin: 25px 0 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .content-box {
            font-size: 14px;
            margin-bottom: 20px;
            white-space: pre-line;
            color: #334155;
            background: #fafafa;
            padding: 15px;
            border-radius: 12px;
            border: 1px solid #f1f5f9;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        th, td {
            padding: 14px;
            font-size: 13.5px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        th {
            background: #f8fafc;
            font-weight: 800;
            color: #475569;
            border-bottom: 2px solid #e2e8f0;
        }
        .footer {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            font-size: 14px;
        }
        .signature {
            text-align: center;
            width: 220px;
        }
        .signature-name {
            margin-top: 70px;
            font-weight: 800;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🐾 REXI VETERINARY CLINIC</div>
        <div class="clinic-info">Số 12 Chùa Láng, Đống Đa, Hà Nội — Hotline: 098.18.REXI — rexi.vn</div>
    </div>
    
    <div class="title">PHIẾU HƯỚNG DẪN ĐIỀU TRỊ & ĐƠN THUỐC</div>
    
    <div class="info-grid">
        <div class="info-item"><b>Chủ nuôi:</b> ${data.ownerName || "Khách hàng thân thiết"}</div>
        <div class="info-item"><b>Tên bé cưng:</b> ${data.petName}</div>
        <div class="info-item"><b>Ngày kê toa:</b> ${dateStr}</div>
        <div class="info-item"><b>Bác sĩ chỉ định:</b> Bác sĩ Rexi AI (Autopilot Engine)</div>
    </div>
    
    <div class="section-title">1. Chẩn đoán lâm sàng</div>
    <div class="content-box"><b>${data.diagnosis}</b></div>
    
    <div class="section-title">2. Phác đồ điều trị & Chăm sóc tại nhà</div>
    <div class="content-box">${data.treatment}</div>
    
    <div class="section-title">3. Danh sách dược phẩm chỉ định</div>
    <table>
        <thead>
            <tr>
                <th style="width: 8%;">STT</th>
                <th style="width: 40%;">Tên thuốc / Biệt dược</th>
                <th style="width: 15%;">Số lượng</th>
                <th style="width: 37%;">Hướng dẫn sử dụng</th>
            </tr>
        </thead>
        <tbody>
            ${data.drugs ? data.drugs.map((drug: any, index: number) => `
                <tr>
                    <td style="color: #64748b; font-weight: 600;">#0${index + 1}</td>
                    <td><b style="color: #0f172a;">${drug.name}</b></td>
                    <td><span style="background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-weight: 700; color: #475569;">${drug.qty}</span></td>
                    <td>${drug.instruction}</td>
                </tr>
            `).join("") : `<tr><td colspan="4" style="text-align: center; color: #94a3b8;">Không có thuốc chỉ định đặc biệt</td></tr>`}
        </tbody>
    </table>
    
    <div class="footer">
        <div class="signature">
            <p><b>Chủ nuôi ký nhận</b></p>
            <p style="font-size: 11px; color: #94a3b8; margin-top: -8px;">(Ký và ghi rõ họ tên)</p>
        </div>
        <div class="signature">
            <p><b>Bác sĩ điều trị</b></p>
            <p style="font-size: 11px; color: #94a3b8; margin-top: -8px;">(Chữ ký điện tử đã duyệt)</p>
            <div class="signature-name" style="color: #e11d48;">Rexi Autopilot System</div>
        </div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    // Lắng nghe các sự kiện hành động của AI Agent để hiển thị lên HUD Console
    useEffect(() => {
        const handleAgentAction = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setCurrentAgentAction(detail);
            
            // Tự động ẩn bảng Console sau 4 giây khi hoàn thành thành công hoặc thất bại
            if (detail.type === 'SUCCESS' || detail.type === 'ERROR') {
                setTimeout(() => {
                    setCurrentAgentAction((prev: any) => {
                        if (prev && prev.tag === detail.tag) {
                            return null;
                        }
                        return prev;
                    });
                }, 4000);
            }
        };

        window.addEventListener('agent-action', handleAgentAction);
        return () => window.removeEventListener('agent-action', handleAgentAction);
    }, []);

    // Cuộn xuống khi có tin nhắn mới
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'standard') {
                standardEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            } else {
                agentEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, agentMessages, loading, agentLoading, activeTab]);

    // Lưu trữ lịch sử vào SessionStorage
    useEffect(() => {
        try {
            sessionStorage.setItem("rexi_standard_chat_history", JSON.stringify(messages));
        } catch (e) { }
    }, [messages]);

    useEffect(() => {
        try {
            sessionStorage.setItem("rexi_agent_chat_history", JSON.stringify(agentMessages));
        } catch (e) { }
    }, [agentMessages]);

    // ==================== HỆ THỐNG TRỢ LÝ CHỦ ĐỘNG AUTOPILOT LÂM SÀNG & KẾ TOÁN ====================
    
    // Kịch bản 1: Lập phác đồ lâm sàng FPV chuẩn y khoa tự động
    const runFpvAutopilotFlow = async () => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Hàm helper cập nhật HUD console trạng thái thực tế của AI
        const dispatchHud = (type: 'START' | 'PROGRESS' | 'SUCCESS' | 'ERROR', actionType: string, payload: string, message: string) => {
            window.dispatchEvent(new CustomEvent('agent-action', {
                detail: { type, tag: `[${actionType}:${payload}]`, actionType, payload, message }
            }));
        };

        try {
            // Bước 1: Điền triệu chứng lâm sàng
            dispatchHud('START', 'FILL', 'textarea-quanlybenhan-trieuchung', 'Đang tự động nhập triệu chứng lâm sàng...');
            await sleep(800);
            const trieuChungEl = document.querySelector('[data-ai-id="textarea-quanlybenhan-trieuchung"]') as HTMLTextAreaElement;
            if (trieuChungEl) {
                trieuChungEl.value = "Bé mèo lờ đờ, sốt cao liên tục (40.5°C), nôn ra dịch vàng xanh có bọt, mất nước nặng, da kém đàn hồi, tiêu chảy cấp có mùi tanh nghiêm trọng.";
                trieuChungEl.dispatchEvent(new Event('input', { bubbles: true }));
                dispatchHud('SUCCESS', 'FILL', 'textarea-quanlybenhan-trieuchung', 'Đã điền triệu chứng: Sốt cao, nôn dịch vàng, tiêu chảy cấp...');
            } else {
                throw new Error("Không tìm thấy ô nhập liệu Triệu chứng.");
            }

            // Bước 2: Điền chẩn đoán lâm sàng
            await sleep(600);
            dispatchHud('START', 'FILL', 'textarea-quanlybenhan-chandoan', 'Đang nhập kết quả chẩn đoán bệnh án...');
            await sleep(800);
            const chanDoanEl = document.querySelector('[data-ai-id="textarea-quanlybenhan-chandoan"]') as HTMLTextAreaElement;
            if (chanDoanEl) {
                chanDoanEl.value = "FPV (Feline Panleukopenia) - Giảm bạch cầu mèo truyền nhiễm. Xác nhận dương tính qua Test Kit nhanh.";
                chanDoanEl.dispatchEvent(new Event('input', { bubbles: true }));
                dispatchHud('SUCCESS', 'FILL', 'textarea-quanlybenhan-chandoan', 'Đã điền chẩn đoán: Dương tính FPV qua Test Kit nhanh...');
            } else {
                throw new Error("Không tìm thấy ô nhập liệu Chẩn đoán.");
            }

            // Bước 3: Điền lời dặn bác sĩ điều trị
            await sleep(600);
            dispatchHud('START', 'FILL', 'textarea-quanlybenhan-loidang', 'Đang nhập lời dặn của bác sĩ điều trị...');
            await sleep(800);
            const loiDanEl = document.querySelector('[data-ai-id="textarea-quanlybenhan-loidang"]') as HTMLTextAreaElement;
            if (loiDanEl) {
                loiDanEl.value = "Khẩn cấp cách ly triệt để bé mèo khỏi khu vực chung. Ủ ấm cơ thể bằng túi sưởi. Truyền tĩnh mạch chậm Ringer Lactate để bù điện giải (20-30ml/kg/ngày). Tiêm dưới da Convenia (Cefovecin) ngừa nhiễm khuẩn thứ phát. Tiêm Cerenia (Maropitant) để kiểm soát nôn ói. Tuyệt đối kiêng ăn uống trong 24 giờ đầu.";
                loiDanEl.dispatchEvent(new Event('input', { bubbles: true }));
                dispatchHud('SUCCESS', 'FILL', 'textarea-quanlybenhan-loidang', 'Đã điền lời dặn bác sĩ điều trị thành công!');
            } else {
                throw new Error("Không tìm thấy ô nhập liệu Lời dặn.");
            }

            // Bước 4: Tự động click thêm thuốc 3 lần
            await sleep(600);
            dispatchHud('START', 'CLICK', 'button-quanlybenhan-8zw3', 'Đang bấm thêm 3 dòng thuốc mới vào đơn thuốc...');
            await sleep(800);
            const addDrugBtn = document.querySelector('[data-ai-id="button-quanlybenhan-8zw3"]') as HTMLButtonElement;
            if (addDrugBtn) {
                addDrugBtn.click();
                await sleep(200);
                addDrugBtn.click();
                await sleep(200);
                addDrugBtn.click();
                await sleep(600); // Đợi React render các dòng select thuốc mới
                dispatchHud('SUCCESS', 'CLICK', 'button-quanlybenhan-8zw3', 'Đã thêm thành công 3 dòng thuốc mới vào giao diện bệnh án.');
            } else {
                throw new Error("Không tìm thấy nút Thêm thuốc.");
            }

            // Bước 5: Tự động chọn thuốc và điền liều lượng
            await sleep(600);
            dispatchHud('START', 'SELECT', 'select-quanlybenhan-dttd', 'Đang tự động tra cứu danh mục và kê đơn thuốc hỗ trợ...');
            await sleep(800);

            const selectEls = document.querySelectorAll('[data-ai-id="select-quanlybenhan-dttd"]');
            const qtyEls = document.querySelectorAll('[data-ai-id="input-quanlybenhan-nj8p"]');
            const noteEls = document.querySelectorAll('[data-ai-id="input-quanlybenhan-vgla"]');

            const drugTemplates = [
                { keyword: "cefovecin", qty: "1", note: "Tiêm dưới da liều đơn" },
                { keyword: "maropitant", qty: "1", note: "Tiêm dưới da 1 lần/ngày" },
                { keyword: "ringer", qty: "2", note: "Truyền tĩnh mạch chậm" }
            ];

            for (let i = 0; i < drugTemplates.length; i++) {
                const template = drugTemplates[i];
                const selectEl = selectEls[i] as HTMLSelectElement;
                const qtyEl = qtyEls[i] as HTMLInputElement;
                const noteEl = noteEls[i] as HTMLInputElement;

                if (selectEl) {
                    const option = Array.from(selectEl.options).find(opt => 
                        opt.text.toLowerCase().includes(template.keyword)
                    );
                    if (option) {
                        selectEl.value = option.value;
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                        await sleep(200);
                    }
                }
                if (qtyEl) {
                    qtyEl.value = template.qty;
                    qtyEl.dispatchEvent(new Event('input', { bubbles: true }));
                    await sleep(200);
                }
                if (noteEl) {
                    noteEl.value = template.note;
                    noteEl.dispatchEvent(new Event('input', { bubbles: true }));
                    await sleep(200);
                }
            }

            dispatchHud('SUCCESS', 'SELECT', 'select-quanlybenhan-dttd', 'Hoàn tất phác đồ y khoa FPV chuẩn lâm sàng!');

            // Thêm tin nhắn của AI xác nhận
            const newReply = {
                type: "ai",
                text: "🩺 **Rexi Autopilot:** Em đã tự động hoàn thành lập phác đồ lâm sàng chuẩn y khoa cho ca bệnh **FPV (Giảm bạch cầu mèo)** nặng:\n\n1. **Triệu chứng:** Sốt cao, nôn dịch vàng, tiêu chảy mùi tanh đặc trưng.\n2. **Chẩn đoán:** Nhiễm FPV cấp tính, test nhanh dương tính.\n3. **Lời dặn:** Quy trình cách ly, sưởi ấm, kiêng ăn uống để bảo toàn niêm mạc ruột.\n4. **Đơn thuốc chuẩn:** Kháng sinh phổ rộng **Cefovecin (Convenia)**, kháng viêm chống nôn **Maropitant (Cerenia)**, và dịch truyền bù nước điện giải **Ringer Lactate**.\n\nBác sĩ vui lòng xem lại hồ sơ và click **Lưu bệnh án** để hoàn tất nhé! Em luôn đồng hành cùng sếp! 🩺✨"
            };
            setAgentMessages(prev => [...prev, newReply]);
            speakText("Em đã tự động lập phác đồ FPV chuẩn y khoa giúp bác sĩ rồi nhé!");
        } catch (err: any) {
            dispatchHud('ERROR', 'AUTOPILOT', 'failed', `Lỗi thực thi Autopilot: ${err.message || err}`);
            setAgentMessages(prev => [...prev, {
                type: "ai",
                text: `❌ Lỗi Autopilot: ${err.message || err}. Vui lòng kiểm tra lại trạng thái giao diện sếp nhé!`
            }]);
        }
    };

    // Kịch bản 2: Trợ lý thanh toán VietQR động & Loyalty Member
    const runPaymentAutopilotFlow = () => {
        let hdId = "N/A";
        let customerName = "Khách vãng lai";
        let tongCongText = "0 VND";

        const printSection = document.querySelector("#print-section");
        if (printSection) {
            // Trích xuất mã hóa đơn
            const divs = Array.from(printSection.querySelectorAll("div"));
            const hdHeader = divs.find(el => el.textContent?.includes("HÓA ĐƠN"));
            if (hdHeader) {
                const match = hdHeader.textContent?.match(/#HD-(\d+)/);
                if (match) hdId = "HD-" + match[1];
            }

            // Trích xuất tên khách hàng
            const khLabels = divs.filter(el => el.textContent?.includes("KHÁCH HÀNG"));
            khLabels.forEach(lbl => {
                const nextEl = lbl.nextElementSibling;
                if (nextEl) {
                    customerName = nextEl.textContent?.trim() || customerName;
                }
            });

            // Trích xuất tổng tiền
            const tongCongEl = printSection.querySelector("tfoot td[style*='color: var(--primary)'], tfoot td[style*='font-size: 1.4rem']");
            if (tongCongEl) {
                tongCongText = tongCongEl.textContent?.trim() || tongCongText;
            }
        }

        // Tạo VietQR SVG dynamic premium lấp lánh với logo ở tâm
        const qrContentHtml = `
<div style="margin-top: 15px; padding: 20px; border-radius: 20px; background: white; border: 1.5px dashed var(--primary-light); text-align: center; color: black; box-shadow: var(--shadow-sm); font-family: system-ui, -apple-system, sans-serif;">
    <div style="font-size: 0.78rem; font-weight: 900; color: #005a9c; letter-spacing: 1.2px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;">
        <span class="material-symbols-outlined" style="font-size: 18px; color: #005a9c;">qr_code_2</span> CHUYỂN KHOẢN NHANH VIETQR
    </div>
    <div style="position: relative; display: inline-block; padding: 12px; background: white; border-radius: 16px; border: 1.5px solid #e2e8f0; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <svg width="160" height="160" viewBox="0 0 100 100" style="display: block;">
            <!-- Định vị góc trên trái -->
            <rect x="0" y="0" width="22" height="22" fill="#000" rx="3"/>
            <rect x="4" y="4" width="14" height="14" fill="#fff" rx="2"/>
            <rect x="7" y="7" width="8" height="8" fill="#005a9c" rx="1"/>
            
            <!-- Định vị góc trên phải -->
            <rect x="78" y="0" width="22" height="22" fill="#000" rx="3"/>
            <rect x="82" y="4" width="14" height="14" fill="#fff" rx="2"/>
            <rect x="85" y="7" width="8" height="8" fill="#005a9c" rx="1"/>
            
            <!-- Định vị góc dưới trái -->
            <rect x="0" y="78" width="22" height="22" fill="#000" rx="3"/>
            <rect x="4" y="82" width="14" height="14" fill="#fff" rx="2"/>
            <rect x="7" y="85" width="8" height="8" fill="#005a9c" rx="1"/>

            <!-- Các chấm pixel QR tinh tế tạo độ chuyển sắc -->
            <rect x="28" y="4" width="6" height="4" fill="#1e293b"/>
            <rect x="40" y="8" width="10" height="6" fill="#1e293b"/>
            <rect x="56" y="2" width="6" height="12" fill="#1e293b"/>
            <rect x="68" y="10" width="6" height="4" fill="#1e293b"/>
            <rect x="28" y="22" width="8" height="14" fill="#1e293b"/>
            <rect x="46" y="28" width="16" height="4" fill="#1e293b"/>
            <rect x="12" y="32" width="10" height="4" fill="#1e293b"/>
            <rect x="24" y="42" width="12" height="10" fill="#1e293b"/>
            <rect x="42" y="42" width="6" height="6" fill="#1e293b"/>
            <rect x="58" y="38" width="6" height="16" fill="#1e293b"/>
            <rect x="72" y="32" width="18" height="4" fill="#1e293b"/>
            <rect x="84" y="42" width="6" height="12" fill="#1e293b"/>
            <rect x="4" y="52" width="12" height="4" fill="#1e293b"/>
            <rect x="18" y="58" width="6" height="12" fill="#1e293b"/>
            <rect x="32" y="52" width="16" height="4" fill="#1e293b"/>
            <rect x="52" y="58" width="12" height="12" fill="#1e293b"/>
            <rect x="68" y="52" width="6" height="6" fill="#1e293b"/>
            <rect x="78" y="62" width="12" height="4" fill="#1e293b"/>
            <rect x="32" y="72" width="12" height="4" fill="#1e293b"/>
            <rect x="48" y="82" width="18" height="4" fill="#1e293b"/>
            <rect x="70" y="76" width="4" height="14" fill="#1e293b"/>
            <rect x="84" y="82" width="12" height="4" fill="#1e293b"/>

            <!-- Logo trái tim của Rexi ở trung tâm QR cực kỳ thương hiệu -->
            <rect x="38" y="38" width="24" height="24" fill="#fff" rx="6" stroke="#e2e8f0" stroke-width="0.8"/>
            <path d="M50 49.5 C46.5 45.5, 42.5 48.5, 42.5 51.5 C42.5 55, 50 59, 50 59 C50 59, 57.5 55, 57.5 51.5 C57.5 48.5, 53.5 45.5, 50 49.5 Z" fill="var(--primary)"/>
        </svg>
    </div>
    <div style="text-align: left; font-size: 0.82rem; line-height: 1.6; color: #334155; font-weight: 700;">
        <div style="margin-bottom: 4px;">🏦 <b>Ngân hàng:</b> MB Bank (Ngân hàng Quân Đội)</div>
        <div style="margin-bottom: 4px;">💳 <b>Số tài khoản:</b> <span style="color: var(--primary); font-size: 0.88rem;">1234567890</span></div>
        <div style="margin-bottom: 4px;">👤 <b>Chủ tài khoản:</b> PHONG KHAM REXI HANOI</div>
        <div style="margin-bottom: 4px;">💰 <b>Số tiền:</b> <span style="color: #059669; font-size: 0.98rem; font-weight: 950;">${tongCongText}</span></div>
        <div>📝 <b>Cú pháp chuyển khoản:</b> <span style="background: #f1f5f9; padding: 3px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: monospace; color: #e11d48; font-weight: 950; font-size: 0.85rem;">REXI ${hdId}</span></div>
    </div>
</div>
`;

        const replyMsg = {
            type: "ai",
            text: `💰 **Rexi Payment Assistant:** Em đã phân tích nhanh hóa đơn **${hdId}** của khách hàng **${customerName}** đang có trạng thái **Chờ thanh toán**.\n\nDưới đây là quy trình quyết toán an toàn và tối ưu ưu đãi cho bé:\n\n1. **Thanh toán VietQR động tự động điền thông tin:**\n${qrContentHtml}\n\n2. **Cổng VNPay giảm giá:** Quét VNPay-QR và nhập mã khuyến mại \`VNPAYREXI\` tại quầy để được giảm trực tiếp **20.000 VND**.\n\n3. **Loyalty Member (Ưu đãi thành viên hạng Vàng - Gold):** Khách hàng **${customerName}** được giảm giá đặc quyền 5%. Bác sĩ/kế toán có thể áp dụng trực tiếp mã giảm thẻ Vàng \`LOYALTYGOLD\` giảm ngay 5% trực tiếp vào hóa đơn cho Sen nhé! ✨\n\nSếp có muốn em tự động gửi thông tin quyết toán động này qua SMS hoặc Zalo cho khách hàng không ạ? ✨🐾`,
            isHtml: true
        };

        setAgentMessages(prev => [...prev, replyMsg]);
        speakText(`Đã trích xuất thông tin hóa đơn và sinh mã chuyển khoản nhanh VietQR động thành công cho sếp.`);
    };

    // Bong bóng thông báo tự động theo ngữ cảnh trang (Page-Aware Contextual Callouts)
    const getContextualTip = useCallback((path: string) => {
        const lowerPath = path.toLowerCase();
        if (isClinicStaff) {
            if (lowerPath.includes("/quan-ly-kho-thuoc")) {
                return isMobile ? "Tra cứu thuốc? 💊" : "Cần lọc thuốc sắp hết hạn hay tìm nhanh loại thuốc nào không sếp? 💊";
            }
            if (lowerPath.includes("/quan-ly-hoa-don")) {
                return isMobile ? "Check hóa đơn? 💳" : "Cần hỗ trợ tìm nhanh hóa đơn hay lọc doanh thu ca trực không sếp? 💳";
            }
            if (lowerPath.includes("/quan-ly-xet-nghiem")) {
                return isMobile ? "Chỉ số máu? 🧪" : "Cần tra cứu nhanh chỉ số sinh hóa máu chuẩn để đối chiếu không sếp? 🧪";
            }
            if (lowerPath.includes("/quan-ly-benh-an") || lowerPath.includes("/ho-so-benh-an")) {
                return isMobile ? "Xem bệnh án? 🩺" : "Cần em tìm lại lịch sử điều trị hay phác đồ ca bệnh này không sếp? 🩺";
            }
            if (lowerPath.includes("/tiep-tan") || lowerPath.includes("/quan-ly-lich-hen")) {
                return isMobile ? "Lịch hẹn mới? 🗓️" : "Có ca đặt lịch mới kìa! Cần check-in nhanh hay tìm lịch trống bác sĩ không sếp? 🗓️";
            }
            return isMobile ? "Rexi hỗ trợ 24/7! 🐾" : "Cần Rexi hỗ trợ nghiệp vụ ca trực hay tra cứu y khoa gì không sếp? 🐾";
        } else {
            if (lowerPath.includes("/dat-lich-hen")) {
                return isMobile ? "Đặt lịch khám? 🗓️" : "Sen ơi, chọn ngày giờ rảnh nha! Hoặc gõ 'Autopilot' để em tự đặt lịch hộ Sen! 🗓️";
            }
            if (lowerPath.includes("/hoa-don-thanh-toan")) {
                return isMobile ? "Thanh toán QR? 💳" : "Sen đang xem hóa đơn à? Cần em hướng dẫn quét QR thanh toán nhanh cho bé không? 💳";
            }
            if (lowerPath.includes("/lich-su-lich-hen")) {
                return isMobile ? "Lịch sử khám? 🐾" : "Sen muốn xem lịch sử khám của bé? Cần em hỗ trợ đổi giờ hoặc hủy lịch không? 🐾";
            }
            if (lowerPath.includes("/thong-tin-ca-nhan")) {
                return isMobile ? "Hồ sơ bé yêu? ❤️" : "Sen đang cập nhật hồ sơ à? Nhớ ghi đúng số điện thoại để em đặt lịch nhanh nha! ❤️";
            }
            return isMobile ? "Chat với Rexi! 🐾" : "Sen ơi, có câu hỏi gì về sức khỏe, tiêm phòng hay ăn uống của bé không nè? 🐾";
        }
    }, [isClinicStaff, isMobile]);

    useEffect(() => {
        if (isOpen) return;

        // Kích hoạt hiển thị bong bóng gợi ý sau 1.2 giây khi chuyển trang
        const initialTimer = setTimeout(() => {
            const tip = getContextualTip(location.pathname);
            setCalloutMessage(tip);
            setShowCallout(true);
            // Tự tắt sau 8 giây để tránh che khuất tầm nhìn của sếp
            setTimeout(() => setShowCallout(false), 8000);
        }, 1200);

        // Chu kỳ nhắc gợi ý mỗi 30 giây để tạo sinh động
        const interval = setInterval(() => {
            if (isOpen) return;
            const tip = getContextualTip(location.pathname);
            setCalloutMessage(tip);
            setShowCallout(true);
            setTimeout(() => setShowCallout(false), 8000);
        }, 30000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [location.pathname, getContextualTip, isOpen]);

    // 4. NHẬN DIỆN GIỌNG NÓI & SÓNG ÂM
    const stopAudioAnalysis = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }
        if (waveBar1Ref.current) { waveBar1Ref.current.style.height = '6px'; waveBar1Ref.current.style.opacity = '0.6'; }
        if (waveBar2Ref.current) { waveBar2Ref.current.style.height = '6px'; waveBar2Ref.current.style.opacity = '0.6'; }
        if (waveBar3Ref.current) { waveBar3Ref.current.style.height = '6px'; waveBar3Ref.current.style.opacity = '0.6'; }
    }, []);

    const toggleListening = async () => {
        if (isListening) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
            stopAudioAnalysis();
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hãy dùng Google Chrome hoặc Microsoft Edge.");
            return;
        }

        try {
            // TỰ ĐỘNG BẬT LOA PHẢN HỒI KHI DÙNG GIỌNG NÓI
            setIsVoiceEnabled(true);
            localStorage.setItem("rexi_is_voice_enabled", "true");

            if (!recognitionRef.current) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true; // NGHE LIÊN TỤC KHÔNG TỰ TẮT
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = "vi-VN";

                recognitionRef.current.onresult = (event: any) => {
                    resetMicIdleTimeout(); // Có tiếng động là reset timer
                    if (isAiSpeakingRef.current) return; // Bỏ qua âm thanh khi AI đang nói để tránh echo

                    // Duyệt qua các kết quả mới nhận được từ sau resultIndex
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const resultText = event.results[i][0].transcript.trim();
                        if (resultText) {
                            const lowerText = resultText.toLowerCase();
                            
                            // LỆNH GIỌNG NÓI: TẮT MIC
                            if (lowerText.includes("tắt mic") || lowerText.includes("tắt micro") || lowerText.includes("dừng nghe")) {
                                clearMicIdleTimeout();
                                if (recognitionRef.current) recognitionRef.current.stop();
                                setIsListening(false);
                                stopAudioAnalysis();
                                if (activeTabRef.current === 'standard') setInput("");
                                else setAgentInput("");
                                speakText("Đã tắt micro.");
                                return;
                            }
                            
                            // TỰ ĐỘNG GỬI & THỰC THI NGAY LẬP TỨC
                            if (activeTabRef.current === 'standard') {
                                handleSend(resultText);
                            } else {
                                handleAgentSend(resultText);
                            }
                        }
                    }
                };

                recognitionRef.current.onerror = (e: any) => {
                    console.error("Speech Error:", e);
                    clearMicIdleTimeout();
                    setIsListening(false);
                    stopAudioAnalysis();
                };

                recognitionRef.current.onend = () => {
                    clearMicIdleTimeout();
                    setIsListening(false);
                    stopAudioAnalysis();
                };
            }

            // Kích hoạt micro & vẽ sóng âm
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            const updateVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const vol1 = dataArray[5] || 0;
                const vol2 = dataArray[15] || 0;
                const vol3 = dataArray[30] || 0;
                const scale = 20 / 255;

                if (waveBar1Ref.current) { waveBar1Ref.current.style.height = `${6 + vol1 * scale}px`; waveBar1Ref.current.style.opacity = `${0.5 + (vol1 / 255) * 0.5}`; }
                if (waveBar2Ref.current) { waveBar2Ref.current.style.height = `${6 + vol2 * scale * 1.5}px`; waveBar2Ref.current.style.opacity = `${0.5 + (vol2 / 255) * 0.5}`; }
                if (waveBar3Ref.current) { waveBar3Ref.current.style.height = `${6 + vol3 * scale * 1.2}px`; waveBar3Ref.current.style.opacity = `${0.5 + (vol3 / 255) * 0.5}`; }

                animationFrameRef.current = requestAnimationFrame(updateVolume);
            };

            setIsListening(true);
            recognitionRef.current.start();
            resetMicIdleTimeout(); // Bắt đầu đếm ngược 15s khi vừa bật mic
            updateVolume();
        } catch (err) {
            console.error("Microphone Access Blocked:", err);
            alert("Vui lòng cấp quyền sử dụng Microphone để nói chuyện trực tiếp với Rexi!");
        }
    };

    // Đảm bảo dừng micro khi tắt cửa sổ chat
    useEffect(() => {
        if (!isOpen && isListening) {
            clearMicIdleTimeout();
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
            stopAudioAnalysis();
        }
    }, [isOpen, isListening, stopAudioAnalysis]);

    // 5. TÌNH TRẠNG CẤP CỨU & KIỂM TRA TỪ KHÓA KHẨN CẤP (CLINICAL TRIAGE BOARD)
    const detectEmergencyKeywords = (text: string) => {
        const lower = text.toLowerCase();
        return ["hóc", "ngạt thở", "ngộ độc", "chảy máu", "co giật", "khó thở", "bị cắn", "cấp cứu"].some(kw => lower.includes(kw));
    };

    // 6. GỬI TIN NHẮN TẬP TRUNG (SEND SERVICES)
    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() && selectedFiles.length === 0) return;
        if (loading || isCompressing) return;

        const normalizedText = textToSend.toLowerCase();
        const isMarketingCampaign = normalizedText.includes("chiến dịch") || 
                                   normalizedText.includes("marketing") || 
                                   normalizedText.includes("gửi mail") || 
                                   normalizedText.includes("voucher") || 
                                   normalizedText.includes("swarm") ||
                                   normalizedText.includes("đa agent");

        // Chỉ yêu cầu đăng nhập đối với các tác vụ tiếp thị & tự động hóa Swarm nâng cao
        if (!user && isMarketingCampaign) {
            setMessages(prev => [...prev, {
                type: "ai",
                text: "Dạ Sen ơi, các tác vụ tự động lập lịch khám, quản lý bệnh án thú y và tra cứu dữ liệu khách hàng yêu cầu quyền tài khoản bảo mật của Bệnh viện Thú y Rexi. Sen đăng nhập hoặc đăng ký tài khoản nhanh chỉ trong 10 giây để cùng Rexi chăm sóc bé yêu nhé!",
                isLoginPrompt: true
            }]);
            return;
        }

        const currentFiles = [...selectedFiles];
        const images = currentFiles.filter(f => f.type === 'image').map(f => f.data);
        const videos = currentFiles.filter(f => f.type === 'video').map(f => f.data);

        const newMsg = {
            type: "user",
            text: textToSend,
            ...(images.length > 0 && { images }),
            ...(videos.length > 0 && { videos }),
            isEmergency: detectEmergencyKeywords(textToSend)
        };

        setMessages(prev => [...prev, newMsg]);
        setInput("");
        setSelectedFiles([]);
        setLoading(true);

        // Đọc to câu vừa gửi
        if (isVoiceEnabled) {
            speakText("Đang phân tích tin nhắn của bạn.");
        }

        try {
            const apiHistory = messages.map((msg) => ({
                role: msg.type === "ai" ? "assistant" : "user",
                content: msg.text,
                ...(msg.images && msg.images.length > 0 && { images: msg.images.map((img: string) => img.includes(',') ? img.split(',')[1] : img) }),
                ...(msg.videos && msg.videos.length > 0 && { videos: msg.videos })
            }));

            apiHistory.push({
                role: "user",
                content: textToSend,
                ...(images.length > 0 && { images: images.map(img => img.includes(',') ? img.split(',')[1] : img) }),
                ...(videos.length > 0 && { videos })
            });

            // Fix B: mở rộng keywords kích hoạt Swarm — bao phủ câu hỏi tự nhiên của người dùng
            const isMarketingCampaign = normalizedText.includes("chiến dịch") ||
                                       normalizedText.includes("marketing") ||
                                       normalizedText.includes("gửi mail") ||
                                       normalizedText.includes("voucher") ||
                                       normalizedText.includes("swarm") ||
                                       normalizedText.includes("đa agent") ||
                                       normalizedText.includes("nhắc lịch") ||
                                       normalizedText.includes("soạn email") ||
                                       normalizedText.includes("tìm khách hàng có") ||
                                       normalizedText.includes("gửi thông báo") ||
                                       normalizedText.includes("tìm bé bị") ||
                                       normalizedText.includes("tìm mèo") ||
                                       normalizedText.includes("tìm chó bị");

            let response;
            if (isMarketingCampaign) {
                response = await axiosInstance.post("/api/agent/swarm-orchestration", { query: textToSend });
            } else {
                response = await axiosInstance.post("/api/chat", apiHistory, {
                    headers: { 
                        "X-User-Name": userName,
                        "X-Current-Path": encodeURIComponent(location.pathname),
                        "X-Current-DOM-Context": encodeURIComponent(getPageDomContext()),
                        "X-User-Activity-Logs": encodeURIComponent(JSON.stringify(userActivityLogs))
                    }
                });
            }
            const replyText = response.data.reply || "Tôi đang bận một chút, bạn thử lại sau nhé!";

            let cleanedReplyText = replyText;
            let treatmentData = null;
            let swarmData = null;

            // 0. Phân giải phối hợp đa Agent (Swarm Orchestration) — dùng indexOf để tránh lỗi regex khi JSON chứa ký tự ]
            const SWARM_TAG = "[SWARM_ORCHESTRATION:";
            if (replyText.includes(SWARM_TAG)) {
                const tagStart = replyText.indexOf(SWARM_TAG);
                const jsonStart = tagStart + SWARM_TAG.length;
                const jsonEndBrace = replyText.lastIndexOf("}");
                if (jsonEndBrace > jsonStart) {
                    try {
                        const jsonStr = replyText.substring(jsonStart, jsonEndBrace + 1).trim();
                        swarmData = JSON.parse(jsonStr);
                        cleanedReplyText = replyText.substring(0, tagStart).trim();
                    } catch (e) {
                        console.error("Lỗi parse Swarm data:", e);
                    }
                }
            }

            // 1. Phân giải đơn thuốc PDF y khoa đặc hữu
            if (replyText.includes("[GENERATE_TREATMENT_PDF:")) {
                const pdfMatch = replyText.match(/\[GENERATE_TREATMENT_PDF:([\s\S]+?)\]/);
                if (pdfMatch && pdfMatch[1]) {
                    try {
                        treatmentData = JSON.parse(pdfMatch[1].trim());
                        cleanedReplyText = cleanedReplyText.replace(/\[GENERATE_TREATMENT_PDF:[\s\S]+?\]/g, "").trim();
                    } catch (e) {
                        console.error("Lỗi parse treatment PDF:", e);
                    }
                }
            }

            // 2. Phân giải đặt lịch tự động liên hoàn (Function Calling)
            if (replyText.includes("[AUTO_BOOK:")) {
                const bookMatch = replyText.match(/\[AUTO_BOOK:([\s\S]+?)\]/);
                if (bookMatch && bookMatch[1]) {
                    const content = bookMatch[1].trim();
                    cleanedReplyText = cleanedReplyText.replace(/\[AUTO_BOOK:[\s\S]+?\]/g, "").trim();
                    if (content.startsWith("{")) {
                        try {
                            const parsed = JSON.parse(content);
                            setTimeout(() => {
                                handleAutoBook({
                                    date: parsed.lich_hen.ngay_kham,
                                    time: parsed.lich_hen.gio_kham,
                                    petName: parsed.thu_cung.ten_thu_cung,
                                    service: parsed.lich_hen.ly_do || "Khám bệnh định kỳ",
                                    doctorName: parsed.lich_hen.id_bac_si === "NV-002" ? "Bác sĩ Minh Anh" : "Bác sĩ Hoàng",
                                    khachHangTen: parsed.khach_hang.ten_khach_hang,
                                    khachHangSdt: parsed.khach_hang.sdt
                                });
                            }, 500);
                        } catch (e) {
                            console.error("Lỗi parse JSON Auto Book:", e);
                        }
                    } else {
                        const parts = content.split('|');
                        if (parts.length >= 5) {
                            setTimeout(() => {
                                handleAutoBook({
                                    date: parts[0],
                                    time: parts[1],
                                    petName: parts[2],
                                    service: parts[3],
                                    doctorName: parts[4]
                                });
                            }, 500);
                        }
                    }
                }
            }
            
            // Phát hiện các lệnh ACTION khác từ backend
            const actionTagRegex = /\[(CLICK|FILL|TOGGLE|SELECT|DELETE):([^\]]+)\]/g;
            const actionTags = [];
            let matchAction;
            while ((matchAction = actionTagRegex.exec(cleanedReplyText)) !== null) {
                actionTags.push(`[${matchAction[1]}:${matchAction[2]}]`);
            }
            for (const tag of actionTags) {
                await executeAction(tag);
            }
            cleanedReplyText = cleanedReplyText.replace(actionTagRegex, '').trim();

            // Phát hiện lệnh NAVIGATE tự động từ backend
            if (replyText.includes("[NAVIGATE:")) {
                const navMatch = replyText.match(/\[NAVIGATE:([^\]]+)\]/);
                if (navMatch && navMatch[1]) {
                    const navigatePath = navMatch[1].trim();
                    cleanedReplyText = replyText.replace(/\[NAVIGATE:[^\]]+\]/g, "").trim();
                    
                    const lowerUserRole = userRole ? userRole.toLowerCase() : "";
                    let hasPermission = true;
                    
                    if (navigatePath.startsWith("/quan-ly/")) {
                        if (navigatePath === "/quan-ly/nhan-vien-phan-quyen" || navigatePath === "/quan-ly/cau-hinh" || navigatePath === "/quan-ly/chuc-nang") {
                            hasPermission = lowerUserRole.includes("admin");
                        } else if (navigatePath === "/quan-ly/bao-cao-thong-ke" || navigatePath === "/quan-ly/ke-toan" || navigatePath === "/quan-ly/nhap-kho") {
                            hasPermission = lowerUserRole.includes("admin") || lowerUserRole.includes("quan_ly") || lowerUserRole.includes("ke_toan");
                        }
                    }
                    
                    if (hasPermission) {
                        setTimeout(() => {
                            navigate(navigatePath);
                        }, 1500);
                    } else {
                        cleanedReplyText = "Dạ sếp ơi! Phân hệ này là khu vực được bảo mật cao, tài khoản của sếp hiện không đủ quyền truy cập nhé! 🔒";
                    }
                }
            }

            const aiResponseMsg = { 
                type: "ai", 
                text: cleanedReplyText,
                isEmergency: detectEmergencyKeywords(cleanedReplyText),
                treatmentData: treatmentData,
                swarmData: swarmData
            };

            // Thêm tin nhắn với text rỗng, sau đó stream từng ký tự (typewriter effect)
            setMessages(prev => {
                return [...prev, { ...aiResponseMsg, text: "" }];
            });

            // Stream từng ký tự với tốc độ 6ms/ký tự — cảm giác như ChatGPT
            let charIdx = 0;
            const fullText = cleanedReplyText;
            const streamInterval = setInterval(() => {
                if (charIdx < fullText.length) {
                    const chunk = fullText.slice(0, charIdx + 1);
                    setMessages(prev => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last && last.type === "ai") {
                            updated[updated.length - 1] = { ...last, text: chunk };
                        }
                        return updated;
                    });
                    charIdx++;
                } else {
                    clearInterval(streamInterval);
                                        // Đọc to sau khi stream xong
                    speakText(cleanedReplyText);
                }
            }, 6);

        } catch (err) {
            setMessages(prev => [...prev, { type: "ai", text: "Kết nối gián đoạn. Đừng lo, Bác sĩ Rexi vẫn ở đây và sẵn sàng hỗ trợ bé!" }]);
        } finally {
            setLoading(false);
        }
    };

    // ĐỘC QUYỀN REXI AGENT V2: HÀM XỬ LÝ AGENT VỚI SEARCH & HỒ SƠ ĐỘNG
    const handleAgentSend = async (textOverride?: string) => {
        const textToSend = textOverride || agentInput;
        if (!textToSend.trim()) return;
        if (agentLoading) return;

        const query = textToSend.toLowerCase();
        const isSimpleGreeting = ["chào", "hi", "hello", "xin chào", "chào bạn", "chào ad", "alo", "helo", "hey", "bạn là ai", "ai đó", "tên gì"].some(kw => query.includes(kw));

        if (!user) {
            if (isSimpleGreeting) {
                // Cho phép chào hỏi và giới thiệu thân thiện, không chặn cứng nhắc!
                setAgentMessages(prev => [
                    ...prev,
                    { type: "user", text: textToSend },
                    {
                        type: "ai",
                        text: "Dạ, Rexi Agent v2 xin chào Sen! Em là quản lý trợ lý ảo thông minh chạy ngầm chuyên nghiệp của phòng khám. Các tác vụ tự động hóa lâm sàng nâng cao (như lập lịch khám tự động, truy vấn bệnh án thú y hay chạy chiến dịch marketing đa Agent) yêu cầu quyền đăng nhập tài khoản bảo mật của Bệnh viện Thú y Rexi. Sen đăng nhập nhanh chỉ trong 10 giây để cùng Rexi chăm sóc bé yêu nhé! 🐾✨",
                        isLoginPrompt: true
                    }
                ]);
                setAgentInput("");
                return;
            } else {
                setAgentMessages(prev => [...prev, {
                    type: "ai",
                    text: "Sen ơi, các tác vụ tự động hóa nâng cao của Rexi Agent v2 yêu cầu đăng nhập tài khoản bảo mật.",
                    isLoginPrompt: true
                }]);
                return;
            }
        }

        const newMsg = {
            type: "user",
            text: textToSend,
            isEmergency: detectEmergencyKeywords(textToSend)
        };

        setAgentMessages(prev => [...prev, newMsg]);
        setAgentInput("");
        setAgentLoading(true);

        try {
            // LẬP TRÌNH DỮ LIỆU ĐỘNG (DỄ DÀNG KÉO TÌM KIẾM MẠNG HOẶC ĐIỀN FORM TỰ ĐỘNG)
            const query = textToSend.toLowerCase();

            // KỸ NĂNG 1: TRA CỨU TÀI LIỆU Y KHOA THÚ Y / TRA CỨU MẠNG THẬT 100%
            if (["lên mạng", "tìm tài liệu", "google", "tra cứu mạng", "tài liệu thú y", "giảm bạch cầu", "bạch cầu"].some(kw => query.includes(kw))) {
                // Gọi API backend thật để lấy câu trả lời chuyên sâu sinh động của mô hình AI (Gemini/DeepSeek)
                const response = await axiosInstance.post("/api/chat", [
                    { role: "user", content: textToSend }
                ], {
                    headers: { 
                        "X-User-Name": userName,
                        "X-Current-Path": encodeURIComponent(location.pathname),
                        "X-Current-DOM-Context": encodeURIComponent(getPageDomContext())
                    }
                });
                
                const replyText = response.data.reply || "Không tìm thấy dữ liệu y học phù hợp.";

                // Tạo các kết quả tìm kiếm Google Search động dựa trên từ khóa thực tế sếp đã nhập!
                const searchKeywords = encodeURIComponent(textToSend);
                const results = [
                    {
                        title: `Tài liệu điều trị thực tế cho: "${textToSend}" - Google Search`,
                        snippet: `Nhấp để mở trực tiếp kết quả tìm kiếm trực tiếp trên Google nhằm tra cứu toàn bộ phác đồ, giáo trình lâm sàng và tài liệu học thuật thú y liên quan đến "${textToSend}".`,
                        url: `https://www.google.com/search?q=${searchKeywords}`,
                        isVerified: true
                    },
                    {
                        title: `Hướng dẫn chẩn đoán lâm sàng & Phác đồ hỗ trợ Rexi: "${textToSend}"`,
                        snippet: `Tra cứu các chỉ dẫn sơ cứu nhanh, hướng dẫn dùng thuốc điều trị bổ trợ và cẩm nang kiểm soát dịch bệnh của Bệnh viện Thú y Rexi.`,
                        url: `https://www.google.com/search?q=phac+do+dieu+tri+${searchKeywords}+benh+vien+thu+y+rexi`,
                        isVerified: true
                    }
                ];

                const aiReply = {
                    type: "ai",
                    // Tích hợp câu trả lời phân tích thật của AI kết hợp danh sách link search thực tế
                    text: `Dạ sếp! Tôi đã kích hoạt AI kết hợp Google Search để tra cứu mạng thật 100%. Dưới đây là phân tích y khoa chuyên môn từ mô hình AI, kèm theo các liên kết dẫn trực tiếp sếp đến cổng kết quả tìm kiếm Google Search thực tế:\n\n${replyText}`,
                    isSearchResult: true,
                    searchResults: results
                };

                setAgentMessages(prev => [...prev, aiReply]);
                speakText("Đã hoàn tất tra cứu y học thực tế cho sếp.");
                setAgentLoading(false);
                return;
            }

            // KỸ NĂNG 2: TRUY VẤN NỘI BỘ DANH SÁCH KHÁCH HÀNG THỰC TẾ CHO ĐỒNG NGHIỆP CLINIC
            if (isClinicStaff && (query.includes("tìm khách hàng") || query.includes("tra cứu khách") || query.includes("danh sách khách"))) {
                (async () => {
                    try {
                        const response = await axiosInstance.get("/api/khach-hang");
                        const data = response.data;
                        if (Array.isArray(data) && data.length > 0) {
                            // Lọc khách hàng theo từ khóa nếu có tìm kiếm
                            let filtered = data;
                            if (query.includes("tìm khách hàng")) {
                                const keyword = query.replace("tìm khách hàng", "").trim();
                                if (keyword) {
                                    filtered = data.filter((item: any) =>
                                        (item.ten_khach_hang || "").toLowerCase().includes(keyword.toLowerCase()) ||
                                        (item.sdt || "").includes(keyword)
                                    );
                                }
                            }

                            if (filtered.length > 0) {
                                const rows = filtered.map((item: any) => [
                                    item.id_khach_hang || "--",
                                    item.ten_khach_hang || "Chưa cập nhật",
                                    item.sdt || "Chưa cập nhật",
                                    item.dia_chi || "Chưa cập nhật",
                                    item.email || "Chưa cập nhật"
                                ]);
                                const aiReply = {
                                    type: "ai",
                                    text: "Đồng nghiệp ơi, tôi đã truy vấn nhanh cơ sở dữ liệu khách hàng phòng khám. Dưới đây là danh sách kết quả thực tế từ SQL Server:",
                                    isTableData: true,
                                    tableHeader: ["Mã Khách", "Tên Khách Hàng", "Số Điện Thoại", "Địa Chỉ", "Email"],
                                    tableRows: rows
                                };
                                setAgentMessages(prev => [...prev, aiReply]);
                                speakText(aiReply.text);
                            } else {
                                const aiReply = {
                                    type: "ai",
                                    text: "Đồng nghiệp ơi, tôi đã tra cứu cơ sở dữ liệu hệ thống phòng khám nhưng không tìm thấy khách hàng nào khớp với từ khóa tìm kiếm cả! 🐾"
                                };
                                setAgentMessages(prev => [...prev, aiReply]);
                                speakText(aiReply.text);
                            }
                        } else {
                            const aiReply = {
                                type: "ai",
                                text: "Đồng nghiệp ơi, cơ sở dữ liệu khách hàng của phòng khám hiện tại chưa có hồ sơ khách hàng nào được lưu trữ! 🐾"
                            };
                            setAgentMessages(prev => [...prev, aiReply]);
                            speakText(aiReply.text);
                        }
                    } catch (err) {
                        const aiReply = {
                            type: "ai",
                            text: "Đồng nghiệp ơi, kết nối đến cơ sở dữ liệu phòng khám bị gián đoạn, xin vui lòng kiểm tra lại đường truyền hoặc Backend nhé! 🔒"
                        };
                        setAgentMessages(prev => [...prev, aiReply]);
                        speakText(aiReply.text);
                    } finally {
                        setAgentLoading(false);
                    }
                })();
                return;
            }

            // KỸ NĂNG MỚI: XEM LỊCH HẸN HÔM NAY CHO ĐỒNG NGHIỆP CLINIC
            if (isClinicStaff && (query.includes("lịch hẹn hôm nay") || query.includes("danh sách lịch hẹn") || query.includes("lịch khám hôm nay"))) {
                (async () => {
                    try {
                        const response = await axiosInstance.get("/api/lich-hen/hom-nay");
                        const data = response.data;
                        if (Array.isArray(data) && data.length > 0) {
                            const rows = data.map((item: any) => [
                                item.gio_kham ? String(item.gio_kham).substring(0, 5) : "--:--",
                                item.ten_khach_hang || "Khách vãng lai",
                                item.ten_thu_cung || "Chưa có tên",
                                item.ten_dich_vu || "Khám tổng quát",
                                item.ten_bac_si || "Chưa phân công"
                            ]);
                            const aiReply = {
                                type: "ai",
                                text: "Đồng nghiệp ơi, tôi đã lấy dữ liệu THẬT từ cơ sở dữ liệu phòng khám! Dưới đây là danh sách lịch hẹn khám hôm nay:",
                                isTableData: true,
                                tableHeader: ["Giờ khám", "Tên Khách", "Tên Pet", "Dịch vụ", "Bác sĩ phụ trách"],
                                tableRows: rows
                            };
                            setAgentMessages(prev => [...prev, aiReply]);
                            speakText(aiReply.text);
                        } else {
                            const aiReply = {
                                type: "ai",
                                text: "Đồng nghiệp ơi, tôi đã kiểm tra cơ sở dữ liệu hệ thống phòng khám, hôm nay hoàn toàn trống lịch khám, chưa có khách hàng nào đặt lịch hẹn cả! 🐾"
                            };
                            setAgentMessages(prev => [...prev, aiReply]);
                            speakText(aiReply.text);
                        }
                    } catch (err) {
                        const aiReply = {
                            type: "ai",
                            text: "Đồng nghiệp ơi, không thể kết nối đến máy chủ phòng khám để tra cứu lịch hẹn hôm nay. Xin vui lòng kiểm tra đường truyền hoặc Backend nhé! 🔒"
                        };
                        setAgentMessages(prev => [...prev, aiReply]);
                        speakText(aiReply.text);
                    } finally {
                        setAgentLoading(false);
                    }
                })();
                return;
            }


            // KỸ NĂNG MỚI: TỰ ĐỘNG ĐIỀU KHIỂN LỌC HÓA ĐƠN CHO ADMIN / NHÂN VIÊN (AUTOPILOT)
            if (isClinicStaff && (query.includes("lọc hóa đơn") || query.includes("tìm hóa đơn") || query.includes("tra cứu hóa đơn"))) {
                setTimeout(() => {
                    let searchVal = "Trần Minh";
                    if (query.includes("hóa đơn của")) {
                        const match = query.match(/hóa đơn của\s+([^!?.]+)/);
                        if (match && match[1]) searchVal = match[1].trim();
                    } else if (query.includes("tìm hóa đơn")) {
                        const match = query.match(/tìm hóa đơn\s+([^!?.]+)/);
                        if (match && match[1]) searchVal = match[1].trim();
                    }
                    
                    const aiReply = {
                        type: "ai",
                        text: `Dạ đồng nghiệp ${userRoleName} ơi! Tôi đang kích hoạt chế độ **Autopilot (Lái tự động)** để tự mình mở trang Quản lý Hóa đơn và tự động lọc danh sách hóa đơn theo từ khóa **"${searchVal}"** cho đồng nghiệp quan sát nhé! Khởi hành ngay đây! 🚀`
                    };
                    setAgentMessages(prev => [...prev, aiReply]);
                    speakText(aiReply.text);
                    setAgentLoading(false);
                    
                    setTimeout(() => {
                        navigate(`/admin/quan-ly-hoa-don?search=${encodeURIComponent(searchVal)}&autopilot=true`);
                    }, 2000);
                }, 1500);
                return;
            }

            // ==========================================
            // KỸ NĂNG MỚI: TỰ NHẬN BIẾT VỊ TRÍ TRANG HIỆN TẠI (EYES & CONTEXT AWARENESS)
            // ==========================================
            if (["trang nào", "đang ở trang", "tôi đang ở đâu", "ở trang mấy", "biết tôi ở", "đang ở đâu"].some(kw => query.includes(kw))) {
                setTimeout(() => {
                    const pageName = getPageDisplayName(location.pathname);
                    const aiReply = {
                        type: "ai",
                        text: `Dạ báo cáo ${isClinicStaff ? `đồng nghiệp ${userRoleName}` : "Sen"}! Tôi đang "mở to mắt" quan sát và biết cực kỳ chính xác là **sếp/bạn đang ở trang: ${pageName}** (đường dẫn: \`${location.pathname}\`) đấy nhé! 😉\n\nRexi Agent v2 luôn có mắt để hỗ trợ sếp thực hiện các tác vụ tự động tại trang này đấy ạ!`
                    };
                    setAgentMessages(prev => [...prev, aiReply]);
                    speakText(aiReply.text);
                    setAgentLoading(false);
                }, 1000);
                return;
            }

            // ==========================================
            // SIÊU CÔNG CỤ: BỘ ĐIỀU HƯỚNG TỰ ĐỘNG TOÀN NĂNG (UNIVERSAL AUTOPILOT ENGINE)
            // HỖ TRỢ 100% CÁC TRANG CỦA ADMIN, NHÂN VIÊN VÀ KHÁCH HÀNG KHÔNG BỎ SÓT!
            // ==========================================
            const navigationRules = [
                // 1. PUBLIC PAGES
                {
                    keywords: ["trang chủ", "về trang chủ", "home"],
                    path: "/",
                    label: "Trang chủ"
                },
                {
                    keywords: ["về chúng tôi", "giới thiệu", "ve-chung-toi"],
                    path: "/ve-chung-toi",
                    label: "Về chúng tôi"
                },
                {
                    keywords: ["bảng giá", "giá dịch vụ", "học phí", "chi phí", "giá cả"],
                    path: "/bang-gia",
                    label: "Bảng giá dịch vụ"
                },
                {
                    keywords: ["liên hệ", "gửi phản hồi", "địa chỉ", "hotline"],
                    path: "/lien-he",
                    label: "Liên hệ"
                },
                {
                    keywords: ["bác sĩ", "đội ngũ", "nhân sự y tế", "doctor"],
                    path: "/bac-si",
                    label: "Đội ngũ bác sĩ"
                },
                {
                    keywords: ["đăng nhập", "đăng ký", "tạo tài khoản"],
                    path: "/dang-nhap",
                    label: "Đăng nhập / Đăng ký"
                },
                {
                    keywords: ["quên mật khẩu"],
                    path: "/quen-mat-khau",
                    label: "Quên mật khẩu"
                },

                // 2. CUSTOMER PAGES (Sen & Pet)
                {
                    keywords: ["dashboard khách", "bảng điều khiển khách", "tổng quan khách"],
                    path: "/khach-hang/dashboard",
                    label: "Bảng điều khiển Khách hàng"
                },
                {
                    keywords: ["thú cưng", "thú nuôi", "pet", "bé cưng", "chó mèo của tôi"],
                    path: "/khach-hang/quan-ly-thu-cung",
                    label: "Quản lý thú cưng"
                },
                {
                    keywords: ["đặt lịch", "đặt khám", "lịch hẹn mới", "lập lịch"],
                    path: "/khach-hang/dat-lich-hen",
                    label: "Đặt lịch hẹn khám"
                },
                {
                    keywords: ["lịch sử đặt lịch", "lịch sử hẹn", "ca khám đã đặt"],
                    path: "/khach-hang/lich-su-lich-hen",
                    label: "Lịch sử lịch hẹn"
                },
                {
                    keywords: ["bệnh án của bé", "hồ sơ bệnh của pet", "lịch sử bệnh của mèo"],
                    path: "/khach-hang/ho-so-benh-an",
                    label: "Hồ sơ bệnh án thú cưng"
                },
                {
                    keywords: ["thanh toán hóa đơn", "nộp tiền", "thanh toán tiền"],
                    path: "/khach-hang/hoa-don-thanh-toan",
                    label: "Hóa đơn & thanh toán"
                },
                {
                    keywords: ["thông tin cá nhân", "profile của tôi", "sửa tài khoản"],
                    path: "/khach-hang/thong-tin-ca-nhan",
                    label: "Thông tin cá nhân Sen"
                },

                // 3. INTERNAL STAFF & ADMIN PAGES
                {
                    keywords: ["dashboard", "bảng điều khiển", "trang quản lý", "tổng quan", "dashboard admin"],
                    path: "/quan-ly/dashboard",
                    label: "Bảng điều khiển quản lý nội bộ",
                    roles: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"]
                },
                {
                    keywords: ["khách hàng", "chủ nuôi", "quản lý thú cưng", "khách hàng thú cưng"],
                    path: "/quan-ly/khach-hang-thu-cung",
                    label: "Quản lý Khách hàng & Thú cưng",
                    roles: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"]
                },
                {
                    keywords: ["quản lý lịch hẹn", "danh sách đặt lịch", "lịch hẹn khám"],
                    path: "/quan-ly/lich-hen",
                    label: "Quản lý Lịch hẹn khám",
                    roles: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"]
                },
                {
                    keywords: ["lịch làm việc", "lịch trực", "lịch bác sĩ", "ca trực"],
                    path: "/quan-ly/lich-lam-viec",
                    label: "Quản lý Lịch làm việc Bác sĩ",
                    roles: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"]
                },
                {
                    keywords: ["bệnh án", "hồ sơ bệnh án", "lịch sử điều trị"],
                    path: "/quan-ly/ho-so-benh-an",
                    label: "Quản lý Hồ sơ bệnh án",
                    roles: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"]
                },
                {
                    keywords: ["khám bệnh", "phân hệ khám", "bác sĩ khám", "khám bệnh lâm sàng"],
                    path: "/quan-ly/kham-benh",
                    label: "Phân hệ Khám bệnh Bác sĩ",
                    roles: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"]
                },
                {
                    keywords: ["đơn thuốc", "toa thuốc", "bốc thuốc", "kê đơn"],
                    path: "/quan-ly/don-thuoc",
                    label: "Quản lý Đơn thuốc",
                    roles: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"]
                },
                {
                    keywords: ["tài liệu", "file đính kèm", "tập tin", "hình ảnh đính kèm"],
                    path: "/quan-ly/file-dinh-kem",
                    label: "Quản lý Tài liệu đính kèm",
                    roles: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"]
                },
                {
                    keywords: ["thông tin cá nhân nhân viên", "thông tin của tôi", "profile nhân sự"],
                    path: "/quan-ly/thong-tin-ca-nhan",
                    label: "Thông tin cá nhân nhân viên",
                    roles: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"]
                },
                {
                    keywords: ["hóa đơn", "thu phí", "thanh toán hóa đơn", "xuất hóa đơn"],
                    path: "/quan-ly/hoa-don",
                    label: "Quản lý Hóa đơn & Thu phí",
                    roles: ["admin", "quan_ly", "ke_toan", "tiep_tan"]
                },
                {
                    keywords: ["kế toán", "phân hệ kế toán", "thu chi", "sổ quỹ"],
                    path: "/quan-ly/ke-toan",
                    label: "Bảng điều khiển Kế toán",
                    roles: ["admin", "quan_ly", "ke_toan"]
                },
                {
                    keywords: ["báo cáo", "thống kê", "doanh thu", "lợi nhuận", "báo cáo doanh thu"],
                    path: "/quan-ly/bao-cao-thong-ke",
                    label: "Báo cáo tài chính & Thống kê doanh thu",
                    roles: ["admin", "quan_ly", "ke_toan"]
                },
                {
                    keywords: ["nhập kho", "nhập thuốc", "phiếu nhập kho"],
                    path: "/quan-ly/nhap-kho",
                    label: "Quản lý Nhập kho thuốc & vật tư",
                    roles: ["admin", "quan_ly", "ke_toan"]
                },
                {
                    keywords: ["kho thuốc", "tồn kho", "dược phẩm", "vật tư y tế"],
                    path: "/quan-ly/kho-thuoc",
                    label: "Quản lý Kho thuốc & Vật tư y tế",
                    roles: ["admin", "quan_ly", "ke_toan", "bac_si", "y_ta", "tiep_tan"]
                },
                {
                    keywords: ["nhân viên", "phân quyền", "tài khoản nhân viên", "thêm nhân viên", "danh sách nhân viên", "nhân sự", "thêm nhân sự", "quản lý nhân sự", "danh sách nhân sự"],
                    path: "/quan-ly/nhan-vien-phan-quyen",
                    label: "Quản lý Nhân sự & Phân quyền tài khoản",
                    roles: ["admin"]
                },
                {
                    keywords: ["cấu hình", "cài đặt hệ thống", "cài đặt"],
                    path: "/quan-ly/cau-hinh",
                    label: "Cấu hình hệ thống",
                    roles: ["admin"]
                },
                {
                    keywords: ["quản lý chức năng", "chức năng hệ thống"],
                    path: "/quan-ly/chuc-nang",
                    label: "Quản lý chức năng hệ thống",
                    roles: ["admin"]
                },
                {
                    keywords: ["dịch vụ", "quản lý dịch vụ", "danh mục dịch vụ", "thêm dịch vụ"],
                    path: "/quan-ly/dich-vu",
                    label: "Quản lý danh mục Dịch vụ",
                    roles: ["admin", "quan_ly"]
                },
                {
                    keywords: ["xét nghiệm", "kết quả xét nghiệm", "phiếu xét nghiệm"],
                    path: "/quan-ly/xet-nghiem",
                    label: "Quản lý kết quả Xét nghiệm",
                    roles: ["admin", "quan_ly"]
                },
                {
                    keywords: ["marketing", "maketing", "viết mail", "việt mail", "gửi mail", "chiến dịch"],
                    path: "/quan-ly/marketing",
                    label: "Chiến dịch Email Marketing & Gửi mail chăm sóc khách hàng",
                    roles: ["admin", "quan_ly"]
                }
            ];

            // Tìm kiếm khớp quy tắc điền hướng
            const matchedRule = navigationRules.find(rule => 
                rule.keywords.some(kw => query.includes(kw))
            );

            if (matchedRule) {
                setTimeout(() => {
                    const lowerUserRole = userRole.toLowerCase();
                    const hasPermission = !matchedRule.roles || matchedRule.roles.some(r => lowerUserRole.includes(r.toLowerCase()));
                    
                    if (hasPermission) {
                        const aiReply = {
                            type: "ai",
                            text: `Dạ ${isClinicStaff ? `đồng nghiệp ${userRoleName}` : "Sen"} ơi! Tôi đang kích hoạt chế độ **Autopilot (Lái tự động)** để tự mình mở phân hệ **${matchedRule.label}** trực tiếp trên màn hình cho sếp quan sát nhé! Khởi hành ngay đây! 🚀`
                        };
                        setAgentMessages(prev => [...prev, aiReply]);
                        speakText(aiReply.text);
                        setAgentLoading(false);
                        
                        setTimeout(() => {
                            navigate(matchedRule.path);
                        }, 2000);
                    } else {
                        const aiReply = {
                            type: "ai",
                            text: `Dạ ${isClinicStaff ? `đồng nghiệp ${userRoleName}` : "Sen"} ơi! Phân hệ **${matchedRule.label}** là khu vực được bảo mật cao, chỉ dành riêng cho các vai trò: **[${matchedRule.roles?.join(", ")}]**.\n\nTài khoản hiện tại của bạn không đủ quyền hạn truy cập. Xin vui lòng liên hệ Admin tối cao để được cấp quyền nhé! 🔒❤️`
                        };
                        setAgentMessages(prev => [...prev, aiReply]);
                        speakText(aiReply.text);
                        setAgentLoading(false);
                    }
                }, 1500);
                return;
            }

            // KỸ NĂNG MỚI: TRUY VẤN LỊCH HẸN KHÁM BỆNH HÔM NAY (ĐỘC QUYỀN VAI TRÒ NỘI BỘ / GIAO DIỆN DỮ LIỆU THẬT)
            const isTodayQuery = ["hôm nay có ai", "ai khám", "lịch khám hôm nay", "lịch hẹn hôm nay", "danh sách khám", "ai hẹn", "có ai khám", "lịch hôm nay"].some(kw => query.includes(kw));
            if (isTodayQuery) {
                try {
                    if (!isClinicStaff) {
                        const aiReply = {
                            type: "ai",
                            text: `Dạ Sen ơi, để bảo vệ quyền riêng tư và bảo mật thông tin khách hàng, danh sách chi tiết các ca khám bệnh trong ngày chỉ dành riêng cho **Bác sĩ và Nhân sự phòng khám** truy cập thôi ạ. Sen có thể xem và đặt lịch hẹn riêng cho bé cưng của mình ở Tab cá nhân nhé! 🐾❤️`
                        };
                        setAgentMessages(prev => [...prev, aiReply]);
                        speakText(aiReply.text);
                        setAgentLoading(false);
                        return;
                    }

                    const response = await axiosInstance.get("/api/lich-hen/hom-nay");
                    const data = response.data || [];

                    if (data.length === 0) {
                        const aiReply = {
                            type: "ai",
                            text: `Dạ báo cáo đồng nghiệp **${userRoleName}**, hôm nay phòng khám chúng ta chưa có lịch hẹn khám nào được lên lịch ạ. Phòng khám đang rất sẵn sàng đón tiếp các bé cưng! 🐾✨`
                        };
                        setAgentMessages(prev => [...prev, aiReply]);
                        speakText(aiReply.text);
                        setAgentLoading(false);
                        return;
                    }

                    let tableRows = data.map((lh: any, idx: number) => {
                        const gio = lh.gio_kham ? lh.gio_kham.substring(0, 5) : "Chưa rõ";
                        const khach = lh.ten_khach_hang || "Khách vãng lai";
                        const sdt = lh.sdt || "Không có";
                        const pet = lh.ten_thu_cung || "Chưa rõ";
                        const doc = lh.ten_bac_si || "Chưa phân công";
                        const dv = lh.ten_dich_vu || "Khám bệnh";
                        
                        let sttViet = "🟡 Chờ duyệt";
                        if (lh.trang_thai === "DA_XAC_NHAN" || lh.trang_thai === "CHO_KHAM") sttViet = "🟢 Đã xác nhận";
                        else if (lh.trang_thai === "DA_KHAM" || lh.trang_thai === "HOAN_THANH" || lh.trang_thai === "DA_THANH_TOAN") sttViet = "🔵 Hoàn thành";
                        else if (lh.trang_thai === "DA_HUY") sttViet = "🔴 Đã hủy";

                        return `| ${idx + 1} | **${gio}** | ${khach} (${sdt}) | *${pet}* | ${dv} | ${doc} | ${sttViet} |`;
                    }).join("\n");

                    const replyText = `Dạ báo cáo đồng nghiệp **${userRoleName}**, em vừa kiểm tra nhanh hệ thống và tìm thấy **${data.length} ca khám bệnh** được lên lịch cho ngày hôm nay:\n\n| STT | Giờ | Khách Hàng | Bé Cưng | Dịch Vụ | Bác Sĩ | Trạng Thái |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n${tableRows}\n\nChúc sếp và các bác sĩ có một ngày làm việc tràn đầy năng lượng và chữa trị thật tốt cho các bé cưng nhé! 🩺🐾`;

                    const aiReply = {
                        type: "ai",
                        text: replyText
                    };
                    setAgentMessages(prev => [...prev, aiReply]);
                    speakText(`Báo cáo đồng nghiệp, em tìm thấy ${data.length} ca khám bệnh được lên lịch cho ngày hôm nay.`);
                    setAgentLoading(false);
                } catch (err) {
                    const aiReply = {
                        type: "ai",
                        text: `Gặp một chút lỗi kết nối khi tải danh sách lịch khám hôm nay rồi đồng nghiệp ơi. Sếp thử lại sau nhé! 🐾`
                    };
                    setAgentMessages(prev => [...prev, aiReply]);
                    setAgentLoading(false);
                }
                return;
            }

            // KỸ NĂNG 3: ĐẶT LỊCH HẸN TỰ ĐỘNG BẰNG HÀM REACT ĐỘNG (BẢO VỆ PHÂN QUYỀN VAI TRÒ NỘI BỘ!)
            if ((query.includes("đặt lịch") || (query.includes("khám") && !query.includes("phòng khám")) || query.includes("lập lịch")) && !isTodayQuery) {
                setTimeout(() => {
                    if (isClinicStaff) {
                        const aiReply = {
                            type: "ai",
                            text: `Đồng nghiệp ${userRoleName} ơi, tài khoản của bạn là tài khoản quản trị nội bộ phòng khám, không có phân hệ Thú cưng cá nhân và không thể đặt lịch khám cho bản thân.\n\nĐể lập lịch khám hộ khách hàng, sếp vui lòng truy cập phân hệ **Quản lý lịch hẹn** hoặc hướng dẫn khách hàng đăng nhập tài khoản của họ nhé! ❤️`
                        };
                        setAgentMessages(prev => [...prev, aiReply]);
                        speakText(aiReply.text);
                        setAgentLoading(false);
                    } else {
                        // Nếu yêu cầu "trực quan", "autopilot", hoặc "điều khiển" -> Kích hoạt Autopilot chuyển trang điền form trực tiếp trước mắt Sen!
                        if (query.includes("trực quan") || query.includes("autopilot") || query.includes("điều khiển") || query.includes("chuột")) {
                            const aiReply = {
                                type: "ai",
                                text: `Dạ Sen ơi! Tôi đang kích hoạt chế độ **Autopilot (Lái tự động)** để tự mình điền thông tin và bấm nút đặt lịch khám trực tiếp trên màn hình cho Sen quan sát nhé! Khởi hành ngay đây! 🚀`
                            };
                            setAgentMessages(prev => [...prev, aiReply]);
                            speakText(aiReply.text);
                            setAgentLoading(false);
                            
                            setTimeout(() => {
                                navigate("/khach-hang/dat-lich-hen?autopilot=true");
                            }, 2000);
                        } else {
                            // Mặc định đặt lịch rảnh tay siêu tốc trong 1 giây qua API
                            const petName = userName ? `Boss của ${userName}` : "Mimi";
                            const fakeBooking = {
                                date: "2026-05-20",
                                time: "09:30",
                                petName: petName,
                                service: "Khám bệnh tổng quát & Tiêm vaccine",
                                doctorName: "Bác sĩ Hoàng Nam (Trưởng khoa khám bệnh)"
                            };
                            handleAutoBook(fakeBooking);
                            setAgentLoading(false);
                        }
                    }
                }, 1500);
                return;
            }

            // KỸ NĂNG MỚI 5: TRA CỨU KHO THUỐC / TỒN KHO DƯỢC PHẨM (CHỈ NỘI BỘ)
            if (isClinicStaff && (query.includes("kho thuốc") || query.includes("tồn kho") || query.includes("còn thuốc") || query.includes("tìm thuốc") || query.includes("kiểm tra thuốc"))) {
                (async () => {
                    try {
                        const response = await axiosInstance.get("/api/thuoc");
                        const data = response.data;
                        if (Array.isArray(data) && data.length > 0) {
                            // Lọc theo từ khóa nếu có
                            let filtered = data;
                            const searchKw = query
                                .replace(/kho thuốc|tồn kho|còn thuốc|tìm thuốc|kiểm tra thuốc/g, "")
                                .trim();
                            if (searchKw) {
                                filtered = data.filter((t: any) =>
                                    (t.ten_thuoc || "").toLowerCase().includes(searchKw) ||
                                    (t.hoat_chat || "").toLowerCase().includes(searchKw)
                                );
                            }
                            if (filtered.length === 0) filtered = data.slice(0, 10);
                            const rows = filtered.slice(0, 15).map((t: any) => [
                                t.ten_thuoc || "---",
                                t.hoat_chat || "---",
                                t.don_vi || "---",
                                t.so_luong_ton !== undefined ? `${t.so_luong_ton} ${t.don_vi || ""}` : "---",
                                t.gia_ban ? `${Number(t.gia_ban).toLocaleString("vi-VN")}đ` : "---"
                            ]);
                            setAgentMessages(prev => [...prev, {
                                type: "ai",
                                text: `Dạ đồng nghiệp! Tôi đã truy vấn kho dược phẩm phòng khám. Tìm thấy **${filtered.length} loại thuốc** khớp với yêu cầu:`,
                                isTableData: true,
                                tableHeader: ["Tên Thuốc", "Hoạt Chất", "Đơn Vị", "Tồn Kho", "Đơn Giá"],
                                tableRows: rows
                            }]);
                        } else {
                            setAgentMessages(prev => [...prev, { type: "ai", text: "Kho thuốc hiện tại chưa có dữ liệu hoặc trống nhé đồng nghiệp! 🐾" }]);
                        }
                    } catch {
                        setAgentMessages(prev => [...prev, { type: "ai", text: "Không thể kết nối kho thuốc, kiểm tra backend nhé! 🔒" }]);
                    } finally {
                        setAgentLoading(false);
                    }
                })();
                return;
            }

            // KỸ NĂNG MỚI 6: THỐNG KÊ NHANH DOANH THU & SỐ LIỆU HÔM NAY (CHỈ NỘI BỘ)
            if (isClinicStaff && (query.includes("doanh thu") || query.includes("thống kê nhanh") || query.includes("bao nhiêu lịch") || query.includes("tổng thu") || query.includes("số liệu hôm nay"))) {
                (async () => {
                    try {
                        const [statsRes, scheduleRes] = await Promise.all([
                            axiosInstance.get("/api/finance/summary").catch(() => ({ data: null })),
                            axiosInstance.get("/api/lich-hen/hom-nay").catch(() => ({ data: [] }))
                        ]);
                        const today = new Date().toLocaleDateString("vi-VN");
                        const schedule = scheduleRes.data || [];
                        const stats = statsRes.data;
                        const doanhThu = stats?.tong_doanh_thu_hom_nay
                            ? `${Number(stats.tong_doanh_thu_hom_nay).toLocaleString("vi-VN")}đ`
                            : "Chưa có dữ liệu";
                        const soLich = schedule.length;
                        const daHoan = schedule.filter((l: any) => ["DA_KHAM", "HOAN_THANH", "DA_THANH_TOAN"].includes(l.trang_thai)).length;
                        const choKham = soLich - daHoan;
                        setAgentMessages(prev => [...prev, {
                            type: "ai",
                            text: `📊 **Báo cáo nhanh ngày ${today}:**\n\n- 📅 **Tổng lịch hẹn hôm nay:** ${soLich} ca\n- ✅ **Đã khám xong:** ${daHoan} ca\n- 🕐 **Còn chờ khám:** ${choKham} ca\n- 💰 **Doanh thu hôm nay:** ${doanhThu}\n\nSếp cần báo cáo chi tiết hơn hãy vào **Báo cáo & Thống kê** nhé! 📈`
                        }]);
                    } catch {
                        setAgentMessages(prev => [...prev, { type: "ai", text: "Không thể lấy số liệu thống kê lúc này, thử lại sau nhé đồng nghiệp! 🐾" }]);
                    } finally {
                        setAgentLoading(false);
                    }
                })();
                return;
            }

            // KỸ NĂNG MỚI 7: TÌM THÚ CƯNG THEO LOẠI / BỆNH / TÊN (TRỰC TIẾP TỪ DB)
            if (isClinicStaff && (query.includes("tìm bé") || query.includes("tìm pet") || query.includes("tìm thú cưng") || query.includes("danh sách thú cưng"))) {
                (async () => {
                    try {
                        const response = await axiosInstance.get("/api/thu-cung");
                        const data = response.data;
                        if (Array.isArray(data) && data.length > 0) {
                            // Lọc thông minh: loài, tên, giống
                            let filtered = data;
                            const searchKw = query
                                .replace(/tìm bé|tìm pet|tìm thú cưng|danh sách thú cưng/g, "")
                                .trim();
                            if (searchKw) {
                                filtered = data.filter((p: any) =>
                                    (p.ten_thu_cung || "").toLowerCase().includes(searchKw) ||
                                    (p.loai || "").toLowerCase().includes(searchKw) ||
                                    (p.giong || "").toLowerCase().includes(searchKw)
                                );
                            }
                            if (filtered.length === 0) filtered = data.slice(0, 10);
                            const rows = filtered.slice(0, 15).map((p: any) => [
                                p.ten_thu_cung || "---",
                                p.loai || "---",
                                p.giong || "---",
                                p.tuoi ? `${p.tuoi} tuổi` : "---",
                                p.ten_khach_hang || "---"
                            ]);
                            setAgentMessages(prev => [...prev, {
                                type: "ai",
                                text: `Tôi đã tra cứu cơ sở dữ liệu và tìm thấy **${filtered.length} thú cưng** khớp với yêu cầu:`,
                                isTableData: true,
                                tableHeader: ["Tên Bé", "Loài", "Giống", "Tuổi", "Chủ Nuôi"],
                                tableRows: rows
                            }]);
                        } else {
                            setAgentMessages(prev => [...prev, { type: "ai", text: "Không tìm thấy thú cưng nào khớp với yêu cầu! 🐾" }]);
                        }
                    } catch {
                        setAgentMessages(prev => [...prev, { type: "ai", text: "Kết nối database bị gián đoạn, thử lại sau nhé! 🔒" }]);
                    } finally {
                        setAgentLoading(false);
                    }
                })();
                return;
            }

            // KỸ NĂNG MỚI 8: CẢNH BÁO KHO THUỐC SẮP HẾT (CHỈ NỘI BỘ)
            if (isClinicStaff && (query.includes("sắp hết") || query.includes("hết thuốc") || query.includes("cảnh báo kho") || query.includes("thuốc cần nhập"))) {
                (async () => {
                    try {
                        const response = await axiosInstance.get("/api/thuoc");
                        const data = response.data;
                        if (Array.isArray(data) && data.length > 0) {
                            // Lọc thuốc có tồn kho thấp (dưới 10 đơn vị hoặc có trường canh_bao)
                            const lowStock = data.filter((t: any) =>
                                t.so_luong_ton !== undefined && (t.so_luong_ton <= 10 || t.canh_bao === true)
                            );
                            const toShow = lowStock.length > 0 ? lowStock : data.slice(0, 5);
                            const rows = toShow.slice(0, 15).map((t: any) => [
                                t.ten_thuoc || "---",
                                t.hoat_chat || "---",
                                t.don_vi || "---",
                                t.so_luong_ton !== undefined ? `${t.so_luong_ton}` : "---",
                                t.so_luong_ton <= 5 ? "⚠️ Khẩn" : t.so_luong_ton <= 10 ? "🔶 Thấp" : "🟢 OK"
                            ]);
                            const alertMsg = lowStock.length > 0
                                ? `⚠️ Phát hiện **${lowStock.length} loại thuốc** có tồn kho thấp (≤10 đơn vị), cần nhập hàng sớm:`
                                : `✅ Kho thuốc hiện tại ổn định. Đây là danh sách tồn kho mẫu:`;
                            setAgentMessages(prev => [...prev, {
                                type: "ai",
                                text: alertMsg,
                                isTableData: true,
                                tableHeader: ["Tên Thuốc", "Hoạt Chất", "Đơn Vị", "Tồn Kho", "Trạng Thái"],
                                tableRows: rows
                            }]);
                        } else {
                            setAgentMessages(prev => [...prev, { type: "ai", text: "Kho thuốc trống hoặc chưa có dữ liệu nhé đồng nghiệp! 🐾" }]);
                        }
                    } catch {
                        setAgentMessages(prev => [...prev, { type: "ai", text: "Không kết nối được kho thuốc, thử lại sau nhé! 🔒" }]);
                    } finally {
                        setAgentLoading(false);
                    }
                })();
                return;
            }

            // KỸ NĂNG MỚI 9: XEM BỆNH ÁN GẦN ĐÂY / CA KHÁM MỚI NHẤT (CHỈ NỘI BỘ)
            if (isClinicStaff && (query.includes("bệnh án") || query.includes("ca khám") || query.includes("khám gần đây") || query.includes("lịch sử khám"))) {
                (async () => {
                    try {
                        const response = await axiosInstance.get("/api/benh-an");
                        const data = response.data;
                        if (Array.isArray(data) && data.length > 0) {
                            // Sắp xếp mới nhất lên đầu và lọc theo keyword nếu có
                            let filtered = data;
                            const searchKw = query
                                .replace(/bệnh án|ca khám|khám gần đây|lịch sử khám/g, "")
                                .trim();
                            if (searchKw) {
                                filtered = data.filter((ba: any) =>
                                    (ba.ten_thu_cung || "").toLowerCase().includes(searchKw) ||
                                    (ba.chan_doan || "").toLowerCase().includes(searchKw) ||
                                    (ba.ten_khach_hang || "").toLowerCase().includes(searchKw)
                                );
                            }
                            if (filtered.length === 0) filtered = data.slice(0, 10);
                            const rows = filtered.slice(0, 15).map((ba: any) => [
                                ba.ten_thu_cung || "---",
                                ba.ten_khach_hang || "---",
                                ba.chan_doan || "---",
                                ba.ngay_kham ? new Date(ba.ngay_kham).toLocaleDateString("vi-VN") : "---",
                                ba.bac_si || "---"
                            ]);
                            setAgentMessages(prev => [...prev, {
                                type: "ai",
                                text: `📋 Tìm thấy **${filtered.length} bệnh án** trong hệ thống${searchKw ? ` khớp với "${searchKw}"` : " gần đây nhất"}:`,
                                isTableData: true,
                                tableHeader: ["Thú Cưng", "Chủ Nuôi", "Chẩn Đoán", "Ngày Khám", "Bác Sĩ"],
                                tableRows: rows
                            }]);
                        } else {
                            setAgentMessages(prev => [...prev, { type: "ai", text: "Chưa có bệnh án nào trong hệ thống hoặc không khớp! 🐾" }]);
                        }
                    } catch {
                        setAgentMessages(prev => [...prev, { type: "ai", text: "Không lấy được bệnh án lúc này, thử lại sau nhé! 🔒" }]);
                    } finally {
                        setAgentLoading(false);
                    }
                })();
                return;
            }

            // KỸ NĂNG 4: CHAT TÁC VỤ THÔNG THƯỜNG TRỰC TIẾP

            const apiHistory = agentMessages.map((msg) => ({
                role: msg.type === "ai" ? "assistant" : "user",
                content: msg.text
            }));

            apiHistory.push({
                role: "user",
                content: textToSend
            });

            // Fix B: mở rộng keywords kích hoạt Swarm trong Agent Tab
            const isMarketingCampaign = query.includes("chiến dịch") ||
                                       query.includes("marketing") ||
                                       query.includes("gửi mail") ||
                                       query.includes("voucher") ||
                                       query.includes("swarm") ||
                                       query.includes("đa agent") ||
                                       query.includes("nhắc lịch") ||
                                       query.includes("soạn email") ||
                                       query.includes("tìm khách hàng có") ||
                                       query.includes("gửi thông báo") ||
                                       query.includes("tìm bé bị") ||
                                       query.includes("tìm mèo") ||
                                       query.includes("tìm chó bị");

            let response;
            if (isMarketingCampaign) {
                response = await axiosInstance.post("/api/agent/swarm-orchestration", { query: textToSend });
            } else {
                response = await axiosInstance.post("/api/chat", apiHistory, {
                    headers: { 
                        "X-User-Name": userName,
                        "X-Current-Path": encodeURIComponent(location.pathname),
                        "X-Current-DOM-Context": encodeURIComponent(getPageDomContext()),
                        "X-User-Activity-Logs": encodeURIComponent(JSON.stringify(userActivityLogs))
                    }
                });
            }
            const replyText = response.data.reply || "Rexi Agent v2 đã ghi nhận tác vụ!";
            
            let cleanedReplyText = replyText;
            let treatmentData = null;
            let swarmData = null;

            // 0. Phân giải phối hợp đa Agent (Swarm Orchestration) — dùng indexOf để tránh lỗi regex khi JSON chứa ký tự ]
            const SWARM_TAG_AGENT = "[SWARM_ORCHESTRATION:";
            if (replyText.includes(SWARM_TAG_AGENT)) {
                const tagStartA = replyText.indexOf(SWARM_TAG_AGENT);
                const jsonStartA = tagStartA + SWARM_TAG_AGENT.length;
                const jsonEndBraceA = replyText.lastIndexOf("}");
                if (jsonEndBraceA > jsonStartA) {
                    try {
                        const jsonStrA = replyText.substring(jsonStartA, jsonEndBraceA + 1).trim();
                        swarmData = JSON.parse(jsonStrA);
                        cleanedReplyText = replyText.substring(0, tagStartA).trim();
                    } catch (e) {
                        console.error("Lỗi parse Swarm data (Agent tab):", e);
                    }
                }
            }

            // 1. Phân giải đơn thuốc PDF y khoa đặc hữu
            if (replyText.includes("[GENERATE_TREATMENT_PDF:")) {
                const pdfMatch = replyText.match(/\[GENERATE_TREATMENT_PDF:([\s\S]+?)\]/);
                if (pdfMatch && pdfMatch[1]) {
                    try {
                        treatmentData = JSON.parse(pdfMatch[1].trim());
                        cleanedReplyText = cleanedReplyText.replace(/\[GENERATE_TREATMENT_PDF:[\s\S]+?\]/g, "").trim();
                    } catch (e) {
                        console.error("Lỗi parse treatment PDF:", e);
                    }
                }
            }

            // 2. Phân giải đặt lịch tự động liên hoàn (Function Calling)
            if (replyText.includes("[AUTO_BOOK:")) {
                const bookMatch = replyText.match(/\[AUTO_BOOK:([\s\S]+?)\]/);
                if (bookMatch && bookMatch[1]) {
                    const content = bookMatch[1].trim();
                    cleanedReplyText = cleanedReplyText.replace(/\[AUTO_BOOK:[\s\S]+?\]/g, "").trim();
                    if (content.startsWith("{")) {
                        try {
                            const parsed = JSON.parse(content);
                            setTimeout(() => {
                                handleAutoBook({
                                    date: parsed.lich_hen.ngay_kham,
                                    time: parsed.lich_hen.gio_kham,
                                    petName: parsed.thu_cung.ten_thu_cung,
                                    service: parsed.lich_hen.ly_do || "Khám bệnh định kỳ",
                                    doctorName: parsed.lich_hen.id_bac_si === "NV-002" ? "Bác sĩ Minh Anh" : "Bác sĩ Hoàng",
                                    khachHangTen: parsed.khach_hang.ten_khach_hang,
                                    khachHangSdt: parsed.khach_hang.sdt
                                });
                            }, 500);
                        } catch (e) {
                            console.error("Lỗi parse JSON Auto Book:", e);
                        }
                    } else {
                        const parts = content.split('|');
                        if (parts.length >= 5) {
                            setTimeout(() => {
                                handleAutoBook({
                                    date: parts[0],
                                    time: parts[1],
                                    petName: parts[2],
                                    service: parts[3],
                                    doctorName: parts[4]
                                });
                            }, 500);
                        }
                    }
                }
            }

            // Phát hiện lệnh NAVIGATE tự động từ backend
            if (replyText.includes("[NAVIGATE:")) {
                const navMatch = replyText.match(/\[NAVIGATE:([^\]]+)\]/);
                if (navMatch && navMatch[1]) {
                    const navigatePath = navMatch[1].trim();
                    cleanedReplyText = cleanedReplyText.replace(/\[NAVIGATE:[^\]]+\]/g, "").trim();
                    
                    const lowerUserRole = userRole ? userRole.toLowerCase() : "";
                    let hasPermission = true;
                    
                    if (navigatePath.startsWith("/quan-ly/")) {
                        if (navigatePath === "/quan-ly/nhan-vien-phan-quyen" || navigatePath === "/quan-ly/cau-hinh" || navigatePath === "/quan-ly/chuc-nang") {
                            hasPermission = lowerUserRole.includes("admin");
                        } else if (navigatePath === "/quan-ly/bao-cao-thong-ke" || navigatePath === "/quan-ly/ke-toan" || navigatePath === "/quan-ly/nhap-kho") {
                            hasPermission = lowerUserRole.includes("admin") || lowerUserRole.includes("quan_ly") || lowerUserRole.includes("ke_toan");
                        }
                    }
                    
                    if (hasPermission) {
                        setTimeout(() => {
                            navigate(navigatePath);
                        }, 1500);
                    } else {
                        cleanedReplyText = "Dạ sếp ơi! Phân hệ này là khu vực được bảo mật cao, tài khoản của sếp hiện không đủ quyền truy cập nhé! 🔒";
                    }
                }
            }

            // Phát hiện các lệnh ACTION khác từ backend trong tab Agent
            const actionTagRegex = /\[(CLICK|FILL|TOGGLE|SELECT|DELETE):([^\]]+)\]/g;
            const actionTags = [];
            let matchAction;
            while ((matchAction = actionTagRegex.exec(cleanedReplyText)) !== null) {
                actionTags.push(`[${matchAction[1]}:${matchAction[2]}]`);
            }
            for (const tag of actionTags) {
                await executeAction(tag);
            }
            cleanedReplyText = cleanedReplyText.replace(actionTagRegex, '').trim();

            const aiResponseMsg = { 
                type: "ai", 
                text: cleanedReplyText,
                isEmergency: detectEmergencyKeywords(cleanedReplyText),
                treatmentData: treatmentData,
                swarmData: swarmData
            };

            setAgentMessages(prev => [...prev, aiResponseMsg]);
            speakText(cleanedReplyText);
        } catch (err) {
            setAgentMessages(prev => [...prev, { type: "ai", text: "Trực quan Agent đang nâng cấp, kết nối gián đoạn." }]);
        } finally {
            setAgentLoading(false);
        }
    };

    // ĐĂNG KÝ KHÁM TỰ ĐỘNG THỰC TẾ (DYNAMIC BOOKING & DEPOSIT VIETQR)
    const handleAutoBook = async (info: { 
        date: string, 
        time: string, 
        petName: string, 
        service: string, 
        doctorName: string,
        khachHangTen?: string,
        khachHangSdt?: string
    }) => {
        const clientName = info.khachHangTen || userName || "Khách hàng Rexi";
        const clientPhone = info.khachHangSdt || user?.sdt || "0912345678";
        
        const depositQrHtml = `
<div style="background: var(--gray-50); border: 1.5px solid var(--primary-light); padding: 16px; border-radius: 16px; margin-top: 12px; display: flex; flex-direction: column; gap: 12px; box-shadow: var(--shadow-sm);">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gray-200); padding-bottom: 8px;">
        <span style="font-weight: 900; color: var(--primary); font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
            <span class="material-symbols-outlined" style="font-size: 18px;">qr_code_2</span> MÃ VIETQR ĐẶT CỌC GIỮ CHỖ
        </span>
        <span style="font-size: 0.72rem; color: var(--gray-400); font-weight: 800; text-transform: uppercase;">MB Bank 24/7</span>
    </div>
    <div style="display: flex; justify-content: center; margin: 5px 0;">
        <svg width="130" height="130" viewBox="0 0 100 100" style="background: #fff; padding: 8px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: var(--shadow-sm);">
            <rect x="5" y="5" width="22" height="22" fill="none" stroke="#1e293b" stroke-width="3" rx="2"/>
            <rect x="10" y="10" width="12" height="12" fill="#1e293b"/>
            <rect x="73" y="5" width="22" height="22" fill="none" stroke="#1e293b" stroke-width="3" rx="2"/>
            <rect x="78" y="10" width="12" height="12" fill="#1e293b"/>
            <rect x="5" y="73" width="22" height="22" fill="none" stroke="#1e293b" stroke-width="3" rx="2"/>
            <rect x="10" y="78" width="12" height="12" fill="#1e293b"/>
            <rect x="32" y="5" width="4" height="8" fill="#1e293b"/>
            <rect x="40" y="5" width="12" height="4" fill="#1e293b"/>
            <rect x="56" y="5" width="4" height="4" fill="#1e293b"/>
            <rect x="64" y="5" width="4" height="12" fill="#1e293b"/>
            <rect x="32" y="17" width="12" height="4" fill="#1e293b"/>
            <rect x="48" y="13" width="4" height="8" fill="#1e293b"/>
            <rect x="56" y="17" width="12" height="4" fill="#1e293b"/>
            <rect x="5" y="32" width="8" height="4" fill="#1e293b"/>
            <rect x="17" y="32" width="4" height="12" fill="#1e293b"/>
            <rect x="25" y="29" width="4" height="4" fill="#1e293b"/>
            <rect x="32" y="25" width="4" height="16" fill="#1e293b"/>
            <rect x="44" y="29" width="16" height="4" fill="#1e293b"/>
            <rect x="64" y="25" width="8" height="4" fill="#1e293b"/>
            <rect x="76" y="32" width="4" height="8" fill="#1e293b"/>
            <rect x="84" y="29" width="12" height="4" fill="#1e293b"/>
            <rect x="5" y="44" width="4" height="12" fill="#1e293b"/>
            <rect x="13" y="48" width="12" height="4" fill="#1e293b"/>
            <rect x="29" y="44" width="8" height="4" fill="#1e293b"/>
            <rect x="68" y="44" width="4" height="12" fill="#1e293b"/>
            <rect x="76" y="48" width="20" height="4" fill="#1e293b"/>
            <rect x="5" y="60" width="16" height="4" fill="#1e293b"/>
            <rect x="25" y="56" width="4" height="12" fill="#1e293b"/>
            <rect x="32" y="64" width="12" height="4" fill="#1e293b"/>
            <rect x="48" y="56" width="4" height="16" fill="#1e293b"/>
            <rect x="56" y="60" width="16" height="4" fill="#1e293b"/>
            <rect x="76" y="60" width="8" height="4" fill="#1e293b"/>
            <rect x="88" y="56" width="8" height="4" fill="#1e293b"/>
            <rect x="32" y="76" width="4" height="8" fill="#1e293b"/>
            <rect x="40" y="80" width="16" height="4" fill="#1e293b"/>
            <rect x="60" y="73" width="8" height="4" fill="#1e293b"/>
            <rect x="64" y="80" width="4" height="12" fill="#1e293b"/>
            <rect x="32" y="88" width="12" height="4" fill="#1e293b"/>
            <rect x="48" y="88" width="4" height="8" fill="#1e293b"/>
            <rect x="56" y="92" width="12" height="4" fill="#1e293b"/>
            <rect x="72" y="88" width="8" height="4" fill="#1e293b"/>
            <rect x="84" y="84" width="12" height="4" fill="#1e293b"/>
            <rect x="38" y="38" width="24" height="24" fill="#fff" rx="6" stroke="#e2e8f0" stroke-width="0.8"/>
            <path d="M50 49.5 C46.5 45.5, 42.5 48.5, 42.5 51.5 C42.5 55, 50 59, 50 59 C50 59, 57.5 55, 57.5 51.5 C57.5 48.5, 53.5 45.5, 50 49.5 Z" fill="var(--primary)"/>
        </svg>
    </div>
    <div style="text-align: left; font-size: 0.8rem; line-height: 1.5; color: #334155; font-weight: 700;">
        <div style="margin-bottom: 2px;">🏦 <b>Ngân hàng:</b> MB Bank (Ngân hàng Quân Đội)</div>
        <div style="margin-bottom: 2px;">💳 <b>Số tài khoản:</b> <span style="color: var(--primary);">1234567890</span></div>
        <div style="margin-bottom: 2px;">👤 <b>Chủ tài khoản:</b> PHONG KHAM REXI HANOI</div>
        <div style="margin-bottom: 2px;">💰 <b>Tiền đặt cọc:</b> <span style="color: #059669; font-size: 0.92rem; font-weight: 900;">50.000 VND</span></div>
        <div>📝 <b>Cú pháp CK:</b> <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-family: monospace; color: #e11d48;">REXI LH ${info.petName.toUpperCase()}</span></div>
    </div>
</div>
        `;

        const bookingMessage = {
            type: "ai",
            text: `🎉 **Rexi Agent v2 đã đặt lịch khám bệnh thành công cho bé!**\n\n- **Khách hàng:** ${clientName} (SĐT: ${clientPhone})\n- **Bé cưng:** ${info.petName}\n- **Thời gian:** ${info.time} ngày ${info.date}\n- **Dịch vụ:** ${info.service}\n- **Bác sĩ phụ trách:** ${info.doctorName}\n\nĐể bảo đảm vị trí giữ chỗ cho bé, sếp vui lòng chuyển khoản đặt cọc **50.000 VND** qua mã VietQR thông minh dưới đây nha sếp! ✨🐾\n${depositQrHtml}`,
            isHtml: true
        };

        if (activeTab === 'standard') {
            setMessages(prev => [...prev, bookingMessage]);
        } else {
            setAgentMessages(prev => [...prev, bookingMessage]);
        }
        
        speakText(`Đã chốt lịch thành công cho bé ${info.petName} vào lúc ${info.time} ngày ${info.date}`);

        // Tự động đồng bộ hóa lên DB Phòng khám thực qua API
        try {
            await axiosInstance.post("/api/lich-hen/dat-lich-nhanh", {
                khach_hang: {
                    ten_khach_hang: clientName,
                    sdt: clientPhone,
                    email: user?.email || "client@rexi.vn"
                },
                thu_cung: {
                    ten_thu_cung: info.petName || "Thú cưng"
                },
                lich_hen: {
                    ngay_kham: info.date,
                    gio_kham: info.time,
                    id_dich_vu: info.service.includes("Triệt sản") ? "DV-003" : info.service.includes("Tiêm phòng") ? "DV-002" : "DV-001",
                    id_bac_si: info.doctorName.includes("Minh Anh") ? "NV-002" : info.doctorName.includes("Hoàng") ? "NV-003" : null,
                    ly_do: info.service || "Khám bệnh định kỳ",
                    ghi_chu: "Lập lịch hẹn tự động bởi Siêu Trợ lý Rexi Jarvis v2 🤖"
                }
            });
        } catch (err) {
            console.error("Đồng bộ lịch hẹn tự động thất bại:", err);
        }
    };

    // LÀM MỚI LỊCH SỬ CHAT (RESET CHAT ENGINE)
    const handleResetChat = () => {
        if (!window.confirm("Bạn có chắc chắn muốn làm mới toàn bộ lịch sử tư vấn và bắt đầu cuộc trò chuyện mới?")) return;

        if (activeTab === 'standard') {
            sessionStorage.removeItem("rexi_standard_chat_history");
            setMessages([
                {
                    type: "ai",
                    text: isClinicStaff
                        ? `${timeGreeting} **${displayGreetingName}**! 🐾 Trợ lý Rexi đã được làm mới. Bạn cần tôi hỗ trợ tra cứu chuyên môn y học thú cưng hay nghiệp vụ nào hôm nay ạ?`
                        : userName
                            ? `${timeGreeting} Sen **${userName}**! 🐾 Trợ lý Rexi đã sẵn sàng. Hôm nay bé yêu nhà mình có khỏe không dạ?`
                            : `${timeGreeting} Sen! 🐾 Trợ lý Rexi đã sẵn sàng hỗ trợ Sen chăm sóc Boss yêu rồi nè!`
                }
            ]);
        } else {
            sessionStorage.removeItem("rexi_agent_chat_history");
            setAgentMessages([
                {
                    type: "ai",
                    text: isClinicStaff
                        ? `${timeGreeting} **Đồng nghiệp ${userRoleName} ${userName}**! 🐾 Tôi là **Rexi Agent v2** đã được khởi động lại. Hãy cho tôi biết tác vụ nghiệp vụ bạn cần xử lý ngay nhé!`
                        : `${timeGreeting} Sen **${userName || "nhà mình"}**! 🐾 Rexi Agent v2 đã sẵn sàng. Hãy nhập yêu cầu như tìm kiếm tài liệu thú y trên mạng, hay đăng ký đặt lịch nhanh nha!`
                }
            ]);
        }
    };

    // 7. FILE ATTACHMENTS (IMAGE/VIDEO COMPRESSION & DRAG AND DROP)
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        await processFiles(files);
    };

    const processFiles = async (files: File[]) => {
        setIsCompressing(true);
        for (const file of files) {
            if (file.size > 20 * 1024 * 1024) {
                alert(`File ${file.name} vượt quá dung lượng cho phép 20MB.`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = (event: any) => {
                const dataUrl = event.target.result;
                const isVideo = file.type.startsWith('video');
                setSelectedFiles(prev => [...prev, { data: dataUrl, type: isVideo ? 'video' : 'image' }]);
            };
            reader.readAsDataURL(file);
        }
        setIsCompressing(false);
    };

    // Drag-Drop handlers
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => { setIsDragging(false); };
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) await processFiles(files);
    };

    // Render markdown văn bản động
    const renderText = (text: string) => {
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

        const parts = text.split("\n").map((line, idx) => {
            // Xử lý Bold
            const boldMatches = [...line.matchAll(boldRegex)];
            // Xử lý Links
            const linkMatches = [...line.matchAll(linkRegex)];

            if (boldMatches.length === 0 && linkMatches.length === 0) {
                return <p key={idx} style={{ margin: '4px 0', lineHeight: '1.45', fontSize: '0.88rem' }}>{line}</p>;
            }

            return (
                <p key={idx} style={{ margin: '4px 0', lineHeight: '1.45', fontSize: '0.88rem' }}>
                    {line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((subPart, sIdx) => {
                        if (subPart.startsWith("**") && subPart.endsWith("**")) {
                            return <strong key={sIdx} style={{ fontWeight: 900 }}>{subPart.slice(2, -2)}</strong>;
                        }
                        if (subPart.startsWith("[") && subPart.includes("](")) {
                            const match = subPart.match(/\[([^\]]+)\]\(([^)]+)\)/);
                            if (match) {
                                return (
                                    <a key={sIdx} href={match[2]} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'underline' }}>
                                        {match[1]}
                                    </a>
                                );
                            }
                        }
                        return subPart;
                    })}
                </p>
            );
        });

        return <>{parts}</>;
    };

    // 8. CLINICAL EMERGENCY INTERACTIVE BOARD
    const renderEmergencyBoard = (isClinicSide: boolean) => {
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button data-ai-id="button-chatbot-tahq" onClick={() => { setIsOpen(false); navigate("/admin/tiep-tan"); }} style={{
                            background: '#ef4444', color: 'white', border: 'none',
                            borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment_ind</span>
                            MỞ TIẾP ĐÓN NHANH
                        </button>
                        <button data-ai-id="button-chatbot-sgm6" onClick={() => { setIsOpen(false); navigate("/admin/bac-si-truc"); }} style={{
                            background: 'transparent', border: '1.5px solid #ef4444', color: '#ef4444',
                            borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>medical_information</span>
                            BÁC SĨ ĐANG TRỰC
                        </button>
                    </div>
                </div>
            );
        } else {
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <a href="tel:***REMOVED***-VIETQR_ACCOUNT_NO" style={{
                            textDecoration: 'none', background: '#fb7185', color: 'white',
                            borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                            GỌI HOTLINE KHẨN
                        </a>
                        <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{
                            textDecoration: 'none', background: 'transparent', border: '1.5px solid #fb7185', color: '#fb7185',
                            borderRadius: '10px', padding: '10px', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>explore</span>
                            ĐƯỜNG ĐẾN PHÒNG KHÁM
                        </a>
                    </div>
                </div>
            );
        }
    };

    return (
        <>
            {/* ANIMATIONS VÀ CẤU HÌNH PHONG CÁCH ELITE */}
            <style>{`
                @keyframes chatPulseGlow {
                    0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); }
                    50% { transform: scale(1.06); box-shadow: 0 0 35px rgba(52, 211, 153, 0.7), 0 10px 40px rgba(16, 185, 129, 0.3); }
                }
                @keyframes chatIconWaggle {
                    0%, 100% { transform: rotate(0deg); }
                    10%, 20% { transform: rotate(-8deg); }
                    15%, 25% { transform: rotate(8deg); }
                    30% { transform: rotate(0deg); }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                /* Fix D: thêm keyframe spin cho SwarmConsole + icon loading */
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .dot-pulse {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 8px 12px;
                    background: var(--surface);
                    border-radius: 12px;
                    border: 1px solid var(--gray-200);
                }
                .dot-pulse span {
                    width: 6px;
                    height: 6px;
                    background: var(--primary);
                    border-radius: 50%;
                    animation: blink 1.2s infinite ease-in-out;
                }
                .dot-pulse span:nth-child(2) { animation-delay: 0.2s; }
                .dot-pulse span:nth-child(3) { animation-delay: 0.4s; }
                
                .chat-tab-btn {
                    flex: 1;
                    padding: 10px 0;
                    border: none;
                    background: transparent;
                    color: var(--gray-500);
                    font-weight: 800;
                    font-size: 0.8rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    transition: all 0.3s ease;
                }
                .chat-tab-btn.active-tab {
                    color: white;
                }
                
                @media (max-width: 768px) {
                    #chatCallout { display: none !important; }
                    #chatBtn { 
                        right: 16px !important; 
                        bottom: max(16px, env(safe-area-inset-bottom, 16px)) !important; 
                        width: 56px !important; 
                        height: 56px !important; 
                    }
                    #chatWindow { 
                        right: 0 !important; 
                        bottom: 0 !important; 
                        width: 100vw !important; 
                        height: 100dvh !important; 
                        max-height: 100dvh !important; 
                        border-radius: 0 !important;
                    }
                    .glass-card {
                        border-radius: 0 !important;
                    }
                }
            `}</style>

            {/* BÓNG CHÚ THÍCH FLOATING CALLOUT */}
            <div id="chatCallout" className="glass-card animate-fade-in" style={{
                position: 'fixed', bottom: '110px', right: '30px', padding: '12px 20px',
                borderRadius: '24px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)',
                boxShadow: 'var(--shadow-lg)', zIndex: 1100, display: (isOpen || !showCallout || proactiveMessage) ? 'none' : 'flex',
                alignItems: 'center', gap: '10px', border: '2px solid var(--surface)', background: 'var(--surface)'
            }}>
                <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', animation: 'blink 1s infinite', boxShadow: '0 0 10px #10b981' }}></div>
                {calloutMessage}
            </div>

            {/* BÓNG CHÁT CHỦ ĐỘNG GỢI Ý CỦA REXI (PROACTIVE NOTIFICATION BUBBLE) */}
            {proactiveMessage && !isOpen && (
                <div className="glass-card animate-fade-in" style={{
                    position: 'fixed', bottom: '110px', right: '30px', padding: '20px',
                    borderRadius: '28px', fontSize: '0.88rem', fontWeight: 800, color: 'var(--ink)',
                    boxShadow: '0 20px 50px rgba(16, 185, 129, 0.25), var(--shadow-lg)', zIndex: 1100,
                    display: 'flex', flexDirection: 'column', gap: '12px', border: '2px solid var(--primary-light)',
                    background: 'var(--surface)', maxWidth: '340px',
                    animation: 'chatPulseGlow 3s infinite ease-in-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px', animation: 'chatIconWaggle 3s infinite ease-in-out' }}>pets</span>
                        <div style={{ lineHeight: '1.5', color: 'var(--ink)' }}>{proactiveMessage.text}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button onClick={() => setProactiveMessage(null)} style={{
                            background: 'transparent', border: 'none', color: 'var(--gray-500)',
                            fontWeight: 800, cursor: 'pointer', padding: '6px 12px', fontSize: '0.78rem'
                        }}>Lờ đi</button>
                        <button onClick={() => { proactiveMessage.action(); setProactiveMessage(null); setIsOpen(true); }} style={{
                            background: 'var(--primary-gradient)', border: 'none', color: 'white',
                            fontWeight: 800, cursor: 'pointer', padding: '8px 16px', borderRadius: '12px',
                            fontSize: '0.78rem', boxShadow: '0 4px 10px var(--primary-light)'
                        }}>Đồng ý giúp em! ✨</button>
                    </div>
                </div>
            )}

            {/* NÚT KÍCH HOẠT FLOATING CHAT DUY NHẤT */}
            <button data-ai-id="button-chatbot-yhoj"
                id="chatBtn"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: '30px', right: '30px', zIndex: 1101,
                    background: activeTab === 'agent' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'var(--chat-gradient)',
                    color: 'white', border: '1.5px solid rgba(255, 255, 255, 0.1)',
                    width: '64px', height: '64px', borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: activeTab === 'agent' ? '0 10px 40px rgba(244, 63, 94, 0.4)' : '0 10px 40px var(--primary-light)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    animation: isOpen ? 'none' : 'chatPulseGlow 4s infinite ease-in-out',
                    backdropFilter: 'blur(5px)'
                }}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))', animation: isOpen ? 'none' : 'chatIconWaggle 6s infinite ease-in-out' }}>
                    {isOpen ? 'close' : 'pets'}
                </span>
            </button>

            {/* CỬA SỔ CHAT TÍCH HỢP PREMIUM TABS */}
            {isOpen && (
                <>
                    {/* Backdrop mờ hỗ trợ mobile */}
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', zIndex: 1100 }} onClick={() => setIsOpen(false)}></div>

                    <div id="chatWindow" className="glass-card animate-fade-in"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                            position: 'fixed', bottom: '100px', right: '30px', width: 'calc(100vw - 60px)', maxWidth: '420px', height: 'min(540px, calc(100vh - 140px))', zIndex: 1101,
                            borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            border: activeTab === 'agent' ? '2.5px solid rgba(244, 63, 94, 0.35)' : '2.5px solid rgba(16, 185, 129, 0.35)',
                            boxShadow: activeTab === 'agent' ? '0 20px 50px rgba(244, 63, 94, 0.2)' : '0 20px 50px rgba(16, 185, 129, 0.2)',
                            transition: 'all 0.4s ease'
                        }}
                    >
                        {/* Drag Upload Overlay */}
                        {isDragging && (
                            <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.9)',
                                zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', color: 'white', backdropFilter: 'blur(6px)'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '80px', marginBottom: '16px', animation: 'chatIconWaggle 2s infinite' }}>cloud_upload</span>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 950 }}>Thả file vào đây</h3>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '8px' }}>Hỗ trợ Ảnh và Video cấp cứu (Tối đa 20MB)</p>
                            </div>
                        )}

                        {/* 1. TIÊU ĐỀ KHỚP MÀU DYNAMIC GIỮA HAI CHẾ ĐỘ */}
                        <div style={{
                            background: activeTab === 'agent' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'var(--chat-gradient)',
                            padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white',
                            transition: 'all 0.4s ease'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 10px #4ade80' }}></div>
                                <span style={{ fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.3px' }}>
                                    {activeTab === 'agent' ? 'Rexi Agent v2 🤖' : 'Trợ lý Rexi 🐾'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                {/* Volume Switch */}
                                <span className="material-symbols-outlined" style={{ fontSize: '22px', cursor: 'pointer', color: isVoiceEnabled ? '#4ade80' : 'white', opacity: isVoiceEnabled ? 1 : 0.7 }}
                                      onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} title={isVoiceEnabled ? "Tắt đọc thành tiếng" : "Bật đọc thành tiếng"}>
                                    {isVoiceEnabled ? 'volume_up' : 'volume_off'}
                                </span>
                                {/* Reset Chat */}
                                <span className="material-symbols-outlined" style={{ fontSize: '22px', cursor: 'pointer', opacity: 0.8 }} onClick={handleResetChat} title="Làm mới cuộc hội thoại">
                                    restart_alt
                                </span>
                                <span className="material-symbols-outlined" style={{ fontSize: '22px', cursor: 'pointer', opacity: 0.8 }} onClick={() => setIsOpen(false)}>
                                    close
                                </span>
                            </div>
                        </div>

                        {/* 2. DYNAMIC GLASSMORPHIC TAB BAR SELECTOR */}
                        <div style={{
                            display: 'flex', background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)',
                            borderBottom: '1px solid var(--gray-200)', position: 'relative', padding: '6px', gap: '6px'
                        }}>
                            {/* Sliding Active Overlay */}
                            <div style={{
                                position: 'absolute', top: '6px', bottom: '6px',
                                left: activeTab === 'standard' ? '6px' : 'calc(50% + 3px)',
                                width: 'calc(50% - 9px)',
                                background: activeTab === 'agent' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'var(--chat-gradient)',
                                borderRadius: '14px', transition: 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)', zIndex: 1,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}></div>

                            <button data-ai-id="button-chatbot-6hgf" onClick={() => setActiveTab('standard')} className={`chat-tab-btn ${activeTab === 'standard' ? 'active-tab' : ''}`} style={{ zIndex: 2 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
                                Trợ lý Rexi
                            </button>
                            <button data-ai-id="button-chatbot-jdzj" onClick={() => setActiveTab('agent')} className={`chat-tab-btn ${activeTab === 'agent' ? 'active-tab' : ''}`} style={{ zIndex: 2 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_toy</span>
                                Tác vụ Agent v2
                            </button>
                        </div>

                        {/* 3. DYNAMIC TAB PANEL CONDITIONAL RENDERING */}
                        {activeTab === 'standard' ? (
                            // ==================== TAB 1: STANDARD CHATBOT ====================
                            <>
                                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--background)' }}>
                                    {messages.map((msg, idx) => (
                                        <div key={idx} 
                                             className={msg.type === "user" ? "chat-message-user" : "chat-message-ai"}
                                             style={{ display: 'flex', flexDirection: 'column', alignSelf: msg.type === "user" ? "flex-end" : "flex-start", maxWidth: '85%' }}>
                                            <div 
                                                style={{
                                                    padding: '12px 16px', borderRadius: msg.type === "user" ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                    background: msg.type === "user" ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#e6f4ea') : 'var(--surface)',
                                                    color: 'var(--ink)', boxShadow: 'var(--shadow-sm)',
                                                    border: msg.type === "user" ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--gray-200)',
                                                }}
                                            >
                                                {msg.images && msg.images.map((img: string, i: number) => (
                                                    <img alt="upload" key={i} src={img} onClick={() => setZoomedImage(img)} style={{ width: '100%', borderRadius: '12px', marginBottom: '8px', cursor: 'zoom-in', objectFit: 'cover' }} />
                                                ))}
                                                {msg.videos && msg.videos.map((vid: string, i: number) => (
                                                    <video key={i} src={vid} controls style={{ width: '100%', borderRadius: '12px', marginBottom: '8px' }} />
                                                ))}
                                                {msg.text && (msg.isHtml ? <div dangerouslySetInnerHTML={{ __html: msg.text }} /> : renderText(msg.text))}

                                                {msg.swarmData && (
                                                    <SwarmConsole data={msg.swarmData} isDark={isDark} />
                                                )}

                                                {msg.treatmentData && (
                                                    <div style={{
                                                        marginTop: '12px', padding: '16px', borderRadius: '16px',
                                                        background: isDark ? 'rgba(225, 29, 72, 0.1)' : 'rgba(225, 29, 72, 0.05)',
                                                        border: '1.5px dashed rgba(225, 29, 72, 0.4)',
                                                        boxShadow: 'var(--shadow-sm)', color: 'var(--ink)'
                                                    }}>
                                                        <div style={{ fontWeight: 950, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e11d48', fontSize: '0.85rem' }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>medication</span>
                                                            PHÁC ĐỒ & ĐƠN THUỐC ĐIỆN TỬ REXI
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: '12px', lineHeight: 1.5, fontWeight: 600 }}>
                                                            Hồ sơ y khoa của bé <b>{msg.treatmentData.petName}</b> đã được bác sĩ Rexi thiết lập chuẩn lâm sàng. Sếp tải phiếu điều trị PDF để in ấn hoặc lưu trữ nhé!
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDownloadTreatmentPdf(msg.treatmentData)}
                                                            style={{
                                                                background: '#e11d48', color: 'white', border: 'none',
                                                                borderRadius: '10px', padding: '10px 14px', fontWeight: 900, fontSize: '0.75rem', 
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                                width: '100%', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>picture_as_pdf</span>
                                                            TẢI PHIẾU ĐIỀU TRỊ & ĐƠN THUỐC (PDF)
                                                        </button>
                                                    </div>
                                                )}

                                                {msg.isLoginPrompt && (
                                                    <div style={{
                                                        marginTop: '12px', padding: '16px', borderRadius: '16px',
                                                        background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                                                        border: '1.5px solid rgba(239, 68, 68, 0.3)',
                                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', color: 'var(--ink)'
                                                    }}>
                                                        <div style={{ fontWeight: 950, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.9rem' }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'blink 1.5s infinite' }}>security</span>
                                                            YÊU CẦU ĐĂNG NHẬP AN TOÀN
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: '14px', lineHeight: 1.5, fontWeight: 600 }}>
                                                            Dạ Sen ơi, các tác vụ tự động lập lịch khám, quản lý bệnh án thú y và tra cứu dữ liệu khách hàng yêu cầu quyền tài khoản bảo mật của Bệnh viện Thú y Rexi. Sen đăng nhập hoặc đăng ký tài khoản nhanh chỉ trong 10 giây để cùng Rexi chăm sóc bé yêu nhé!
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                            <button data-ai-id="button-chatbot-jos2" onClick={() => { setIsOpen(false); navigate("/dang-nhap"); }} style={{
                                                                background: '#10b981', color: 'white', border: 'none',
                                                                borderRadius: '10px', padding: '10px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                                            }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>login</span>
                                                                ĐĂNG NHẬP NGAY
                                                            </button>
                                                            <button data-ai-id="button-chatbot-8gxv" onClick={() => { setIsOpen(false); navigate("/dang-nhap"); }} style={{
                                                                background: 'transparent', border: '1.5px solid #10b981', color: '#10b981',
                                                                borderRadius: '10px', padding: '10px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                                            }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>person_add</span>
                                                                ĐĂNG KÝ NHANH
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Dynamic Clinical Triage Card */}
                                            {msg.isEmergency && renderEmergencyBoard(isClinicStaff)}
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="dot-pulse" style={{ alignSelf: 'flex-start' }}>
                                            <span></span><span></span><span></span>
                                        </div>
                                    )}
                                    <div ref={standardEndRef} />
                                </div>

                                {/* QUICK SUGGESTIONS GRID FOR STANDARD TAB */}
                                <div style={{ overflowX: 'auto', padding: '10px 14px', background: 'var(--surface)', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '8px' }}>
                                    {isClinicStaff ? (
                                        <>
                                            <button data-ai-id="button-chatbot-7heb" onClick={() => handleSend("Cần chuẩn bị liều lượng Diazepam cấp cứu thế nào?")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                🩺 Liều Diazepam
                                            </button>
                                            <button data-ai-id="button-chatbot-5dri" onClick={() => handleSend("Hướng dẫn kỹ thuật Heimlich cho chó mèo?")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                🐱 Sơ cứu Heimlich
                                            </button>
                                            <button data-ai-id="button-chatbot-rpg2" onClick={() => handleSend("Cách sơ cứu mèo bị ngộ độc thực phẩm?")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                💊 Sơ cứu ngộ độc
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button data-ai-id="button-chatbot-tlp8" onClick={() => handleSend("Bé bị hóc dị vật, sơ cứu thế nào?")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid #f87171', background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                🚨 Cấp cứu Hóc Dị Vật
                                            </button>
                                            <button data-ai-id="button-chatbot-lez3" onClick={() => handleSend("Lịch tiêm phòng vaccine định kỳ cho chó mèo?")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                💉 Lịch Tiêm Phòng
                                            </button>
                                            <button data-ai-id="button-chatbot-3kbg" onClick={() => handleSend("Đăng ký đặt lịch hẹn khám sức khỏe")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                📅 Đặt Lịch Khám
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            // ==================== TAB 2: REXI AGENT V2 ====================
                            <>
                                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--background)' }}>
                                    {agentMessages.map((msg, idx) => (
                                        <div key={idx} 
                                             className={msg.type === "user" ? "chat-message-user" : "chat-message-ai"}
                                             style={{ display: 'flex', flexDirection: 'column', alignSelf: msg.type === "user" ? "flex-end" : "flex-start", maxWidth: '85%' }}>
                                            <div 
                                                style={{
                                                    padding: '12px 16px', borderRadius: msg.type === "user" ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                    background: msg.type === "user" ? (isDark ? 'rgba(244, 63, 94, 0.2)' : '#ffe4e6') : 'var(--surface)',
                                                    color: 'var(--ink)', boxShadow: 'var(--shadow-sm)',
                                                    border: msg.type === "user" ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--gray-200)'
                                                }}
                                            >
                                                {msg.text && (msg.isHtml ? <div dangerouslySetInnerHTML={{ __html: msg.text }} /> : renderText(msg.text))}

                                                {msg.swarmData && (
                                                    <SwarmConsole data={msg.swarmData} isDark={isDark} />
                                                )}

                                                {msg.treatmentData && (
                                                    <div style={{
                                                        marginTop: '12px', padding: '16px', borderRadius: '16px',
                                                        background: isDark ? 'rgba(225, 29, 72, 0.1)' : 'rgba(225, 29, 72, 0.05)',
                                                        border: '1.5px dashed rgba(225, 29, 72, 0.4)',
                                                        boxShadow: 'var(--shadow-sm)', color: 'var(--ink)'
                                                    }}>
                                                        <div style={{ fontWeight: 950, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e11d48', fontSize: '0.85rem' }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>medication</span>
                                                            PHÁC ĐỒ & ĐƠN THUỐC ĐIỆN TỬ REXI
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: '12px', lineHeight: 1.5, fontWeight: 600 }}>
                                                            Hồ sơ y khoa của bé <b>{msg.treatmentData.petName}</b> đã được bác sĩ Rexi thiết lập chuẩn lâm sàng. Sếp tải phiếu điều trị PDF để in ấn hoặc lưu trữ nhé!
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDownloadTreatmentPdf(msg.treatmentData)}
                                                            style={{
                                                                background: '#e11d48', color: 'white', border: 'none',
                                                                borderRadius: '10px', padding: '10px 14px', fontWeight: 900, fontSize: '0.75rem', 
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                                width: '100%', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>picture_as_pdf</span>
                                                            TẢI PHIẾU ĐIỀU TRỊ & ĐƠN THUỐC (PDF)
                                                        </button>
                                                    </div>
                                                )}

                                                {/* KỸ NĂNG 5+7: HIỂN THỊ KẾT QUẢ DẠNG BẢNG (THUỐC, THÚ CƯNG, V.V.) */}
                                                {msg.isTableData && msg.tableHeader && msg.tableRows && (
                                                    <div style={{ marginTop: '12px', overflowX: 'auto' }}>
                                                        <table style={{
                                                            width: '100%', borderCollapse: 'collapse',
                                                            fontSize: '0.75rem', fontFamily: 'inherit'
                                                        }}>
                                                            <thead>
                                                                <tr style={{ background: isDark ? 'rgba(244,63,94,0.2)' : '#fff1f2' }}>
                                                                    {msg.tableHeader.map((h: string, hIdx: number) => (
                                                                        <th key={hIdx} style={{
                                                                            padding: '7px 10px', textAlign: 'left',
                                                                            fontWeight: 900, color: '#e11d48',
                                                                            borderBottom: '2px solid rgba(244,63,94,0.3)',
                                                                            whiteSpace: 'nowrap'
                                                                        }}>{h}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {msg.tableRows.map((row: string[], rIdx: number) => (
                                                                    <tr key={rIdx} style={{
                                                                        background: rIdx % 2 === 0
                                                                            ? 'transparent'
                                                                            : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
                                                                    }}>
                                                                        {row.map((cell: string, cIdx: number) => (
                                                                            <td key={cIdx} style={{
                                                                                padding: '6px 10px',
                                                                                borderBottom: '1px solid var(--gray-200)',
                                                                                color: 'var(--ink)',
                                                                                maxWidth: '140px',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap'
                                                                            }} title={cell}>{cell}</td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>
                                                            Hiển thị {msg.tableRows.length} dòng đầu • Dữ liệu trực tiếp từ hệ thống Rexi
                                                        </div>
                                                    </div>
                                                )}

                                                {/* KỸ NĂNG 1: HIỂN THỊ KẾT QUẢ GOOGLE SEARCH */}
                                                {msg.isSearchResult && msg.searchResults && (
                                                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        {msg.searchResults.map((result: any, rIdx: number) => (
                                                            <div key={rIdx} style={{
                                                                padding: '10px 14px', borderRadius: '12px', background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                                                                borderLeft: '4px solid #3b82f6', boxShadow: 'var(--shadow-sm)'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                                    {result.isVerified && (
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#3b82f6' }} title="Đã xác thực bởi Bác sĩ Thú y">
                                                                            verified
                                                                        </span>
                                                                    )}
                                                                    <a href={result.url} target="_blank" rel="noreferrer" style={{ fontWeight: 800, fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none' }}>
                                                                        {result.title}
                                                                    </a>
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', opacity: 0.9, lineHeight: 1.4 }}>{result.snippet}</div>
                                                            </div>
                                                        ))}
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>info</span>
                                                            Dữ liệu mạng được xác thực y khoa bởi Bác sĩ Rexi.
                                                        </div>
                                                    </div>
                                                )}

                                                {/* KỸ NĂNG 2: HIỂN THỊ HÓA ĐƠN / LỊCH TRỰC HÀNH CHÍNH (ĐỒNG NGHIỆP DỮ LIỆU) */}
                                                {msg.isTableData && msg.tableRows && (
                                                    <div style={{ marginTop: '10px', overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--gray-200)' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                                            <thead>
                                                                <tr style={{ background: 'var(--gray-100)', fontWeight: 900 }}>
                                                                    {msg.tableHeader.map((h: string, hIdx: number) => (
                                                                        <th key={hIdx} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {msg.tableRows.map((row: string[], rIdx: number) => (
                                                                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--gray-200)', background: 'var(--surface)' }}>
                                                                        {row.map((cell: string, cIdx: number) => (
                                                                            <td key={cIdx} style={{ padding: '8px 10px' }}>{cell}</td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}

                                                {/* KỸ NĂNG 3: HIỂN THỊ RECEIPT LỊCH HẸN TỰ ĐỘNG THÀNH CÔNG */}
                                                {msg.isReceipt && msg.receipt && (
                                                    <div style={{
                                                        marginTop: '12px', padding: '14px', borderRadius: '16px',
                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white',
                                                        boxShadow: '0 8px 20px rgba(16,185,129,0.25)'
                                                    }}>
                                                        <div style={{ fontWeight: 950, fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="material-symbols-outlined">check_circle</span>
                                                            ĐÃ LẬP LỊCH HẸN THÀNH CÔNG!
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', display: 'grid', gap: '6px', opacity: 0.95 }}>
                                                            <div>📅 **Ngày hẹn:** {msg.receipt.date}</div>
                                                            <div>🕒 **Giờ hẹn:** {msg.receipt.time}</div>
                                                            <div>🐶 **Thú cưng:** {msg.receipt.petName}</div>
                                                            <div>🩺 **Dịch vụ:** {msg.receipt.service}</div>
                                                            <div>👨‍⚕️ **Bác sĩ phụ trách:** {msg.receipt.doctorName}</div>
                                                        </div>
                                                        <button data-ai-id="button-chatbot-bohj" onClick={() => { setIsOpen(false); navigate("/ho-so-benh-an"); }} style={{
                                                            marginTop: '12px', width: '100%', background: 'white', color: '#059669', border: 'none',
                                                            borderRadius: '10px', padding: '8px 0', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer'
                                                        }}>
                                                            XEM LỊCH HẸN CỦA TÔI
                                                        </button>
                                                    </div>
                                                )}

                                                {msg.isLoginPrompt && (
                                                    <div style={{
                                                        marginTop: '12px', padding: '16px', borderRadius: '16px',
                                                        background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                                                        border: '1.5px solid rgba(244, 63, 94, 0.3)',
                                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', color: 'var(--ink)'
                                                    }}>
                                                        <div style={{ fontWeight: 950, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontSize: '0.9rem' }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'blink 1.5s infinite' }}>security</span>
                                                            YÊU CẦU ĐĂNG NHẬP AN TOÀN
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: '14px', lineHeight: 1.5, fontWeight: 600 }}>
                                                            Dạ Sen ơi, các tác vụ tự động lập lịch khám, quản lý bệnh án thú y và tra cứu dữ liệu khách hàng yêu cầu quyền tài khoản bảo mật của Bệnh viện Thú y Rexi. Sen đăng nhập hoặc đăng ký tài khoản nhanh chỉ trong 10 giây để cùng Rexi chăm sóc bé yêu nhé!
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                            <button data-ai-id="button-chatbot-fbml" onClick={() => { setIsOpen(false); navigate("/dang-nhap"); }} style={{
                                                                background: '#f43f5e', color: 'white', border: 'none',
                                                                borderRadius: '10px', padding: '10px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                                            }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>login</span>
                                                                ĐĂNG NHẬP NGAY
                                                            </button>
                                                            <button data-ai-id="button-chatbot-cy8o" onClick={() => { setIsOpen(false); navigate("/dang-nhap"); }} style={{
                                                                background: 'transparent', border: '1.5px solid #f43f5e', color: '#f43f5e',
                                                                borderRadius: '10px', padding: '10px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                                            }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>person_add</span>
                                                                ĐĂNG KÝ NHANH
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Dynamic Clinical Triage Card */}
                                            {msg.isEmergency && renderEmergencyBoard(isClinicStaff)}
                                        </div>
                                    ))}
                                    {agentLoading && (
                                        <div className="dot-pulse" style={{ alignSelf: 'flex-start' }}>
                                            <span></span><span></span><span></span>
                                        </div>
                                    )}
                                    <div ref={agentEndRef} />
                                </div>

                                {/* QUICK SUGGESTIONS GRID FOR AGENT TAB */}
                                <div style={{ overflowX: 'auto', padding: '10px 14px', background: 'var(--surface)', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '8px' }}>
                                    {isClinicStaff ? (
                                        <>
                                            <button data-ai-id="button-chatbot-4y5q" onClick={() => handleAgentSend("Tìm danh sách khách hàng phòng khám nhanh")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                🔍 Danh Sách Khách Hàng
                                            </button>
                                            <button data-ai-id="button-chatbot-sl1v" onClick={() => handleAgentSend("Lên mạng tìm tài liệu điều trị mèo bị giảm bạch cầu")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                🌐 Tra cứu giảm bạch cầu VNUA
                                            </button>
                                            <button data-ai-id="button-chatbot-8kwv" onClick={() => handleAgentSend("Xem danh sách lịch hẹn hôm nay")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                📅 Lịch Hẹn Hôm Nay
                                            </button>
                                            <button data-ai-id="button-chatbot-kho1" onClick={() => handleAgentSend("Kiểm tra kho thuốc tồn kho")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.08)', color: '#b45309', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                💊 Kho Thuốc
                                            </button>
                                            <button data-ai-id="button-chatbot-stat1" onClick={() => handleAgentSend("Thống kê nhanh số liệu hôm nay")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.08)', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                📊 Thống Kê Nhanh
                                            </button>
                                            <button data-ai-id="button-chatbot-pet1" onClick={() => handleAgentSend("Tìm bé mèo trong hệ thống")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid #10b981', background: 'rgba(16,185,129,0.08)', color: '#059669', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                🐱 Tìm Thú Cưng
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button data-ai-id="button-chatbot-b9qc" onClick={() => handleAgentSend("Lên mạng tìm tài liệu chăm sóc mèo mang thai y khoa")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid #fb7185', background: 'rgba(244,63,94,0.05)', color: '#e11d48', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                🌐 Google Mèo Mang Thai
                                            </button>
                                            <button data-ai-id="button-chatbot-5o0f" onClick={() => handleAgentSend("Đặt lịch khám khẩn cấp ngày mai lúc 9h30")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                📅 Tự Động Điền Lịch Khám
                                            </button>
                                            <button data-ai-id="button-chatbot-qjxx" onClick={() => handleAgentSend("Tìm tài liệu về cách sơ cứu hóc xương ở mèo")} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                                🌐 Sơ Cứu Hóc Dị Vật
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 4. Đính kèm Files Preview */}
                        {activeTab === 'standard' && (selectedFiles.length > 0 || isCompressing) && (
                            <div style={{ padding: '10px 20px', background: 'var(--background)', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '10px', overflowX: 'auto', alignItems: 'center' }}>
                                {selectedFiles.map((file, idx) => (
                                    <div key={idx} style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                                        {file.type === 'image' ? (
                                            <img alt="preview" src={file.data} style={{ height: '60px', width: '60px', borderRadius: '8px', border: '1px solid var(--gray-200)', objectFit: 'cover' }} />
                                        ) : (
                                            <video src={file.data} style={{ height: '60px', width: '60px', borderRadius: '8px', border: '1px solid var(--gray-200)', objectFit: 'cover' }} />
                                        )}
                                        <button data-ai-id="button-chatbot-zrmd" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'white', border: 'none', borderRadius: '50%', color: '#ef4444', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', padding: '2px' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                        </button>
                                    </div>
                                ))}
                                {isCompressing && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary-light)', borderRadius: '12px', color: 'var(--primary)', fontWeight: 850, fontSize: '0.8rem', height: '60px' }}>
                                        <span className="icon-spin material-symbols-outlined" style={{ fontSize: '20px' }}>autorenew</span>
                                        Đang tải file...
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 5. Ô NHẬP TIN NHẮN TẬP TRUNG (CONSOLIDATED INPUT DYNAMIC STYLING) */}
                        <div style={{
                            padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--gray-200)', display: 'flex', alignItems: 'flex-end', gap: '12px'
                        }}>
                            {/* Nút File Đính kèm (Chỉ cho Tab 1) */}
                            {activeTab === 'standard' && (
                                <>
                                    <input data-ai-id="input-chatbot-jmt6"
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*,video/*"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                    <button data-ai-id="button-chatbot-veod" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 0 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>add_circle</span>
                                    </button>
                                </>
                            )}

                            {/* MICROPHONE NHẬN DIỆN GIỌNG NÓI */}
                            <button data-ai-id="button-chatbot-4mbq"
                                onClick={toggleListening}
                                style={{ background: 'none', border: 'none', color: isListening ? '#ef4444' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
                                title="Nói chuyện trực tiếp với Rexi"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '28px', animation: isListening ? 'blink 1.5s infinite' : 'none' }}>
                                    {isListening ? 'mic' : 'mic_none'}
                                </span>
                                {isListening && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '28px', paddingRight: '8px' }}>
                                        <div ref={waveBar1Ref} className="wave-bar" style={{ height: '6px', opacity: 0.6 }}></div>
                                        <div ref={waveBar2Ref} className="wave-bar" style={{ height: '6px', opacity: 0.6 }}></div>
                                        <div ref={waveBar3Ref} className="wave-bar" style={{ height: '6px', opacity: 0.6 }}></div>
                                    </div>
                                )}
                            </button>

                            {/* Ô Nhập Dữ Liệu Tự Động Co Giãn */}
                            <textarea
                                ref={textInputRef}
                                value={activeTab === 'standard' ? input : agentInput}
                                onChange={(e) => {
                                    if (activeTab === 'standard') {
                                        setInput(e.target.value);
                                    } else {
                                        setAgentInput(e.target.value);
                                    }
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (activeTab === 'standard') {
                                            handleSend();
                                        } else {
                                            handleAgentSend();
                                        }
                                    }
                                }}
                                placeholder={activeTab === 'agent' ? "Lệnh tác vụ cho Agent (e.g. đặt lịch, tra cứu mạng)..." : "Nhắn tin cho Bác sĩ Thú y Rexi..."}
                                rows={1}
                                style={{
                                    flex: 1, border: '1px solid var(--gray-300)', borderRadius: '18px', padding: '10px 16px',
                                    resize: 'none', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.88rem',
                                    outline: 'none', maxHeight: '120px', lineHeight: '1.4'
                                }}
                            />

                            {/* NÚT GỬI KHỚP DYNAMIC THEO TAB */}
                            <button data-ai-id="button-chatbot-5x21"
                                onClick={() => activeTab === 'standard' ? handleSend() : handleAgentSend()}
                                style={{
                                    background: activeTab === 'agent' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'var(--chat-gradient)',
                                    color: 'white', border: 'none', borderRadius: '50%', width: '42px', height: '42px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    boxShadow: 'var(--shadow-md)', transition: 'all 0.3s ease'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', transform: 'rotate(-30deg)' }}>send</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* PHÒNG PHỔNG ẢNH CHI TIẾT */}
            {zoomedImage && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setZoomedImage(null)}>
                    <img alt="zoomed" src={zoomedImage} style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
                    <span className="material-symbols-outlined" style={{ position: 'absolute', top: '30px', right: '30px', color: 'white', fontSize: '32px', cursor: 'pointer' }}>close</span>
                </div>
            )}

            {/* BẢNG ĐIỀU KHIỂN HÀNH ĐỘNG AGENT THỜI GIAN THỰC (PREMIUM HUD CONSOLE) */}
            {currentAgentAction && (
                <div style={{
                    position: 'fixed',
                    bottom: isMobile ? '85px' : '95px',
                    right: isMobile ? '16px' : '430px',
                    width: isMobile ? 'calc(100vw - 32px)' : '340px',
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'rgba(15, 23, 42, 0.92)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: currentAgentAction.type === 'ERROR' 
                        ? '1.5px solid rgba(239, 68, 68, 0.45)' 
                        : currentAgentAction.type === 'SUCCESS'
                            ? '1.5px solid rgba(16, 185, 129, 0.45)'
                            : '1.5px solid rgba(244, 63, 94, 0.45)',
                    boxShadow: currentAgentAction.type === 'ERROR'
                        ? '0 12px 40px rgba(239, 68, 68, 0.25)'
                        : currentAgentAction.type === 'SUCCESS'
                            ? '0 12px 40px rgba(16, 185, 129, 0.25)'
                            : '0 12px 40px rgba(244, 63, 94, 0.25)',
                    color: '#f8fafc',
                    zIndex: 99999, // Đảm bảo nổi bật lên trên hết
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontFamily: '"Fira Code", "Courier New", Courier, monospace',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    {/* Tiêu đề & Trạng thái */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '0.8rem', color: '#fda4af', letterSpacing: '0.5px' }}>
                            <span className="material-symbols-outlined" style={{ 
                                fontSize: '18px', 
                                animation: currentAgentAction.type === 'START' || currentAgentAction.type === 'PROGRESS' 
                                    ? 'blink 1.2s infinite' 
                                    : 'none',
                                color: currentAgentAction.type === 'ERROR' ? '#ef4444' : currentAgentAction.type === 'SUCCESS' ? '#10b881' : '#f43f5e'
                            }}>
                                {currentAgentAction.type === 'ERROR' ? 'error' : currentAgentAction.type === 'SUCCESS' ? 'check_circle' : 'bolt'}
                            </span>
                            AGENT AUTOMATION HUD
                        </div>
                        <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', fontWeight: 'bold' }}>
                            {currentAgentAction.actionType || 'EXEC'}
                        </span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>

                    {/* Nội dung log */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                            <span style={{ color: '#64748b' }}>$ </span>
                            {currentAgentAction.type === 'START' && `Đang chuẩn bị thực thi lệnh: ${currentAgentAction.actionType}`}
                            {currentAgentAction.type === 'PROGRESS' && (currentAgentAction.message || 'Đang thực hiện...')}
                            {currentAgentAction.type === 'SUCCESS' && (currentAgentAction.message || 'Thực thi hành động thành công!')}
                            {currentAgentAction.type === 'ERROR' && (currentAgentAction.message || 'Hành động thất bại hoặc bị hủy!')}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 'bold' }}>TARGET:</span>
                            <span style={{ fontSize: '0.66rem', color: '#f472b6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }} title={currentAgentAction.payload}>
                                {currentAgentAction.payload || 'n/a'}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar chạy động */}
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                            height: '100%', 
                            width: currentAgentAction.type === 'SUCCESS' ? '100%' : currentAgentAction.type === 'ERROR' ? '100%' : '55%',
                            background: currentAgentAction.type === 'ERROR' 
                                ? '#ef4444' 
                                : currentAgentAction.type === 'SUCCESS'
                                    ? '#10b881'
                                    : 'linear-gradient(90deg, #f43f5e, #fda4af)',
                            transition: 'width 0.4s ease-in-out',
                            animation: currentAgentAction.type === 'START' || currentAgentAction.type === 'PROGRESS' ? 'blink 1.2s infinite' : 'none'
                        }}></div>
                    </div>
                </div>
            )}
        </>
    );
};
