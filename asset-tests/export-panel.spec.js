// Real-browser regression suite for the app-wide Export panel (design-previews/export-panel.html —
// the ONE shared export surface, opened at tile / step / app tiers across Steps I–VII + Implementation).
// Focus: the window.EXPORT (api:1) bridge as Codex will actually drive it — mounted as an iframe overlay,
// driven purely over postMessage, rendering PURELY from a host-supplied view-model.
//   HOST → panel : setViewModel · open · setBundle · setSkin · close · exportReady · exportError
//   panel → HOST : ready · needViewModel · export · cancel · resize
// The panel never reaches into canonical host state; Codex authors getExportViewModel(...) → vm.
const { test, expect } = require('@playwright/test');

const PAGE = '/design-previews/export-panel';

// A Codex-shaped (contract) view-model — availableFormats/availableScopes/availableIncludes are
// load-bearing host truth. Deliberately NOT the panel's internal shape, to prove normalizeVm().
const CONTRACT_VM = {
  stepId: 'step3', tileId: 'sct-014', title: 'SCT-014 · detail', kind: 'list', count: 1,
  unitNoun: 'SCT', monolithic: true, defaultPreset: 'memo',
  availableFormats: ['pdf', 'docx'],
  availableScopes: [{ kind: 'tile', label: 'This SCT', count: 1 }],
  availableIncludes: ['notes', 'owners', 'gaps'],
  project: { name: 'Transformation 2026', date: '2026-07-21' },
};

// Mount the panel the way the host will: a same-origin iframe overlay. The parent collects every
// panel→HOST event into window.__ev and can push HOST→panel commands with window.send(cmd).
async function mount(page) {
  await page.goto(PAGE); // establish the http origin so the iframe is same-origin
  await page.setContent(`<!doctype html><meta charset="utf-8">
    <script>
      window.__ev = [];
      addEventListener('message', function (e) {
        if (e.data && typeof e.data === 'object' && e.data.api === 1 && e.data.evt) window.__ev.push(e.data);
      });
      window.send = function (cmd) { document.getElementById('f').contentWindow.postMessage(cmd, '*'); };
    </script>
    <iframe id="f" src="${PAGE}" style="width:480px;height:720px;border:0"></iframe>`);
  const fh = await page.waitForSelector('#f');
  const frame = await fh.contentFrame();
  await frame.waitForFunction(() => !!(window.EXPORT && window.EXPORT.api === 1));
  return frame;
}

const lastOf = (page, evt) => page.evaluate((t) => (window.__ev.filter((e) => e.evt === t).slice(-1)[0] || null), evt);
// cross-frame postMessage is delivered async — capture a baseline index, act, then await the next
// event of a given type past that baseline (robust when the same evt fires more than once per test).
const mark = (page) => page.evaluate(() => window.__ev.length);
async function evtSince(page, base, evt) {
  await page.waitForFunction(({ n, t }) => window.__ev.slice(n).some((e) => e.evt === t), { n: base, t: evt });
  return page.evaluate(({ n, t }) => window.__ev.slice(n).filter((e) => e.evt === t).slice(-1)[0], { n: base, t: evt });
}

test('boot handshake: emits ready{api:1} and a resize on load, and enters embed mode', async ({ page }) => {
  const frame = await mount(page);
  await page.waitForFunction(() => window.__ev.some((e) => e.evt === 'ready'));
  const ready = await lastOf(page, 'ready');
  expect(ready).toEqual({ evt: 'ready', api: 1 });
  const resize = await lastOf(page, 'resize');
  expect(resize.api).toBe(1);
  expect(resize.height).toBeGreaterThan(0);
  // embedded: the demo shell collapses, only the overlay remains
  expect(await frame.evaluate(() => document.body.classList.contains('embed'))).toBe(true);
  expect(await frame.evaluate(() => getComputedStyle(document.querySelector('.shell')).display)).toBe('none');
});

