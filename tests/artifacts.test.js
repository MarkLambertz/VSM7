import test from "node:test";
import assert from "node:assert/strict";
import {
  createImplementationItem,
  createOperativeUnit,
  createNumberedSuccessCriticalTask,
  createSegmentationOption,
  createStep7Vessel,
  createSuccessCriticalTask,
  createWorkspace,
  evaluateStep2Variety,
  getStep5ContributionKey,
  getStep7EditorContext,
  setStep7RasicAssignment,
  syncAllocations
} from "../src/domain/vsm.js";
import { buildExportIntentArtifact, buildProjectReport, toCsv } from "../src/infrastructure/exporters.js";
import { renderOverview } from "../src/presentation/steps/overview.js";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

test("project report builder produces a safe artifact without completeness grading", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Sparse / Project";

  const report = buildProjectReport(workspace);
  const reportDocx = assertDocxArtifact(report, "sparse-project-report.docx");

  assert.doesNotMatch(reportDocx.documentXml, /Completeness|Score|Open Items/);
  assert.doesNotMatch(reportDocx.documentXml, />undefined</);
});

test("app-wide export Phase 0 builds a real Step III SCT workbook", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  const task = createSuccessCriticalTask(1);
  task.title = "Manage customer promise";
  task.explanation = "Keep customer-facing commitments coherent across S1 units.";
  task.kpi = "Response time";
  workspace.step3.successCriticalTasks = [task];

  const artifact = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step3",
    tileId: "scts",
    scope: "tile",
    target: {},
    format: "xlsx",
    filename: "SCT export.xlsx"
  });
  const decoded = new TextDecoder().decode(artifact.content);

  assert.equal(artifact.filename, "sct-export.xlsx");
  assert.equal(artifact.mimeType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(artifact.content[0], 0x50);
  assert.equal(artifact.content[1], 0x4b);
  assert.match(decoded, /xl\/worksheets\/sheet1\.xml/);
  assert.match(decoded, /SCT ID/);
  assert.match(decoded, /SCT-001/);
  assert.match(decoded, /Manage customer promise/);
  assert.match(decoded, /Response time/);
});

test("app-wide export builds whole-project report and JSON through the panel intent", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  workspace.organization.name = "EU AI Solutions SE";
  workspace.sif.name = "EU AI Solutions SE";
  const task = createSuccessCriticalTask(1);
  task.title = "Manage customer promise";
  workspace.step3.successCriticalTasks = [task];

  const doc = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "app",
    tileId: null,
    scope: "step",
    target: {},
    format: "docx",
    filename: "ignored-by-existing-builder.docx"
  });
  const archive = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "app",
    tileId: null,
    scope: "step",
    target: {},
    format: "json",
    filename: "ignored-by-existing-builder.json"
  });
  const parsed = JSON.parse(archive.content);

  assertDocxArtifact(doc, "transformation-2026-report.docx", [
    /Transformation 2026/,
    /EU AI Solutions SE/,
    /Success-Critical Tasks/
  ]);
  assert.equal(archive.filename, "transformation-2026.json");
  assert.equal(archive.mimeType, "application/json");
  assert.equal(parsed.project.name, "Transformation 2026");
  assert.equal(parsed.step3.successCriticalTasks[0].title, "Manage customer promise");
});

test("app-wide export builds the Step I operative-units Word package", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  workspace.sif.name = "EU AI Solutions SE";
  workspace.sif.purpose = "Steer the transformation coherently.";
  workspace.step1.segmentationOptions = [
    createSegmentationOption("Product", "Segment by product portfolio.")
  ];
  workspace.step1.selectedSegmentationOptionId = workspace.step1.segmentationOptions[0].id;
  workspace.step1.operativeUnits = [
    createOperativeUnit("AI Products", "Product unit")
  ];

  const artifact = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step1",
    tileId: null,
    scope: "step",
    target: {},
    format: "docx",
    filename: "Step I Operative Units.docx"
  });

  assertDocxArtifact(artifact, "step-i-operative-units.docx", [
    /Step I: Operative Units/,
    /System-in-Focus/,
    /Recursion Levels/,
    /Segmentation Options/,
    /Product/,
    /AI Products/
  ]);

  const legacyDocRequest = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step1",
    tileId: null,
    scope: "step",
    target: {},
    format: "doc",
    filename: "Legacy Step I Request.doc"
  });

  assertDocxArtifact(legacyDocRequest, "legacy-step-i-request.docx", [
    /Step I: Operative Units/
  ]);
});

