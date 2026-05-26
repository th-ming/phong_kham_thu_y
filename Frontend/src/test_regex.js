const cases = [
    { text: "hủy lịch khám", expected: true },
    { text: "đo huyết áp", expected: false },
    { text: "khoa khám bệnh", expected: false },
    { text: "khoa nội", expected: false },
    { text: "khóa tài khoản", expected: true },
    { text: "chọn khoa", expected: false },
    { text: "hủy", expected: true },
    { text: "hủy bỏ", expected: true },
    { text: "bác sĩ huy", expected: false },
    { text: "xóa", expected: true },
    { text: "xóa bệnh án", expected: true },
    { text: "thanh toán", expected: true },
    { text: "cập nhật", expected: true }
];

function normalizeSearchText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function isSensitive(text) {
    const normalized = normalizeSearchText(text);
    // Vấn đề: "khoa" có nghĩa là department, "huy" là tên người.
    // Chúng ta không thể dùng từ đơn nếu nó bị trùng.
    
    // Các từ nhạy cảm có độ nguy hiểm cao, không bị trùng (hoặc ít)
    const strongPhrases = [
        "xoa", "thanh toan", "chinh sua", "cap nhat", "tao moi"
    ];
    
    // Các từ dễ trùng (huy, khoa, doi) cần phải đi kèm ngữ cảnh (verb + object)
    // hoặc đứng đúng một mình (rất ngắn)
    const conditionalPhrases = {
        "huy": ["huy lich", "huy bo", "huy phieu", "huy hoa don", "huy kham"], // không bắt "huy" nếu có chữ khác đi kèm mà không nằm trong list này, trừ khi text chỉ có đúng chữ "huy"
        "khoa": ["khoa tai khoan", "khoa user", "khoa nick"],
        "doi": ["doi mat khau", "doi pass", "doi lich", "doi ca"]
    };

    // 1. Kiểm tra strong phrases
    if (strongPhrases.some(p => new RegExp(`\\b${p}\\b`, 'i').test(normalized))) {
        return true;
    }
    
    // 2. Kiểm tra exact match cho các từ dễ trùng (nút bấm chỉ có chữ "hủy", "khóa", "đổi")
    const words = normalized.split(/\s+/);
    if (words.length <= 2) {
        if (words.includes("huy") || words.includes("khoa") || words.includes("doi")) {
            // Nhưng coi chừng "bác sĩ huy", "chọn khoa" -> length = 2.
            // Tốt nhất nếu length <= 2 và là nút bấm thì...
        }
    }
    
    // 3. Kiểm tra cụm từ an toàn cho từ dễ trùng
    for (const [key, contextList] of Object.entries(conditionalPhrases)) {
        if (contextList.some(p => normalized.includes(p))) {
            return true;
        }
    }
    
    // Rule đặc biệt: Nếu text CHỈ LÀ chữ "huy" hoặc "xoa" hoặc "khoa" (exact match)
    if (normalized === "huy" || normalized === "khoa" || normalized === "doi") {
        return true;
    }
    
    return false;
}

cases.forEach(c => {
    const res = isSensitive(c.text);
    console.log(`"${c.text}" -> ${res} (Expected: ${c.expected}) ${res === c.expected ? '✅' : '❌'}`);
});