test('open unknown target → skeleton + needViewModel; setViewModel then renders from the contract vm', async ({ page }) => {
  const frame = await mount(page);

  const b0 = await mark(page);
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step3', tileId: 'sct-014' }));
  await frame.waitForFunction(() => /Preparing/.test(document.querySelector('#expanel').textContent));
  const need = await evtSince(page, b0, 'needViewModel');
  expect(need).toMatchObject({ evt: 'needViewModel', api: 1, stepId: 'step3', tileId: 'sct-014' });
  expect(typeof need.requestId).toBe('string');

  // host supplies the view-model → panel renders ONLY what it advertises
  await page.evaluate((vm) => window.send({ cmd: 'setViewModel', stepId: 'step3', tileId: 'sct-014', vm }), CONTRACT_VM);
  await frame.waitForFunction(() => !!document.querySelector('#expanel [data-fmt]'));
  const fmts = await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-fmt]')].map((b) => b.dataset.fmt));
  const incs = await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-inc]')].map((b) => b.dataset.inc));
  expect(fmts).toEqual(['pdf', 'docx']);          // exactly availableFormats
  expect(incs).toEqual(['notes', 'owners', 'gaps']); // exactly availableIncludes
  // format-led (no Purpose model): default format = first advertised; every available include defaults ON
  const on = await frame.evaluate(() => window.EXPORT.getState());
  expect(on.preset).toBeUndefined();
  expect(on.fmt).toBe('pdf');
  expect(Object.keys(on.inc).filter((k) => on.inc[k]).sort()).toEqual(['gaps', 'notes', 'owners']);
});

test('unavailable targets are honest: no fake data is advertised for a monolithic single-format vm', async ({ page }) => {
  const frame = await mount(page);
  await page.evaluate(() => window.send({
    cmd: 'setViewModel', stepId: 'step2', tileId: 'manageability',
    vm: { stepId: 'step2', tileId: 'manageability', title: 'Manageability', kind: 'matrix', count: 6,
      monolithic: true, defaultPreset: 'memo', availableFormats: ['pdf'],
      availableScopes: [{ kind: 'step', label: 'Whole step', count: 6 }], availableIncludes: ['warnings', 'gaps'] },
  }));
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step2', tileId: 'manageability' }));
  await frame.waitForFunction(() => !!document.querySelector('#expanel [data-fmt]'));
  // monolithic → no per-item selection scope offered; only the advertised includes appear
  const scopes = await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-scope]')].map((b) => b.dataset.scope));
  const incs = await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-inc]')].map((b) => b.dataset.inc));
  expect(scopes).not.toContain('selection');
  expect(incs).toEqual(['warnings', 'gaps']);
});

test('export intent: firing Export posts the api:1 intent up (wire-id stepId, 7 boolean options)', async ({ page }) => {
  const frame = await mount(page);
  // step3/scts is a demo-seeded target (data/xlsx default) — the accepted first slice
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step3', tileId: 'scts' }));
  await frame.waitForSelector('#expanel.on [data-go]');
  const b0 = await mark(page);
  await frame.click('#expanel [data-go]');

  const exp = await evtSince(page, b0, 'export');
  expect(exp.evt).toBe('export');
  expect(exp.api).toBe(1);
  expect(exp.origin).toBe('tile');
  expect(exp.stepId).toBe('step3'); // wire id, NOT Roman "stepIII"
  expect(exp.stepId).toMatch(/^step[1-7]$|^implementation$/);
  expect(exp.tileId).toBe('scts');
  expect(exp.format).toBe('xlsx'); // format-led: default = first advertised format (scts → xlsx)
  expect(exp.preset).toBe(null); // Purpose model removed — intent always carries preset:null
  expect(Object.keys(exp.options).sort()).toEqual(['gaps', 'notes', 'owners', 'provenance', 'scores', 'timestamps', 'warnings']);
  expect(Object.values(exp.options).every((v) => typeof v === 'boolean')).toBe(true); // clean booleans, not a 0/true mix
  expect(exp.options.owners).toBe(true); // every available include defaults ON…
  expect(exp.options.notes).toBe(true);  // …including notes (no preset narrows them now)
  expect(typeof exp.requestId).toBe('string');
  expect(typeof exp.filename).toBe('string');
  expect(exp.skin).toBe('workshop');
  // embedded: the panel stays open showing a "Generating…" state until the host answers
  expect(await frame.evaluate(() => document.querySelector('#expanel').classList.contains('on'))).toBe(true);
  expect(await frame.evaluate(() => /Generating/.test(document.querySelector('.ex-foot').textContent))).toBe(true);
});

