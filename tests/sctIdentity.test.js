import test from "node:test";
import assert from "node:assert/strict";
import {
  createMeeting,
  createNumberedSuccessCriticalTask,
  createRole,
  createWorkspace,
  ensureWorkspaceShape,
  formatSctNumber,
  mergeSuccessCriticalTasks,
  splitSuccessCriticalTask,
  syncAllocations
} from "../src/domain/vsm.js";

test("numbered SCTs receive stable individual numbers", () => {
  const workspace = createWorkspace();
  const first = createNumberedSuccessCriticalTask(workspace);
  workspace.step3.successCriticalTasks.push(first);
  const second = createNumberedSuccessCriticalTask(workspace);
  workspace.step3.successCriticalTasks.push(second);

  assert.equal(formatSctNumber(first.number), "SCT-001");
  assert.equal(formatSctNumber(second.number), "SCT-002");

  workspace.step3.successCriticalTasks.shift();
  const third = createNumberedSuccessCriticalTask(workspace);
  assert.equal(formatSctNumber(third.number), "SCT-003");
});

test("workspace repair assigns unique SCT numbers to legacy tasks", () => {
  const workspace = ensureWorkspaceShape({
    step3: {
      successCriticalTasks: [
        { id: "legacy-a", title: "A" },
        { id: "legacy-b", title: "B", number: 1 },
        { id: "legacy-c", title: "C", number: 1 }
      ]
    }
  });

  assert.deepEqual(workspace.step3.successCriticalTasks.map((task) => task.number), [1, 2, 3]);
  assert.equal(workspace.step3.nextSctNumber, 4);
});

test("splitting an SCT creates a separately numbered editable task", () => {
  const workspace = createWorkspace();
  const original = createNumberedSuccessCriticalTask(workspace);
  original.title = "Manage shared platform";
  original.explanation = "Coordinate the shared platform.";
  workspace.step3.successCriticalTasks.push(original);
  syncAllocations(workspace);
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  workspace.step4.allocations[original.id].contributions[systemInFocus.id] = "Set shared platform standards.";
  workspace.step4.allocations[original.id].accountableOrganizationId = systemInFocus.id;

  const split = splitSuccessCriticalTask(workspace, original.id);

  assert.equal(formatSctNumber(split.number), "SCT-002");
  assert.equal(split.title, "Manage shared platform (split)");
  assert.equal(split.explanation, original.explanation);
  assert.ok(workspace.step4.allocations[split.id]);
  assert.equal(workspace.step4.allocations[split.id].contributions[systemInFocus.id], "Set shared platform standards.");
  assert.equal(workspace.step4.allocations[split.id].accountableOrganizationId, systemInFocus.id);
});

test("merging SCTs preserves the earliest identity and rewires downstream references", () => {
  const workspace = createWorkspace();
  const first = createNumberedSuccessCriticalTask(workspace);
  first.title = "Manage platform";
  first.explanation = "Set standards.";
  first.priority = "B";
  const second = createNumberedSuccessCriticalTask(workspace);
  second.title = "Coordinate platform";
  second.explanation = "Resolve dependencies.";
  second.priority = "A";
  workspace.step3.successCriticalTasks.push(first, second);
  syncAllocations(workspace);
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  const nestedSystems = workspace.step1.recursionLevels.find((organization) => organization.level === "R-1");
  workspace.step4.allocations[first.id].contributions[systemInFocus.id] = "Set standards.";
  workspace.step4.allocations[second.id].contributions[nestedSystems.id] = "Resolve dependencies locally.";
  workspace.step4.allocations[first.id].accountableOrganizationId = systemInFocus.id;
  workspace.step4.allocations[second.id].accountableOrganizationId = systemInFocus.id;

  const meeting = createMeeting();
  meeting.linkedTaskIds = [second.id];
  workspace.step5.meetings = [meeting];
  const role = createRole();
  role.linkedTaskIds = [first.id, second.id];
  workspace.step7.roles = [role];

  const merged = mergeSuccessCriticalTasks(workspace, [second.id, first.id]);

  assert.equal(merged.id, first.id);
  assert.equal(formatSctNumber(merged.number), "SCT-001");
  assert.equal(merged.priority, "A");
  assert.match(merged.title, /Manage platform/);
  assert.match(merged.title, /Coordinate platform/);
  assert.equal(workspace.step3.successCriticalTasks.length, 1);
  assert.equal(workspace.step4.allocations[first.id].contributions[systemInFocus.id], "Set standards.");
  assert.equal(workspace.step4.allocations[first.id].contributions[nestedSystems.id], "Resolve dependencies locally.");
  assert.equal(workspace.step4.allocations[first.id].accountableOrganizationId, systemInFocus.id);
  assert.deepEqual(meeting.linkedTaskIds, [first.id]);
  assert.deepEqual(role.linkedTaskIds, [first.id]);
});

test("merging SCTs clears conflicting accountability choices", () => {
  const workspace = createWorkspace();
  const first = createNumberedSuccessCriticalTask(workspace);
  const second = createNumberedSuccessCriticalTask(workspace);
  workspace.step3.successCriticalTasks.push(first, second);
  syncAllocations(workspace);
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  const nestedSystems = workspace.step1.recursionLevels.find((organization) => organization.level === "R-1");
  workspace.step4.allocations[first.id].accountableOrganizationId = systemInFocus.id;
  workspace.step4.allocations[second.id].accountableOrganizationId = nestedSystems.id;

  const merged = mergeSuccessCriticalTasks(workspace, [first.id, second.id]);

  assert.equal(workspace.step4.allocations[merged.id].accountableOrganizationId, "");
});
