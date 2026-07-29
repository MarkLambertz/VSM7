// Real-browser regression suite for the Steering Master (design-previews/steering-master.html) —
// the #/vsm page: management bands over the metasystem, driven by the host through window.SMASTER.
//
// The page is an HONESTY INSTRUMENT. Most of what follows pins defects that actually shipped and
// were caught by live testing on 2026-07-29, because those are the ones that come back:
//   - meetings with no system silently vanished (a band-shaped page has nowhere to put them)
//   - the ribbon and Steering Stats counted the same concept differently (0 vs 3)
//   - export/fullscreen lived in the topbar, which embed mode collapses → invisible at #/vsm
//   - "Flow" was offered in 2D where it did nothing
//   - filters must narrow what the slots LIST, never what the band heads COUNT
const { test, expect } = require('@playwright/test');

const PAGE = '/design-previews/steering-master.html';

// A deterministic fixture in the shape the host's getSteeringMasterViewModel sends. Deliberately
// contains every honesty case at once: an unsteered SCT, an SCT with no accountable, a meeting that
// steers nothing, a meeting with no system at all, an algedonic line, and an unrated loop.
const FIXTURE = {
  context: { sif: 'Fixture SE', level: 'R0', units: ['Alpha unit', 'Beta unit'] },
  model: {
    scts: [
      { id: 'a', did: 'SCT-001', name: 'Steward identity',      sys: 'S5' },   // steered
      { id: 'b', did: 'SCT-002', name: 'Sense the environment',  sys: 'S4' },  // UNSTEERED
      { id: 'c', did: 'SCT-003', name: 'Allocate resources',     sys: 'S3' },  // UNSTEERED + no accountable
      { id: 'd', did: 'SCT-004', name: 'Audit the operation',    sys: 'S3*' }, // steered
      { id: 'e', did: 'SCT-005', name: 'Damp oscillation',       sys: 'S2' },  // UNSTEERED
    ],
    organs: [
      { id: 'm1', name: 'Executive Board',   sys: 'S5',  cad: 'Quarterly', people: 7, covers: ['a'] },
      { id: 'm2', name: 'Audit Circle',      sys: 'S3*', cad: '',          people: 3, covers: ['d'] },
      { id: 'm3', name: 'Legacy Jour Fixe',  sys: 'S3',  cad: 'Weekly',    people: 9, covers: [] },      // steers nothing
      { id: 'm4', name: 'Red Line',          sys: 'S5',  cad: '',          people: 0, covers: [], alg: true }, // exempt
      { id: 'm5', name: 'Unplaced All Hands', sys: null, cad: '',          people: 40, covers: [] },     // NO SYSTEM
    ],
    aspects: { a: { kpis: ['Policy exceptions'], artifacts: [], tools: [] } },
    accountable: { a: 'CEO', b: 'CSO', c: null, d: 'Head of Audit', e: 'COO' },
    loops: [
      { id: 'l1', sys: ['S2'],  name: 'S2-S1 coordination', ratings: [3, 3, 3, 3], note: '', ch: 'f' },
      { id: 'l2', sys: ['S3*'], name: 'S3*-S1 audit',       ratings: [2, 1, 2, 2], note: '', ch: 'b' }, // RED (weakest = clarity)
      { id: 'l3', sys: ['S5'],  name: 'S5 normative',       ratings: [0, 0, 0, 0], note: '', ch: 'h5' }, // unrated
    ],
  },
};

async function loadFixture(page) {
  await page.evaluate((f) => {
    window.SMASTER.setContext(f.context);
    window.SMASTER.setModel(f.model);
  }, FIXTURE);
}

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForFunction(() => !!(window.SMASTER && window.SMASTER.getState));
});

/* ============================ the metasystem, in the method's order ============================ */

test('five bands in the method order, with S3* as its OWN lane (never folded into S3)', async ({ page }) => {
  const ids = await page.locator('[data-headband]').evaluateAll((n) => n.map((e) => e.dataset.headband));
  expect(ids).toEqual(['S5', 'S4', 'S3', 'S3*', 'S2']);
  // the epithets are the method's, not invented UI labels
  const titles = await page.locator('.band-title b').allTextContents();
  expect(titles.slice(0, 5)).toEqual([
    'Normative Guidelines', 'Now & Then', 'Inside & Now', 'Auditing & Real-Life Information', 'Coordination Functions',
  ]);
});

