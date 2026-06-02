type TreatmentDrug = {
    name?: string;
    qty?: string;
    instruction?: string;
};

type TreatmentPdfData = {
    ownerName?: string;
    petName?: string;
    diagnosis?: string;
    treatment?: string;
    drugs?: TreatmentDrug[];
};

const escapeHtml = (value: unknown) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildDrugRows = (drugs?: TreatmentDrug[]) => {
    if (!Array.isArray(drugs) || drugs.length === 0) {
        return `<tr><td colspan="4" style="text-align: center; color: #94a3b8;">Không có thuốc chỉ định đặc biệt</td></tr>`;
    }

    return drugs.map((drug, index) => `
        <tr>
            <td style="color: #64748b; font-weight: 600;">#0${index + 1}</td>
            <td><b style="color: #0f172a;">${escapeHtml(drug.name)}</b></td>
            <td><span style="background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-weight: 700; color: #475569;">${escapeHtml(drug.qty)}</span></td>
            <td>${escapeHtml(drug.instruction)}</td>
        </tr>
    `).join("");
};

const buildTreatmentPdfHtml = (data: TreatmentPdfData) => {
    const dateStr = new Date().toLocaleDateString("vi-VN");
    return `
<html>
<head>
    <title>Phiếu Hướng Dẫn Điều Trị & Đơn Thuốc - ${escapeHtml(data.petName)}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #fff; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 26px; font-weight: 900; color: #e11d48; margin-bottom: 5px; letter-spacing: -1px; }
        .clinic-info { font-size: 13px; color: #64748b; font-weight: 600; }
        .title { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0; color: #0f172a; text-align: center; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 14px; padding: 18px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; }
        .info-item b { color: #475569; }
        .section-title { font-size: 14px; font-weight: 900; color: #e11d48; border-left: 4px solid #e11d48; padding-left: 12px; margin: 25px 0 15px; text-transform: uppercase; letter-spacing: 0.5px; }
        .content-box { font-size: 14px; margin-bottom: 20px; white-space: pre-line; color: #334155; background: #fafafa; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        th, td { padding: 14px; font-size: 13.5px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 800; color: #475569; border-bottom: 2px solid #e2e8f0; }
        .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 14px; }
        .signature { text-align: center; width: 220px; }
        .signature-name { margin-top: 70px; font-weight: 800; }
        @media print {
            @page { size: A4 portrait; margin: 12mm; }
            html, body { background: #fff !important; overflow: visible !important; }
            body { padding: 0 !important; }
            .no-print { display: none !important; }
            .table-responsive-wrapper,
            .table-responsive-wrapper > div {
                overflow: visible !important;
                min-width: 0 !important;
                width: 100% !important;
            }
            table {
                width: 100% !important;
                min-width: 0 !important;
                break-inside: avoid;
                page-break-inside: avoid;
            }
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
        <div class="info-item"><b>Chủ nuôi:</b> ${escapeHtml(data.ownerName || "Khách hàng thân thiết")}</div>
        <div class="info-item"><b>Tên bé cưng:</b> ${escapeHtml(data.petName)}</div>
        <div class="info-item"><b>Ngày kê toa:</b> ${dateStr}</div>
        <div class="info-item"><b>Bác sĩ chỉ định:</b> Bác sĩ Rexi AI (Autopilot Engine)</div>
    </div>
    <div class="section-title">1. Chẩn đoán lâm sàng</div>
    <div class="content-box"><b>${escapeHtml(data.diagnosis)}</b></div>
    <div class="section-title">2. Phác đồ điều trị & Chăm sóc tại nhà</div>
    <div class="content-box">${escapeHtml(data.treatment)}</div>
    <div class="section-title">3. Danh sách dược phẩm chỉ định</div>
    <div class="table-responsive-wrapper">
        <div style="min-width: 800px">
            <table>
                <thead>
                    <tr>
                        <th style="width: 8%;">STT</th>
                        <th style="width: 40%;">Tên thuốc / Biệt dược</th>
                        <th style="width: 15%;">Số lượng</th>
                        <th style="width: 37%;">Hướng dẫn sử dụng</th>
                    </tr>
                </thead>
                <tbody>${buildDrugRows(data.drugs)}</tbody>
            </table>
        </div>
    </div>
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
            setTimeout(function() { window.print(); }, 300);
        };
    </script>
</body>
</html>
    `;
};

export const downloadTreatmentPdf = (data: TreatmentPdfData) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert("Vui lòng cho phép trình duyệt mở tab mới để Rexi xuất phiếu điều trị và đơn thuốc nhé! 🐾");
        return;
    }

    printWindow.document.open();
    printWindow.document.write(buildTreatmentPdfHtml(data));
    printWindow.document.close();
};
