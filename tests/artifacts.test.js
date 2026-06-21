import test from "node:test";
import assert from "node:assert/strict";
import {
  createOperativeUnit,
  createSegmentationOption,
  createWorkspace,
  evaluateStep2Variety
} from "../src/domain/vsm.js";
import { buildProjectReport, buildStepOutcome, toCsv } from "../src/infrastructure/exporters.js";
import { renderOverview } from "../src/presentation/steps/overview.js";

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

test("export builders produce safe artifacts without completeness grading", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Sparse / Project";

  const report = buildProjectReport(workspace);
  const step1 = buildStepOutcome(workspace, "step1");
  const step2 = buildStepOutcome(workspace, "step2");
  const step4 = buildStepOutcome(workspace, "step4");
  const step5 = buildStepOutcome(workspace, "step5");
  const step7 = buildStepOutcome(workspace, "step7");

  assert.equal(report.filename, "sparse-project-report.doc");
  assert.doesNotMatch(report.content, /Completeness|Score|Open Items/);
  assert.match(step1.content, /Real Operative Units \/ S1/);
  assert.match(step2.content, /Horizontal Variety/);
  assert.match(step4.content, /R0 · System in Focus/);
  assert.match(step4.content, /Accountable organization/);
  assert.match(step5.content, /VSM System/);
  assert.match(step5.content, /Contribution/);
  assert.match(buildStepOutcome(workspace, "step6").content, /E2E Robustness Findings/);
  assert.match(buildStepOutcome(workspace, "step6").content, /Communication Variety Checks/);
  assert.match(buildStepOutcome(workspace, "step6").content, /Communication &amp; Meetings/);
  assert.match(buildStepOutcome(workspace, "step6").content, />Artifact</);
  assert.match(buildStepOutcome(workspace, "step6").content, />Role</);
  assert.match(buildStepOutcome(workspace, "step6").content, /S5-S1 algedonic signal/);
  assert.match(buildStepOutcome(workspace, "step6").content, /Unrated/);
  assert.match(buildStepOutcome(workspace, "step3").content, /SCT ID/);
  assert.match(buildStepOutcome(workspace, "step3").content, /Tool or Methodological Approach/);
  assert.match(step7.content, /Representation/);
  assert.doesNotMatch(`${report.content}${step1.content}${step2.content}${step7.content}`, />undefined</);
  assert.equal(buildStepOutcome(workspace, "unknown"), null);
});

test("project overview leaves completion judgment to the workshop expert", () => {
  const html = renderOverview(createWorkspace());

  assert.doesNotMatch(html, /Completeness|%/);
  assert.match(html, /Success-critical tasks/);
  assert.match(html, /SCT contribution assignments/);
  assert.match(html, /Representation entities/);
});