test('S1 is context only — the operative units come from Step I and carry no steering slots', async ({ page }) => {
  await loadFixture(page);
  await expect(page.locator('.s1strip .s1chip')).toHaveText(['Alpha unit', 'Beta unit']);
  expect(await page.locator('.s1strip [data-headband]').count()).toBe(0);
});

/* ============================ the honesty spine ============================ */

test('a meeting with NO system is still visible, named, and counted — it must never vanish', async ({ page }) => {
  await loadFixture(page);
  // it belongs to no band…
  for (const sys of ['S5', 'S4', 'S3', 'S3*', 'S2']) {
    await expect(page.locator(`.band[data-band="${sys}"] [data-organ="m5"]`)).toHaveCount(0);
  }
  // …so the page gives it its own strip rather than dropping it
  const strip = page.locator('.band.unassigned');
  await expect(strip).toHaveCount(1);
  await expect(strip.locator('[data-organ="m5"]')).toContainText('Unplaced All Hands');
  await expect(page.locator('.hpill')).toContainText('1 meeting without a system');
  expect(await page.evaluate(() => window.SMASTER.getState().headline.unassigned)).toBe(1);
});

test('the ribbon and Steering Stats count garbage-collection candidates IDENTICALLY', async ({ page }) => {
  await loadFixture(page);
  // m3 (steers nothing) + m5 (steers nothing, no system); m4 is algedonic and exempt by design
  const headline = await page.evaluate(() => window.SMASTER.getState().headline.gc);
  expect(headline).toBe(2);
  await expect(page.locator('.hpill')).toContainText('2 meetings to review');
  await page.locator('[data-stats]').dispatchEvent('mouseover');
  const stats = page.locator('#statspop');
  await expect(stats).toBeVisible();
  const row = await stats.locator('.row').filter({ hasText: 'steering no task' }).first().locator('.v').textContent();
  expect(row.trim()).toBe(String(headline));   // same number, both places
});

test('an algedonic line is exempt from the garbage-collection check, by design', async ({ page }) => {
  await loadFixture(page);
  // m4 steers nothing but is algedonic — it must NOT be a review candidate
  expect(await page.evaluate(() => window.SMASTER.getState().headline.gc)).toBe(2);
  await expect(page.locator('.band[data-band="S5"] [data-organ="m4"]')).not.toHaveClass(/gc/);
});

test('unsteered SCTs are flagged per band and in the ribbon, never averaged away', async ({ page }) => {
  await loadFixture(page);
  expect(await page.evaluate(() => window.SMASTER.getState().headline.orphans)).toBe(3);   // b, c, e
  await expect(page.locator('.hpill')).toContainText('3 unsteered SCTs');
  await expect(page.locator('.band[data-band="S4"] [data-sct="b"]')).toHaveClass(/orphan/);
  await expect(page.locator('.band[data-band="S5"] [data-sct="a"]')).not.toHaveClass(/orphan/);
});

test('channel health is the WEAKEST link, never an average, and unrated is not red', async ({ page }) => {
  await loadFixture(page);
  // l2 ratings [2,1,2,2] → red, named by its weakest criterion (clarity), NOT by the mean (1.75)
  expect(await page.evaluate(() => window.SMASTER.getState().headline.redLoops)).toBe(1);
  await expect(page.locator('.band[data-band="S3*"] [data-loop="l2"]')).toContainText('clarity');
  // l3 is entirely unrated → must not be counted as broken
  await expect(page.locator('.band[data-band="S5"] [data-loop="l3"]')).toContainText(/not rated/i);
});

test('an empty seat is shown honestly, and no completeness percentage is ever rendered', async ({ page }) => {
  await page.evaluate(() => window.SMASTER.setModel({ scts: [], organs: [], aspects: {}, accountable: {}, loops: [] }));
  expect(await page.evaluate(() => window.SMASTER.getState().systems.every((s) => s.emptySeat))).toBe(true);
  await expect(page.locator('.band[data-band="S4"] .empty')).toContainText('empty seat');
  // the standing rule: this page never scores completeness
  expect(await page.locator('#bands').innerText()).not.toMatch(/\d+\s?%/);
});

