import { test, expect } from "@playwright/test";
import * as path from "path";

const BASE_URL = "https://phong-kham-thu-y.onrender.com";
const FRONTEND_URL = "https://rexi-vet-clinic.vercel.app";
const ARTIFACT_DIR = "C:\\Users\\84916\\.gemini\\antigravity\\brain\\9d838657-7fcb-4299-9fb5-288fb554bf21";

function getWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + diffToMonday);
    const currentWed = new Date(currentMonday);
    currentWed.setDate(currentMonday.getDate() + 2);
    const nextWed = new Date(currentMonday);
    nextWed.setDate(currentMonday.getDate() + 9);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { currentWed: fmt(currentWed), nextWed: fmt(nextWed) };
}

test("Kiem tra gioi han sua lich lam viec nhan vien tren cloud", async ({ request, page }) => {
    const dates = getWeekDates();
    console.log("Ngay test tuan hien tai: " + dates.currentWed);
    console.log("Ngay test tuan sau: " + dates.nextWed);

    // Dang nhap lay token
    console.log("[1] Dang nhap...");
    const loginRes = await request.post(BASE_URL + "/api/auth/login", {
        data: { tenDangNhap: "teststaff", matKhau: "Password123!" },
    });
    let token: string | null = null;
    let staffId: string | null = null;
    if (loginRes.ok()) {
        const body = await loginRes.json();
        token = body.token || body.accessToken || null;
        staffId = body.idNhanVien || body.id_nhan_vien || null;
        console.log("Dang nhap OK, staffId=" + staffId);
    } else {
        // fallback: dung testcustomer2
        const r2 = await request.post(BASE_URL + "/api/auth/login", {
            data: { tenDangNhap: "testcustomer2", matKhau: "Password123!" },
        });
        if (r2.ok()) {
            const body = await r2.json();
            token = body.token || body.accessToken || null;
            staffId = body.idNhanVien || body.id_nhan_vien || null;
            console.log("Dang nhap testcustomer2 OK, staffId=" + staffId);
        }
    }
    expect(token).toBeTruthy();

    const headers = { Authorization: "Bearer " + token };

    // Test 1: tuan hien tai -> phai bi chan 403
    console.log("[2] Thu dang ky ca truc TUAN HIEN TAI (" + dates.currentWed + ") -> ky vong 403...");
    const blockRes = await request.post(BASE_URL + "/api/nhan-vien/lich-lam-viec", {
        headers,
        data: { id_nhan_vien: staffId || "NV001", ngay_lam: dates.currentWed, gio_bat_dau: "09:00:00", gio_ket_thuc: "09:30:00" },
    });
    const blockBody = await blockRes.json().catch(() => ({}));
    console.log("Status: " + blockRes.status() + " | Body: " + JSON.stringify(blockBody));

    // Test 2: tuan sau -> phai duoc phep (200 hoac 409 trung lich)
    console.log("[3] Thu dang ky ca truc TUAN SAU (" + dates.nextWed + ") -> ky vong 200 hoac 409...");
    const allowRes = await request.post(BASE_URL + "/api/nhan-vien/lich-lam-viec", {
        headers,
        data: { id_nhan_vien: staffId || "NV001", ngay_lam: dates.nextWed, gio_bat_dau: "09:00:00", gio_ket_thuc: "09:30:00" },
    });
    const allowBody = await allowRes.json().catch(() => ({}));
    console.log("Status: " + allowRes.status() + " | Body: " + JSON.stringify(allowBody));

    // Chup anh man hinh trang lich lam viec
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(FRONTEND_URL + "/dang-nhap", { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2000);
    try { await page.getByPlaceholder("Ten dang nhap").fill("teststaff"); } catch {}
    try { await page.getByPlaceholder("Ten dang nhap").fill("teststaff"); } catch {}
    await page.locator("input[placeholder*='ng nh']").first().fill("teststaff").catch(() => {});
    await page.locator("input[type='password']").first().fill("Password123!").catch(() => {});
    await page.locator("button[type='submit'], button:has-text('ng nh')").first().click().catch(() => {});
    await page.waitForTimeout(3000);
    await page.goto(FRONTEND_URL + "/quan-ly/lich-lam-viec", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: ARTIFACT_DIR + "\\screenshot_schedule_gate.png" });

    // Assertions
    const pass1 = blockRes.status() === 403;
    const pass2 = allowRes.status() === 200 || allowRes.status() === 409;
    console.log("=== KET QUA ===");
    console.log("Tuan hien tai bi chan (403): " + (pass1 ? "PASS" : "FAIL got " + blockRes.status()));
    console.log("Tuan sau duoc phep (200/409): " + (pass2 ? "PASS" : "FAIL got " + allowRes.status()));
    expect(pass1, "Tuan hien tai phai bi chan 403. Got: " + blockRes.status() + " " + JSON.stringify(blockBody)).toBe(true);
    expect(pass2, "Tuan sau phai duoc phep. Got: " + allowRes.status() + " " + JSON.stringify(allowBody)).toBe(true);
});
