// Real-browser regression suite for the Step VII Representation UX (design-previews/step7-ux.html).
// Covers the 7-substep structure, the optional per-SCT aspects (7.3), the rebuilt role/function
// descriptions (7.4/7.5 — RASIC-grouped linked SCTs, editable fields, meeting membership, inherited
// + vessel-specific aspects), and the window.STEP7 host bridge.
const { test, expect } = require('@playwright/test');

const PAGE = '/design-previews/step7-ux.html';

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForFunction(() => !!(window.STEP7 && window.STEP7.getState));
});

test('seven substeps, with 7.3 Metrics/Artifacts/Tools inserted after RASIC', async ({ page }) => {
  // substeps render as the host's horizontal numbered tab bar (.substep-button with an 0N badge)
  await expect(page.locator('.substep-bar .substep-button')).toHaveCount(7);
  expect((await page.locator('.substep-button').allTextContents()).map((t) => t.replace(/^\d+/, ''))).toEqual([
    'Organizational Vessels', 'RASIC Accountability', 'Metrics, Artifacts & Tools',
    'Role Descriptions', 'Function Descriptions', 'Meetings & Agendas', 'Organizational Representation',
  ]);
  expect((await page.locator('.substep-button span').allTextContents())).toEqual(['01', '02', '03', '04', '05', '06', '07']);
  // headings carry NO "7.x ·" prefix — the substep nav owns the numbering (PO polish 2026-07-22)
  for (const [step, h1] of [['7.3', 'Metrics, Artifacts & Tools'], ['7.4', 'Role Descriptions'], ['7.7', 'Organizational Representation']]) {
    await page.locator(`.substep-button[data-step="${step}"]`).click();
    await expect(page.locator('.head h1')).toHaveText(h1);
  }
});

test('7.3 optional aspects: add a KPI to an SCT → lands in the model', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.3"]').click();
  await page.locator('[data-act="selaspect"][data-id="s3"]').click(); // an SCT with no aspects yet
  await page.locator('[data-act="aspadd"][data-kind="kpis"]').click();
  await expect(page.locator('[data-act="aspedit"][data-kind="kpis"]').last()).toHaveAttribute('list', 'step7-kpi-suggestions');
  await page.locator('[data-act="aspedit"][data-kind="kpis"]').last().fill('Oscillation incidents / qtr');
  // aspect items are now { id, text } (stable-id shape) — text carries the value, id is opaque
  await expect.poll(() => page.evaluate(() => { const it = window.STEP7.getState().model.aspects.s3 && window.STEP7.getState().model.aspects.s3.kpis[0]; return it && it.text; }))
    .toBe('Oscillation incidents / qtr');
  expect(await page.evaluate(() => { const it = window.STEP7.getState().model.aspects.s3.kpis[0]; return typeof it.id === 'string' && it.id.length > 0; })).toBe(true);
});

test('7.1 vessel columns are fixed A–Z with NO sort dropdowns (PO polish 2026-07-22)', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.1"]').click();
  // the per-column sort dropdowns were removed — keep 7.1 simple
  await expect(page.locator('.vsort-sel')).toHaveCount(0);
  // ordering is fixed A–Z
  const az = await page.locator('.vcol').first().locator('.vcard .vid-main strong').allTextContents();
  expect(az).toEqual([...az].sort((a, b) => a.localeCompare(b)));
  // the card wears the Step-5 left accent stripe (green accepted / amber candidate)
  const stripe = await page.locator('.vcol').first().locator('.vcard').first().evaluate((c) => getComputedStyle(c).borderLeftWidth);
  expect(stripe).toBe('4px');
});

test('7.1 new vessel dialog defaults the scope to the host SIF/R0 unit', async ({ page }) => {
  await page.evaluate(() => {
    window.STEP7.setContext({
      units: [
        { id: 'unit-r2', name: 'AI Feature Team', level: 'R-2' },
        { id: 'unit-r1', name: 'AI Products', level: 'R-1' },
        { id: 'unit-r0', name: 'AI Business Sector', level: 'R0', sif: true },
        { id: 'unit-rp1', name: 'Corporate Head Quarter', level: 'R+1' },
      ],
      scts: [],
      contribs: [],
      meta: { sif: 'unit-r0', sifName: 'AI Business Sector' },
    });
  });
  await page.locator('.substep-button[data-step="7.1"]').click();
  await page.locator('[data-act="newvessel"][data-t="role"]').click();
  await expect(page.locator('#dscope')).toHaveValue('unit-r0');
});

test('7.2 RASIC matrix defaults to R0/SIF contribution rows with an explicit all-levels option', async ({ page }) => {
  await page.evaluate(() => {
    window.STEP7.setContext({
      units: [
        { id: 'unit-r2', name: 'AI Feature Team', level: 'R-2' },
        { id: 'unit-r1', name: 'AI Products', level: 'R-1' },
        { id: 'unit-r0', name: 'AI Business Sector', level: 'R0', sif: true },
        { id: 'unit-rp1', name: 'Corporate Head Quarter', level: 'R+1' },
      ],
      scts: [{ id: 's-scope', did: 'SCT-900', name: 'Scope Test', sys: 'S3', prio: 'high' }],
      contribs: [
        { id: 'c-r2', sct: 's-scope', unit: 'unit-r2', sys: 'S3', accUnit: 'unit-r2', text: 'Team contribution' },
        { id: 'c-r1', sct: 's-scope', unit: 'unit-r1', sys: 'S3', accUnit: 'unit-r1', text: 'Product contribution' },
        { id: 'c-r0', sct: 's-scope', unit: 'unit-r0', sys: 'S3', accUnit: 'unit-r0', text: 'SIF contribution' },
        { id: 'c-rp1', sct: 's-scope', unit: 'unit-rp1', sys: 'S3', accUnit: 'unit-rp1', text: 'Corporate contribution' },
      ],
      meta: { sif: 'unit-r0', sifName: 'AI Business Sector' },
    });
  });
  await expect(page.locator('[data-key="scope"]')).toHaveValue('sif');
  await expect(page.locator('.rasic tbody')).toContainText('AI Business Sector');
  await expect(page.locator('.rasic tbody')).not.toContainText('AI Products');
  await expect(page.locator('.rasic tbody')).not.toContainText('Corporate Head Quarter');

  await page.locator('[data-key="scope"]').selectOption('all');
  await expect(page.locator('.rasic tbody')).toContainText('AI Products');
  await expect(page.locator('.rasic tbody')).toContainText('Corporate Head Quarter');
});

