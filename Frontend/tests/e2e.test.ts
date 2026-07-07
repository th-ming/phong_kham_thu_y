import { Selector, Role } from 'testcafe';

const BASE_URL = 'http://localhost:3005';
const PASSWORD = '123456';

const userInput = Selector('input[data-ai-id="input-dangnhapdangky-8dku"]');
const passInput = Selector('input[data-ai-id="input-dangnhapdangky-h1ru"]');
const loginBtn = Selector('button[data-ai-id="button-dangnhapdangky-xgfa"]');

function createRole(username) {
    return Role(BASE_URL + '/dang-nhap', async t => {
        await t
            .typeText(userInput, username, { replace: true })
            .typeText(passInput, PASSWORD, { replace: true })
            .click(loginBtn)
            .wait(4000);
    }, { preserveUrl: true });
}

const khachHangRole = createRole('khachhang');
const bacSiRole = createRole('bacsi');
const adminRole = createRole('admin');
const quanLyRole = createRole('quanly');
const keToanRole = createRole('ketoan');
const tiepTanRole = createRole('tieptan');
const yTaRole = createRole('yta');

const viewports = [
    { name: 'Laptop-1440', w: 1440, h: 900 },
    { name: 'Laptop-1280', w: 1280, h: 800 },
    { name: 'iPad-Pro', w: 1024, h: 1366 },
    { name: 'iPad-Mini', w: 768, h: 1024 },
    { name: 'iPhone-375', w: 375, h: 812 },
    { name: 'iPhone-414', w: 414, h: 896 },
    { name: 'Landscape', w: 812, h: 375 },
];

viewports.forEach(vp => {
    fixture`Public-${vp.name}`
        .page`${BASE_URL}`
        .beforeEach(async t => t.resizeWindow(vp.w, vp.h));

    test('Homepage', async t => t.expect(Selector('body').exists).ok());
    test('Login', async t => t.navigateTo('/dang-nhap').expect(Selector('body').exists).ok());
    test('About', async t => t.navigateTo('/ve-chung-toi').expect(Selector('body').exists).ok());
    test('Contact', async t => t.navigateTo('/lien-he').expect(Selector('body').exists).ok());
    test('Pricing', async t => t.navigateTo('/bang-gia').expect(Selector('body').exists).ok());
    test('Doctors', async t => t.navigateTo('/bac-si').expect(Selector('body').exists).ok());
});

const custPages = ['/khach-hang/dashboard', '/khach-hang/quan-ly-thu-cung', '/khach-hang/dat-lich-hen',
    '/khach-hang/lich-su-lich-hen', '/khach-hang/ho-so-benh-an', '/khach-hang/hoa-don-thanh-toan',
    '/khach-hang/thong-tin-ca-nhan'];
viewports.forEach(vp => {
    fixture`Customer-${vp.name}`
        .page`${BASE_URL}`
        .beforeEach(async t => { await t.resizeWindow(vp.w, vp.h); await t.useRole(khachHangRole); });
    custPages.forEach(p => {
        test(p.replace('/khach-hang/', ''), async t => t.navigateTo(p).expect(Selector('body').exists).ok());
    });
});

const staffPages = ['/quan-ly/dashboard', '/quan-ly/lich-lam-viec', '/quan-ly/thong-tin-ca-nhan',
    '/quan-ly/lich-hen', '/quan-ly/khach-hang-thu-cung', '/quan-ly/ho-so-benh-an',
    '/quan-ly/kham-benh', '/quan-ly/don-thuoc', '/quan-ly/xet-nghiem', '/quan-ly/file-dinh-kem',
    '/quan-ly/hoa-don', '/quan-ly/ke-toan', '/quan-ly/bao-cao-thong-ke', '/quan-ly/nhap-kho',
    '/quan-ly/kho-thuoc', '/quan-ly/nhan-vien-phan-quyen', '/quan-ly/cau-hinh', '/quan-ly/chuc-nang',
    '/quan-ly/dich-vu', '/quan-ly/marketing'];
const desktopVp = viewports.filter(v => v.w >= 1024);
desktopVp.forEach(vp => {
    fixture`Doctor-${vp.name}`
        .page`${BASE_URL}`
        .beforeEach(async t => { await t.resizeWindow(vp.w, vp.h); await t.useRole(bacSiRole); });
    staffPages.forEach(p => { test(p.replace('/quan-ly/', ''), async t => t.navigateTo(p).expect(Selector('body').exists).ok()); });
});
desktopVp.forEach(vp => {
    fixture`Admin-${vp.name}`
        .page`${BASE_URL}`
        .beforeEach(async t => { await t.resizeWindow(vp.w, vp.h); await t.useRole(adminRole); });
    staffPages.forEach(p => { test(p.replace('/quan-ly/', ''), async t => t.navigateTo(p).expect(Selector('body').exists).ok()); });
});
['ketoan', 'tieptan', 'yta', 'quanly'].forEach(role => {
    const displayName = role === 'ketoan' ? 'Finance' : role === 'tieptan' ? 'Reception' : role === 'yta' ? 'Nurse' : 'Manager';
    const roleObj = role === 'ketoan' ? keToanRole : role === 'tieptan' ? tiepTanRole : role === 'yta' ? yTaRole : quanLyRole;
    desktopVp.forEach(vp => {
        fixture`${displayName}-${vp.name}`
            .page`${BASE_URL}`
            .beforeEach(async t => { await t.resizeWindow(vp.w, vp.h); await t.useRole(roleObj); });
        staffPages.forEach(p => { test(p.replace('/quan-ly/', ''), async t => t.navigateTo(p).expect(Selector('body').exists).ok()); });
    });
});
