// Real-browser regression suite for the Organizational Representation asset (org-chart.html — Step VII 7.7,
// "The Nested Estate"). Covers the three layout modes (Levels / Nested / Cabinet), the honesty spine
// (headline + badges computed by the verbatim 7.2 warnings() predicate), the accountability overlay,
// the Plain⇄Expert language toggle, the warning stepper, requestFix (propose-never-mutate), recursion
// unfold, the token-free/foreignObject-free export, and the window.ORG bridge.
const { test, expect } = require('@playwright/test');

const PAGE = '/design-previews/org-chart.html';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.removeItem('orgChart1'); } catch (e) {} });
  await page.goto(PAGE);
  await page.waitForFunction(() => !!(window.ORG && window.ORG.getState));
});

test('window.ORG bridge: getState exposes ctx / model / ui in the house shape', async ({ page }) => {
  const shape = await page.evaluate(() => {
    const s = window.ORG.getState();
    return {
      ctx: Object.keys(s.ctx).sort(),
      model: Object.keys(s.model).sort(),
      ui: Object.keys(s.ui).sort(),
      units: s.model.units.length, vessels: s.model.vessels.length, contribs: s.model.contribs.length,
    };
  });
  expect(shape.ctx).toEqual(['scts', 'sif', 'units']);
  expect(shape.model).toEqual(['contribs', 'hierarchy', 'rasic', 'scts', 'units', 'vessels']);
  expect(shape.ui).toEqual(['depth', 'lang', 'mode', 'overlays', 'selected', 'skin']);
  expect(shape.units).toBe(6);
  expect(shape.vessels).toBe(22);
});

test('levels default: hierarchy editor renders the seeded tree — root, units, functions, leaders, empty tray', async ({ page }) => {
  expect(await page.evaluate(() => window.ORG.getState().ui.mode)).toBe('orgchart');
  // seeded tree: root + 4 units + 6 functions as boxes, roles as chips
  expect(await page.evaluate(() => document.querySelectorAll('#canvasHost g[data-nid]').length)).toBe(11);
  for (const id of ['u-mob', 'u-ind', 'u-con', 'u-ene']) {
    await expect(page.locator(`#canvasHost g[data-nid="${id}"]`)).toHaveCount(1);
  }
  // MD pattern seeds leaders on the unit boxes (★), members render as chips
  const seeded = await page.evaluate(() => ({
    mobLeader: hLeader('u-mob'), chips: document.querySelectorAll('#canvasHost .rchip').length,
    hier: Object.keys(window.ORG.getState().model.hierarchy).length,
    trayEmpty: /everything is placed/.test(document.querySelector('#edTray').textContent),
    // honest seeding (2026-07-24): only high-confidence placements — a role with no matching function
    // AND a non-box scope is left in Unassigned rather than fabricated into the first box that fits
    trayed: VESSELS.filter((v) => v.type === 'role' && !window.ORG.getState().model.hierarchy[v.id]).map((v) => v.id),
  }));
  expect(seeded.mobLeader).toBe('r-mob');
  expect(seeded.chips).toBeGreaterThan(5);
  // 4 unit boxes + 6 function boxes + 9 confidently-placed roles = 19; r-id (S5, SIF-scoped, no S5 function) trays honestly
  expect(seeded.hier).toBe(19);
  expect(seeded.trayEmpty).toBe(false);
  expect(seeded.trayed).toEqual(['r-id']);
});

test('honest headline is computed from the verbatim warnings(): 2 no-owner · 1 doubled · 1 out-of-scope, with hard badges on the chart', async ({ page }) => {
  const txt = await page.locator('.hpill').textContent();
  expect(txt).toMatch(/2\s+no owner/);
  expect(txt).toMatch(/1\s+doubled/);
  expect(txt).toMatch(/1\s+out of scope/);
  // hard defects always render even with the gaps overlay off: 2A (double) + 0A (no-owner) glyphs
  const glyphs = await page.evaluate(() => {
    const t = [...document.querySelectorAll('#canvasHost text')].map(n => n.textContent);
    return { has2A: t.includes('2A'), has0A: t.includes('0A') };
  });
  expect(glyphs.has2A).toBe(true); // c7 double-accountability
  expect(glyphs.has0A).toBe(true); // c12 no-accountable (Consumer Goods)
});

