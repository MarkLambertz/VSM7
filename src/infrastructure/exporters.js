import {
  evaluateStep2Variety,
  formatSctNumber,
  getManageabilityLeverSignals,
  getRecursionOrganizations,
  getStep6ChannelVarietyContext,
  getStep6FindingCandidates,
  getStep5AssignedSystem,
  getStep5InScopeContributions,
  getStep5MappingDiagnostics,
  getStep7EditorContext,
  getStep7EditorModel,
  getWeakSegmentationSignals
} from "../domain/vsm.js?v=20260729-steering-master-nav-audit";
import { calculateSegmentationEvaluationTotals } from "../domain/segmentationEvaluation.js?v=20260814-step1-weighted-evaluation";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function exportProjectJson(workspace) {
  const artifact = buildProjectJson(workspace);
  downloadBlob(artifact.filename, artifact.content, artifact.mimeType);
}

export function exportProjectReport(workspace) {
  const artifact = buildProjectReport(workspace);
  downloadBlob(artifact.filename, artifact.content, artifact.mimeType);
}

export function buildProjectJson(workspace) {
  const name = safeFileName(workspace.project.name || "vsm-project");
  return {
    filename: `${name}.json`,
    content: JSON.stringify(workspace, null, 2),
    mimeType: "application/json"
  };
}

export function buildProjectReport(workspace) {
  const name = safeFileName(workspace.project.name || "vsm-project");
  const html = documentShell(workspace, `
    <h1>${escapeHtml(workspace.project.name)}</h1>
    <p><strong>Organization:</strong> ${escapeHtml(workspace.organization.name)}</p>
    <p><strong>System-in-Focus:</strong> ${escapeHtml(workspace.sif.name || "Open")}</p>
    ${section("Purpose", paragraph(workspace.sif.purpose))}
    ${section("Customers / Stakeholders", paragraph(workspace.sif.customers))}
    ${section("Selected Segmentation", selectedSegmentation(workspace))}
    ${section("Success-Critical Tasks", taskTable(workspace))}
    ${section("SCT Contributions Across the Recursion Structure", allocationTable(workspace))}
    ${section("SCT-to-VSM-System Map", systemMappingTable(workspace))}
    ${section("E2E Robustness Findings", e2eFindingTable(workspace))}
  `);

  return {
    filename: `${name}-report.docx`,
    content: buildSimpleDocx(html),
    mimeType: DOCX_MIME
  };
}

export function exportExportIntent(workspace, intent) {
  const artifact = buildExportIntentArtifact(workspace, intent);
  if (!artifact) {
    throw new Error("This export is not available yet.");
  }
  downloadBlob(artifact.filename, artifact.content, artifact.mimeType);
  return artifact;
}

export function buildExportIntentArtifact(workspace, intent = {}) {
  if (
    intent.api === 1
    && intent.stepId === "app"
    && intent.tileId == null
    && isWordExportFormat(intent.format)
  ) {
    return buildProjectReport(workspace);
  }

  if (
    intent.api === 1
    && intent.stepId === "app"
    && intent.tileId == null
    && intent.format === "json"
  ) {
    return buildProjectJson(workspace);
  }

  if (
    intent.api === 1
    && intent.stepId === "step1"
    && isWordExportFormat(intent.format)
  ) {
    return buildStep1OperativeUnitsExport(workspace, intent);
  }

  if (
    intent.api === 1
    && intent.stepId === "step2"
    && (isWordExportFormat(intent.format) || intent.format === "xlsx")
  ) {
    return buildStep2Export(workspace, intent);
  }

  if (
    intent.api === 1
    && intent.stepId === "step3"
    && (intent.tileId === "step3-hints" || intent.tileId === "step3-drivers")
    && isWordExportFormat(intent.format)
  ) {
    return buildStep3SupportingExport(workspace, intent);
  }

  if (
    intent.api === 1
    && intent.stepId === "step3"
    && (intent.tileId === "scts" || intent.tileId == null)
    && intent.format === "xlsx"
  ) {
    return buildStep3SctRegisterXlsx(workspace, intent);
  }

  if (
    intent.api === 1
    && intent.stepId === "step4"
    && (intent.tileId === "contribution-matrix" || intent.tileId == null)
    && intent.format === "xlsx"
  ) {
    return buildStep4ContributionMatrixXlsx(workspace, intent);
  }

  if (
    intent.api === 1
    && intent.stepId === "step5"
    && (intent.tileId === "step5-mapping" || intent.tileId == null)
    && intent.format === "xlsx"
  ) {
    return buildStep5SteeringMapXlsx(workspace, intent);
  }

  if (
    intent.api === 1
    && intent.stepId === "overview"
    && intent.tileId === "overview-project-frame"
    && isWordExportFormat(intent.format)
  ) {
    return buildOverviewProjectFrameExport(workspace, intent);
  }

  if (
    intent.api === 1
    && intent.stepId === "step7"
    && (intent.tileId === "all" || intent.tileId == null)
    && isWordExportFormat(intent.format)
  ) {
    return buildStep7RepresentationExport(workspace, intent);
  }

  if (
    intent.api === 1
    && intent.stepId === "implementation"
    && (intent.tileId === "implementation-backlog" || intent.tileId == null)
    && intent.format === "xlsx"
  ) {
    return buildImplementationBacklogXlsx(workspace, intent);
  }

  return null;
}

export function toCsv(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => (Array.isArray(row) ? row : [row]).map(csvCell).join(","))
    .join("\n");
}