test('exportReady closes the panel; exportError keeps it open with a failure banner (embedded path)', async ({ page }) => {
  const frame = await mount(page);

  // success round-trip
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step3', tileId: 'scts' }));
  await frame.waitForSelector('#expanel.on [data-go]');
  let b = await mark(page);
  await frame.click('#expanel [data-go]');
  let exp = await evtSince(page, b, 'export');
  await page.evaluate((id) => window.send({ cmd: 'exportReady', requestId: id, downloadName: 'VSM7_demo.xlsx' }), exp.requestId);
  await frame.waitForFunction(() => !document.querySelector('#expanel').classList.contains('on'));

  // failure round-trip — this is the branch standalone can't exercise
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step3', tileId: 'scts' }));
  await frame.waitForSelector('#expanel.on [data-go]');
  b = await mark(page);
  await frame.click('#expanel [data-go]');
  exp = await evtSince(page, b, 'export');
  await page.evaluate((id) => window.send({ cmd: 'exportError', requestId: id, message: 'generator not ready' }), exp.requestId);
  await frame.waitForFunction(() => /Export failed/.test(document.querySelector('#expanel').textContent));
  expect(await frame.evaluate(() => document.querySelector('#expanel').classList.contains('on'))).toBe(true);
});

test('cancel + skin relay: closing emits cancel{api:1}; setSkin flips the panel theme', async ({ page }) => {
  const frame = await mount(page);
  await page.evaluate(() => window.send({ cmd: 'setSkin', skin: 'deck' }));
  await frame.waitForFunction(() => document.body.dataset.skin === 'deck');

  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step3', tileId: 'scts' }));
  await frame.waitForSelector('#expanel.on [data-close]');
  const b0 = await mark(page);
  await frame.click('#expanel [data-close]');
  const cancel = await evtSince(page, b0, 'cancel');
  expect(cancel).toEqual({ evt: 'cancel', api: 1 });
  expect(await frame.evaluate(() => document.querySelector('#expanel').classList.contains('on'))).toBe(false);
});

test('app bundle: setBundle enumeration + substep-style targets keep opaque, wire-id references', async ({ page }) => {
  const frame = await mount(page);
  // app tier: the workspace bundle vm is demo-seeded (implementation/workspace)
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'implementation', tileId: 'workspace' }));
  await frame.waitForSelector('#expanel.on [data-go]');
  const b0 = await mark(page);
  await frame.click('#expanel [data-go]');
  const exp = await evtSince(page, b0, 'export');
  expect(exp.origin).toBe('app');
  expect(exp.scope).toBe('bundle');
  expect(exp.stepId).toBe('implementation');
  expect(Array.isArray(exp.target.bundle)).toBe(true);
  // every bundle ref carries a wire-id stepId, never a Roman numeral
  for (const b of exp.target.bundle) expect(b.stepId).toMatch(/^step[1-7]$|^implementation$/);
});

test('setBundle manifest actually drives the app bundle — checklist + target.bundle come from the host, not the panel steps', async ({ page }) => {
  const frame = await mount(page);
  const MANIFEST = [
    { stepId: 'step1', tileId: 'units', scope: 'tile', label: 'Just the units' },
    { stepId: 'step3', tileId: 'scts', scope: 'step' },
  ];
  await page.evaluate((bundle) => window.send({ cmd: 'setBundle', bundle }), MANIFEST);
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'implementation', tileId: 'workspace' }));
  await frame.waitForSelector('#expanel.on [data-go]');
  // the checklist reflects the host manifest (2 rows), not the panel's 8-step list
  const rows = await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-bund]')].map((n) => n.textContent.trim()));
  expect(rows.length).toBe(2);
  expect(rows[0]).toContain('Just the units'); // custom label honored
  const b0 = await mark(page);
  await frame.click('#expanel [data-go]');
  const exp = await evtSince(page, b0, 'export');
  expect(exp.target.bundle).toEqual([
    { stepId: 'step1', tileId: 'units', scope: 'tile' },
    { stepId: 'step3', tileId: 'scts', scope: 'step' },
  ]);
});

