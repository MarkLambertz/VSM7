// Real-browser regression suite for the Meeting Landscape asset (meeting-landscape.html — Step VII 7.6).
// Covers the two modes (cadence Landscape canvas + Meeting form), the markers-vs-bands rendering,
// collapsible recursion bands, timeframe zoom, drag-to-replace (snap to sub-lane + time tick),
// optional typed connections, and the window.MTL host bridge.
const { test, expect } = require('@playwright/test');

const PAGE = '/design-previews/meeting-landscape.html';

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForFunction(() => !!(window.MTL && window.MTL.getState));
});

test('window.MTL bridge: getState exposes ctx / model / ui in the locked shape', async ({ page }) => {
  const shape = await page.evaluate(() => {
    const s = window.MTL.getState();
    return {
      ctx: Object.keys(s.ctx).sort(),
      model: Object.keys(s.model).sort(),
      ui: Object.keys(s.ui).sort(),
      meetings: s.model.meetings.length,
      connections: s.model.connections.length,
      hasMeetingShape: s.model.meetings.every(m => m.id && m.scope && m.cadence),
    };
  });
  expect(shape.ctx).toEqual(['aspects', 'loops', 'roles', 'scts', 'units']); // + host-fed aspects/scts for artifact output refs
  expect(shape.model).toEqual(['connections', 'meetings']);
  expect(shape.ui).toEqual(['mode', 'selected', 'skin', 'timeframe']);
  expect(shape.meetings).toBeGreaterThan(0);
  expect(shape.connections).toBeGreaterThan(0);
  expect(shape.hasMeetingShape).toBe(true);
});

test('landscape: three recursion bands (R+1 / R0 / R-1) with markers rendered', async ({ page }) => {
  await page.evaluate(() => window.MTL.goto('landscape'));
  for (const lvl of ['R+1', 'R0', 'R-1']) {
    await expect(page.locator(`g.bandhdr[data-level="${lvl}"]`)).toHaveCount(1);
  }
  // meetings render as marker/band/signal groups
  await expect(page.locator('svg g.mk')).toHaveCount(await page.evaluate(() => window.MTL.getState().model.meetings.length));
});

test('landscape: collapsing a recursion band folds it to a summary lane with a count chip', async ({ page }) => {
  await page.evaluate(() => window.MTL.goto('landscape'));
  const hdr = page.locator('g.bandhdr[data-level="R0"]');
  await expect(hdr.locator('text.lanelabel')).toContainText('▾'); // expanded
  await hdr.click();
  await expect(page.locator('g.bandhdr[data-level="R0"] text.lanelabel')).toContainText('▸'); // collapsed
  await expect(page.locator('svg text', { hasText: /meeting.*·.*unit/ })).toHaveCount(1); // "N meetings · M units" chip
  await page.locator('g.bandhdr[data-level="R0"]').click(); // re-expand
  await expect(page.locator('g.bandhdr[data-level="R0"] text.lanelabel')).toContainText('▾');
});

test('timeframe zoom: toolbar segment and setHorizon both drive ui.timeframe', async ({ page }) => {
  await page.evaluate(() => window.MTL.goto('landscape'));
  await page.locator('#tfSeg button[data-tf="quarter"]').click();
  expect(await page.evaluate(() => window.MTL.getState().ui.timeframe)).toBe('quarter');
  await page.evaluate(() => window.MTL.setHorizon('2-5y'));
  expect(await page.evaluate(() => window.MTL.getState().ui.timeframe)).toBe('2-5y');
  await expect(page.locator('#tfSeg button[data-tf="2-5y"]')).toHaveClass(/on/);
});

test('drag-to-replace: dropping a marker on another sub-lane re-scopes it and emits meeting move', async ({ page }) => {
  const result = await page.evaluate(() => {
    window.MTL.goto('landscape'); window.MTL.setHorizon('1y');
    const events = []; window.MTL.onEmit = m => { if (m.evt === 'meeting') events.push(m); };
    const view = document.querySelector('#view');
    const before = JSON.parse(JSON.stringify(window.MTL.getState().model.meetings.find(m => m.id === 'm-ind-rev').scope));
    const g = document.querySelector('svg g.mk[data-id="m-ind-rev"]');
    const mob = [...document.querySelectorAll('svg text')].find(t => /Mobility/.test(t.textContent));
    const gr = g.getBoundingClientRect(), tr = mob.getBoundingClientRect();
    g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: gr.left + gr.width / 2, clientY: gr.top + gr.height / 2, pointerId: 1, button: 0 }));
    view.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: gr.left + gr.width / 2 + 30, clientY: tr.top + tr.height / 2, pointerId: 1 }));
    view.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: gr.left + gr.width / 2 + 30, clientY: tr.top + tr.height / 2, pointerId: 1 }));
    const after = window.MTL.getState().model.meetings.find(m => m.id === 'm-ind-rev').scope;
    return { before, after, moveEvents: events.filter(e => e.op === 'move').length };
  });
  expect(JSON.stringify(result.after)).not.toBe(JSON.stringify(result.before)); // scope changed
  expect(result.moveEvents).toBeGreaterThan(0); // emitted a meeting move
});