export function buildStep3SctRegisterXlsx(workspace, intent = {}) {
  const tasks = step3ExportTasks(workspace, intent);
  const rows = [
    ["SCT ID", "Priority", "Task", "Description", "Source", "KPI / Success Metric", "Required Artifact", "Tool or Methodological Approach"],
    ...tasks.map((task) => [
      formatSctNumber(task.number),
      task.priority || "",
      task.title || "",
      task.explanation || "",
      task.source || "",
      task.kpi || "",
      task.requiredArtifacts || "",
      task.toolOrMethodologicalApproach || ""
    ])
  ];
  const fallbackName = `${safeFileName(`${workspace.project.name || "vsm7"}-step3-scts`)}.xlsx`;

  return {
    filename: normalizeExportFilename(intent.filename, fallbackName, "xlsx"),
    content: buildSimpleXlsx([{ name: "SCT Register", rows }]),
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
}

export function buildStep1OperativeUnitsExport(workspace, intent = {}) {
  const tileId = String(intent.tileId || "all");
  const definitions = {
    "step1-sif": {
      slug: "system-in-focus",
      content: () => step1SifDoc(workspace)
    },
    "step1-recursion": {
      slug: "recursion-levels",
      content: () => step1RecursionDoc(workspace)
    },
    "step1-segmentation": {
      slug: "segmentation-options",
      content: () => step1SegmentationDoc(workspace)
    },
    "step1-criteria": {
      slug: "key-buying-criteria",
      content: () => step1CriteriaDoc(workspace)
    },
    "step1-six-pack": {
      slug: "strategic-fields",
      content: () => step1SixPackDoc(workspace)
    },
    "step1-evaluation": {
      slug: "segmentation-evaluation",
      content: () => step1EvaluationDoc(workspace)
    }
  };
  const definition = definitions[tileId] || {
    slug: "operative-units",
    content: () => step1Doc(workspace)
  };
  const fallbackName = `${safeFileName(`${workspace.project.name || "vsm7"}-step1-${definition.slug}`)}.docx`;

  return {
    filename: normalizeExportFilename(intent.filename, fallbackName, "docx"),
    content: buildSimpleDocx(definition.content()),
    mimeType: DOCX_MIME
  };
}

export function buildStep3SupportingExport(workspace, intent = {}) {
  const isHints = intent.tileId === "step3-hints";
  const slug = isHints ? "sct-input-signals" : "complexity-drivers";
  const fallbackName = `${safeFileName(`${workspace.project.name || "vsm7"}-step3-${slug}`)}.docx`;

  return {
    filename: normalizeExportFilename(intent.filename, fallbackName, "docx"),
    content: buildSimpleDocx(isHints ? step3InputSignalsDoc(workspace) : step3ComplexityDriversDoc(workspace)),
    mimeType: DOCX_MIME
  };
}

export function buildStep2Export(workspace, intent = {}) {
  const format = String(intent.format || "docx").toLowerCase();
  const tileId = intent.tileId || "all";

  if (format === "xlsx") {
    if (tileId === "step2-remedies") {
      return buildStep2RemediesXlsx(workspace, intent);
    }

    return buildStep2AssessmentXlsx(workspace, intent);
  }

  const fallbackName = `${safeFileName(`${workspace.project.name || "vsm7"}-${tileId === "step2-remedies" ? "step2-manageability-levers" : tileId === "step2-assessment" ? "step2-variety-assessment" : "step2-manageability"}`)}.docx`;
  const content = tileId === "step2-remedies"
    ? step2RemediesDoc(workspace)
    : tileId === "step2-assessment"
      ? step2AssessmentDoc(workspace)
      : step2Doc(workspace);

  return {
    filename: normalizeExportFilename(intent.filename, fallbackName, "docx"),
    content: buildSimpleDocx(content),
    mimeType: DOCX_MIME
  };
}

export function buildStep4ContributionMatrixXlsx(workspace, intent = {}) {
  const organizations = getRecursionOrganizations(workspace);
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));
  const options = intent.options || {};
  const includeNotes = options.notes !== false;
  const includeProvenance = options.provenance !== false;
  const includeOwners = options.owners !== false;
  const includeGaps = options.gaps !== false;
  const headers = [
    "SCT ID",
    "Priority",
    "Success-Critical Task",
    ...(includeNotes ? ["Description"] : []),
    ...(includeProvenance ? ["Source"] : []),
    ...(includeOwners ? ["Accountable organization"] : []),
    ...(includeGaps ? ["Open gaps"] : []),
    ...organizations.map((organization) => `${organization.level} · ${organization.name}`)
  ];
  const rows = [
    headers,
    ...(workspace.step3?.successCriticalTasks || []).map((task) => {
      const allocation = workspace.step4?.allocations?.[task.id] || createEmptyExportAllocation();
      const accountableOrganization = organizationById.get(allocation.accountableOrganizationId);
      return [
        formatSctNumber(task.number),
        task.priority || "",
        task.title || "",
        ...(includeNotes ? [task.explanation || ""] : []),
        ...(includeProvenance ? [task.source || ""] : []),
        ...(includeOwners ? [accountableOrganization ? `${accountableOrganization.level} · ${accountableOrganization.name}` : ""] : []),
        ...(includeGaps ? [step4AllocationWarnings(allocation, organizations).join("; ")] : []),
        ...organizations.map((organization) => allocation.contributions?.[organization.id] || "")
      ];
    })
  ];
  const fallbackName = `${safeFileName(`${workspace.project.name || "vsm7"}-step4-contribution-matrix`)}.xlsx`;

  return {
    filename: normalizeExportFilename(intent.filename, fallbackName, "xlsx"),
    content: buildSimpleXlsx([{ name: "Contribution Matrix", rows }]),
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
}

export function buildOverviewProjectFrameExport(workspace, intent = {}) {
  const fallbackName = `${safeFileName(`${workspace.project.name || "vsm7"}-overview-project-frame`)}.docx`;

  return {
    filename: normalizeExportFilename(intent.filename, fallbackName, "docx"),
    content: buildSimpleDocx(overviewProjectFrameDoc(workspace)),
    mimeType: DOCX_MIME
  };
}