test('7.2 R0/SIF scope falls back to level R0 when the explicit SIF id is stale', async ({ page }) => {
  await page.evaluate(() => {
    window.STEP7.setContext({
      units: [
        { id: 'unit-r1', name: 'AI Products', level: 'R-1' },
        { id: 'unit-r0', name: 'AI Business Sector', level: 'R0' },
      ],
      scts: [{ id: 's-stale', did: 'SCT-901', name: 'Stale SIF Test', sys: 'S3', prio: 'high' }],
      contribs: [
        { id: 'c-r1-stale', sct: 's-stale', unit: 'unit-r1', sys: 'S3', accUnit: 'unit-r1', text: 'Product contribution' },
        { id: 'c-r0-stale', sct: 's-stale', unit: 'unit-r0', sys: 'S3', accUnit: 'unit-r0', text: 'SIF contribution' },
      ],
      meta: { sif: 'old-missing-sif-id', sifName: 'AI Business Sector' },
    });
  });
  await expect(page.locator('[data-key="scope"]')).toHaveValue('sif');
  await expect(page.locator('.rasic tbody')).toContainText('AI Business Sector');
  await expect(page.locator('.rasic tbody')).not.toContainText('AI Products');
});

test('7.2 dropdown filters commit on change and update the matrix rows', async ({ page }) => {
  await page.evaluate(() => {
    window.STEP7.setContext({
      units: [
        { id: 'unit-r1', name: 'AI Products', level: 'R-1' },
        { id: 'unit-r0', name: 'AI Business Sector', level: 'R0', sif: true },
      ],
      scts: [
        { id: 's-high', did: 'SCT-910', name: 'High Priority Work', sys: 'S3', prio: 'high' },
        { id: 's-low', did: 'SCT-911', name: 'Low Priority Work', sys: 'S4', prio: 'low' },
      ],
      contribs: [
        { id: 'c-high-r0', sct: 's-high', unit: 'unit-r0', sys: 'S3', accUnit: 'unit-r0', text: 'High SIF contribution' },
        { id: 'c-low-r0', sct: 's-low', unit: 'unit-r0', sys: 'S4', accUnit: 'unit-r0', text: 'Low SIF contribution' },
        { id: 'c-low-r1', sct: 's-low', unit: 'unit-r1', sys: 'S4', accUnit: 'unit-r1', text: 'Low R-1 contribution' },
      ],
      meta: { sif: 'unit-r0', sifName: 'AI Business Sector' },
    });
  });

  await page.locator('[data-key="prio"]').selectOption('low');
  await expect(page.locator('.rasic tbody')).toContainText('Low Priority Work');
  await expect(page.locator('.rasic tbody')).not.toContainText('High Priority Work');

  await page.locator('[data-key="sys"]').selectOption('S4');
  await expect(page.locator('.rasic tbody')).toContainText('Low SIF contribution');

  // Scope is the single recursion/unit control now (the redundant Accountable-unit filter was removed):
  // narrow to the R-1 level to isolate the R-1 contribution from the SIF one.
  await page.locator('[data-key="scope"]').selectOption('level:R-1');
  await expect(page.locator('.rasic tbody')).toContainText('Low R-1 contribution');
  await expect(page.locator('.rasic tbody')).not.toContainText('Low SIF contribution');
});

test('7.2 RASIC cell edits preserve the matrix scroll position', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.2"]').click();

  const result = await page.evaluate(async () => {
    const scroller = document.querySelector('.matrix-scroll');
    scroller.scrollTop = 180;
    scroller.scrollLeft = 220;
    const before = { top: scroller.scrollTop, left: scroller.scrollLeft };

    document.querySelector('[data-act="cycle"][data-c="c7"][data-v="r-co"]').click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const afterScroller = document.querySelector('.matrix-scroll');
    return {
      before,
      after: { top: afterScroller.scrollTop, left: afterScroller.scrollLeft },
      selected: window.STEP7.getState().ui.selContrib,
      assignment: window.STEP7.getState().model.rasic['c7|r-co'],
    };
  });

  expect(result.after).toEqual(result.before);
  expect(result.selected).toBe('c7');
  expect(result.assignment).toBe('R');
});

test('7.3 defaults to SCTs with SIF/R0 contributions and offers the same recursion scope selector', async ({ page }) => {
  await page.evaluate(() => {
    window.STEP7.setContext({
      units: [
        { id: 'unit-r1', name: 'AI Products', level: 'R-1' },
        { id: 'unit-r0', name: 'AI Business Sector', level: 'R0', sif: true },
        { id: 'unit-rp1', name: 'Corporate Head Quarter', level: 'R+1' },
      ],
      scts: [
        { id: 's-r0', did: 'SCT-920', name: 'R0 Steering Work', sys: 'S3', prio: 'high' },
        { id: 's-r1', did: 'SCT-921', name: 'R-1 Delivery Work', sys: 'S3', prio: 'high' },
        { id: 's-mixed', did: 'SCT-922', name: 'Mixed Recursion Work', sys: 'S3', prio: 'med' },
      ],
      contribs: [
        { id: 'c-r0-only', sct: 's-r0', unit: 'unit-r0', sys: 'S4', accUnit: 'unit-r0', text: 'SIF contribution' },
        { id: 'c-r1-only', sct: 's-r1', unit: 'unit-r1', sys: 'S1', accUnit: 'unit-r1', text: 'R-1 contribution' },
        { id: 'c-mixed-r0', sct: 's-mixed', unit: 'unit-r0', sys: 'S5', accUnit: 'unit-r0', text: 'Mixed SIF contribution' },
        { id: 'c-mixed-r1', sct: 's-mixed', unit: 'unit-r1', sys: 'S2', accUnit: 'unit-r1', text: 'Mixed R-1 contribution' },
      ],
      meta: { sif: 'unit-r0', sifName: 'AI Business Sector' },
    });
    window.STEP7.goto('7.3');
  });

  await expect(page.locator('[data-key="scope"]')).toHaveValue('sif');
  await expect(page.locator('.list')).toContainText('R0 Steering Work');
  await expect(page.locator('.list')).toContainText('Mixed Recursion Work');
  await expect(page.locator('.list')).not.toContainText('R-1 Delivery Work');
  await expect(page.locator('[data-act="selaspect"][data-id="s-r0"] .sys')).toHaveText('S4');

  await page.locator('[data-key="scope"]').selectOption('level:R-1');
  await expect(page.locator('.list')).toContainText('R-1 Delivery Work');
  await expect(page.locator('.list')).toContainText('Mixed Recursion Work');
  await expect(page.locator('.list')).not.toContainText('R0 Steering Work');
});

