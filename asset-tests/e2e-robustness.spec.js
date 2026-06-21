// Real-browser regression suite for the standalone e2e-robustness-check.html editor.
// These replay the flows verified manually during development. Two of them
// (colour-repaints-the-box, double-click-edits) directly cover bugs that slipped
// past attribute-level checks — they assert COMPUTED style / real event behaviour.
const { test, expect } = require('@playwright/test');

const PAGE = '/e2e-robustness-check.html';

const state = (page) => page.evaluate(() => window.E2E.getState());
const computedFill = (page, id) =>
  page.evaluate((id) => getComputedStyle(document.querySelector(`.node[data-node="${id}"] rect.nbox`)).fill, id);
const computedStroke = (page, id) =>
  page.evaluate((id) => getComputedStyle(document.querySelector(`.node[data-node="${id}"] rect.nbox`)).stroke, id);

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await page.evaluate(() => { try { localStorage.removeItem('e2eRobustness1'); } catch (_) {} });
  await page.reload();
  await page.waitForSelector('#wrap svg .node');
  await page.waitForFunction(() => !!(window.E2E && window.E2E.getState));
});

test('renders the default route: 8 nodes, 7 links, 5 recursion levels', async ({ page }) => {
  await expect(page.locator('.node')).toHaveCount(8);
  await expect(page.locator('path.link')).toHaveCount(7);
  const m = await state(page);
  expect(m.lanes.map((l) => l.sub)).toEqual(['R+1', 'R0', 'R-1', 'R-2', 'R-3']);
});

test('every connection has an arrowhead pointing from -> to', async ({ page }) => {
  const ok = await page.evaluate(() => {
    const links = [...document.querySelectorAll('path.link')];
    if (!links.every((p) => p.getAttribute('marker-end') === 'url(#arr)')) return false;
    return links.every((p) => p.getPointAtLength(p.getTotalLength()).x >= p.getPointAtLength(0).x - 1);
  });
  expect(ok).toBe(true);
});

test('side panel is just SCT; Properties moved to a floating popover', async ({ page }) => {
  const heads = await page.locator('.panel .sec h3').allInnerTexts();
  expect(heads.length).toBe(1);
  expect(heads[0].toLowerCase()).toContain('sct');
  await expect(page.locator('#laneList')).toHaveCount(0);
  await expect(page.locator('.panel #propBody')).toHaveCount(0); // Properties is no longer in the pane
  await expect(page.locator('#propPop #propBody')).toHaveCount(1); // it lives in the floating popover
});

test('single click selects and does NOT open the editor; no in-pane text field', async ({ page }) => {
  await page.locator('.node[data-node="s1"] rect.nbox').click();
  await expect(page.locator('.node[data-node="s1"]')).toHaveClass(/sel/);
  await expect(page.locator('#inlineEdit')).toBeHidden();
  await expect(page.locator('#pLabel')).toHaveCount(0);
});

test('double-click edits the box text in place (regression: native dblclick was broken)', async ({ page }) => {
  await page.locator('.node[data-node="s1"] rect.nbox').dblclick();
  await expect(page.locator('#inlineEdit')).toBeVisible();
  await page.fill('#inlineEdit', 'Renamed in box');
  await page.locator('.stage').click({ position: { x: 16, y: 16 } }); // blur -> commit
  const m = await state(page);
  expect(m.nodes.find((n) => n.id === 's1').label).toBe('Renamed in box');
});

test('Enter on a selected box also opens the in-box editor', async ({ page }) => {
  await page.locator('.node[data-node="s2"] rect.nbox').click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#inlineEdit')).toBeVisible();
});

test('colour swatch repaints the box (computed style) and default resets it', async ({ page }) => {
  await page.locator('.node[data-node="s1"] rect.nbox').click();
  expect(await computedFill(page, 's1')).toBe('rgb(244, 208, 63)'); // default step yellow
  await page.locator('.swatch[data-color="#7FB1EA"]').click();
  expect(await computedFill(page, 's1')).toBe('rgb(127, 177, 234)'); // blue
  await page.locator('.swatch.def').click();
  expect(await computedFill(page, 's1')).toBe('rgb(244, 208, 63)'); // back to default
});

test('a selected coloured box keeps the blue selection ring', async ({ page }) => {
  await page.locator('.node[data-node="s1"] rect.nbox').click();
  await page.locator('.swatch[data-color="#73C9B6"]').click();
  expect(await computedStroke(page, 's1')).toBe('rgb(47, 111, 237)'); // --sel
});

test('each box exposes an input dot (left) and an output handle (right)', async ({ page }) => {
  await expect(page.locator('.node .cdot')).toHaveCount(8);
  await expect(page.locator('.node .chandle')).toHaveCount(8);
});

test('re-route: drag a selected connection end onto another box', async ({ page }) => {
  const linkId = await page.evaluate(() => {
    const id = window.E2E.getState().links.find((l) => l.from === 's1' && l.to === 's2').id;
    window.E2E.select({ type: 'link', id }); // select via the bridge (clicking the elbow path's bbox-centre is unreliable)
    return id;
  });
  await expect(page.locator('.linkend')).toHaveCount(2);
  const toEnd = await page.locator(`.linkend[data-link="${linkId}"][data-end="to"]`).boundingBox();
  const s4 = await page.locator('.node[data-node="s4"] rect.nbox').boundingBox();
  await page.mouse.move(toEnd.x + toEnd.width / 2, toEnd.y + toEnd.height / 2);
  await page.mouse.down();
  await page.mouse.move(s4.x + s4.width / 2, s4.y + s4.height / 2, { steps: 8 });
  await page.mouse.up();
  const m = await state(page);
  expect(m.links.some((l) => l.from === 's1' && l.to === 's4')).toBe(true);
  expect(m.links.some((l) => l.from === 's1' && l.to === 's2')).toBe(false);
});

