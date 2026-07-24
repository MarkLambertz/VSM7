// B6 — Step VII nested export-panel relay. Step VII (step7-ux.html) embeds the SHARED app-wide export
// panel (export-panel.html) one level deeper and relays it to the shell, so the app's ONE export surface
// works inside Step VII without step7-ux owning any file generation. This drives the real double-embed:
//   shell (top harness)  →  iframe step7-ux  →  iframe export-panel
// DOWN: the shell relays panel commands (openExport/setViewModel/open/exportReady/…) into the Step VII frame.
// UP:   the panel's api:1 export/needViewModel/cancel events are forwarded VERBATIM to the shell.
// The legacy #exportBtn Blob report is intentionally left live (no regression) until Codex's VII generator lands.
const { test, expect } = require('@playwright/test');

const STEP7 = '/design-previews/step7-ux.html';

// Mount step7-ux in a simulated shell (same origin so the nested frames are reachable). The top page
// collects every evt-bearing message (step7-ux's own api:2 events + the forwarded api:1 panel events).
async function mountShell(page) {
  await page.goto(STEP7); // establish the http origin
  await page.setContent(`<!doctype html><meta charset="utf-8">
    <script>
      window.__ev = [];
      addEventListener('message', function (e) { if (e.data && typeof e.data === 'object' && e.data.evt) window.__ev.push(e.data); });
      window.toStep7 = function (cmd) { document.getElementById('f').contentWindow.postMessage(cmd, '*'); };
    </script>
    <iframe id="f" src="${STEP7}" style="width:1100px;height:820px;border:0"></iframe>`);
  const fh = await page.waitForSelector('#f');
  const s7 = await fh.contentFrame();
  await s7.waitForFunction(() => !!(window.STEP7 && window.STEP7.openExport));
  await page.waitForFunction(() => window.__ev.some((e) => e.evt === 'ready' && e.api === 2));
  return s7;
}

async function waitForFrame(page, re) {
  for (let i = 0; i < 60; i++) {
    const f = page.frames().find((fr) => re.test(fr.url()));
    if (f) return f;
    await page.waitForTimeout(50);
  }
  throw new Error('nested frame not found: ' + re);
}

const mark = (page) => page.evaluate(() => window.__ev.length);
async function evtSince(page, base, evt) {
  await page.waitForFunction(({ n, t }) => window.__ev.slice(n).some((e) => e.evt === t), { n: base, t: evt });
  return page.evaluate(({ n, t }) => window.__ev.slice(n).filter((e) => e.evt === t).slice(-1)[0], { n: base, t: evt });
}

test('openExport mounts the shared panel with step7-ux\'s substeps view-model and forwards the export intent to the shell', async ({ page }) => {
  const s7 = await mountShell(page);

  await page.evaluate(() => window.toStep7({ cmd: 'openExport' }));
  // step7-ux mounts the overlay and shows it
  await s7.waitForFunction(() => { const f = document.getElementById('exportFrame'); return !!f && f.style.visibility === 'visible'; });

  const panel = await waitForFrame(page, /export-panel/);
  await panel.waitForSelector('#expanel.on [data-go]');

  // it's the Step VII substeps view-model (7.1–7.7), Word ONLY (flat-text PDF dropped in Stage 2)
  expect(await panel.evaluate(() => [...document.querySelectorAll('#expanel [data-sub]')].length)).toBe(7);
  expect(await panel.evaluate(() => [...document.querySelectorAll('#expanel [data-fmt]')].map((b) => b.dataset.fmt))).toEqual(['docx']); // real OOXML docx (Codex's buildSimpleDocx); no pdf
  expect(await panel.evaluate(() => window.EXPORT.getState().stepId)).toBe('step7');

  // fire Export → the panel's api:1 intent is forwarded VERBATIM up to the shell
  const base = await mark(page);
  await panel.click('#expanel [data-go]');
  const exp = await evtSince(page, base, 'export');
  expect(exp.api).toBe(1);
  expect(exp.stepId).toBe('step7');
  expect(exp.tileId).toBe('all');
  expect(exp.origin).toBe('step');
  expect(exp.format).toBe('docx');
  expect(Array.isArray(exp.target.substeps)).toBe(true);
  expect(exp.target.substeps).toContain('7.1');
  expect(exp.target.substeps).toContain('7.7');

  // panel stays open ("Generating…") because it's embedded; the shell's exportReady closes it + hides the overlay
  expect(await panel.evaluate(() => document.querySelector('#expanel').classList.contains('on'))).toBe(true);
  await page.evaluate((id) => window.toStep7({ cmd: 'exportReady', requestId: id, downloadName: 'Step-VII-Representation.docx' }), exp.requestId);
  await s7.waitForFunction(() => { const f = document.getElementById('exportFrame'); return !!f && f.style.visibility === 'hidden'; });
});