export function buildImplementationBacklogXlsx(workspace, intent = {}) {
  const rows = [
    implementationHeaders(),
    ...implementationRows(workspace)
  ];
  const fallbackName = `${safeFileName(`${workspace.project.name || "vsm7"}-implementation-backlog`)}.xlsx`;

  return {
    filename: normalizeExportFilename(intent.filename, fallbackName, "xlsx"),
    content: buildSimpleXlsx([{ name: "Implementation Backlog", rows }]),
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
}

export function buildStep5SteeringMapXlsx(workspace, intent = {}) {
  const options = intent.options || {};
  const includeNotes = options.notes !== false;
  const includeProvenance = options.provenance !== false;
  const includeGaps = options.gaps !== false;
  const headers = [
    "VSM System",
    "SCT ID",
    "Priority",
    "Success-Critical Task",
    "Recursion Level",
    "Organizational Unit",
    "Contribution",
    ...(includeNotes ? ["Description"] : []),
    ...(includeProvenance ? ["Source"] : []),
    ...(includeGaps ? ["Unassigned"] : [])
  ];
  const rows = [
    headers,
    ...step5SteeringMapRows(workspace, { includeNotes, includeProvenance, includeGaps })
  ];
  const fallbackName = `${safeFileName(`${workspace.project.name || "vsm7"}-step5-steering-map`)}.xlsx`;

  return {
    filename: normalizeExportFilename(intent.filename, fallbackName, "xlsx"),
    content: buildSimpleXlsx([{ name: "Steering Map", rows }]),
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
}

export function buildStep7RepresentationExport(workspace, intent = {}) {
  const format = String(intent.format || "docx").toLowerCase();
  const fallbackBase = safeFileName(`${workspace.project.name || "vsm7"}-step7-representation`);

  if (!isWordExportFormat(format)) {
    throw new Error(`Unsupported Step VII representation format: ${format}`);
  }

  return {
    filename: normalizeExportFilename(intent.filename, `${fallbackBase}.docx`, "docx"),
    content: buildSimpleDocx(step7Doc(workspace)),
    mimeType: DOCX_MIME
  };
}

function isWordExportFormat(format) {
  const value = String(format || "").toLowerCase();
  return value === "doc" || value === "docx";
}

function step1Doc(workspace) {
  return documentShell(workspace, `
    <h1>Step I: Operative Units</h1>
    ${section("System-in-Focus", `
      <p><strong>Name:</strong> ${escapeHtml(workspace.sif.name)}</p>
      <p><strong>Purpose:</strong> ${escapeHtml(workspace.sif.purpose)}</p>
      <p><strong>Customers:</strong> ${escapeHtml(workspace.sif.customers)}</p>
    `)}
    ${section("Recursion Levels", simpleTable(["Level", "Name", "Description"], workspace.step1.recursionLevels.map((level) => [level.level, level.name, level.description])))}
    ${section("Segmentation Options", simpleTable(["Option", "Description", "Notes"], workspace.step1.segmentationOptions.map((option) => [option.name, option.description, option.decisionNotes])))}
    ${section("Key Buying Criteria", simpleTable(["Criterion", "Explanation", "Weight", "Relative Position to Competition"], workspace.step1.keyBuyingCriteria.map((criterion) => [criterion.name, criterion.explanation, criterion.weight, criterion.relativePosition])))}
    ${section("Strategic Fields", strategicFieldsTable(workspace))}
    ${section("Segmentation Evaluation", segmentationEvaluationTable(workspace))}
    ${section("Decision Rationale", paragraph(workspace.step1.decisionRationale))}
    ${section("Real Operative Units / S1", simpleTable(["Operative unit", "Scope or kind", "Notes"], (workspace.step1.operativeUnits || []).map((unit) => [unit.name, unit.description, unit.notes])))}
  `);
}

function step1SifDoc(workspace) {
  return documentShell(workspace, `
    <h1>Step I.1: System-in-Focus</h1>
    ${section("System-in-Focus", simpleTable(["Field", "Workshop record"], [
      ["Name", workspace.sif.name],
      ["Purpose", workspace.sif.purpose],
      ["Customers and stakeholders", workspace.sif.customers]
    ]))}
  `);
}

function step1RecursionDoc(workspace) {
  return documentShell(workspace, `
    <h1>Step I.1: Recursion Levels</h1>
    ${section("Recursion Levels", simpleTable(
      ["Level", "Name", "Description"],
      workspace.step1.recursionLevels.map((level) => [level.level, level.name, level.description])
    ))}
  `);
}

function step1SegmentationDoc(workspace) {
  return documentShell(workspace, `
    <h1>Step I.2: Segmentation Options</h1>
    ${section("Segmentation Options", simpleTable(
      ["Option", "Description", "Decision notes"],
      workspace.step1.segmentationOptions.map((option) => [option.name, option.description, option.decisionNotes])
    ))}
  `);
}

function step1CriteriaDoc(workspace) {
  return documentShell(workspace, `
    <h1>Step I.3: Key Buying Criteria</h1>
    ${section("Key Buying Criteria", simpleTable(
      ["Criterion", "Explanation", "Weight", "Relative Position to Competition"],
      workspace.step1.keyBuyingCriteria.map((criterion) => [
        criterion.name,
        criterion.explanation,
        criterion.weight,
        criterion.relativePosition
      ])
    ))}
  `);
}

function step1SixPackDoc(workspace) {
  return documentShell(workspace, `
    <h1>Step I.4: Strategic Fields of Action</h1>
    ${section("Strategic Fields of Action", strategicFieldsTable(workspace))}
  `);
}

function step1EvaluationDoc(workspace) {
  return documentShell(workspace, `
    <h1>Step I.5: Segmentation Evaluation</h1>
    ${section("Selected Segmentation", selectedSegmentation(workspace))}
    ${section("Segmentation Evaluation", segmentationEvaluationTable(workspace))}
    ${section("Decision Rationale", paragraph(workspace.step1.decisionRationale))}
    ${section("Real Operative Units / S1", simpleTable(
      ["Operative unit", "Scope or kind", "Notes"],
      (workspace.step1.operativeUnits || []).map((unit) => [unit.name, unit.description, unit.notes])
    ))}
  `);
}

function step3InputSignalsDoc(workspace) {
  const selectedOption = workspace.step1.segmentationOptions.find((option) => (
    option.id === workspace.step1.selectedSegmentationOptionId
  ));
  const segmentationSignals = selectedOption ? getWeakSegmentationSignals(workspace, selectedOption.id) : [];
  const manageabilitySignals = getManageabilityLeverSignals(workspace);

  return documentShell(workspace, `
    <h1>Step III.1: SCT Input Signals</h1>
    ${section("Selected Segmentation of Operative Units", selectedSegmentation(workspace))}
    ${section("Segmentation Signals", simpleTable(
      ["Group", "Signal", "Score"],
      segmentationSignals.map((signal) => [signal.group, signal.label, signal.score])
    ))}
    ${section("Manageability Lever Signals", simpleTable(
      ["Lever", "Detail", "Context"],
      manageabilitySignals.map((signal) => [signal.title, signal.detail, signal.meta])
    ))}
  `);
}

function step3ComplexityDriversDoc(workspace) {
  const drivers = workspace.step3.complexityDrivers || {};

  return documentShell(workspace, `
    <h1>Step III.2: Complexity Drivers</h1>
    ${section("Complexity Drivers", simpleTable(["Driver", "Workshop record"], [
      ["Environment - Operation", drivers.environmentOperation],
      ["Operation - Management", drivers.operationManagement],
      ["Environmental overlaps", drivers.environmentalOverlaps],
      ["Operational dependencies", drivers.operationalDependencies]
    ]))}
  `);
}

function step2Doc(workspace) {
  const horizontal = workspace.step2.horizontalAssessment;
  const vertical = workspace.step2.verticalAssessment;

  return documentShell(workspace, `
    <h1>Step II: Manageability & Flattening</h1>
    ${section("Selected Segmentation", selectedSegmentation(workspace))}
    ${section("Operative Units / S1", simpleTable(["Operative unit", "Scope or kind", "Notes"], (workspace.step1.operativeUnits || []).map((unit) => [unit.name, unit.description, unit.notes])))}
    ${section("Horizontal Variety", simpleTable(["Dimension", "Assessment"], [
      ["Amount of operative units", horizontal.operativeUnitsAmount],
      ["Dissimilarity", horizontal.dissimilarity],
      ["Self-control capability", horizontal.selfControl],
      ["Notes", horizontal.notes]
    ]))}
    ${section("Vertical Variety", simpleTable(["Dimension", "Assessment"], [
      ["Environmental overlaps", vertical.environmentalOverlaps],
      ["System 3*", vertical.system3Star],
      ["Operational dependencies", vertical.operationalDependencies],
      ["Resource bargain", vertical.resourceBargain],
      ["Corporate intervention", vertical.corporateIntervention],
      ["System 2", vertical.system2],
      ["Notes", vertical.notes]
    ]))}
    ${section("How to master steering challenges", simpleTable(["Selected", "Option", "Time to effect", "Robustness", "Pros", "Cons", "Challenges"], workspace.step2.options.map((option) => [(workspace.step2.selectedOptionIds || []).includes(option.id) ? "Yes" : "", option.name, option.timeToEffect, option.robustness, option.pros, option.cons, option.challenges])))}
  `);
}

function step2AssessmentDoc(workspace) {
  return documentShell(workspace, `
    <h1>Step II: Variety Assessment for Steerability</h1>
    ${section("Selected Segmentation", selectedSegmentation(workspace))}
    ${section("Operative Units / S1", simpleTable(["Operative unit", "Scope or kind", "Notes"], (workspace.step1.operativeUnits || []).map((unit) => [unit.name, unit.description, unit.notes])))}
    ${section("Assessment", simpleTable(step2AssessmentHeaders(true), step2AssessmentRows(workspace, { includeNotes: true })))}
    ${section("SCT Signals", simpleTable(["Signal"], evaluateStep2Variety(workspace).sctSignals.map((signal) => [signal])))}
  `);
}

function step2RemediesDoc(workspace) {
  return documentShell(workspace, `
    <h1>Step II: How to master steering challenges</h1>
    ${section("Manageability Levers", simpleTable(step2RemediesHeaders(), step2RemediesRows(workspace)))}
  `);
}

function overviewProjectFrameDoc(workspace) {
  return documentShell(workspace, `
    <h1>Project Frame</h1>
    ${section("Project", simpleTable(["Field", "Value"], [
      ["Project status", workspace.project.status],
      ["Organization", workspace.organization.name],
      ["Project", workspace.project.name],
      ["System-in-Focus", workspace.sif.name],
      ["Recursion level", workspace.sif.recursionLevel],
      ["Parent level", workspace.sif.parentLevel]
    ]))}
    ${section("System Purpose", paragraph(workspace.sif.purpose))}
    ${section("Customers and Stakeholders", paragraph(workspace.sif.customers))}
  `);
}

function step7Doc(workspace) {
  const model = getStep7EditorModel(workspace);
  const context = getStep7EditorContext(workspace, { scope: "all" });

  return documentShell(workspace, `
    <h1>Step VII: Representation</h1>
    ${section("Organizational Vessels", step7VesselTable(workspace, model))}
    ${section("RASIC Accountability", step7RasicTable(model, context))}
    ${section("Metrics & KPIs, Artifacts & Tools", step7AspectsTable(model, context))}
    ${section("Meetings & Agendas", step7MeetingsTable(model))}
    ${section("Legacy Roles and Entities", roleTable(workspace))}
    ${section("Org Chart Notes", paragraph(workspace.step7.orgChartNotes))}
    ${section("Representation Notes", paragraph(workspace.step7.representationNotes))}
    ${section("SCT Contribution Matrix", allocationTable(workspace))}
  `);
}

function selectedSegmentation(workspace) {
  const selected = workspace.step1.segmentationOptions.find((option) => option.id === workspace.step1.selectedSegmentationOptionId);
  return selected
    ? `<p><strong>${escapeHtml(selected.name)}</strong></p><p>${escapeHtml(selected.description)}</p><p>${escapeHtml(workspace.step1.decisionRationale)}</p>`
    : "<p>No segmentation option selected yet.</p>";
}

function strategicFieldsTable(workspace) {
  return simpleTable(
    ["Variable", "Direction", "Links", "Files"],
    workspace.step1.strategicFields.map((field) => [
      field.variable,
      field.direction,
      (field.links || []).map((link) => `${link.label || "Link"}: ${link.url}`).join("\n"),
      (field.files || []).map((file) => `${file.name || "File"} (${formatBytes(file.size)})`).join("\n")
    ])
  );
}

function formatBytes(value) {
  const size = Number(value || 0);
  if (!size) {
    return "size unknown";
  }

  return `${Math.round(size / 1024)} KB`;
}

function segmentationEvaluationTable(workspace) {
  const options = workspace.step1.segmentationOptions;
  const rows = [
    ...workspace.step1.keyBuyingCriteria.map((criterion, index) => ({
      id: criterion.id,
      group: "Key Buying Criteria",
      label: criterion.name || `Criterion ${index + 1}`,
      weight: criterion.weight ? `${criterion.weight}%` : "",
      relativePosition: criterion.relativePosition || ""
    })),
    ...workspace.step1.strategicFields.map((field) => ({
      id: field.id,
      group: field.variable,
      label: field.direction || "Describe the strategic ambition and targets for this Six Pack variable.",
      weight: "",
      relativePosition: ""
    }))
  ];
  const totals = calculateSegmentationEvaluationTotals(workspace);
  const tableRows = rows.map((row) => {
    const values = options.map((option) => {
      const value = Number(workspace.step1.evaluation?.scores?.[row.id]?.[option.id] || 0);
      return value || "";
    });
    return [
      row.group,
      row.label,
      row.weight,
      row.relativePosition,
      ...values,
      workspace.step1.evaluation?.comments?.[row.id] || ""
    ];
  });

  tableRows.push([
    "Unweighted total",
    "",
    "",
    "",
    ...options.map((option) => totals[option.id]?.unweighted || 0),
    ""
  ]);
  tableRows.push([
    "Weighted total (KBC weights applied)",
    "",
    "",
    "",
    ...options.map((option) => totals[option.id]?.weighted || 0),
    ""
  ]);

  return simpleTable(
    ["Group", "Criterion", "Weight", "Relative Position to Competition", ...options.map((option) => option.name || "Unnamed option"), "Comments"],
    tableRows
  );
}

function taskTable(workspace) {
  return simpleTable(
    ["SCT ID", "Priority", "Task", "Description", "Source", "KPI/Success Metric", "Required Artifact", "Tool or Methodological Approach"],
    workspace.step3.successCriticalTasks.map((task) => [
      formatSctNumber(task.number),
      task.priority,
      task.title,
      task.explanation,
      task.source,
      task.kpi,
      task.requiredArtifacts,
      task.toolOrMethodologicalApproach
    ])
  );
}

function allocationTable(workspace) {
  const organizations = getRecursionOrganizations(workspace);
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));

  return simpleTable(
    [
      "SCT ID",
      "Priority",
      "Success-critical Task",
      "Description",
      "Accountable organization",
      ...organizations.map((organization) => `${organization.level} · ${organization.name}`)
    ],
    workspace.step3.successCriticalTasks.map((task) => {
      const allocation = workspace.step4.allocations[task.id];
      const accountableOrganization = organizationById.get(allocation?.accountableOrganizationId);
      return [
        formatSctNumber(task.number),
        task.priority,
        task.title,
        task.explanation,
        accountableOrganization ? `${accountableOrganization.level} · ${accountableOrganization.name}` : "",
        ...organizations.map((organization) => allocation?.contributions?.[organization.id] || "")
      ];
    })
  );
}

