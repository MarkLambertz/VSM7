// End-to-end URL regressions against strict source and built static deployments.
// Every Playwright test has an isolated browser profile; only synthetic data is used.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let fixture;
test.beforeAll(async () => {
  const sampleModule = await import(pathToFileURL(path.resolve(__dirname, '../src/application/sampleWorkspaceFactory.js')).href);
  fixture = sampleModule.createSampleWorkspace();
});

function watchRequests(page, baseURL) {
  const base = new URL(baseURL);
  const violations = [];
  const seen = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['http:', 'https:'].includes(url.protocol)) return;
    seen.push(url.pathname);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
      violations.push(`Request escaped application: ${url.href}`);
    }
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    const optionalStaticHealth = url.pathname === `${base.pathname}api/storage/health` && response.status() === 404;
    if (response.status() >= 400 && !optionalStaticHealth) {
      violations.push(`HTTP ${response.status()}: ${url.href}`);
    }
  });
  page.on('pageerror', (error) => violations.push(`Page error: ${error.message}`));
  return { violations, seen };
}

async function getApiFrame(scope, selector, api) {
  const element = await scope.locator(selector).elementHandle();
  expect(element, `${selector} was mounted`).not.toBeNull();
  const frame = await element.contentFrame();
  expect(frame, `${selector} has a browsing context`).not.toBeNull();
  await frame.waitForFunction((name) => !!window[name]?.getState, api);
  return frame;
}

async function readWorkspace(page) {
  return page.evaluate(() => {
    const id = localStorage.getItem('vsm-workshop-active-project:v1');
    return JSON.parse(localStorage.getItem(`vsm-workshop-project:v1:${id}`));
  });
}

function canonicalEvidence(workspace) {
  return {
    projectId: workspace.project.id,
    scts: workspace.step3.successCriticalTasks,
    allocations: workspace.step4.allocations,
    assignments: workspace.step5.assignments,
    routes: workspace.step6.e2eRoutes,
    routeIds: workspace.step6.e2eRouteIds,
    channels: workspace.step6.channelVarietyModel,
    accountability: workspace.step7
  };
}

test('host and nested frames retain application paths and canonical workshop evidence', async ({ page, baseURL }) => {
  const network = watchRequests(page, baseURL);
  const mount = new URL(baseURL).pathname;
  await page.goto(baseURL);
  await expect(page.getByRole('heading', { name: 'Make the organization steerable.' })).toBeVisible();
  await expect(page.locator('.topbar')).toHaveCSS('display', 'grid');
  expect(await page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.every((link) => !!link.sheet))).toBe(true);

  await page.evaluate((workspace) => {
    const id = workspace.project.id;
    localStorage.setItem(`vsm-workshop-project:v1:${id}`, JSON.stringify(workspace));
    localStorage.setItem('vsm-workshop-active-project:v1', id);
    localStorage.setItem('vsm-workshop-project-index:v1', JSON.stringify([{
      id, name: workspace.project.name, organizationId: workspace.organization.id,
      organizationName: workspace.organization.name, sifName: workspace.sif.name
    }]));
  }, fixture);
  // Changing only the hash would retain the blank, already-loaded workspace.
  // The explicit index entry forces boot from the synthetic saved project.
  await page.goto(`${baseURL}index.html#/step5/S4`);
  const map = await getApiFrame(page, '[data-vsm-frame][data-vsm-context="step5"]', 'VSM');
  await expect(map.locator('[data-el="4"]')).toBeVisible();
  await expect(page.locator('.step5-mapped-panel')).toContainText(fixture.step3.successCriticalTasks[0].title);
  const baseline = canonicalEvidence(await readWorkspace(page));

  await page.goto(`${baseURL}#/step6/e2e`);
  const route = await getApiFrame(page, '[data-e2e-frame]', 'E2E');
  await expect.poll(() => route.evaluate(() => window.E2E.getState().meta.primarySctId))
    .toBe(fixture.step3.successCriticalTasks[0].id);
  const primaryAllocation = fixture.step4.allocations[fixture.step3.successCriticalTasks[0].id];
  for (const contribution of Object.values(primaryAllocation.contributions).filter(Boolean)) {
    await expect(route.locator('#contribWrap')).toContainText(contribution);
  }

  await page.goto(`${baseURL}#/step6/channels`);
  const channels = await getApiFrame(page, '[data-channel-variety-frame]', 'CVC');
  const canonicalLoopIds = fixture.step6.channelVarietyModel.loops.map((loop) => loop.id);
  await expect.poll(() => channels.evaluate(() => window.CVC.getState().loops.map((loop) => loop.id)))
    .toEqual(canonicalLoopIds);
  const channelMap = await getApiFrame(channels, '#vsmframe', 'VSM');
  expect(new URL(channelMap.url()).pathname).toBe(`${mount}vsm.html`);
  await expect(channelMap.locator('[data-lyr="b"]').first()).toBeAttached();

  await page.goto(`${baseURL}#/step7/7.7`);
  const step7 = await getApiFrame(page, '[data-step7-frame]', 'STEP7');
  expect(new URL(step7.url()).pathname).toBe(`${mount}embedded/step7-ux.html`);
  await expect.poll(() => step7.evaluate(() => window.STEP7.getState().ctx.scts.map((sct) => sct.id)))
    .toEqual(fixture.step3.successCriticalTasks.map((sct) => sct.id));
  const organization = await getApiFrame(step7, '#orgFrame', 'ORG');
  expect(new URL(organization.url()).pathname).toBe(`${mount}embedded/org-chart.html`);
  await expect.poll(() => organization.evaluate(() => window.ORG.getState().model.scts.map((sct) => sct.id)))
    .toEqual(fixture.step3.successCriticalTasks.map((sct) => sct.id));
  await organization.locator('[data-act="export"]').click();
  const nestedExport = await getApiFrame(step7, '#exportFrame', 'EXPORT');
  expect(new URL(nestedExport.url()).pathname).toBe(`${mount}embedded/export-panel.html`);
  await expect(nestedExport.locator('#expanel.on [data-go]')).toBeVisible();
  await expect.poll(() => nestedExport.evaluate(() => window.EXPORT.getState().stepId)).toBe('step7');

  await page.goto(`${baseURL}#/vsm`);
  const steering = await getApiFrame(page, '[data-steering-master-frame]', 'SMASTER');
  expect(new URL(steering.url()).pathname).toBe(`${mount}embedded/steering-master.html`);
  await expect.poll(() => steering.evaluate(() => window.SMASTER.getState().sif)).toBe(fixture.sif.name);
  const steeringMap = await getApiFrame(steering, '#vsmframe', 'VSM');
  expect(new URL(steeringMap.url()).pathname).toBe(`${mount}vsm.html`);
  await steering.locator('[data-act="export"]').click();
  const appExport = await getApiFrame(page, '[data-export-panel-frame]', 'EXPORT');
  expect(new URL(appExport.url()).pathname).toBe(`${mount}embedded/export-panel.html`);
  await expect(appExport.locator('#expanel.on [data-go]')).toBeVisible();

  await page.reload();
  await getApiFrame(page, '[data-steering-master-frame]', 'SMASTER');
  expect(canonicalEvidence(await readWorkspace(page))).toEqual(baseline);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(network.seen).toContain(`${mount}api/storage/health`);
  expect(network.seen.some((url) => url.includes('/design-previews/'))).toBe(false);
  expect(network.violations).toEqual([]);
});