test('7.4 role: linked SCTs grouped by RASIC (A→R→S→C→I); editable purpose + add-to-meeting persist', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.4"]').click();
  await page.locator('[data-act="selrole"][data-id="r-pf"]').click();
  // RASIC hierarchy in order — r-pf has A, S, C, I links
  await expect(page.locator('.rblock .rnames > b')).toHaveText(['Accountable for', 'Support', 'Consulted', 'Informed']);
  await expect(page.locator('.rasic-links')).toContainText('Negotiate resource bargain'); // an Accountable SCT, by name
  // editable purpose persists into the model
  await page.locator('[data-act="descedit"][data-f="purpose"]').fill('Owns portfolio command.');
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.descriptions['r-pf'] && window.STEP7.getState().model.descriptions['r-pf'].purpose))
    .toBe('Owns portfolio command.');
  // add the role to a meeting
  await page.locator('[data-act="addmeeting"]').selectOption('m-strat');
  await expect(page.locator('.mchip')).toContainText('Quarterly Strategy Review');
  await expect.poll(() => page.evaluate(() => (window.STEP7.getState().model.membership['r-pf'] || []).includes('m-strat'))).toBe(true);
});

test('7.4 role: KPIs/artifacts inherited from linked SCTs + vessel-specific add', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.4"]').click();
  await page.locator('[data-act="selrole"][data-id="r-au"]').click(); // Audit Lead → Accountable for SCT-004 (which has aspects)
  await expect(page.locator('[data-act="inhaspedit"][data-kind="kpis"]').first()).toHaveValue('Audit findings closed (%)'); // inherited KPI from the SCT — now an editable input
  await page.locator('[data-act="vaspadd"][data-kind="kpis"]').click();
  const kpiInput = page.locator('[data-act="vaspedit"][data-kind="kpis"]').last();
  await expect(kpiInput).toHaveAttribute('list', 'step7-kpi-suggestions');
  await expect(page.locator('datalist#step7-kpi-suggestions option[value="Audit findings closed (%)"]')).toHaveCount(1);
  await kpiInput.fill('Mean time to probe (days)');
  await expect.poll(() => page.evaluate(() => { const it = window.STEP7.getState().model.vesselAspects['r-au'].kpis.slice(-1)[0]; return it && it.text; }))
    .toBe('Mean time to probe (days)');
});

test('7.4 role descriptions fall back to the first real role when the previous selection is absent', async ({ page }) => {
  await page.evaluate(() => {
    window.STEP7.loadModel({
      vessels: [
        { id: 'role-ceo', type: 'role', name: 'CEO', scope: 'u-sif', state: 'accepted', prov: 'host' },
        { id: 'role-cfo', type: 'role', name: 'CFO', scope: 'u-sif', state: 'accepted', prov: 'host' },
      ],
      rasic: {},
      aspects: {
        s1: { kpis: [{ id: 'kpi-cycle', text: 'Decision cycle time' }], artifacts: [], tools: [] },
      },
      descriptions: {},
      membership: {},
      vesselAspects: {},
    });
    window.STEP7.goto('7.4');
  });

  await expect(page.locator('[data-act="selrole"][data-id="role-ceo"]')).toHaveClass(/on/);
  await expect(page.locator('.card.pad h3')).toHaveText('CEO');
  await expect(page.locator('.card.pad')).not.toContainText('undefined');
});

test('bridge window.STEP7: model shape, silent loadModel, debounced change on a user edit', async ({ page }) => {
  expect(await page.evaluate(() => Object.keys(window.STEP7.getState().model)))
    .toEqual(expect.arrayContaining(['vessels', 'rasic', 'aspects', 'descriptions', 'membership', 'vesselAspects']));
  const r = await page.evaluate(async () => {
    const log = []; window.STEP7.onEmit = (m) => log.push(m.evt);
    window.STEP7.loadModel({ vessels: [{ id: 'v-x', type: 'role', name: 'X', scope: 'u-sif', state: 'accepted', prov: 'host' }], rasic: {}, aspects: {}, descriptions: {}, membership: {}, vesselAspects: {} });
    const silent = log.length === 0;              // programmatic feed must not echo a change
    window.STEP7.goto('rasic');
    document.querySelector('[data-act="cycle"]').click(); // a real user edit
    await new Promise((res) => setTimeout(res, 200));
    return { silent, sawChange: log.includes('change'), vessels: window.STEP7.getState().model.vessels.length };
  });
  expect(r.silent).toBe(true);
  expect(r.sawChange).toBe(true);
  expect(r.vessels).toBe(1); // loadModel replaced the registry
});

test('7.7 embeds the live org-chart.html, feeds it this workshop model, and a requestFix closes the loop back into RASIC', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.7"]').click();
  await expect(page.locator('#orgFrame')).toHaveCount(1);
  const orgFrame = () => page.frames().find(f => /org-chart\.html/.test(f.url()));
  // the embedded chart comes up AND is fed this workshop's canonical model over postMessage
  await expect.poll(async () => { const fr = orgFrame(); return fr ? await fr.evaluate(() => (window.ORG && window.ORG.getState) ? window.ORG.getState().model.vessels.length : 0) : 0; }, { timeout: 8000 }).toBe(22);
  const fr = orgFrame();
  // honesty layer computed from the fed RASIC
  await expect.poll(() => fr.evaluate(() => document.querySelector('.hpill').textContent)).toMatch(/2\s+no owner/);
  // propose a fix from INSIDE the embedded chart → host applies it to its RASIC store → refeeds → loop closes
  const before = await page.evaluate(() => window.STEP7.getState().model.rasic['c12|r-con']);
  expect(before).toBeUndefined();
  await fr.evaluate(() => window.requestFix('c12', 'r-con'));
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.rasic['c12|r-con'])).toBe('A');
  await expect.poll(() => fr.evaluate(() => document.querySelector('.hpill').textContent)).toMatch(/1\s+no owner/);
});