test("Step I tile exports produce scoped, editable Word records", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  workspace.sif.name = "EU AI Solutions SE";
  workspace.step1.segmentationOptions = [
    createSegmentationOption("Product", "Segment by product portfolio.")
  ];

  const cases = [
    ["step1-sif", /Step I\.1: System-in-Focus/, /EU AI Solutions SE/],
    ["step1-recursion", /Step I\.1: Recursion Levels/, /R0/],
    ["step1-segmentation", /Step I\.2: Segmentation Options/, /Product/],
    ["step1-criteria", /Step I\.3: Key Buying Criteria/, /Relative Position to Competition/],
    ["step1-six-pack", /Step I\.4: Strategic Fields of Action/, /Strategic Fields of Action/],
    ["step1-evaluation", /Step I\.5: Segmentation Evaluation/, /Real Operative Units/]
  ];

  for (const [tileId, heading, content] of cases) {
    const artifact = buildExportIntentArtifact(workspace, {
      evt: "export",
      api: 1,
      stepId: "step1",
      tileId,
      scope: "tile",
      target: {},
      format: "docx"
    });
    assertDocxArtifact(artifact, artifact.filename, [heading, content]);
  }
});

test("Step III supporting tiles produce editable Word records", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  const option = createSegmentationOption("Product", "Segment by product portfolio.");
  workspace.step1.segmentationOptions = [option];
  workspace.step1.selectedSegmentationOptionId = option.id;
  workspace.step2.selectedOptionIds = [workspace.step2.options[0].id];
  workspace.step3.complexityDrivers.environmentOperation = "Different customer promises by product.";

  const hints = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step3",
    tileId: "step3-hints",
    scope: "tile",
    target: {},
    format: "docx"
  });
  const drivers = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step3",
    tileId: "step3-drivers",
    scope: "tile",
    target: {},
    format: "docx"
  });

  assertDocxArtifact(hints, "transformation-2026-step3-sct-input-signals.docx", [
    /Step III\.1: SCT Input Signals/,
    /Manageability Lever Signals/
  ]);
  assertDocxArtifact(drivers, "transformation-2026-step3-complexity-drivers.docx", [
    /Step III\.2: Complexity Drivers/,
    /Different customer promises by product/
  ]);
});

test("app-wide export builds Step II assessment and remedies artifacts", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  workspace.step2.horizontalAssessment.operativeUnitsAmount = "82";
  workspace.step2.verticalAssessment.system3Star = "37";
  workspace.step2.options[0].pros = "Clearer steering routines.";
  workspace.step2.selectedOptionIds = [workspace.step2.options[0].id];

  const assessment = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step2",
    tileId: "step2-assessment",
    scope: "tile",
    target: {},
    format: "xlsx",
    filename: "Step II Assessment.xlsx"
  });
  const remedies = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step2",
    tileId: "step2-remedies",
    scope: "tile",
    target: {},
    format: "docx",
    filename: "Step II Remedies.docx"
  });
  const decodedAssessment = new TextDecoder().decode(assessment.content);

  assert.equal(assessment.filename, "step-ii-assessment.xlsx");
  assert.equal(assessment.content[0], 0x50);
  assert.match(decodedAssessment, /Variety Assessment/);
  assert.match(decodedAssessment, /System 3\*/);
  assert.match(decodedAssessment, /37/);
  assert.match(decodedAssessment, /Horizontal variety pressure/);
  assertDocxArtifact(remedies, "step-ii-remedies.docx", [
    /How to master steering challenges/,
    /Strengthen control functions/,
    /Clearer steering routines/
  ]);
});

test("app-wide export builds a real Step IV contribution matrix workbook", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = "Manage customer promise";
  task.explanation = "Keep customer-facing commitments coherent across S1 units.";
  task.source = "Workshop Decision";
  workspace.step3.successCriticalTasks = [task];
  syncAllocations(workspace);
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  workspace.step4.allocations[task.id].accountableOrganizationId = systemInFocus.id;
  workspace.step4.allocations[task.id].contributions[systemInFocus.id] = "Define common promise guardrails.";

  const artifact = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step4",
    tileId: "contribution-matrix",
    scope: "tile",
    target: {},
    format: "xlsx",
    filename: "Contribution matrix.xlsx",
    options: {
      notes: true,
      provenance: true,
      owners: true,
      gaps: true
    }
  });
  const decoded = new TextDecoder().decode(artifact.content);

  assert.equal(artifact.filename, "contribution-matrix.xlsx");
  assert.equal(artifact.mimeType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(artifact.content[0], 0x50);
  assert.equal(artifact.content[1], 0x4b);
  assert.match(decoded, /SCT Contribution Matrix|Contribution Matrix/);
  assert.match(decoded, /SCT-001/);
  assert.match(decoded, /Manage customer promise/);
  assert.match(decoded, /R0 · System in Focus/);
  assert.match(decoded, /Define common promise guardrails/);
  assert.doesNotMatch(decoded, /No accountable organization/);
});

