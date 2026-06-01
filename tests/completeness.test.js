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
  syncAllocations,
  evaluateStep2Variety,
  markStep2SliderAssessed
} from "../src/domain/vsm.js";
import { evaluateCompleteness } from "../src/domain/completeness.js";
import { buildProjectReport, buildStepOutcome, toCsv } from "../src/infrastructure/exporters.js";

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

test("Step II variety patterns generate fit interpretation and SCT signals", () => {
  const workspace = createWorkspace();
  workspace.step1.segmentationOptions = [
    createSegmentationOption("Business Models", "Segment by business model.")
  ];
  workspace.step1.selectedSegmentationOptionId = workspace.step1.segmentationOptions[0].id;
  workspace.step1.operativeUnits = [
    createOperativeUnit("B2C-SaaS"),
    createOperativeUnit("B2B-SaaS"),
    createOperativeUnit("OEM-SaaS"),
    createOperativeUnit("Platform")
  ];
  workspace.step2.horizontalAssessment.operativeUnitsAmount = "90";
  workspace.step2.horizontalAssessment.dissimilarity = "85";
  workspace.step2.horizontalAssessment.selfControl = "20";
  workspace.step2.verticalAssessment.environmentalOverlaps = "80";
  workspace.step2.verticalAssessment.operationalDependencies = "85";
  workspace.step2.verticalAssessment.system3Star = "40";
  workspace.step2.verticalAssessment.resourceBargain = "35";
  workspace.step2.verticalAssessment.corporateIntervention = "30";
  workspace.step2.verticalAssessment.system2 = "45";

  const result = evaluateStep2Variety(workspace);

  assert.equal(result.horizontalPressure, 85);
  assert.ok(result.fitGap < -20);
  assert.ok(result.interpretationCards.some((card) => card.title === "Variety fit gap"));
  assert.ok(result.interpretationCards.some((card) => card.question.includes("bundling")));
  assert.ok(result.sctSignals.some((signal) => signal.includes("interfaces")));
});

test("Step II completeness requires explicit slider assessment, not untouched neutral defaults", () => {
  const workspace = createWorkspace();
  workspace.step2.conclusion = "Neutral looks acceptable after discussion.";

  let step2 = evaluateCompleteness(workspace).byStep.find((step) => step.stepId === "step2");
  assert.ok(step2.missing.includes("Step II not assessed yet: confirm neutral slider positions or adjust them after discussion."));
  assert.ok(!step2.missing.includes("Assess environmental overlaps."));
  assert.ok(step2.score < 30);

  markStep2SliderAssessed(workspace, "step2.horizontalAssessment.operativeUnitsAmount");
  step2 = evaluateCompleteness(workspace).byStep.find((step) => step.stepId === "step2");
  assert.ok(step2.missing.includes("Assess environmental overlaps."));
  assert.ok(step2.missing.includes("Assess corporate intervention."));

  [
    "step2.horizontalAssessment.dissimilarity",
    "step2.horizontalAssessment.selfControl",
    "step2.verticalAssessment.environmentalOverlaps",
    "step2.verticalAssessment.system3Star",
    "step2.verticalAssessment.operationalDependencies",
    "step2.verticalAssessment.resourceBargain",
    "step2.verticalAssessment.corporateIntervention",
    "step2.verticalAssessment.system2"
  ].forEach((path) => markStep2SliderAssessed(workspace, path));

  step2 = evaluateCompleteness(workspace).byStep.find((step) => step.stepId === "step2");
  assert.equal(step2.missing.length, 0);
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

test("CSV helper handles null, undefined, newline, and non-array rows safely", () => {
  const csv = toCsv([
    ["Empty", null, undefined],
    ["Line break", "first\nsecond"],
    "loose value"
  ]);

  assert.equal(csv, "Empty,,\nLine break,\"first\nsecond\"\nloose value");
});

test("export builders produce safe artifacts for sparse workspaces", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Sparse / Project";

  const report = buildProjectReport(workspace);
  const step1 = buildStepOutcome(workspace, "step1");
  const step2 = buildStepOutcome(workspace, "step2");
  const step7 = buildStepOutcome(workspace, "step7");

  assert.equal(report.filename, "sparse-project-report.doc");
  assert.match(report.content, /Completeness Assistant/);
  assert.match(step1.content, /Real Operative Units \/ S1/);
  assert.match(step2.content, /Horizontal Variety/);
  assert.match(step7.content, /Representation/);
  assert.doesNotMatch(`${report.content}${step1.content}${step2.content}${step7.content}`, />undefined</);
  assert.equal(buildStepOutcome(workspace, "unknown"), null);
});
