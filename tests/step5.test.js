import test from "node:test";
import assert from "node:assert/strict";
import {
  createNumberedSuccessCriticalTask,
  createWorkspace,
  getStep5AssignedSystem,
  getStep5ContributionKey,
  getStep5InScopeContributions,
  getStep5MappingDiagnostics,
  isStep5ContributionAssigned,
  syncAllocations,
  toggleStep5ContributionAssignment
} from "../src/domain/vsm.js";
import { renderStep5 } from "../src/presentation/steps/step5.js";

function workspaceWithContributions() {
  const workspace = createWorkspace();
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = "Manage shared platform";
  task.priority = "A";
  workspace.step3.successCriticalTasks.push(task);
  syncAllocations(workspace);

  const parent = workspace.step1.recursionLevels.find((organization) => organization.level === "R+1");
  const sif = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  const nested = workspace.step1.recursionLevels.find((organization) => organization.level === "R-1");
  workspace.step4.allocations[task.id].contributions[parent.id] = "Set group policy.";
  workspace.step4.allocations[task.id].contributions[sif.id] = "Set platform standards.";
  workspace.step4.allocations[task.id].contributions[nested.id] = "Apply standards locally.";

  return { workspace, task, parent, sif, nested };
}

test("Step V includes only real non-empty R0 contributions", () => {
  const { workspace, parent, sif, nested } = workspaceWithContributions();
  const contributions = getStep5InScopeContributions(workspace);

  assert.deepEqual(contributions.map((item) => item.organizationId), [sif.id]);
  assert.ok(contributions.every((item) => item.organizationId !== parent.id));
  assert.ok(contributions.every((item) => item.organizationId !== nested.id));
  assert.ok(contributions.every((item) => item.contribution.trim()));
});

test("a real contribution is moved between VSM systems instead of duplicated", () => {
  const { workspace, task, sif } = workspaceWithContributions();
  const key = getStep5ContributionKey(task.id, sif.id);

  assert.equal(toggleStep5ContributionAssignment(workspace, "3", key), true);
  assert.equal(toggleStep5ContributionAssignment(workspace, "4", key), true);
  assert.equal(isStep5ContributionAssigned(workspace, "3", key), false);
  assert.equal(isStep5ContributionAssigned(workspace, "4", key), true);
  assert.equal(getStep5AssignedSystem(workspace, key), "4");
});

test("Step V rejects invented or out-of-scope contribution keys", () => {
  const { workspace, task, parent, nested } = workspaceWithContributions();

  assert.equal(toggleStep5ContributionAssignment(workspace, "3", "invented|contribution"), false);
  assert.equal(toggleStep5ContributionAssignment(workspace, "3", getStep5ContributionKey(task.id, parent.id)), false);
  assert.equal(toggleStep5ContributionAssignment(workspace, "3", getStep5ContributionKey(task.id, nested.id)), false);
  assert.equal(toggleStep5ContributionAssignment(workspace, "9", getStep5ContributionKey(task.id, parent.id)), false);
});

test("Step V diagnostics report factual distribution and unmapped contributions", () => {
  const { workspace, task, sif } = workspaceWithContributions();
  const sifKey = getStep5ContributionKey(task.id, sif.id);
  toggleStep5ContributionAssignment(workspace, "3", sifKey);
  toggleStep5ContributionAssignment(workspace, "4", sifKey);

  const diagnostics = getStep5MappingDiagnostics(workspace);
  const system3 = diagnostics.distribution.find((item) => item.systemId === "3");
  const system4 = diagnostics.distribution.find((item) => item.systemId === "4");

  assert.equal(diagnostics.contributionCount, 1);
  assert.equal(diagnostics.assignmentCount, 1);
  assert.equal(system3.percentage, 0);
  assert.equal(system4.percentage, 100);
  assert.equal(diagnostics.unmappedContributions.length, 0);
  assert.equal("step2Comparison" in diagnostics, false);
});

test("hiding S1 preserves its mapping while excluding it from visible diagnostics", () => {
  const { workspace, task, sif } = workspaceWithContributions();
  const key = getStep5ContributionKey(task.id, sif.id);
  toggleStep5ContributionAssignment(workspace, "1", key);
  workspace.step5.includeSystem1 = false;

  const diagnostics = getStep5MappingDiagnostics(workspace);

  assert.equal(isStep5ContributionAssigned(workspace, "1", key), true);
  assert.equal(diagnostics.distribution.some((item) => item.systemId === "1"), false);
  assert.equal(diagnostics.assignmentCount, 0);
});

test("Step V renders the shared VSM iframe without invented candidates", () => {
  const { workspace } = workspaceWithContributions();
  const html = renderStep5(workspace, { activeStep5System: "3" });

  assert.match(html, /class="vsm-host-frame"/);
  assert.match(html, /data-vsm-context="step5"/);
  assert.match(html, /src="\.\/vsm\.html"/);
  assert.match(html, /data-action="toggle-step5-assignment"/);
  assert.match(html, /R0\/SIF contributions/);
  assert.match(html, /Mapped to S3 · Control/);
  assert.match(html, /Map to S3 · Control/);
  assert.match(html, /exactly one VSM system/);
  assert.match(html, /Doctrine/);
  assert.match(html, /Pragmatic/);
  assert.match(html, /Distribution of SCT contributions/);
  assert.match(html, /data-action="toggle-vsm-details-pane"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, />Show pane<\/button>/);
  assert.doesNotMatch(html, /Double-check with Step II/);
  assert.doesNotMatch(html, /Eligible SCTs|eligible SCTs/);
  assert.doesNotMatch(html, /<img/);
});

test("Step V renders the VSM pane toggle from host state", () => {
  const { workspace } = workspaceWithContributions();
  const hiddenHtml = renderStep5(workspace, { activeStep5System: "3", vsmPaneVisible: false });
  const visibleHtml = renderStep5(workspace, { activeStep5System: "3", vsmPaneVisible: true });

  assert.match(hiddenHtml, /aria-pressed="false"/);
  assert.match(hiddenHtml, />Show pane<\/button>/);
  assert.match(visibleHtml, /aria-pressed="true"/);
  assert.match(visibleHtml, />Hide pane<\/button>/);
});

test("Step V right pane only renders mapped SCTs for the selected VSM system", () => {
  const { workspace, task, sif } = workspaceWithContributions();
  const key = getStep5ContributionKey(task.id, sif.id);
  toggleStep5ContributionAssignment(workspace, "4", key);

  const system3Html = renderStep5(workspace, { activeStep5System: "3" });
  const system4Html = renderStep5(workspace, { activeStep5System: "4" });

  assert.match(system3Html, /Mapped to S3 · Control/);
  assert.match(system3Html, /No contribution mapped here yet/);
  assert.doesNotMatch(system3Html, /Mapped to S4/);

  assert.match(system4Html, /Mapped to S4 · Future and environment/);
  assert.match(system4Html, /Mapped to S4 · Workshop Decision/);
  assert.doesNotMatch(system4Html, /No contribution mapped here yet/);
});
