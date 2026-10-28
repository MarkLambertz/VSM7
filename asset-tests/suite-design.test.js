// Isolated browser profiles and synthetic data keep real workshops untouched.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const modeKey = 'vsm7-color-mode';
let fixture;
test.beforeAll(async () => {
  const sample = await import(pathToFileURL(path.resolve(__dirname, '../src/application/sampleWorkspaceFactory.js')).href);
  fixture = sample.createSampleWorkspace();
});

async function seedWorkspace(page, baseURL, mode = 'white') {
  await page.goto(baseURL);
  await expect(page.locator('.appearance-toggle')).toBeVisible();
  await page.evaluate(({ workspace, mode, modeKey }) => {
    localStorage.clear();
    const id = workspace.project.id;
    localStorage.setItem(modeKey, mode);
    localStorage.setItem(`vsm-workshop-project:v1:${id}`, JSON.stringify(workspace));
    localStorage.setItem('vsm-workshop-active-project:v1', id);
    localStorage.setItem('vsm-workshop-project-index:v1', JSON.stringify([{
      id, name: workspace.project.name, organizationId: workspace.organization.id,
      organizationName: workspace.organization.name, sifName: workspace.sif.name
    }]));
  }, { workspace: fixture, mode, modeKey });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
}

async function workshopStorage(page) {
  return page.evaluate(() => Object.fromEntries(Object.entries(localStorage)
    .filter(([key]) => key.startsWith('vsm-workshop-'))));
}

async function toggleMode(page, mode, keyboard = false) {
  const toggle = page.locator('.appearance-toggle');
  if (keyboard) {
    await toggle.focus();
    await page.keyboard.press('Enter');
  } else {
    await toggle.click();
  }
  await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
  await expect(toggle).toHaveAttribute('aria-pressed', mode === 'black' ? 'true' : 'false');
  await expect(toggle).toHaveAccessibleName(`Switch to ${mode === 'black' ? 'white' : 'black'} mode`);
}

async function editorFrame(page, selector, api) {
  const handle = await page.locator(selector).elementHandle();
  expect(handle, `${selector} is embedded`).not.toBeNull();
  const frame = await handle.contentFrame();
  await frame.waitForFunction((name) => !!window[name]?.getState, api);
  if (api === 'STEP7') {
    await expect.poll(() => frame.evaluate(() => window.STEP7.getState().ctx.scts.map((sct) => sct.id)))
      .toEqual(fixture.step3.successCriticalTasks.map((sct) => sct.id));
  } else if (api === 'E2E') {
    await expect.poll(() => frame.evaluate(() => window.E2E.getState().meta.primarySctId))
      .toBe(fixture.step3.successCriticalTasks[0].id);
  } else if (api === 'CVC') {
    await expect.poll(() => frame.evaluate(() => window.CVC.getState().loops.map((loop) => loop.id)))
      .toEqual(fixture.step6.channelVarietyModel.loops.map((loop) => loop.id));
  } else if (api === 'SMASTER') {
    await expect.poll(() => frame.evaluate(() => window.SMASTER.getState().sif)).toBe(fixture.sif.name);
  }
  return frame;
}

test('white and black modes are keyboard accessible, persistent and separate from workshop data', async ({ page, baseURL }) => {
  await seedWorkspace(page, baseURL);
  const baseline = await workshopStorage(page);
  await expect(page.locator('.skin-choice, .settings-layer')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-skin');
  for (const mode of ['black', 'white', 'black']) {
    await toggleMode(page, mode, true);
    await expect(page.locator('.appearance-toggle')).toBeFocused();
    expect(await page.evaluate((key) => localStorage.getItem(key), modeKey)).toBe(mode);
    expect(await workshopStorage(page)).toEqual(baseline);
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'black');
  expect(await workshopStorage(page)).toEqual(baseline);
});

test('saved black mode paints before the application starts', async ({ page, baseURL }) => {
  await seedWorkspace(page, baseURL, 'black');
  let release;
  const moduleGate = new Promise((resolve) => { release = resolve; });
  await page.route((url) => /\/(?:src\/presentation\/app|assets\/bundle)\.js$/.test(url.pathname), async (route) => {
    await moduleGate;
    await route.continue();
  });
  try {
    await page.goto(baseURL, { waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'black');
    await expect(page.locator('#app')).toBeEmpty();
    await expect.poll(() => page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.every((link) => !!link.sheet)))
      .toBe(true);
    const background = await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor);
    const channels = background.match(/[\d.]+/g).slice(0, 3).map(Number);
    expect(Math.max(...channels), 'The first empty canvas already uses a dark surface').toBeLessThan(70);
  } finally {
    release();
  }
  await expect(page.locator('.appearance-toggle')).toBeVisible();
  expect(await page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.every((link) => !!link.sheet))).toBe(true);
});