test('deleting a step removes it and its connections', async ({ page }) => {
  await page.locator('.node[data-node="s2"] rect.nbox').click();
  await page.keyboard.press('Backspace');
  const m = await state(page);
  expect(m.nodes.some((n) => n.id === 's2')).toBe(false);
  expect(m.links.some((l) => l.from === 's2' || l.to === 's2')).toBe(false);
});

test('double-click an empty cell adds a step; undo removes it', async ({ page }) => {
  const before = (await state(page)).nodes.length;
  const stage = await page.locator('.stage').boundingBox();
  await page.mouse.dblclick(stage.x + stage.width * 0.55, stage.y + stage.height * 0.25);
  await expect(page.locator('#inlineEdit')).toBeVisible();
  await page.keyboard.press('Escape'); // keep the step, cancel rename
  expect((await state(page)).nodes.length).toBe(before + 1);
  await page.keyboard.press('Control+z');
  expect((await state(page)).nodes.length).toBe(before);
});

test('Full is the default view; Fit switches to lanes-fill (100%)', async ({ page }) => {
  const pct = await page.locator('#zpct').innerText();
  expect(Number(pct.replace('%', ''))).toBeLessThan(100); // Full overview < 100%
  await page.locator('#btnFit').click();
  await expect(page.locator('#zpct')).toHaveText('100%');
});

test('contributions palette places a step carrying its contribId', async ({ page }) => {
  const before = (await state(page)).nodes.length;
  await page.locator('#contribWrap .chip').first().click();
  const m = await state(page);
  expect(m.nodes.length).toBe(before + 1);
  expect(m.nodes.some((n) => n.contribId)).toBe(true);
});

test('bridge: window.E2E drives lanes + SCT and emits change', async ({ page }) => {
  const out = await page.evaluate(async () => {
    const ev = [];
    window.E2E.onEmit = (m) => ev.push(m.evt);
    window.E2E.setLanes([{ id: 'A', name: 'Enterprise', sub: 'R+1' }, { id: 'B', name: 'Unit', sub: 'R0' }]);
    window.E2E.setSCT({ sct: { name: 'Bridge SCT' }, contributions: [{ id: 'q1', laneId: 'B', label: 'Do it' }] });
    const laneLabels = [...document.querySelectorAll('text.lanelbl')].map((t) => t.textContent);
    const sct = document.getElementById('sctName').value;
    const chip = document.querySelector('#contribWrap .chip');
    const chipText = chip ? chip.textContent.trim() : null;
    if (chip) chip.click(); // triggers a debounced change
    await new Promise((r) => setTimeout(r, 250));
    return { laneLabels, sct, chipText, gotChange: ev.includes('change') };
  });
  expect(out.laneLabels).toEqual(['Enterprise', 'Unit']);
  expect(out.sct).toBe('Bridge SCT');
  expect(out.chipText).toBe('Do it');
  expect(out.gotChange).toBe(true);
});

test('bridge: a real iframe completes the ready handshake and is driven by the host', async ({ page }) => {
  const out = await page.evaluate(async () => {
    const msgs = [];
    const onMsg = (e) => { if (e.data && e.data.evt) msgs.push(e.data.evt); };
    window.addEventListener('message', onMsg);
    const ifr = document.createElement('iframe');
    ifr.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;height:650px;border:0';
    ifr.src = '/e2e-robustness-check.html';
    document.body.appendChild(ifr);
    await new Promise((r) => { ifr.onload = () => setTimeout(r, 400); });
    const gotReady = msgs.includes('ready');
    ifr.contentWindow.postMessage({ cmd: 'setSCT', sct: { name: 'IFRAME-SCT' }, contributions: [] }, '*');
    await new Promise((r) => setTimeout(r, 250));
    const sctInIframe = ifr.contentDocument.getElementById('sctName').value;
    ifr.remove();
    window.removeEventListener('message', onMsg);
    return { gotReady, sctInIframe };
  });
  expect(out.gotReady).toBe(true);
  expect(out.sctInIframe).toBe('IFRAME-SCT');
});

test('standalone: PNG downloads via the export menu', async ({ page }) => {
  await page.locator('#bExport').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('.exmenu [data-export="png"]').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});

test('standalone: SVG downloads via the export menu', async ({ page }) => {
  await page.locator('#bExport').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('.exmenu [data-export="svg"]').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.svg$/);
});

test('host export (SVG): exportReady with matching id; full route, white bg, NO chrome', async ({ page }) => {
  const out = await page.evaluate(async () => {
    const ev = []; window.E2E.onEmit = (m) => ev.push(m);
    window.E2E.export({ format: 'svg', requestId: 'rq-1', filename: 'route.svg' });
    await new Promise((r) => setTimeout(r, 150));
    const e = ev.find((x) => x.evt === 'exportReady');
    const txt = e ? await e.blob.text() : '';
    return {
      ready: !!e, id: e && e.requestId, filename: e && e.filename, mime: e && e.mimeType, isBlob: e && e.blob instanceof Blob,
      full: ['SCT-005', 'Business Sector (SIF)', 'Trigger of Work', 'Result', 'HAND-OFF'].every((t) => txt.includes(t)),
      whiteBg: txt.includes('fill="#ffffff"'),
      noChrome: !/chandle|cdot|linkend|zoomctl|exmenu|class="node/.test(txt),
    };
  });
  expect(out.ready).toBe(true);
  expect(out.id).toBe('rq-1');
  expect(out.filename).toBe('route.svg');
  expect(out.mime).toBe('image/svg+xml');
  expect(out.isBlob).toBe(true);
  expect(out.full).toBe(true);
  expect(out.whiteBg).toBe(true);
  expect(out.noChrome).toBe(true);
});