test('mode switch: only Levels + Cabinet remain; Cabinet reuses the polished vsm.html diagram (S3* seat never dropped)', async ({ page }) => {
  // the Nested view was removed — the mode seg offers exactly Levels and Cabinet
  expect(await page.evaluate(() => [...document.querySelectorAll('#modeSeg button')].map((b) => b.dataset.mode))).toEqual(['orgchart', 'vsm']);
  await page.locator('#modeSeg button[data-mode="vsm"]').click();
  // Cabinet embeds the shared VSM diagram (same reuse as Step VI), not a hand-rendered SVG
  await expect(page.locator('#vsmframe')).toBeVisible();
  const frame = page.frameLocator('#vsmframe');
  // S3* is structurally present in the embedded diagram (never dropped)
  await expect(frame.locator('svg text', { hasText: /^3\*$/ }).first()).toBeVisible();
  // the org model's operating units feed the S1 layer (e.g. Mobility)
  await expect(frame.locator('svg text', { hasText: 'Mobility' }).first()).toBeVisible();
  // the org canvas host no longer hand-draws the cabinet SVG
  expect(await page.evaluate(() => !!document.querySelector('#canvasHost svg'))).toBe(false);
  // and the "Reveal how it steers" morph button (whose target was the removed Nested view) is gone
  expect(await page.evaluate(() => !!document.querySelector('[data-act="reveal"]'))).toBe(false);
});

test('the Plain/Expert language toggle is removed — labels are Plain and stay Plain', async ({ page }) => {
  expect(await page.evaluate(() => !!document.querySelector('#langSeg'))).toBe(false);
  expect(await page.evaluate(() => window.ORG.getState().ui.lang)).toBe('plain');
  // plain labels on the overlay chips
  await expect(page.locator('.subbar .tog[data-ov="acct"]')).toHaveText(/Who.s accountable/);
  await expect(page.locator('.subbar .tog[data-ov="gaps"]')).toHaveText(/Gaps/);
});

test('the Colour overlay button and the Workshop/Command Deck skin toggle are gone (colour is Cabinet-only; skin is host-driven)', async ({ page }) => {
  expect(await page.evaluate(() => document.querySelectorAll('.subbar .tog[data-ov="colour"]').length)).toBe(0);
  expect(await page.evaluate(() => !!document.querySelector('#skinSeg'))).toBe(false);
  // Levels boxes carry no VSM-system fill — a function box is never reduced to one system
  const levelsColoured = await page.evaluate(() => ['#34404c', '#df6353', '#63b16c', '#9dbed2', '#efbd45', '#b85045']
    .some((c) => !!document.querySelector(`#canvasHost rect.box[fill="${c}"]`)));
  expect(levelsColoured).toBe(false);
  // but the host can still drive the skin over the bridge
  await page.evaluate(() => window.ORG.skin('deck'));
  expect(await page.evaluate(() => document.body.dataset.skin)).toBe('deck');
  await page.evaluate(() => window.ORG.skin('workshop'));
});

test('accountability overlay draws RASIC chips on the leaders — the accountable MD carries a dominant A', async ({ page }) => {
  await page.locator('.subbar .tog[data-ov="acct"]').click();
  // every leader holding an A shows the dominant A chip (RCOL.A #f0a79b); r-mob is one of them
  const r = await page.evaluate(() => ({
    aChips: document.querySelectorAll('#canvasHost rect[fill="#f0a79b"]').length,
    mobHasA: !!document.querySelector('g[data-nid="u-mob"] rect[fill="#f0a79b"]'),
  }));
  expect(r.aChips).toBeGreaterThanOrEqual(2);
  expect(r.mobHasA).toBe(true);
});

test('warning stepper: clicking the headline walks to a warned contribution and enables the gaps overlay', async ({ page }) => {
  await page.locator('.hpill').click();
  const st = await page.evaluate(() => ({ gaps: window.ORG.getState().ui.overlays.gaps, insp: document.querySelector('#inspector').textContent }));
  expect(st.gaps).toBe(true);
  expect(st.insp).toMatch(/Double accountability|No accountable|outside the Step IV|thin authority|candidate/);
});

test('requestFix proposes an accountable to the host and never mutates the RASIC spine', async ({ page }) => {
  const res = await page.evaluate(() => {
    const events = []; window.ORG.onEmit = m => events.push(m);
    const before = window.ORG.getState().model.rasic['c12|r-con']; // Consumer Goods delivery has no accountable
    window.ORG.select('u-con');
    const btn = document.querySelector('[data-act="requestfix"]');
    const had = !!btn; if (btn) btn.click();
    const after = window.ORG.getState().model.rasic['c12|r-con'];
    return { had, event: events.find(e => e.evt === 'requestFix') || null, before, after };
  });
  expect(res.had).toBe(true);
  expect(res.event).toMatchObject({ evt: 'requestFix', letter: 'A' });
  expect(res.event.contribId).toBeTruthy();
  expect(res.before).toBeUndefined();
  expect(res.after).toBeUndefined(); // the chart proposed, it did NOT write the spine
});

