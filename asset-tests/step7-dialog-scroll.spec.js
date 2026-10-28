// Isolated synthetic workshops exercise the real host and editor UI.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let fixture;
test.beforeAll(async () => {
  const { createSampleWorkspace } = await import(pathToFileURL(path.resolve(__dirname, '../src/application/sampleWorkspaceFactory.js')).href);
  fixture = createSampleWorkspace();
});

async function seedWorkspace(page, mode) {
  await page.goto('./');
  await expect(page.locator('.appearance-toggle')).toBeVisible();
  await page.evaluate(({ workspace, mode }) => {
    localStorage.clear();
    const id = workspace.project.id;
    localStorage.setItem('vsm7-color-mode', mode);
    localStorage.setItem(`vsm-workshop-project:v1:${id}`, JSON.stringify(workspace));
    localStorage.setItem('vsm-workshop-active-project:v1', id);
    localStorage.setItem('vsm-workshop-project-index:v1', JSON.stringify([{
      id, name: workspace.project.name, organizationId: workspace.organization.id,
      organizationName: workspace.organization.name, sifName: workspace.sif.name
    }]));
  }, { workspace: fixture, mode });
  await page.reload();
}

async function workshop(page) {
  return page.evaluate(() => {
    const id = localStorage.getItem('vsm-workshop-active-project:v1');
    return JSON.parse(localStorage.getItem(`vsm-workshop-project:v1:${id}`));
  });
}

async function step7Frame(page) {
  const handle = await page.locator('[data-step7-frame]').elementHandle();
  const frame = await handle.contentFrame();
  await frame.waitForFunction(() => !!window.STEP7?.getState);
  await expect.poll(() => frame.evaluate(() => window.STEP7.getState().ctx.scts.map((sct) => sct.id)))
    .toEqual(fixture.step3.successCriticalTasks.map((sct) => sct.id));
  return frame;
}

async function expectDialogInViewport(page, frame) {
  await expect(page.locator('[data-step7-frame]')).toHaveClass(/is-dialog-presented/);
  const host = await page.locator('[data-step7-frame]').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const header = document.querySelector('.topbar').getBoundingClientRect();
    const coversViewport = Math.abs(bounds.top) <= 1 && bounds.height >= innerHeight - 1;
    return { top: bounds.top, topLimit: coversViewport ? 0 : Math.max(0, header.bottom), bottomLimit: innerHeight };
  });
  const dialog = await frame.locator('.modal').evaluate((element) => {
    const rect = (target) => { const bounds = target.getBoundingClientRect(); return { top: bounds.top, bottom: bounds.bottom }; };
    return { header: rect(element.querySelector('.m-head')), footer: rect(element.querySelector('.m-foot')) };
  });
  expect(host.top + dialog.header.top, 'The dialog heading and close control stay below the visible app header').toBeGreaterThanOrEqual(host.topLimit - 1);
  expect(host.top + dialog.footer.bottom, 'The dialog actions stay inside the visible browser viewport').toBeLessThanOrEqual(host.bottomLimit + 1);
}