test('7.6 charter: list+inspector, RASIC-derived participants, ranked reuse picker adds a participant (solid), ghost ratifies', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.6"]').click();
  await expect(page.locator('.rins .rsheet')).toHaveCount(1);
  // meeting list + a charter with the 10 bands
  expect(await page.evaluate(() => document.querySelectorAll('[data-mtg]').length)).toBe(6);
  expect(await page.evaluate(() => document.querySelectorAll('.rins .band').length)).toBe(10);
  // participants derived from the real RASIC map, shown as ghosts with a roleType control
  const p0 = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('[data-rail="participants"] .chip')];
    return { count: chips.length, ghosts: chips.filter(c => c.classList.contains('ghost')).length, hasRoleType: !!document.querySelector('[data-rail="participants"] .roletype') };
  });
  expect(p0.count).toBeGreaterThan(0);
  expect(p0.ghosts).toBe(p0.count); // all derived, unratified
  expect(p0.hasRoleType).toBe(true);
  // open the ranked picker, type, Enter → reused participant lands SOLID
  await page.locator('[data-add="participants"]').click();
  await expect(page.locator('.picker')).toHaveCount(1);
  await page.locator('.picker input.q').fill('audit');
  await page.locator('.picker input.q').press('Enter');
  const added = await page.evaluate(() => {
    const chip = [...document.querySelectorAll('[data-rail="participants"] .chip')].find(c => /Audit Lead/.test(c.textContent));
    return chip ? !chip.classList.contains('ghost') : null;
  });
  expect(added).toBe(true); // an explicit pick is a ratification
  // ratify a still-ghost participant via its ↵
  const before = await page.evaluate(() => document.querySelectorAll('[data-rail="participants"] .chip.ghost').length);
  await page.locator('[data-rail="participants"] .chip.ghost [data-ratify]').first().click();
  const after = await page.evaluate(() => document.querySelectorAll('[data-rail="participants"] .chip.ghost').length);
  expect(after).toBe(before - 1);
});

test('7.6 charter: KPI definition→use is editable (frequency defaults to cadence; committed chip re-opens to edit) and the model persists meetings', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.6"]').click();
  // agenda is a free-text bulleted field
  expect(await page.evaluate(() => !!document.querySelector('#mAgenda'))).toBe(true);
  // add a KPI → inline use editor opens with frequency defaulting to the meeting cadence
  await page.evaluate(() => { const d = document.querySelector('[data-band="measures"]'); if (d) d.open = true; });
  await page.locator('[data-add="measures"]').click();
  await page.locator('.picker input.q').fill('strategy');
  await page.locator('.picker input.q').press('Enter');
  await expect(page.locator('#uT')).toHaveCount(1);
  await page.locator('#uT').fill('+5% / yr');
  await page.locator('#uGo').click();
  const chipText = await page.evaluate(() => { const c = [...document.querySelectorAll('[data-rail="measures"] .chip')].find(x => /\+5% \/ yr/.test(x.textContent)); return c ? c.textContent : null; });
  expect(chipText).toMatch(/target authored/);
  // the bridge model now carries the authored meeting
  const model = await page.evaluate(() => window.STEP7.getState().model);
  expect(Object.keys(model.meetings).length).toBeGreaterThan(0);
  const anyMeeting = Object.values(model.meetings)[0];
  expect(anyMeeting).toHaveProperty('participants');
  expect(anyMeeting).toHaveProperty('agenda');
});

test('the substep-head ⬇ opens the shared export panel (B6) instead of a direct download', async ({ page }) => {
  // export now lives as the green ⬇ next to the blue ⛶ tile-fullscreen in each substep head (house pair)
  await page.locator('.substep-button[data-step="7.1"]').click();
  const headExport = page.locator('.head-actions .tile-export-button[data-act="headexport"]');
  await expect(headExport).toHaveCount(1);
  await expect(page.locator('#exportBtn')).toHaveCount(0); // the old toolbar button is gone
  await headExport.click();
  // the nested export-panel overlay mounts + shows, driven by step7-ux's substeps view-model
  await page.waitForFunction(() => { const f = document.getElementById('exportFrame'); return !!f && f.style.visibility === 'visible'; });
  const panel = page.frameLocator('#exportFrame');
  await panel.locator('#expanel.on [data-go]').waitFor();
  expect(await panel.locator('#expanel [data-sub]').count()).toBe(7);
  expect(await panel.locator('#expanel [data-fmt]').evaluateAll((b) => b.map((x) => x.dataset.fmt))).toEqual(['docx']); // Word only — flat-text PDF dropped in Stage 2
});

test('window.STEP7.export() still produces the self-contained Blob report covering all seven substeps (offline fallback)', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate(() => window.STEP7.export()),
  ]);
  expect(download.suggestedFilename()).toMatch(/Step-VII-Representation\.html/);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  const html = Buffer.concat(chunks).toString('utf8');
  // every substep is present, the RASIC matrix is rendered, and there is no completeness percentage
  for (const s of ['7.1', '7.2 · RASIC', '7.3', '7.4', '7.5', '7.6', '7.7']) expect(html).toContain(s);
  expect(html).toContain('table class="rasic"');
  expect(html).toContain('Quarterly Strategy Review'); // a meeting charter
  expect(html).not.toMatch(/\d+\s*%\s*(complete|done)/i);
});

