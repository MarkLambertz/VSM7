export const stepDefinitions = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Home",
    output: "Project archive and executive report"
  },
  {
    id: "step1",
    label: "Step I: Operative Units",
    shortLabel: "I",
    output: "Segmentation decision"
  },
  {
    id: "step2",
    label: "Step II: Manageability",
    shortLabel: "II",
    output: "Steerability Assessment"
  },
  {
    id: "step3",
    label: "Step III: SCTs",
    shortLabel: "III",
    output: "Success-critical task register"
  },
  {
    id: "step4",
    label: "Step IV: Central/Decentral",
    shortLabel: "IV",
    output: "SCT contribution matrix across the recursion structure"
  },
  {
    id: "step5",
    label: "Step V: Design S2-S5",
    shortLabel: "V",
    output: "Meeting and committee landscape"
  },
  {
    id: "step6",
    label: "Step VI: Channels",
    shortLabel: "VI",
    output: "Communication variety checks"
  },
  {
    id: "step7",
    label: "Step VII: Representation",
    shortLabel: "VII",
    output: "Roles, representation, and one-pager input"
  },
  {
    id: "implementation",
    label: "Implementation",
    shortLabel: "Impl",
    output: "Transformation backlog"
  }
];

export const workflowStepOrder = [
  "step1",
  "step2",
  "step3",
  "step4",
  "step5",
  "step6",
  "step7",
  "implementation"
];

export const vsmSystems = ["1", "2", "3", "3*", "4", "5"];
export const taskSources = [
  "Environment-Operation",
  "Operation-Management",
  "Environmental Overlap",
  "Operational Dependency",
  "Manageability Lever",
  "Workshop Decision"
];

export const communicationLoops = [
  "S2-S1 coordination",
  "S3-S1 intervention",
  "S3-S1 resource bargain",
  "S3*-S1 real-life information",
  "S4-environment sensing",
  "S4-S3 strategy and planning",
  "S5-S4/S3 normative parameters",
  "S5-S1 algedonic signal"
];

export const sixPackOfControl = [
  "Market Position",
  "Innovation",
  "Productivity",
  "Attractiveness for good people",
  "Profitability",
  "Liquidity / Cash Flow"
];
export const step2HorizontalVarietyFields = ["operativeUnitsAmount", "dissimilarity", "selfControl"];
export const step2VerticalVarietyFields = [
  "environmentalOverlaps",
  "system3Star",
  "operationalDependencies",
  "resourceBargain",
  "corporateIntervention",
  "system2"
];
const neutralVarietyValue = "50";

export function createId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createWorkspace() {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    organization: {
      id: createId("org"),
      name: "New Organization",
      description: ""
    },
    project: {
      id: createId("project"),
      name: "New VSM Project",
      status: "Workshop capture",
      createdAt: now,
      updatedAt: now
    },
    members: [
      {
        id: createId("member"),
        name: "VSM Coach",
        role: "Owner"
      }
    ],
    sif: {
      name: "",
      purpose: "",
      customers: "",
      recursionLevel: "R0",
      parentLevel: "R+1",
      childLevel: "R-1"
    },
    step1: {
      recursionLevels: [
        createRecursionLevel("R+1", "Parent system", ""),
        createRecursionLevel("R0", "System in Focus", ""),
        createRecursionLevel("R-1", "Nested operative systems", "")
      ],
      segmentationOptions: [],
      keyBuyingCriteria: [],
      strategicFields: sixPackOfControl.map((variable) => createStrategicField(variable)),
      evaluation: {
        scores: {},
        comments: {}
      },
      selectedSegmentationOptionId: "",
      decisionRationale: "",
      operativeUnits: []
    },
    step2: {
      horizontalAssessment: {
        operativeUnitsAmount: neutralVarietyValue,
        dissimilarity: neutralVarietyValue,
        selfControl: neutralVarietyValue,
        notes: ""
      },
      verticalAssessment: {
        environmentalOverlaps: neutralVarietyValue,
        system3Star: neutralVarietyValue,
        operationalDependencies: neutralVarietyValue,
        resourceBargain: neutralVarietyValue,
        corporateIntervention: neutralVarietyValue,
        system2: neutralVarietyValue,
        notes: ""
      },
      assessedSliders: createStep2AssessedSliders(),
      options: [
        createManageabilityOption("Strengthen control functions"),
        createManageabilityOption("Reduce or compress S1"),
        createManageabilityOption("Add management level")
      ],
      conclusion: "",
      selectedOptionIds: []
    },
    step3: {
      complexityDrivers: {
        environmentOperation: "",
        operationManagement: "",
        environmentalOverlaps: "",
        operationalDependencies: ""
      },
      nextSctNumber: 1,
      successCriticalTasks: []
    },
    step4: {
      allocations: {}
    },
    step5: {
      meetings: []
    },
    step6: {
      communicationChannels: communicationLoops.map((loop) => createCommunicationChannel(loop))
    },
    step7: {
      roles: [],
      orgChartNotes: "",
      representationNotes: ""
    },
    implementation: {
      items: []
    },
    workflow: {
      completedSteps: createStepCompletionState()
    }
  };
}