test('recursion unfold: descends one level with breadcrumb + back-up, no fabricated sub-structure', async ({ page }) => {
  await page.evaluate(() => window.ORG.select('u-mob'));
  await page.locator('[data-act="unfold"][data-id="u-mob"]').click();
  expect(await page.evaluate(() => window.ORG.getState().ui.depth)).toBe(1);
  await expect(page.locator('#crumbs')).toContainText('Mobility');
  await expect(page.locator('#backup')).toHaveClass(/show/);
  // the editor re-roots on the drilled unit: only Mobility's branch renders (u-mob + its seeded function)
  const drill = await page.evaluate(() => ({
    boxes: document.querySelectorAll('#canvasHost g[data-nid]').length,
    rootIsMob: !!document.querySelector('#canvasHost g[data-nid="u-mob"]'),
    othersGone: !document.querySelector('#canvasHost g[data-nid="u-ind"]'),
  }));
  expect(drill.rootIsMob).toBe(true);
  expect(drill.othersGone).toBe(true);
  expect(drill.boxes).toBe(2);
});

test('export SVG is token-free, foreignObject-free, valid, and bakes the gap count into the filename', async ({ page }) => {
  const clean = await page.evaluate(() => {
    const svg = buildExportSVG({ colour: true, gaps: true, hideAcct: false, caption: '', hc: headlineCounts() });
    return {
      hasVar: /var\(--/.test(svg), hasFO: /foreignObject/.test(svg), hasClass: /class="canvas"/.test(svg),
      parses: !new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror'),
    };
  });
  expect(clean.hasVar).toBe(false);
  expect(clean.hasFO).toBe(false);
  expect(clean.hasClass).toBe(false);
  expect(clean.parses).toBe(true);
  // real download carries the honest gap count in the filename
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    (async () => {
      await page.locator('[data-act="export"]').click();
      await page.locator('.preset input[value="svg"]').check();
      await page.locator('[data-act="doexport"]').click();
    })(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\d+-open-accountability-gaps\.svg$/);
});

test('empty model: designed empty state renders, never fabricates structure, never crashes', async ({ page }) => {
  const res = await page.evaluate(() => {
    let errored = false;
    try { window.ORG.loadModel({ units: [], vessels: [], contribs: [], rasic: {}, scts: [] }); } catch (e) { errored = true; }
    return { errored, nodes: document.querySelectorAll('#canvasHost g.node').length, text: document.querySelector('#canvasHost').textContent, getStateOk: !!window.ORG.getState() };
  });
  expect(res.errored).toBe(false);
  expect(res.getStateOk).toBe(true);
  expect(res.nodes).toBe(0); // no fabricated boxes
  expect(res.text).toMatch(/take shape|will not invent any structure/);
});

test('honesty in Cabinet: S3* is always drawn and the accountability-gap headline stays on screen (no gap can hide in the flagship view)', async ({ page }) => {
  await page.evaluate(() => { window.ORG.setOverlay('gaps', true); window.ORG.setMode('vsm'); });
  // S3* is structurally present in the embedded diagram — the audit seat can never be dropped
  const frame = page.frameLocator('#vsmframe');
  await expect(frame.locator('svg text', { hasText: /^3\*$/ }).first()).toBeVisible();
  // the gap headline is mode-independent: the accountability counts remain visible in Cabinet, so no gap hides behind the flagship view
  await expect(page.locator('.headline .hpill.attn')).toBeVisible();
});

test('meetings overlay is live: toggling it adds/removes meeting organ chips', async ({ page }) => {
  await page.evaluate(() => window.ORG.setMode('orgchart'));
  const r = await page.evaluate(() => {
    window.ORG.setOverlay('meetings', false);
    const off = [...document.querySelectorAll('#canvasHost text')].filter(t => /◇/.test(t.textContent)).length;
    window.ORG.setOverlay('meetings', true);
    const on = [...document.querySelectorAll('#canvasHost text')].filter(t => /◇/.test(t.textContent)).length;
    return { off, on };
  });
  expect(r.off).toBe(0);
  expect(r.on).toBeGreaterThan(0);
});

test('Cabinet has no channel-isolation chips, and there is no Focus button (both removed)', async ({ page }) => {
  await page.evaluate(() => window.ORG.setMode('vsm'));
  expect(await page.evaluate(() => document.querySelectorAll('.subbar .chan,[data-act="chan"]').length)).toBe(0);
  expect(await page.evaluate(() => !!document.querySelector('#focusBtn'))).toBe(false);
  // Cabinet still renders every channel at full strength (S3* audit dashed line present, not dimmed)
  expect(await page.evaluate(() => document.querySelectorAll('#canvasHost g[opacity="0.12"]').length)).toBe(0);
});

test('robustness: after unfolding, a host model swap without the focused unit clears the stale stack', async ({ page }) => {
  const depth = await page.evaluate(() => {
    window.ORG.setMode('orgchart');
    window.ORG.select('u-mob');
    document.querySelector('[data-act="unfold"][data-id="u-mob"]').click();
    const d1 = window.ORG.getState().ui.depth;
    window.ORG.loadModel({ units: [{ id: 'u-sif', name: 'X', level: 'R0', sif: true }], vessels: [], contribs: [], rasic: {}, scts: [] });
    return { d1, d2: window.ORG.getState().ui.depth };
  });
  expect(depth.d1).toBe(1);
  expect(depth.d2).toBe(0); // stack reconciled — no orphaned focus on a removed unit
});

test('no jargon leak: "steering organs" never appears in Plain mode (only under Expert)', async ({ page }) => {
  const r = await page.evaluate(() => {
    window.ORG.setMode('orgchart'); window.ORG.setLang('plain');
    const plain = /steering organs/i.test(document.querySelector('#canvasHost').textContent || '');
    return { plain };
  });
  expect(r.plain).toBe(false);
});

test('window.ORG optional host warnings: present → rendered verbatim; absent → parity fallback', async ({ page }) => {
  expect(await page.locator('.hpill').textContent()).toMatch(/2\s+no owner/); // local parity-predicate baseline
  const m = await page.evaluate(() => window.ORG.getState().model);
  // host becomes authoritative with a single explicit warning
  await page.evaluate((model) => window.ORG.loadModel(Object.assign({}, model, {
    warnings: { c10: [{ code: 'no-accountable', severity: 3, message: 'HOST: Mobility delivery has no owner.' }] },
  })), m);
  expect(await page.locator('.hpill').textContent()).toMatch(/1\s+no owner/);           // only the host's warning is counted
  expect(await page.evaluate(() => warnings('c10')[0].t)).toBe('HOST: Mobility delivery has no owner.'); // verbatim message
  expect(await page.evaluate(() => warnings('c7').length)).toBe(0);                       // local double-A suppressed under host authority
  // clearing warnings restores the parity fallback
  await page.evaluate((model) => window.ORG.loadModel(Object.assign({}, model, { warnings: null })), m);
  expect(await page.locator('.hpill').textContent()).toMatch(/2\s+no owner/);
});

test('host-shaped context (getStep7OrgChartContext): flat-level units nest under SIF, alias contribution fields resolve, empty warnings falls back (honest)', async ({ page }) => {
  // exactly the shape src/domain/vsm.js getStep7OrgChartContext returns: `contributions` key, sctId/vsmSystem/
  // accountableOrganizationId/organizationId/contribution fields, units with no `parent`/`sif`, and warnings:{}.
  await page.evaluate(() => window.ORG.setContext({
    units: [{ id: 'o-grp', level: 'R+1', name: 'Group' }, { id: 'o-sif', level: 'R0', name: 'SIF' }, { id: 'o-a', level: 'R-1', name: 'Unit A' }, { id: 'o-b', level: 'R-1', name: 'Unit B' }],
    scts: [{ id: 't1', did: 'SCT-001', name: 'Do the thing', sys: 'S1' }],
    contributions: [{ id: 't1|o-a', sctId: 't1', organizationId: 'o-a', vsmSystem: 'S1', accountableOrganizationId: 'o-a', contribution: 'Run A' }],
    vessels: [{ id: 'v-md-a', type: 'role', name: 'MD A', scope: 'o-a', state: 'accepted', sys: 'S1', prov: 'x', purpose: 'y' }],
    rasic: {},        // no accountable on t1|o-a → a real no-owner gap
    warnings: {},     // present-but-empty must NOT suppress it (would be a dishonest clean chart)
    sifName: 'SIF Co',
  }));
  // flat recursion-level list still nests: both R-1 units render as children of the R0 SIF
  await expect(page.locator('#canvasHost g.node[data-id="o-a"]')).toHaveCount(1);
  await expect(page.locator('#canvasHost g.node[data-id="o-b"]')).toHaveCount(1);
  // empty warnings:{} → parity fallback → the real gap shows; chart is NOT falsely clean
  await expect(page.locator('.hpill')).toContainText(/no owner/);
  // aliased contribution fields resolve: the SCT is shown by did+name in the unit inspector
  await page.evaluate(() => window.ORG.select('o-a'));
  await expect(page.locator('#inspector')).toContainText('Do the thing');
  await expect(page.locator('#inspector')).toContainText('SCT-001');
});

test('hierarchy editor: drag a branch onto another box re-parents it (ghost, tint, +N, snackbar), undo restores', async ({ page }) => {
  const r = await page.evaluate(() => {
    const svg = document.querySelector('#canvasHost svg.canvas');
    const z = state.zoom || 1; // the chart now opens auto-fitted to fill the height → account for the scale when mapping layout coords to the screen
    const ptOf = (id) => { const p = state._layout.pos[id], rc = svg.getBoundingClientRect(); return { x: rc.left + (p.x + p.w / 2) * z, y: rc.top + (p.y + 10) * z }; };
    const from = ptOf('f-audit'), to = ptOf('u-mob');
    const g = document.querySelector('g[data-nid="f-audit"]');
    g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: from.x, clientY: from.y, button: 0 }));
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: from.x + 8, clientY: from.y + 8 }));
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: to.x, clientY: to.y }));
    const ghost = !!document.querySelector('.drag-ghost'), plusN = /\+1/.test((document.querySelector('.drag-ghost') || {}).textContent || '');
    const tint = !!document.querySelector('g[data-nid="u-mob"].droptarget');
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: to.x, clientY: to.y }));
    const moved = HIER['f-audit'].parent === 'u-mob';
    const snack = (document.querySelector('#snack') || {}).textContent || '';
    hierUndo();
    return { ghost, plusN, tint, moved, snack, undone: HIER['f-audit'].parent === 'root' };
  });
  expect(r.ghost).toBe(true);
  expect(r.plusN).toBe(true);       // branch moves with its subtree, chip ghost shows +N
  expect(r.tint).toBe(true);
  expect(r.moved).toBe(true);
  expect(r.snack).toMatch(/Moved Internal Audit/);
  expect(r.undone).toBe(true);
});

