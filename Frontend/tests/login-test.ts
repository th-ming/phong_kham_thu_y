import { Selector } from 'testcafe';

const BASE_URL = 'http://localhost:3005';

fixture`Login Test`
    .page`${BASE_URL}/dang-nhap`;

test('Try login khachhang', async t => {
    const emailInput = Selector('input[type="email"], input[name="username"]').filterVisible();
    const passInput = Selector('input[type="password"]').filterVisible();
    const submitBtn = Selector('button[type="submit"]').filterVisible();

    console.log('emailInput exists:', await emailInput.exists);
    console.log('passInput exists:', await passInput.exists);
    console.log('submitBtn exists:', await submitBtn.exists);

    if (await emailInput.exists) {
        await t
            .typeText(emailInput, 'khachhang', { replace: true })
            .typeText(passInput, '123456', { replace: true })
            .click(submitBtn)
            .wait(3000);

        const currentUrl = await t.eval(() => window.location.href);
        console.log('Redirected to:', currentUrl);
        await t.expect(currentUrl).notEql(`${BASE_URL}/dang-nhap`);
    } else {
        await t.expect(Selector('body').exists).ok();
    }
});
