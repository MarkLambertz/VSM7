import test from "node:test";
import assert from "node:assert/strict";
import {
  createNumberedSuccessCriticalTask,
  createRecursionLevel,
  createWorkspace,
  getRecursionOrganizations,
  syncAllocations
} from "../src/domain/vsm.js";
import { renderStep4, renderStep4ContributionMatrix } from "../src/presentation/steps/step4.js";

test("Step IV renders actual recursion organizations from lowest to highest level", () => {
  const workspace = createWorkspace();
  workspace.step1.recursionLevels.push(createRecursionLevel("R-1", "Division Type B", "Second organization on the same recursion level"));
  workspace.step1.recursionLevels.push(createRecursionLevel("R-2", "Team", "Lowest organization"));
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = "Manage customer promise";
  workspace.step3.successCriticalTasks = [task];
  syncAllocations(workspace);

  const html = renderStep4(workspace);
  const organizationNames = getRecursionOrganizations(workspace).map((organization) => organization.name);

  assert.match(html, /SCT Contribution Matrix/);
  assert.deepEqual(organizationNames, ["Team", "Nested operative systems", "Division Type B", "System in Focus", "Parent system"]);
  assert.ok(html.indexOf("Team") < html.indexOf("Nested operative systems"));
  assert.ok(html.indexOf("Nested operative systems") < html.indexOf("Division Type B"));
  assert.ok(html.indexOf("Division Type B") < html.indexOf("System in Focus"));
  assert.ok(html.indexOf("System in Focus") < html.indexOf("Parent system"));
  assert.equal((html.match(/data-allocation-contribution=/g) || []).length, 5);
  assert.equal((html.match(/data-action="set-accountable-organization"/g) || []).length, 5);
  assert.doesNotMatch(html, /Accountable entity|Partial allocation notes|data-allocation-level/);
});

test("Step IV hero explains the central or decentral decision path", () => {
  const workspace = createWorkspace();
  const html = renderStep4(workspace);

  assert.match(html, /Can we afford decentralization\?/);
  assert.match(html, /Does the SCT influence a key buying criterion\?/);
  assert.match(html, /Can central assignment create relevant synergy without restricting needed autonomy\?/);
  assert.match(html, /Central · R0 or R\+1/);
  assert.match(html, /Decentral · R-1 or lower/);
  assert.match(html, /Decentral by subsidiarity/);
  assert.match(html, /Central \/ decentral decision path/);
});

test("Step IV focus matrix avoids a repeated nested headline", () => {
  const workspace = createWorkspace();
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = "Manage customer promise";
  workspace.step3.successCriticalTasks = [task];
  syncAllocations(workspace);

  const html = renderStep4ContributionMatrix(workspace, { fullscreen: true });

  assert.doesNotMatch(html, /<h2>SCT Contribution Matrix<\/h2>/);
  assert.match(html, /Describe what each organizational unit must contribute/);
  assert.match(html, /fullscreen-matrix-section/);
});

test("Step IV keeps contribution guidance as an unsaved placeholder", () => {
  const workspace = createWorkspace();
  const task = createNumberedSuccessCriticalTask(workspace);
  workspace.step3.successCriticalTasks = [task];
  syncAllocations(workspace);

  const html = renderStep4(workspace);
  const allocation = workspace.step4.allocations[task.id];

  assert.match(html, /placeholder="Describe the contribution of/);
  assert.doesNotMatch(html, />Describe the contribution of[^<]*<\/textarea>/);
  assert.ok(Object.values(allocation.contributions).every((value) => value === ""));
});

test("Step IV exposes one selected accountable organization independently from contribution text", () => {
  const workspace = createWorkspace();
  const task = createNumberedSuccessCriticalTask(workspace);
  workspace.step3.successCriticalTasks = [task];
  syncAllocations(workspace);
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  workspace.step4.allocations[task.id].accountableOrganizationId = systemInFocus.id;

  const html = renderStep4(workspace);

  assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
  assert.match(html, /aria-pressed="true"[\s\S]*?disabled/);
  assert.match(html, /Accountable/);
  assert.equal(workspace.step4.allocations[task.id].contributions[systemInFocus.id], "");
});

test("Step IV applies Priority and Source filters", () => {
  const workspace = createWorkspace();
  const matchingTask = createNumberedSuccessCriticalTask(workspace);
  matchingTask.title = "Visible task";
  matchingTask.priority = "B";
  matchingTask.source = "Manageability Lever";
  workspace.step3.successCriticalTasks.push(matchingTask);
  const hiddenTask = createNumberedSuccessCriticalTask(workspace);
  hiddenTask.title = "Hidden task";
  hiddenTask.priority = "A";
  hiddenTask.source = "Workshop Decision";
  workspace.step3.successCriticalTasks.push(hiddenTask);
  syncAllocations(workspace);

  const html = renderStep4(workspace, {
    sctPriorityFilter: "B",
    sctSourceFilter: "Manageability Lever"
  });

  assert.match(html, /Filter SCT Contribution Matrix/);
  assert.match(html, /Visible task/);
  assert.doesNotMatch(html, /Hidden task/);
  assert.match(html, /1 of 2 SCTs/);
});

test("Step IV contribution synchronization follows recursion organizations by stable ID", () => {
  const workspace = createWorkspace();
  const task = createNumberedSuccessCriticalTask(workspace);
  workspace.step3.successCriticalTasks = [task];
  syncAllocations(workspace);
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  workspace.step4.allocations[task.id].contributions[systemInFocus.id] = "Set common guardrails.";
  systemInFocus.name = "Business Sector";

  syncAllocations(workspace);

  assert.equal(workspace.step4.allocations[task.id].contributions[systemInFocus.id], "Set common guardrails.");
  assert.equal(Object.keys(workspace.step4.allocations[task.id].contributions).length, workspace.step1.recursionLevels.length);
});

test("Step IV synchronization clears accountability when its organization is removed", () => {
  const workspace = createWorkspace();
  const task = createNumberedSuccessCriticalTask(workspace);
  workspace.step3.successCriticalTasks = [task];
  syncAllocations(workspace);
  const nestedSystem = workspace.step1.recursionLevels.find((organization) => organization.level === "R-1");
  workspace.step4.allocations[task.id].accountableOrganizationId = nestedSystem.id;
  workspace.step1.recursionLevels = workspace.step1.recursionLevels.filter((organization) => organization.id !== nestedSystem.id);

  syncAllocations(workspace);

  assert.equal(workspace.step4.allocations[task.id].accountableOrganizationId, "");
});