function systemMappingTable(workspace) {
  const contributionsByKey = new Map(getStep5InScopeContributions(workspace).map((contribution) => [contribution.key, contribution]));
  const diagnostics = getStep5MappingDiagnostics(workspace);
  const rows = diagnostics.distribution.flatMap(({ systemId }) => (
    (workspace.step5.assignments?.[systemId] || [])
      .map((key) => ({ systemId, contribution: contributionsByKey.get(key) }))
      .filter((item) => item.contribution)
      .map(({ contribution }) => [
        `S${systemId}`,
        contribution.sctNumber,
        contribution.priority,
        contribution.title,
        contribution.level,
        contribution.organizationName,
        contribution.contribution,
        contribution.source
      ])
  ));

  return simpleTable(
    ["VSM System", "SCT ID", "Priority", "Task", "Recursion Level", "Organizational Unit", "Contribution", "Source"],
    rows
  );
}

function channelTable(workspace) {
  const model = getStep6ChannelVarietyContext(workspace).model;
  return simpleTable(
    ["VSM System", "Canonical Loop", "Communication & Meetings", "Artifact", "Role", "Capacity", "Clarity", "Synchronicity", "Feedback", "Observation"],
    model.loops.map((loop) => [
      loop.sys,
      loop.label,
      loop.communication,
      loop.artifact,
      loop.role,
      ...loop.ratings.map(formatChannelVarietyRating),
      loop.note
    ])
  );
}

