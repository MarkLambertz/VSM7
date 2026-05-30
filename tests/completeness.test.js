import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorkspace,
  createOperativeUnit,
  createSegmentationOption,
  createKeyBuyingCriterion,
  createSuccessCriticalTask,
  createMeeting,
  createRole,
  sixPackOfControl,
  syncAllocations
} from "../src/domain/vsm.js";
import { evaluateCompleteness } from "../src/domain/completeness.js";
import { toCsv } from "../src/infrastructure/exporters.js";

test("empty workspace surfaces core Step I and SCT gaps", () => {
  const workspace = createWorkspace();
  const result = evaluateCompleteness(workspace);
  const step1 = result.byStep.find((step) => step.stepId === "step1");
  const step3 = result.byStep.find((step) => step.stepId === "step3");

  assert.equal(step1.score, 0);
  assert.ok(step1.missing.includes("Start by naming the System-in-Focus and entering real workshop content."));
  assert.ok(step3.missing.includes("Add success-critical tasks."));
  assert.ok(result.score < 60);
});

test("Step I recognizes segmentation and warns when criteria weights are incomplete", () => {
  const workspace = createWorkspace();
  workspace.sif.name = "Business Unit A";
  workspace.sif.purpose = "Deliver customer value.";
  workspace.sif.customers = "Customer group A";
  workspace.step1.segmentationOptions = [
    createSegmentationOption("Regional", "Segment by market regions."),
    createSegmentationOption("Product", "Segment by product portfolio.")
  ];
  workspace.step1.selectedSegmentationOptionId = workspace.step1.segmentationOptions[1].id;
  workspace.step1.decisionRationale = "Product segmentation better reflects customer value.";
  workspace.step1.operativeUnits = [createOperativeUnit("Product Line A", "One S1 unit.")];

  workspace.step1.keyBuyingCriteria = ["Time to market", "Integration", "Cost"].map((name, index) => {
    const criterion = createKeyBuyingCriterion();
    criterion.name = name;
    criterion.explanation = `${name} explanation`;
    criterion.weight = index === 0 ? "40" : "20";
    return criterion;
  });

  workspace.step1.strategicFields.forEach((field) => {
    field.direction = `${field.variable} direction`;
  });

  [...workspace.step1.keyBuyingCriteria, ...workspace.step1.strategicFields].forEach((row) => {
    workspace.step1.evaluation.scores[row.id] = {
      [workspace.step1.segmentationOptions[0].id]: "1",
      [workspace.step1.segmentationOptions[1].id]: "2"
    };
  });

  const step1 = evaluateCompleteness(workspace).byStep.find((step) => step.stepId === "step1");

  assert.equal(step1.missing.length, 0);
  assert.ok(step1.warnings.some((warning) => warning.includes("not 100%")));
});

test("Step I catches duplicate segmentation evaluation scores per row", () => {
  const workspace = createWorkspace();
  workspace.sif.name = "Business Unit A";
  workspace.sif.purpose = "Deliver customer value.";
  workspace.sif.customers = "Customer group A";
  workspace.step1.segmentationOptions = [
    createSegmentationOption("Regional", "Segment by market regions."),
    createSegmentationOption("Product", "Segment by product portfolio.")
  ];
  workspace.step1.selectedSegmentationOptionId = workspace.step1.segmentationOptions[1].id;
  workspace.step1.decisionRationale = "Product segmentation better reflects customer value.";
  workspace.step1.operativeUnits = [createOperativeUnit("Product Line A", "One S1 unit.")];
  workspace.step1.keyBuyingCriteria = [createKeyBuyingCriterion(), createKeyBuyingCriterion(), createKeyBuyingCriterion()];
  workspace.step1.keyBuyingCriteria.forEach((criterion, index) => {
    criterion.name = `Criterion ${index + 1}`;
    criterion.explanation = "Explanation";
    criterion.weight = String(index === 0 ? 40 : 30);
  });
  workspace.step1.strategicFields.forEach((field, index) => {
    field.variable = sixPackOfControl[index];
    field.direction = `${field.variable} direction`;
  });
  [...workspace.step1.keyBuyingCriteria, ...workspace.step1.strategicFields].forEach((row) => {
    workspace.step1.evaluation.scores[row.id] = {
      [workspace.step1.segmentationOptions[0].id]: "1",
      [workspace.step1.segmentationOptions[1].id]: "2"
    };
  });
  workspace.step1.evaluation.scores[workspace.step1.keyBuyingCriteria[0].id][workspace.step1.segmentationOptions[1].id] = "1";

  const step1 = evaluateCompleteness(workspace).byStep.find((step) => step.stepId === "step1");

  assert.ok(step1.missing.includes("Resolve duplicate scores in evaluation rows."));
});

test("allocation completeness follows the SCT spine", () => {
  const workspace = createWorkspace();
  const task = createSuccessCriticalTask();
  task.title = "Allocate scarce engineering capacity";
  task.explanation = "Create a recurring resource bargain across operative units.";
  workspace.step3.successCriticalTasks.push(task);
  syncAllocations(workspace);

  let step4 = evaluateCompleteness(workspace).byStep.find((step) => step.stepId === "step4");
  assert.ok(step4.missing.some((message) => message.includes("allocation")));

  workspace.step4.allocations[task.id].levels.R0 = true;
  workspace.step4.allocations[task.id].accountableEntity = "Operations Committee";
  workspace.step4.allocations[task.id].rationale = "The task requires cross-unit optimization.";

  step4 = evaluateCompleteness(workspace).byStep.find((step) => step.stepId === "step4");
  assert.equal(step4.missing.length, 0);
});

test("representation links roles back to SCTs", () => {
  const workspace = createWorkspace();
  const task = createSuccessCriticalTask();
  task.title = "Maintain coherent strategy";
  task.explanation = "Keep strategy and portfolio synchronized.";
  workspace.step3.successCriticalTasks.push(task);

  const role = createRole();
  role.name = "Portfolio Manager";
  role.purpose = "Own portfolio coherence.";
  role.linkedTaskIds = [task.id];
  workspace.step7.roles.push(role);

  const step7 = evaluateCompleteness(workspace).byStep.find((step) => step.stepId === "step7");
  assert.equal(step7.missing.length, 0);
  assert.equal(step7.warnings.length, 0);
});

test("meeting completeness warns when kept meetings are not connected to SCTs", () => {
  const workspace = createWorkspace();
  const meeting = createMeeting();
  meeting.name = "Strategy Board";
  meeting.purpose = "Balance today and tomorrow.";
  meeting.vsmSystem = "4";
  workspace.step5.meetings.push(meeting);

  const step5 = evaluateCompleteness(workspace).byStep.find((step) => step.stepId === "step5");
  assert.equal(step5.missing.length, 0);
  assert.ok(step5.warnings.some((message) => message.includes("not linked to SCTs")));
});

test("CSV helper quotes cells safely", () => {
  const csv = toCsv([
    ["Task", "Explanation"],
    ["Plan, align", "Needs \"care\""]
  ]);

  assert.equal(csv, "Task,Explanation\n\"Plan, align\",\"Needs \"\"care\"\"\"");
});