test('connect mode: toggle then click two meetings adds a typed connection and emits', async ({ page }) => {
  const result = await page.evaluate(() => {
    window.MTL.goto('landscape');
    const events = []; window.MTL.onEmit = m => { if (m.evt === 'connection') events.push(m); };
    const before = window.MTL.getState().model.connections.length;
    document.querySelector('[data-act="connecttoggle"]').click();
    const connecting = /connecting/i.test(document.body.innerHTML);
    document.querySelector('g.mk[data-id="m-annual"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    document.querySelector('g.mk[data-id="m-quarterly"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const conns = window.MTL.getState().model.connections;
    return { connecting, added: conns.length - before, lastFlow: conns[conns.length - 1].flow, events: events.length };
  });
  expect(result.connecting).toBe(true);
  expect(result.added).toBe(1);
  expect(result.lastFlow).toBe('report'); // typed connection (output feeds input)
  expect(result.events).toBe(1);
});

test('meeting form: list renders, cadence edit persists to the model, and add-meeting grows it', async ({ page }) => {
  await page.evaluate(() => window.MTL.goto('form'));
  const total = await page.evaluate(() => window.MTL.getState().model.meetings.length);
  await expect(page.locator('.mlist .mrow')).toHaveCount(total);
  // select a meeting and change its cadence interval → reflected in the model
  await page.locator('.mrow[data-id="m-quarterly"]').click();
  await page.locator('input[data-act="cadevery"]').fill('2');
  await expect.poll(() => page.evaluate(() => window.MTL.getState().model.meetings.find(m => m.id === 'm-quarterly').cadence.every)).toBe(2);
  // add a meeting (the "+ Meeting" affordance lives on the landscape toolbar)
  await page.evaluate(() => window.MTL.goto('landscape'));
  await page.locator('[data-act="addmeeting"]').first().click();
  expect(await page.evaluate(() => window.MTL.getState().model.meetings.length)).toBe(total + 1);
});

test('setContext feeds {id,text} aspects; meeting outputRefs offer ARTIFACTS only and store by id', async ({ page }) => {
  await page.evaluate(() => window.MTL.goto('form'));
  await page.evaluate(() => window.MTL.setContext({
    aspects: { s1: { kpis: [{ id: 'k1', text: 'A KPI' }],
                     artifacts: [{ id: 'art1', text: 'Board pack' }, { id: 'art2', text: 'Decision log' }],
                     tools: [{ id: 't1', text: 'A tool' }] } },
    scts: [{ id: 's1', did: 'SCT-001', name: 'Set strategy', sys: 'S4' }],
  }));
  await page.evaluate(() => window.MTL.select('m-quarterly'));
  // the artifact picker offers ONLY artifacts — never kpis or tools
  const opts = (await page.locator('select[data-act="addoutref"] option').allTextContents()).join(' | ');
  expect(opts).toContain('Board pack');
  expect(opts).toContain('Decision log');
  expect(opts).not.toContain('A KPI');
  expect(opts).not.toContain('A tool');
  // linking an artifact stores it by stable id and emits a meeting/output intent
  const events = await page.evaluate(() => { window.__ev = []; window.MTL.onEmit = (m) => window.__ev.push(m); return true; });
  await page.locator('select[data-act="addoutref"]').selectOption('art1');
  await expect.poll(() => page.evaluate(() => (window.MTL.getState().model.meetings.find(m => m.id === 'm-quarterly').outputRefs || []).includes('art1'))).toBe(true);
  expect(await page.evaluate(() => window.__ev.some(m => m.evt === 'meeting' && m.op === 'output'))).toBe(true);
  // the chip resolves id → text (never shows the raw id)
  await expect(page.locator('.tile', { hasText: 'Output artifacts' })).toContainText('Board pack');
});