function formatChannelVarietyRating(value) {
  return ({ 0: "Unrated", 1: "Weak", 2: "Caution", 3: "Pass" })[Number(value)] || "Unrated";
}

function e2eFindingTable(workspace) {
  return simpleTable(
    ["Route ID", "Route", "SCT ID", "SCT", "Finding ID", "Category", "Severity", "Affected Element", "Observation"],
    getStep6FindingCandidates(workspace).map((candidate) => [
      candidate.routeId,
      candidate.routeName,
      candidate.sctNumber,
      candidate.sctTitle,
      candidate.finding.id,
      candidate.finding.category,
      candidate.finding.severity,
      candidate.affectedElement,
      candidate.finding.note
    ])
  );
}

function roleTable(workspace) {
  return simpleTable(
    ["Name", "Type", "Purpose", "Reports To", "Decision Authority", "Linked SCTs"],
    workspace.step7.roles.map((role) => [
      role.name,
      role.type,
      role.purpose,
      role.reportsTo,
      role.decisionAuthority,
      linkedTaskTitles(workspace, role.linkedTaskIds)
    ])
  );
}

function step7VesselTable(workspace, model) {
  const vessels = Array.isArray(model.vessels) ? model.vessels : [];
  const legacyRows = vessels.length ? [] : (workspace.step7?.roles || []).map((role) => ({
    name: role.name,
    type: role.type,
    scope: "",
    purpose: role.purpose,
    state: "accepted",
    sys: "",
    alg: false
  }));

  return simpleTable(
    ["Name", "Type", "Scope", "VSM System", "Purpose", "State", "Algedonic"],
    [...vessels, ...legacyRows].map((vessel) => [
      vessel.name,
      vessel.type,
      vessel.scope,
      vessel.sys,
      vessel.purpose,
      vessel.state,
      vessel.alg ? "Yes" : ""
    ])
  );
}