/* ============================ filters ============================ */

test('filters narrow what the slots LIST but never what the band heads COUNT', async ({ page }) => {
  await loadFixture(page);
  const s4Head = page.locator('.band[data-band="S4"] .band-counts');
  await expect(s4Head).toContainText('1 SCT');
  await expect(page.locator('.band[data-band="S5"] [data-sct="a"]')).toHaveCount(1);

  await page.locator('[data-fsct="unsteered"]').click();
  // S5's only SCT is steered → its slot is now empty, but the head still reports the true total
  await expect(page.locator('.band[data-band="S5"] [data-sct="a"]')).toHaveCount(0);
  await expect(page.locator('.band[data-band="S5"] .band-counts')).toContainText('1 SCT');
  await expect(page.locator('.band[data-band="S4"] [data-sct="b"]')).toHaveCount(1);
});

test('each filter pill carries its own live count, and clicking the active pill returns to All', async ({ page }) => {
  await loadFixture(page);
  await expect(page.locator('[data-fsct="unsteered"]')).toContainText('3');
  await expect(page.locator('[data-forg="gc"]')).toContainText('2');
  await expect(page.locator('[data-forg="unplaced"]')).toContainText('1');
  await page.locator('[data-forg="gc"]').click();
  await expect(page.locator('[data-forg="gc"]')).toHaveClass(/on/);
  await page.locator('[data-forg="gc"]').click();          // clicking it again is not a trap
  await expect(page.locator('[data-forg="all"]')).toHaveClass(/on/);
});

test('a zero-count filter is shown but inert — never hidden, never clickable', async ({ page }) => {
  await loadFixture(page);
  const alg = page.locator('[data-forg="alg"]');
  await expect(alg).toBeVisible();                          // the fixture has one algedonic line
  await page.evaluate(() => window.SMASTER.setModel({ organs: [] }));
  await expect(page.locator('[data-forg="alg"]')).toHaveClass(/zero/);
  await expect(page.locator('[data-forg="alg"]')).toBeDisabled();
});

test('no filter offers a distinction the canonical model does not track (SCTs carry no state)', async ({ page }) => {
  await loadFixture(page);
  // Step III owns no accept/candidate state, so a "Candidates" pill could only ever read 0
  await expect(page.locator('[data-fsct="candidate"]')).toHaveCount(0);
  await expect(page.locator('.subbar')).not.toContainText('Candidates');
});

/* ============================ view-scoped controls ============================ */

test('Signal flow is a 3D-only control — it is not offered in 2D, where it would do nothing', async ({ page }) => {
  await expect(page.locator('[data-view="2d"]')).toHaveClass(/on/);      // 2D is the default
  await expect(page.locator('[data-flow]')).toHaveCount(0);
  await page.locator('[data-view="3d"]').click();
  await expect(page.locator('[data-flow]')).toHaveCount(1);
  await expect(page.locator('[data-flow]')).toContainText('Signal flow');
  await page.locator('[data-view="2d"]').click();
  await expect(page.locator('[data-flow]')).toHaveCount(0);
});

test('the algedonic channel is OFF by default and drives the shared diagram when switched on', async ({ page }) => {
  await expect(page.locator('[data-alg]')).not.toHaveClass(/on/);
  await page.waitForFunction(() => { const f = document.querySelector('iframe'); return !!(f && f.contentWindow && f.contentWindow.VSM); });
  expect(await page.evaluate(() => document.querySelector('iframe').contentWindow.VSM.getState().shown.g)).toBe(false);
  await page.locator('[data-alg]').click();
  await expect.poll(() => page.evaluate(() => document.querySelector('iframe').contentWindow.VSM.getState().shown.g)).toBe(true);
});

/* ============================ the shared vsm.html diagram, reused as a library ============================ */

test('the diagram is the shared vsm.html — embedded, not redrawn', async ({ page }) => {
  const src = await page.locator('.diagram-card iframe').getAttribute('src');
  expect(src).toMatch(/vsm/);
  expect(src).toContain('pane=hidden');       // driven through its documented embed params
  expect(src).toContain('chrome=min');
  // the page draws no VSM of its own in 2D
  expect(await page.locator('.diagram-card > svg').count()).toBe(0);
});