test('7.6 charter re-derives when the RASIC graph changes in 7.2 (no stale double-accountability), and preserves user edits + prunes orphans', async ({ page }) => {
  // open 7.6 (caches all charters), select the coordination meeting (single Accountable today)
  await page.locator('.substep-button[data-step="7.6"]').click();
  await page.evaluate(() => { state.selMtg = 'm-coord'; render(); });
  expect(await page.evaluate(() => !!document.querySelector('.rins .warnbox'))).toBe(false);
  // add a SECOND Accountable on that meeting's contribution over in 7.2 (cycle r-pf on c3 to A)
  await page.locator('.substep-button[data-step="7.2"]').click();
  await page.evaluate(() => { window.STEP7.filter({ scope: 'all' }); }); // ensure c3 row is present
  await page.evaluate(() => { let g=0; while (rg('c3','r-pf')!=='A' && g++<6) { const btn = document.querySelector('[data-act="cycle"][data-c="c3"][data-v="r-pf"]'); if (!btn) break; btn.click(); } }); // re-query: each cycle re-renders the matrix
  expect(await page.evaluate(() => rg('c3', 'r-pf'))).toBe('A');
  // back to 7.6 → the charter must reflect the new graph: the double-accountability warning appears
  await page.locator('.substep-button[data-step="7.6"]').click();
  await page.evaluate(() => { state.selMtg = 'm-coord'; render(); });
  const warn = await page.evaluate(() => { const w = document.querySelector('.rins .warnbox'); return w ? w.textContent : null; });
  expect(warn).toMatch(/Two vessels are Accountable/);

  // user edits survive a graph re-derive: add a solid participant, bump the graph, it stays
  await page.evaluate(() => { const d = document.querySelector('[data-band="participants"]'); if (d) d.open = true; });
  await page.locator('[data-add="participants"]').click();
  await page.locator('.picker input.q').fill('audit');
  await page.locator('.picker input.q').press('Enter');
  await page.evaluate(() => { _mtgVer++; render(); }); // a later graph change forces re-derive
  expect(await page.evaluate(() => [...document.querySelectorAll('[data-rail="participants"] .chip')].some(c => /Audit Lead/.test(c.textContent)))).toBe(true);

  // orphan prune: a loadModel dropping a meeting removes its cached charter from the emitted model
  const before = await page.evaluate(() => Object.keys(window.STEP7.getState().model.meetings).length);
  expect(before).toBeGreaterThan(0);
  const after = await page.evaluate(() => {
    const m = window.STEP7.getState().model;
    m.vessels = m.vessels.filter(v => v.type !== 'meeting' || v.id === 'm-coord'); // keep only one meeting
    window.STEP7.loadModel(m);
    return Object.keys(window.STEP7.getState().model.meetings).length;
  });
  expect(after).toBeLessThanOrEqual(1); // stale charters for removed meetings pruned, not shipped back
});

test('7.6 consumes the host canonical registries (D1) + Step VI loop ids (D7)', async ({ page }) => {
  // canonical registries feed the pickers instead of ASPECTS-derived ids
  await page.evaluate(() => window.STEP7.setContext({
    metricDefs: [{ id: 'md-dct', text: 'Decision cycle time', reuseCount: 4 }],
    artifactDefs: [{ id: 'ad-dl', text: 'Decision log' }],
    toolDefs: [{ id: 'td-wm', text: 'Wardley Mapping' }],
    loops: [{ id: 'vsm-loop-s4-s3-homeostat', label: 'S4–S3 homeostat', system: 'S4' }, { id: 'vsm-loop-s2-coordination', label: 'S2 coordination', system: 'S2' }],
  }));
  await page.locator('.substep-button[data-step="7.6"]').click();
  await page.evaluate(() => { state.selMtg = 'm-strat'; render(); });
  // the S4 meeting derives the canonical S4 loop id, not a prov placeholder
  expect(await page.evaluate(() => (mtg('m-strat').loops[0] || {}).ref)).toBe('vsm-loop-s4-s3-homeostat');
  // the measures picker pool is the canonical metricDefs
  await page.evaluate(() => { const d = document.querySelector('[data-band="measures"]'); if (d) d.open = true; render(); });
  await page.locator('[data-add="measures"]').click();
  const rows = await page.evaluate(() => [...document.querySelectorAll('.picker .pk-row .rlbl')].map(x => x.textContent));
  expect(rows.some(t => /Decision cycle time/.test(t))).toBe(true);
});

test('the ready handshake announces api:2 (feature-detect for the additive contract)', async ({ page }) => {
  // embed step7-ux in a real iframe so its fire-once ready is posted to the parent (inFrame path) and can be captured
  const api = await page.evaluate(() => new Promise((resolve) => {
    const f = document.createElement('iframe');
    f.src = '/design-previews/step7-ux.html';
    window.addEventListener('message', function h(e) { if (e.source === f.contentWindow && e.data && e.data.evt === 'ready') { window.removeEventListener('message', h); resolve(e.data.api); } });
    document.body.appendChild(f);
    setTimeout(() => resolve('timeout'), 6000);
  }));
  expect(api).toBe(2);
});

test('7.2 header hover shows a fixed, unclipped tooltip and never morphs the column label', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.2"]').click();
  const th = page.locator('table.rasic thead th[data-full]').first();
  const name = await th.getAttribute('data-full');
  // label stays in normal flow (the old bug morphed it to position:absolute → it "jumped" and clipped)
  expect(await th.locator('.vhname').evaluate((el) => getComputedStyle(el).position)).toBe('static');
  await th.hover();
  const tip = page.locator('.vhtip');
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText(name);
  expect(await tip.evaluate((el) => getComputedStyle(el).position)).toBe('fixed'); // not clipped by the matrix overflow
  // label is still static after hover (not morphed)
  expect(await th.locator('.vhname').evaluate((el) => getComputedStyle(el).position)).toBe('static');
});

test('7.6 picker anchors below its pill and stays within the viewport even when the list is long in a short frame', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 660 }); // constrained, like the embedded host frame
  await page.locator('.substep-button[data-step="7.6"]').click();
  // participants band is open by default and its pool (all roles + functions) is long enough to overflow a short frame
  await page.evaluate(() => { state.selMtg = 'm-strat'; state.mtgOpen = Object.assign({}, state.mtgOpen, { participants: true }); render(); window.scrollTo(0, 0); });
  const pill = page.locator('[data-add="participants"]');
  await pill.scrollIntoViewIfNeeded();
  await pill.click();
  const box = await page.evaluate(() => {
    const pk = document.querySelector('.picker'); const pr = pk.getBoundingClientRect();
    return { top: pr.top, bottom: pr.bottom, height: pr.height, vh: window.innerHeight, cap: Math.min(0.6 * window.innerHeight, 400) };
  });
  expect(box.top).toBeGreaterThanOrEqual(0);            // never off the top of the frame (the reported bug)
  expect(box.bottom).toBeLessThanOrEqual(box.vh + 1);   // fully inside the viewport
  expect(box.height).toBeLessThanOrEqual(box.cap + 2);  // capped height (scrolls internally instead of running off-screen)
});