function step7RasicTable(model, context) {
  const contributionById = new Map((context.contribs || []).map((contribution) => [String(contribution.id), contribution]));
  const vesselById = new Map((model.vessels || []).map((vessel) => [String(vessel.id), vessel]));
  const rows = Object.entries(model.rasic || {})
    .map(([key, value]) => {
      const parsed = parseStep7ExportRasicKey(key);
      if (!parsed) {
        return null;
      }

      const contribution = contributionById.get(parsed.contributionId);
      const vessel = vesselById.get(parsed.vesselId);
      return [
        value,
        formatStep7ContributionLabel(contribution, parsed.contributionId),
        vessel?.name || parsed.vesselId,
        vessel?.type || ""
      ];
    })
    .filter(Boolean)
    .sort((left, right) => left[1].localeCompare(right[1]) || left[2].localeCompare(right[2]));

  return simpleTable(["RASIC", "SCT contribution", "Vessel", "Vessel type"], rows);
}

function step7AspectsTable(model, context) {
  const sctById = new Map((context.scts || []).map((sct) => [String(sct.id), sct]));
  const rows = Object.entries(model.aspects || {}).flatMap(([sctId, aspects]) => (
    ["kpis", "artifacts", "tools"].flatMap((kind) => (
      step7AspectItems(aspects?.[kind]).map((item) => [
        formatStep7SctLabel(sctById.get(String(sctId)), sctId),
        formatStep7AspectKind(kind),
        item.text,
        item.target || "",
        item.frequency || "",
        item.source || "",
        item.owner || ""
      ])
    ))
  ));

  return simpleTable(["SCT", "Kind", "Item", "Target", "Frequency", "Source / Description", "Owner ID"], rows);
}

function step7MeetingsTable(model) {
  const rows = Object.values(model.meetings || {}).map((meeting) => [
    meeting.name,
    meeting.scope,
    meeting.sys,
    meeting.cad || meeting.cadence,
    meeting.purpose,
    countStep7Collection(meeting.contribs || meeting.steering),
    countStep7Collection(meeting.participations || meeting.participants),
    countStep7Collection(meeting.metricUses || meeting.measures)
  ]);

  return simpleTable(
    ["Meeting", "Scope", "VSM System", "Cadence", "Purpose", "SCT contributions", "Participants", "Metrics & KPIs"],
    rows
  );
}

function implementationHeaders() {
  return ["Challenge / Action", "Dependency / Requirement", "Responsible", "Due Date", "Status", "Source Kind", "Route ID", "Finding ID", "Loop ID", "Criterion Index", "Source Status"];
}

function implementationRows(workspace) {
  return workspace.implementation.items.map((item) => [
    item.challenge,
    item.requirement,
    item.responsible,
    item.dueDate,
    item.status,
    item.source?.kind || "",
    item.source?.routeId || "",
    item.source?.findingId || "",
    item.source?.loopId || "",
    item.source?.criterionIndex ?? "",
    item.sourceStatus || ""
  ]);
}

function parseStep7ExportRasicKey(key) {
  const parts = String(key || "").split("|");
  if (parts.length < 3) {
    return null;
  }

  const vesselId = parts.pop();
  const contributionId = parts.join("|");
  return contributionId && vesselId ? { contributionId, vesselId } : null;
}

function formatStep7ContributionLabel(contribution, fallback) {
  if (!contribution) {
    return fallback;
  }

  return [
    contribution.sctNumber || contribution.displayId || contribution.sct || "",
    contribution.title || contribution.name || "",
    contribution.organizationName || contribution.unitName || contribution.level || "",
    contribution.text || contribution.contribution || ""
  ].filter(Boolean).join(" · ");
}

function formatStep7SctLabel(sct, fallback) {
  if (!sct) {
    return fallback;
  }

  return [sct.displayId || sct.sctNumber || "", sct.title || sct.name || ""].filter(Boolean).join(" · ");
}

function formatStep7AspectKind(kind) {
  return ({
    kpis: "Metrics & KPIs",
    artifacts: "Artifacts & result types",
    tools: "Tools & methods"
  })[kind] || kind;
}

function step7AspectItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      if (item && typeof item === "object") {
        return {
          text: String(item.text || ""),
          owner: String(item.owner || ""),
          target: String(item.target || ""),
          frequency: String(item.frequency || ""),
          source: String(item.source || "")
        };
      }

      return {
        text: String(item || ""),
        owner: "",
        target: "",
        frequency: "",
        source: ""
      };
    })
    .filter((item) => item.text);
}

function countStep7Collection(value) {
  if (Array.isArray(value)) {
    return String(value.length);
  }

  if (value && typeof value === "object") {
    return String(Object.keys(value).length);
  }

  return value ? "1" : "0";
}

function step3ExportTasks(workspace, intent) {
  const tasks = workspace.step3.successCriticalTasks || [];
  if (intent.scope !== "selection" || !Array.isArray(intent.target?.selection)) {
    return tasks;
  }

  const selectedIds = new Set(intent.target.selection
    .filter((item) => item?.kind === "sct")
    .map((item) => String(item.id || "")));
  return selectedIds.size
    ? tasks.filter((task) => selectedIds.has(String(task.id)))
    : [];
}