test('hierarchy editor: cycle guard, sibling reorder, leader slot, unplace-to-tray — all through the one move() command', async ({ page }) => {
  const r = await page.evaluate(() => {
    const out = {};
    out.cycleBlocked = !hierMove('u-mob', 'f-mob', null);          // cannot drop a parent into its own subtree
    hierMove('u-ene', 'root', 0, 'keep'); out.reordered = hBoxKids('root')[0] === 'u-ene';   // durable sibling order
    const p = HIER['r-co'].parent;
    runMenuAction('mkmember', 'r-co'); out.member = HIER['r-co'].slot === undefined;
    runMenuAction('mkleader', 'r-co'); out.leader = hLeader(p) === 'r-co';                    // one leader per box
    hierUnplace('f-res'); out.inTray = !!document.querySelector('.tchip[data-tray="f-res"]');  // roles/boxes return to Unassigned
    hierMove('f-res', 'root', null); out.back = HIER['f-res'].parent === 'root';
    return out;
  });
  expect(r).toEqual({ cycleBlocked: true, reordered: true, member: true, leader: true, inTray: true, back: true });
});

test('hierarchy is canonical on the bridge: change{model.hierarchy} fires on a move; a host-fed hierarchy is respected, not reseeded', async ({ page }) => {
  const r = await page.evaluate(async () => {
    let change = null; window.ORG.onEmit = (m) => { if (m.evt === 'change') change = m; };
    const intents = []; const keep = window.ORG.onEmit;
    window.ORG.onEmit = (m) => { keep(m); if (m.evt === 'hierarchy') intents.push(m); };
    hierMove('f-strat', 'u-ene', null);
    await new Promise((res) => setTimeout(res, 250));
    const out = { changeHasHier: !!(change && change.model.hierarchy), intent: intents[0] && intents[0].op };
    // host feeds an authored hierarchy → adopted verbatim (no reseed on top)
    const m = window.ORG.getState().model;
    window.ORG.loadModel(Object.assign({}, m, { hierarchy: { 'u-mob': { parent: 'root', order: 0 } } }));
    out.adopted = Object.keys(window.ORG.getState().model.hierarchy).length === 1;
    return out;
  });
  expect(r.changeHasHier).toBe(true);
  expect(r.intent).toBe('move');
  expect(r.adopted).toBe(true);
});