export function createRecursionLevel(level = "", name = "", description = "") {
  return {
    id: createId("recursion"),
    level,
    name,
    description
  };
}

export function createSegmentationOption(name = "", description = "") {
  return {
    id: createId("segmentation"),
    name,
    description,
    decisionNotes: ""
  };
}

export function createOperativeUnit(name = "", description = "") {
  return {
    id: createId("unit"),
    name,
    description,
    notes: ""
  };
}

export function createKeyBuyingCriterion() {
  return {
    id: createId("criterion"),
    name: "",
    explanation: "",
    weight: "",
    relativePosition: "Unknown"
  };
}

export function createStrategicField(variable = "Market Position") {
  return {
    id: createId("field"),
    variable,
    direction: "",
    links: [],
    files: []
  };
}

export function createStrategicLink(label = "", url = "") {
  return {
    id: createId("link"),
    label,
    url
  };
}

export function createStrategicFile({ name = "", type = "", size = 0, dataUrl = "", storageMode = "embedded" } = {}) {
  return {
    id: createId("file"),
    name,
    type,
    size,
    dataUrl,
    storageMode,
    uploadedAt: new Date().toISOString()
  };
}

export function createStep2AssessedSliders() {
  return {
    horizontalAssessment: Object.fromEntries(step2HorizontalVarietyFields.map((field) => [field, false])),
    verticalAssessment: Object.fromEntries(step2VerticalVarietyFields.map((field) => [field, false]))
  };
}

export function markStep2SliderAssessed(workspace, path) {
  const [, assessmentGroup, field] = String(path || "").split(".");
  if (!isStep2SliderField(assessmentGroup, field)) {
    return;
  }

  workspace.step2.assessedSliders ||= createStep2AssessedSliders();
  workspace.step2.assessedSliders[assessmentGroup] ||= {};
  workspace.step2.assessedSliders[assessmentGroup][field] = true;
}

export function markAllStep2SlidersAssessed(workspace) {
  workspace.step2.assessedSliders = createStep2AssessedSliders();

  for (const field of step2HorizontalVarietyFields) {
    workspace.step2.assessedSliders.horizontalAssessment[field] = true;
  }

  for (const field of step2VerticalVarietyFields) {
    workspace.step2.assessedSliders.verticalAssessment[field] = true;
  }
}

export function resetStep2SlidersToNeutral(workspace) {
  for (const field of step2HorizontalVarietyFields) {
    workspace.step2.horizontalAssessment[field] = neutralVarietyValue;
  }

  for (const field of step2VerticalVarietyFields) {
    workspace.step2.verticalAssessment[field] = neutralVarietyValue;
  }

  markAllStep2SlidersAssessed(workspace);
}

export function isStep2SliderAssessed(workspace, assessmentGroup, field) {
  if (!isStep2SliderField(assessmentGroup, field)) {
    return false;
  }

  return workspace?.step2?.assessedSliders?.[assessmentGroup]?.[field] === true;
}

export function createManageabilityOption(name = "") {
  return {
    id: createId("manageability"),
    name,
    timeToEffect: "",
    robustness: "",
    pros: "",
    cons: "",
    challenges: ""
  };
}

export function createSuccessCriticalTask(number = 0) {
  return {
    id: createId("sct"),
    number: normalizePositiveInteger(number),
    priority: "A",
    system: "3",
    title: "",
    explanation: "",
    source: "Workshop Decision",
    kpi: "",
    requiredArtifacts: "",
    toolOrMethodologicalApproach: ""
  };
}

export function createNumberedSuccessCriticalTask(workspace) {
  const nextNumber = Math.max(
    normalizePositiveInteger(workspace?.step3?.nextSctNumber) || 1,
    highestSctNumber(workspace) + 1
  );
  workspace.step3.nextSctNumber = nextNumber + 1;
  return createSuccessCriticalTask(nextNumber);
}

export function formatSctNumber(number) {
  const normalized = normalizePositiveInteger(number);
  return normalized ? `SCT-${String(normalized).padStart(3, "0")}` : "SCT";
}