test('needViewModel bubbles up: a shell open for an unknown Step VII target asks the shell for a view-model', async ({ page }) => {
  const s7 = await mountShell(page);
  const base = await mark(page);
  // relay a raw open with no prior setViewModel — the panel can't find it and must ask
  await page.evaluate(() => window.toStep7({ cmd: 'open', stepId: 'step7', tileId: 'no-such-tile' }));
  const need = await evtSince(page, base, 'needViewModel');
  expect(need.api).toBe(1);
  expect(need.stepId).toBe('step7');
  expect(need.tileId).toBe('no-such-tile');
  expect(typeof need.requestId).toBe('string');
});

test('cancel forwards up and hides the overlay; skin relays down to the nested panel', async ({ page }) => {
  const s7 = await mountShell(page);

  // skin down: flip Step VII to deck, the nested panel follows
  await page.evaluate(() => window.toStep7({ cmd: 'setSkin', skin: 'deck' }));
  await page.evaluate(() => window.toStep7({ cmd: 'openExport' }));
  const panel = await waitForFrame(page, /export-panel/);
  await panel.waitForSelector('#expanel.on [data-close]');
  await panel.waitForFunction(() => document.body.dataset.skin === 'deck');

  const base = await mark(page);
  await panel.click('#expanel [data-close]');
  const cancel = await evtSince(page, base, 'cancel');
  expect(cancel.api).toBe(1);
  await s7.waitForFunction(() => { const f = document.getElementById('exportFrame'); return !!f && f.style.visibility === 'hidden'; });
});

test('7.7 org-chart export: org\'s OWN toolbar ⬇ → shared panel → org renderer → ENRICHED export intent (svg artifact) bubbles to the shell', async ({ page }) => {
  const s7 = await mountShell(page);
  // go to 7.7 so the org-chart iframe mounts
  await page.evaluate(() => window.toStep7({ cmd: 'goto', substep: 'org' }));
  const org = await waitForFrame(page, /org-chart/);
  await org.waitForFunction(() => !!(window.ORG && window.ORG.getState)); // org ready

  // UX streamline S3: the separate #orgExportBtn layer button is GONE — one chart, one ⬇ (the org toolbar's own)
  expect(await s7.locator('#orgExportBtn').count()).toBe(0);
  await org.locator('[data-act="export"]').click(); // embedded → requestExportPanel → step7-ux opens the shared panel
  const panel = await waitForFrame(page, /export-panel/);
  await panel.locator('#expanel.on [data-go]').waitFor();
  // png/svg client-rendered + pptx (host wraps our PNG into a deck) — Stage 2
  expect(await panel.locator('#expanel [data-fmt]').evaluateAll((bs) => bs.map((b) => b.dataset.fmt))).toEqual(['png', 'svg', 'pptx']);

  await panel.locator('#expanel [data-fmt="svg"]').click();
  const base = await mark(page);
  await panel.locator('#expanel [data-go]').click();
  // the enriched intent reaches the shell carrying the client-rendered artifact bytes
  const exp = await evtSince(page, base, 'export');
  expect(exp.stepId).toBe('step7');
  expect(exp.tileId).toBe('org-chart');
  expect(exp.format).toBe('svg');
  expect(exp.artifact).toBeTruthy();
  expect(exp.artifact.mimeType).toBe('image/svg+xml');
  expect(exp.artifact.dataUrl).toMatch(/^data:image\/svg\+xml/);
  expect(exp.artifact.suggestedName).toMatch(/org-chart_.*open-accountability-gaps\.svg$/);
});