test('appearance changes keep editor models and mounted frames intact', async ({ page, baseURL }) => {
  await seedWorkspace(page, baseURL);
  const surfaces = [
    { route: '#/step5/S4', selector: '[data-vsm-frame][data-vsm-context="step5"]', api: 'VSM' },
    { route: '#/step6/e2e', selector: '[data-e2e-frame]', api: 'E2E' },
    { route: '#/step6/channels', selector: '[data-channel-variety-frame]', api: 'CVC' },
    { route: '#/step7/7.2', selector: '[data-step7-frame]', api: 'STEP7', skin: true },
    { route: '#/vsm', selector: '[data-steering-master-frame]', api: 'SMASTER', skin: true }
  ];
  for (const { route, selector, api, skin } of surfaces) {
    await page.goto(`${baseURL}${route}`);
    const frame = await editorFrame(page, selector, api);
    const baseline = await frame.evaluate((name) => {
      window.__suiteAppearanceProbe = 'mounted';
      const state = window[name].getState();
      return state.model || state;
    }, api);
    const storage = await workshopStorage(page);
    for (const mode of ['black', 'white']) {
      await toggleMode(page, mode);
      expect(await frame.evaluate(() => window.__suiteAppearanceProbe)).toBe('mounted');
      const model = await frame.evaluate((name) => {
        const state = window[name].getState();
        return state.model || state;
      }, api);
      expect(model, `${route}: ${mode} keeps its model`).toEqual(baseline);
      expect(await workshopStorage(page)).toEqual(storage);
      if (skin) await expect(frame.locator('body')).toHaveAttribute('data-skin', mode === 'black' ? 'deck' : 'workshop');
    }
  }
});

test('all workshop routes keep the outer interface inside desktop, tablet and phone viewports', async ({ page, baseURL }, testInfo) => {
  await seedWorkspace(page, baseURL);
  const routes = [
    '#/start', '#/projects', '#/overview', '#/step1/sif', '#/step1/evaluation',
    '#/step2/assessment', '#/step3/register', '#/step4', '#/step5/S4',
    '#/step6/e2e', '#/step6/channels', '#/step7/7.2', '#/implementation', '#/vsm'
  ];
  const overflow = [];
  const reviewRoutes = new Set(['#/start', '#/step1/sif', '#/step1/evaluation', '#/step2/assessment', '#/step3/register', '#/step4', '#/step5/S4', '#/step6/e2e', '#/step7/7.2']);
  const reviewDirectory = path.resolve(__dirname, '../output/suite-design');
  fs.mkdirSync(reviewDirectory, { recursive: true });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const mode of ['white', 'black']) {
      if (await page.locator('html').getAttribute('data-mode') !== mode) await toggleMode(page, mode);
      for (const route of routes) {
        await page.goto(`${baseURL}${route}`);
        await expect(page.locator('.main-surface')).toBeVisible();
        const dimensions = await page.evaluate(() => ({
          width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          headerRight: document.querySelector('.topbar').getBoundingClientRect().right,
          mainRight: document.querySelector('.main-surface').getBoundingClientRect().right,
          outside: [...document.querySelectorAll('.main-surface *')].filter((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.right <= innerWidth + 1 || !rect.width || !rect.height) return false;
            // Report escaped work surfaces, not the legitimate contents of a scroller.
            for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
              const style = getComputedStyle(parent);
              if (['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX)) return false;
            }
            return true;
          }).slice(0, 8).map((element) => ({
            node: `${element.localName}.${element.className}`, right: element.getBoundingClientRect().right,
            parent: `${element.parentElement.localName}.${element.parentElement.className}`
          }))
        }));
        if (dimensions.scrollWidth > width + 1 || dimensions.headerRight > width + 1 || dimensions.mainRight > width + 1) {
          overflow.push({ route, mode, ...dimensions });
        }
        if (width === 1440 && reviewRoutes.has(route)) {
          const frame = route.startsWith('#/step6/') ? ['[data-e2e-frame]', 'E2E']
            : route.startsWith('#/step7/') ? ['[data-step7-frame]', 'STEP7']
            : route.startsWith('#/step5/') ? ['[data-vsm-frame][data-vsm-context="step5"]', 'VSM'] : null;
          if (frame) await editorFrame(page, ...frame);
          const name = route.slice(2).replaceAll('/', '-');
          await page.screenshot({ path: path.join(reviewDirectory, `${testInfo.project.name}-${mode}-${name}.png`), fullPage: true, animations: 'disabled' });
        }
      }
      await page.goto(`${baseURL}#/step1/sif`);
      await page.screenshot({ path: testInfo.outputPath(`${mode}-${width}.png`), fullPage: true, animations: 'disabled' });
    }
  }
  expect(overflow, 'Wide capture surfaces scroll within the page rather than widening the outer interface').toEqual([]);
});