test('renders for a host stepId outside the built-in list (overview/app tiers) — no stepById crash', async ({ page }) => {
  const frame = await mount(page);
  // Codex's Batch A emits stepId "overview" (and B7 will emit "app") — neither is in the panel's step1..step7/implementation list.
  await page.evaluate(() => window.send({
    cmd: 'setViewModel', stepId: 'overview', tileId: 'overview-project-frame',
    vm: { stepId: 'overview', tileId: 'overview-project-frame', title: 'Project Frame', kind: 'canvas', count: 1,
      monolithic: true, defaultPreset: 'doc', availableFormats: ['docx'],
      availableScopes: [{ kind: 'tile', label: 'This tile', count: 1 }], availableIncludes: [] },
  }));
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'overview', tileId: 'overview-project-frame' }));
  await frame.waitForSelector('#expanel.on [data-go]'); // renders (would throw on stepById(undefined).name/.rom before the fix)
  expect(await frame.evaluate(() => document.querySelector('#expanel [data-fmt]').dataset.fmt)).toBe('docx');
  expect(await frame.evaluate(() => document.querySelector('#expanel .lab').textContent)).toBe('Export'); // no "· Step X" for a non-numbered surface
  expect(await frame.evaluate(() => document.querySelector('#fname').value)).toMatch(/overview/i); // filename falls back to the stepId
  const exp = await (async () => { const b = await mark(page); await frame.click('#expanel [data-go]'); return evtSince(page, b, 'export'); })();
  expect(exp.stepId).toBe('overview'); // echoed back verbatim
});

test('B7 app-tier readiness: renders the app scope with docx + json formats (origin:app), no crash on unknown formats', async ({ page }) => {
  const frame = await mount(page);
  // the exact shape the host emits — reserved stepId "app", origin "app" (exportViewModels.js app tier advertises docx+json; legacy 'doc' is retired)
  await page.evaluate(() => window.send({
    cmd: 'setViewModel', stepId: 'app', tileId: null,
    vm: { stepId: 'app', tileId: null, title: 'Whole workshop', kind: 'canvas', count: 1,
      monolithic: true, defaultPreset: 'appendix', availableFormats: ['docx', 'json'],
      availableScopes: [{ kind: 'step', label: 'Whole project', count: 1 }], availableIncludes: ['notes', 'warnings', 'gaps'] },
  }));
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'app', tileId: null, origin: 'app' }));
  await frame.waitForSelector('#expanel.on [data-go]'); // renders — json doesn't crash the format row
  expect(await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-fmt]')].map((b) => b.dataset.fmt))).toEqual(['docx', 'json']);
  // json renders a real label, not "undefined"
  await frame.click('#expanel [data-fmt="json"]');
  expect(await frame.evaluate(() => document.querySelector('#expanel .btn.primary').textContent)).toContain('JSON');
  expect(await frame.evaluate(() => document.querySelector('#expanel .preview .psum').textContent)).toContain('JSON');
  // intent echoes the app tier verbatim
  const b = await mark(page);
  await frame.click('#expanel [data-go]');
  const exp = await evtSince(page, b, 'export');
  expect(exp.stepId).toBe('app');
  expect(exp.origin).toBe('app');
  expect(exp.format).toBe('json');
});

test('Step VI async readiness: renders svg/png/pdf/pptx and holds "Generating…" through a DELAYED async exportReady', async ({ page }) => {
  const frame = await mount(page);
  // step6-e2e is iframe-backed/async — the host reply arrives seconds later after the live render
  await page.evaluate(() => window.send({
    cmd: 'setViewModel', stepId: 'step6', tileId: 'step6-e2e',
    vm: { stepId: 'step6', tileId: 'step6-e2e', title: 'E2E robustness routes', kind: 'canvas', count: 6,
      monolithic: true, defaultPreset: 'exec', availableFormats: ['svg', 'png', 'pdf', 'pptx'],
      availableScopes: [{ kind: 'tile', label: 'This tile', count: 6 }], availableIncludes: [] },
  }));
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step6', tileId: 'step6-e2e' }));
  await frame.waitForSelector('#expanel.on [data-go]');
  expect(await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-fmt]')].map((b) => b.dataset.fmt))).toEqual(['svg', 'png', 'pdf', 'pptx']);
  await frame.click('#expanel [data-fmt="pptx"]'); // the slow one
  const b = await mark(page);
  await frame.click('#expanel [data-go]');
  const exp = await evtSince(page, b, 'export');
  expect(exp.format).toBe('pptx');
  expect(exp.stepId).toBe('step6');
  // async: the drawer STAYS open in "Generating…" while the host drives the iframe
  expect(await frame.evaluate(() => document.querySelector('#expanel').classList.contains('on'))).toBe(true);
  expect(await frame.evaluate(() => /Generating/.test(document.querySelector('.ex-foot').textContent))).toBe(true);
  // a genuinely delayed reply (matching requestId) still closes it cleanly
  await page.waitForTimeout(500);
  await page.evaluate((id) => window.send({ cmd: 'exportReady', requestId: id, downloadName: 'e2e-routes.pptx' }), exp.requestId);
  await frame.waitForFunction(() => !document.querySelector('#expanel').classList.contains('on'));
});