test('7.4/7.5: inherited (shared) aspects are editable in place — write-through to the SCT entry, everywhere; remove is confirm-guarded', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.4"]').click();
  await page.locator('[data-act="selrole"][data-id="r-au"]').click(); // Audit Lead inherits from SCT-004
  const inp = page.locator('[data-act="inhaspedit"][data-kind="kpis"]').first();
  await expect(inp).toHaveValue('Audit findings closed (%)');
  // the row carries its provenance: the shared SCT source tag
  await expect(page.locator('.desc-sec', { hasText: 'Metrics & KPIs' }).locator('.inh-src').first()).toHaveText('SCT-004');
  // edit in place → the CANONICAL SCT entry changes (single source of truth)
  await inp.fill('Audit findings closed within 30 days (%)');
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.aspects.s4.kpis[0].text))
    .toBe('Audit findings closed within 30 days (%)');
  // 7.3 (the SCT editor) shows the same edited text — no fork
  await page.locator('.substep-button[data-step="7.3"]').click();
  await page.locator('[data-act="selaspect"][data-id="s4"]').click();
  await expect(page.locator('[data-act="aspedit"][data-kind="kpis"]').first()).toHaveValue('Audit findings closed within 30 days (%)');
  // 7.5 functions share the same treatment (same descView): a write-through edit from a FUNCTION
  // propagates to the canonical SCT entry and to every ROLE inheriting the same SCT
  await page.locator('.substep-button[data-step="7.5"]').click();
  const fnInp = page.locator('[data-act="inhaspedit"][data-kind="kpis"]').first(); // f-strat inherits from SCT-001 (s1)
  await expect(fnInp).toHaveValue('Strategy adoption across units (%)');
  await fnInp.fill('Strategy adoption across ALL units (%)');
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.aspects.s1.kpis[0].text))
    .toBe('Strategy adoption across ALL units (%)');
  await page.locator('.substep-button[data-step="7.4"]').click();
  await page.locator('[data-act="selrole"][data-id="r-st"]').click(); // Strategy & Foresight Lead inherits the same SCT
  await expect(page.locator('[data-act="inhaspedit"][data-kind="kpis"]').first()).toHaveValue('Strategy adoption across ALL units (%)');
  // remove is confirm-guarded: dismiss keeps the shared entry
  await page.locator('.substep-button[data-step="7.4"]').click();
  await page.locator('[data-act="selrole"][data-id="r-au"]').click();
  page.once('dialog', (d) => d.dismiss());
  await page.locator('[data-act="inhasprm"][data-kind="kpis"]').first().click();
  expect(await page.evaluate(() => window.STEP7.getState().model.aspects.s4.kpis.length)).toBe(1);
  // accept removes it from the SCT (everywhere it is inherited)
  page.once('dialog', (d) => d.accept());
  await page.locator('[data-act="inhasprm"][data-kind="kpis"]').first().click();
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.aspects.s4.kpis.length)).toBe(0);
});

test('7.3/7.4/7.5: every metric/artifact/tool carries an OPTIONAL owner — a picked vessel (role, function or meeting), by stable id', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.3"]').click();
  await page.locator('[data-act="selaspect"][data-id="s4"]').click();
  const sel = page.locator('[data-act="aspowner"][data-kind="kpis"]').first();
  // grouped picker: roles / functions / meetings — never free text
  expect(await sel.evaluate((s) => [...s.querySelectorAll('optgroup')].map((g) => g.label))).toEqual(['Roles', 'Functions', 'Meetings']);
  // pick a MEETING as owner → lands on the canonical {id,text,owner} item in the model
  await sel.selectOption('m-audit');
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.aspects.s4.kpis[0].owner)).toBe('m-audit');
  // the inherited row on 7.4 shows the same owner and can change it (write-through)
  await page.locator('.substep-button[data-step="7.4"]').click();
  await page.locator('[data-act="selrole"][data-id="r-au"]').click();
  const iSel = page.locator('[data-act="inhaspowner"][data-kind="kpis"]').first();
  await expect(iSel).toHaveValue('m-audit');
  await iSel.selectOption('r-au');
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.aspects.s4.kpis[0].owner)).toBe('r-au');
  // the export names the owner
  expect(await page.evaluate(() => /owner: Audit Lead/.test(buildStep7Report()))).toBe(true);
  // owner is OPTIONAL: clearing removes the field entirely
  await page.locator('.substep-button[data-step="7.3"]').click();
  await page.locator('[data-act="selaspect"][data-id="s4"]').click();
  await page.locator('[data-act="aspowner"][data-kind="kpis"]').first().selectOption('');
  await expect.poll(() => page.evaluate(() => 'owner' in window.STEP7.getState().model.aspects.s4.kpis[0])).toBe(false);
});

test('metrics section is "Metrics & KPIs" and each metric carries target/frequency/source details (7.3), write-through in 7.4, prefilled in 7.6', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.3"]').click();
  await page.locator('[data-act="selaspect"][data-id="s4"]').click();
  await expect(page.locator('.desc-sec .sh b', { hasText: /^Metrics & KPIs$/ })).toBeVisible(); // renamed
  // the detail sub-row is KPI-only (target / frequency / source), not on artifacts/tools
  await expect(page.locator('[data-act="aspdetail"][data-f="target"]')).toHaveCount(1);
  await expect(page.locator('.desc-sec', { hasText: 'Artifacts & Result Types' }).locator('[data-act="aspdetail"]')).toHaveCount(0);
  await expect(page.locator('[data-act="aspdetail"][data-f="source"]').first()).toHaveAttribute('list', 'step7-artifact-list');
  // set target + frequency + source → land on the canonical {id,text,target,frequency,source} item
  await page.locator('[data-act="aspdetail"][data-f="target"]').first().fill('< 30 days');
  await page.locator('[data-act="aspdetail"][data-f="frequency"]').first().selectOption('Quarterly');
  await page.locator('[data-act="aspdetail"][data-f="source"]').first().fill('Audit-walk report');
  await expect.poll(() => page.evaluate(() => { const k = window.STEP7.getState().model.aspects.s4.kpis[0]; return [k.target, k.frequency, k.source].join('|'); }))
    .toBe('< 30 days|Quarterly|Audit-walk report');
  // 7.4: the inherited metric shows the same details and edits write through
  await page.locator('.substep-button[data-step="7.4"]').click();
  await page.locator('[data-act="selrole"][data-id="r-au"]').click();
  await expect(page.locator('[data-act="inhaspdetail"][data-f="target"]').first()).toHaveValue('< 30 days');
  await page.locator('[data-act="inhaspdetail"][data-f="target"]').first().fill('< 21 days');
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.aspects.s4.kpis[0].target)).toBe('< 21 days');
  // 7.6: opening a derived (ghost) measure's use editor prefills from the 7.3 definition
  await page.locator('.substep-button[data-step="7.6"]').click();
  await page.evaluate(() => { state.selMtg = 'm-audit'; const d = document.querySelector('[data-band="measures"]'); if (d) d.open = true; render(); });
  await page.locator('[data-rail="measures"] .chip.ghost').first().click();
  await expect(page.locator('#uT')).toHaveValue('< 21 days');
  await expect(page.locator('#uF')).toHaveValue('Quarterly');
  await expect(page.locator('#uS')).toHaveValue('Audit-walk report');
  // export names the details
  expect(await page.evaluate(() => /Quarterly · src: Audit-walk report/.test(buildStep7Report()))).toBe(true);
});