test("app-wide export builds a real Step V steering-system mapping workbook", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  const mappedTask = createNumberedSuccessCriticalTask(workspace);
  mappedTask.title = "Manage customer promise";
  mappedTask.explanation = "Keep customer-facing commitments coherent across S1 units.";
  mappedTask.source = "Workshop Decision";
  const unmappedTask = createNumberedSuccessCriticalTask(workspace);
  unmappedTask.title = "Coordinate release readiness";
  unmappedTask.source = "Manageability Lever";
  workspace.step3.successCriticalTasks = [mappedTask, unmappedTask];
  syncAllocations(workspace);
  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  workspace.step4.allocations[mappedTask.id].contributions[systemInFocus.id] = "Define common promise guardrails.";
  workspace.step4.allocations[unmappedTask.id].contributions[systemInFocus.id] = "Keep release decisions visible.";
  workspace.step5.assignments["3"] = [getStep5ContributionKey(mappedTask.id, systemInFocus.id)];

  const artifact = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step5",
    tileId: "step5-mapping",
    scope: "step",
    target: {},
    format: "xlsx",
    options: {
      notes: true,
      provenance: true,
      gaps: true
    }
  });
  const decoded = new TextDecoder().decode(artifact.content);

  assert.equal(artifact.filename, "transformation-2026-step5-steering-map.xlsx");
  assert.equal(artifact.mimeType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(artifact.content[0], 0x50);
  assert.equal(artifact.content[1], 0x4b);
  assert.match(decoded, /Steering Map/);
  assert.match(decoded, /VSM System/);
  assert.match(decoded, /SCT-001/);
  assert.match(decoded, /Manage customer promise/);
  assert.match(decoded, /S3/);
  assert.match(decoded, /Define common promise guardrails/);
  assert.match(decoded, /Workshop Decision/);
  assert.match(decoded, /SCT-002/);
  assert.match(decoded, /Unassigned/);
  assert.match(decoded, /<t>Yes<\/t>/);

  const noGapsArtifact = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step5",
    tileId: "step5-mapping",
    scope: "step",
    target: {},
    format: "xlsx",
    filename: "Steering map.xlsx",
    options: {
      notes: true,
      provenance: false,
      gaps: false
    }
  });
  const noGapsDecoded = new TextDecoder().decode(noGapsArtifact.content);

  assert.equal(noGapsArtifact.filename, "steering-map.xlsx");
  assert.doesNotMatch(noGapsDecoded, /<t>Source<\/t>/);
  assert.doesNotMatch(noGapsDecoded, /Coordinate release readiness/);
  assert.doesNotMatch(noGapsDecoded, /Manageability Lever/);
});

test("app-wide export builds overview project frame and implementation backlog artifacts", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  workspace.project.status = "Board-ready workshop capture";
  workspace.organization.name = "EU AI Solutions SE";
  workspace.sif.name = "EU AI Solutions SE";
  workspace.sif.purpose = "Transform the organization without losing steering focus.";
  const item = createImplementationItem();
  item.challenge = "Resolve double accountability";
  item.requirement = "Clarify RASIC and implementation owner.";
  item.responsible = "CEO";
  item.source = { kind: "rasic-double-aa", contributionId: "contrib-1" };
  workspace.implementation.items = [item];

  const projectFrame = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "overview",
    tileId: "overview-project-frame",
    scope: "tile",
    target: {},
    format: "docx",
    filename: "Project Frame.docx"
  });
  const backlog = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "implementation",
    tileId: "implementation-backlog",
    scope: "step",
    target: {},
    format: "xlsx",
    filename: "Transformation Backlog.xlsx"
  });
  const decodedBacklog = new TextDecoder().decode(backlog.content);

  assertDocxArtifact(projectFrame, "project-frame.docx", [
    /Project Frame/,
    /Board-ready workshop capture/,
    /Transform the organization/
  ]);
  assert.equal(backlog.filename, "transformation-backlog.xlsx");
  assert.equal(backlog.mimeType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(backlog.content[0], 0x50);
  assert.match(decodedBacklog, /Implementation Backlog/);
  assert.match(decodedBacklog, /Challenge \/ Action/);
  assert.match(decodedBacklog, /Resolve double accountability/);
  assert.match(decodedBacklog, /rasic-double-aa/);
});