test('Step VI honesty: the channels tile advertises svg/png only — no blank pdf/pptx promise', async ({ page }) => {
  const frame = await mount(page);
  await page.evaluate(() => window.send({
    cmd: 'setViewModel', stepId: 'step6', tileId: 'step6-channels',
    vm: { stepId: 'step6', tileId: 'step6-channels', title: 'Channel variety', kind: 'matrix', count: 8,
      monolithic: true, defaultPreset: 'exec', availableFormats: ['svg', 'png'],
      availableScopes: [{ kind: 'tile', label: 'This tile', count: 8 }], availableIncludes: [] },
  }));
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step6', tileId: 'step6-channels' }));
  await frame.waitForSelector('#expanel.on [data-go]');
  expect(await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-fmt]')].map((b) => b.dataset.fmt))).toEqual(['svg', 'png']);
});

test('format-led open: the panel defaults to the FIRST advertised format, every include ON, no crash (defaultPreset ignored)', async ({ page }) => {
  const frame = await mount(page);
  await page.evaluate(() => window.send({
    cmd: 'setViewModel', stepId: 'step4', tileId: 'contrib-x',
    vm: { stepId: 'step4', tileId: 'contrib-x', title: 'Contribution rows', kind: 'matrix', count: 9,
      // defaultPreset deliberately omitted — the panel no longer uses it
      availableFormats: ['xlsx', 'pdf'],
      availableScopes: [{ kind: 'step', label: 'Whole step', count: 9 }],
      availableIncludes: ['scores', 'owners'] },
  }));
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step4', tileId: 'contrib-x' }));
  await frame.waitForSelector('#expanel.on [data-go]');
  const st = await frame.evaluate(() => window.EXPORT.getState());
  expect(st.preset).toBeUndefined();           // no purpose concept survives in state
  expect(st.fmt).toBe('xlsx');                  // first advertised format
  expect(Object.keys(st.inc).filter((k) => st.inc[k]).sort()).toEqual(['owners', 'scores']); // all available includes ON
  // and the Purpose section itself is gone from the DOM
  expect(await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-preset]')].length)).toBe(0);
  expect(await frame.evaluate(() => document.querySelector('#expanel').textContent.includes('Purpose'))).toBe(false);
  expect(await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-fmt]')].length)).toBe(2);
});

test('selection scope round-trips: target.selection carries the vm selection refs (opaque {kind,id})', async ({ page }) => {
  const frame = await mount(page);
  await page.evaluate(() => window.send({
    cmd: 'setViewModel', stepId: 'step3', tileId: 'scts-sel',
    vm: { stepId: 'step3', tileId: 'scts-sel', title: 'SCTs (selectable)', kind: 'list', count: 22, unitNoun: 'SCTs',
      defaultPreset: 'data', availableFormats: ['xlsx', 'pdf'],
      availableScopes: [{ kind: 'tile', label: 'This tile', count: 22 }, { kind: 'selection', label: 'Selected', count: 2 }, { kind: 'step', label: 'Whole step', count: 22 }],
      availableIncludes: ['scores', 'owners'],
      selection: [{ kind: 'sct', id: 'SCT-003', label: 'Demand sensing' }, { kind: 'sct', id: 'SCT-007', label: 'Capacity balancing' }] },
  }));
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step3', tileId: 'scts-sel' }));
  await frame.waitForSelector('#expanel.on [data-scope="selection"]');
  await frame.click('#expanel [data-scope="selection"]');
  const b0 = await mark(page);
  await frame.click('#expanel [data-go]');
  const exp = await evtSince(page, b0, 'export');
  expect(exp.scope).toBe('selection');
  expect(exp.target.selection).toEqual([
    { kind: 'sct', id: 'SCT-003' }, // label dropped — opaque ref only
    { kind: 'sct', id: 'SCT-007' },
  ]);
});

