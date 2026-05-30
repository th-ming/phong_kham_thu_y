#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Patch confirm dialog và loading state vào QuanLyLichLamViec.tsx"""

import os

file_path = r"d:\QLy Phòng Khám Thú Y\Frontend\src\pages\admin\QuanLyLichLamViec.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Đoạn cũ cần thay
OLD = '''                        <div style={{ display: 'flex', gap: '12px' }}>
                             <button data-ai-id="button-quanlylichlamviec-9xrv" className="btn btn-outline btn-pill" style={{ flex: 1 }} onClick={() => { setShowAddModal(false); setStaffPickerOpen(false); }}>HỦY</button>
                             <button data-ai-id="button-quanlylichlamviec-76g1" className="btn btn-primary btn-pill" style={{ flex: 1, fontWeight: 900 }} onClick={confirmAddShift}>XÁC NHẬN</button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuanLyLichLamViec;'''

# Đoạn mới với loading state + confirm dialog đẹp
NEW = '''                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                data-ai-id="button-quanlylichlamviec-9xrv"
                                className="btn btn-outline btn-pill"
                                style={{ flex: 1 }}
                                onClick={() => { setShowAddModal(false); setStaffPickerOpen(false); }}
                                disabled={isSubmitting}
                            >
                                HỦY
                            </button>
                            <button
                                data-ai-id="button-quanlylichlamviec-76g1"
                                className="btn btn-primary btn-pill"
                                style={{ flex: 1, fontWeight: 900, opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={confirmAddShift}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <span className="material-symbols-outlined" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>sync</span>}
                                {isSubmitting ? 'ĐANG LƯU...' : 'XÁC NHẬN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM DIALOG — thay thế window.confirm, không block UI trình duyệt */}
            {confirmDialog.open && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
                    onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                >
                    <div
                        className="glass-card"
                        onClick={e => e.stopPropagation()}
                        style={{ width: '400px', padding: '36px', borderRadius: '28px', background: 'var(--surface)', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}
                    >
                        {/* Icon câu hỏi */}
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', border: '2px solid rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#f59e0b' }}>help</span>
                        </div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
                            {confirmDialog.title}
                        </h3>
                        <p style={{ color: 'var(--gray-500)', fontWeight: 600, margin: '0 0 28px', lineHeight: 1.6, fontSize: '0.9rem' }}>
                            {confirmDialog.message}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="btn btn-outline btn-pill"
                                style={{ flex: 1 }}
                                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                className="btn btn-primary btn-pill"
                                style={{ flex: 1, fontWeight: 900 }}
                                onClick={confirmDialog.onConfirm}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuanLyLichLamViec;'''

if OLD in content:
    new_content = content.replace(OLD, NEW, 1)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("✅ Patch thành công! Đã thêm Confirm Dialog + Loading state.")
else:
    # Thử normalize line endings
    content_lf = content.replace('\r\n', '\n')
    old_lf = OLD.replace('\r\n', '\n')
    new_lf = NEW.replace('\r\n', '\n')
    if old_lf in content_lf:
        new_content = content_lf.replace(old_lf, new_lf, 1)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("✅ Patch thành công (LF mode)!")
    else:
        print("❌ Không tìm thấy đoạn cần thay. Kiểm tra lại file.")
        # Debug: in ra 15 dòng cuối
        lines = content.splitlines()
        print(f"Total lines: {len(lines)}")
        for i, line in enumerate(lines[-15:], len(lines)-14):
            print(f"  {i}: {repr(line)}")