test('review fixes: one leader per box survives keep-slot moves; drag-away cancels; drilled root is not a sibling target', async ({ page }) => {
  const r = await page.evaluate(() => {
    const out = {};
    // 1. two-leaders via 'keep': promote a leader role into a box that already has one → incumbent demoted, never two
    hierMove('r-au', 'u-mob', null, 'keep');            // r-au is leader of f-audit; u-mob's leader is r-mob
    const leaders = hChildren('u-mob').filter((id) => HIER[id].slot === 'leader');
    out.oneLeader = leaders.length === 1;
    out.visible = hLeader('u-mob') === 'r-au' ? hMembers('u-mob').includes('r-mob') : hMembers('u-mob').includes('r-au'); // the demoted one stays visible as member
    hierUndo();
    // 2. stale-target: drag over a box, then release over empty space → NO move committed
    const svg = document.querySelector('#canvasHost svg.canvas'); const rc = svg.getBoundingClientRect();
    const pOf = (id) => { const p = state._layout.pos[id]; return { x: rc.left + p.x + p.w / 2, y: rc.top + p.y + 10 }; };
    const from = pOf('f-audit'), over = pOf('u-mob');
    const parentBefore = HIER['f-audit'].parent;
    document.querySelector('g[data-nid="f-audit"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: from.x, clientY: from.y, button: 0 }));
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: over.x, clientY: over.y, pointerType: 'mouse', buttons: 1 }));
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: rc.left + 5, clientY: rc.bottom + 200, pointerType: 'mouse', buttons: 1 })); // far off the chart
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: rc.left + 5, clientY: rc.bottom + 200 }));
    out.dragAwayCancelled = HIER['f-audit'].parent === parentBefore;
    // 3. drilled root: while drilled into u-mob, the root box gives no before/after zones and is not grabbable
    unfold('u-mob');
    const L = state._layout;
    out.drillRK = L.RK === 'u-mob';
    const rp = L.pos['u-mob']; const rrc = document.querySelector('#canvasHost svg.canvas').getBoundingClientRect();
    document.querySelector('g[data-nid="f-mob"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: rrc.left + L.pos['f-mob'].x + 20, clientY: rrc.top + L.pos['f-mob'].y + 8, button: 0 }));
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: rrc.left + rp.x + 4, clientY: rrc.top + rp.y + 10, pointerType: 'mouse', buttons: 1 })); // outer-left edge of drilled root
    out.noSiblingZone = DRAG.zone !== 'before' && DRAG.zone !== 'after';
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    popLevel();
    return out;
  });
  expect(r.oneLeader).toBe(true);
  expect(r.visible).toBe(true);
  expect(r.dragAwayCancelled).toBe(true);
  expect(r.drillRK).toBe(true);
  expect(r.noSiblingZone).toBe(true);
});