export function splitSuccessCriticalTask(workspace, taskId) {
  const source = workspace?.step3?.successCriticalTasks?.find((task) => task.id === taskId);
  if (!source) {
    return null;
  }

  const splitTask = {
    ...createNumberedSuccessCriticalTask(workspace),
    priority: source.priority,
    system: source.system,
    title: source.title ? `${source.title} (split)` : "Split SCT",
    explanation: source.explanation,
    source: source.source,
    kpi: source.kpi,
    requiredArtifacts: source.requiredArtifacts,
    toolOrMethodologicalApproach: source.toolOrMethodologicalApproach
  };

  workspace.step3.successCriticalTasks.push(splitTask);
  const sourceAllocation = workspace.step4.allocations[source.id] || createAllocation(source.id);
  workspace.step4.allocations[splitTask.id] = {
    taskId: splitTask.id,
    contributions: { ...(sourceAllocation.contributions || {}) },
    accountableOrganizationId: sourceAllocation.accountableOrganizationId || ""
  };
  return splitTask;
}

export function mergeSuccessCriticalTasks(workspace, taskIds) {
  const selectedIds = new Set(Array.isArray(taskIds) ? taskIds : []);
  const selectedTasks = workspace?.step3?.successCriticalTasks
    ?.filter((task) => selectedIds.has(task.id))
    .sort((left, right) => left.number - right.number) || [];

  if (selectedTasks.length < 2) {
    return null;
  }

  const [survivor, ...removedTasks] = selectedTasks;
  const removedIds = new Set(removedTasks.map((task) => task.id));
  survivor.priority = strongestPriority(selectedTasks.map((task) => task.priority));
  survivor.title = combineText(selectedTasks.map((task) => task.title), " / ");
  survivor.explanation = combineText(selectedTasks.map((task) => task.explanation));
  survivor.source = commonValue(selectedTasks.map((task) => task.source)) || "Workshop Decision";
  survivor.kpi = combineText(selectedTasks.map((task) => task.kpi));
  survivor.requiredArtifacts = combineText(selectedTasks.map((task) => task.requiredArtifacts));
  survivor.toolOrMethodologicalApproach = combineText(selectedTasks.map((task) => task.toolOrMethodologicalApproach));
  workspace.step4.allocations[survivor.id] = mergeAllocations(workspace, selectedTasks, survivor.id);
  workspace.step3.successCriticalTasks = workspace.step3.successCriticalTasks.filter((task) => !removedIds.has(task.id));

  for (const removedId of removedIds) {
    delete workspace.step4.allocations[removedId];
  }

  for (const item of [...workspace.step5.meetings, ...workspace.step7.roles]) {
    const linkedTaskIds = Array.isArray(item.linkedTaskIds) ? item.linkedTaskIds : [];
    if (linkedTaskIds.some((id) => selectedIds.has(id))) {
      item.linkedTaskIds = [...new Set([
        ...linkedTaskIds.filter((id) => !removedIds.has(id)),
        survivor.id
      ])];
    }
  }

  return survivor;
}

export function createStepCompletionState() {
  return Object.fromEntries(workflowStepOrder.map((stepId) => [stepId, false]));
}

export function isStepComplete(workspace, stepId) {
  return workflowStepOrder.includes(stepId)
    && workspace?.workflow?.completedSteps?.[stepId] === true;
}

export function canCompleteStep(workspace, stepId) {
  const stepIndex = workflowStepOrder.indexOf(stepId);
  if (stepIndex < 0) {
    return false;
  }

  return stepIndex === 0 || isStepComplete(workspace, workflowStepOrder[stepIndex - 1]);
}

export function setStepCompletion(workspace, stepId, completed) {
  const stepIndex = workflowStepOrder.indexOf(stepId);
  if (stepIndex < 0) {
    return false;
  }

  workspace.workflow ||= {};
  workspace.workflow.completedSteps ||= createStepCompletionState();

  if (completed) {
    if (!canCompleteStep(workspace, stepId)) {
      return false;
    }

    workspace.workflow.completedSteps[stepId] = true;
    return true;
  }

  for (const downstreamStepId of workflowStepOrder.slice(stepIndex)) {
    workspace.workflow.completedSteps[downstreamStepId] = false;
  }

  return true;
}

export function createAllocation(taskId) {
  return {
    taskId,
    contributions: {},
    accountableOrganizationId: ""
  };
}

export function getRecursionOrganizations(workspace) {
  return (Array.isArray(workspace?.step1?.recursionLevels) ? workspace.step1.recursionLevels : [])
    .filter((organization) => organization?.id)
    .map((organization, index) => ({
      id: organization.id,
      level: String(organization.level || ""),
      name: String(organization.name || organization.level || "Unnamed organization"),
      description: String(organization.description || ""),
      order: index
    }))
    .sort((left, right) => (
      recursionLevelValue(left.level) - recursionLevelValue(right.level)
      || left.order - right.order
    ))
    .map(({ order: _order, ...organization }) => organization);
}

