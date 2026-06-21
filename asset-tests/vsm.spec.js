// Real-browser regression suite for the standalone vsm.html VSM diagram.
// Covers the full-screen control ported from the E2E editor (window.VSM bridge).
const { test, expect } = require('@playwright/test');

const PAGE = '/vsm.html';

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForSelector('#stagewrap svg');
  await page.waitForFunction(() => !!(window.VSM && window.VSM.getState));
});

test('full screen: button + F request it, Cmd/Ctrl+F is ignored, and the host is notified', async ({ page }) => {
  await expect(page.locator('#zoomctl #btnFs svg path')).toHaveCount(1); // toggle button with an icon, at the top of the zoom widget
  // actual engagement is environment-dependent — spy the API to assert the wiring
  await page.evaluate(() => { window.__fs = 0; document.documentElement.requestFullscreen = () => { window.__fs++; return Promise.resolve(); }; });
  await page.locator('#btnFs').click();
  expect(await page.evaluate(() => window.__fs)).toBe(1);
  await page.evaluate(() => { window.__fs = 0; });
  await page.keyboard.press('f');
  expect(await page.evaluate(() => window.__fs)).toBe(1);
  await page.evaluate(() => { window.__fs = 0; });
  await page.keyboard.press('Control+f'); // reserved for the browser's find — must not toggle
  expect(await page.evaluate(() => window.__fs)).toBe(0);
  // host bridge: exit works without a user gesture
  const exitCalls = await page.evaluate(() => { let c = 0; document.exitFullscreen = () => { c++; return Promise.resolve(); }; window.VSM.fullscreen(false); return c; });
  expect(exitCalls).toBe(1);
  // host is notified on fullscreenchange
  const emitted = await page.evaluate(() => new Promise((res) => {
    window.VSM.onEmit = (msg) => { if (msg && msg.evt === 'fullscreenchange') res(msg); };
    document.dispatchEvent(new Event('fullscreenchange'));
  }));
  expect(emitted).toHaveProperty('fullscreen');
});

test('channel highlight: highlight(els) keeps the named elements, dims everything else; null clears', async ({ page }) => {
  await page.evaluate(() => window.VSM.setChannels({ a: true, b: true, c: true, d: true, e: true, f: true, g: true }));
  const op = (sel) => page.evaluate((s) => { const el = document.querySelector(s); return el ? (el.style.opacity || '1') : null; }, sel);
  // S2–S1 view: show the coordination channel + the S2 triangle only; S5/S4/S3/S3* recede
  await page.evaluate(() => window.VSM.highlight(['f', 's2']));
  expect(await op('[data-lyr="f"]')).toBe('1');
  expect(await op('[data-hl="s2"]')).toBe('1');
  expect(await op('[data-hl="s5box"]')).toBe('0.1');
  expect(await op('[data-hl="s4box"]')).toBe('0.1');
  expect(await op('[data-hl="s3"]')).toBe('0.1');
  expect(await op('[data-hl="s3s"]')).toBe('0.1');
  expect(await op('[data-lyr="e"]')).toBe('0.1');
  expect(await op('[data-hl="sp54"]')).toBe('0.1');   // blue S5↔S4 spine hidden
  expect(await op('[data-hl="sp43"]')).toBe('0.1');   // green S4↔S3 spine hidden
  expect(await op('[data-hl="feed3s"]')).toBe('0.1'); // left S3→S3* elbow hidden
  // a different loop keeps different systems: the S3–S4 homeostat shows the S3 + S4 boxes
  await page.evaluate(() => window.VSM.highlight(['h34', 's3', 's4box']));
  expect(await op('#shp-red')).toBe('1');
  expect(await op('[data-hl="s3"]')).toBe('1');
  expect(await op('[data-hl="s4box"]')).toBe('1');
  expect(await op('[data-hl="s5box"]')).toBe('0.1');
  expect(await op('[data-lyr="f"]')).toBe('0.1');
  expect(await op('[data-lyr="units"]')).toBe('0.1'); // metasystem loop hides the S1 units
  // null → back to the default view, everything full
  await page.evaluate(() => window.VSM.highlight(null));
  expect(await op('[data-lyr="f"]')).toBe('1');
  expect(await op('[data-hl="s5box"]')).toBe('1');
  expect(await op('[data-hl="s2"]')).toBe('1');
  expect(await op('[data-lyr="units"]')).toBe('1');
});

test('full screen: F is ignored while typing in a field', async ({ page }) => {
  await page.evaluate(() => { window.__fs = 0; document.documentElement.requestFullscreen = () => { window.__fs++; return Promise.resolve(); }; });
  await page.evaluate(() => { const i = document.createElement('input'); i.id = '__t'; document.body.appendChild(i); i.focus(); });
  await page.locator('#__t').press('f');
  expect(await page.evaluate(() => window.__fs)).toBe(0);
});
