const { test, expect } = require('@playwright/test');

const PAGE = '/';
const ACTIVE_PROJECT_KEY = 'vsm-workshop-active-project:v1';
const PROJECT_PREFIX = 'vsm-workshop-project:v1:';
const VSM_STORAGE_PREFIX = 'vsm-workshop-';
const REQUIRED_VERTICAL_LOOP_IDS = [
  'vsm-loop-s2-s1-coordination',
  'vsm-loop-s3-s1-command',
  'vsm-loop-s3-s1-resource-bargain',
  'vsm-loop-s3star-s1-audit',
  'vsm-loop-s4-s3-homeostat',
  'vsm-loop-s5-s4-s3-normative',
  'vsm-loop-s5-s1-algedonic'
];

const DATA = {
  sif: 'Mobility Platform',
  parent: 'Northstar Group',
  nested: 'Product Squads',
  lever: 'Strengthen control functions',
  title: 'Keep the customer promise',
  description: 'Continuously translate market commitments into cross-unit portfolio and delivery decisions.',
  kpi: 'Promise decision lead time',
  artifact: 'Customer promise decision log',
  method: 'Monthly promise review',
  parentContribution: 'Set enterprise customer-promise guardrails.',
  sifContribution: 'Translate commitments into portfolio priorities and resolve cross-unit trade-offs.',
  nestedContribution: 'Deliver milestones and report risks early.',
  finding: 'Portfolio decision waits for cross-unit evidence.',
  channelMeeting: 'Weekly portfolio coordination',
  channelObservation: 'Capacity is below the variety of incoming conflicts.',
  role: 'Customer Promise Owner'
};