export function createMeeting() {
  return {
    id: createId("meeting"),
    name: "",
    purpose: "",
    participants: "",
    cadence: "",
    decisionType: "",
    vsmSystem: "2",
    linkedTaskIds: [],
    keep: true
  };
}

export function createCommunicationChannel(loop = "") {
  return {
    id: createId("channel"),
    loop,
    channelsUsed: "",
    capacity: "",
    intelligibility: "",
    synchronicity: "",
    security: "",
    observation: ""
  };
}

export function createRole() {
  return {
    id: createId("role"),
    name: "",
    type: "Leadership role",
    purpose: "",
    reportsTo: "",
    decisionAuthority: "",
    linkedTaskIds: []
  };
}

export function createImplementationItem() {
  return {
    id: createId("implementation"),
    challenge: "",
    requirement: "",
    responsible: "",
    dueDate: "",
    status: "Open"
  };
}

export function ensureWorkspaceShape(candidate) {
  const base = createWorkspace();
  const merged = mergeDeep(base, candidate || {});
  normalizeSuccessCriticalTasks(merged);
  normalizeStepCompletion(merged);
  const taskIds = new Set(merged.step3.successCriticalTasks.map((task) => task.id));

  if (!merged.step1.evaluation) {
    merged.step1.evaluation = { scores: {}, comments: {} };
  }

  ensureSixPackFields(merged);
  normalizeStep2SelectedOptions(merged, candidate?.step2);
  normalizeStep2VarietyDefaults(merged, candidate || {});

  for (const taskId of taskIds) {
    merged.step4.allocations[taskId] = normalizeAllocation(
      taskId,
      merged.step4.allocations[taskId],
      getRecursionOrganizations(merged)
    );
  }

  for (const taskId of Object.keys(merged.step4.allocations)) {
    if (!taskIds.has(taskId)) {
      delete merged.step4.allocations[taskId];
    }
  }

  if (!Array.isArray(merged.step6.communicationChannels) || merged.step6.communicationChannels.length === 0) {
    merged.step6.communicationChannels = communicationLoops.map((loop) => createCommunicationChannel(loop));
  }

  return merged;
}

function normalizeSuccessCriticalTasks(workspace) {
  const usedNumbers = new Set();
  let nextAvailableNumber = 1;

  workspace.step3.successCriticalTasks = workspace.step3.successCriticalTasks.map((task) => {
    const normalizedTask = {
      ...createSuccessCriticalTask(),
      ...(isPlainObject(task) ? task : {})
    };
    const savedNumber = normalizePositiveInteger(normalizedTask.number);

    if (savedNumber && !usedNumbers.has(savedNumber)) {
      normalizedTask.number = savedNumber;
      usedNumbers.add(savedNumber);
      nextAvailableNumber = Math.max(nextAvailableNumber, savedNumber + 1);
      return normalizedTask;
    }

    while (usedNumbers.has(nextAvailableNumber)) {
      nextAvailableNumber += 1;
    }

    normalizedTask.number = nextAvailableNumber;
    usedNumbers.add(nextAvailableNumber);
    nextAvailableNumber += 1;
    return normalizedTask;
  });

  workspace.step3.nextSctNumber = Math.max(
    normalizePositiveInteger(workspace.step3.nextSctNumber) || 1,
    nextAvailableNumber
  );
}

function normalizeStepCompletion(workspace) {
  const saved = workspace?.workflow?.completedSteps;
  const normalized = createStepCompletionState();
  let precedingStepsComplete = true;

  for (const stepId of workflowStepOrder) {
    normalized[stepId] = precedingStepsComplete && saved?.[stepId] === true;
    precedingStepsComplete = normalized[stepId];
  }

  workspace.workflow = {
    ...(isPlainObject(workspace.workflow) ? workspace.workflow : {}),
    completedSteps: normalized
  };
}

function highestSctNumber(workspace) {
  return Math.max(
    0,
    ...(Array.isArray(workspace?.step3?.successCriticalTasks)
      ? workspace.step3.successCriticalTasks.map((task) => normalizePositiveInteger(task?.number))
      : [])
  );
}

function mergeAllocations(workspace, tasks, survivorId) {
  const allocations = tasks.map((task) => workspace.step4.allocations[task.id] || createAllocation(task.id));
  const organizations = getRecursionOrganizations(workspace);

  return {
    taskId: survivorId,
    accountableOrganizationId: commonAccountableOrganizationId(allocations),
    contributions: Object.fromEntries(organizations.map((organization) => [
      organization.id,
      combineText(allocations.map((allocation) => allocation.contributions?.[organization.id]))
    ]))
  };
}