test('review fixes: a deliberately emptied tree is never re-seeded; unplace keeps sibling order sane and undo restores it', async ({ page }) => {
  const r = await page.evaluate(() => {
    const out = {};
    // empty the whole chart by hand
    hBoxKids('root').slice().forEach((id) => hierUnplace(id));
    hChildren('root').slice().forEach((id) => hierUnplace(id));
    out.emptied = Object.keys(HIER).length === 0;
    seedHierarchy();                                     // boot/host would call this
    out.notReseeded = Object.keys(HIER).length === 0;    // authored-empty is respected
    return out;
  });
  expect(r.emptied).toBe(true);
  expect(r.notReseeded).toBe(true);
  // fresh page for the order test
  await page.reload();
  await page.waitForFunction(() => !!(window.ORG && window.ORG.getState));
  const o = await page.evaluate(() => {
    // remove a middle box with children → its children take its position; undo restores the exact order
    const before = hBoxKids('root').join(',');
    hierMove('f-strat', 'u-ind', null);                  // give u-ind a second box child
    const rootBefore = hBoxKids('root').join(',');
    hierUnplace('u-ind');                                // children f-ind + f-strat promote to root at u-ind's slot
    const after = hBoxKids('root');
    const at = after.indexOf('f-ind');
    const contiguous = at >= 0 && after[at + 1] === 'f-strat';
    const orders = hChildren('root').map((id) => HIER[id].order).join(',');
    const unique = new Set(hChildren('root').map((id) => HIER[id].order)).size === hChildren('root').length;
    hierUndo();
    const restored = hBoxKids('root').join(',') === rootBefore;
    return { contiguous, unique, restored, orders };
  });
  expect(o.contiguous).toBe(true);  // promoted children appear together at the removed box's position
  expect(o.unique).toBe(true);      // no colliding order values
  expect(o.restored).toBe(true);    // undo restores the pre-remove order exactly
});

test('house rule: no completeness percentage anywhere in the chrome', async ({ page }) => {
  await page.locator('.subbar .tog[data-ov="gaps"]').click();
  // blank the zoom readout while reading: a zoom level (e.g. 100%) is not a completeness metric
  const bodyText = await page.evaluate(() => {
    const z = document.querySelector('#zoomPct'); const saved = z ? z.textContent : null; if (z) z.textContent = '';
    const t = document.querySelector('.app').innerText;
    if (z) z.textContent = saved;
    return t;
  });
  expect(bodyText).not.toMatch(/\d+\s*%/);
});

test('the editor canvas is a real window: zoom controls scale it, and dragging empty space pans', async ({ page }) => {
  await page.evaluate(() => window.ORG.setMode('orgchart'));
  await expect(page.locator('#zoomCtl')).toBeVisible();
  // zoom in via the control scales the inner layer
  const z0 = await page.evaluate(() => state.zoom || 1);
  await page.locator('.zoomctl [data-z="in"]').click();
  const z1 = await page.evaluate(() => state.zoom);
  expect(z1).toBeGreaterThan(z0);
  expect(await page.evaluate(() => document.querySelector('#edZoom').style.transform)).toContain('scale(');
  // reset returns to 100%
  await page.locator('.zoomctl [data-z="reset"]').click();
  expect(await page.evaluate(() => state.zoom)).toBe(1);
  // dragging empty canvas space pans the scroller (pointer events, not native DnD)
  const panned = await page.evaluate(() => {
    const sc = document.querySelector('#edScroll'); sc.scrollLeft = 100; sc.scrollTop = 60;
    const r = sc.getBoundingClientRect();
    const pe = (t, x, y) => new PointerEvent(t, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y, pointerId: 1 });
    sc.dispatchEvent(pe('pointerdown', r.left + 4, r.top + 4));
    const grabbing = sc.classList.contains('panning');
    document.dispatchEvent(pe('pointermove', r.left + 4 - 40, r.top + 4 - 20));
    const dx = sc.scrollLeft - 100;
    document.dispatchEvent(pe('pointerup', r.left + 4 - 40, r.top + 4 - 20));
    return { grabbing, dx, cleared: !sc.classList.contains('panning') };
  });
  expect(panned.grabbing).toBe(true);
  expect(panned.dx).toBeGreaterThan(0);
  expect(panned.cleared).toBe(true);
});

