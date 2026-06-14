import test from "node:test";
import assert from "node:assert/strict";
import {
  ensureWorkspaceShape,
  isStep2SliderAssessed
} from "../src/domain/vsm.js";

test("workspace shape repair preserves old partial data and adds new Step II assessment state", () => {
  const workspace = ensureWorkspaceShape({
    schemaVersion: 0,
    organization: {
      name: "Legacy Org"
    },
    project: {
      id: "legacy-project",
      name: "Legacy Project"
    },
    step2: {
      horizontalAssessment: {
        operativeUnitsAmount: null,
        dissimilarity: "75"
      },
      verticalAssessment: {
        system2: "80"
      }
    }
  });

  assert.equal(workspace.organization.name, "Legacy Org");
  assert.equal(workspace.project.id, "legacy-project");
  assert.equal(workspace.step2.horizontalAssessment.operativeUnitsAmount, "50");
  assert.equal(workspace.step2.horizontalAssessment.dissimilarity, "75");
  assert.equal(workspace.step2.verticalAssessment.system2, "80");
  assert.equal(isStep2SliderAssessed(workspace, "horizontalAssessment", "operativeUnitsAmount"), false);
  assert.equal(isStep2SliderAssessed(workspace, "horizontalAssessment", "dissimilarity"), true);
  assert.equal(isStep2SliderAssessed(workspace, "verticalAssessment", "system2"), true);
});

test("workspace shape repair ignores mixed-type saved data for structured fields", () => {
  const workspace = ensureWorkspaceShape({
    step1: {
      recursionLevels: { broken: true },
      segmentationOptions: "not an array",
      operativeUnits: { bad: true },
      evaluation: []
    },
    step2: "not an object",
    step3: {
      successCriticalTasks: "not an array"
    },
    step4: {
      allocations: []
    },
    step6: {
      communicationChannels: "not an array"
    }
  });

  assert.equal(Array.isArray(workspace.step1.recursionLevels), true);
  assert.equal(Array.isArray(workspace.step1.segmentationOptions), true);
  assert.equal(Array.isArray(workspace.step1.operativeUnits), true);
  assert.deepEqual(workspace.step1.evaluation, { scores: {}, comments: {} });
  assert.equal(workspace.step2.horizontalAssessment.operativeUnitsAmount, "50");
  assert.deepEqual(workspace.step4.allocations, {});
  assert.equal(Array.isArray(workspace.step6.communicationChannels), true);
  assert.ok(workspace.step6.communicationChannels.length > 0);
});

test("workspace shape repair treats legacy Step II conclusions as assessed neutral sliders", () => {
  const workspace = ensureWorkspaceShape({
    step2: {
      horizontalAssessment: {
        operativeUnitsAmount: "50",
        dissimilarity: "50",
        selfControl: "50"
      },
      verticalAssessment: {
        environmentalOverlaps: "50",
        system3Star: "50",
        operationalDependencies: "50",
        resourceBargain: "50",
        corporateIntervention: "50",
        system2: "50"
      },
      conclusion: "Neutral balance was confirmed in the workshop."
    }
  });

  assert.equal(isStep2SliderAssessed(workspace, "horizontalAssessment", "operativeUnitsAmount"), true);
  assert.equal(isStep2SliderAssessed(workspace, "verticalAssessment", "corporateIntervention"), true);
});

test("workspace shape repair keeps allocations synchronized with migrated SCTs", () => {
  const task = {
    id: "task-legacy",
    priority: "A",
    system: "3",
    title: "Legacy SCT",
    explanation: "",
    source: "Workshop Decision",
    kpi: "",
    requiredArtifacts: ""
  };

  const workspace = ensureWorkspaceShape({
    step3: {
      successCriticalTasks: [task]
    },
    step4: {
      allocations: {
        "task-legacy": {
          taskId: "task-legacy",
          levels: { R0: true },
          rationale: "Keep strategy coherent."
        },
        stale: {
          taskId: "stale",
          levels: { R0: true }
        }
      }
    }
  });

  assert.ok(workspace.step4.allocations["task-legacy"]);
  assert.equal(workspace.step4.allocations.stale, undefined);
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  assert.equal(workspace.step4.allocations["task-legacy"].contributions[systemInFocus.id], "Keep strategy coherent.");
  assert.equal(workspace.step4.allocations["task-legacy"].accountableOrganizationId, "");
  assert.equal(workspace.step3.successCriticalTasks[0].toolOrMethodologicalApproach, "");
  assert.equal(workspace.step3.successCriticalTasks[0].number, 1);
});

test("workspace shape repair maps a legacy accountable entity only when it matches an organization", () => {
  const workspace = ensureWorkspaceShape({
    step3: {
      successCriticalTasks: [{ id: "task-legacy", title: "Legacy SCT" }]
    },
    step4: {
      allocations: {
        "task-legacy": {
          taskId: "task-legacy",
          accountableEntity: "System in Focus"
        }
      }
    }
  });
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");

  assert.equal(workspace.step4.allocations["task-legacy"].accountableOrganizationId, systemInFocus.id);
});

test("workspace shape repair migrates the legacy single Step II selection", () => {
  const workspace = ensureWorkspaceShape({
    step2: {
      options: [
        {
          id: "legacy-lever",
          name: "Strengthen control functions",
          timeToEffect: "",
          robustness: "",
          pros: "",
          cons: "",
          challenges: ""
        }
      ],
      selectedOption: "legacy-lever"
    }
  });

  assert.deepEqual(workspace.step2.selectedOptionIds, ["legacy-lever"]);
  assert.equal("selectedOption" in workspace.step2, false);
});