test('host export (PNG): exportReady is a non-empty image/png blob', async ({ page }) => {
  const out = await page.evaluate(async () => {
    const ev = []; window.E2E.onEmit = (m) => ev.push(m);
    window.E2E.export({ format: 'png', requestId: 'rq-png' });
    await new Promise((r) => setTimeout(r, 400));
    const e = ev.find((x) => x.evt === 'exportReady');
    return { ready: !!e, id: e && e.requestId, type: e && e.blob && e.blob.type, size: e && e.blob && e.blob.size };
  });
  expect(out.ready).toBe(true);
  expect(out.id).toBe('rq-png');
  expect(out.type).toBe('image/png');
  expect(out.size).toBeGreaterThan(1000);
});

test('export does not change zoom, selection, or pane', async ({ page }) => {
  await page.locator('.node[data-node="s2"] rect.nbox').click();
  const snap = () => page.evaluate(() => ({
    pct: document.getElementById('zpct').textContent,
    sel: document.querySelectorAll('.node.sel').length,
    pane: document.body.classList.contains('panel-hidden'),
  }));
  const before = await snap();
  await page.evaluate(async () => { window.E2E.export({ format: 'png', requestId: 'x' }); await new Promise((r) => setTimeout(r, 350)); });
  expect(await snap()).toEqual(before);
});

test('empty route still exports a valid SVG (not an error)', async ({ page }) => {
  const out = await page.evaluate(async () => {
    window.E2E.loadModel({ meta: { sct: 'SCT-EMPTY' }, lanes: [{ id: 'l1', name: 'Corporate', sub: 'R+1' }], nodes: [], links: [], callouts: [] });
    const ev = []; window.E2E.onEmit = (m) => ev.push(m);
    window.E2E.export({ format: 'svg', requestId: 'empty' });
    await new Promise((r) => setTimeout(r, 150));
    const ready = ev.find((x) => x.evt === 'exportReady');
    const err = ev.find((x) => x.evt === 'exportError');
    const txt = ready ? await ready.blob.text() : '';
    return { ready: !!ready, noError: !err, valid: txt.startsWith('<svg') && txt.trim().endsWith('</svg>'), hasLane: txt.includes('Corporate') };
  });
  expect(out.ready).toBe(true);
  expect(out.noError).toBe(true);
  expect(out.valid).toBe(true);
  expect(out.hasLane).toBe(true);
});

test('findings: default route renders one Lean flash marker (the sample bottleneck)', async ({ page }) => {
  await expect(page.locator('.fmark')).toHaveCount(1);
  const m = await state(page);
  expect(m.findings.length).toBe(1);
  expect(m.findings[0].category).toBe('bottleneck');
});

test('findings: mark a step and edit category/severity/note', async ({ page }) => {
  await page.locator('.node[data-node="s2"] rect.nbox').click();
  await expect(page.locator('#pAddFinding')).toBeVisible();
  await page.locator('#pAddFinding').click();
  await expect(page.locator('#propBody .fcard')).toHaveCount(1);
  await page.locator('#propBody .fcat').selectOption('delay');
  await page.locator('#propBody .fsev').selectOption('high');
  await page.locator('#propBody .fnote').fill('Waiting on upstream sign-off');
  const f = (await state(page)).findings.find((x) => x.target.id === 's2');
  expect(f).toMatchObject({ category: 'delay', severity: 'high', note: 'Waiting on upstream sign-off' });
});

test('findings: a connection can be marked too', async ({ page }) => {
  const linkId = await page.evaluate(() => {
    const id = window.E2E.getState().links.find((l) => l.from === 's1' && l.to === 's2').id;
    window.E2E.select({ type: 'link', id }); return id;
  });
  await page.locator('#pAddFinding').click();
  expect((await state(page)).findings.some((x) => x.target.type === 'link' && x.target.id === linkId)).toBe(true);
});

test('findings: multiple on one target share one marker with a count badge', async ({ page }) => {
  await page.locator('.node[data-node="s3"] rect.nbox').click();   // s3 already has 1
  await page.locator('#pAddFinding').click();                       // -> 2
  await expect(page.locator('.fmark[data-ftid="s3"]')).toHaveCount(1);
  await expect(page.locator('.fmark[data-ftid="s3"] text')).toHaveText('2');
});

test('findings: clicking the marker selects the element and exposes its findings', async ({ page }) => {
  await page.locator('.stage').click({ position: { x: 30, y: 30 } });   // deselect
  await page.locator('.fmark[data-ftid="s3"]').click();
  await expect(page.locator('.node[data-node="s3"]')).toHaveClass(/sel/);
  await expect(page.locator('#propBody .fcard')).toHaveCount(1);
});

test('findings: survive save/load (reload) and undo', async ({ page }) => {
  await page.locator('.node[data-node="s2"] rect.nbox').click();
  await page.locator('#pAddFinding').click();
  expect((await state(page)).findings.length).toBe(2);
  await page.reload();
  await page.waitForFunction(() => window.E2E && window.E2E.getState);
  expect((await state(page)).findings.length).toBe(2);                  // persisted
  await page.locator('.node[data-node="s2"] rect.nbox').click();
  await page.locator('#propBody .fdel').click();
  expect((await state(page)).findings.length).toBe(1);
  await page.keyboard.press('Control+z');
  expect((await state(page)).findings.length).toBe(2);                  // undo restored
});

test('findings: deleting an element with findings asks for confirmation', async ({ page }) => {
  await page.locator('.node[data-node="s3"] rect.nbox').click();
  page.once('dialog', (d) => d.dismiss());                              // decline -> kept (s3 stays selected)
  await page.keyboard.press('Backspace');
  expect((await state(page)).nodes.some((n) => n.id === 's3')).toBe(true);
  page.once('dialog', (d) => d.accept());                              // accept -> element + findings removed
  await page.keyboard.press('Backspace');
  const m = await state(page);
  expect(m.nodes.some((n) => n.id === 's3')).toBe(false);
  expect(m.findings.some((f) => f.target.id === 's3')).toBe(false);
});

