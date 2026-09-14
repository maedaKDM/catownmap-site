# Share landing page

`go.html` and `go.js` handle both `/go` and `/go.html` on Cloudflare Pages.
Run `node tests/share-page.cjs` from the repository root.

Before store release, fill PLAY_STORE_URL and APP_STORE_URL in go.js with the actual public product URLs. Empty values show a coming-soon notice and no dead download button. Only the relevant store appears on phones; desktop shows both stores and a locally generated QR for the same share target. iPad desktop user agents are recognized.

Installed-app opening relies on existing Android App Links and iOS Universal Links. The web fallback offers an explicit custom-scheme button; it does not use a timeout to infer whether an app is installed. Store URLs alone do not provide deferred deep linking: after installation visitors must reopen the original link.

Release checks: verify production signing associations; test installed and uninstalled Android/iOS, including social in-app browsers. The browser cannot reliably detect installation. Do not claim that every browser will open the app automatically.

vendor/qrcode-2.0.4.js is qrcode-generator 2.0.4 by Kazuhiko Arase, from the npm distribution. It runs locally and does not send share links to an external QR service.