test('tile-level fullscreen (house pattern): every work surface has its own ⛶; 7.7 defers to the embedded chart; edits + dialogs survive; Esc exits', async ({ page }) => {
  for (const s of ['7.1', '7.2', '7.3', '7.4', '7.5', '7.6']) {
    await page.locator(`.substep-button[data-step="${s}"]`).click();
    await expect(page.locator('[data-act="tilefs"]')).toHaveCount(1);
  }
  await page.locator('.substep-button[data-step="7.7"]').click();
  await expect(page.locator('[data-act="tilefs"]')).toHaveCount(0); // org-chart brings its own tile fullscreen
  // enter on 7.2 → the work surface renders inside the persistent fullscreen host, #view holds a placeholder
  await page.locator('.substep-button[data-step="7.2"]').click();
  await page.locator('[data-act="tilefs"]').click();
  await expect(page.locator('#tileFsHost table.rasic')).toHaveCount(1);
  await expect(page.locator('#view')).toContainText('Shown full screen');
  // a RASIC edit inside the tile re-renders INTO the tile (the surface never falls out of fullscreen)
  await page.locator('#tileFsHost [data-act="cycle"]').first().click();
  await expect(page.locator('#tileFsHost table.rasic')).toHaveCount(1);
  expect(await page.evaluate(() => !!document.getElementById('modal'))).toBe(true); // the dialog layer survives host re-renders
  // Esc exits and restores the normal view
  await page.keyboard.press('Escape');
  await expect(page.locator('#tileFsHost table.rasic')).toHaveCount(0);
  await expect(page.locator('#view table.rasic')).toHaveCount(1);
  // 7.6: the reuse picker parents INTO the active tile host (visible in native fullscreen)
  await page.locator('.substep-button[data-step="7.6"]').click();
  await page.locator('[data-act="tilefs"]').click();
  await page.evaluate(() => { const d = document.querySelector('#tileFsHost [data-band="participants"]'); if (d) d.open = true; render(); });
  await page.locator('#tileFsHost [data-add="participants"]').click();
  expect(await page.evaluate(() => { const pk = document.querySelector('.picker'); return pk && pk.parentNode.id; })).toBe('tileFsHost');
  // switching substeps (host-driven goto — the nav bar is deliberately covered while fullscreen) exits tile fullscreen cleanly
  await page.evaluate(() => window.STEP7.goto('7.3'));
  expect(await page.evaluate(() => state.tileFs)).toBe(null);
  await expect(page.locator('#view .desc-sec').first()).toBeVisible();
});

test('frequency dropdown is the extended shared list across every substep (Daily … Custom, Bi-Weekly not Fortnightly); Custom captures free text', async ({ page }) => {
  const EXPECT = ['—', 'Daily', 'Twice per week', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Twice a year', 'Yearly', 'On signal', 'Custom'];
  const opts = (loc) => loc.evaluate((s) => [...s.options].map((o) => o.textContent));
  // 7.3 metric detail
  await page.locator('.substep-button[data-step="7.3"]').click();
  await page.locator('[data-act="selaspect"][data-id="s4"]').click();
  expect(await opts(page.locator('[data-act="aspdetail"][data-f="frequency"]').first())).toEqual(EXPECT);
  // 7.4 inherited metric detail
  await page.locator('.substep-button[data-step="7.4"]').click();
  await page.locator('[data-act="selrole"][data-id="r-au"]').click();
  expect(await opts(page.locator('[data-act="inhaspdetail"][data-f="frequency"]').first())).toEqual(EXPECT);
  // 7.6 cadence
  await page.locator('.substep-button[data-step="7.6"]').click();
  await page.evaluate(() => { state.selMtg = 'm-strat'; render(); });
  expect(await opts(page.locator('#mCadF'))).toEqual(EXPECT);
  // Fortnightly is gone everywhere; Bi-Weekly stays
  expect(EXPECT).toContain('Bi-Weekly');
  expect(EXPECT).not.toContain('Fortnightly');
  // Custom → prompt captures free text, stored + shown as a "· custom" option
  await page.locator('.substep-button[data-step="7.3"]').click();
  await page.locator('[data-act="selaspect"][data-id="s4"]').click();
  page.once('dialog', (d) => d.accept('every 6 weeks'));
  await page.locator('[data-act="aspdetail"][data-f="frequency"]').first().selectOption('Custom');
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.aspects.s4.kpis[0].frequency)).toBe('every 6 weeks');
  await expect(page.locator('[data-act="aspdetail"][data-f="frequency"]').first().locator('option:checked')).toHaveText('every 6 weeks · custom');
});