for (const { width, height } of [{ width:1440, height:820 }, { width:1440, height:540 }, { width:390, height:740 }]) {
  for (const mode of ['white', 'black']) {
    test(`Step VII vessel dialog remains reachable after project navigation in ${mode} at ${width}x${height}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height });
      await seedWorkspace(page, mode);
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.locator('.step-rail [data-view="step6"]').click();
      await page.locator('[data-action="step6-subpage"][data-subpage="channels"]').click();
      const channelFrame = page.frameLocator('[data-channel-variety-frame]');
      await channelFrame.locator('[data-cell]').first().click();
      await channelFrame.locator('[data-f="communication"]').fill('Dialog regression coordination');
      await channelFrame.locator('[data-f="note"]').fill('Testing the normal transition from communication checks.');
      await page.locator('.step-rail [data-view="step7"]').click();
      const frame = await step7Frame(page);
      const before = await workshop(page);
      await frame.evaluate(() => { window.__dialogFrameProbe = 'same-editor'; });
      await frame.locator('[data-act="newvessel"][data-t="role"]').click();
      await frame.locator('#dname').fill('Dialog viewport test role');
      await frame.locator('#dpurpose').fill('Own an isolated browser regression test.');
      await frame.locator('#dscope').selectOption(fixture.step1.recursionLevels.find((unit) => unit.level === 'R0').id);
      await frame.locator('[data-act="dstate"][data-s="accepted"]').click();
      await expectDialogInViewport(page, frame);
      const directory = path.resolve(__dirname, '../output/step7-dialog-scroll');
      fs.mkdirSync(directory, { recursive: true });
      await page.screenshot({ path: path.join(directory, `${testInfo.project.name || "source"}-${mode}-${width}x${height}-before-create.png`) });
      await frame.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(frame.locator('#modal')).not.toHaveClass(/\bon\b/);
      await expect(page.locator('[data-step7-frame]')).not.toHaveClass(/is-dialog-presented/);
      await expect(frame.locator('[data-act="newvessel"][data-t="role"]')).toBeFocused();
      expect((await workshop(page)).step7).toEqual(before.step7);
      expect(await frame.evaluate(() => window.__dialogFrameProbe)).toBe('same-editor');
      const captureScroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
      await frame.locator('[data-act="newvessel"][data-t="role"]').click();
      await frame.locator('#dname').fill(`Viewport test ${mode} ${height}`);
      await frame.locator('#dpurpose').fill('Own an isolated browser regression test.');
      await expectDialogInViewport(page, frame);
      await frame.locator('[data-act="dcreate"]').click();
      await expect(frame.locator('#modal')).not.toHaveClass(/\bon\b/);
      await expect(page.locator('[data-step7-frame]')).not.toHaveClass(/is-dialog-presented/);
      expect(await frame.evaluate(() => window.__dialogFrameProbe)).toBe('same-editor');
      expect(await page.evaluate(() => ({ x: scrollX, y: scrollY }))).toEqual(captureScroll);
      await expect.poll(async () => (await workshop(page)).step7.vessels.some((vessel) => vessel.name === `Viewport test ${mode} ${height}`)).toBe(true);
      await page.reload();
      const restored = await step7Frame(page);
      await expect(restored.locator('.vcard').filter({ hasText: `Viewport test ${mode} ${height}` })).toBeVisible();
    });
  }
}

for (const entry of ['design-previews/step7-ux.html', 'embedded/step7-ux.html']) {
  test(`standalone and tile fullscreen dialogs keep their heading and actions reachable in ${entry}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 540 });
    await page.goto(entry);
    await page.waitForFunction(() => !!window.STEP7?.getState);
    await page.locator('.substep-button[data-step="7.1"]').click();
    const before = await page.evaluate(() => window.STEP7.getState().model);
    const opener = page.locator('[data-act="newvessel"][data-t="role"]');
    await opener.click();
    await page.locator('#dname').fill('Standalone dialog test');
    await page.locator('#dpurpose').fill('Keep the modal reachable on a short screen.');
    await page.locator('[data-act="dstate"][data-s="accepted"]').click();
    const checkBounds = async () => {
      const geometry = await page.locator('.modal').evaluate((element) => {
        const r = element.getBoundingClientRect();
        const body = element.querySelector('.m-body');
        return { top:r.top, bottom:r.bottom, left:r.left, right:r.right, width:innerWidth, height:innerHeight, scrollable:body.scrollHeight>body.clientHeight };
      });
      expect(geometry.top).toBeGreaterThanOrEqual(0);
      expect(geometry.bottom).toBeLessThanOrEqual(geometry.height);
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(geometry.width);
      expect(geometry.scrollable).toBe(true);
    };
    await checkBounds();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal')).not.toHaveClass(/\bon\b/);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => window.STEP7.getState().model)).toEqual(before);

    await page.locator('[data-act="tilefs"]').click();
    await expect(page.locator('#tileFsHost')).toHaveClass(/\bon\b/);
    await page.locator('#tileFsHost [data-act="newvessel"][data-t="role"]').click();
    await page.locator('#dname').fill('Fullscreen dialog test');
    await page.locator('[data-act="dstate"][data-s="accepted"]').click();
    await checkBounds();
    await page.getByRole('button', { name:'Cancel', exact:true }).click();
    await expect(page.locator('#modal')).not.toHaveClass(/\bon\b/);
    await expect(page.locator('#tileFsHost')).toHaveClass(/\bon\b/);
    expect(await page.evaluate(() => window.STEP7.getState().model)).toEqual(before);
    await page.keyboard.press('Escape');
    await expect(page.locator('#tileFsHost')).not.toHaveClass(/\bon\b/);
  });
}

test('an open host dialog survives resizing and returning from native fullscreen', async ({ page }, testInfo) => {
  await page.setViewportSize({ width:1440, height:820 });
  await seedWorkspace(page, 'black');
  await page.getByRole('button', { name:'Continue', exact:true }).click();
  await page.locator('.step-rail [data-view="step7"]').click();
  const frame = await step7Frame(page);
  const before = (await workshop(page)).step7;
  await frame.evaluate(() => { window.__dialogFrameProbe = 'same-editor'; });
  await frame.locator('[data-act="newvessel"][data-t="role"]').click();
  await frame.locator('#dname').fill('Retained dialog draft');
  await expectDialogInViewport(page, frame);
  await page.setViewportSize({ width:390, height:540 });
  await expectDialogInViewport(page, frame);
  await expect(frame.locator('#dname')).toHaveValue('Retained dialog draft');
  await page.keyboard.press('Escape');
  await expect(frame.locator('#modal')).not.toHaveClass(/\bon\b/);
  await expect(page.locator('[data-step7-frame]')).not.toHaveClass(/is-dialog-presented/);
  expect((await workshop(page)).step7).toEqual(before);

  await page.setViewportSize({ width:1440, height:820 });
  await frame.locator('[data-act="tilefs"]').click();
  await expect.poll(() => frame.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await frame.locator('[data-act="newvessel"][data-t="role"]').click();
  await frame.locator('#dname').fill('Draft kept across fullscreen exit');
  // Browser UI transition only; data and UI handlers remain driven by normal controls.
  await frame.evaluate(() => document.exitFullscreen());
  await expect.poll(() => frame.evaluate(() => !!document.fullscreenElement)).toBe(false);
  await expectDialogInViewport(page, frame);
  await expect(frame.locator('#dname')).toHaveValue('Draft kept across fullscreen exit');
  expect(await frame.evaluate(() => window.__dialogFrameProbe)).toBe('same-editor');
  await frame.getByRole('button', { name:'Cancel', exact:true }).click();
  await expect(frame.locator('#modal')).not.toHaveClass(/\bon\b/);
  await expect(page.locator('[data-step7-frame]')).not.toHaveClass(/is-dialog-presented/);
  expect((await workshop(page)).step7).toEqual(before);
});