test('findings: SVG export includes the marker', async ({ page }) => {
  const txt = await page.evaluate(async () => {
    const ev = []; window.E2E.onEmit = (m) => ev.push(m);
    window.E2E.export({ format: 'svg', requestId: 'f' });
    await new Promise((r) => setTimeout(r, 150));
    return await ev.find((x) => x.evt === 'exportReady').blob.text();
  });
  expect(txt.includes('M2,-8 L-6,1.5')).toBe(true);                    // the flash bolt path
});

test('findings: a legacy route without a findings field loads as []', async ({ page }) => {
  const out = await page.evaluate(() => {
    window.E2E.loadModel({ meta: { sct: 'SCT-LEGACY' }, lanes: [{ id: 'l1', name: 'A', sub: 'R0' }], nodes: [], links: [], callouts: [] });
    const m = window.E2E.getState();
    return { isArray: Array.isArray(m.findings), len: m.findings.length };
  });
  expect(out.isArray).toBe(true);
  expect(out.len).toBe(0);
});

test('call-outs: double-click opens an in-box editor and commits', async ({ page }) => {
  await page.locator('.callout .cobox').first().dblclick();
  await expect(page.locator('#inlineCo')).toBeVisible();
  await page.fill('#inlineCo', 'Re-check the plant spec');
  await page.keyboard.press('Enter');
  expect((await state(page)).callouts[0].text).toBe('Re-check the plant spec');
});

test('call-outs: Enter on a selected call-out opens the in-box editor', async ({ page }) => {
  const id = (await state(page)).callouts[0].id;
  await page.evaluate((id) => window.E2E.select({ type: 'callout', id }), id);
  await page.keyboard.press('Enter');
  await expect(page.locator('#inlineCo')).toBeVisible();
});

test('call-outs: adding one opens the in-box editor on the new call-out', async ({ page }) => {
  await page.locator('.node[data-node="s1"] rect.nbox').click();
  await page.locator('#pAddCo').click();
  await expect(page.locator('#inlineCo')).toBeVisible();
  await page.fill('#inlineCo', 'Context note');
  await page.keyboard.press('Enter');
  expect((await state(page)).callouts.some((c) => c.target.id === 's1' && c.text === 'Context note')).toBe(true);
});

test('call-outs: dragged position persists across reload; editing text does not move it', async ({ page }) => {
  const box = await page.locator('.callout .cobox').first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 - 40, { steps: 8 });
  await page.mouse.up();
  const moved = (await state(page)).callouts[0];
  expect(moved.dx).not.toBe(0);
  // edit the text -> position unchanged
  await page.locator('.callout .cobox').first().dblclick();
  await page.fill('#inlineCo', 'Edited note text');
  await page.keyboard.press('Enter');
  const afterEdit = (await state(page)).callouts[0];
  expect(afterEdit.dx).toBeCloseTo(moved.dx, 1);
  expect(afterEdit.dy).toBeCloseTo(moved.dy, 1);
  // reload -> position restored
  await page.reload();
  await page.waitForFunction(() => window.E2E && window.E2E.getState);
  const afterReload = (await state(page)).callouts[0];
  expect(afterReload.dx).toBeCloseTo(moved.dx, 1);
  expect(afterReload.dy).toBeCloseTo(moved.dy, 1);
});

test('call-outs: a host-fed call-out without dx/dy is draggable (no NaN snap-back)', async ({ page }) => {
  await page.evaluate(() => window.E2E.loadModel({
    meta: { sct: 'X' }, lanes: [{ id: 'l1', name: 'A', sub: 'R0' }],
    nodes: [{ id: 'n1', kind: 'step', laneId: 'l1', col: 1, label: 'Box' }],
    links: [], callouts: [{ id: 'co1', kind: 'context', target: { type: 'node', id: 'n1' }, text: 'note' }],
  }));
  expect((await state(page)).callouts[0].dx).toBe(0); // normalized from undefined
  const box = await page.locator('.callout[data-callout="co1"] .cobox').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 - 30, { steps: 6 });
  await page.mouse.up();
  const c = (await state(page)).callouts[0];
  expect(Number.isFinite(c.dx)).toBe(true);
  expect(c.dx).not.toBe(0);
});

async function connectDrag(page, fromId, dropLocator) {
  const h = await page.locator(`.node[data-node="${fromId}"] .chandle`).boundingBox();
  const t = await dropLocator.boundingBox();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 8 });
  await page.mouse.up();
}

test('connect: dropping on a box body creates the link', async ({ page }) => {
  await connectDrag(page, 's2', page.locator('.node[data-node="s5"] rect.nbox'));
  expect((await state(page)).links.some((l) => l.from === 's2' && l.to === 's5')).toBe(true);
});

test('connect: dropping on a box that has a finding marker still connects (overlay no longer blocks)', async ({ page }) => {
  await connectDrag(page, 's1', page.locator('.fmark[data-ftid="s3"]'));
  expect((await state(page)).links.some((l) => l.from === 's1' && l.to === 's3')).toBe(true);
});

test('connect: dropping on empty space makes no link and leaves no stuck rubber', async ({ page }) => {
  const before = (await state(page)).links.length;
  const h = await page.locator('.node[data-node="s4"] .chandle').boundingBox();
  const stg = await page.locator('.stage').boundingBox();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(stg.x + stg.width * 0.5, stg.y + stg.height * 0.95, { steps: 6 });
  await page.mouse.up();
  expect((await state(page)).links.length).toBe(before);
  await expect(page.locator('#rubber')).toHaveCount(0);
});

