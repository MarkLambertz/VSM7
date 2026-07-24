import test from "node:test";
import assert from "node:assert/strict";
import {
  createImplementationItem,
  createNumberedSuccessCriticalTask,
  createOperativeUnit,
  createSegmentationOption,
  createStep7Vessel,
  createSuccessCriticalTask,
  createWorkspace,
  getStep5ContributionKey,
  syncAllocations
} from "../src/domain/vsm.js";
import { getExportViewModel } from "../src/application/exportViewModels.js";

test("App export view-model advertises one whole-project docx/json surface", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  const task = createSuccessCriticalTask(1);
  task.title = "Manage customer promise";
  workspace.step3.successCriticalTasks = [task];
  const item = createImplementationItem();
  item.challenge = "Clarify implementation governance";
  workspace.implementation.items = [item];

  const vm = getExportViewModel(workspace, { today: "2026-07-22" }, {
    stepId: "app",
    tileId: null
  });

  assert.equal(vm.stepId, "app");
  assert.equal(vm.tileId, null);
  assert.equal(vm.title, "VSM7 Project Export");
  assert.equal(vm.defaultPreset, "appendix");
  assert.equal(vm.monolithic, true);
  assert.deepEqual(vm.availableFormats, ["docx", "json"]);
  assert.deepEqual(vm.availableScopes.map((scope) => [scope.kind, scope.label]), [["step", "Whole project"]]);
  assert.deepEqual(vm.availableIncludes, []);
  assert.equal(vm.selectable, false);
  assert.match(vm.body, /1 SCTs/);
  assert.match(vm.body, /1 implementation items/);
});

test("Step III SCT export view-model advertises only implemented Phase 0 capability", () => {
  const workspace = createWorkspace();
  const first = createSuccessCriticalTask(1);
  first.title = "Manage customer promise";
  const second = createSuccessCriticalTask(2);
  second.title = "Coordinate release readiness";
  workspace.step3.successCriticalTasks = [first, second];

  const vm = getExportViewModel(workspace, {
    selectedSctIds: [second.id],
    today: "2026-07-21"
  }, {
    stepId: "step3",
    tileId: "scts"
  });

  assert.equal(vm.stepId, "step3");
  assert.equal(vm.tileId, "scts");
  assert.equal(vm.defaultPreset, "data");
  assert.deepEqual(vm.availableFormats, ["xlsx"]);
  assert.deepEqual(vm.availableIncludes, ["notes", "provenance"]);
  assert.deepEqual(vm.availableScopes.map((scope) => [scope.kind, scope.count]), [
    ["tile", 2],
    ["selection", 1],
    ["step", 2]
  ]);
  assert.deepEqual(vm.selection, [{
    kind: "sct",
    id: second.id,
    label: "SCT-002 · Coordinate release readiness"
  }]);
  assert.deepEqual(vm.project, {
    name: "New VSM Project",
    date: "2026-07-21"
  });
});

test("Step III input signals and complexity drivers advertise honest Word exports", () => {
  const workspace = createWorkspace();
  const option = createSegmentationOption("Product", "Product-based segmentation");
  workspace.step1.segmentationOptions = [option];
  workspace.step1.selectedSegmentationOptionId = option.id;
  workspace.step2.selectedOptionIds = [workspace.step2.options[0].id];

  const hints = getExportViewModel(workspace, { today: "2026-07-24" }, {
    stepId: "step3",
    tileId: "step3-hints"
  });
  const drivers = getExportViewModel(workspace, { today: "2026-07-24" }, {
    stepId: "step3",
    tileId: "step3-drivers"
  });

  assert.equal(hints.title, "SCT Input Signals");
  assert.deepEqual(hints.availableFormats, ["docx"]);
  assert.deepEqual(hints.availableScopes.map((scope) => scope.kind), ["tile"]);
  assert.match(hints.body, /manageability signals/);
  assert.equal(drivers.title, "Complexity Drivers");
  assert.deepEqual(drivers.availableFormats, ["docx"]);
  assert.equal(drivers.count, 4);
});

test("Step IV contribution matrix export view-model advertises the host-owned matrix slice", () => {
  const workspace = createWorkspace();
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = "Manage customer promise";
  workspace.step3.successCriticalTasks = [task];
  syncAllocations(workspace);
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  workspace.step4.allocations[task.id].accountableOrganizationId = systemInFocus.id;
  workspace.step4.allocations[task.id].contributions[systemInFocus.id] = "Set common guardrails.";

  const vm = getExportViewModel(workspace, { today: "2026-07-21" }, {
    stepId: "step4",
    tileId: "contribution-matrix"
  });

  assert.equal(vm.stepId, "step4");
  assert.equal(vm.tileId, "contribution-matrix");
  assert.equal(vm.title, "SCT Contribution Matrix");
  assert.equal(vm.kind, "matrix");
  assert.equal(vm.defaultPreset, "data");
  assert.deepEqual(vm.availableFormats, ["xlsx"]);
  assert.deepEqual(vm.availableIncludes, ["notes", "provenance", "owners", "gaps"]);
  assert.deepEqual(vm.availableScopes.map((scope) => [scope.kind, scope.count]), [
    ["tile", 1],
    ["step", 1]
  ]);
  assert.match(vm.body, /3 organizational units/);
  assert.match(vm.body, /1 contribution fields filled/);
  assert.match(vm.body, /0 SCTs with open gaps/);
});

