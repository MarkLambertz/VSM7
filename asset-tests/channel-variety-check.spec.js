// Real-browser regression suite for the standalone channel-variety-check.html
// (Step VI substep 2: communication variety checks — RAG matrix + radar + bridge).
const { test, expect } = require('@playwright/test');

const PAGE = '/channel-variety-check.html';

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await page.evaluate(() => { try { localStorage.removeItem('cvcChecks1'); } catch (_) {} });
  await page.reload();
  await page.waitForSelector('#matrix .cell');
  await page.waitForFunction(() => !!(window.CVC && window.CVC.getState));
});

test('renders the 8 VSM loops × 4 criteria and the robustness radar', async ({ page }) => {
  await expect(page.locator('.loopcell')).toHaveCount(8);
  await expect(page.locator('.cell')).toHaveCount(32);
  await expect(page.locator('#radar svg polygon').first()).toBeVisible();
  await expect(page.locator('#weakName')).toHaveText(/algedonic/i); // weakest link from the default ratings
  // the S3–S4 homeostat is bilateral → both systems on the chip; one-way channels show one
  await expect(page.locator('.loopcell', { hasText: 'strategy & planning' }).locator('.chip')).toHaveCount(2);
  await expect(page.locator('.loopcell', { hasText: 'coordination' }).locator('.chip')).toHaveCount(1);
});

test('clicking a cell cycles its rating, selects the loop, and recomputes', async ({ page }) => {
  const before = await page.evaluate(() => window.CVC.getState().loops[0].ratings.slice());
  await page.locator('.cell[data-loop="0"][data-crit="0"]').click();
  const after = await page.evaluate(() => window.CVC.getState().loops[0].ratings.slice());
  expect(after).not.toEqual(before);
  expect(await page.locator('.gisel').count()).toBeGreaterThan(0); // the loop's row is highlighted
});

test('bridge: change is emitted; setLoops preserves ratings by id; loadModel restores', async ({ page }) => {
  const changed = await page.evaluate(() => new Promise((res) => {
    window.CVC.onEmit = (m) => { if (m.evt === 'change') { window.CVC.onEmit = null; res(Array.isArray(m.model.loops)); } };
    document.querySelector('.cell[data-loop="1"][data-crit="1"]').click();
  }));
  expect(changed).toBe(true);

  const r = await page.evaluate(() => {
    const keep = window.CVC.getState().loops[0];
    window.CVC.setLoops([{ id: keep.id, sys: keep.sys, label: keep.label }, { id: 'x-new', sys: 'S1', label: 'New' }]);
    const st = window.CVC.getState();
    return { count: st.loops.length, kept: st.loops[0].ratings, blank: st.loops.find((l) => l.id === 'x-new').ratings };
  });
  expect(r.count).toBe(2);
  expect(r.kept.some((v) => v > 0)).toBe(true); // existing ratings survived the re-feed
  expect(r.blank).toEqual([0, 0, 0, 0]);         // a brand-new loop starts unrated

  const loaded = await page.evaluate(() => {
    window.CVC.loadModel({ meta: {}, loops: [{ id: 'a', sys: 'S3', label: 'Only loop', ratings: [3, 2, 1, 3], note: 'x' }] });
    return window.CVC.getState().loops;
  });
  expect(loaded.length).toBe(1);
  expect(loaded[0].ratings).toEqual([3, 2, 1, 3]);
});

test('full screen: button + F request it, and the host is notified', async ({ page }) => {
  await expect(page.locator('#btnFs svg path')).toHaveCount(1);
  await page.evaluate(() => { window.__fs = 0; document.documentElement.requestFullscreen = () => { window.__fs++; return Promise.resolve(); }; });
  await page.locator('#btnFs').click();
  expect(await page.evaluate(() => window.__fs)).toBe(1);
  await page.evaluate(() => { window.__fs = 0; });
  await page.keyboard.press('f');
  expect(await page.evaluate(() => window.__fs)).toBe(1);
  const emitted = await page.evaluate(() => new Promise((res) => {
    window.CVC.onEmit = (m) => { if (m && m.evt === 'fullscreenchange') res(m); };
    document.dispatchEvent(new Event('fullscreenchange'));
  }));
  expect(emitted).toHaveProperty('fullscreen');
});

test('embedded VSM: selecting a loop highlights its channel in the vsm.html iframe', async ({ page }) => {
  await expect(page.locator('#vsmframe')).toHaveAttribute('src', /vsm\?pane=hidden/);
  // wait for the embedded vsm.html to render its channels
  await page.frameLocator('#vsmframe').locator('[data-lyr="b"]').first().waitFor({ timeout: 10000 });
  // select the audit loop → embedded diagram should dim the command channel, keep audit bright
  await page.locator('.loopcell', { hasText: 'real-life information' }).click();
  const iop = (sel) => page.evaluate((s) => { const d = document.getElementById('vsmframe').contentDocument; const el = d && d.querySelector(s); return el ? (el.style.opacity || '1') : null; }, sel);
  await expect.poll(() => iop('[data-lyr="e"]'), { timeout: 10000 }).toBe('0.1');
  expect(await iop('[data-lyr="b"]')).toBe('1');
});