test.describe('Feature: a Success-Critical Task remains canonical through VSM7', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(({ prefix }) => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(prefix) || key === 'e2eRobustness1' || key === 'cvcChecks1') {
          localStorage.removeItem(key);
        }
      }
    }, { prefix: VSM_STORAGE_PREFIX });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Make the organization steerable.' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  });

  test('Scenario: carry SCT-001 through Steps I-VII, Implementation, and reload', async ({ page }) => {
    let sctId;
    let parentId;
    let sifId;
    let nestedId;
    let contributionId;
    let routeId;
    let nodeId;
    let findingId;
    let roleId;

    await test.step('Given Step I defines the SIF and its recursion organizations', async () => {
      await goToStep(page, 'step1');
      await fillAndCommit(page.locator('[data-path="sif.name"]'), DATA.sif);
      await fillAndCommit(recursionNameInput(page, 'R+1'), DATA.parent);
      await fillAndCommit(recursionNameInput(page, 'R0'), DATA.sif);
      await fillAndCommit(recursionNameInput(page, 'R-1'), DATA.nested);

      const workspace = await readActiveWorkspace(page);
      parentId = organizationAt(workspace, 'R+1').id;
      sifId = organizationAt(workspace, 'R0').id;
      nestedId = organizationAt(workspace, 'R-1').id;

      expect(parentId).toBeTruthy();
      expect(sifId).toBeTruthy();
      expect(nestedId).toBeTruthy();
      await markCurrentStepDone(page);
    });

    await test.step('And Step II carries a selected manageability lever into Step III', async () => {
      await goToStep(page, 'step2');
      await page.locator('.step2-substep-bar [data-action="step2-subpage"][data-subpage="challenges"]').click();
      const leverCard = page.locator('.manageability-option-card').filter({ hasText: DATA.lever });
      await leverCard.locator('[data-action="toggle-manageability-option"]').click();
      await expect(leverCard.locator('[data-action="toggle-manageability-option"]')).toHaveText('Selected');
      await markCurrentStepDone(page);

      await goToStep(page, 'step3');
      await expect(page.getByText(DATA.lever, { exact: true })).toBeVisible();
    });

    await test.step('When I create and enrich SCT-001 in the Step III register', async () => {
      await page.locator('.step3-substep-bar [data-action="step3-subpage"][data-subpage="register"]').click();
      await page.getByRole('button', { name: 'Add SCT', exact: true }).click();

      const inspector = page.locator('[data-sct-inspector]');
      await expect(inspector).toBeVisible();
      await fillAndCommit(inspector.locator('[data-field="title"]'), DATA.title);
      await inspector.locator('[data-field="source"]').selectOption('Manageability Lever');
      await fillAndCommit(inspector.locator('[data-field="explanation"]'), DATA.description);
      await inspector.locator('summary').click();
      await fillAndCommit(inspector.locator('[data-field="kpi"]'), DATA.kpi);
      await fillAndCommit(inspector.locator('[data-field="requiredArtifacts"]'), DATA.artifact);
      await fillAndCommit(inspector.locator('[data-field="toolOrMethodologicalApproach"]'), DATA.method);

      await expect(page.locator('.sct-compact-table')).toContainText('SCT-001');
      await expect(page.locator('.sct-compact-table')).toContainText(DATA.title);

      await expect.poll(async () => {
        const workspace = await readActiveWorkspace(page);
        return workspace.step3.successCriticalTasks[0]?.toolOrMethodologicalApproach;
      }).toBe(DATA.method);

      const workspace = await readActiveWorkspace(page);
      expect(workspace.step3.successCriticalTasks).toHaveLength(1);
      expect(workspace.step3.successCriticalTasks[0].source).toBe('Manageability Lever');
      sctId = workspace.step3.successCriticalTasks[0].id;
      contributionId = `${sctId}|${sifId}`;
      expect(sctId).toBeTruthy();
      await markCurrentStepDone(page);
    });

    await test.step('When Step IV decomposes that same SCT into recursion-level contributions', async () => {
      await goToStep(page, 'step4');
      await fillAndCommit(contributionInput(page, sctId, parentId), DATA.parentContribution);
      await fillAndCommit(contributionInput(page, sctId, sifId), DATA.sifContribution);
      await fillAndCommit(contributionInput(page, sctId, nestedId), DATA.nestedContribution);
      await page.locator(
        `[data-action="set-accountable-organization"][data-task-id="${sctId}"][data-organization-id="${sifId}"]`
      ).click();

      await expect.poll(async () => {
        const allocation = (await readActiveWorkspace(page)).step4.allocations[sctId];
        return {
          taskId: allocation.taskId,
          accountableOrganizationId: allocation.accountableOrganizationId,
          contributions: allocation.contributions
        };
      }).toEqual({
        taskId: sctId,
        accountableOrganizationId: sifId,
        contributions: {
          [parentId]: DATA.parentContribution,
          [sifId]: DATA.sifContribution,
          [nestedId]: DATA.nestedContribution
        }
      });
      await markCurrentStepDone(page);
    });

    await test.step('Then Step V offers only the real R0 contribution and maps it once to S4', async () => {
      await goToStep(page, 'step5');
      const vsmFrame = page.frameLocator('[data-vsm-frame][data-vsm-context="step5"]');
      await expect(vsmFrame.locator('[data-el="4"]')).toBeVisible();
      await vsmFrame.locator('[data-el="4"]').click();
      await expect(page.locator('.step5-iframe-heading h3')).toHaveText('S4 · Future and environment');

      const unmappedCard = page.locator('.step5-unmapped-panel .step5-contribution-card')
        .filter({ hasText: DATA.sifContribution });
      await expect(unmappedCard).toHaveCount(1);
      await expect(page.locator('.step5-mapping-section')).not.toContainText(DATA.parentContribution);
      await expect(page.locator('.step5-mapping-section')).not.toContainText(DATA.nestedContribution);
      await unmappedCard.locator('[data-action="toggle-step5-assignment"]').click();

      await expect(page.locator('.step5-mapped-panel')).toContainText(DATA.sifContribution);
      await expect.poll(async () => mappedSystemsFor(await readActiveWorkspace(page), contributionId))
        .toEqual(['4']);
      await markCurrentStepDone(page);
    });

    await test.step('When Step VI builds an E2E route and records a structured finding', async () => {
      await goToStep(page, 'step6');
      await expect(page.locator('.e2e-route-context')).toContainText(`SCT-001 · ${DATA.title}`);
      await expect(page.locator('.e2e-route-context')).toContainText('3 contributions available to place');

      const e2eFrame = page.frameLocator('[data-e2e-frame]');
      await expect(e2eFrame.locator('#contribWrap')).toContainText(DATA.parentContribution);
      await expect(e2eFrame.locator('#contribWrap')).toContainText(DATA.sifContribution);
      await expect(e2eFrame.locator('#contribWrap')).toContainText(DATA.nestedContribution);
      await e2eFrame.locator('[data-contrib]').filter({ hasText: DATA.sifContribution }).click();
      await expect(e2eFrame.locator('#pAddFinding')).toBeVisible();
      await e2eFrame.locator('#pAddFinding').click();
      await e2eFrame.locator('.fcat').selectOption('delay');
      await e2eFrame.locator('.fsev').selectOption('high');
      await e2eFrame.locator('.fnote').fill(DATA.finding);

      await expect.poll(async () => {
        const route = (await readActiveWorkspace(page)).step6.e2eRoutes[sctId];
        return route?.findings?.[0]?.note;
      }).toBe(DATA.finding);

      const workspace = await readActiveWorkspace(page);
      const route = workspace.step6.e2eRoutes[sctId];
      routeId = workspace.step6.e2eRouteIds[sctId];
      const contributionNode = route.nodes.find((node) => node.contribId === contributionId);
      nodeId = contributionNode?.id;
      findingId = route.findings[0].id;
      expect(route.meta.primarySctId).toBe(sctId);
      expect(contributionNode).toEqual(expect.objectContaining({
        id: nodeId,
        contribId: contributionId,
        contribSctId: sctId
      }));
      expect(route.findings[0]).toEqual(expect.objectContaining({
        id: findingId,
        target: { type: 'node', id: nodeId },
        category: 'delay',
        severity: 'high',
        note: DATA.finding
      }));
      expect(routeId).toBeTruthy();
    });

    await test.step('And Step VI retains a human-authored communication weakness for the SIF', async () => {
      await page.locator('.step6-substep-bar [data-action="step6-subpage"][data-subpage="channels"]').click();
      const channelFrame = page.frameLocator('[data-channel-variety-frame]');
      const channelState = await channelFrame.locator('body').evaluate(() => window.CVC.getState());
      const loopIds = channelState.loops.map((loop) => loop.id);
      expect(new Set(loopIds).size).toBe(loopIds.length);
      for (const loopId of REQUIRED_VERTICAL_LOOP_IDS) {
        expect(loopIds.filter((id) => id === loopId)).toHaveLength(1);
      }
      const loopIndex = channelState.loops.findIndex((loop) => loop.id === 'vsm-loop-s2-s1-coordination');
      expect(loopIndex).toBeGreaterThanOrEqual(0);

      const capacityCell = channelFrame.locator(`[data-cell][data-loop="${loopIndex}"][data-crit="0"]`);
      await capacityCell.click();
      await capacityCell.click();
      await capacityCell.click();
      await channelFrame.locator('[data-f="communication"]').fill(DATA.channelMeeting);
      await channelFrame.locator('[data-f="note"]').fill(DATA.channelObservation);

      await expect.poll(async () => {
        const workspace = await readActiveWorkspace(page);
        const loop = workspace.step6.channelVarietyModel.loops
          .find((item) => item.id === 'vsm-loop-s2-s1-coordination');
        return {
          sifName: workspace.step6.channelVarietyModel.meta.sifName,
          rating: loop?.ratings?.[0],
          communication: loop?.communication,
          note: loop?.note
        };
      }).toEqual({
        sifName: DATA.sif,
        rating: 1,
        communication: DATA.channelMeeting,
        note: DATA.channelObservation
      });
      await markCurrentStepDone(page);
    });

    await test.step('When Step VII creates an R0 role and assigns it to the same contribution', async () => {
      await goToStep(page, 'step7');
      const step7Frame = page.frameLocator('[data-step7-frame]');
      await expect.poll(async () => {
        const state = await step7Frame.locator('body').evaluate(() => window.STEP7.getState());
        return state.ctx.scts.some((sct) => sct.id === sctId && sct.did === 'SCT-001');
      }).toBe(true);

      await step7Frame.locator('[data-act="newvessel"][data-t="role"]').click();
      await step7Frame.locator('#dname').fill(DATA.role);
      await step7Frame.locator('#dpurpose').fill('Own the customer promise across portfolio and delivery decisions.');
      await expect(step7Frame.locator('#dscope')).toHaveValue(sifId);
      await step7Frame.locator('#dscope').selectOption(sifId);
      await step7Frame.locator('[data-act="dstate"][data-s="accepted"]').click();
      await step7Frame.locator('[data-act="dcreate"]').click();

      // Wait for the debounced iframe change to reach the canonical host model
      // before changing substeps; the host re-feeds its saved model on `goto`.
      await expect.poll(async () => {
        const workspace = await readActiveWorkspace(page);
        return workspace.step7.vessels.find((vessel) => vessel.name === DATA.role)?.id || '';
      }).not.toBe('');
      const workspaceWithRole = await readActiveWorkspace(page);
      const role = workspaceWithRole.step7.vessels.find((vessel) => vessel.name === DATA.role);
      roleId = role.id;
      expect(role).toEqual(expect.objectContaining({
        id: roleId,
        name: DATA.role,
        scope: sifId,
        state: 'accepted'
      }));

      // Enter the saved RASIC substep through the app route. This avoids racing
      // the iframe's `goto` event with the host's authoritative model re-feed.
      await page.goto('/#/step7/7.2');
      const scopeFilter = step7Frame.locator('[data-key="scope"]');
      const rasicBody = step7Frame.locator('.rasic tbody');
      await expect(scopeFilter).toHaveValue('sif');
      await expect(rasicBody).toContainText(DATA.sif);
      await expect(rasicBody).not.toContainText(DATA.parent);
      await expect(rasicBody).not.toContainText(DATA.nested);
      await scopeFilter.selectOption('all');
      await expect(rasicBody).toContainText(DATA.parent);
      await expect(rasicBody).toContainText(DATA.nested);
      await scopeFilter.selectOption('sif');

      const rasicCell = step7Frame.locator(
        `table.rasic [data-act="cycle"][data-c="${contributionId}"][data-v="${roleId}"]`
      );
      await expect(rasicCell).toBeVisible();
      // The matrix replaces the clicked cell synchronously as it cycles. Dispatch
      // the DOM click and reacquire it between states, matching the editor's own
      // scroll-preservation regression tests.
      await rasicCell.evaluate((cell) => cell.click());
      await expect(step7Frame.locator(
        `table.rasic [data-act="cycle"][data-c="${contributionId}"][data-v="${roleId}"]`
      )).toHaveText('R');
      await step7Frame.locator(
        `table.rasic [data-act="cycle"][data-c="${contributionId}"][data-v="${roleId}"]`
      ).evaluate((cell) => cell.click());

      await expect.poll(async () => {
        const workspace = await readActiveWorkspace(page);
        return workspace.step7.rasic[`${contributionId}|${roleId}`] || '';
      }).toBe('A');

      await page.goto('/#/step7/7.3');
      await step7Frame.locator(`[data-act="selaspect"][data-id="${sctId}"]`).click();
      await expect(step7Frame.locator('[data-act="aspedit"][data-kind="kpis"]')).toHaveValue(DATA.kpi);
      await expect(step7Frame.locator('[data-act="aspedit"][data-kind="artifacts"]')).toHaveValue(DATA.artifact);
      await expect(step7Frame.locator('[data-act="aspedit"][data-kind="tools"]')).toHaveValue(DATA.method);
      await markCurrentStepDone(page);
    });

    await test.step('When Implementation explicitly promotes the finding, provenance is retained once', async () => {
      await goToStep(page, 'implementation');
      const findingCandidate = page.locator('.e2e-finding-candidates .finding-candidate')
        .filter({ hasText: DATA.finding });
      await expect(findingCandidate).toHaveCount(1);
      await findingCandidate.getByRole('button', { name: 'Create backlog item', exact: true }).click();
      await expect(findingCandidate.getByRole('button', { name: 'Added to backlog', exact: true })).toBeDisabled();

      const backlogSection = page.locator('.work-section').filter({ hasText: 'Transformation Backlog' });
      const backlogRow = backlogSection.locator('tbody tr').first();
      await expect(backlogRow.locator('[data-field="challenge"]')).toHaveValue(DATA.finding);
      await fillAndCommit(backlogRow.locator('[data-field="responsible"]'), DATA.role);
      await backlogRow.locator('[data-field="status"]').selectOption('In progress');

      await expect.poll(async () => {
        const items = (await readActiveWorkspace(page)).implementation.items;
        return items.map((item) => ({
          challenge: item.challenge,
          source: item.source,
          responsible: item.responsible,
          status: item.status
        }));
      }).toEqual([{
        challenge: DATA.finding,
        source: { kind: 'e2e-finding', routeId, findingId },
        responsible: DATA.role,
        status: 'In progress'
      }]);
      await markCurrentStepDone(page);
    });

    await test.step('Then reload restores one canonical SCT and every downstream reference', async () => {
      await page.reload();
      await expect(page.locator('[data-save-indicator]')).toContainText('Saved');

      const workspace = await readActiveWorkspace(page);
      expect(workspace.step3.successCriticalTasks).toHaveLength(1);
      expect(workspace.step3.successCriticalTasks[0]).toEqual(expect.objectContaining({
        id: sctId,
        number: 1,
        title: DATA.title,
        explanation: DATA.description,
        source: 'Manageability Lever',
        kpi: DATA.kpi,
        requiredArtifacts: DATA.artifact,
        toolOrMethodologicalApproach: DATA.method
      }));
      expect(workspace.step4.allocations[sctId].accountableOrganizationId).toBe(sifId);
      expect(workspace.step4.allocations[sctId].contributions).toEqual({
        [parentId]: DATA.parentContribution,
        [sifId]: DATA.sifContribution,
        [nestedId]: DATA.nestedContribution
      });
      expect(mappedSystemsFor(workspace, contributionId)).toEqual(['4']);
      expect(workspace.step6.e2eRouteIds[sctId]).toBe(routeId);
      expect(workspace.step6.e2eRoutes[sctId]).toEqual(expect.objectContaining({
        meta: expect.objectContaining({ primarySctId: sctId }),
        nodes: expect.arrayContaining([expect.objectContaining({
          id: nodeId,
          contribId: contributionId,
          contribSctId: sctId
        })]),
        findings: expect.arrayContaining([expect.objectContaining({
          id: findingId,
          target: { type: 'node', id: nodeId },
          note: DATA.finding
        })])
      }));
      const savedLoop = workspace.step6.channelVarietyModel.loops
        .find((loop) => loop.id === 'vsm-loop-s2-s1-coordination');
      expect(savedLoop).toEqual(expect.objectContaining({
        ratings: expect.arrayContaining([1]),
        communication: DATA.channelMeeting,
        note: DATA.channelObservation
      }));
      expect(workspace.step7.vessels).toContainEqual(expect.objectContaining({
        id: roleId,
        name: DATA.role,
        scope: sifId,
        state: 'accepted'
      }));
      expect(workspace.step7.rasic[`${contributionId}|${roleId}`]).toBe('A');
      expect(workspace.implementation.items).toHaveLength(1);
      expect(workspace.implementation.items[0].source).toEqual({ kind: 'e2e-finding', routeId, findingId });

      await goToStep(page, 'step4');
      await expect(contributionInput(page, sctId, sifId)).toHaveValue(DATA.sifContribution);
      await expect(contributionInput(page, sctId, parentId)).toHaveValue(DATA.parentContribution);
      await expect(contributionInput(page, sctId, nestedId)).toHaveValue(DATA.nestedContribution);

      await goToStep(page, 'step6');
      const e2eFrame = page.frameLocator('[data-e2e-frame]');
      await expect.poll(async () => {
        const state = await e2eFrame.locator('body').evaluate(() => window.E2E.getState());
        return {
          primarySctId: state.meta.primarySctId,
          contributionIds: state.nodes.map((node) => node.contribId),
          findingNotes: state.findings.map((finding) => finding.note)
        };
      }).toEqual({
        primarySctId: sctId,
        contributionIds: [contributionId],
        findingNotes: [DATA.finding]
      });

      await goToStep(page, 'step7');
      const step7Frame = page.frameLocator('[data-step7-frame]');
      await expect.poll(async () => {
        const state = await step7Frame.locator('body').evaluate(() => window.STEP7.getState());
        return {
          sctIds: state.ctx.scts.map((sct) => sct.id),
          rolePresent: state.model.vessels.some((vessel) => vessel.id === roleId),
          assignment: state.model.rasic[`${contributionId}|${roleId}`]
        };
      }).toEqual({
        sctIds: [sctId],
        rolePresent: true,
        assignment: 'A'
      });

      await page.goto('/#/step7/7.3');
      await step7Frame.locator(`[data-act="selaspect"][data-id="${sctId}"]`).click();
      await expect(step7Frame.locator('[data-act="aspedit"][data-kind="kpis"]')).toHaveValue(DATA.kpi);
      await expect(step7Frame.locator('[data-act="aspedit"][data-kind="artifacts"]')).toHaveValue(DATA.artifact);
      await expect(step7Frame.locator('[data-act="aspedit"][data-kind="tools"]')).toHaveValue(DATA.method);
    });
  });
});