test('tile fullscreen keeps the selected mode and Escape returns to capture', async ({ page, baseURL }) => {
  await seedWorkspace(page, baseURL, 'black');
  await page.goto(`${baseURL}#/step1/sif`);
  const storage = await workshopStorage(page);
  await page.getByRole('button', { name: 'Open System-in-Focus fullscreen', exact: true }).click();
  await expect(page.locator('.step1-fullscreen-overlay')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'black');
  await page.keyboard.press('Escape');
  await expect(page.locator('.step1-fullscreen-overlay')).toHaveCount(0);
  await expect(page.locator('.main-surface')).toBeVisible();
  expect(await workshopStorage(page)).toEqual(storage);
});

test('seven steps stay on the left and open or close without reloading workshop editors', async ({ page, baseURL }, testInfo) => {
  await seedWorkspace(page, baseURL);
  await expect(page.getByRole('navigation', { name: 'VSM steps' })).toHaveCount(0);
  const reviewDirectory = path.resolve(__dirname, '../output/suite-design');
  fs.mkdirSync(reviewDirectory, { recursive: true });

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const mode of ['white', 'black']) {
      await page.goto(`${baseURL}#/step6/e2e`);
      if (await page.locator('html').getAttribute('data-mode') !== mode) await toggleMode(page, mode);
      const frame = await editorFrame(page, '[data-e2e-frame]', 'E2E');
      const model = await frame.evaluate(() => {
        window.__suiteNavigationProbe = 'mounted';
        const state = window.E2E.getState();
        return { meta: state.meta, nodes: state.nodes, links: state.links, findings: state.findings };
      });
      const storage = await workshopStorage(page);
      const rail = page.getByRole('navigation', { name: 'VSM steps' });
      const toggle = rail.locator('[data-action="toggle-nav"]');
      await expect(rail.locator('[data-action="navigate"][data-view^="step"]')).toHaveCount(7);
      await expect(toggle).toHaveAttribute('aria-controls', 'vsm-step-list');
      await expect(page.locator('#vsm-step-list')).toHaveCount(1);

      for (const expanded of [false, true, false]) {
        await toggle.focus();
        if (await toggle.getAttribute('aria-expanded') !== String(expanded)) {
          await page.keyboard.press('Enter');
        }
        await expect(toggle).toBeFocused();
        await expect(toggle).toHaveAttribute('aria-expanded', String(expanded));
        await expect(toggle).toHaveAccessibleName(`${expanded ? 'Close' : 'Open'} step navigation`);
        const layout = await rail.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const buttons = [...element.querySelectorAll('[data-view^="step"]')].map((button) => button.getBoundingClientRect());
          const main = document.querySelector('.main-surface').getBoundingClientRect();
          return {
            x: bounds.x, width: bounds.width, right: bounds.right,
            direction: getComputedStyle(element).flexDirection,
            stepsVertical: buttons.every((button, index) => index === 0 || button.top >= buttons[index - 1].bottom - 1),
            mainLeft: main.left, mainRight: main.right,
            viewport: innerWidth, documentWidth: document.documentElement.scrollWidth
          };
        });
        expect(layout.x, 'The step rail remains anchored at the left edge').toBeLessThanOrEqual(1);
        expect(layout.x).toBeGreaterThanOrEqual(-1);
        expect(layout.direction).toBe('column');
        expect(layout.stepsVertical).toBe(true);
        expect(layout.right).toBeLessThanOrEqual(layout.viewport);
        expect(layout.mainRight).toBeLessThanOrEqual(layout.viewport + 1);
        expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport + 1);
        if (!expanded || width === 1440) expect(layout.mainLeft).toBeGreaterThanOrEqual(layout.right - 1);
        expect(await frame.evaluate(() => window.__suiteNavigationProbe)).toBe('mounted');
        expect(await frame.evaluate(() => {
          const state = window.E2E.getState();
          return { meta: state.meta, nodes: state.nodes, links: state.links, findings: state.findings };
        })).toEqual(model);
        expect(await workshopStorage(page)).toEqual(storage);
        if (expanded || width === 390) {
          const state = expanded ? 'open' : 'closed';
          await page.screenshot({ path: path.join(reviewDirectory, `${testInfo.project.name}-${mode}-navigation-${width}-${state}.png`), animations: 'disabled' });
        }
      }
    }
  }
});
