# asset-tests — browser tests for the standalone front-end assets

Isolated, self-contained [Playwright](https://playwright.dev) suite for the standalone
HTML assets (`../e2e-robustness-check.html`, and later `../vsm.html`).

**Why separate.** The main VSM7 repo is intentionally dependency-free (`node --test`),
and `tests/` + the root `package.json` are Codex's lane. But these assets are SVG / DOM /
event heavy, and the bugs that matter (e.g. a colour set via an SVG `fill` *attribute*
that CSS overrides, or a double-click broken by re-render timing) are only visible to a
**real browser** asserting on *computed* style and real events — which `node --test`
(Node, no DOM) cannot do. So this lives in its own folder with its own `package.json` and
never touches the main repo or Codex's tests.

## Run

```bash
cd asset-tests
npm run setup     # one-time: installs @playwright/test + the Chromium binary
npm test          # runs the suite (headless)
npm run test:headed   # watch it drive a real browser
```

`npm test` auto-starts a tiny static server (`serve.js`, rooted at the repo root) so the
assets load over http — required for the same-origin iframe bridge test.

## What it covers (`e2e-robustness.spec.js`)

Render basics · arrow presence + from→to direction · panel = SCT + Properties only ·
single-click select vs **double-click edit-in-box** · Enter-to-edit · **colour swatch
repaints the box (computed style) + reset** · selection ring on a coloured box · input +
output ports · **connection re-route** by dragging an end · delete (node + its links) ·
double-click-empty add + undo · Full/Fit view modes · contributions palette places a step
with `contribId` · **bridge** `window.E2E` drives lanes/SCT + emits `change` · **real
iframe** `ready` handshake + host-driven update.