test('re-route: dropping a link end on a marked box reattaches it', async ({ page }) => {
  const linkId = await page.evaluate(() => {
    const id = window.E2E.getState().links.find((l) => l.from === 't' && l.to === 's1').id;
    window.E2E.select({ type: 'link', id }); return id;
  });
  const e = await page.locator(`.linkend[data-link="${linkId}"][data-end="to"]`).boundingBox();
  const t = await page.locator('.fmark[data-ftid="s3"]').boundingBox();
  await page.mouse.move(e.x + e.width / 2, e.y + e.height / 2);
  await page.mouse.down();
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 8 });
  await page.mouse.up();
  expect((await state(page)).links.some((l) => l.from === 't' && l.to === 's3')).toBe(true);
});

test('drag: dropping a step on an occupied cell never stacks (cells stay unique)', async ({ page }) => {
  const s2 = await page.locator('.node[data-node="s2"] rect.nbox').boundingBox();
  const s5 = await page.locator('.node[data-node="s5"] rect.nbox').boundingBox();
  await page.mouse.move(s5.x + s5.width / 2, s5.y + s5.height / 2);
  await page.mouse.down();
  await page.mouse.move(s2.x + s2.width / 2, s2.y + s2.height / 2, { steps: 8 });
  await page.mouse.up();
  const cells = (await state(page)).nodes.map((n) => n.laneId + '#' + n.col);
  expect(cells.length).toBe(new Set(cells).size);
});

test('arrow keys scroll the canvas; shift+arrow moves the selected step', async ({ page }) => {
  const vbx = () => page.evaluate(() => +document.querySelector('#wrap svg').getAttribute('viewBox').split(' ')[0]);
  await page.locator('#btnFit').click(); // Fill -> horizontal scroll possible
  const x0 = await vbx();
  await page.keyboard.press('ArrowRight');
  expect(await vbx()).toBeGreaterThan(x0);
  await page.keyboard.press('ArrowLeft');
  expect(await vbx()).toBeCloseTo(x0, 0);
  // shift+arrow nudges the selected step (not pan)
  await page.locator('#btnFull').click();
  await page.locator('.node[data-node="s1"] rect.nbox').click();
  const col0 = await page.evaluate(() => window.E2E.getState().nodes.find((n) => n.id === 's1').col);
  await page.keyboard.press('Shift+ArrowRight');
  expect(await page.evaluate(() => window.E2E.getState().nodes.find((n) => n.id === 's1').col)).toBe(col0 + 1);
  await page.keyboard.press('ArrowRight'); // plain arrow must NOT move the step
  expect(await page.evaluate(() => window.E2E.getState().nodes.find((n) => n.id === 's1').col)).toBe(col0 + 1);
});

test('ids stay unique across save/reload (no cross-session id collision)', async ({ page }) => {
  await page.locator('#bAdd').click();                 // session 1: add a step (autosaves)
  await page.locator('#inlineEdit').press('Escape');
  const id1 = await page.evaluate(() => { const ns = window.E2E.getState().nodes; return ns[ns.length - 1].id; });
  await page.reload();                                 // session 2: reload loads the saved model...
  await page.waitForFunction(() => !!(window.E2E && window.E2E.getState));
  await page.locator('#bAdd').click();                 // ...and adding again must not re-mint id1
  await page.locator('#inlineEdit').press('Escape');
  const ids = await page.evaluate(() => window.E2E.getState().nodes.map((n) => n.id));
  expect(ids).toContain(id1);
  expect(ids.length).toBe(new Set(ids).size);
});

test('loadModel repairs duplicate ids (de-duplicates colliding nodes)', async ({ page }) => {
  const ids = await page.evaluate(() => {
    window.E2E.loadModel({
      meta: { sct: 'X' },
      lanes: [{ id: 'l1', name: 'A', sub: 'R0' }],
      nodes: [
        { id: 'dup', kind: 'trigger', laneId: 'l1', col: 0, label: 'T' },
        { id: 'dup', kind: 'step', laneId: 'l1', col: 2, label: 'B' },
      ],
      links: [], callouts: [],
    });
    return window.E2E.getState().nodes.map((n) => n.id);
  });
  expect(ids.length).toBe(2);
  expect(new Set(ids).size).toBe(2); // the colliding pair was separated
});

test('full screen: button + F request it, Cmd/Ctrl+F is ignored, and the host is notified', async ({ page }) => {
  await expect(page.locator('#zoomctl #btnFs svg path')).toHaveCount(1); // toggle button with an icon, at the top of the widget
  // actual engagement is environment-dependent — spy the API to assert the wiring
  await page.evaluate(() => { window.__fs = 0; document.documentElement.requestFullscreen = () => { window.__fs++; return Promise.resolve(); }; });
  await page.locator('#btnFs').click();
  expect(await page.evaluate(() => window.__fs)).toBe(1);
  await page.evaluate(() => { window.__fs = 0; });
  await page.keyboard.press('f');
  expect(await page.evaluate(() => window.__fs)).toBe(1);
  await page.evaluate(() => { window.__fs = 0; });
  await page.keyboard.press('Control+f'); // reserved for browser find — must not toggle
  expect(await page.evaluate(() => window.__fs)).toBe(0);
  // host bridge: exit works without a user gesture
  const exitCalls = await page.evaluate(() => { let c = 0; document.exitFullscreen = () => { c++; return Promise.resolve(); }; window.E2E.fullscreen(false); return c; });
  expect(exitCalls).toBe(1);
  // host is notified on fullscreenchange
  const emitted = await page.evaluate(() => new Promise((res) => {
    window.E2E.onEmit = (msg) => { if (msg && msg.evt === 'fullscreenchange') res(msg); };
    document.dispatchEvent(new Event('fullscreenchange'));
  }));
  expect(emitted).toHaveProperty('fullscreen');
});