function normalizeAllocation(taskId, savedAllocation, organizations) {
  const saved = isPlainObject(savedAllocation) ? savedAllocation : {};
  const contributions = isPlainObject(saved.contributions) ? { ...saved.contributions } : {};
  const legacySummary = legacyAllocationSummary(saved);

  if (isPlainObject(saved.levels)) {
    for (const organization of organizations) {
      if (saved.levels[organization.level] && !String(contributions[organization.id] || "").trim()) {
        contributions[organization.id] = legacySummary || "Legacy allocation marked for this recursion level.";
      }
    }
  }

  return {
    taskId,
    accountableOrganizationId: normalizeAccountableOrganizationId(saved, organizations),
    contributions: normalizeContributions(contributions, organizations)
  };
}

function normalizeAccountableOrganizationId(allocation, organizations) {
  const organizationIds = new Set(organizations.map((organization) => organization.id));
  if (organizationIds.has(allocation.accountableOrganizationId)) {
    return allocation.accountableOrganizationId;
  }

  const legacyName = String(allocation.accountableEntity || "").trim().toLowerCase();
  return legacyName
    ? organizations.find((organization) => organization.name.trim().toLowerCase() === legacyName)?.id || ""
    : "";
}

function normalizeContributions(contributions, organizations) {
  return Object.fromEntries(organizations.map((organization) => [
    organization.id,
    String(contributions?.[organization.id] || "")
  ]));
}

function legacyAllocationSummary(allocation) {
  return combineText([
    allocation.rationale,
    allocation.partialAllocationNotes,
    allocation.accountableEntity ? `Previously named accountable entity: ${allocation.accountableEntity}` : ""
  ]);
}

function combineText(values, separator = "\n\n") {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].join(separator);
}