test('band → diagram sync: selecting each band selects the matching element, S3* included', async ({ page }) => {
  await page.waitForFunction(() => { const f = document.querySelector('iframe'); return !!(f && f.contentWindow && f.contentWindow.VSM); });
  for (const [band, el] of [['S5', '5'], ['S4', '4'], ['S3', '3'], ['S3*', '3*'], ['S2', '2']]) {
    await page.locator(`[data-headband="${band}"]`).click();
    expect(await page.evaluate(() => window.SMASTER.getState().selected)).toBe(band);
    await expect.poll(() => page.evaluate(() => {
      const s = document.querySelector('iframe').contentWindow.VSM.getState().selected;
      return s && s.type;
    })).toBe(el);
  }
});

test('focusing a band dims the others; Esc clears it in 2D', async ({ page }) => {
  await page.locator('[data-headband="S3"]').click();
  await expect(page.locator('.band.dim')).toHaveCount(4);
  await expect(page.locator('.band.sel')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.band.dim')).toHaveCount(0);
  expect(await page.evaluate(() => window.SMASTER.getState().selected)).toBe(null);
});

test('Reset view is a 3D camera control, and it clears the band focus too', async ({ page }) => {
  // it lives in the 3D hint bar (.d3hint), which only renders in the 3D view
  await expect(page.locator('[data-resetview]')).toBeHidden();
  await page.locator('[data-view="3d"]').click();
  await page.locator('[data-headband="S3"]').click();
  await expect(page.locator('.band.dim')).toHaveCount(4);
  await page.locator('[data-resetview]').click();
  await expect(page.locator('.band.dim')).toHaveCount(0);
  expect(await page.evaluate(() => window.SMASTER.getState().selected)).toBe(null);
});

/* ============================ the house chrome ============================ */

test('export and fullscreen live in the TILE HEAD, so embed mode cannot hide them', async ({ page }) => {
  // they used to sit in the topbar, which `body.embed` collapses — invisible once embedded at #/vsm
  await expect(page.locator('.diagram-head .tools [data-act="export"]')).toBeVisible();
  await expect(page.locator('.diagram-head .tools #fsBtn')).toBeVisible();
  await page.goto(`${PAGE}?host=vsm7`);
  await page.waitForFunction(() => !!(window.SMASTER && window.SMASTER.getState));
  await expect(page.locator('body')).toHaveClass(/embed/);
  await expect(page.locator('.topbar')).toBeHidden();
  await expect(page.locator('.diagram-head .tools [data-act="export"]')).toBeVisible();
  await expect(page.locator('.diagram-head .tools #fsBtn')).toBeVisible();
});

test('export asks the HOST to open the shared panel — the page owns no exporter', async ({ page }) => {
  const seen = await page.evaluate(async () => {
    const out = [];
    window.SMASTER.onEmit = (m) => out.push(m);
    document.querySelector('[data-act="export"]').click();
    return out;
  });
  expect(seen.some((m) => m.evt === 'requestExportPanel' && m.api === 1)).toBe(true);
});

/* ============================ host navigation (SMASTER api:1) ============================ */

test('an SCT detail link asks the host to open Step V with that SCT\'s system', async ({ page }) => {
  await loadFixture(page);
  const seen = await page.evaluate(async () => {
    const out = [];
    window.SMASTER.onEmit = (m) => out.push(m);
    document.querySelector('.band[data-band="S3*"] [data-sct="d"]').click();
    await new Promise((r) => setTimeout(r, 60));
    document.querySelector('#pop [data-nav]').click();
    return out;
  });
  const nav = seen.find((m) => m.evt === 'navigate');
  // api:1 is load-bearing — resolveSteeringMasterNavigation drops the message without it
  expect(nav).toMatchObject({ evt: 'navigate', api: 1, stepId: 'step5', system: 'S3*', sctId: 'd' });
});

test('a meeting detail link asks the host to open 7.6 with that meeting selected', async ({ page }) => {
  await loadFixture(page);
  const seen = await page.evaluate(async () => {
    const out = [];
    window.SMASTER.onEmit = (m) => out.push(m);
    document.querySelector('.band[data-band="S5"] [data-organ="m1"]').click();
    await new Promise((r) => setTimeout(r, 60));
    document.querySelector('#pop [data-nav]').click();
    return out;
  });
  expect(seen.find((m) => m.evt === 'navigate'))
    .toMatchObject({ evt: 'navigate', api: 1, stepId: 'step7', substep: '7.6', meetingId: 'm1' });
});

test('a meeting with no system can still be opened in 7.6 — that is how it gets placed', async ({ page }) => {
  await loadFixture(page);
  const seen = await page.evaluate(async () => {
    const out = [];
    window.SMASTER.onEmit = (m) => out.push(m);
    document.querySelector('.band.unassigned [data-organ="m5"]').click();
    await new Promise((r) => setTimeout(r, 60));
    document.querySelector('#pop [data-nav]').click();
    return out;
  });
  expect(seen.find((m) => m.evt === 'navigate')).toMatchObject({ stepId: 'step7', substep: '7.6', meetingId: 'm5' });
});

test('the page never navigates itself — no parent hash writes, no parent DOM access', async ({ page }) => {
  const src = await page.evaluate(() => document.documentElement.outerHTML);
  expect(src).not.toMatch(/parent\.location/);
  expect(src).not.toMatch(/parent\.document/);
  expect(src).not.toMatch(/top\.location/);
});

/* ============================ the bridge contract ============================ */

test('setModel/setContext drive everything — the page stores nothing of its own', async ({ page }) => {
  await loadFixture(page);
  expect(await page.evaluate(() => window.SMASTER.getState().sif)).toBe('Fixture SE');
  await page.evaluate(() => window.SMASTER.setModel({ scts: [], organs: [], aspects: {}, accountable: {}, loops: [] }));
  expect(await page.evaluate(() => window.SMASTER.getState().headline))
    .toMatchObject({ orphans: 0, gc: 0, unassigned: 0, redLoops: 0, noAcc: 0 });
  // nothing was persisted behind the host's back
  expect(await page.evaluate(() => Object.keys(window.localStorage).filter((k) => /smaster|steering/i.test(k)))).toEqual([]);
});

test('getState reports the honesty spine as integers the host can assert on', async ({ page }) => {
  await loadFixture(page);
  const st = await page.evaluate(() => window.SMASTER.getState());
  expect(Object.keys(st.headline).sort()).toEqual(['gc', 'noAcc', 'orphans', 'redLoops', 'seats', 'unassigned']);
  expect(st.systems.map((s) => s.id)).toEqual(['S5', 'S4', 'S3', 'S3*', 'S2']);
  expect(st.systems.find((s) => s.id === 'S4')).toMatchObject({ scts: 1, organs: 0, orphans: 1 });
});

test('a partial model never throws and never invents — missing keys leave the rest standing', async ({ page }) => {
  await loadFixture(page);
  await page.evaluate(() => window.SMASTER.setModel({ organs: [] }));          // only organs replaced
  const st = await page.evaluate(() => window.SMASTER.getState());
  expect(st.systems.reduce((n, s) => n + s.scts, 0)).toBe(5);                  // SCTs survived
  expect(st.headline.orphans).toBe(5);                                        // …and are now all unsteered
  await page.evaluate(() => window.SMASTER.setModel(null));                    // garbage in
  expect(await page.evaluate(() => window.SMASTER.getState().headline.orphans)).toBe(5);   // …changes nothing
});

test('an SCT with no accountable is an open gap, not a filled-in guess', async ({ page }) => {
  await loadFixture(page);
  expect(await page.evaluate(() => window.SMASTER.getState().headline.noAcc)).toBe(1);
  await page.locator('.band[data-band="S3"] [data-sct="c"]').click();
  await expect(page.locator('#pop')).toContainText('no accountable role yet');
  expect(await page.locator('#pop').innerText()).not.toMatch(/unassigned|n\/a|tbd/i);
});

test('empty cadence renders no dangling separator (7.6 carries no cadence field today)', async ({ page }) => {
  await loadFixture(page);
  // m2 has cad:'' — the chip title must read the name alone, not "Audit Circle · "
  expect(await page.locator('[data-organ="m2"]').getAttribute('title')).toBe('Audit Circle');
  await page.locator('.band[data-band="S3*"] [data-organ="m2"]').click();
  expect((await page.locator('#pop .sub').innerText()).trim()).not.toMatch(/·\s*$/);
});