async function readActiveWorkspace(page) {
  return page.evaluate(({ activeKey, projectPrefix }) => {
    const projectId = localStorage.getItem(activeKey);
    const raw = projectId ? localStorage.getItem(`${projectPrefix}${projectId}`) : null;
    if (!raw) {
      throw new Error('No active VSM7 workspace was persisted.');
    }
    return JSON.parse(raw);
  }, { activeKey: ACTIVE_PROJECT_KEY, projectPrefix: PROJECT_PREFIX });
}

async function goToStep(page, stepId) {
  const button = page.locator(`.step-rail [data-action="navigate"][data-view="${stepId}"]`);
  await button.click();
  await expect(button).toHaveClass(/is-active/);
}

async function fillAndCommit(locator, value) {
  await locator.fill(value);
  await locator.press('Tab');
}

async function markCurrentStepDone(page) {
  const button = page.getByRole('button', { name: 'Mark step done', exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByRole('button', { name: 'Step done', exact: true })).toBeVisible();
}

function recursionNameInput(page, level) {
  return page.locator('.recursion-capture-section tbody tr')
    .filter({ has: page.locator('.recursion-level-token', { hasText: level }) })
    .locator('[data-field="name"]');
}

function organizationAt(workspace, level) {
  const organization = workspace.step1.recursionLevels.find((item) => item.level === level);
  if (!organization) {
    throw new Error(`No organization exists at ${level}.`);
  }
  return organization;
}

function contributionInput(page, sctId, organizationId) {
  return page.locator(`[data-allocation-contribution="${sctId}|${organizationId}"]`);
}

function mappedSystemsFor(workspace, contributionId) {
  return Object.entries(workspace.step5.assignments)
    .filter(([, contributionIds]) => contributionIds.includes(contributionId))
    .map(([systemId]) => systemId);
}