test('VSM mode embeds vsm.html and unmounts it on the way out; every legacy mode id maps forward', async ({ page }) => {
  await page.evaluate(() => window.ORG.setMode('vsm'));
  await expect(page.locator('#vsmframe')).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#zoomCtl')).display)).toBe('none');
  await page.evaluate(() => window.ORG.setMode('orgchart'));
  expect(await page.evaluate(() => !!document.querySelector('#vsmframe'))).toBe(false);
  // legacy ids from old hosts / old persisted state map forward — they must never blank the canvas
  for (const [legacy, canonical] of [['levels', 'orgchart'], ['cabinet', 'vsm'], ['nested', 'orgchart']]) {
    await page.evaluate((id) => window.ORG.setMode(id), legacy);
    expect(await page.evaluate(() => window.ORG.getState().ui.mode)).toBe(canonical);
  }
  await page.evaluate(() => window.ORG.setMode('vsm'));
  await expect(page.locator('#vsmframe')).toBeVisible();
});

test('7.7 declutter: no Proposed-vs-agreed chip; Gaps is a spotlight (clean boxes recede, warned boxes stay bright); embedded chrome collapses', async ({ page }) => {
  // the Proposed-vs-agreed overlay chip is gone (scenarios come later); candidates still render dashed
  expect(await page.evaluate(() => !!document.querySelector('[data-ov="state"]'))).toBe(false);
  expect(await page.evaluate(() => document.querySelectorAll('#canvasHost rect.box[stroke-dasharray]').length)).toBeGreaterThan(0);
  // Gaps OFF: no box is dimmed
  expect(await page.evaluate(() => document.querySelectorAll('#canvasHost g.node[opacity]').length)).toBe(0);
  // Gaps ON: clean boxes dim, at least one warned box stays bright
  await page.locator('[data-ov="gaps"]').click();
  const spot = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('#canvasHost g[data-nid]')];
    return { dimmed: boxes.filter((g) => g.getAttribute('opacity')).length, bright: boxes.filter((g) => !g.getAttribute('opacity')).length };
  });
  expect(spot.dimmed).toBeGreaterThan(0);
  expect(spot.bright).toBeGreaterThan(0);
  await page.locator('[data-ov="gaps"]').click();
  // embedded (?chrome=min): the duplicate brand/context topbar collapses — the host provides that chrome
  await page.goto(PAGE + '?chrome=min');
  await page.waitForFunction(() => !!(window.ORG && window.ORG.getState));
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.topbar .brand')).display)).toBe('none');
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.topbar .ctx')).display)).toBe('none');
  // the functional controls survive: mode seg + tile fullscreen
  await expect(page.locator('#modeSeg')).toBeVisible();
  await expect(page.locator('#fsBtn')).toBeVisible();
});