test('requestId correlation: a stale exportReady is ignored; only the in-flight reply acts on the drawer', async ({ page }) => {
  const frame = await mount(page);
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step3', tileId: 'scts' }));
  await frame.waitForSelector('#expanel.on [data-go]');
  const b0 = await mark(page);
  await frame.click('#expanel [data-go]');
  const exp = await evtSince(page, b0, 'export');
  // a reply for a DIFFERENT (superseded/cancelled) request must not close the drawer
  await page.evaluate(() => window.send({ cmd: 'exportReady', requestId: 'req-bogus-999', downloadName: 'wrong.xlsx' }));
  await page.waitForTimeout(120);
  expect(await frame.evaluate(() => document.querySelector('#expanel').classList.contains('on'))).toBe(true);
  // the real in-flight reply closes it
  await page.evaluate((id) => window.send({ cmd: 'exportReady', requestId: id, downloadName: 'right.xlsx' }), exp.requestId);
  await frame.waitForFunction(() => !document.querySelector('#expanel').classList.contains('on'));
});

// Phase 0 parity — pins the EXACT conservative view-model Codex shipped in the host (handoff §H:
// step3/scts → xlsx only, scopes tile/selection/step, availableIncludes notes+provenance, opaque {kind:'sct',id}
// selection refs). Guards the landed integration against future surface drift.
test('Phase 0 parity: the panel round-trips Codex\'s real landed step3/scts view-model (§H)', async ({ page }) => {
  const frame = await mount(page);
  const CODEX_SCTS = {
    stepId: 'step3', tileId: 'scts', title: 'SCT Register', kind: 'list', count: 22, unitNoun: 'SCTs',
    defaultPreset: null, // §H is silent on defaultPreset — null is contract-valid and must still resolve to xlsx
    availableFormats: ['xlsx'],
    availableScopes: [
      { kind: 'tile', label: 'This tile', count: 22 },
      { kind: 'selection', label: 'Selected', count: 3 },
      { kind: 'step', label: 'Whole step', count: 22 },
    ],
    availableIncludes: ['notes', 'provenance'],
    selection: [
      { kind: 'sct', id: 'sct-1', label: 'A' },
      { kind: 'sct', id: 'sct-2', label: 'B' },
      { kind: 'sct', id: 'sct-3', label: 'C' },
    ],
  };
  await page.evaluate((vm) => window.send({ cmd: 'setViewModel', stepId: 'step3', tileId: 'scts', vm }), CODEX_SCTS);
  await page.evaluate(() => window.send({ cmd: 'open', stepId: 'step3', tileId: 'scts' }));
  await frame.waitForSelector('#expanel.on [data-go]');

  // advertises ONLY what the host vm carries: xlsx, the three scopes, the two real includes
  expect(await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-fmt]')].map((b) => b.dataset.fmt))).toEqual(['xlsx']);
  expect(await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-scope]')].map((b) => b.dataset.scope))).toEqual(['tile', 'selection', 'step']);
  expect(await frame.evaluate(() => [...document.querySelectorAll('#expanel [data-inc]')].map((b) => b.dataset.inc))).toEqual(['notes', 'provenance']);
  // null defaultPreset resolves to an xlsx-producing selection (null-safety against the real advertised formats)
  expect(await frame.evaluate(() => window.EXPORT.getState().fmt)).toBe('xlsx');

  // selection scope round-trips the opaque {kind:'sct',id} refs, verbatim
  await frame.click('#expanel [data-scope="selection"]');
  const b0 = await mark(page);
  await frame.click('#expanel [data-go]');
  const exp = await evtSince(page, b0, 'export');
  expect(exp).toMatchObject({ stepId: 'step3', tileId: 'scts', format: 'xlsx', scope: 'selection' });
  expect(exp.target.selection).toEqual([
    { kind: 'sct', id: 'sct-1' }, { kind: 'sct', id: 'sct-2' }, { kind: 'sct', id: 'sct-3' },
  ]);
});