test('properties render in a floating popover next to the element, not the side pane', async ({ page }) => {
  expect(await page.locator('#propSec').count()).toBe(0);     // the side-pane Properties section is gone
  await expect(page.locator('#propPop')).toBeHidden();        // hidden until something is selected

  // select a step → popover appears, anchored at the node's height, with its controls
  await page.locator('.node[data-node="s2"] rect.nbox').click();
  await expect(page.locator('#propPop')).toBeVisible();
  await expect(page.locator('#propPopTtl')).toHaveText('Step');
  await expect(page.locator('#propPop #pLane')).toHaveCount(1);
  await expect(page.locator('#propPop .swatch')).toHaveCount(9);
  const pr = await page.locator('#propPop').boundingBox();
  const nr = await page.locator('.node[data-node="s2"] rect.nbox').boundingBox();
  expect(pr.y < nr.y + nr.height && pr.y + pr.height > nr.y).toBe(true); // vertically beside the box

  // a swatch in the popover recolours the node
  const want = await page.locator('#propPop .swatch[data-color]').first().getAttribute('data-color');
  await page.locator('#propPop .swatch[data-color]').first().click();
  expect((await page.evaluate(() => window.E2E.getState().nodes.find((n) => n.id === 's2').color) || '').toLowerCase()).toBe(want.toLowerCase());

  // close button hides the popover and clears the selection
  await page.locator('#propClose').click();
  await expect(page.locator('#propPop')).toBeHidden();

  // a connection shows the connection controls and the popover follows a pan
  const lid = await page.evaluate(() => window.E2E.getState().links[0].id);
  await page.evaluate((id) => window.E2E.select({ type: 'link', id }), lid);
  await expect(page.locator('#propPopTtl')).toHaveText('Connection');
  await expect(page.locator('#propPop #pDelLink')).toHaveCount(1);
  await page.locator('#btnFit').click();
  const x1 = (await page.locator('#propPop').boundingBox()).x;
  await page.keyboard.press('ArrowRight');
  const x2 = (await page.locator('#propPop').boundingBox()).x;
  expect(Math.abs(x2 - x1)).toBeGreaterThan(2);
});

// ---------------------------------------------------------------------------
// cross-SCT support (setSCTContext) — additive, backward compatible
// ---------------------------------------------------------------------------
const CTX = {
  primarySct: { id: 'SCT-003', displayId: 'SCT-003', name: 'SCT-003 · Normative Management' },
  relatedScts: [{ id: 'SCT-011', displayId: 'SCT-011', name: 'SCT-011 · Partner Ecosystem' }],
  contributions: [
    { id: 'c1', laneId: 'l1', label: 'Set norms', sctId: 'SCT-003', sctName: 'SCT-003 · Normative Management' },
    { id: 'c2', laneId: 'l2', label: 'Define frame', sctId: 'SCT-003', sctName: 'SCT-003 · Normative Management' },
    { id: 'c3', laneId: 'l3', label: 'Partner intake', sctId: 'SCT-011', sctName: 'SCT-011 · Partner Ecosystem' },
    { id: 'c4', laneId: 'l4', label: 'Partner SLA', sctId: 'SCT-011', sctName: 'SCT-011 · Partner Ecosystem' },
  ],
};
const exportSVG = (page) => page.evaluate(() => new Promise((res) => {
  window.E2E.onEmit = async (m) => { if (m && m.evt === 'exportReady' && m.format === 'svg') { window.E2E.onEmit = null; res(await m.blob.text()); } };
  window.E2E.export({ format: 'svg', requestId: 'x' });
}));

test('cross-SCT: legacy setSCT stays single-SCT (no groups, current appearance)', async ({ page }) => {
  await page.evaluate(() => window.E2E.setSCT({ sct: { id: 'SCT-009', name: 'SCT-009 · Solo' }, contributions: [{ id: 'z1', laneId: 'l1', label: 'Solo' }] }));
  await expect(page.locator('#contribWrap .sctg')).toHaveCount(0);
  await expect(page.locator('#contribWrap .chip[data-contrib="z1"]')).toHaveCount(1);
  const meta = await page.evaluate(() => window.E2E.getState().meta);
  expect(meta.sctId).toBe('SCT-009');
  expect(meta.relatedSctIds).toEqual([]);
});

test('cross-SCT: setSCTContext renders primary + related groups with ids', async ({ page }) => {
  await page.evaluate((ctx) => window.E2E.setSCTContext(ctx), CTX);
  await expect(page.locator('#contribWrap .sctg')).toHaveCount(2);
  await expect(page.locator('#contribWrap .sctg.primary .sctg-tag')).toHaveText(/primary/i);
  await expect(page.locator('#contribWrap .sctg.primary .sctg-id')).toHaveText('SCT-003');
  await expect(page.locator('#contribWrap details.sctg.related[data-sct="SCT-011"] .sctg-id')).toHaveText('SCT-011');
  const meta = await page.evaluate(() => window.E2E.getState().meta);
  expect(meta.primarySctId).toBe('SCT-003');
  expect(meta.relatedSctIds).toEqual(['SCT-011']);
});

test('cross-SCT: contributions from different SCTs place and keep contribId + origin', async ({ page }) => {
  await page.evaluate((ctx) => window.E2E.setSCTContext(ctx), CTX);
  await page.locator('#contribWrap .sctg.primary .chip[data-contrib="c1"]').click();
  await page.locator('#contribWrap details.sctg.related .chip[data-contrib="c3"]').click();
  const nodes = await page.evaluate(() => window.E2E.getState().nodes);
  const c1 = nodes.find((n) => n.contribId === 'c1'), c3 = nodes.find((n) => n.contribId === 'c3');
  expect(c1.contribSctId).toBe('SCT-003');
  expect(c3.contribSctId).toBe('SCT-011');
  await expect(page.locator(`.node[data-node="${c3.id}"] .nsct`)).toHaveCount(1); // related step tagged
  await expect(page.locator(`.node[data-node="${c1.id}"] .nsct`)).toHaveCount(0); // primary step clean
});

