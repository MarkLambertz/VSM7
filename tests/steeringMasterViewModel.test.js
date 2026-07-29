import test from "node:test";
import assert from "node:assert/strict";
import {
  createNumberedSuccessCriticalTask,
  createOperativeUnit,
  createStep7Vessel,
  createWorkspace,
  getStep5ContributionKey,
  setStep7RasicAssignment,
  syncAllocations,
  toggleStep5ContributionAssignment
} from "../src/domain/vsm.js";
import { getSteeringMasterViewModel } from "../src/application/steeringMasterViewModel.js";

test("Steering Master composes mapped SCTs and their canonical steering evidence", () => {
  const workspace = createWorkspace();
  workspace.sif.name = "AI Business Sector";
  workspace.step1.operativeUnits = [
    createOperativeUnit("AI Products", "Product S1"),
    createOperativeUnit("AI Feature Team", "Feature S1")
  ];
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = "Manage strategic priorities";
  workspace.step3.successCriticalTasks.push(task);
  syncAllocations(workspace);
  const r0 = workspace.step1.recursionLevels.find((unit) => unit.level === "R0");
  const contributionId = getStep5ContributionKey(task.id, r0.id);
  workspace.step4.allocations[task.id].contributions[r0.id] = "Set and review strategic priorities.";
  toggleStep5ContributionAssignment(workspace, "4", contributionId);

  const accountableRole = createStep7Vessel("role", "Strategy Director");
  const meetingVessel = createStep7Vessel("meeting", "Strategy Review");
  workspace.step7.vessels.push(accountableRole, meetingVessel);
  setStep7RasicAssignment(workspace, contributionId, accountableRole.id, "A");
  workspace.step7.aspects[task.id] = {
    kpis: [{ id: "kpi-1", text: "Decision lead time" }],
    artifacts: [{ id: "artifact-1", text: "Strategy map" }],
    tools: [{ id: "tool-1", text: "Scenario planning" }]
  };
  workspace.step7.meetings[meetingVessel.id] = {
    id: meetingVessel.id,
    name: meetingVessel.name,
    cadence: { label: "Quarterly" },
    contribs: [contributionId],
    steering: [{ ref: contributionId, sys: "S4" }],
    participations: [{ vesselId: accountableRole.id }]
  };
  workspace.step6.channelVarietyModel.loops[5].ratings = [3, 2, 1, 3];
  workspace.step6.channelVarietyModel.loops[5].note = "Strategy loop needs faster closure.";

  const vm = getSteeringMasterViewModel(workspace);

  assert.deepEqual(vm.context, {
    sif: "AI Business Sector",
    level: "R0",
    units: ["AI Products", "AI Feature Team"]
  });
  assert.deepEqual(vm.model.scts, [{
    id: task.id,
    did: "SCT-001",
    name: "Manage strategic priorities",
    sys: "S4",
    state: "accepted"
  }]);
  assert.deepEqual(vm.model.aspects[task.id], {
    kpis: ["Decision lead time"],
    artifacts: ["Strategy map"],
    tools: ["Scenario planning"]
  });
  assert.equal(vm.model.accountable[task.id], "Strategy Director");
  assert.deepEqual(vm.model.organs.find((meeting) => meeting.id === meetingVessel.id), {
    id: meetingVessel.id,
    name: "Strategy Review",
    sys: "S4",
    cad: "Quarterly",
    people: 1,
    covers: [task.id],
    alg: false
  });
  assert.deepEqual(vm.model.loops.find((loop) => loop.id === "vsm-loop-s4-s3-homeostat"), {
    id: "vsm-loop-s4-s3-homeostat",
    sys: ["S4", "S3"],
    name: "S4-S3 strategy and planning homeostat",
    ratings: [3, 2, 1, 3],
    note: "Strategy loop needs faster closure.",
    ch: "h34"
  });
});

test("Steering Master keeps unknown meeting coverage and system explicit", () => {
  const workspace = createWorkspace();
  const meeting = createStep7Vessel("meeting", "New steering meeting");
  workspace.step7.vessels.push(meeting);

  const vm = getSteeringMasterViewModel(workspace);
  const organ = vm.model.organs.find((item) => item.id === meeting.id);

  assert.equal(organ.sys, null);
  assert.equal(organ.covers, null);
  assert.equal(organ.people, 0);
  assert.deepEqual(vm.model.scts, []);
  assert.equal(vm.model.loops.length, 8);
});

test("Steering Master omits unmapped and S1 contributions", () => {
  const workspace = createWorkspace();
  const r0 = workspace.step1.recursionLevels.find((unit) => unit.level === "R0");
  const unmapped = createNumberedSuccessCriticalTask(workspace);
  unmapped.title = "Unmapped task";
  const operative = createNumberedSuccessCriticalTask(workspace);
  operative.title = "Operative task";
  workspace.step3.successCriticalTasks.push(unmapped, operative);
  syncAllocations(workspace);
  workspace.step4.allocations[unmapped.id].contributions[r0.id] = "Needs a steering assignment.";
  workspace.step4.allocations[operative.id].contributions[r0.id] = "Performed by System 1.";
  toggleStep5ContributionAssignment(workspace, "1", getStep5ContributionKey(operative.id, r0.id));

  const vm = getSteeringMasterViewModel(workspace);

  assert.deepEqual(vm.model.scts, []);
  assert.deepEqual(vm.model.aspects, {});
  assert.deepEqual(vm.model.accountable, {});
});
