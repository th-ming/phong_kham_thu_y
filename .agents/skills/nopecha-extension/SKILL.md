---
name: nopecha-extension
description: >
  Automated CAPTCHA solver browser extension (NopeCHA). Works with Selenium,
  Puppeteer, Playwright, and more. Supports reCAPTCHA, hCaptcha, Text,
  AWS WAF, Turnstile, and other CAPTCHA types.
allowed-tools: Read, WebFetch, WebSearch
---

# NopeCHA — Automated CAPTCHA Solver

Browser extension for automatic CAPTCHA solving. Supports reCAPTCHA v2/v3, hCaptcha, Text, AWS WAF, Turnstile, and more.

## Installation

- Chrome: https://nopecha.com/chrome
- Firefox: https://nopecha.com/firefox
- Automation build: https://github.com/NopeCHALLC/nopecha-extension/releases

## Automation Build (Pre-configured)

```python
# Download chromium_automation.zip, extract, edit manifest.json:
# "nopecha": { "key": "YOUR_API_KEY" }
```

## Usage with Playwright

```python
import json, os
from playwright.sync_api import sync_playwright

# Load extension with pre-configured key
context = browser.new_context(
    args=[f'--disable-extensions-except={ext_path}',
          f'--load-extension={ext_path}']
)
```

## Key Facts

- GitHub: https://github.com/NopeCHALLC/nopecha-extension
- API: https://developers.nopecha.com
- Free tier available
- Works with Selenium, Puppeteer, Playwright, Botasaurus