function buildStep2AssessmentXlsx(workspace, intent = {}) {
  const options = intent.options || {};
  const includeNotes = options.notes !== false;
  const rows = [
    step2AssessmentHeaders(includeNotes),
    ...step2AssessmentRows(workspace, { includeNotes })
  ];
  const fallbackName = `${safeFileName(`${workspace.project.name || "vsm7"}-step2-variety-assessment`)}.xlsx`;

  return {
    filename: normalizeExportFilename(intent.filename, fallbackName, "xlsx"),
    content: buildSimpleXlsx([{ name: "Variety Assessment", rows }]),
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
}

function buildStep2RemediesXlsx(workspace, intent = {}) {
  const rows = [
    step2RemediesHeaders(),
    ...step2RemediesRows(workspace)
  ];
  const fallbackName = `${safeFileName(`${workspace.project.name || "vsm7"}-step2-manageability-levers`)}.xlsx`;

  return {
    filename: normalizeExportFilename(intent.filename, fallbackName, "xlsx"),
    content: buildSimpleXlsx([{ name: "Manageability Levers", rows }]),
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
}

function step2AssessmentHeaders(includeNotes) {
  return [
    "Area",
    "Dimension",
    "Value",
    ...(includeNotes ? ["Notes"] : [])
  ];
}

function step2AssessmentRows(workspace, { includeNotes = true } = {}) {
  const horizontal = workspace.step2.horizontalAssessment;
  const vertical = workspace.step2.verticalAssessment;
  const diagnostics = evaluateStep2Variety(workspace);
  return [
    ["Horizontal Variety", "Amount of operative units", horizontal.operativeUnitsAmount, ...(includeNotes ? [horizontal.notes] : [])],
    ["Horizontal Variety", "Dissimilarity", horizontal.dissimilarity, ...(includeNotes ? [horizontal.notes] : [])],
    ["Horizontal Variety", "Self-control capability", horizontal.selfControl, ...(includeNotes ? [horizontal.notes] : [])],
    ["Vertical Variety", "Environmental overlaps", vertical.environmentalOverlaps, ...(includeNotes ? [vertical.notes] : [])],
    ["Vertical Variety", "System 3*", vertical.system3Star, ...(includeNotes ? [vertical.notes] : [])],
    ["Vertical Variety", "Operational dependencies", vertical.operationalDependencies, ...(includeNotes ? [vertical.notes] : [])],
    ["Vertical Variety", "Resource bargain and accountability", vertical.resourceBargain, ...(includeNotes ? [vertical.notes] : [])],
    ["Vertical Variety", "Corporate intervention", vertical.corporateIntervention, ...(includeNotes ? [vertical.notes] : [])],
    ["Vertical Variety", "System 2", vertical.system2, ...(includeNotes ? [vertical.notes] : [])],
    ["Diagnostic", "Horizontal variety pressure", diagnostics.horizontalPressure, ...(includeNotes ? [""] : [])],
    ["Diagnostic", "Vertical demand", diagnostics.verticalDemand, ...(includeNotes ? [""] : [])],
    ["Diagnostic", "Vertical capacity", diagnostics.verticalCapacity, ...(includeNotes ? [""] : [])],
    ["Diagnostic", "Fit gap", diagnostics.fitGap, ...(includeNotes ? [""] : [])]
  ];
}

function step2RemediesHeaders() {
  return ["Selected", "Option", "Time to effect", "Robustness", "Pros", "Cons", "Challenges"];
}

function step2RemediesRows(workspace) {
  const selectedOptionIds = new Set(workspace.step2.selectedOptionIds || []);
  return workspace.step2.options.map((option) => [
    selectedOptionIds.has(option.id) ? "Yes" : "",
    option.name,
    option.timeToEffect,
    option.robustness,
    option.pros,
    option.cons,
    option.challenges
  ]);
}

function createEmptyExportAllocation() {
  return {
    accountableOrganizationId: "",
    contributions: {}
  };
}

function step4AllocationWarnings(allocation, organizations) {
  const warnings = [];
  if (!allocation.accountableOrganizationId) {
    warnings.push("No accountable organization");
  }
  const filledContributions = organizations.filter((organization) => (
    String(allocation.contributions?.[organization.id] || "").trim()
  ));
  if (filledContributions.length === 0) {
    warnings.push("No contribution text");
  }
  if (
    allocation.accountableOrganizationId
    && !organizations.some((organization) => organization.id === allocation.accountableOrganizationId)
  ) {
    warnings.push("Accountable organization no longer exists");
  }
  return warnings;
}

function step5SteeringMapRows(workspace, {
  includeNotes = true,
  includeProvenance = true,
  includeGaps = true
} = {}) {
  return getStep5InScopeContributions(workspace)
    .map((contribution) => {
      const assignedSystem = getStep5AssignedSystem(workspace, contribution.key);
      if (!assignedSystem && !includeGaps) {
        return null;
      }

      return [
        assignedSystem ? `S${assignedSystem}` : "Unassigned",
        contribution.sctNumber,
        contribution.priority || "",
        contribution.title || "",
        contribution.level || "",
        contribution.organizationName || "",
        contribution.contribution || "",
        ...(includeNotes ? [contribution.description || ""] : []),
        ...(includeProvenance ? [contribution.source || ""] : []),
        ...(includeGaps ? [assignedSystem ? "" : "Yes"] : [])
      ];
    })
    .filter(Boolean);
}

function linkedTaskTitles(workspace, ids) {
  const titles = ids
    .map((id) => workspace.step3.successCriticalTasks.find((task) => task.id === id)?.title)
    .filter(Boolean);

  return titles.join("; ");
}

function section(title, body) {
  return `<h2>${escapeHtml(title)}</h2>${body || "<p></p>"}`;
}

function paragraph(value) {
  return `<p>${escapeHtml(value || "")}</p>`;
}

function simpleTable(headers, rows) {
  const body = rows.length > 0
    ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${headers.length}">No entries yet.</td></tr>`;

  return `
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function documentShell(workspace, body) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(workspace.project.name)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2933; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          h2 { font-size: 16px; margin-top: 22px; }
          p { font-size: 11px; line-height: 1.4; }
          table { border-collapse: collapse; width: 100%; margin-top: 8px; }
          th, td { border: 1px solid #a7b0ba; padding: 6px; font-size: 10px; vertical-align: top; }
          th { background: #e8eef2; text-align: left; }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `;
}

function buildSimpleDocx(html) {
  return buildZip([
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    },
    {
      path: "word/document.xml",
      content: wordDocumentXml(htmlToWordBlocks(html))
    },
    {
      path: "word/styles.xml",
      content: wordStylesXml()
    }
  ]);
}

function wordDocumentXml(blocks) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${blocks.length ? blocks.join("\n") : wordParagraph("VSM7 Export")}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="850" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function wordStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="120"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="160" w:after="140"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="180" w:after="100"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
  </w:style>
</w:styles>`;
}

function htmlToWordBlocks(html) {
  const body = extractHtmlBody(html);
  const blocks = [];
  const pattern = /<h1\b[^>]*>([\s\S]*?)<\/h1>|<h2\b[^>]*>([\s\S]*?)<\/h2>|<p\b[^>]*>([\s\S]*?)<\/p>|<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let match;

  while ((match = pattern.exec(body))) {
    if (match[1] !== undefined) {
      blocks.push(wordParagraph(htmlToDocxText(match[1]), "Heading1"));
      continue;
    }

    if (match[2] !== undefined) {
      blocks.push(wordParagraph(htmlToDocxText(match[2]), "Heading2"));
      continue;
    }

    if (match[3] !== undefined) {
      blocks.push(wordParagraph(htmlToDocxText(match[3])));
      continue;
    }

    if (match[4] !== undefined) {
      blocks.push(wordTable(htmlTableRows(match[4])));
    }
  }

  return blocks.filter(Boolean);
}

function extractHtmlBody(html) {
  const match = String(html || "").match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : String(html || "");
}

function htmlTableRows(tableHtml) {
  return [...String(tableHtml || "").matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((rowMatch) => (
      [...rowMatch[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)]
        .map((cellMatch) => htmlToDocxText(cellMatch[1]))
    ))
    .filter((row) => row.length > 0);
}

function wordParagraph(text, style = "") {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${escapeXml(style)}"/></w:pPr>` : "";
  const safeText = String(text || "");
  if (!safeText) {
    return `<w:p>${styleXml}</w:p>`;
  }

  return `<w:p>${styleXml}${wordRuns(safeText)}</w:p>`;
}

