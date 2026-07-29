import {
  evaluateStep2Variety,
  formatSctNumber,
  getManageabilityLeverSignals,
  getRecursionOrganizations,
  getStep5MappingDiagnostics,
  getStep6ChannelVarietyContext,
  getWeakSegmentationSignals
} from "../domain/vsm.js?v=20260729-brand-home-link";

const step1TileTitles = {
  "step1-sif": "System-in-Focus",
  "step1-recursion": "Recursion Levels",
  "step1-segmentation": "Segmentation Options",
  "step1-criteria": "Key Buying Criteria",
  "step1-six-pack": "Strategic Fields of Action",
  "step1-evaluation": "Segmentation Evaluation"
};

const step3TileTitles = {
  "step3-hints": "SCT Input Signals",
  "step3-drivers": "Complexity Drivers",
  scts: "Success-Critical Task Register"
};

export function getExportViewModel(workspace, appState = {}, target = {}) {
  const stepId = String(target.stepId || "");
  const tileId = target.tileId == null ? null : String(target.tileId);

  if (stepId === "app" && tileId === null) {
    return getAppExportViewModel(workspace, appState);
  }

  if (stepId === "step1" && (tileId === null || tileId === "all")) {
    return getStep1ExportViewModel(workspace, appState);
  }

  if (stepId === "step1" && step1TileTitles[tileId]) {
    return getStep1TileExportViewModel(workspace, appState, tileId);
  }

  if (stepId === "step2" && tileId === null) {
    return getStep2ExportViewModel(workspace, appState);
  }

  if (stepId === "step2" && tileId === "step2-assessment") {
    return getStep2AssessmentExportViewModel(workspace, appState);
  }

  if (stepId === "step2" && tileId === "step2-remedies") {
    return getStep2RemediesExportViewModel(workspace, appState);
  }

  if (stepId === "step3" && (tileId === "scts" || tileId === null)) {
    return getStep3SctsExportViewModel(workspace, appState);
  }

  if (stepId === "step3" && (tileId === "step3-hints" || tileId === "step3-drivers")) {
    return getStep3SupportingExportViewModel(workspace, appState, tileId);
  }

  if (stepId === "step4" && (tileId === "contribution-matrix" || tileId === null)) {
    return getStep4ContributionMatrixExportViewModel(workspace, appState);
  }

  if (stepId === "step5" && (tileId === "step5-mapping" || tileId === null)) {
    return getStep5SteeringMapExportViewModel(workspace, appState);
  }

  if (stepId === "step6" && tileId === "step6-e2e") {
    return getStep6E2EExportViewModel(workspace, appState);
  }

  if (stepId === "step6" && tileId === "step6-channels") {
    return getStep6ChannelsExportViewModel(workspace, appState);
  }

  if (stepId === "overview" && tileId === "overview-project-frame") {
    return getOverviewProjectFrameExportViewModel(workspace, appState);
  }

  if (stepId === "step7" && (tileId === "all" || tileId === null)) {
    return getStep7RepresentationExportViewModel(workspace, appState);
  }

  if (stepId === "implementation" && (tileId === "implementation-backlog" || tileId === null)) {
    return getImplementationBacklogExportViewModel(workspace, appState);
  }

  return null;
}

