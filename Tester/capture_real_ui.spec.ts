import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Chụp ảnh màn hình thật của giao diện sau cải tiến', async ({ page }) => {
    // Kích thước desktop chuẩn để ảnh chụp rõ nét, lộng lẫy
    await page.setViewportSize({ width: 1280, height: 800 });

    // Thư mục lưu artifacts
    const artifactDir = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\b3aed445-909e-4ce9-b736-8bc81398af28';

    // 1. Chụp ảnh trang đăng nhập thật
    console.log('Truy cập trang đăng nhập...');
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000); // Chờ 2 giây để các animation/hiệu ứng load xong
    const loginImgPath = path.join(artifactDir, 'screenshot_login_real.png');
    await page.screenshot({ path: loginImgPath });
    console.log(`Đã chụp trang đăng nhập: ${loginImgPath}`);

    // 2. Chuyển sang form Đăng ký (Wizard Bước 1)
    console.log('Chuyển sang form Đăng ký (Bước 1)...');
    await page.getByText('Đăng ký ngay').click();
    await page.waitForTimeout(1000); // Chờ slide transition
    const step1ImgPath = path.join(artifactDir, 'screenshot_register_step1_real.png');
    await page.screenshot({ path: step1ImgPath });
    console.log(`Đã chụp trang đăng ký Bước 1: ${step1ImgPath}`);

    // 3. Điền thông tin Bước 1
    console.log('Điền thông tin Bước 1...');
    await page.getByPlaceholder('Họ và tên').fill('Lê Văn Thật');
    await page.getByPlaceholder('Email').fill('tester_real@rexi.com');
    await page.getByPlaceholder('Số điện thoại').fill('0987654321');
    await page.getByPlaceholder('Địa chỉ').fill('NIC NIC 3A Thi Sách, Hà Nội');
    await page.waitForTimeout(500);

    // 4. Bấm "Tiếp theo" để chuyển sang Bước 2 của Wizard
    console.log('Bấm "Tiếp theo" để sang Bước 2...');
    await page.click('button:has-text("Tiếp theo")');
    await page.waitForTimeout(1000); // Chờ slide transition mượt mà
    const step2ImgPath = path.join(artifactDir, 'screenshot_register_step2_real.png');
    await page.screenshot({ path: step2ImgPath });
    console.log(`Đã chụp trang đăng ký Bước 2: ${step2ImgPath}`);

    // 5. Đăng nhập ADMIN để chụp AISummaryModal thật
    console.log('Trở lại đăng nhập Admin...');
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(1000);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

    // Chờ điều hướng vào dashboard
    await expect(page).toHaveURL(/.*\/quan-ly\/dashboard/, { timeout: 12000 });
    console.log('Đã đăng nhập Admin thành công.');
    await page.waitForTimeout(2000);

    // Vào trang hồ sơ bệnh án để kích hoạt AI tóm tắt
    console.log('Vào trang quản lý hồ sơ bệnh án...');
    await page.goto('http://localhost:3005/quan-ly/ho-so-benh-an');
    await page.waitForTimeout(2000);

    // Tìm nút AI tóm tắt đầu tiên (nút chứa icon auto_awesome hoặc text Tóm tắt)
    console.log('Kích hoạt AISummaryModal...');
    const aiBtn = page.locator('button:has-text("AI"), button:has-text("Tóm tắt"), button .material-symbols-outlined:has-text("auto_awesome")').first();
    if (await aiBtn.count() > 0) {
        await aiBtn.click();
        console.log('Đang chờ AI tóm tắt bệnh án (khoảng 3 giây)...');
        await page.waitForTimeout(4000); // Chờ render modal kính mờ cao cấp
        const aiModalImgPath = path.join(artifactDir, 'screenshot_ai_summary_real.png');
        await page.screenshot({ path: aiModalImgPath });
        console.log(`Đã chụp AISummaryModal kính mờ thật: ${aiModalImgPath}`);
    } else {
        console.log('Không tìm thấy nút AI Tóm Tắt trên bảng bệnh án.');
    }
});