test("Step V steering map export view-model advertises the host-owned mapping slice", () => {
  const workspace = createWorkspace();
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = "Manage customer promise";
  workspace.step3.successCriticalTasks = [task];
  syncAllocations(workspace);
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  workspace.step4.allocations[task.id].contributions[systemInFocus.id] = "Define common promise guardrails.";
  workspace.step5.assignments["3"] = [getStep5ContributionKey(task.id, systemInFocus.id)];

  const vm = getExportViewModel(workspace, { today: "2026-07-21" }, {
    stepId: "step5",
    tileId: "step5-mapping"
  });

  assert.equal(vm.stepId, "step5");
  assert.equal(vm.tileId, "step5-mapping");
  assert.equal(vm.title, "SCT-to-VSM-System Mapping");
  assert.equal(vm.kind, "mapping");
  assert.equal(vm.defaultPreset, "data");
  assert.equal(vm.monolithic, true);
  assert.deepEqual(vm.availableFormats, ["xlsx"]);
  assert.deepEqual(vm.availableIncludes, ["notes", "provenance", "gaps"]);
  assert.deepEqual(vm.availableScopes.map((scope) => [scope.kind, scope.count]), [
    ["step", 1]
  ]);
  assert.equal(vm.selectable, false);
  assert.match(vm.body, /1 mapped contributions/);
  assert.match(vm.body, /0 unassigned contributions/);
});

test("Step VII representation export view-model advertises the nested panel contract", () => {
  const workspace = createWorkspace();
  workspace.step7.vessels = [
    createStep7Vessel("role", "CEO"),
    createStep7Vessel("meeting", "Weekly Executive Business Review")
  ];
  workspace.step7.rasic["contrib-1|vessel-1"] = "A";

  const vm = getExportViewModel(workspace, { today: "2026-07-21" }, {
    stepId: "step7",
    tileId: "all"
  });

  assert.equal(vm.stepId, "step7");
  assert.equal(vm.tileId, "all");
  assert.equal(vm.title, "Step VII · Representation");
  assert.equal(vm.defaultPreset, "doc");
  assert.deepEqual(vm.availableFormats, ["docx"]);
  assert.deepEqual(vm.availableScopes.map((scope) => [scope.kind, scope.count]), [["step", 7]]);
  assert.deepEqual(vm.availableIncludes, ["owners", "gaps", "notes", "provenance", "timestamps", "warnings"]);
  assert.equal(vm.substeps.length, 7);
  assert.match(vm.body, /2 vessels/);
  assert.match(vm.body, /1 RASIC assignments/);
});

test("Step VI export view-models advertise only the live iframe formats they can produce", () => {
  const workspace = createWorkspace();
  const task = createSuccessCriticalTask(1);
  task.title = "Manage customer promise";
  workspace.step3.successCriticalTasks = [task];
  workspace.step6.e2eRoutes[task.id] = { meta: { name: "Customer promise route" } };

  const e2eVm = getExportViewModel(workspace, { today: "2026-07-22" }, {
    stepId: "step6",
    tileId: "step6-e2e"
  });
  const channelsVm = getExportViewModel(workspace, { today: "2026-07-22" }, {
    stepId: "step6",
    tileId: "step6-channels"
  });

  assert.equal(e2eVm.stepId, "step6");
  assert.equal(e2eVm.tileId, "step6-e2e");
  assert.equal(e2eVm.defaultPreset, "appendix");
  assert.equal(e2eVm.monolithic, true);
  assert.deepEqual(e2eVm.availableFormats, ["svg", "png", "pdf", "pptx"]);
  assert.deepEqual(e2eVm.availableScopes.map((scope) => [scope.kind, scope.count]), [["tile", 1]]);
  assert.match(e2eVm.body, /1 SCTs available/);
  assert.match(e2eVm.body, /1 authored routes/);

  assert.equal(channelsVm.tileId, "step6-channels");
  assert.deepEqual(channelsVm.availableFormats, ["svg", "png"]);
  assert.deepEqual(channelsVm.availableScopes.map((scope) => [scope.kind, scope.count]), [["tile", 8]]);
  assert.match(channelsVm.body, /8 canonical communication loops/);
});

