---
name: testcafe
description: >
  Open-source end-to-end testing framework by DevExpress for web applications.
  Use this skill when the user needs to write, run, or debug TestCafe tests.
  No WebDriver required — runs on Node.js with built-in automatic waiting,
  cross-browser support, and smart assertions.
allowed-tools: Read, WebFetch, WebSearch
---

# TestCafe — E2E Testing Framework

TestCafe is a Node.js-based end-to-end testing framework by DevExpress. No WebDriver needed.

## Installation

```bash
npm install -g testcafe
# or locally
npm install --save-dev testcafe
```

## Quick Start

```ts
import { Selector } from 'testcafe';

fixture('Getting Started')
  .page('https://example.com');

test('My first test', async t => {
  await t
    .typeText('#username', 'John')
    .click('#submit')
    .expect(Selector('#result').innerText).eql('Welcome, John!');
});
```

## Run Tests

```bash
# Chromium
testcafe chrome tests/
# All browsers
testcafe chrome,firefox,edge tests/
# Headless
testcafe chromium:headless tests/
# Mobile emulation
testcafe "chrome:emulation:device=iPhone X" tests/
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| `fixture` | Test group with shared page URL |
| `test` | Individual test case |
| `Selector` | Find DOM elements (CSS, text, etc.) |
| `t` | Test controller — chainable API |
| `Role` | Login/logout presets for auth |

## Key Features

- **No WebDriver** — uses CDP for Chromium, reverse proxy for other browsers
- **Automatic waiting** — no manual timeouts for XHR, DOM, assertions
- **Smart assertions** — retry until pass or timeout
- **Cross-browser** — Chrome, Firefox, Edge, Safari, mobile, cloud (BrowserStack, SauceLabs)
- **Concurrent execution** — parallel test runs
- **Page Model** — pattern support
- **Client Scripts** — inject custom JS into page
- **iframe & multi-window** support

## Useful Commands

```bash
testcafe chrome tests/             # Run tests
testcafe chrome tests/ --live      # Live mode (reload on change)
testcafe chrome tests/ --debug-mode # Debug with devtools
testcafe chrome tests/ --speed 0.5 # Slow down execution
```

## Page Model Pattern

```ts
import { Selector, t } from 'testcafe';

class LoginPage {
  username = Selector('#username');
  password = Selector('#password');
  submit  = Selector('#login-btn');

  async login(user: string, pass: string) {
    await t
      .typeText(this.username, user)
      .typeText(this.password, pass)
      .click(this.submit);
  }
}
```

## Links

- Docs: https://testcafe.io/documentation
- GitHub: https://github.com/DevExpress/testcafe
- npm: https://www.npmjs.com/package/testcafe