test("app-wide export builds the honest Step VII Word record and rejects flat PDF", () => {
  const workspace = createWorkspace();
  workspace.project.name = "Transformation 2026";
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = "Manage customer promise";
  workspace.step3.successCriticalTasks = [task];
  syncAllocations(workspace);

  const systemInFocus = workspace.step1.recursionLevels.find((organization) => organization.level === "R0");
  workspace.step4.allocations[task.id].contributions[systemInFocus.id] = "Define common promise guardrails.";
  workspace.step4.allocations[task.id].accountableOrganizationId = systemInFocus.id;

  const role = createStep7Vessel("role", "CEO");
  role.state = "accepted";
  role.scope = systemInFocus.id;
  role.purpose = "Own the representation decision.";
  const meeting = createStep7Vessel("meeting", "Weekly Executive Business Review");
  meeting.state = "accepted";
  workspace.step7.vessels = [role, meeting];
  workspace.step7.meetings[meeting.id] = {
    id: meeting.id,
    name: meeting.name,
    cad: "Weekly",
    purpose: "Review R0 steering results."
  };
  workspace.step7.aspects[task.id] = {
    kpis: [{
      id: "metric-1",
      text: "Decision latency",
      target: "< 2 days",
      frequency: "Weekly",
      source: "Steering review",
      owner: role.id
    }]
  };
  const contribution = getStep7EditorContext(workspace).contribs
    .find((candidate) => candidate.sct === task.id && candidate.unit === systemInFocus.id);
  setStep7RasicAssignment(workspace, contribution.id, role.id, "A");

  const doc = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step7",
    tileId: "all",
    scope: "step",
    target: {},
    format: "docx",
    filename: "Step VII Representation.docx"
  });
  const pdf = buildExportIntentArtifact(workspace, {
    evt: "export",
    api: 1,
    stepId: "step7",
    tileId: "all",
    scope: "step",
    target: {},
    format: "pdf",
    filename: "Step VII Representation.pdf"
  });

  assertDocxArtifact(doc, "step-vii-representation.docx", [
    /Organizational Vessels/,
    /CEO/,
    /RASIC Accountability/,
    /Decision latency/,
    /Weekly Executive Business Review/
  ]);
  assert.equal(pdf, null);
});

test("project overview leaves completion judgment to the workshop expert", () => {
  const html = renderOverview(createWorkspace());

  assert.doesNotMatch(html, /Completeness|%/);
  assert.match(html, /Success-critical tasks/);
  assert.match(html, /SCT contribution assignments/);
  assert.match(html, /Representation entities/);
});

test("project overview counts current Step VII role vessels instead of legacy roles", () => {
  const workspace = createWorkspace();
  workspace.step7.roles = [];
  workspace.step7.vessels = [
    createStep7Vessel("role", "CEO"),
    createStep7Vessel("role", "CFO"),
    createStep7Vessel("function", "Sales"),
    createStep7Vessel("meeting", "Weekly Executive Business Review")
  ];

  const html = renderOverview(workspace);

  assert.match(html, /<span>Roles<\/span>\s*<strong>2<\/strong>/);
  assert.doesNotMatch(html, /<span>Roles<\/span>\s*<strong>0<\/strong>/);
});

function assertDocxArtifact(artifact, filename, patterns = []) {
  assert.equal(artifact.filename, filename);
  assert.equal(artifact.mimeType, DOCX_MIME);
  assert.equal(artifact.content[0], 0x50);
  assert.equal(artifact.content[1], 0x4b);

  const entries = readStoredZip(artifact.content);
  assert.ok(entries.has("[Content_Types].xml"));
  assert.ok(entries.has("_rels/.rels"));
  assert.ok(entries.has("word/document.xml"));
  assert.ok(entries.has("word/styles.xml"));

  const documentXml = decode(entries.get("word/document.xml"));
  assert.match(documentXml, /<w:document/);
  assert.match(documentXml, /<w:tbl>/);
  patterns.forEach((pattern) => assert.match(documentXml, pattern));
  return { entries, documentXml };
}

function readStoredZip(bytes) {
  const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const entries = new Map();
  const decoder = new TextDecoder();
  let offset = 0;

  while (offset + 4 <= source.length) {
    const view = new DataView(source.buffer, source.byteOffset + offset, source.byteLength - offset);
    if (view.getUint32(0, true) !== 0x04034b50) {
      break;
    }
    const compressedSize = view.getUint32(18, true);
    const nameLength = view.getUint16(26, true);
    const extraLength = view.getUint16(28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(source.slice(nameStart, nameStart + nameLength));
    entries.set(name, source.slice(dataStart, dataStart + compressedSize));
    offset = dataStart + compressedSize;
  }

  return entries;
}

function decode(bytes) {
  return new TextDecoder().decode(bytes);
}