test('Box Inspector: shared leadership + direct-report editing writes to the hierarchy and renders multiple ★ rows', async ({ page }) => {
  await page.goto('/design-previews/org-chart.html');
  await page.waitForFunction(() => !!(window.ORG && window.ORG.getState));

  // select the f-res function box (seeded leader r-st) → its Box Inspector shows a Leadership section
  await page.evaluate(() => selectNode('f-res'));
  await expect(page.locator('#inspector .be')).toHaveCount(1);
  await expect(page.locator('#inspector .be-sec .be-h').first()).toContainText('Leadership');

  // head-count stats are present and derived (not blank)
  await expect(page.locator('#inspector .be-stats')).toContainText('head count');

  // promote a current direct report to co-leader → SHARED leadership (incumbent keeps the ★, no silent demotion)
  const before = await page.evaluate(() => hLeaders('f-res').length);
  await page.evaluate(() => {
    const memberBtn = document.querySelector('#inspector [data-act="be-promote"]');
    if (memberBtn) memberBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  const after = await page.evaluate(() => hLeaders('f-res'));
  expect(after.length).toBe(before + 1); // co-leader added, original leader retained
  // the model persists both leaders under the box
  const leaderSlots = await page.evaluate(() => Object.entries(window.ORG.getState().model.hierarchy)
    .filter(([, v]) => v.parent === 'f-res' && v.slot === 'leader').length);
  expect(leaderSlots).toBe(after.length);
  expect(after.length).toBeGreaterThanOrEqual(2);

  // the canvas renders one ★ row per leader
  const stars = await page.evaluate(() => {
    const box = [...document.querySelectorAll('#canvasHost g[data-nid="f-res"] text')].map((t) => t.textContent);
    return box.filter((t) => /^★/.test(t)).length;
  });
  expect(stars).toBe(after.length);

  // demote one leader back to a direct report → single-leader again, still no data loss (role stays in the box)
  await page.evaluate(() => {
    const demoteBtn = document.querySelector('#inspector [data-act="be-demote"]');
    if (demoteBtn) demoteBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  expect(await page.evaluate(() => hLeaders('f-res').length)).toBe(after.length - 1);
  expect(await page.evaluate(() => hRoles('f-res').length)).toBe(await page.evaluate(() => hLeaders('f-res').length + hMembers('f-res').length));
});

test('Box Inspector FTE: editing a role FTE writes to the vessel, sums into head-count stats, and is dropped when zeroed', async ({ page }) => {
  await page.goto('/design-previews/org-chart.html');
  await page.waitForFunction(() => !!(window.ORG && window.ORG.getState));

  // f-res seeds with leader r-pf + member r-rc — select it and set FTE on both from the Box Inspector rows
  await page.evaluate(() => selectNode('f-res'));
  await expect(page.locator('#inspector .be-fte')).toHaveCount(2); // one input per role row

  // set FTE via the real change path (fills value then dispatches change)
  await page.evaluate(() => { const i = document.querySelector('#inspector .be-fte[data-rid="r-pf"]'); i.value = '1.5'; i.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.evaluate(() => { selectNode('f-res'); const i = document.querySelector('#inspector .be-fte[data-rid="r-rc"]'); i.value = '0.5'; i.dispatchEvent(new Event('change', { bubbles: true })); });

  // the vessel carries the number and the model exposes it
  expect(await page.evaluate(() => vessel('r-pf').fte)).toBe(1.5);
  expect(await page.evaluate(() => window.ORG.getState().model.vessels.find((v) => v.id === 'r-rc').fte)).toBe(0.5);

  // the head-count/FTE stats line now sums to 2 FTE for the box
  await page.evaluate(() => selectNode('f-res'));
  await expect(page.locator('#inspector .be-stats')).toContainText('2 FTE');

  // zeroing drops the field (Codex's roles-only, >0 rule mirrored on the editor side)
  await page.evaluate(() => { const i = document.querySelector('#inspector .be-fte[data-rid="r-pf"]'); i.value = '0'; i.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(await page.evaluate(() => 'fte' in vessel('r-pf'))).toBe(false);
});

test('zoom bar: text "Fit" fits the WHOLE chart on screen; the auto fill-height fills the full height (dynamic)', async ({ page }) => {
  await page.goto('/design-previews/org-chart.html');
  await page.waitForFunction(() => !!(window.ORG && window.ORG.getState));

  // the fit control is a text "Fit" button (E2E style), next to the full-screen toggle
  await expect(page.locator('#zoomCtl .zc-fit')).toHaveText('Fit');
  await expect(page.locator('#zoomCtl [data-act="zoomfs"]')).toHaveCount(1);
  expect(await page.locator('#zoomCtl button').evaluateAll((b) => b.map((x) => x.dataset.z || x.dataset.act))).toEqual(['out', 'reset', 'in', 'fit', 'zoomfs']);

  // tall (full-screen-like) viewport
  await page.evaluate(() => { const sc = document.getElementById('edScroll'); sc.style.height = '760px'; sc.style.maxHeight = '760px'; });

  // "Fit" button → the WHOLE chart fits on screen: both dimensions within the viewport
  await page.locator('#zoomCtl [data-z="fit"]').click();
  const fit = await page.evaluate(() => { const sc = document.getElementById('edScroll'), ez = document.getElementById('edZoom'); return { vw: sc.clientWidth, vh: sc.clientHeight, cw: parseFloat(ez.style.width) || 0, ch: parseFloat(ez.style.height) || 0 }; });
  expect(fit.cw).toBeLessThanOrEqual(fit.vw + 2);   // whole chart width fits
  expect(fit.ch).toBeLessThanOrEqual(fit.vh + 2);   // whole chart height fits
  expect(fit.cw).toBeGreaterThan(0);

  // the AUTO fill-height (the full-screen / resize path) fills essentially the whole vertical height instead
  await page.evaluate(() => fillHeight());
  const fill = await page.evaluate(() => { const sc = document.getElementById('edScroll'), ez = document.getElementById('edZoom'); return { vh: sc.clientHeight, ch: parseFloat(ez.style.height) || 0 }; });
  expect(fill.ch / fill.vh).toBeGreaterThan(0.9);
});
