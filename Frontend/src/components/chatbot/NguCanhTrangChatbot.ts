export const isEmailLikeIdentifier = (value: string) =>
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(String(value || "").trim());

/** Ưu tiên họ tên trong hồ sơ; không lấy email / tên đăng nhập dạng mail làm tên gọi. */
export const resolveChatDisplayName = (user: any): string => {
    const fromProfile = cleanDisplayName(user?.ten_khach_hang || user?.ho_ten || "");
    if (fromProfile) return fromProfile;

    const fromPage = readVisibleProfileNameFromPage();
    if (fromPage) return fromPage;

    const login = String(user?.ten_dang_nhap || "").trim();
    if (login && !isEmailLikeIdentifier(login)) {
        return cleanDisplayName(login);
    }

    return "";
};

export const cleanDisplayName = (name: string) => {
    const raw = String(name || "").replace(/^\d+\.\s*/, "").trim();
    if (!raw) return "";

    const emailMatch = raw.match(/^([^@\s]+)@[^@\s]+\.[^@\s]+$/);
    const baseName = (emailMatch ? emailMatch[1] : raw)
        .replace(/\+.*$/, "")
        .replace(/[._-]+/g, " ")
        .replace(/(?<=[A-Za-zÀ-ỹ])\d{3,}$/u, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!/[A-Za-zÀ-ỹ]/u.test(baseName)) return "";

    return baseName
        .split(" ")
        .filter(Boolean)
        .map(part => part.length > 1 ? part.charAt(0).toUpperCase() + part.slice(1) : part.toUpperCase())
        .join(" ");
};

const normalizeLookupText = (text: string) =>
    String(text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/\s+/g, " ")
        .trim();

const isVisibleElement = (el: Element) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
};

export const readVisibleProfileNameFromPage = (): string => {
    try {
        if (typeof window !== "undefined") {
            const path = window.location.pathname;
            if (path === "/dang-nhap" || path === "/quen-mat-khau" || path.includes("/auth")) {
                return "";
            }
        }

        // Cải tiến 3: Mở rộng nhãn nhận diện đa dạng hơn (chủ nuôi, bác sĩ, nhân viên, ...)
        const nameLabels = [
            "ho va ten", "ho ten", "ten khach hang", "ten nhan vien", "ten cua ban",
            "full name", "your name", "chu nuoi", "bac si", "ten bac si",
            "ten nguoi dung", "ten tai khoan", "display name", "nickname",
            "ten dang nhap", "ho va ten chu nuoi", "ten nhan su"
        ];
        const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"));

        for (const control of controls) {
            if (!isVisibleElement(control)) continue;
            const value = cleanDisplayName(control.value || "");
            if (!value) continue;

            const id = control.getAttribute("id") || "";
            const labelledBy = control.getAttribute("aria-labelledby") || "";
            const explicitLabel = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent || "" : "";
            const ariaLabelText = labelledBy
                .split(/\s+/)
                .map(labelId => document.getElementById(labelId)?.textContent || "")
                .join(" ");
            const contextText = [
                control.getAttribute("aria-label") || "",
                control.getAttribute("placeholder") || "",
                control.getAttribute("name") || "",
                id,
                explicitLabel,
                ariaLabelText,
                control.closest("label")?.textContent || "",
                control.parentElement?.textContent || ""
            ].join(" ");

            const normalizedContext = normalizeLookupText(contextText);
            if (nameLabels.some(label => normalizedContext.includes(label))) {
                return value;
            }
        }
    } catch (e) {
        console.error("Lỗi đọc tên hiển thị trên trang hồ sơ:", e);
    }

    return "";
};