test("Step I step export view-model exposes the whole operative-units package", () => {
  const workspace = createWorkspace();
  workspace.step1.segmentationOptions = [
    createSegmentationOption("Product", "Product-based segmentation")
  ];
  workspace.step1.operativeUnits = [
    createOperativeUnit("AI Products", "Operative unit")
  ];

  const vm = getExportViewModel(workspace, { today: "2026-07-21" }, {
    stepId: "step1",
    tileId: null
  });

  assert.equal(vm.stepId, "step1");
  assert.equal(vm.tileId, null);
  assert.equal(vm.title, "Step I · Operative Units");
  assert.equal(vm.defaultPreset, "doc");
  assert.deepEqual(vm.availableFormats, ["docx"]);
  assert.deepEqual(vm.availableScopes.map((scope) => [scope.kind, scope.count]), [["step", 5]]);
  assert.equal(vm.substeps.length, 5);
  assert.match(vm.body, /3 recursion entries/);
  assert.match(vm.body, /1 segmentation options/);
});

test("every Step I work surface advertises a scoped Word export", () => {
  const workspace = createWorkspace();
  const tileIds = [
    "step1-sif",
    "step1-recursion",
    "step1-segmentation",
    "step1-criteria",
    "step1-six-pack",
    "step1-evaluation"
  ];

  for (const tileId of tileIds) {
    const vm = getExportViewModel(workspace, { today: "2026-07-24" }, {
      stepId: "step1",
      tileId
    });
    assert.equal(vm.tileId, tileId);
    assert.deepEqual(vm.availableFormats, ["docx"]);
    assert.deepEqual(vm.availableScopes.map((scope) => scope.kind), ["tile"]);
  }
});

test("Step II view-models separate step and tile export capabilities", () => {
  const workspace = createWorkspace();
  workspace.step2.horizontalAssessment.operativeUnitsAmount = "80";
  workspace.step2.verticalAssessment.system3Star = "35";
  workspace.step2.selectedOptionIds = [workspace.step2.options[0].id];

  const stepVm = getExportViewModel(workspace, { today: "2026-07-21" }, {
    stepId: "step2",
    tileId: null
  });
  const assessmentVm = getExportViewModel(workspace, { today: "2026-07-21" }, {
    stepId: "step2",
    tileId: "step2-assessment"
  });
  const remediesVm = getExportViewModel(workspace, { today: "2026-07-21" }, {
    stepId: "step2",
    tileId: "step2-remedies"
  });

  assert.equal(stepVm.tileId, null);
  assert.deepEqual(stepVm.availableFormats, ["docx"]);
  assert.deepEqual(stepVm.availableScopes.map((scope) => [scope.kind, scope.count]), [["step", 2]]);
  assert.equal(assessmentVm.tileId, "step2-assessment");
  assert.deepEqual(assessmentVm.availableFormats, ["docx", "xlsx"]);
  assert.deepEqual(assessmentVm.availableIncludes, ["notes", "warnings"]);
  assert.match(assessmentVm.body, /Horizontal pressure/);
  assert.equal(remediesVm.tileId, "step2-remedies");
  assert.deepEqual(remediesVm.availableFormats, ["docx", "xlsx"]);
  assert.deepEqual(remediesVm.availableIncludes, []);
  assert.match(remediesVm.body, /3 steering levers/);
  assert.match(remediesVm.body, /1 selected/);
});

test("Overview and Implementation view-models only advertise implemented Batch A tiles", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  workspace.sif.name = "EU AI Solutions SE";
  const item = createImplementationItem();
  item.challenge = "Synchronize implementation follow-up";
  item.responsible = "CEO";
  workspace.implementation.items = [item];

  const overviewVm = getExportViewModel(workspace, { today: "2026-07-21" }, {
    stepId: "overview",
    tileId: "overview-project-frame"
  });
  const implementationVm = getExportViewModel(workspace, { today: "2026-07-21" }, {
    stepId: "implementation",
    tileId: null
  });

  assert.equal(overviewVm.tileId, "overview-project-frame");
  assert.deepEqual(overviewVm.availableFormats, ["docx"]);
  assert.deepEqual(overviewVm.availableScopes.map((scope) => [scope.kind, scope.count]), [["tile", 5]]);
  assert.equal(getExportViewModel(workspace, {}, {
    stepId: "overview",
    tileId: "overview-step-outcomes"
  }), null);
  assert.equal(implementationVm.tileId, "implementation-backlog");
  assert.deepEqual(implementationVm.availableFormats, ["xlsx"]);
  assert.deepEqual(implementationVm.availableIncludes, ["owners", "provenance", "notes", "gaps"]);
  assert.match(implementationVm.body, /1 implementation items/);
});