test('cross-SCT: save/load preserves meta + placed references', async ({ page }) => {
  await page.evaluate((ctx) => window.E2E.setSCTContext(ctx), CTX);
  await page.locator('#contribWrap details.sctg.related .chip[data-contrib="c3"]').click();
  const snap = await page.evaluate(() => window.E2E.getState());
  await page.evaluate((m) => window.E2E.loadModel(m), snap);
  const st = await page.evaluate(() => window.E2E.getState());
  expect(st.meta.primarySctId).toBe('SCT-003');
  expect(st.meta.relatedSctIds).toEqual(['SCT-011']);
  const c3 = st.nodes.find((n) => n.contribId === 'c3');
  expect(c3).toMatchObject({ contribId: 'c3', contribSctId: 'SCT-011' });
});

test('cross-SCT: renaming an SCT keeps placed references and updates the visible name', async ({ page }) => {
  await page.evaluate((ctx) => window.E2E.setSCTContext(ctx), CTX);
  await page.locator('#contribWrap details.sctg.related .chip[data-contrib="c3"]').click();
  await page.evaluate((ctx) => window.E2E.setSCTContext(Object.assign({}, ctx, { relatedScts: [{ id: 'SCT-011', name: 'SCT-011 · RENAMED' }] })), CTX);
  const c3 = await page.evaluate(() => window.E2E.getState().nodes.find((n) => n.contribId === 'c3'));
  expect(c3.contribSctId).toBe('SCT-011'); // id reference unchanged
  await page.evaluate((id) => window.E2E.select({ type: 'node', id }), c3.id);
  await expect(page.locator('#propPop .sctsrc')).toContainText('RENAMED');
});

test('cross-SCT: removing a related SCT keeps placed nodes and marks them unavailable', async ({ page }) => {
  await page.evaluate((ctx) => window.E2E.setSCTContext(ctx), CTX);
  await page.locator('#contribWrap details.sctg.related .chip[data-contrib="c3"]').click();
  const before = await page.evaluate(() => window.E2E.getState().nodes.length);
  await page.evaluate(() => window.E2E.setSCTContext({ primarySct: { id: 'SCT-003', name: 'SCT-003 · Normative Management' }, relatedScts: [], contributions: [{ id: 'c1', laneId: 'l1', label: 'Set norms', sctId: 'SCT-003', sctName: 'SCT-003 · Normative Management' }] }));
  const st = await page.evaluate(() => window.E2E.getState());
  expect(st.nodes.length).toBe(before); // not silently deleted
  expect(st.meta.relatedSctIds).toEqual([]);
  const c3 = st.nodes.find((n) => n.contribId === 'c3');
  expect(c3.contribSctId).toBe('SCT-011');
  await expect(page.locator(`.node[data-node="${c3.id}"] .nsct.gone`)).toHaveCount(1);
  await page.evaluate((id) => window.E2E.select({ type: 'node', id }), c3.id);
  await expect(page.locator('#propPop .sctsrc.gone')).toContainText('Source SCT unavailable');
});

test('cross-SCT: SVG + PNG exports carry SCT origins', async ({ page }) => {
  await page.evaluate((ctx) => window.E2E.setSCTContext(ctx), CTX);
  await page.locator('#contribWrap .sctg.primary .chip[data-contrib="c1"]').click();
  await page.locator('#contribWrap details.sctg.related .chip[data-contrib="c3"]').click();
  const svg = await exportSVG(page);
  expect(svg).toContain('SCTs:');      // participating-SCTs legend
  expect(svg).toContain('(primary)');
  expect(svg).toContain('>SCT-011<');  // per-step SCT tag
  const pngSize = await page.evaluate(() => new Promise((res) => {
    window.E2E.onEmit = async (m) => { if (m && m.evt === 'exportReady' && m.format === 'png') { window.E2E.onEmit = null; res(m.blob.size); } };
    window.E2E.export({ format: 'png', requestId: 'p' });
  }));
  expect(pngSize).toBeGreaterThan(1000); // PNG rasterises the same SVG
});

test('cross-SCT: legacy single-SCT model loads and exports cleanly', async ({ page }) => {
  await page.evaluate(() => {
    window.E2E.loadModel({ meta: { name: 'Legacy', sct: 'SCT-009 · Solo', sctId: 'SCT-009' },
      lanes: [{ id: 'l1', name: 'Corp', sub: 'R+1' }, { id: 'l2', name: 'Biz', sub: 'R0' }],
      nodes: [{ id: 't', kind: 'trigger', laneId: 'l1', col: 0, label: 'Trigger' }, { id: 's1', kind: 'step', laneId: 'l1', col: 1, label: 'Do', contribId: 'z1' }, { id: 'r', kind: 'result', laneId: 'l2', col: 2, label: 'Done' }],
      links: [{ id: 'k1', from: 't', to: 's1' }], callouts: [] });
    window.E2E.setSCT({ sct: { id: 'SCT-009', name: 'SCT-009 · Solo' }, contributions: [{ id: 'z1', laneId: 'l1', label: 'Do' }] });
  });
  const st = await page.evaluate(() => window.E2E.getState());
  expect(st.nodes.length).toBe(3);
  expect(st.meta.relatedSctIds).toEqual([]); // missing → normalized
  await expect(page.locator('#contribWrap .sctg')).toHaveCount(0);
  await expect(page.locator('.nsct')).toHaveCount(0);
  expect(await exportSVG(page)).not.toContain('SCTs:');
});