export const getPageDisplayName = (pathname: string): string => {
    if (pathname === "/") return "Trang chủ";
    if (pathname === "/ve-chung-toi") return "Về chúng tôi";
    if (pathname === "/bang-gia") return "Bảng giá dịch vụ";
    if (pathname === "/lien-he") return "Liên hệ";
    if (pathname === "/bac-si") return "Đội ngũ bác sĩ";
    if (pathname === "/dang-nhap") return "Đăng nhập / Đăng ký";
    if (pathname === "/quen-mat-khau") return "Quên mật khẩu";

    if (pathname === "/khach-hang/dashboard") return "Bảng điều khiển Khách hàng";
    if (pathname === "/khach-hang/quan-ly-thu-cung") return "Quản lý thú cưng";
    if (pathname === "/khach-hang/dat-lich-hen") return "Đặt lịch hẹn khám";
    if (pathname === "/khach-hang/lich-su-lich-hen") return "Lịch sử lịch hẹn";
    if (pathname === "/khach-hang/ho-so-benh-an") return "Hồ sơ bệnh án thú cưng";
    if (pathname === "/khach-hang/hoa-don-thanh-toan") return "Hóa đơn & thanh toán";
    if (pathname === "/khach-hang/thong-tin-ca-nhan") return "Thông tin cá nhân";

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

export const getPageDomContext = (): string => {
    try {
        const metrics: string[] = [];
        const pushMetric = (value: string) => {
            const cleaned = value.replace(/\s+/g, " ").trim();
            if (cleaned) metrics.push(cleaned.slice(0, 180));
        };

        const activeFormHeaders = document.querySelectorAll("h1, h2, h3, .form-title, [class*='title']");
        activeFormHeaders.forEach(header => {
            const txt = header.textContent?.trim().replace(/\s+/g, " ");
            if (txt && (txt.includes("Cập nhật thông tin") || txt.includes("Đăng ký") || txt.includes("Đặt lịch") || txt.includes("Thông tin"))) {
                pushMetric(`Tiêu đề Form active: "${txt}"`);
            }
        });

        const cards = document.querySelectorAll(".glass-card, [class*='card'], .card");
        cards.forEach((card, idx) => {
            if (idx > 7) return;
            const labelEl = card.querySelector("p, .text-sm, .text-xs, [class*='label']");
            const valueEl = card.querySelector("h3, h2, .text-2xl, .text-3xl, .font-bold, [class*='value']");
            if (labelEl && valueEl) {
                const label = labelEl.textContent?.trim().replace(/\s+/g, " ");
                const val = valueEl.textContent?.trim().replace(/\s+/g, " ");
                if (label && val && label.length < 50 && val.length < 30) {
                    pushMetric(`Chỉ số: ${label}: ${val}`);
                }
            }
        });

        const tables = document.querySelectorAll("table");
        tables.forEach((table, tableIdx) => {
            if (tableIdx > 0) return;
            const headers: string[] = [];
            table.querySelectorAll("thead th").forEach(th => {
                const txt = th.textContent?.trim();
                if (txt && headers.length < 8) headers.push(txt.slice(0, 24));
            });

            const rows: string[] = [];
            table.querySelectorAll("tbody tr").forEach((tr, rowIdx) => {
                if (rowIdx > 1) return;
                const cells: string[] = [];
                tr.querySelectorAll("td").forEach(td => {
                    const txt = td.textContent?.trim().replace(/\s+/g, " ");
                    if (txt && cells.length < 5) cells.push(txt.slice(0, 32));
                });
                if (cells.length > 0) {
                    rows.push(`[${cells.join(" | ")}]`);
                }
            });

            if (rows.length > 0) {
                pushMetric(`Bảng ${tableIdx + 1} (${headers.join(", ")}): ${rows.join(" ; ")}`);
            }
        });

        const alerts = document.querySelectorAll("[class*='alert'], [class*='warning'], .bg-red-50, .bg-yellow-50");
        alerts.forEach((alert, idx) => {
            if (idx > 2) return;
            const txt = alert.textContent?.trim().replace(/\s+/g, " ");
            if (txt && txt.length < 150) {
                pushMetric(`Cảnh báo: ${txt}`);
            }
        });

        // Cải tiến 1: Phát hiện Modal/Overlay đang mở — quét các phần tử bên trong trước
        const MODAL_SELECTORS = [
            "[role='dialog']",
            "[role='alertdialog']",
            ".modal",
            "[class*='modal']",
            "[class*='dialog']",
            "[class*='overlay']",
            "[class*='popup']",
            "[class*='drawer']",
        ].join(", ");
        const openModal = Array.from(document.querySelectorAll<HTMLElement>(MODAL_SELECTORS)).find(el => {
            const style = window.getComputedStyle(el);
            return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
        });
        if (openModal) {
            const modalTitle = openModal.querySelector("h1, h2, h3, [class*='title'], [class*='header']")?.textContent?.trim().replace(/\s+/g, " ");
            if (modalTitle) pushMetric(`Modal đang mở: "${modalTitle}"`);
        }

        // Cải tiến 1 + 2: Ưu tiên thu thập phần tử tương tác từ Modal trước, sau đó mới phần tử trang chính
        let autoIdCounter = 1;
        const modalElements = openModal
            ? Array.from(openModal.querySelectorAll<Element>("button, input, select, textarea, [role='button'], [data-ai-id]"))
            : [];
        const pageElements = Array.from(document.querySelectorAll<Element>("button, input, select, textarea, [role='button'], [data-ai-id]"))
            .filter(el => !openModal || !openModal.contains(el));

        // Modal elements chiếm 20 slot đầu, page elements chiếm 15 slot còn lại (tổng 35)
        const modalSlots = Math.min(modalElements.length, 20);
        const pageSlots = Math.min(pageElements.length, 35 - modalSlots);
        const allElements = [
            ...modalElements.slice(0, modalSlots),
            ...pageElements.slice(0, pageSlots),
        ];

        allElements.forEach((el) => {
            let aiId = el.getAttribute("data-ai-id");
            if (!aiId) {
                aiId = el.id || el.getAttribute("name") || `auto-ai-id-${autoIdCounter++}`;
                el.setAttribute("data-ai-id", aiId);
            }

            const tagName = el.tagName.toLowerCase();
            let label = "";

            if (tagName === "button" || el.getAttribute("role") === "button") {
                label = el.textContent?.trim().replace(/\s+/g, " ") || "";
            } else if (tagName === "input" || tagName === "textarea") {
                const placeholder = el.getAttribute("placeholder") || "";
                const name = el.getAttribute("name") || "";
                const type = el.getAttribute("type") || "text";
                const inputEl = el as HTMLInputElement | HTMLTextAreaElement;

                // Cải tiến 2: Bắt trạng thái checked của Checkbox và Radio
                if (type === "checkbox" || type === "radio") {
                    const checked = (inputEl as HTMLInputElement).checked;
                    const checkLabel = placeholder || name || el.getAttribute("aria-label") || el.id || name;
                    label = `[Loại: ${type}] ${checkLabel ? `"${checkLabel}"` : ""} [Trạng thái: ${checked ? "✅ Đã chọn" : "☐ Chưa chọn"}]`;
                } else {
                    const val = inputEl.value || "";
                    label = `[Loại: ${type}] ${placeholder ? `Gợi ý: ${placeholder}` : `Tên: ${name}`}${val ? ` (Giá trị thực: "${val}")` : ""}`;
                }
            } else if (tagName === "select") {
                const options: string[] = [];
                el.querySelectorAll("option").forEach(opt => {
                    const val = opt.getAttribute("value");
                    const txt = opt.textContent?.trim();
                    if (val) options.push(`"${txt}" (val: ${val})`);
                });
                const currentVal = (el as HTMLSelectElement).value || "";
                const selectedOpt = (el as HTMLSelectElement).options[(el as HTMLSelectElement).selectedIndex];
                const currentText = selectedOpt ? selectedOpt.text.trim() : "";
                label = `[Select] Giá trị chọn: "${currentText}" (val: "${currentVal}"), Lựa chọn: ${options.slice(0, 8).join(", ")}`;
            } else if (tagName === "div") {
                label = el.textContent?.trim() || "";
            }

            if (label.length > 100) label = label.substring(0, 100) + "...";
            const scope = openModal && openModal.contains(el) ? "[MODAL] " : "";
            pushMetric(`${scope}Element [${tagName}] "${label}" (data-ai-id: "${aiId}")`);
        });

        const uniqueMetrics = Array.from(new Set(metrics)).filter(m => m.trim().length > 0);
        return uniqueMetrics.join(" | ").slice(0, 1200);
    } catch (e) {
        console.error("Lỗi parse DOM context:", e);
        return "";
    }
};