function commonValue(values) {
  const unique = [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
  return unique.length === 1 ? unique[0] : "";
}

function commonAccountableOrganizationId(allocations) {
  const values = allocations.map((allocation) => String(allocation.accountableOrganizationId || ""));
  return values.length > 0 && values.every((value) => value && value === values[0])
    ? values[0]
    : "";
}

function recursionLevelValue(level) {
  const match = String(level || "").trim().match(/^R([+-]?\d+)$/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function strongestPriority(values) {
  return [...values].sort((left, right) => ["A", "B", "C"].indexOf(left) - ["A", "B", "C"].indexOf(right))[0] || "A";
}

function normalizePositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function normalizeStep2SelectedOptions(workspace, savedStep2 = {}) {
  const optionIds = new Set(workspace.step2.options.map((option) => option.id));
  const savedIds = Array.isArray(savedStep2?.selectedOptionIds)
    ? savedStep2.selectedOptionIds
    : savedStep2?.selectedOption
      ? [savedStep2.selectedOption]
      : workspace.step2.selectedOptionIds;

  workspace.step2.selectedOptionIds = [...new Set(Array.isArray(savedIds) ? savedIds : [])]
    .filter((id) => optionIds.has(id));

  delete workspace.step2.selectedOption;
}

function normalizeStep2VarietyDefaults(workspace, sourceWorkspace = {}) {
  for (const field of step2HorizontalVarietyFields) {
    workspace.step2.horizontalAssessment[field] = normalizeVarietyValue(workspace.step2.horizontalAssessment[field]);
  }

  for (const field of step2VerticalVarietyFields) {
    workspace.step2.verticalAssessment[field] = normalizeVarietyValue(workspace.step2.verticalAssessment[field]);
  }

  normalizeStep2AssessedSliders(workspace, sourceWorkspace?.step2?.assessedSliders);
}

function normalizeStep2AssessedSliders(workspace, saved = {}) {
  const base = createStep2AssessedSliders();
  const hasSavedAssessmentState = Boolean(saved.horizontalAssessment || saved.verticalAssessment);
  const inferAssessedFromLegacyContent = !hasSavedAssessmentState && hasLegacyStep2AssessmentContent(workspace);

  for (const field of step2HorizontalVarietyFields) {
    base.horizontalAssessment[field] = normalizeStep2AssessedValue(saved.horizontalAssessment, workspace.step2.horizontalAssessment, field, inferAssessedFromLegacyContent);
  }

  for (const field of step2VerticalVarietyFields) {
    base.verticalAssessment[field] = normalizeStep2AssessedValue(saved.verticalAssessment, workspace.step2.verticalAssessment, field, inferAssessedFromLegacyContent);
  }

  workspace.step2.assessedSliders = base;
}

function normalizeStep2AssessedValue(savedGroup, assessment, field, inferAssessedFromLegacyContent) {
  if (savedGroup && Object.prototype.hasOwnProperty.call(savedGroup, field)) {
    return savedGroup[field] === true;
  }

  return inferAssessedFromLegacyContent || assessment[field] !== neutralVarietyValue;
}

function hasLegacyStep2AssessmentContent(workspace) {
  const horizontal = workspace.step2.horizontalAssessment;
  const vertical = workspace.step2.verticalAssessment;
  const leverContent = workspace.step2.options.flatMap((option) => [
    option.timeToEffect,
    option.robustness,
    option.pros,
    option.cons,
    option.challenges
  ]);

  return [
    horizontal.notes,
    vertical.notes,
    workspace.step2.conclusion,
    ...(workspace.step2.selectedOptionIds || []),
    ...leverContent
  ].some((value) => String(value || "").trim());
}

function isStep2SliderField(assessmentGroup, field) {
  if (assessmentGroup === "horizontalAssessment") {
    return step2HorizontalVarietyFields.includes(field);
  }

  if (assessmentGroup === "verticalAssessment") {
    return step2VerticalVarietyFields.includes(field);
  }

  return false;
}

function normalizeVarietyValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return neutralVarietyValue;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return String(Math.max(0, Math.min(100, numericValue)));
  }

  return neutralVarietyValue;
}

export function evaluateStep2Variety(workspace) {
  const horizontal = workspace?.step2?.horizontalAssessment || {};
  const vertical = workspace?.step2?.verticalAssessment || {};
  const units = Array.isArray(workspace?.step1?.operativeUnits) ? workspace.step1.operativeUnits : [];
  const selectedOption = workspace?.step1?.segmentationOptions?.find((option) => option.id === workspace?.step1?.selectedSegmentationOptionId);
  const selectedSegmentationName = selectedOption?.name || "current";

  const drivers = {
    operativeUnitsAmount: varietyValue(horizontal.operativeUnitsAmount),
    dissimilarity: varietyValue(horizontal.dissimilarity),
    selfControl: varietyValue(horizontal.selfControl),
    environmentalOverlaps: varietyValue(vertical.environmentalOverlaps),
    system3Star: varietyValue(vertical.system3Star),
    operationalDependencies: varietyValue(vertical.operationalDependencies),
    resourceBargain: varietyValue(vertical.resourceBargain),
    corporateIntervention: varietyValue(vertical.corporateIntervention),
    system2: varietyValue(vertical.system2)
  };

  const horizontalPressure = Math.round(averageVariety([
    drivers.operativeUnitsAmount,
    drivers.dissimilarity,
    100 - drivers.selfControl
  ]));
  const verticalDemandRaw = averageVariety([
    drivers.environmentalOverlaps,
    drivers.operationalDependencies
  ]);
  const verticalCapacityRaw = averageVariety([
    drivers.system3Star,
    drivers.resourceBargain,
    drivers.corporateIntervention,
    drivers.system2
  ]);
  const verticalDemand = Math.round(verticalDemandRaw);
  const verticalCapacity = Math.round(verticalCapacityRaw);
  const requiredCohesionVariety = Math.max(horizontalPressure, verticalDemand);
  const fitGap = verticalCapacity - requiredCohesionVariety;
  const fitPosition = clampPercent(Math.round(50 + (fitGap / 2)));
  const verticalFit = clampPercent(Math.round(50 + ((verticalCapacityRaw - verticalDemandRaw) / 2)));

  return {
    drivers,
    selectedSegmentationName,
    operativeUnitCount: units.length,
    operativeUnitNames: units.map((unit, index) => unit.name || `S1-${index + 1}`),
    horizontalPressure,
    verticalDemand,
    verticalCapacity,
    requiredCohesionVariety,
    fitGap,
    fitPosition,
    verticalFit,
    interpretationCards: buildStep2InterpretationCards({
      drivers,
      fitGap,
      horizontalPressure,
      requiredCohesionVariety,
      selectedSegmentationName,
      units,
      verticalCapacity,
      verticalDemand
    }),
    sctSignals: buildStep2SctSignals({
      drivers,
      fitGap,
      horizontalPressure,
      selectedSegmentationName,
      units,
      verticalDemand
    })
  };
}

export function getManageabilityLeverSignals(workspace) {
  const options = Array.isArray(workspace?.step2?.options) ? workspace.step2.options : [];
  const selectedOptionIds = new Set(Array.isArray(workspace?.step2?.selectedOptionIds) ? workspace.step2.selectedOptionIds : []);

  return options
    .filter((option) => selectedOptionIds.has(option.id))
    .filter((option) => [
      option.name,
      option.timeToEffect,
      option.robustness,
      option.pros,
      option.cons,
      option.challenges
    ].some(hasText))
    .map((option) => ({
      id: option.id,
      title: option.name || "Unnamed manageability lever",
      detail: firstText(option.challenges, option.pros, option.cons, option.robustness, option.timeToEffect)
        || "Check whether this lever should become a success-critical task.",
      meta: "Selected manageability lever"
    }));
}

export function getWeakSegmentationSignals(workspace, selectedOptionId = workspace?.step1?.selectedSegmentationOptionId) {
  const options = Array.isArray(workspace?.step1?.segmentationOptions) ? workspace.step1.segmentationOptions : [];
  const maxScore = options.length + 1;
  const threshold = Math.max(1, Math.floor(maxScore * 0.7));
  const rows = [
    ...(workspace?.step1?.keyBuyingCriteria || []).map((criterion, index) => ({
      id: criterion.id,
      group: "Key Buying Criteria",
      label: criterion.name || `Criterion ${index + 1}`
    })),
    ...(workspace?.step1?.strategicFields || []).map((field) => ({
      id: field.id,
      group: field.variable,
      label: field.direction || "Strategic ambition not described yet"
    }))
  ];

  return rows
    .map((row) => ({
      ...row,
      score: Number(workspace?.step1?.evaluation?.scores?.[row.id]?.[selectedOptionId] || 0)
    }))
    .filter((row) => row.score > 0 && row.score <= threshold)
    .sort((left, right) => left.score - right.score);
}

function firstText(...values) {
  return values.find(hasText)?.trim() || "";
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function varietyValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return Number(neutralVarietyValue);
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return Math.max(0, Math.min(100, numericValue));
  }

  return Number(neutralVarietyValue);
}