function wordRuns(text) {
  return String(text || "").split(/\n/).map((line, index) => (
    `${index ? "<w:r><w:br/></w:r>" : ""}<w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>`
  )).join("");
}

function wordTable(rows) {
  const safeRows = Array.isArray(rows) && rows.length ? rows : [["No entries yet."]];
  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="0" w:type="auto"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="A7B0BA"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="A7B0BA"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="A7B0BA"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="A7B0BA"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="A7B0BA"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="A7B0BA"/>
      </w:tblBorders>
    </w:tblPr>
    ${safeRows.map((row) => `<w:tr>${row.map(wordTableCell).join("")}</w:tr>`).join("\n")}
  </w:tbl>`;
}

function wordTableCell(value) {
  return `<w:tc>
    <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
    ${wordParagraph(value)}
  </w:tc>`;
}

function htmlToDocxText(value) {
  return decodeHtmlEntities(String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n"));
}

function decodeHtmlEntities(value) {
  const entities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " "
  };

  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match);
}

function buildSimpleXlsx(sheets) {
  const safeSheets = (Array.isArray(sheets) && sheets.length ? sheets : [{ name: "Sheet1", rows: [] }])
    .slice(0, 1)
    .map((sheet) => ({
      name: safeSheetName(sheet.name || "Sheet1"),
      rows: Array.isArray(sheet.rows) ? sheet.rows : []
    }));
  const sheet = safeSheets[0];

  return buildZip([
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
    },
    {
      path: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheet.name)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
    },
    {
      path: "xl/worksheets/sheet1.xml",
      content: worksheetXml(sheet.rows)
    }
  ]);
}

function worksheetXml(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${safeRows.map((row, rowIndex) => `
      <row r="${rowIndex + 1}">
        ${(Array.isArray(row) ? row : [row]).map((cell, cellIndex) => `
          <c r="${cellReference(rowIndex, cellIndex)}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>
        `).join("")}
      </row>
    `).join("")}
  </sheetData>
</worksheet>`;
}

function cellReference(rowIndex, cellIndex) {
  return `${columnName(cellIndex)}${rowIndex + 1}`;
}

function columnName(index) {
  let value = Number(index) + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function buildZip(entries) {
  const encoder = new TextEncoder();
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;

  entries.forEach((entry) => {
    const pathBytes = encoder.encode(entry.path);
    const data = entry.content instanceof Uint8Array ? entry.content : encoder.encode(String(entry.content ?? ""));
    const crc = crc32(data);
    const localHeader = new Uint8Array(30);
    const local = new DataView(localHeader.buffer);
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, 0, true);
    local.setUint16(12, 0, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, pathBytes.length, true);
    local.setUint16(28, 0, true);

    chunks.push(localHeader, pathBytes, data);

    const centralHeader = new Uint8Array(46);
    const central = new DataView(centralHeader.buffer);
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, 0, true);
    central.setUint16(14, 0, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, pathBytes.length, true);
    central.setUint16(30, 0, true);
    central.setUint16(32, 0, true);
    central.setUint16(34, 0, true);
    central.setUint16(36, 0, true);
    central.setUint32(38, 0, true);
    central.setUint32(42, offset, true);
    centralDirectory.push(centralHeader, pathBytes);

    offset += localHeader.length + pathBytes.length + data.length;
  });

  const centralSize = centralDirectory.reduce((total, chunk) => total + chunk.length, 0);
  const endHeader = new Uint8Array(22);
  const end = new DataView(endHeader.buffer);
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(4, 0, true);
  end.setUint16(6, 0, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  end.setUint16(20, 0, true);

  return concatUint8Arrays([...chunks, ...centralDirectory, endHeader]);
}

function concatUint8Arrays(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function safeSheetName(value) {
  const name = String(value || "Sheet1").replace(/[\[\]:*?/\\]/g, " ").trim() || "Sheet1";
  return name.slice(0, 31);
}

function normalizeExportFilename(filename, fallback, extension) {
  const raw = String(filename || fallback || `vsm7-export.${extension}`).trim();
  const withoutExtension = raw.replace(/\.[A-Za-z0-9]+$/, "");
  const safeBase = safeFileName(withoutExtension) || "vsm7-export";
  return `${safeBase}.${extension}`;
}

function downloadBlob(filename, content, mimeType) {
  const isBinary = content instanceof Uint8Array || content instanceof ArrayBuffer;
  const blob = new Blob([content], { type: isBinary ? mimeType : `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function safeFileName(value) {
  return String(value || "vsm-project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