test('7.7 created boxes persist: org "change" relays into the host model (vessels + orgHierarchy) and survives substep switches', async ({ page }) => {
  // capture the authoritative change emits the host would receive (standalone → window.STEP7.onEmit)
  await page.evaluate(() => { window.__changes = []; window.STEP7.onEmit = (m) => { if (m.evt === 'change') window.__changes.push(m.model); }; });
  await page.locator('.substep-button[data-step="7.7"]').click();
  const orgFrame = () => page.frames().find((f) => /org-chart\.html/.test(f.url()));
  await expect.poll(async () => { const fr = orgFrame(); return fr ? await fr.evaluate(() => !!(window.ORG && window.ORG.getState)).catch(() => false) : false; }, { timeout: 8000 }).toBe(true);
  const fr = orgFrame();

  // create a box through the real UI path: select a node → its ➕ appears → the prompt names it
  page.once('dialog', (d) => d.accept('Persist Probe'));
  await fr.evaluate(() => { const n = document.querySelector('#edScroll [data-id]'); n.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await fr.evaluate(() => { const a = document.querySelector('[data-act="addchild"],[data-act="addsib"]'); a.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await expect.poll(() => fr.evaluate(() => window.ORG.getState().model.vessels.some((v) => v.name === 'Persist Probe'))).toBe(true);

  // the debounced org change reaches step7-ux and is re-emitted to the host WITH the new vessel and its placement
  await expect.poll(() => page.evaluate(() => window.__changes.length), { timeout: 4000 }).toBeGreaterThan(0);
  const last = await page.evaluate(() => window.__changes[window.__changes.length - 1]);
  const probe = last.vessels.find((v) => v.name === 'Persist Probe');
  expect(probe).toBeTruthy();
  expect(probe.type).toBe('function');
  expect(Object.keys(last.orgHierarchy || {})).toContain(probe.id);

  // the box is now part of step7-ux's own model (→ visible to 7.1 as a candidate vessel)
  await page.locator('.substep-button[data-step="7.1"]').click();
  expect(await page.evaluate(() => window.STEP7.getState().model.vessels.some((v) => v.name === 'Persist Probe'))).toBe(true);

  // back to 7.7: the iframe REMOUNTS and is re-fed → the box survives with its hierarchy placement (the original vanish trigger)
  await page.locator('.substep-button[data-step="7.7"]').click();
  await expect.poll(async () => {
    const f2 = orgFrame();
    if (!f2) return false;
    return f2.evaluate(() => {
      if (!window.ORG || !window.ORG.getState) return false;
      const st = window.ORG.getState();
      const v = st.model.vessels.find((x) => x.name === 'Persist Probe');
      return !!(v && st.model.hierarchy[v.id]);
    }).catch(() => false);
  }, { timeout: 8000 }).toBe(true);

  // host echo path (Codex slice): loadModel({orgHierarchy}) seeds the mirror that the next org feed + change carry
  await page.evaluate(() => window.STEP7.loadModel({ orgHierarchy: { 'echo-test': { parent: 'root', order: 99 } } }));
  expect(await page.evaluate(() => window.STEP7.getState().model.orgHierarchy['echo-test'].order)).toBe(99);
});

// ---- Steering Master → 7.6 deep link (STEP7.select accepts a meeting ref) ----
// The Steering Master's "Open the charter in 7.6" link resolves through the host, which sends
// `goto 7.6` then `{cmd:'select', ref:{kind:'meeting', id}}`. 7.6 defaults selMtg to meetings[0],
// so this only proves anything when the target is NOT the first meeting.
test('7.6 accepts a meeting selection from the host, including a non-default meeting', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.6"]').click();
  const ids = await page.evaluate(() => window.STEP7.getState().model.vessels.filter((v) => v.type === 'meeting').map((v) => v.id));
  expect(ids.length).toBeGreaterThan(1);
  const first = await page.evaluate(() => window.STEP7.getState().ui.selMtg);
  expect(first).toBe(ids[0]);                                   // the default, so ids[1] is the real test

  await page.evaluate((id) => window.STEP7.select({ kind: 'meeting', id }), ids[1]);
  expect(await page.evaluate(() => window.STEP7.getState().ui.selMtg)).toBe(ids[1]);

  // an unknown meeting id must be ignored, not blank the pane
  await page.evaluate(() => window.STEP7.select({ kind: 'meeting', id: 'no-such-meeting' }));
  expect(await page.evaluate(() => window.STEP7.getState().ui.selMtg)).toBe(ids[1]);

  // and it must not disturb the other selections the same bridge call owns
  await page.evaluate(() => window.STEP7.select({ kind: 'contrib', id: 'c1' }));
  expect(await page.evaluate(() => window.STEP7.getState().ui.selMtg)).toBe(ids[1]);
});

// ---- 7.1 Edit → the substep that OWNS that vessel's description ----
// 7.1 is a register, not an editor. Each vessel type is described somewhere else, so its Edit
// button must land on that substep with the vessel already selected. These were dead no-ops.
test('7.1 Edit opens the owning substep with the vessel selected (role→7.4, function→7.5, meeting→7.6)', async ({ page }) => {
  const cases = [['role', '7.4', 'selRole'], ['function', '7.5', 'selFn'], ['meeting', '7.6', 'selMtg']];
  for (const [type, step, key] of cases) {
    await page.locator('.substep-button[data-step="7.1"]').click();
    const ids = await page.evaluate((t) => window.STEP7.getState().model.vessels.filter((v) => v.type === t).map((v) => v.id), type);
    expect(ids.length).toBeGreaterThan(1);
    const target = ids[ids.length - 1];          // the LAST one — a default selection cannot fake this
    await page.locator(`.vcard[data-vid="${target}"] [data-act="vedit"]`).click();
    const ui = await page.evaluate(() => window.STEP7.getState().ui);
    expect(ui.step).toBe(step);
    expect(ui[key]).toBe(target);
  }
});

test('7.1 Edit tells the host where it went, so the route and the frame stay in step', async ({ page }) => {
  await page.locator('.substep-button[data-step="7.1"]').click();
  const emitted = await page.evaluate(async () => {
    const out = [];
    window.STEP7.onEmit = (m) => out.push(m);
    const id = window.STEP7.getState().model.vessels.filter((v) => v.type === 'meeting').pop().id;
    document.querySelector(`.vcard[data-vid="${id}"] [data-act="vedit"]`).click();
    await new Promise((r) => setTimeout(r, 80));
    return { out, id };
  });
  expect(emitted.out).toContainEqual({ evt: 'goto', substep: '7.6' });
  expect(emitted.out).toContainEqual({ evt: 'select', ref: { kind: 'meeting', id: emitted.id } });
});

test('STEP7.select accepts every vessel kind the 7.1 Edit link can reach', async ({ page }) => {
  const ids = await page.evaluate(() => {
    const v = window.STEP7.getState().model.vessels;
    return { role: v.filter((x) => x.type === 'role').pop().id, fn: v.filter((x) => x.type === 'function').pop().id };
  });
  await page.evaluate((id) => window.STEP7.select({ kind: 'role', id }), ids.role);
  expect(await page.evaluate(() => window.STEP7.getState().ui.selRole)).toBe(ids.role);
  await page.evaluate((id) => window.STEP7.select({ kind: 'function', id }), ids.fn);
  expect(await page.evaluate(() => window.STEP7.getState().ui.selFn)).toBe(ids.fn);
  // a kind/id mismatch must be ignored, not cross-assign
  await page.evaluate((id) => window.STEP7.select({ kind: 'role', id }), ids.fn);
  expect(await page.evaluate(() => window.STEP7.getState().ui.selRole)).toBe(ids.role);
});