function averageVariety(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function buildStep2InterpretationCards(context) {
  const cards = [buildFitInterpretation(context)];
  const {
    drivers,
    fitGap,
    horizontalPressure,
    selectedSegmentationName,
    units,
    verticalDemand
  } = context;

  if (horizontalPressure >= 70) {
    cards.push({
      tone: "risk",
      title: "Strong operative variety pattern",
      observation: `The ${selectedSegmentationName} segmentation creates substantial variety across ${unitPhrase(units)}.`,
      question: units.length >= 4
        ? "Would bundling several S1s into an additional recursion level make the system easier to steer?"
        : "Can the current S1s absorb their local variety without pushing too much complexity upward?",
      implication: "Use this as an input for Step III: look for success-critical tasks around coordination, local autonomy, and escalation logic."
    });
  }

  if (drivers.selfControl <= 35) {
    cards.push({
      tone: "risk",
      title: "Self-control may be weak",
      observation: "The S1 units appear to have limited ability to manage their own environmental variety.",
      question: "Which decisions, capabilities, or resources must move closer to the S1s before adding more central steering?",
      implication: "Possible SCT signals: autonomy rules, local capability building, decision rights, and transparent performance feedback."
    });
  }

  if (verticalDemand >= 70) {
    cards.push({
      tone: "signal",
      title: "Cross-unit cohesion demand",
      observation: "Overlaps and dependencies indicate that the S1s may need strong cohesion mechanisms.",
      question: "Which dependencies must be coordinated deliberately, and which can be removed or standardized?",
      implication: "Use this pattern for Step III SCTs around shared customers, resource bargains, architecture, standards, and planning cadence."
    });
  }

  if (fitGap > 25 && horizontalPressure <= 55) {
    cards.push({
      tone: "question",
      title: "Possible over-steering pattern",
      observation: "Available vertical steering variety looks stronger than the operative variety currently suggests.",
      question: "Are there committees, controls, or escalation paths that add friction without increasing viability?",
      implication: "This may become a simplification topic instead of a call for more management structure."
    });
  }

  return cards.slice(0, 4);
}

function buildFitInterpretation({ fitGap, horizontalPressure, requiredCohesionVariety, selectedSegmentationName, verticalCapacity, verticalDemand }) {
  if (fitGap < -20) {
    return {
      tone: "risk",
      title: "Variety fit gap",
      observation: `The pattern suggests that the ${selectedSegmentationName} segmentation creates more required cohesion variety than the current steering setup absorbs.`,
      question: horizontalPressure >= verticalDemand
        ? "Should the S1s be bundled, reduced, or strengthened in self-control before adding more central coordination?"
        : "Which overlaps or dependencies should be designed out, and which require stronger S2/S3/S3* mechanisms?",
      implication: "The manageability levers should name the main variety driver and the first lever hypothesis."
    };
  }

  if (fitGap > 25) {
    return {
      tone: "question",
      title: "Steering capacity surplus",
      observation: "The pattern suggests more vertical steering variety than the current required cohesion variety calls for.",
      question: "Is this reserve intentional, or does it indicate unnecessary management effort?",
      implication: "The manageability levers should clarify whether the surplus is strategic resilience or avoidable overhead."
    };
  }

  if (requiredCohesionVariety >= 70 && verticalCapacity >= 70) {
    return {
      tone: "fit",
      title: "Demanding variety fit",
      observation: "The pattern looks broadly matched, but both operative and steering variety are elevated.",
      question: "Which few mechanisms keep this fit robust when pressure rises?",
      implication: "The manageability levers should avoid false comfort and name the fragile assumptions."
    };
  }

  return {
    tone: "fit",
    title: "Plausible variety fit",
    observation: "The pattern suggests a workable match between operative variety pressure and available steering variety.",
    question: "Which assumption would break this balance first?",
    implication: "The manageability levers should record the key assumption and any SCT signal that must be watched."
  };
}

function buildStep2SctSignals({ drivers, fitGap, horizontalPressure, selectedSegmentationName, units, verticalDemand }) {
  const signals = [];

  if (horizontalPressure >= 70) {
    signals.push(`Check SCTs needed to keep ${selectedSegmentationName} steerable across ${unitPhrase(units)}.`);
  }

  if (drivers.dissimilarity >= 70) {
    signals.push("Look for SCTs around differentiated management models, priorities, and shared standards.");
  }

  if (drivers.selfControl <= 35) {
    signals.push("Look for SCTs around local autonomy, capability building, and decision rights.");
  }

  if (drivers.environmentalOverlaps >= 70) {
    signals.push("Look for SCTs around shared customers, suppliers, brand, technology, or market interfaces.");
  }

  if (drivers.operationalDependencies >= 70) {
    signals.push("Look for SCTs around interfaces, resource dependencies, architecture, and planning synchronization.");
  }

  if (fitGap < -20) {
    signals.push("Test a manageability lever: reduce S1 variety, strengthen S1 self-control, add recursion, or reinforce S2/S3/S3*.");
  }

  if (signals.length === 0 && verticalDemand >= 55) {
    signals.push("Review overlaps and dependencies as potential SCT sources even if the overall fit looks acceptable.");
  }

  return signals.slice(0, 5);
}

function unitPhrase(units) {
  const count = Array.isArray(units) ? units.length : 0;

  if (count === 0) {
    return "the defined S1 units";
  }

  if (count === 1) {
    return "1 S1 unit";
  }

  return `${count} S1 units`;
}

function ensureSixPackFields(workspace) {
  const existing = new Set(workspace.step1.strategicFields.map((field) => normalizeSixPackName(field.variable)));

  for (const field of workspace.step1.strategicFields) {
    field.links ||= [];
    field.files ||= [];
  }

  for (const variable of sixPackOfControl) {
    if (!existing.has(normalizeSixPackName(variable))) {
      workspace.step1.strategicFields.push(createStrategicField(variable));
    }
  }
}

function normalizeSixPackName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "");
}