test('toggle: clicking the selected loop again returns the embedded VSM to the default view', async ({ page }) => {
  await page.frameLocator('#vsmframe').locator('[data-lyr="f"]').first().waitFor({ timeout: 10000 });
  const iop = (sel) => page.evaluate((s) => { const d = document.getElementById('vsmframe').contentDocument; const el = d && d.querySelector(s); return el ? (el.style.opacity || '1') : null; }, sel);
  const row = page.locator('.loopcell', { hasText: 'coordination' });
  await row.click(); // 1st → select S2–S1, the metasystem boxes recede
  await expect.poll(() => iop('[data-hl="s5box"]'), { timeout: 10000 }).toBe('0.1');
  await row.click(); // 2nd on the same row → toggle off, back to the default view
  await expect.poll(() => iop('[data-hl="s5box"]'), { timeout: 10000 }).toBe('1');
  expect(await iop('[data-lyr="f"]')).toBe('1');
  await expect(page.locator('.gisel')).toHaveCount(0); // nothing selected
});

test('export: bridge emits exportReady with an outcome SVG and a PNG blob', async ({ page }) => {
  const svg = await page.evaluate(() => new Promise((res) => {
    // fill a detail field so the per-loop detail section has something to render
    window.CVC.select('l-s2s1');
    const el = document.querySelector('#detail [data-f="communication"]'); el.value = 'Daily standup'; el.dispatchEvent(new Event('input', { bubbles: true }));
    window.CVC.onEmit = async (m) => { if (m && m.evt === 'exportReady' && m.format === 'svg') { window.CVC.onEmit = null; res(await m.blob.text()); } };
    window.CVC.export({ format: 'svg', requestId: 's' });
  }));
  expect(svg.startsWith('<svg')).toBe(true);
  expect(svg).toContain('Communication variety checks'); // title band
  expect(svg).toContain('Weakest link');                  // diagnostic readout
  expect(svg).toContain('S5–S1 algedonic signal');        // all loops rendered
  expect(svg).toContain('Capacity');                      // radar axis
  expect(svg).toContain('Per-loop detail');               // detail section rendered
  expect(svg).toContain('Daily standup');                 // a filled detail field is in the export

  const png = await page.evaluate(() => new Promise((res) => {
    window.CVC.onEmit = async (m) => { if (m && m.evt === 'exportReady' && m.format === 'png') { window.CVC.onEmit = null; res({ size: m.blob.size, type: m.blob.type, name: m.filename }); } };
    window.CVC.export({ format: 'png', requestId: 'p' });
  }));
  expect(png.type).toBe('image/png');
  expect(png.size).toBeGreaterThan(2000);
  expect(png.name).toMatch(/\.png$/);
});

test('loop detail: communication/artifact/role persist in the model, emit via change, and survive a re-feed', async ({ page }) => {
  const out = await page.evaluate(async () => {
    let lastModel = null; window.CVC.onEmit = (m) => { if (m.evt === 'change') lastModel = m.model; };
    window.CVC.select('l-s2s1');
    await new Promise((r) => setTimeout(r, 50));
    const fill = (f, v) => { const el = document.querySelector(`#detail [data-f="${f}"]`); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    fill('communication', 'Weekly sync');
    fill('artifact', 'Shared board');
    fill('role', 'Channel owner');
    await new Promise((r) => setTimeout(r, 300)); // let the debounced change{model} emit fire
    const m = window.CVC.getState().loops.find((l) => l.id === 'l-s2s1');
    window.CVC.setLoops([{ id: 'l-s2s1', sys: 'S2', label: 'S2–S1 coordination' }]); // host re-feed
    const after = window.CVC.getState().loops.find((l) => l.id === 'l-s2s1');
    const emitted = lastModel && lastModel.loops.find((l) => l.id === 'l-s2s1');
    return {
      model: { communication: m.communication, artifact: m.artifact, role: m.role },
      emitted: emitted && { communication: emitted.communication, artifact: emitted.artifact, role: emitted.role },
      afterRefeed: { communication: after.communication, artifact: after.artifact, role: after.role },
    };
  });
  const expected = { communication: 'Weekly sync', artifact: 'Shared board', role: 'Channel owner' };
  expect(out.model).toEqual(expected);     // captured in the model
  expect(out.emitted).toEqual(expected);   // emitted to the host via change{model}
  expect(out.afterRefeed).toEqual(expected); // preserved across a setLoops re-feed (like ratings/notes)
});