test('7.7 org-chart export: png path returns a raster (or graceful svg-fallback) data-url artifact', async ({ page }) => {
  const s7 = await mountShell(page);
  await page.evaluate(() => window.toStep7({ cmd: 'goto', substep: 'org' }));
  const org = await waitForFrame(page, /org-chart/);
  await org.waitForFunction(() => !!(window.ORG && window.ORG.getState));

  await org.locator('[data-act="export"]').click(); // org's own toolbar ⬇ → shared panel (S3)
  const panel = await waitForFrame(page, /export-panel/);
  await panel.locator('#expanel.on [data-go]').waitFor();
  await panel.locator('#expanel [data-fmt="png"]').click();
  const base = await mark(page);
  await panel.locator('#expanel [data-go]').click();
  const exp = await evtSince(page, base, 'export');
  expect(exp.artifact).toBeTruthy();
  // png in a real browser; if headless raster fails, the renderer emits the svg fallback (still a valid artifact)
  expect(exp.artifact.dataUrl).toMatch(/^data:image\/(png;base64|svg\+xml)/);
});

test('7.7 org-chart pptx: the USER-chosen format survives as pptx while the org frame renders a PNG for the host to wrap into a deck', async ({ page }) => {
  const s7 = await mountShell(page);
  await page.evaluate(() => window.toStep7({ cmd: 'goto', substep: 'org' }));
  const org = await waitForFrame(page, /org-chart/);
  await org.waitForFunction(() => !!(window.ORG && window.ORG.getState));

  await org.locator('[data-act="export"]').click();
  const panel = await waitForFrame(page, /export-panel/);
  await panel.locator('#expanel.on [data-go]').waitFor();
  await panel.locator('#expanel [data-fmt="pptx"]').click();
  const base = await mark(page);
  await panel.locator('#expanel [data-go]').click();

  const exp = await evtSince(page, base, 'export');
  expect(exp.stepId).toBe('step7');
  expect(exp.tileId).toBe('org-chart');
  expect(exp.format).toBe('pptx');                       // the intent's format is preserved (NOT downgraded to the rendered 'png')
  expect(exp.artifact).toBeTruthy();
  // the host is handed a PNG (or graceful svg-fallback) to wrap into the single-slide 16:9 deck — matches Codex's expected hook
  expect(exp.artifact.mimeType).toMatch(/^image\/(png|svg\+xml)$/);
  expect(exp.artifact.dataUrl).toMatch(/^data:image\/(png;base64|svg\+xml)/);
});

const fs = require('fs');
const path = require('path');
test('Step VII export formats stay in lockstep: step7-ux.html and exportViewModels.js advertise the SAME list (never out of sync)', () => {
  const root = path.resolve(__dirname, '..');
  const s7 = fs.readFileSync(path.join(root, 'design-previews/step7-ux.html'), 'utf8');
  const host = fs.readFileSync(path.join(root, 'src/application/exportViewModels.js'), 'utf8');
  const parse = (s) => s.split(',').map((x) => x.replace(/['"\s]/g, '')).filter(Boolean);
  // step7-ux: step7ExportVm() → availableFormats:[...]
  const s7m = s7.match(/function step7ExportVm\(\)[\s\S]*?availableFormats:\s*\[([^\]]*)\]/);
  // host: getStep7RepresentationExportViewModel(...) → availableFormats: [...]
  const hostm = host.match(/function getStep7RepresentationExportViewModel[\s\S]*?availableFormats:\s*\[([^\]]*)\]/);
  expect(s7m).toBeTruthy();
  expect(hostm).toBeTruthy();
  const s7fmts = parse(s7m[1]);
  const hostFmts = parse(hostm[1]);
  // identical sets — a one-sided edit to either file fails CI (the structural "never out of sync" guard)
  expect(s7fmts.slice().sort()).toEqual(hostFmts.slice().sort());
  expect(s7fmts).toEqual(['docx']); // the agreed Stage 2 result
});