export function syncAllocations(workspace) {
  const taskIds = new Set(workspace.step3.successCriticalTasks.map((task) => task.id));
  const organizations = getRecursionOrganizations(workspace);

  for (const task of workspace.step3.successCriticalTasks) {
    workspace.step4.allocations[task.id] = normalizeAllocation(
      task.id,
      workspace.step4.allocations[task.id],
      organizations
    );
  }

  for (const taskId of Object.keys(workspace.step4.allocations)) {
    if (!taskIds.has(taskId)) {
      delete workspace.step4.allocations[taskId];
    }
  }
}

function mergeDeep(target, source) {
  if (!source || typeof source !== "object") {
    return target;
  }

  if (Array.isArray(target)) {
    return Array.isArray(source) ? source : target;
  }

  if (!isPlainObject(target)) {
    return isPlainObject(source) || Array.isArray(source) ? target : source;
  }

  if (!isPlainObject(source)) {
    return target;
  }

  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (!(key in result)) {
      result[key] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
      result[key] = mergeDeep(result[key], value);
    } else if (Array.isArray(result[key])) {
      result[key] = Array.isArray(value) ? value : result[key];
    } else if (isPlainObject(result[key])) {
      result[key] = isPlainObject(value) ? mergeDeep(result[key], value) : result[key];
    } else if (Array.isArray(value) || isPlainObject(value)) {
      result[key] = result[key];
    } else {
      result[key] = value;
    }
  }

  return result;
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}
