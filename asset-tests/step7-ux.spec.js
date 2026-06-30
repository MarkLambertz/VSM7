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
  await expect(page.locator('.navb')).toHaveCount(7);
  expect(await page.locator('.navb b').allTextContents()).toEqual([
    'Organizational Vessels', 'RASIC Accountability', 'Metrics, Artifacts & Tools',
    'Role Descriptions', 'Function Descriptions', 'Meetings & Agendas', 'Organizational Representation',
  ]);
  for (const [step, h1] of [['7.3', '7.3 · Metrics, Artifacts & Tools'], ['7.4', '7.4 · Role Descriptions'], ['7.7', '7.7 · Organizational Representation']]) {
    await page.locator(`.navb[data-step="${step}"]`).click();
    await expect(page.locator('.head h1')).toHaveText(h1);
  }
});

test('7.3 optional aspects: add a KPI to an SCT → lands in the model', async ({ page }) => {
  await page.locator('.navb[data-step="7.3"]').click();
  await page.locator('[data-act="selaspect"][data-id="s3"]').click(); // an SCT with no aspects yet
  await page.locator('[data-act="aspadd"][data-kind="kpis"]').click();
  await page.locator('[data-act="aspedit"][data-kind="kpis"]').last().fill('Oscillation incidents / qtr');
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.aspects.s3 && window.STEP7.getState().model.aspects.s3.kpis[0]))
    .toBe('Oscillation incidents / qtr');
});

test('7.4 role: linked SCTs grouped by RASIC (A→R→S→C→I); editable purpose + add-to-meeting persist', async ({ page }) => {
  await page.locator('.navb[data-step="7.4"]').click();
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
  await page.locator('.navb[data-step="7.4"]').click();
  await page.locator('[data-act="selrole"][data-id="r-au"]').click(); // Audit Lead → Accountable for SCT-004 (which has aspects)
  await expect(page.locator('.desc-sec', { hasText: 'KPIs & Metrics' }).locator('.inh-items')).toContainText('Audit findings closed (%)'); // inherited KPI from the SCT
  await page.locator('[data-act="vaspadd"][data-kind="kpis"]').click();
  await page.locator('[data-act="vaspedit"][data-kind="kpis"]').last().fill('Mean time to probe (days)');
  await expect.poll(() => page.evaluate(() => window.STEP7.getState().model.vesselAspects['r-au'].kpis.slice(-1)[0]))
    .toBe('Mean time to probe (days)');
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