test('preserved previews work directly with nested HTML and local vendor dependencies', async ({ page, baseURL }) => {
  const network = watchRequests(page, baseURL);
  const mount = new URL(baseURL).pathname;
  await page.goto(`${baseURL}design-previews/steering-master.html`);
  await page.waitForFunction(() => !!window.SMASTER?.getState);
  const diagram = await getApiFrame(page, '#vsmframe', 'VSM');
  expect(new URL(diagram.url()).pathname).toBe(`${mount}vsm.html`);
  await expect.poll(() => network.seen.some((url) => url.endsWith('/vendor/three.module.min.js'))).toBe(true);

  await page.goto(`${baseURL}design-previews/step7-ux.html`);
  await page.waitForFunction(() => !!window.STEP7?.getState);
  await page.evaluate(() => window.STEP7.goto('7.7'));
  const chart = await getApiFrame(page, '#orgFrame', 'ORG');
  expect(new URL(chart.url()).pathname).toBe(`${mount}design-previews/org-chart.html`);
  await page.evaluate(() => window.STEP7.openExport());
  const panel = await getApiFrame(page, '#exportFrame', 'EXPORT');
  expect(new URL(panel.url()).pathname).toBe(`${mount}design-previews/export-panel.html`);
  await expect(panel.locator('#expanel.on [data-go]')).toBeVisible();
  expect(network.violations).toEqual([]);
});

test('static hosting rejects extensionless aliases and missing files', async ({ request, baseURL }) => {
  expect((await request.get(`${baseURL}vsm`)).status()).toBe(404);
  expect((await request.get(`${baseURL}missing.html`)).status()).toBe(404);
  if (new URL(baseURL).pathname !== '/') {
    expect((await request.get(new URL('/vsm.html', baseURL).href)).status()).toBe(404);
    expect((await request.get(new URL('/api/storage/health', baseURL).href)).status()).toBe(404);
  }
});

function retainedStaticFiles(relativeDirectory) {
  const sourceDirectory = path.resolve(__dirname, '..', relativeDirectory);
  return fs.readdirSync(sourceDirectory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const relative = `${relativeDirectory}/${entry.name}`;
    return entry.isDirectory() ? retainedStaticFiles(relative) : [relative];
  });
}

test('all retained editor, preview, vendor, and image assets are served byte-for-byte', async ({ request, baseURL }) => {
  const files = [
    'vsm.html', 'e2e-robustness-check.html', 'channel-variety-check.html',
    ...retainedStaticFiles('embedded'), ...retainedStaticFiles('design-previews'),
    ...retainedStaticFiles('src/presentation/assets')
  ];
  for (const relative of files) {
    const response = await request.get(`${baseURL}${relative}`);
    expect(response.status(), relative).toBe(200);
    expect(await response.body(), relative).toEqual(fs.readFileSync(path.resolve(__dirname, '..', relative)));
  }
});
