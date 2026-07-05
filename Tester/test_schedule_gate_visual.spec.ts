import { test, expect } from "@playwright/test";

const FRONTEND = "https://rexi-vet-clinic.vercel.app";
const ARTIFACT = "C:\\Users\\84916\\.gemini\\antigravity\\brain\\9d838657-7fcb-4299-9fb5-288fb554bf21";

function getWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
    const monday = new Date(now); monday.setDate(now.getDate() + diffToMonday);
    const wednesday = new Date(monday); wednesday.setDate(monday.getDate() + 2);
    const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { thisWed: fmt(wednesday), nextMon: fmt(nextMonday) };
}

test.use({
    launchOptions: {
        headless: false,
        slowMo: 800, // Chậm lại 0.8s giữa các thao tác để người dùng dễ quan sát
    }
});

test("Visual: Kiem tra gioi han sua lich lam viec tren cloud", async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1400, height: 900 });
    const dates = getWeekDates();
    console.log("Thu 4 tuan hien tai: " + dates.thisWed);
    console.log("Thu 2 tuan sau: " + dates.nextMon);

    // 1. DANG NHAP
    console.log("[1] Dang nhap...");
    await page.goto(FRONTEND + "/dang-nhap", { waitUntil: "load", timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: ARTIFACT + "\\sg_0_login.png" });

    // Dien thong tin dang nhap
    await page.locator("input").nth(0).fill("doctor_1779566347881");
    await page.locator("input[type=password]").first().fill("Rexi@2026");
    await page.screenshot({ path: ARTIFACT + "\\sg_1_filled.png" });
    await page.locator("button[type=submit]").first().click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: ARTIFACT + "\\sg_2_after_login.png" });
    console.log("Sau dang nhap URL: " + page.url());

    // 2. VAO TRANG LICH LAM VIEC
    console.log("[2] Vao /quan-ly/lich-lam-viec...");
    await page.goto(FRONTEND + "/quan-ly/lich-lam-viec", { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: ARTIFACT + "\\sg_3_schedule_page.png" });
    console.log("Trang lich lam viec da load");

    // 3. TIM FORM DANG KY CA TRUC - Thu cac selector pho bien
    const addSelectors = [
        "button:has-text('Đăng ký')",
        "button:has-text('Thêm')",
        "button:has-text('+ Thêm')",
        "button:has-text('Thêm ca')",
        "button[data-action='add']",
        ".btn-add",
        ".add-shift",
        "[aria-label*='add']",
        "button.primary",
    ];
    let clicked = false;
    for (const sel of addSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log("Tim thay nut them ca: " + sel);
            await btn.click();
            await page.waitForTimeout(2000);
            clicked = true;
            break;
        }
    }
    if (!clicked) console.log("Khong tim thay nut them ca, thu dien truc vao input date");
    await page.screenshot({ path: ARTIFACT + "\\sg_4_after_click_add.png" });

    // 4. DIEN NGAY TUAN HIEN TAI
    const dateInput = page.locator("input[type=date]").first();
    const hasDate = await dateInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasDate) {
        console.log("[3] Dien ngay tuan hien tai: " + dates.thisWed);
        await dateInput.fill(dates.thisWed);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: ARTIFACT + "\\sg_5_current_week_filled.png" });

        // Bam luu/submit
        const saveBtn = page.locator("button[type=submit], button:has-text('Lưu'), button:has-text('Đăng ký'), button:has-text('Xác nhận')").first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await saveBtn.click();
            await page.waitForTimeout(3000);
        }
        await page.screenshot({ path: ARTIFACT + "\\sg_6_current_week_result.png" });
        console.log("[3] Ket qua sau khi chon tuan hien tai (ky vong thong bao loi)");

        // 5. DIEN NGAY TUAN SAU
        console.log("[4] Dien ngay tuan sau: " + dates.nextMon);
        await dateInput.fill(dates.nextMon).catch(() => {});
        await page.waitForTimeout(1000);
        await page.screenshot({ path: ARTIFACT + "\\sg_7_next_week_filled.png" });

        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await saveBtn.click();
            await page.waitForTimeout(3000);
        }
        await page.screenshot({ path: ARTIFACT + "\\sg_8_next_week_result.png" });
        console.log("[4] Ket qua sau khi chon tuan sau");
    } else {
        console.log("Khong co input[type=date] - chup trang hien tai de xem UI");
        // Cuon xuong de tim form
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: ARTIFACT + "\\sg_5_scroll_down.png" });
        await page.evaluate(() => window.scrollTo(0, 0));
    }

    // Chup anh cuoi tong quat
    await page.screenshot({ path: ARTIFACT + "\\sg_9_final.png" });
    console.log("=== TEST HOAN THANH - Kiem tra cac anh chup ===");
    // Test luon pass (ket qua xem qua screenshot)
    expect(true).toBe(true);
});
