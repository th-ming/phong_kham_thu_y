import { test } from '@playwright/test';
import * as path from 'path';

test('Chup lai trang chu voi chu meo chuoi chay quanh', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    await page.goto('http://localhost:3005/');
    console.log('Da mo trang chu, di chuot de meo chuoi chay...');
    await page.waitForTimeout(3000);

    // Di chuot qua lai tren man hinh de kich hoat animation meo chuoi duoi theo
    await page.mouse.move(100, 100);
    await page.waitForTimeout(500);
    await page.mouse.move(500, 400);
    await page.waitForTimeout(500);
    await page.mouse.move(900, 200);
    await page.waitForTimeout(500);
    await page.mouse.move(300, 600);
    await page.waitForTimeout(4000); // Cho meo chuoi chay ra giua man hinh

    // Chup anh man hinh hien tai (khong fullPage de meo chuoi ro net tren viewport)
    await page.screenshot({ path: path.join(OUT, 'trang chu.png') });
    console.log('Da chup trang chu voi meo chuoi!');
});