function getAppExportViewModel(workspace, appState) {
  const taskCount = workspace.step3?.successCriticalTasks?.length || 0;
  const implementationCount = workspace.implementation?.items?.length || 0;

  return {
    stepId: "app",
    tileId: null,
    title: "VSM7 Project Export",
    kind: "project",
    count: 1,
    unitNoun: "project",
    monolithic: true,
    defaultPreset: "appendix",
    availableFormats: ["docx", "json"],
    availableScopes: [
      { kind: "step", label: "Whole project" }
    ],
    availableIncludes: [],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: null, title: "Whole project" }
    ],
    body: `${taskCount} SCTs · ${implementationCount} implementation items`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep1ExportViewModel(workspace, appState) {
  const optionCount = workspace.step1?.segmentationOptions?.length || 0;
  const criteriaCount = workspace.step1?.keyBuyingCriteria?.length || 0;
  const fieldCount = workspace.step1?.strategicFields?.length || 0;

  return {
    stepId: "step1",
    tileId: null,
    title: "Step I · Operative Units",
    kind: "substeps",
    count: 5,
    unitNoun: "substeps",
    monolithic: true,
    defaultPreset: "doc",
    availableFormats: ["docx"],
    availableScopes: [
      { kind: "step", label: "Whole Step I", count: 5 }
    ],
    availableIncludes: ["notes", "provenance"],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: null, title: "All Step I substeps" }
    ],
    substeps: [
      { id: "sif", title: "System-in-Focus and Recursion Levels" },
      { id: "segmentation", title: "Segmentation Options" },
      { id: "criteria", title: "Key Buying Criteria" },
      { id: "six-pack", title: "Strategic Fields of Action" },
      { id: "evaluation", title: "Evaluation" }
    ],
    body: `${workspace.step1?.recursionLevels?.length || 0} recursion entries · ${optionCount} segmentation options · ${criteriaCount} buying criteria · ${fieldCount} strategic fields`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep1TileExportViewModel(workspace, appState, tileId) {
  const counts = {
    "step1-sif": 1,
    "step1-recursion": workspace.step1?.recursionLevels?.length || 0,
    "step1-segmentation": workspace.step1?.segmentationOptions?.length || 0,
    "step1-criteria": workspace.step1?.keyBuyingCriteria?.length || 0,
    "step1-six-pack": workspace.step1?.strategicFields?.length || 0,
    "step1-evaluation": (workspace.step1?.segmentationOptions?.length || 0)
      * ((workspace.step1?.keyBuyingCriteria?.length || 0) + (workspace.step1?.strategicFields?.length || 0))
  };
  const unitNouns = {
    "step1-sif": "System-in-Focus",
    "step1-recursion": "recursion entries",
    "step1-segmentation": "segmentation options",
    "step1-criteria": "buying criteria",
    "step1-six-pack": "strategic fields",
    "step1-evaluation": "evaluation cells"
  };
  const count = counts[tileId];

  return {
    stepId: "step1",
    tileId,
    title: step1TileTitles[tileId],
    kind: tileId === "step1-evaluation" ? "matrix" : tileId === "step1-sif" ? "form" : "list",
    count,
    unitNoun: unitNouns[tileId],
    monolithic: true,
    defaultPreset: "doc",
    availableFormats: ["docx"],
    availableScopes: [
      { kind: "tile", label: `This ${step1TileTitles[tileId].toLowerCase()}`, count }
    ],
    availableIncludes: [],
    selectable: false,
    selection: [],
    siblings: Object.entries(step1TileTitles).map(([siblingTileId, title]) => ({ tileId: siblingTileId, title })),
    body: `${count} ${unitNouns[tileId]}`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep2ExportViewModel(workspace, appState) {
  const selectedCount = (workspace.step2?.selectedOptionIds || []).length;

  return {
    stepId: "step2",
    tileId: null,
    title: "Step II · Manageability",
    kind: "substeps",
    count: 2,
    unitNoun: "substeps",
    monolithic: true,
    defaultPreset: "doc",
    availableFormats: ["docx"],
    availableScopes: [
      { kind: "step", label: "Whole Step II", count: 2 }
    ],
    availableIncludes: ["notes", "warnings"],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: "step2-assessment", title: "Variety Assessment for Steerability" },
      { tileId: "step2-remedies", title: "How to master steering challenges" }
    ],
    substeps: [
      { id: "assessment", title: "Variety Assessment for Steerability" },
      { id: "challenges", title: "How to master steering challenges" }
    ],
    body: `${workspace.step1?.operativeUnits?.length || 0} operative units · ${workspace.step2?.options?.length || 0} steering levers · ${selectedCount} selected`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep2AssessmentExportViewModel(workspace, appState) {
  const diagnostics = evaluateStep2Variety(workspace);

  return {
    stepId: "step2",
    tileId: "step2-assessment",
    title: "Variety Assessment for Steerability",
    kind: "matrix",
    count: 9,
    unitNoun: "dimensions",
    monolithic: true,
    defaultPreset: "doc",
    availableFormats: ["docx", "xlsx"],
    availableScopes: [
      { kind: "tile", label: "This assessment", count: 9 }
    ],
    availableIncludes: ["notes", "warnings"],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: "step2-assessment", title: "Variety Assessment for Steerability" },
      { tileId: "step2-remedies", title: "How to master steering challenges" }
    ],
    body: `Horizontal pressure ${diagnostics.horizontalPressure} · vertical demand ${diagnostics.verticalDemand} · vertical capacity ${diagnostics.verticalCapacity}`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep2RemediesExportViewModel(workspace, appState) {
  const options = workspace.step2?.options || [];
  const selectedIds = new Set(workspace.step2?.selectedOptionIds || []);

  return {
    stepId: "step2",
    tileId: "step2-remedies",
    title: "How to master steering challenges",
    kind: "list",
    count: options.length,
    unitNoun: "levers",
    monolithic: true,
    defaultPreset: "data",
    availableFormats: ["docx", "xlsx"],
    availableScopes: [
      { kind: "tile", label: "This lever list", count: options.length }
    ],
    availableIncludes: [],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: "step2-assessment", title: "Variety Assessment for Steerability" },
      { tileId: "step2-remedies", title: "How to master steering challenges" }
    ],
    body: `${options.length} steering levers · ${options.filter((option) => selectedIds.has(option.id)).length} selected`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep3SctsExportViewModel(workspace, appState) {
  const tasks = workspace.step3?.successCriticalTasks || [];
  const selectedIds = new Set((appState.selectedSctIds || []).map(String));
  const selection = tasks
    .filter((task) => selectedIds.has(String(task.id)))
    .map((task) => ({
      kind: "sct",
      id: task.id,
      label: `${formatSctNumber(task.number)} · ${task.title || "Untitled SCT"}`
    }));

  return {
    stepId: "step3",
    tileId: "scts",
    title: "Success-Critical Task Register",
    kind: "list",
    count: tasks.length,
    unitNoun: "SCTs",
    monolithic: false,
    defaultPreset: "data",
    availableFormats: ["xlsx"],
    availableScopes: [
      { kind: "tile", label: "This tile", count: tasks.length },
      { kind: "selection", label: "Selected SCTs", count: selection.length },
      { kind: "step", label: "Whole Step III", count: tasks.length }
    ],
    availableIncludes: ["notes", "provenance"],
    selectable: true,
    selection,
    siblings: [
      { tileId: "scts", title: "Success-Critical Task Register" }
    ],
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep3SupportingExportViewModel(workspace, appState, tileId) {
  const selectedOption = workspace.step1?.segmentationOptions?.find((option) => (
    option.id === workspace.step1?.selectedSegmentationOptionId
  ));
  const segmentationSignals = selectedOption ? getWeakSegmentationSignals(workspace, selectedOption.id) : [];
  const leverSignals = getManageabilityLeverSignals(workspace);
  const isHints = tileId === "step3-hints";
  const count = isHints ? segmentationSignals.length + leverSignals.length : 4;
  const unitNoun = isHints ? "input signals" : "complexity drivers";

  return {
    stepId: "step3",
    tileId,
    title: step3TileTitles[tileId],
    kind: isHints ? "list" : "form",
    count,
    unitNoun,
    monolithic: true,
    defaultPreset: "doc",
    availableFormats: ["docx"],
    availableScopes: [
      { kind: "tile", label: `This ${step3TileTitles[tileId].toLowerCase()}`, count }
    ],
    availableIncludes: [],
    selectable: false,
    selection: [],
    siblings: Object.entries(step3TileTitles).map(([siblingTileId, title]) => ({ tileId: siblingTileId, title })),
    body: isHints
      ? `${segmentationSignals.length} segmentation signals · ${leverSignals.length} manageability signals`
      : `${count} complexity drivers`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep4ContributionMatrixExportViewModel(workspace, appState) {
  const tasks = workspace.step3?.successCriticalTasks || [];
  const organizations = getRecursionOrganizations(workspace);
  const contributionCount = tasks.reduce((total, task) => {
    const allocation = workspace.step4?.allocations?.[task.id];
    return total + organizations.filter((organization) => (
      String(allocation?.contributions?.[organization.id] || "").trim()
    )).length;
  }, 0);
  const gapCount = tasks.filter((task) => {
    const allocation = workspace.step4?.allocations?.[task.id];
    const hasAccountable = Boolean(allocation?.accountableOrganizationId);
    const hasContribution = organizations.some((organization) => (
      String(allocation?.contributions?.[organization.id] || "").trim()
    ));
    return !hasAccountable || !hasContribution;
  }).length;

  return {
    stepId: "step4",
    tileId: "contribution-matrix",
    title: "SCT Contribution Matrix",
    kind: "matrix",
    count: tasks.length,
    unitNoun: "SCTs",
    monolithic: false,
    defaultPreset: "data",
    availableFormats: ["xlsx"],
    availableScopes: [
      { kind: "tile", label: "This matrix", count: tasks.length },
      { kind: "step", label: "Whole Step IV", count: tasks.length }
    ],
    availableIncludes: ["notes", "provenance", "owners", "gaps"],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: "contribution-matrix", title: "SCT Contribution Matrix" }
    ],
    body: `${organizations.length} organizational units · ${contributionCount} contribution fields filled · ${gapCount} SCTs with open gaps`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep5SteeringMapExportViewModel(workspace, appState) {
  const diagnostics = getStep5MappingDiagnostics(workspace);
  const mappedSystemCount = diagnostics.distribution.filter((item) => item.count > 0).length;

  return {
    stepId: "step5",
    tileId: "step5-mapping",
    title: "SCT-to-VSM-System Mapping",
    kind: "mapping",
    count: diagnostics.assignmentCount,
    unitNoun: "mapped contributions",
    monolithic: true,
    defaultPreset: "data",
    availableFormats: ["xlsx"],
    availableScopes: [
      { kind: "step", label: "Whole Step V", count: diagnostics.assignmentCount }
    ],
    availableIncludes: ["notes", "provenance", "gaps"],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: "step5-mapping", title: "SCT-to-VSM-System Mapping" }
    ],
    body: `${diagnostics.assignmentCount} mapped contributions · ${diagnostics.unmappedContributions.length} unassigned contributions · ${mappedSystemCount} VSM systems used`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep6E2EExportViewModel(workspace, appState) {
  const taskCount = workspace.step3?.successCriticalTasks?.length || 0;
  const routeCount = Object.keys(workspace.step6?.e2eRoutes || {}).length;

  return {
    stepId: "step6",
    tileId: "step6-e2e",
    title: "E2E Process Robustness Check",
    kind: "diagram",
    count: Math.max(routeCount, taskCount),
    unitNoun: "routes",
    monolithic: true,
    defaultPreset: "appendix",
    availableFormats: ["svg", "png", "pdf", "pptx"],
    availableScopes: [
      { kind: "tile", label: "This E2E route", count: 1 }
    ],
    availableIncludes: ["warnings", "notes", "provenance"],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: "step6-e2e", title: "E2E Process Robustness Check" },
      { tileId: "step6-channels", title: "Communication Variety Checks" }
    ],
    body: `${taskCount} SCTs available · ${routeCount} authored routes`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep6ChannelsExportViewModel(workspace, appState) {
  const loops = getStep6ChannelVarietyContext(workspace).loops || [];

  return {
    stepId: "step6",
    tileId: "step6-channels",
    title: "Communication Variety Checks",
    kind: "diagram",
    count: loops.length,
    unitNoun: "loops",
    monolithic: true,
    defaultPreset: "appendix",
    availableFormats: ["svg", "png"],
    availableScopes: [
      { kind: "tile", label: "This communication check", count: loops.length }
    ],
    availableIncludes: ["warnings", "notes", "provenance"],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: "step6-e2e", title: "E2E Process Robustness Check" },
      { tileId: "step6-channels", title: "Communication Variety Checks" }
    ],
    body: `${loops.length} canonical communication loops`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getOverviewProjectFrameExportViewModel(workspace, appState) {
  return {
    stepId: "overview",
    tileId: "overview-project-frame",
    title: "Project Frame",
    kind: "form",
    count: 5,
    unitNoun: "fields",
    monolithic: true,
    defaultPreset: "doc",
    availableFormats: ["docx"],
    availableScopes: [
      { kind: "tile", label: "Project frame", count: 5 }
    ],
    availableIncludes: ["notes"],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: "overview-project-frame", title: "Project Frame" }
    ],
    body: `${workspace.project?.status || "No project status"} · ${workspace.sif?.recursionLevel || "R0"} System-in-Focus`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getStep7RepresentationExportViewModel(workspace, appState) {
  const vessels = Array.isArray(workspace.step7?.vessels) ? workspace.step7.vessels : [];
  const vesselCount = vessels.length || (Array.isArray(workspace.step7?.roles) ? workspace.step7.roles.length : 0);
  const meetingCount = Object.keys(workspace.step7?.meetings || {}).length
    || vessels.filter((vessel) => vessel.type === "meeting").length;
  const assignmentCount = Object.keys(workspace.step7?.rasic || {}).length;

  return {
    stepId: "step7",
    tileId: "all",
    title: "Step VII · Representation",
    kind: "substeps",
    count: 7,
    unitNoun: "substeps",
    monolithic: true,
    defaultPreset: "doc",
    availableFormats: ["docx"],
    availableScopes: [
      { kind: "step", label: "Whole Step VII", count: 7 }
    ],
    availableIncludes: ["owners", "gaps", "notes", "provenance", "timestamps", "warnings"],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: "all", title: "All Step VII substeps" }
    ],
    substeps: [
      { id: "7.1", title: "Organizational Vessels" },
      { id: "7.2", title: "RASIC Accountability" },
      { id: "7.3", title: "Metrics & KPIs, Artifacts & Tools" },
      { id: "7.4", title: "Role Descriptions" },
      { id: "7.5", title: "Function Descriptions" },
      { id: "7.6", title: "Meetings & Agendas" },
      { id: "7.7", title: "Organizational Representation" }
    ],
    body: `${vesselCount} vessels · ${assignmentCount} RASIC assignments · ${meetingCount} meetings`,
    project: exportProjectMeta(workspace, appState)
  };
}

function getImplementationBacklogExportViewModel(workspace, appState) {
  const items = workspace.implementation?.items || [];
  const openCount = items.filter((item) => String(item.status || "Open") !== "Done").length;

  return {
    stepId: "implementation",
    tileId: "implementation-backlog",
    title: "Transformation Backlog",
    kind: "list",
    count: items.length,
    unitNoun: "items",
    monolithic: true,
    defaultPreset: "data",
    availableFormats: ["xlsx"],
    availableScopes: [
      { kind: "tile", label: "Transformation backlog", count: items.length },
      { kind: "step", label: "Whole Implementation", count: items.length }
    ],
    availableIncludes: ["owners", "provenance", "notes", "gaps"],
    selectable: false,
    selection: [],
    siblings: [
      { tileId: "implementation-backlog", title: "Transformation Backlog" }
    ],
    body: `${items.length} implementation items · ${openCount} not done`,
    project: exportProjectMeta(workspace, appState)
  };
}

function exportProjectMeta(workspace, appState) {
  return {
    name: workspace.project?.name || "VSM7 Project",
    date: appState.today || new Date().toISOString().slice(0, 10)
  };
}