// ---------------------------------------------------------------------------
// cross-SCT readable displayId — canonical (UUID) id stays internal, never shown
// ---------------------------------------------------------------------------
const PRIM_UUID = '11111111-1111-4111-8111-111111111111';
const REL_UUID = '22222222-2222-4222-8222-222222222222';
const CTXD = {
  primarySct: { id: PRIM_UUID, displayId: 'SCT-001', name: 'Normative Management' },
  relatedScts: [{ id: REL_UUID, displayId: 'SCT-011', name: 'Customer Journey Management' }],
  contributions: [
    { id: 'c1', laneId: 'l1', label: 'Set norms', sctId: PRIM_UUID, sctName: 'Normative Management' },
    { id: 'c3', laneId: 'l3', label: 'Partner intake', sctId: REL_UUID, sctName: 'Customer Journey Management' },
  ],
};

test('displayId: primary and related palette headings show SCT-xxx', async ({ page }) => {
  await page.evaluate((c) => window.E2E.setSCTContext(c), CTXD);
  await expect(page.locator('#contribWrap .sctg.primary .sctg-id')).toHaveText('SCT-001');
  await expect(page.locator('#contribWrap details.sctg.related .sctg-id')).toHaveText('SCT-011');
});

test('displayId: UUIDs never appear in visible UI; readable ids do', async ({ page }) => {
  await page.evaluate((c) => window.E2E.setSCTContext(c), CTXD);
  await page.locator('#contribWrap details.sctg.related .chip[data-contrib="c3"]').click();
  const node = await page.evaluate(() => window.E2E.getState().nodes.find((n) => n.contribId === 'c3'));
  await page.evaluate((id) => window.E2E.select({ type: 'node', id }), node.id);
  await expect(page.locator(`.node[data-node="${node.id}"] .nsct text`)).toHaveText('SCT-011');
  const ui = await page.evaluate(() => ['#contribWrap', '#propPop', '#wrap', '.panel'].map((s) => (document.querySelector(s) || {}).textContent || '').join(' '));
  expect(ui).not.toContain(PRIM_UUID);
  expect(ui).not.toContain(REL_UUID);
  expect(ui).toContain('SCT-001');
  expect(ui).toContain('SCT-011');
});

test('displayId: UUIDs never appear in PNG/SVG labels', async ({ page }) => {
  await page.evaluate((c) => window.E2E.setSCTContext(c), CTXD);
  await page.locator('#contribWrap .sctg.primary .chip[data-contrib="c1"]').click();
  await page.locator('#contribWrap details.sctg.related .chip[data-contrib="c3"]').click();
  const svg = await exportSVG(page);
  expect(svg).not.toContain(PRIM_UUID);
  expect(svg).not.toContain(REL_UUID);
  expect(svg).toContain('SCT-001');
  expect(svg).toContain('SCT-011');
});

test('displayId: canonical ids still round-trip unchanged', async ({ page }) => {
  await page.evaluate((c) => window.E2E.setSCTContext(c), CTXD);
  await page.locator('#contribWrap details.sctg.related .chip[data-contrib="c3"]').click();
  const snap = await page.evaluate(() => window.E2E.getState());
  await page.evaluate((m) => window.E2E.loadModel(m), snap);
  const st = await page.evaluate(() => window.E2E.getState());
  expect(st.meta.primarySctId).toBe(PRIM_UUID);
  expect(st.meta.relatedSctIds).toEqual([REL_UUID]);
  expect(st.nodes.find((n) => n.contribId === 'c3').contribSctId).toBe(REL_UUID);
});

test('displayId: legacy payload without displayId falls back without exposing a UUID', async ({ page }) => {
  await page.evaluate(({ p, r }) => window.E2E.setSCTContext({
    primarySct: { id: p, name: 'Normative Management' },
    relatedScts: [{ id: r, name: 'Customer Journey Management' }],
    contributions: [{ id: 'c1', laneId: 'l1', label: 'x', sctId: p }, { id: 'c3', laneId: 'l3', label: 'y', sctId: r }],
  }), { p: PRIM_UUID, r: REL_UUID });
  await expect(page.locator('#contribWrap .sctg')).toHaveCount(2);
  const ui = await page.evaluate(() => (document.querySelector('#contribWrap') || {}).textContent || '');
  expect(ui).not.toContain(PRIM_UUID);
  expect(ui).not.toContain(REL_UUID);
  expect(ui).toContain('Customer Journey Management'); // neutral readable fallback = the SCT name
});

test('displayId: unavailable source shows the neutral fallback, no UUID', async ({ page }) => {
  await page.evaluate((c) => window.E2E.setSCTContext(c), CTXD);
  await page.locator('#contribWrap details.sctg.related .chip[data-contrib="c3"]').click();
  const node = await page.evaluate(() => window.E2E.getState().nodes.find((n) => n.contribId === 'c3'));
  await page.evaluate((c) => window.E2E.setSCTContext({ primarySct: c.primarySct, relatedScts: [], contributions: [c.contributions[0]] }), CTXD);
  await page.evaluate((id) => window.E2E.select({ type: 'node', id }), node.id);
  await expect(page.locator('#propPop .sctsrc.gone')).toHaveText(/Source SCT unavailable/);
  const ui = await page.evaluate(() => (document.querySelector('#propPop') || {}).textContent || '');
  expect(ui).not.toContain(REL_UUID);
});

test('displayId: single-SCT shows the readable id in the pane, no groups/tags, no UUID', async ({ page }) => {
  await page.evaluate(() => window.E2E.setSCTContext({
    primarySct: { id: '33333333-3333-4333-8333-333333333333', displayId: 'SCT-007', name: 'Solo Management' },
    relatedScts: [], contributions: [{ id: 'z1', laneId: 'l1', label: 'do', sctId: '33333333-3333-4333-8333-333333333333' }],
  }));
  await expect(page.locator('#contribWrap .sctg')).toHaveCount(0); // single SCT → unchanged flat palette
  await expect(page.locator('.nsct')).toHaveCount(0);
  const field = await page.evaluate(() => document.getElementById('sctName').value);
  expect(field).toContain('SCT-007');
  expect(field).not.toContain('33333333');
});
