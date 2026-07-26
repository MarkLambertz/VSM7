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
    label: "Step V: Design Steering System",
    shortLabel: "V",
    output: "SCT-to-VSM-system map"
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

export const canonicalChannelVarietyLoops = [
  { id: "vsm-loop-s2-s1-coordination", sys: "S2", vsmChannel: "f", legacyLoop: "S2-S1 coordination", kind: "coordination" },
  { id: "vsm-loop-s3-s1-command", sys: "S3", vsmChannel: "e", legacyLoop: "S3-S1 intervention", kind: "command" },
  { id: "vsm-loop-s3-s1-resource-bargain", sys: "S3", vsmChannel: "d", legacyLoop: "S3-S1 resource bargain", kind: "resource-bargain" },
  { id: "vsm-loop-s3star-s1-audit", sys: "S3*", vsmChannel: "b", legacyLoop: "S3*-S1 real-life information", kind: "audit" },
  { id: "vsm-loop-s4-environment-sensing", sys: "S4", vsmChannel: "s4env", legacyLoop: "S4-environment sensing", kind: "environment-sensing" },
  { id: "vsm-loop-s4-s3-homeostat", sys: "S4/S3", vsmChannel: "h34", legacyLoop: "S4-S3 strategy and planning", kind: "homeostat" },
  { id: "vsm-loop-s5-s4-s3-normative", sys: "S5", vsmChannel: "h5", legacyLoop: "S5-S4/S3 normative parameters", kind: "normative" },
  { id: "vsm-loop-s5-s1-algedonic", sys: "S5", vsmChannel: "g", legacyLoop: "S5-S1 algedonic signal", kind: "algedonic" }
];

export const channelVarietyCriteria = [
  { key: "capacity", label: "Capacity" },
  { key: "clarity", label: "Clarity" },
  { key: "synchronicity", label: "Synchronicity" },
  { key: "feedback", label: "Feedback" }
];

export const step7VesselTypes = ["role", "function", "meeting"];
export const step7AspectKinds = ["kpis", "artifacts", "tools"];
export const rasicValues = ["R", "A", "S", "I", "C"];

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
      includeSystem1: true,
      assignments: createVsmSystemAssignments()
    },
    step6: {
      communicationChannels: communicationLoops.map((loop) => createCommunicationChannel(loop)),
      channelVarietyModel: createChannelVarietyModel(),
      e2eRoutes: {},
      e2eRouteIds: {},
      detachedRoutes: {}
    },
    step7: createStep7RepresentationModel(),
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

const successCriticalTaskAspectFields = {
  kpi: "kpis",
  requiredArtifacts: "artifacts",
  toolOrMethodologicalApproach: "tools"
};

export function setSuccessCriticalTaskOptionalDetail(workspace, taskId, field, value) {
  const aspectKind = successCriticalTaskAspectFields[field];
  const task = workspace?.step3?.successCriticalTasks?.find((item) => item.id === taskId);
  if (!aspectKind || !task) {
    return false;
  }

  normalizeStep7Representation(workspace);
  const previousValue = String(task[field] || "").trim();
  const nextValue = String(value ?? "");
  const bundle = ensureStep7AspectBundle(workspace, taskId);
  const items = bundle[aspectKind];
  const primaryIndex = findPrimaryStep3AspectIndex(items, taskId, aspectKind, previousValue);

  if (nextValue.trim()) {
    if (primaryIndex >= 0) {
      items[primaryIndex] = { ...items[primaryIndex], text: nextValue };
    } else {
      items.unshift(createStep7AspectItem(nextValue, {
        id: step3AspectItemId(taskId, aspectKind)
      }));
    }
  } else if (primaryIndex >= 0) {
    items.splice(primaryIndex, 1);
  }

  task[field] = nextValue;
  return true;
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
  duplicateStep5TaskAssignments(workspace, source.id, splitTask.id);
  duplicateStep7TaskReferences(workspace, source.id, splitTask.id);
  if (isPlainObject(workspace?.step6?.e2eRoutes?.[source.id])) {
    workspace.step6.e2eRoutes[splitTask.id] = cloneJson(workspace.step6.e2eRoutes[source.id]);
    remapStep6RouteSctReferences(workspace.step6.e2eRoutes[splitTask.id], source.id, splitTask.id);
    workspace.step6.e2eRoutes[splitTask.id].meta = {
      ...(isPlainObject(workspace.step6.e2eRoutes[splitTask.id].meta) ? workspace.step6.e2eRoutes[splitTask.id].meta : {}),
      sctId: splitTask.id,
      sct: splitTask.title || "Split SCT",
      primarySctId: splitTask.id,
      relatedSctIds: normalizeStep6RelatedSctIds(
        workspace.step6.e2eRoutes[splitTask.id].meta?.relatedSctIds,
        splitTask.id
      )
    };
    workspace.step6.e2eRouteIds ||= {};
    workspace.step6.e2eRouteIds[splitTask.id] = createId("e2e-route");
  }
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
  mergeStep5TaskAssignments(workspace, survivor.id, removedIds);
  mergeStep7TaskReferences(workspace, survivor.id, removedIds);
  preserveMergedStep6Routes(workspace, survivor, removedTasks);
  workspace.step3.successCriticalTasks = workspace.step3.successCriticalTasks.filter((task) => !removedIds.has(task.id));

  for (const removedId of removedIds) {
    delete workspace.step4.allocations[removedId];
  }

  for (const item of workspace.step7.roles) {
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

export function createVsmSystemAssignments() {
  return Object.fromEntries(vsmSystems.map((systemId) => [systemId, []]));
}

export function getStep5ContributionKey(taskId, organizationId) {
  return `${String(taskId || "")}|${String(organizationId || "")}`;
}

export function getStep5InScopeContributions(workspace) {
  const tasks = Array.isArray(workspace?.step3?.successCriticalTasks) ? workspace.step3.successCriticalTasks : [];
  const organizations = getRecursionOrganizations(workspace)
    .filter((organization) => recursionLevelValue(organization.level) === 0);
  const contributions = [];

  for (const task of tasks) {
    const allocation = workspace?.step4?.allocations?.[task.id];
    for (const organization of organizations) {
      const text = String(allocation?.contributions?.[organization.id] || "").trim();
      if (!text) {
        continue;
      }

      contributions.push({
        key: getStep5ContributionKey(task.id, organization.id),
        taskId: task.id,
        organizationId: organization.id,
        sctNumber: formatSctNumber(task.number),
        title: task.title || "Untitled SCT",
        description: task.explanation || "",
        priority: task.priority || "A",
        source: task.source || "Workshop Decision",
        level: organization.level,
        organizationName: organization.name,
        contribution: text
      });
    }
  }

  return contributions.sort((left, right) => (
    Number(left.sctNumber.replace(/\D/g, "")) - Number(right.sctNumber.replace(/\D/g, ""))
    || left.organizationName.localeCompare(right.organizationName)
  ));
}

export function isStep5ContributionAssigned(workspace, systemId, contributionKey) {
  return Array.isArray(workspace?.step5?.assignments?.[systemId])
    && workspace.step5.assignments[systemId].includes(contributionKey);
}

export function getStep5AssignedSystem(workspace, contributionKey) {
  normalizeStep5Assignments(workspace);
  return vsmSystems.find((systemId) => workspace.step5.assignments[systemId].includes(contributionKey)) || "";
}

export function getStep7SctContributions(workspace) {
  const tasks = Array.isArray(workspace?.step3?.successCriticalTasks) ? workspace.step3.successCriticalTasks : [];
  const organizations = getRecursionOrganizations(workspace);
  const contributions = [];

  for (const task of tasks) {
    const allocation = workspace?.step4?.allocations?.[task.id];
    for (const organization of organizations) {
      const text = String(allocation?.contributions?.[organization.id] || "").trim();
      if (!text) {
        continue;
      }

      const key = getStep5ContributionKey(task.id, organization.id);
      contributions.push({
        id: key,
        key,
        taskId: task.id,
        sctId: task.id,
        sctNumber: formatSctNumber(task.number),
        sctName: task.title || "Untitled SCT",
        title: task.title || "Untitled SCT",
        description: task.explanation || "",
        priority: task.priority || "A",
        source: task.source || "Workshop Decision",
        organizationId: organization.id,
        organizationName: organization.name,
        recursionLevel: organization.level,
        level: organization.level,
        contribution: text,
        accountableOrganizationId: allocation?.accountableOrganizationId || "",
        isAccountable: allocation?.accountableOrganizationId === organization.id,
        vsmSystem: getStep5AssignedSystem(workspace, key)
      });
    }
  }

  return contributions.sort((left, right) => (
    Number(left.sctNumber.replace(/\D/g, "")) - Number(right.sctNumber.replace(/\D/g, ""))
    || recursionLevelValue(left.recursionLevel) - recursionLevelValue(right.recursionLevel)
    || left.organizationName.localeCompare(right.organizationName)
  ));
}

export function getStep7Vessels(workspace) {
  normalizeStep7Representation(workspace);
  return workspace.step7.vessels;
}

export function getStep7RasicAssignment(workspace, contributionId, vesselId) {
  normalizeStep7Representation(workspace);
  return workspace.step7.rasic[step7RasicKey(contributionId, vesselId)] || "";
}

export function setStep7RasicAssignment(workspace, contributionId, vesselId, value) {
  normalizeStep7Representation(workspace);
  const validContributionIds = new Set(getStep7SctContributions(workspace).map((contribution) => contribution.id));
  const validVesselIds = new Set(workspace.step7.vessels.map((vessel) => vessel.id));
  if (!validContributionIds.has(contributionId) || !validVesselIds.has(vesselId)) {
    return false;
  }

  const key = step7RasicKey(contributionId, vesselId);
  const normalizedValue = String(value || "").trim().toUpperCase();
  if (!normalizedValue) {
    delete workspace.step7.rasic[key];
    return true;
  }

  if (!rasicValues.includes(normalizedValue)) {
    return false;
  }

  workspace.step7.rasic[key] = normalizedValue;
  return true;
}

export function getStep7OrgChartContext(workspace) {
  normalizeStep7Representation(workspace);
  return {
    units: getRecursionOrganizations(workspace),
    scts: getStep7Scts(workspace),
    contributions: getStep7SctContributions(workspace),
    vessels: cloneJson(workspace.step7.vessels),
    rasic: cloneJson(workspace.step7.rasic),
    warnings: cloneJson(workspace.step7.warnings)
  };
}

export function getStep7EditorContext(workspace, options = {}) {
  normalizeStep7Representation(workspace);
  const units = getStep7EditorUnits(workspace);
  const allScts = getStep7Scts(workspace);
  const allContributions = getStep7SctContributions(workspace);
  const scope = normalizeStep7EditorContextScope(options);
  const contextContributions = scope === "sif"
    ? filterStep7EditorSifContributions(allContributions, units)
    : allContributions;
  const contextSctIds = new Set(contextContributions.map((contribution) => contribution.sctId || contribution.taskId));
  const contextScts = scope === "sif"
    ? allScts.filter((sct) => contextSctIds.has(sct.id))
    : allScts;

  return {
    units,
    scts: contextScts.map(formatStep7EditorSct),
    contribs: contextContributions.map(formatStep7EditorContribution),
    metricDefs: getStep7ReuseDefinitions(workspace, "kpis", "metricDefs", {
      sctIds: scope === "sif" ? contextSctIds : null
    }),
    artifactDefs: getStep7ReuseDefinitions(workspace, "artifacts", "artifactDefs", {
      sctIds: scope === "sif" ? contextSctIds : null
    }),
    toolDefs: getStep7ReuseDefinitions(workspace, "tools", "toolDefs", {
      sctIds: scope === "sif" ? contextSctIds : null
    }),
    decisionDefs: getStep7DecisionDefinitions(workspace),
    loops: getStep6ChannelVarietyContext(workspace).loops.map(formatStep7EditorLoop),
    meta: {
      sif: getStep7EditorSifUnitId(units),
      sifName: getStep7EditorSifName(workspace, units),
      organizationName: String(workspace.organization?.name || ""),
      projectName: String(workspace.project?.name || ""),
      contextScope: scope
    }
  };
}

export function getStep7EditorModel(workspace) {
  normalizeStep7Representation(workspace);
  return {
    vessels: workspace.step7.vessels.map(formatStep7EditorVessel),
    rasic: cloneJson(workspace.step7.rasic),
    aspects: cloneJson(workspace.step7.aspects),
    descriptions: flattenStep7Descriptions(workspace.step7.descriptions, workspace.step7.vessels),
    membership: buildStep7MeetingMembership(workspace.step7.meetings, workspace.step7.participations),
    vesselAspects: cloneJson(workspace.step7.vesselAspects),
    meetings: cloneJson(workspace.step7.meetings),
    orgHierarchy: cloneJson(workspace.step7.orgHierarchy)
  };
}

export function setStep7EditorModel(workspace, model) {
  if (!isPlainObject(model)) {
    return false;
  }

  normalizeStep7Representation(workspace);

  if (Array.isArray(model.vessels)) {
    workspace.step7.vessels = model.vessels
      .filter(isPlainObject)
      .map((vessel) => ({
        id: String(vessel.id || createId("vessel")),
        type: normalizeStep7VesselType(vessel.type),
        name: String(vessel.name || "").trim(),
        purpose: String(vessel.purpose || ""),
        scope: String(vessel.scope || ""),
        prov: String(vessel.prov || "workshop"),
        state: String(vessel.state || "draft"),
        sys: parseStep7EditorSystem(vessel.sys),
        alg: vessel.alg === true,
        ...normalizeStep7VesselFte(vessel),
        ...(vessel.legacyRoleId ? { legacyRoleId: String(vessel.legacyRoleId) } : {})
      }))
      .filter((vessel) => vessel.name);
  }

  workspace.step7.meetings = normalizeStep7Meetings(
    isPlainObject(model.meetings) ? model.meetings : workspace.step7.meetings,
    workspace.step7.vessels
  );

  for (const [key, value] of Object.entries({
    metricDefs: model.metricDefs,
    artifactDefs: model.artifactDefs,
    toolDefs: model.toolDefs,
    decisionDefs: model.decisionDefs
  })) {
    if (Array.isArray(value)) {
      workspace.step7[key] = normalizeStep7DefinitionPool(value);
    }
  }

  const validContributionIds = new Set(getStep7SctContributions(workspace).map((contribution) => contribution.id));
  const validVesselIds = new Set(workspace.step7.vessels.map((vessel) => vessel.id));
  const validOrgHierarchyNodeIds = getStep7OrgHierarchyNodeIds(workspace, validVesselIds);

  if (isPlainObject(model.orgHierarchy)) {
    workspace.step7.orgHierarchy = normalizeStep7OrgHierarchy(
      model.orgHierarchy,
      validOrgHierarchyNodeIds
    );
  }

  if (isPlainObject(model.rasic)) {
    workspace.step7.rasic = normalizeStep7Rasic(model.rasic, validContributionIds, validVesselIds);
  }

  if (isPlainObject(model.aspects)) {
    const taskIds = new Set(workspace.step3.successCriticalTasks.map((task) => task.id));
    workspace.step7.aspects = normalizeStep7Aspects(model.aspects, taskIds);
    syncStep3OptionalDetailsFromStep7Aspects(workspace);
  }

  if (isPlainObject(model.descriptions)) {
    workspace.step7.descriptions = inflateStep7Descriptions(
      model.descriptions,
      workspace.step7.vessels,
      workspace.step7.descriptions
    );
  }

  if (isPlainObject(model.vesselAspects)) {
    workspace.step7.vesselAspects = normalizeStep7VesselAspects(model.vesselAspects, validVesselIds);
  }

  if (isPlainObject(model.membership)) {
    workspace.step7.participations = step7MembershipToParticipations(
      model.membership,
      validVesselIds,
      new Set(workspace.step7.vessels.filter((vessel) => vessel.type === "meeting").map((vessel) => vessel.id)),
      workspace.step7
    );
    syncStep7MeetingParticipations(workspace.step7);
  }

  normalizeStep7Representation(workspace);
  return true;
}

export function getStep7MeetingLandscapeContext(workspace) {
  normalizeStep7Representation(workspace);
  const vessels = cloneJson(workspace.step7.vessels).map(normalizeStep7MeetingLandscapeVessel);
  const meetings = formatStep7MeetingLandscapeMeetings(
    normalizeStep7Meetings(workspace.step7.meetings, workspace.step7.vessels, { includeVesselDefaults: true })
  );
  const connections = cloneJson(workspace.step7.meetingConnections);
  return {
    units: getRecursionOrganizations(workspace),
    roles: vessels.filter((vessel) => vessel.type === "role"),
    vessels,
    loops: getStep6ChannelVarietyContext(workspace).loops,
    aspects: cloneJson(workspace.step7.aspects),
    vesselAspects: cloneJson(workspace.step7.vesselAspects),
    scts: getStep7Scts(workspace),
    contribs: getStep7MeetingLandscapeContributions(workspace),
    rasic: cloneJson(workspace.step7.rasic),
    membership: buildStep7MeetingMembership(workspace.step7.meetings, workspace.step7.participations),
    meetings,
    connections,
    model: {
      meetings: cloneJson(meetings),
      connections: cloneJson(connections)
    },
    landscape: {
      schemaVersion: 1,
      meetings: cloneJson(meetings),
      connections: cloneJson(connections)
    },
    meta: {
      sifName: String(workspace.sif?.name || ""),
      sif: String(workspace.sif?.name || "")
    }
  };
}

export function toggleStep5ContributionAssignment(workspace, systemId, contributionKey) {
  if (!vsmSystems.includes(systemId)) {
    return false;
  }

  normalizeStep5Assignments(workspace);
  const validKeys = new Set(getStep5InScopeContributions(workspace).map((contribution) => contribution.key));
  if (!validKeys.has(contributionKey)) {
    return false;
  }

  const alreadyAssignedToSystem = workspace.step5.assignments[systemId].includes(contributionKey);
  for (const candidateSystemId of vsmSystems) {
    workspace.step5.assignments[candidateSystemId] = workspace.step5.assignments[candidateSystemId]
      .filter((key) => key !== contributionKey);
  }

  if (!alreadyAssignedToSystem) {
    workspace.step5.assignments[systemId] = [...workspace.step5.assignments[systemId], contributionKey];
  }
  return true;
}

export function removeStep5TaskAssignments(workspace, taskId) {
  normalizeStep5Assignments(workspace);
  const prefix = `${taskId}|`;
  for (const systemId of vsmSystems) {
    workspace.step5.assignments[systemId] = workspace.step5.assignments[systemId]
      .filter((key) => !key.startsWith(prefix));
  }
}

export function getStep5MappingDiagnostics(workspace) {
  normalizeStep5Assignments(workspace);
  const contributions = getStep5InScopeContributions(workspace);
  const validKeys = new Set(contributions.map((contribution) => contribution.key));
  const visibleSystems = workspace.step5.includeSystem1 === false ? vsmSystems.filter((systemId) => systemId !== "1") : vsmSystems;
  const distribution = visibleSystems.map((systemId) => {
    const count = workspace.step5.assignments[systemId].filter((key) => validKeys.has(key)).length;
    return { systemId, count, percentage: 0 };
  });
  const assignmentCount = distribution.reduce((sum, item) => sum + item.count, 0);
  for (const item of distribution) {
    item.percentage = assignmentCount > 0 ? Math.round((item.count / assignmentCount) * 100) : 0;
  }

  const assignedKeys = new Set(visibleSystems.flatMap((systemId) => workspace.step5.assignments[systemId]));
  const unmappedContributions = contributions.filter((contribution) => !assignedKeys.has(contribution.key));
  const dominant = [...distribution].sort((left, right) => right.percentage - left.percentage)[0];
  return {
    contributions,
    contributionCount: contributions.length,
    assignmentCount,
    distribution,
    unmappedContributions,
    observation: buildStep5DistributionObservation(dominant, assignmentCount)
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

export function createChannelVarietyModel(workspace = null, legacyChannels = []) {
  const labels = getCanonicalChannelVarietyLoops(workspace);
  const legacyByLoop = new Map(
    (Array.isArray(legacyChannels) ? legacyChannels : [])
      .filter(isPlainObject)
      .map((channel) => [String(channel.loop || ""), channel])
  );

  return {
    meta: {
      sifName: getChannelVarietySifName(workspace)
    },
    loops: labels.map((definition) => {
      const legacy = legacyByLoop.get(definition.legacyLoop);
      return {
        id: definition.id,
        sys: definition.sys,
        vsmChannel: definition.vsmChannel,
        label: definition.label,
        communication: String(legacy?.channelsUsed || ""),
        artifact: "",
        role: "",
        ratings: [
          legacyChannelRating(legacy?.capacity),
          legacyChannelRating(legacy?.intelligibility),
          legacyChannelRating(legacy?.synchronicity),
          legacyChannelRating(legacy?.security)
        ],
        note: String(legacy?.observation || "")
      };
    })
  };
}

export function getStep6ChannelVarietyContext(workspace) {
  const model = reconcileChannelVarietyModel(
    workspace,
    workspace?.step6?.channelVarietyModel,
    workspace?.step6?.communicationChannels
  );
  return {
    model,
    loops: model.loops.map(({ id, sys, label, vsmChannel }) => ({ id, sys, label, vsmChannel })),
    meta: { ...model.meta }
  };
}

export function setStep6ChannelVarietyModel(workspace, model) {
  if (!isPlainObject(workspace) || !isPlainObject(model)) {
    return false;
  }

  workspace.step6 ||= {};
  workspace.step6.channelVarietyModel = reconcileChannelVarietyModel(
    workspace,
    model,
    workspace.step6.communicationChannels
  );
  reconcileChannelVarietySourceStatus(workspace, workspace.step6.channelVarietyModel);
  return true;
}

export function getStep6ChannelVarietyWeaknessCandidates(workspace) {
  const model = getStep6ChannelVarietyContext(workspace).model;
  const items = Array.isArray(workspace?.implementation?.items) ? workspace.implementation.items : [];
  const convertedSources = new Set(items
    .filter((item) => item?.source?.kind === "channel-variety-weakness")
    .map((item) => `${item.source.loopId}|${Number(item.source.criterionIndex)}`));
  const candidates = [];

  for (const loop of model.loops) {
    loop.ratings.forEach((rating, criterionIndex) => {
      if (Number(rating) !== 1 || !channelVarietyCriteria[criterionIndex]) {
        return;
      }
      const criterion = channelVarietyCriteria[criterionIndex];
      candidates.push({
        loopId: loop.id,
        loopLabel: loop.label,
        system: loop.sys,
        criterionIndex,
        criterionKey: criterion.key,
        criterionLabel: criterion.label,
        observation: loop.note,
        communication: loop.communication,
        artifact: loop.artifact,
        role: loop.role,
        converted: convertedSources.has(`${loop.id}|${criterionIndex}`)
      });
    });
  }

  return candidates;
}

export function createImplementationItemFromChannelWeakness(workspace, loopId, criterionIndex) {
  const normalizedIndex = Number(criterionIndex);
  const candidate = getStep6ChannelVarietyWeaknessCandidates(workspace)
    .find((item) => item.loopId === loopId && item.criterionIndex === normalizedIndex);
  if (!candidate || candidate.converted) {
    return null;
  }

  const item = createImplementationItem();
  item.challenge = `${candidate.criterionLabel} weakness: ${candidate.loopLabel}`;
  item.requirement = [
    candidate.observation,
    candidate.communication ? `Communication & meetings: ${candidate.communication}` : "",
    candidate.artifact ? `Artifact: ${candidate.artifact}` : "",
    candidate.role ? `Role: ${candidate.role}` : ""
  ].filter(Boolean).join(" | ");
  item.source = {
    kind: "channel-variety-weakness",
    loopId: candidate.loopId,
    criterionIndex: candidate.criterionIndex
  };
  item.sourceStatus = "active";
  workspace.implementation.items.push(item);
  return item;
}

function reconcileChannelVarietyModel(workspace, savedModel, legacyChannels = []) {
  const base = createChannelVarietyModel(workspace, legacyChannels);
  const savedLoops = new Map(
    (Array.isArray(savedModel?.loops) ? savedModel.loops : [])
      .filter(isPlainObject)
      .map((loop) => [String(loop.id || ""), loop])
  );

  return {
    meta: {
      ...(isPlainObject(savedModel?.meta) ? cloneJson(savedModel.meta) : {}),
      sifName: getChannelVarietySifName(workspace)
    },
    loops: base.loops.map((loop) => {
      const saved = savedLoops.get(loop.id);
      return {
        ...loop,
        communication: String(saved?.communication ?? saved?.channels ?? loop.communication ?? ""),
        artifact: String(saved?.artifact ?? loop.artifact ?? ""),
        role: String(saved?.role ?? loop.role ?? ""),
        ratings: normalizeChannelRatings(saved?.ratings ?? loop.ratings),
        note: String(saved?.note ?? loop.note ?? "")
      };
    })
  };
}

function getCanonicalChannelVarietyLoops(workspace) {
  const labels = {
    algedonic: "S5-S1 algedonic signal",
    command: "S3-S1 command and intervention",
    "resource-bargain": "S3-S1 resource bargain and accountability",
    audit: "S3*-S1 independent real-life information",
    coordination: "S2-S1 coordination",
    "environment-sensing": "S4-environment sensing",
    homeostat: "S4-S3 strategy and planning homeostat",
    normative: "S5-S4/S3 normative alignment"
  };

  return canonicalChannelVarietyLoops.map((definition) => ({
    ...definition,
    label: labels[definition.kind]
  }));
}

function getChannelVarietySifName(workspace) {
  return String(workspace?.sif?.name || "").trim()
    || getRecursionOrganizations(workspace).find((organization) => organization.level === "R0")?.name
    || "System-in-Focus";
}

function normalizeChannelRatings(ratings) {
  return [0, 1, 2, 3].map((index) => {
    const rating = Number(Array.isArray(ratings) ? ratings[index] : 0);
    return Number.isInteger(rating) && rating >= 0 && rating <= 3 ? rating : 0;
  });
}

function legacyChannelRating(value) {
  return ({ Weak: 1, Adequate: 2, Strong: 3 })[String(value || "")] || 0;
}

export function getStep6RouteContext(workspace, taskId) {
  const tasks = Array.isArray(workspace?.step3?.successCriticalTasks)
    ? workspace.step3.successCriticalTasks
    : [];
  const task = tasks.find((candidate) => candidate.id === taskId);
  if (!task) {
    return null;
  }

  const lanes = getRecursionOrganizations(workspace)
    .sort((left, right) => recursionLevelValue(right.level) - recursionLevelValue(left.level))
    .map((organization) => ({
      id: organization.id,
      name: organization.name,
      sub: organization.level
    }));
  const relatedSctIds = getStep6RelatedSctIds(workspace, taskId);
  const tasksById = new Map(tasks.map((candidate) => [candidate.id, candidate]));
  const relatedTasks = relatedSctIds.map((id) => tasksById.get(id)).filter(Boolean);
  const toContextSct = (candidate) => ({
    id: candidate.id,
    displayId: formatSctNumber(candidate.number),
    name: candidate.title || "Untitled SCT"
  });
  const primarySct = toContextSct(task);
  const relatedScts = relatedTasks.map(toContextSct);
  const contributions = [task, ...relatedTasks].flatMap((candidate) => {
    const allocation = workspace?.step4?.allocations?.[candidate.id] || createAllocation(candidate.id);
    const sct = toContextSct(candidate);
    return lanes
      .map((lane) => {
        const label = String(allocation?.contributions?.[lane.id] || "").trim();
        return label
          ? {
              id: getStep5ContributionKey(candidate.id, lane.id),
              laneId: lane.id,
              label,
              sctId: candidate.id,
              sctName: sct.name
            }
          : null;
      })
      .filter(Boolean);
  });

  return {
    lanes,
    sct: primarySct,
    primarySct,
    relatedScts,
    relatedSctIds,
    unavailableRelatedSctIds: relatedSctIds.filter((id) => !tasksById.has(id)),
    contributions
  };
}

export function getStep6RelatedSctIds(workspace, taskId) {
  const saved = workspace?.step6?.e2eRoutes?.[taskId];
  return normalizeStep6RelatedSctIds(saved?.meta?.relatedSctIds, taskId);
}

export function setStep6RelatedSctIds(workspace, taskId, relatedSctIds) {
  const tasks = Array.isArray(workspace?.step3?.successCriticalTasks)
    ? workspace.step3.successCriticalTasks
    : [];
  const validTaskIds = new Set(tasks.map((task) => task.id));
  if (!validTaskIds.has(taskId)) {
    return false;
  }

  const model = getStep6RouteModel(workspace, taskId);
  if (!model) {
    return false;
  }

  model.meta = {
    ...(isPlainObject(model.meta) ? model.meta : {}),
    primarySctId: taskId,
    relatedSctIds: normalizeStep6RelatedSctIds(relatedSctIds, taskId)
      .filter((id) => validTaskIds.has(id))
  };
  return setStep6RouteModel(workspace, taskId, model);
}

export function createStep6RouteModel(workspace, taskId) {
  const context = getStep6RouteContext(workspace, taskId);
  if (!context) {
    return null;
  }

  return {
    meta: {
      name: `${context.sct.displayId} · ${context.sct.name} E2E route`,
      sct: `${context.sct.displayId} · ${context.sct.name}`,
      sctId: context.sct.id,
      primarySctId: context.sct.id,
      relatedSctIds: []
    },
    lanes: cloneJson(context.lanes),
    nodes: [],
    links: [],
    callouts: [],
    findings: []
  };
}

export function reconcileStep6RouteModel(workspace, taskId, model) {
  const context = getStep6RouteContext(workspace, taskId);
  if (!context) {
    return null;
  }

  const fallback = createStep6RouteModel(workspace, taskId);
  const reconciled = isPlainObject(model) ? cloneJson(model) : fallback;
  const laneIds = new Set(context.lanes.map((lane) => lane.id));
  const fallbackLaneId = context.lanes[0]?.id || "";

  reconciled.meta = {
    ...(isPlainObject(reconciled.meta) ? reconciled.meta : {}),
    name: String(reconciled.meta?.name || fallback.meta.name),
    sct: `${context.sct.displayId} · ${context.sct.name}`,
    sctId: context.sct.id,
    primarySctId: context.sct.id,
    relatedSctIds: normalizeStep6RelatedSctIds(reconciled.meta?.relatedSctIds, context.sct.id)
  };
  reconciled.lanes = cloneJson(context.lanes);
  reconciled.nodes = Array.isArray(reconciled.nodes) ? reconciled.nodes : [];
  reconciled.links = Array.isArray(reconciled.links) ? reconciled.links : [];
  reconciled.callouts = Array.isArray(reconciled.callouts) ? reconciled.callouts : [];
  reconciled.findings = Array.isArray(reconciled.findings)
    ? reconciled.findings.filter(isValidStep6Finding).map(cloneJson)
    : [];

  if (fallbackLaneId) {
    reconciled.nodes = reconciled.nodes.map((node) => (
      isPlainObject(node) && !laneIds.has(node.laneId)
        ? { ...node, laneId: fallbackLaneId }
        : node
    ));
  }

  return reconciled;
}

export function getStep6RouteModel(workspace, taskId) {
  const saved = workspace?.step6?.e2eRoutes?.[taskId];
  return reconcileStep6RouteModel(workspace, taskId, saved);
}

export function getStep6RouteId(workspace, taskId) {
  if (!getStep6RouteContext(workspace, taskId)) {
    return "";
  }

  workspace.step6 ||= {};
  workspace.step6.e2eRouteIds = isPlainObject(workspace.step6.e2eRouteIds)
    ? workspace.step6.e2eRouteIds
    : {};
  const existing = String(workspace.step6.e2eRouteIds[taskId] || "").trim();
  if (existing) {
    return existing;
  }

  const routeId = createId("e2e-route");
  workspace.step6.e2eRouteIds[taskId] = routeId;
  return routeId;
}

export function setStep6RouteModel(workspace, taskId, model) {
  if (!getStep6RouteContext(workspace, taskId) || !isPlainObject(model)) {
    return false;
  }

  workspace.step6 ||= {};
  workspace.step6.e2eRoutes = isPlainObject(workspace.step6.e2eRoutes) ? workspace.step6.e2eRoutes : {};
  const routeId = getStep6RouteId(workspace, taskId);
  const reconciled = reconcileStep6RouteModel(workspace, taskId, model);
  workspace.step6.e2eRoutes[taskId] = cloneJson(reconciled);
  reconcileFindingSourceStatus(workspace, routeId, reconciled.findings);
  return true;
}

export function getStep6FindingCandidates(workspace) {
  const candidates = [];
  const items = Array.isArray(workspace?.implementation?.items) ? workspace.implementation.items : [];
  const convertedSources = new Set(items
    .filter((item) => item?.source?.kind === "e2e-finding")
    .map((item) => `${item.source.routeId}|${item.source.findingId}`));

  for (const task of workspace?.step3?.successCriticalTasks || []) {
    const model = getStep6RouteModel(workspace, task.id);
    if (!model) {
      continue;
    }
    const routeId = getStep6RouteId(workspace, task.id);
    for (const finding of model.findings) {
      candidates.push({
        routeId,
        taskId: task.id,
        sctNumber: formatSctNumber(task.number),
        sctTitle: task.title || "Untitled SCT",
        routeName: model.meta?.name || "E2E route",
        finding: cloneJson(finding),
        affectedElement: describeStep6FindingTarget(model, finding.target),
        converted: convertedSources.has(`${routeId}|${finding.id}`)
      });
    }
  }

  return candidates;
}

export function createImplementationItemFromFinding(workspace, routeId, findingId) {
  const candidate = getStep6FindingCandidates(workspace)
    .find((item) => item.routeId === routeId && item.finding.id === findingId);
  if (!candidate || candidate.converted) {
    return null;
  }

  const item = createImplementationItem();
  item.challenge = candidate.finding.note || `${formatFindingCategory(candidate.finding.category)} at ${candidate.affectedElement}`;
  item.requirement = `${candidate.sctNumber} · ${candidate.sctTitle} · ${candidate.affectedElement}`;
  item.source = {
    kind: "e2e-finding",
    routeId: candidate.routeId,
    findingId: candidate.finding.id
  };
  item.sourceStatus = "active";
  workspace.implementation.items.push(item);
  return item;
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

export function createStep7RepresentationModel() {
  return {
    vessels: [],
    rasic: {},
    aspects: {},
    metricDefs: [],
    artifactDefs: [],
    toolDefs: [],
    decisionDefs: [],
    descriptions: {
      roles: {},
      functions: {},
      meetings: {}
    },
    participations: [],
    vesselAspects: {},
    meetings: {},
    meetingConnections: [],
    warnings: {},
    orgHierarchy: {},
    orgChart: {
      notes: ""
    },
    roles: [],
    orgChartNotes: "",
    representationNotes: ""
  };
}

export function createStep7Vessel(type = "role", name = "") {
  const normalizedType = normalizeStep7VesselType(type);
  return {
    id: createId("vessel"),
    type: normalizedType,
    name: String(name || ""),
    purpose: "",
    scope: "",
    prov: "workshop",
    state: "draft",
    sys: "",
    alg: false,
    ...(normalizedType === "role" ? { fte: 0 } : {})
  };
}

export function createStep7AspectItem(text = "", extras = {}) {
  const source = isPlainObject(extras) ? extras : {};
  const item = {
    id: String(source.id || createId("aspect-item")),
    text: String(source.text ?? text ?? "")
  };

  for (const key of ["target", "frequency", "source", "owner", "note"]) {
    const value = String(source[key] || "").trim();
    if (value) {
      item[key] = value;
    }
  }

  return item;
}

export function createStep7MeetingRecord(id = createId("meeting")) {
  return {
    id: String(id || createId("meeting")),
    name: "",
    type: "meeting",
    scope: {
      level: "",
      unitId: "shared"
    },
    sys: "",
    purpose: "",
    intendedResult: "",
    cadence: createStep7MeetingCadence(),
    cad: createStep7CharterCadence(),
    state: "draft",
    alg: false,
    contribs: [],
    steering: [],
    agenda: "",
    agendaItems: [],
    participants: [],
    participations: [],
    inputs: [],
    outputs: [],
    tools: [],
    measures: [],
    metricUses: [],
    rights: [],
    decisionRights: [],
    decisionModes: [],
    loops: [],
    loopRefs: [],
    escalation: [],
    escalationPath: null,
    outputRefs: []
  };
}

export function createImplementationItem() {
  return {
    id: createId("implementation"),
    challenge: "",
    requirement: "",
    responsible: "",
    dueDate: "",
    status: "Open",
    source: null,
    sourceStatus: ""
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
  normalizeStep1OperativeUnits(merged);
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

  normalizeStep5Assignments(merged);
  normalizeStep7Representation(merged);

  if (!Array.isArray(merged.step6.communicationChannels) || merged.step6.communicationChannels.length === 0) {
    merged.step6.communicationChannels = communicationLoops.map((loop) => createCommunicationChannel(loop));
  }
  merged.step6.channelVarietyModel = reconcileChannelVarietyModel(
    merged,
    candidate?.step6?.channelVarietyModel,
    candidate?.step6?.communicationChannels || merged.step6.communicationChannels
  );
  if (!isPlainObject(merged.step6.e2eRoutes)) {
    merged.step6.e2eRoutes = {};
  }
  if (!isPlainObject(merged.step6.e2eRouteIds)) {
    merged.step6.e2eRouteIds = {};
  }
  if (!isPlainObject(merged.step6.detachedRoutes)) {
    merged.step6.detachedRoutes = {};
  }
  normalizeStep6Routes(merged);
  normalizeImplementationItems(merged);

  return merged;
}

function normalizeStep6Routes(workspace) {
  const taskIds = new Set(workspace.step3.successCriticalTasks.map((task) => task.id));
  for (const taskId of Object.keys(workspace.step6.e2eRoutes)) {
    const model = workspace.step6.e2eRoutes[taskId];
    if (!isPlainObject(model)) {
      delete workspace.step6.e2eRoutes[taskId];
      delete workspace.step6.e2eRouteIds[taskId];
      continue;
    }
    if (!taskIds.has(taskId)) {
      const routeId = String(workspace.step6.e2eRouteIds[taskId] || "").trim() || createId("e2e-route");
      workspace.step6.detachedRoutes[routeId] = {
        routeId,
        formerTaskId: taskId,
        formerTaskNumber: "",
        formerTaskTitle: String(model.meta?.sct || "Removed SCT"),
        reason: "missing-sct",
        model: cloneJson({
          ...model,
          findings: Array.isArray(model.findings) ? model.findings : []
        })
      };
      markRouteSources(workspace, routeId, "source-detached");
      delete workspace.step6.e2eRoutes[taskId];
      delete workspace.step6.e2eRouteIds[taskId];
      continue;
    }
    getStep6RouteId(workspace, taskId);
    workspace.step6.e2eRoutes[taskId] = reconcileStep6RouteModel(
      workspace,
      taskId,
      workspace.step6.e2eRoutes[taskId]
    );
  }
}

function normalizeImplementationItems(workspace) {
  workspace.implementation.items = workspace.implementation.items.map((item) => ({
    ...createImplementationItem(),
    ...(isPlainObject(item) ? item : {}),
    source: isPlainObject(item?.source) ? cloneJson(item.source) : null,
    sourceStatus: String(item?.sourceStatus || "")
  }));

  for (const task of workspace.step3.successCriticalTasks) {
    const model = workspace.step6.e2eRoutes[task.id];
    if (!isPlainObject(model)) {
      continue;
    }
    reconcileFindingSourceStatus(
      workspace,
      getStep6RouteId(workspace, task.id),
      Array.isArray(model.findings) ? model.findings : []
    );
  }
  reconcileChannelVarietySourceStatus(workspace, workspace.step6.channelVarietyModel);
}

function preserveMergedStep6Routes(workspace, survivor, removedTasks) {
  workspace.step6 ||= {};
  workspace.step6.e2eRoutes = isPlainObject(workspace.step6.e2eRoutes) ? workspace.step6.e2eRoutes : {};
  workspace.step6.e2eRouteIds = isPlainObject(workspace.step6.e2eRouteIds) ? workspace.step6.e2eRouteIds : {};
  workspace.step6.detachedRoutes = isPlainObject(workspace.step6.detachedRoutes) ? workspace.step6.detachedRoutes : {};

  let survivorModel = workspace.step6.e2eRoutes[survivor.id];
  let survivorRouteId = survivorModel ? getStep6RouteId(workspace, survivor.id) : "";

  for (const removedTask of removedTasks) {
    const model = workspace.step6.e2eRoutes[removedTask.id];
    if (!isPlainObject(model)) {
      delete workspace.step6.e2eRouteIds[removedTask.id];
      continue;
    }
    const routeId = getStep6RouteId(workspace, removedTask.id);
    if (!survivorModel) {
      survivorModel = cloneJson(model);
      survivorRouteId = routeId;
      workspace.step6.e2eRoutes[survivor.id] = survivorModel;
      workspace.step6.e2eRouteIds[survivor.id] = routeId;
    } else {
      workspace.step6.detachedRoutes[routeId] = {
        routeId,
        formerTaskId: removedTask.id,
        formerTaskNumber: formatSctNumber(removedTask.number),
        formerTaskTitle: removedTask.title || "Untitled SCT",
        reason: "sct-merge",
        model: cloneJson(model)
      };
      markRouteSources(workspace, routeId, "source-detached");
    }
    delete workspace.step6.e2eRoutes[removedTask.id];
    delete workspace.step6.e2eRouteIds[removedTask.id];
  }

  if (survivorModel) {
    survivorModel.meta = {
      ...(isPlainObject(survivorModel.meta) ? survivorModel.meta : {}),
      sctId: survivor.id,
      sct: survivor.title || "Untitled SCT"
    };
    workspace.step6.e2eRoutes[survivor.id] = survivorModel;
    workspace.step6.e2eRouteIds[survivor.id] = survivorRouteId || createId("e2e-route");
  }

  for (const [routeTaskId, model] of Object.entries(workspace.step6.e2eRoutes)) {
    if (!isPlainObject(model)) {
      continue;
    }
    for (const removedTask of removedTasks) {
      remapStep6RouteSctReferences(model, removedTask.id, survivor.id);
    }
    model.meta = {
      ...(isPlainObject(model.meta) ? model.meta : {}),
      relatedSctIds: normalizeStep6RelatedSctIds(model.meta?.relatedSctIds, routeTaskId)
    };
  }
}

function normalizeStep6RelatedSctIds(value, primarySctId = "") {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value
    .map((id) => String(id || "").trim())
    .filter((id) => id && id !== primarySctId))];
}

function remapStep6RouteSctReferences(model, fromSctId, toSctId) {
  if (!isPlainObject(model) || !fromSctId || !toSctId || fromSctId === toSctId) {
    return;
  }

  const contributionPrefix = `${fromSctId}|`;
  model.nodes = Array.isArray(model.nodes)
    ? model.nodes.map((node) => {
        if (!isPlainObject(node)) {
          return node;
        }
        const remapped = { ...node };
        if (String(remapped.contribSctId || "") === fromSctId) {
          remapped.contribSctId = toSctId;
        }
        if (String(remapped.contribId || "").startsWith(contributionPrefix)) {
          remapped.contribId = `${toSctId}|${String(remapped.contribId).slice(contributionPrefix.length)}`;
        }
        return remapped;
      })
    : [];

  if (isPlainObject(model.meta)) {
    if (String(model.meta.primarySctId || "") === fromSctId) {
      model.meta.primarySctId = toSctId;
    }
    if (String(model.meta.sctId || "") === fromSctId) {
      model.meta.sctId = toSctId;
    }
    model.meta.relatedSctIds = normalizeStep6RelatedSctIds(
      (model.meta.relatedSctIds || []).map((id) => id === fromSctId ? toSctId : id),
      model.meta.primarySctId || model.meta.sctId || ""
    );
  }
}

function isValidStep6Finding(finding) {
  return isPlainObject(finding)
    && String(finding.id || "").trim() !== ""
    && isPlainObject(finding.target)
    && ["node", "link"].includes(finding.target.type)
    && String(finding.target.id || "").trim() !== "";
}

function reconcileFindingSourceStatus(workspace, routeId, findings) {
  if (!routeId) {
    return;
  }
  const findingIds = new Set((Array.isArray(findings) ? findings : []).map((finding) => finding.id));
  for (const item of workspace?.implementation?.items || []) {
    if (item?.source?.kind !== "e2e-finding" || item.source.routeId !== routeId) {
      continue;
    }
    item.sourceStatus = findingIds.has(item.source.findingId) ? "active" : "source-removed";
  }
}

function reconcileChannelVarietySourceStatus(workspace, model) {
  const weakSources = new Set();
  for (const loop of Array.isArray(model?.loops) ? model.loops : []) {
    (Array.isArray(loop.ratings) ? loop.ratings : []).forEach((rating, criterionIndex) => {
      if (Number(rating) === 1) {
        weakSources.add(`${loop.id}|${criterionIndex}`);
      }
    });
  }

  for (const item of workspace?.implementation?.items || []) {
    if (item?.source?.kind !== "channel-variety-weakness") {
      continue;
    }
    const sourceKey = `${item.source.loopId}|${Number(item.source.criterionIndex)}`;
    item.sourceStatus = weakSources.has(sourceKey) ? "active" : "source-resolved";
  }
}

function markRouteSources(workspace, routeId, status) {
  for (const item of workspace?.implementation?.items || []) {
    if (item?.source?.kind === "e2e-finding" && item.source.routeId === routeId) {
      item.sourceStatus = status;
    }
  }
}

function describeStep6FindingTarget(model, target) {
  if (target?.type === "node") {
    const node = model.nodes.find((item) => item.id === target.id);
    return node?.label || `Step ${target.id}`;
  }
  const link = model.links.find((item) => item.id === target?.id);
  if (!link) {
    return `Connection ${target?.id || ""}`.trim();
  }
  const from = model.nodes.find((item) => item.id === link.from)?.label || link.from;
  const to = model.nodes.find((item) => item.id === link.to)?.label || link.to;
  return `${from} -> ${to}`;
}

function formatFindingCategory(category) {
  return String(category || "finding")
    .split("-")
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : "")
    .join(" ");
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
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

function normalizeStep1OperativeUnits(workspace) {
  workspace.step1.operativeUnits = (Array.isArray(workspace?.step1?.operativeUnits) ? workspace.step1.operativeUnits : [])
    .map((unit) => {
      if (typeof unit === "string") {
        return createOperativeUnit(unit, "");
      }

      const saved = isPlainObject(unit) ? unit : {};
      return {
        ...createOperativeUnit(),
        ...saved,
        id: saved.id || createId("unit"),
        name: String(saved.name || saved.title || saved.label || ""),
        description: String(saved.description || saved.scope || saved.kind || ""),
        notes: String(saved.notes || "")
      };
    });
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

  normalizeStep5Assignments(workspace);
  normalizeStep7Representation(workspace);
}

function normalizeStep5Assignments(workspace) {
  workspace.step5 = isPlainObject(workspace.step5) ? workspace.step5 : {};
  workspace.step5.includeSystem1 = workspace.step5.includeSystem1 !== false;
  const savedAssignments = isPlainObject(workspace.step5.assignments) ? workspace.step5.assignments : {};
  const validKeys = new Set(getStep5InScopeContributions(workspace).map((contribution) => contribution.key));

  const normalized = createVsmSystemAssignments();
  const assignedKeys = new Set();
  const migrationOrder = ["2", "3", "3*", "4", "5", "1"];

  for (const systemId of migrationOrder) {
    const keys = [...new Set(Array.isArray(savedAssignments[systemId]) ? savedAssignments[systemId] : [])]
      .filter((key) => validKeys.has(key));
    for (const key of keys) {
      if (!assignedKeys.has(key)) {
        normalized[systemId].push(key);
        assignedKeys.add(key);
      }
    }
  }

  workspace.step5.assignments = normalized;
}

function duplicateStep5TaskAssignments(workspace, sourceTaskId, splitTaskId) {
  normalizeStep5Assignments(workspace);
  const sourcePrefix = `${sourceTaskId}|`;
  for (const systemId of vsmSystems) {
    const duplicateKeys = workspace.step5.assignments[systemId]
      .filter((key) => key.startsWith(sourcePrefix))
      .map((key) => getStep5ContributionKey(splitTaskId, key.slice(sourcePrefix.length)));
    workspace.step5.assignments[systemId] = [...new Set([
      ...workspace.step5.assignments[systemId],
      ...duplicateKeys
    ])];
  }
}

function mergeStep5TaskAssignments(workspace, survivorTaskId, removedIds) {
  normalizeStep5Assignments(workspace);
  for (const systemId of vsmSystems) {
    const rewired = workspace.step5.assignments[systemId].map((key) => {
      const [taskId, organizationId] = key.split("|");
      return removedIds.has(taskId)
        ? getStep5ContributionKey(survivorTaskId, organizationId)
        : key;
    });
    workspace.step5.assignments[systemId] = [...new Set(rewired)];
  }
  normalizeStep5Assignments(workspace);
}

function normalizeStep7Representation(workspace) {
  const legacy = isPlainObject(workspace.step7) ? workspace.step7 : {};
  const base = createStep7RepresentationModel();
  workspace.step7 = {
    ...base,
    ...legacy,
    descriptions: {
      ...base.descriptions,
      ...(isPlainObject(legacy.descriptions) ? legacy.descriptions : {})
    },
    orgChart: {
      ...base.orgChart,
      ...(isPlainObject(legacy.orgChart) ? legacy.orgChart : {})
    }
  };

  workspace.step7.roles = Array.isArray(legacy.roles)
    ? legacy.roles.filter(isPlainObject).map((role) => {
      if (!isPlainObject(role)) {
        return createRole();
      }
      const normalized = {
        ...createRole(),
        ...role,
        name: String(role.name || "").trim(),
        linkedTaskIds: Array.isArray(role.linkedTaskIds) ? [...new Set(role.linkedTaskIds.map(String))] : []
      };
      Object.assign(role, normalized);
      return role;
    }).filter((role) => role.name || role.linkedTaskIds.length)
    : [];

  const vessels = Array.isArray(legacy.vessels)
    ? legacy.vessels.filter((vessel) => isPlainObject(vessel) && String(vessel.name || "").trim())
    : [];
  const vesselIds = new Set(vessels.map((vessel) => String(vessel.id || "")).filter(Boolean));
  for (const role of workspace.step7.roles) {
    if (role.id && role.name && !vesselIds.has(role.id)) {
      vessels.push({
        id: role.id,
        type: normalizeStep7VesselType(role.type),
        name: String(role.name || ""),
        purpose: String(role.purpose || ""),
        scope: "",
        prov: "legacy-role",
        state: "draft",
        sys: "",
        alg: false,
        ...normalizeStep7VesselFte(role),
        legacyRoleId: role.id
      });
      vesselIds.add(role.id);
    }
  }

  workspace.step7.vessels = vessels.map((vessel) => ({
    id: String(vessel.id || createId("vessel")),
    type: normalizeStep7VesselType(vessel.type),
    name: String(vessel.name || "").trim(),
    purpose: String(vessel.purpose || ""),
    scope: String(vessel.scope || ""),
    prov: String(vessel.prov || "workshop"),
    state: String(vessel.state || "draft"),
    sys: String(vessel.sys || ""),
    alg: vessel.alg === true,
    ...normalizeStep7VesselFte(vessel),
    ...(vessel.legacyRoleId ? { legacyRoleId: String(vessel.legacyRoleId) } : {})
  })).filter((vessel) => vessel.name);

  const taskIds = new Set(workspace.step3.successCriticalTasks.map((task) => task.id));
  workspace.step7.aspects = normalizeStep7Aspects(legacy.aspects, taskIds);
  migrateStep3OptionalDetailsToStep7Aspects(workspace);
  workspace.step7.metricDefs = normalizeStep7DefinitionPool(legacy.metricDefs);
  workspace.step7.artifactDefs = normalizeStep7DefinitionPool(legacy.artifactDefs);
  workspace.step7.toolDefs = normalizeStep7DefinitionPool(legacy.toolDefs);
  workspace.step7.decisionDefs = normalizeStep7DefinitionPool(legacy.decisionDefs);
  workspace.step7.meetings = normalizeStep7Meetings(legacy.meetings, workspace.step7.vessels);
  workspace.step7.descriptions.roles = isPlainObject(workspace.step7.descriptions.roles) ? workspace.step7.descriptions.roles : {};
  workspace.step7.descriptions.functions = isPlainObject(workspace.step7.descriptions.functions) ? workspace.step7.descriptions.functions : {};
  workspace.step7.descriptions.meetings = isPlainObject(workspace.step7.descriptions.meetings) ? workspace.step7.descriptions.meetings : {};
  workspace.step7.participations = Array.isArray(legacy.participations) ? cloneJson(legacy.participations.filter(isPlainObject)) : [];
  workspace.step7.vesselAspects = {};
  workspace.step7.meetingConnections = Array.isArray(legacy.meetingConnections) ? cloneJson(legacy.meetingConnections.filter(isPlainObject)) : [];

  const validContributionIds = new Set(getStep7SctContributions(workspace).map((contribution) => contribution.id));
  const validVesselIds = new Set(workspace.step7.vessels.map((vessel) => vessel.id));
  workspace.step7.orgHierarchy = normalizeStep7OrgHierarchy(
    legacy.orgHierarchy,
    getStep7OrgHierarchyNodeIds(workspace, validVesselIds)
  );
  workspace.step7.vesselAspects = normalizeStep7VesselAspects(legacy.vesselAspects, validVesselIds);
  workspace.step7.rasic = normalizeStep7Rasic(legacy.rasic, validContributionIds, validVesselIds);
  workspace.step7.warnings = normalizeStep7Warnings(legacy.warnings, validContributionIds);
  workspace.step7.orgChart.notes = String(workspace.step7.orgChart.notes || legacy.orgChartNotes || "");
  workspace.step7.orgChartNotes = String(legacy.orgChartNotes || workspace.step7.orgChart.notes || "");
  workspace.step7.representationNotes = String(legacy.representationNotes || "");
}

function getStep7OrgHierarchyNodeIds(workspace, vesselIds = new Set()) {
  return new Set([
    ...vesselIds,
    ...getRecursionOrganizations(workspace).map((unit) => unit.id),
    ...(Array.isArray(workspace?.step1?.operativeUnits)
      ? workspace.step1.operativeUnits.map((unit) => String(unit?.id || "")).filter(Boolean)
      : [])
  ]);
}

function normalizeStep7OrgHierarchy(value, validNodeIds) {
  if (!isPlainObject(value)) {
    return {};
  }

  const sanitized = {};
  for (const [rawNodeId, rawPlacement] of Object.entries(value)) {
    if (!isPlainObject(rawPlacement)) {
      continue;
    }

    const nodeId = String(rawNodeId || "").trim();
    if (!nodeId) {
      continue;
    }

    const numericOrder = Number(rawPlacement.order);
    const placement = {
      parent: String(rawPlacement.parent ?? "root").trim() || "root",
      order: Number.isFinite(numericOrder) ? numericOrder : 0
    };
    if (rawPlacement.slot !== undefined && String(rawPlacement.slot).trim()) {
      placement.slot = String(rawPlacement.slot).trim();
    }
    sanitized[nodeId] = placement;
  }

  const referencedParentIds = new Set(
    Object.values(sanitized).map((placement) => placement.parent).filter(Boolean)
  );
  return Object.fromEntries(
    Object.entries(sanitized).filter(([nodeId]) => (
      nodeId === "root" || validNodeIds.has(nodeId) || referencedParentIds.has(nodeId)
    ))
  );
}

function normalizeStep7VesselType(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("meeting") || value.includes("committee") || value.includes("forum")) {
    return "meeting";
  }

  if (value.includes("function") || value.includes("department") || value.includes("unit")) {
    return "function";
  }

  return "role";
}

function normalizeStep7VesselFte(vessel) {
  const fte = Number(vessel?.fte);
  return normalizeStep7VesselType(vessel?.type) === "role" && Number.isFinite(fte) && fte > 0
    ? { fte }
    : {};
}

function normalizeStep7Aspects(aspects, taskIds) {
  if (!isPlainObject(aspects)) {
    return {};
  }

  const normalized = {};
  for (const [taskId, bundle] of Object.entries(aspects)) {
    if (!taskIds.has(taskId) || !isPlainObject(bundle)) {
      continue;
    }

    normalized[taskId] = normalizeStep7AspectBundle(bundle);
  }

  return normalized;
}

function migrateStep3OptionalDetailsToStep7Aspects(workspace) {
  for (const task of workspace.step3.successCriticalTasks) {
    const bundle = ensureStep7AspectBundle(workspace, task.id);
    for (const [field, aspectKind] of Object.entries(successCriticalTaskAspectFields)) {
      const legacyValue = String(task[field] || "").trim();
      const items = bundle[aspectKind];
      const dedicatedIndex = items.findIndex((item) => item.id === step3AspectItemId(task.id, aspectKind));
      const matchingIndex = legacyValue
        ? items.findIndex((item) => item.text.trim() === legacyValue)
        : -1;

      if (legacyValue && dedicatedIndex < 0 && matchingIndex < 0) {
        items.unshift(createStep7AspectItem(legacyValue, {
          id: step3AspectItemId(task.id, aspectKind)
        }));
      }
    }
  }

  syncStep3OptionalDetailsFromStep7Aspects(workspace);
}

function syncStep3OptionalDetailsFromStep7Aspects(workspace) {
  for (const task of workspace.step3.successCriticalTasks) {
    const bundle = ensureStep7AspectBundle(workspace, task.id);
    for (const [field, aspectKind] of Object.entries(successCriticalTaskAspectFields)) {
      const items = bundle[aspectKind];
      const primaryIndex = findPrimaryStep3AspectIndex(items, task.id, aspectKind, String(task[field] || "").trim());
      task[field] = primaryIndex >= 0 ? items[primaryIndex].text : "";
    }
  }
}

function ensureStep7AspectBundle(workspace, taskId) {
  workspace.step7.aspects[taskId] ||= normalizeStep7AspectBundle({});
  return workspace.step7.aspects[taskId];
}

function findPrimaryStep3AspectIndex(items, taskId, aspectKind, currentValue = "") {
  const dedicatedIndex = items.findIndex((item) => item.id === step3AspectItemId(taskId, aspectKind));
  if (dedicatedIndex >= 0) {
    return dedicatedIndex;
  }

  const matchingIndex = currentValue
    ? items.findIndex((item) => item.text.trim() === currentValue)
    : -1;
  return matchingIndex >= 0 ? matchingIndex : (items.length ? 0 : -1);
}

function step3AspectItemId(taskId, aspectKind) {
  return `step3-${aspectKind}-${taskId}`;
}

function normalizeStep7VesselAspects(vesselAspects, validVesselIds) {
  if (!isPlainObject(vesselAspects)) {
    return {};
  }

  const normalized = {};
  for (const [vesselId, bundle] of Object.entries(vesselAspects)) {
    if (validVesselIds.has(vesselId) && isPlainObject(bundle)) {
      normalized[vesselId] = normalizeStep7AspectBundle(bundle);
    }
  }

  return normalized;
}

function normalizeStep7AspectBundle(bundle) {
  const normalized = {};
  for (const kind of step7AspectKinds) {
    const source = Array.isArray(bundle?.[kind])
      ? bundle[kind]
      : typeof bundle?.[kind] === "string"
        ? [bundle[kind]]
        : [];
    normalized[kind] = source
      .map((item) => isPlainObject(item) ? createStep7AspectItem(item.text || "", item) : createStep7AspectItem(item))
      .filter((item) => item.text.trim());
  }

  return normalized;
}

function normalizeStep7DefinitionPool(pool) {
  if (!Array.isArray(pool)) {
    return [];
  }

  const byId = new Map();
  for (const item of pool) {
    if (!isPlainObject(item)) {
      continue;
    }

    const text = String(item.text || item.label || item.name || "").trim();
    if (!text) {
      continue;
    }

    const id = String(item.id || createId("step7-def"));
    byId.set(id, {
      ...cloneJson(item),
      id,
      text,
      reuseCount: normalizeReuseCount(item.reuseCount)
    });
  }

  return [...byId.values()];
}

function normalizeReuseCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function getStep7ReuseDefinitions(workspace, aspectKind, registryKey, options = {}) {
  const byId = new Map();
  const scopedSctIds = options?.sctIds instanceof Set
    ? options.sctIds
    : Array.isArray(options?.sctIds) ? new Set(options.sctIds) : null;
  const registryDefinitions = normalizeStep7DefinitionPool(workspace.step7?.[registryKey]);
  const registryById = new Map(registryDefinitions.map((definition) => [definition.id, definition]));
  const remember = (item, increment = 0) => {
    if (!isPlainObject(item)) {
      return;
    }

    const text = String(item.text || item.label || item.name || "").trim();
    const id = String(item.id || item.ref || item.defRef || item.definitionRef || "");
    if (!id || !text) {
      return;
    }

    const current = byId.get(id) || {
      ...(registryById.get(id) ? cloneJson(registryById.get(id)) : {}),
      ...cloneJson(item),
      id,
      text,
      reuseCount: 0
    };
    current.text = current.text || text;
    current.reuseCount = normalizeReuseCount(current.reuseCount) + increment;
    byId.set(id, current);
  };

  if (!scopedSctIds) {
    for (const definition of registryDefinitions) {
      remember(definition, normalizeReuseCount(definition.reuseCount));
    }
  }

  for (const [sctId, bundle] of Object.entries(isPlainObject(workspace.step7?.aspects) ? workspace.step7.aspects : {})) {
    if (scopedSctIds && !scopedSctIds.has(sctId)) {
      continue;
    }
    for (const item of Array.isArray(bundle?.[aspectKind]) ? bundle[aspectKind] : []) {
      remember(item, 1);
    }
  }

  if (!scopedSctIds) {
    for (const bundle of Object.values(isPlainObject(workspace.step7?.vesselAspects) ? workspace.step7.vesselAspects : {})) {
      for (const item of Array.isArray(bundle?.[aspectKind]) ? bundle[aspectKind] : []) {
        remember(item, 1);
      }
    }
  }

  for (const meeting of Object.values(isPlainObject(workspace.step7?.meetings) ? workspace.step7.meetings : {})) {
    const candidates = aspectKind === "kpis"
      ? [...(Array.isArray(meeting.metricUses) ? meeting.metricUses : []), ...(Array.isArray(meeting.measures) ? meeting.measures : [])]
      : aspectKind === "artifacts"
        ? [...(Array.isArray(meeting.inputs) ? meeting.inputs : []), ...(Array.isArray(meeting.outputs) ? meeting.outputs : [])]
        : Array.isArray(meeting.tools) ? meeting.tools : [];
    for (const item of candidates) {
      const id = String(item?.definitionRef || item?.defRef || item?.ref || item?.id || "");
      const existing = id ? byId.get(id) : null;
      if (existing) {
        existing.reuseCount = normalizeReuseCount(existing.reuseCount) + 1;
      }
    }
  }

  return [...byId.values()].map((item) => ({
    ...cloneJson(item),
    reuseCount: normalizeReuseCount(item.reuseCount)
  }));
}

function getStep7DecisionDefinitions(workspace) {
  const byId = new Map();
  for (const definition of normalizeStep7DefinitionPool(workspace.step7?.decisionDefs)) {
    byId.set(definition.id, definition);
  }

  for (const meeting of Object.values(isPlainObject(workspace.step7?.meetings) ? workspace.step7.meetings : {})) {
    for (const right of [
      ...(Array.isArray(meeting.decisionRights) ? meeting.decisionRights : []),
      ...(Array.isArray(meeting.rights) ? meeting.rights : [])
    ]) {
      const text = String(right?.decision?.text || right?.decision || right?.title || "").trim();
      if (!text) {
        continue;
      }
      const id = String(right?.decision?.ref || right?.decisionDefRef || right?.rightId || right?.id || `decision:${text.toLowerCase()}`);
      const current = byId.get(id) || { id, text, reuseCount: 0 };
      current.reuseCount = normalizeReuseCount(current.reuseCount) + 1;
      byId.set(id, current);
    }
  }

  return [...byId.values()];
}

function formatStep7EditorLoop(loop) {
  return {
    id: String(loop.id || ""),
    label: String(loop.label || ""),
    system: String(loop.sys || loop.system || ""),
    sys: String(loop.sys || loop.system || ""),
    kind: String(loop.kind || ""),
    vsmChannel: String(loop.vsmChannel || "")
  };
}

function normalizeStep7Meetings(meetings, vessels = [], options = {}) {
  const normalized = {};
  const meetingVessels = Array.isArray(vessels)
    ? vessels.filter((vessel) => vessel?.type === "meeting")
    : [];
  const vesselById = new Map(meetingVessels.map((vessel) => [String(vessel.id), vessel]));

  if (isPlainObject(meetings)) {
    for (const [key, meeting] of Object.entries(meetings)) {
      if (!isPlainObject(meeting)) {
        continue;
      }

      const id = String(meeting.id || key || createId("meeting"));
      normalized[id] = normalizeStep7MeetingRecord(meeting, id, vesselById.get(id));
    }
  }

  if (options.includeVesselDefaults) {
    for (const vessel of meetingVessels) {
      const id = String(vessel.id || createId("meeting"));
      normalized[id] = normalizeStep7MeetingRecord(normalized[id] || {}, id, vessel);
    }
  }

  return normalized;
}

function normalizeStep7MeetingRecord(meeting, id, vessel = null) {
  const source = isPlainObject(meeting) ? cloneJson(meeting) : {};
  const cadence = normalizeStep7MeetingCadence(source.cadence ?? source.cad);
  const cad = normalizeStep7CharterCadence(source.cad ?? source.cadence);
  const participants = normalizeStep7MeetingParticipants(source.participants ?? source.participations);
  const participations = normalizeStep7MeetingParticipations(source.participations ?? source.participants);
  const steering = normalizeStep7MeetingCollection(source.steering ?? source.contribs);
  const contribs = normalizeStep7MeetingContribs(source.contribs ?? source.steering);
  const measures = normalizeStep7MeetingMeasures(source.measures ?? source.metricUses);
  const metricUses = normalizeStep7MetricUses(source.metricUses ?? source.measures);
  const rights = normalizeStep7DecisionRights(source.rights ?? source.decisionRights);
  const decisionRights = normalizeStep7DecisionRights(source.decisionRights ?? source.rights);
  const loops = normalizeStep7MeetingCollection(source.loops ?? source.loopRefs);
  const loopRefs = normalizeStep7LoopRefs(source.loopRefs ?? source.loops);
  const normalized = {
    ...createStep7MeetingRecord(id),
    ...source,
    id: String(id || source.id || vessel?.id || createId("meeting")),
    name: String(source.name || vessel?.name || ""),
    type: "meeting",
    scope: normalizeStep7MeetingScope(source.scope, vessel),
    sys: String(source.sys || vessel?.sys || ""),
    purpose: String(source.purpose || vessel?.purpose || ""),
    intendedResult: String(source.intendedResult || ""),
    cadence,
    cad,
    state: String(source.state || vessel?.state || "draft"),
    alg: source.alg === true || vessel?.alg === true,
    contribs,
    steering,
    agenda: normalizeStep7MeetingAgendaText(source.agenda ?? source.agendaText),
    agendaItems: normalizeStep7MeetingAgendaItems(source.agendaItems ?? source.agenda),
    participants,
    participations,
    inputs: normalizeStep7MeetingCollection(source.inputs),
    outputs: normalizeStep7MeetingCollection(source.outputs),
    tools: normalizeStep7MeetingCollection(source.tools),
    measures,
    metricUses,
    rights,
    decisionRights,
    decisionModes: normalizeStep7MeetingCollection(source.decisionModes),
    loops,
    loopRefs,
    escalation: normalizeStep7MeetingCollection(source.escalation),
    escalationPath: normalizeStep7EscalationPath(source.escalationPath ?? source.escalation),
    outputRefs: normalizeStep7OutputRefs(source.outputRefs)
  };

  return normalized;
}

function createStep7MeetingCadence() {
  return {
    kind: "rhythmic",
    every: "",
    unit: "",
    day: "",
    durationMin: "",
    label: ""
  };
}

function createStep7CharterCadence() {
  return {
    f: "",
    n: 1,
    d: 0
  };
}

function normalizeStep7MeetingScope(scope, vessel = null) {
  if (isPlainObject(scope)) {
    return {
      ...cloneJson(scope),
      level: String(scope.level || vessel?.scope || ""),
      unitId: String(scope.unitId || scope.unit || "shared")
    };
  }

  return {
    level: String(scope || vessel?.scope || ""),
    unitId: "shared"
  };
}

function normalizeStep7MeetingCadence(cadence) {
  const base = createStep7MeetingCadence();
  if (typeof cadence === "string") {
    return {
      ...base,
      label: cadence.trim()
    };
  }

  if (!isPlainObject(cadence)) {
    return base;
  }

  const frequencyLabel = String(cadence.f || cadence.frequency || cadence.label || cadence.text || "").trim();
  const kindCandidate = String(cadence.kind || cadence.mode || frequencyLabel).toLowerCase();
  const kind = kindCandidate === "one-off" || kindCandidate === "oneoff"
    ? "one-off"
    : kindCandidate === "on-signal" || kindCandidate === "on signal" || kindCandidate === "signal"
      ? "on-signal"
      : "rhythmic";
  const durationMin = cadence.durationMin ?? cadence.d ?? cadence.duration?.minutes ?? cadence.duration ?? "";
  const every = cadence.every ?? cadence.n ?? cadence.interval ?? "";

  return {
    ...cloneJson(cadence),
    kind,
    every: String(every ?? ""),
    unit: String(cadence.unit ?? ""),
    day: String(cadence.day ?? ""),
    durationMin: String(durationMin ?? ""),
    label: String(cadence.label || cadence.text || cadence.f || cadence.frequency || "")
  };
}

function normalizeStep7CharterCadence(cadence) {
  const base = createStep7CharterCadence();
  if (typeof cadence === "string") {
    return {
      ...base,
      f: cadence.trim()
    };
  }

  if (!isPlainObject(cadence)) {
    return base;
  }

  const frequency = cadence.f ?? cadence.frequency ?? cadence.label ?? cadence.unit ?? "";
  const interval = cadence.n ?? cadence.interval ?? cadence.every ?? 1;
  const duration = cadence.d ?? cadence.duration ?? cadence.durationMin ?? cadence.duration?.minutes ?? 0;
  return {
    ...cloneJson(cadence),
    f: String(frequency || ""),
    n: Number.isFinite(Number(interval)) ? Number(interval) : 1,
    d: Number.isFinite(Number(duration)) ? Number(duration) : 0
  };
}

function normalizeStep7MeetingAgendaText(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => isPlainObject(item) ? item.text || item.title || item.label || "" : item)
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join("\n");
  }

  if (isPlainObject(value) && Array.isArray(value.items)) {
    return value.items
      .map((item) => isPlainObject(item) ? item.text || item.title || item.label || "" : item)
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function normalizeStep7MeetingAgendaItems(value) {
  if (Array.isArray(value)) {
    return cloneJson(value.filter((item) => (
      isPlainObject(item)
      || String(item ?? "").trim()
    )));
  }

  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((line) => line.replace(/^\s*[•*-]\s*/, "").trim())
      .filter(Boolean);
  }

  if (isPlainObject(value) && Array.isArray(value.items)) {
    return cloneJson(value.items.filter((item) => (
      isPlainObject(item)
      || String(item ?? "").trim()
    )));
  }

  return [];
}

function normalizeStep7MeetingCollection(value) {
  if (Array.isArray(value)) {
    return cloneJson(value.filter((item) => (
      isPlainObject(item)
      || String(item ?? "").trim()
    )));
  }

  if (typeof value === "string") {
    const text = value.trim();
    return text ? [text] : [];
  }

  if (isPlainObject(value)) {
    return cloneJson(value);
  }

  return [];
}

function normalizeStep7MeetingContribs(value) {
  const source = Array.isArray(value) ? value : [];
  return [...new Set(source
    .map((item) => isPlainObject(item) ? item.ref || item.contribRef || item.id || "" : item)
    .map(String)
    .filter(Boolean))];
}

function normalizeStep7MeetingParticipants(participants) {
  if (!Array.isArray(participants)) {
    return [];
  }

  return participants
    .filter(isPlainObject)
    .map((participation) => {
      const vesselRef = String(
        participation.vesselRef
        || participation.vesselId
        || participation.ref
        || participation.roleId
        || participation.id
        || ""
      );
      return {
        ...cloneJson(participation),
        ref: String(participation.ref || vesselRef),
        vesselRef,
        roleType: String(participation.roleType || participation.type || "participant"),
        derivedFromRASIC: participation.derivedFromRASIC === true || participation.derived === true
      };
    })
    .filter((participation) => participation.vesselRef);
}

function normalizeStep7MeetingParticipations(participations) {
  if (!Array.isArray(participations)) {
    return [];
  }

  return participations
    .filter(isPlainObject)
    .map((participation) => {
      const vesselId = String(
        participation.vesselId
        || participation.vesselRef
        || participation.ref
        || participation.roleId
        || participation.id
        || ""
      );
      return {
        ...cloneJson(participation),
        vesselId,
        roleType: String(participation.roleType || participation.type || "participant")
      };
    })
    .filter((participation) => participation.vesselId);
}

function normalizeStep7MeetingMeasures(measures) {
  if (!Array.isArray(measures)) {
    return [];
  }

  return measures
    .filter((measure) => isPlainObject(measure) || String(measure ?? "").trim())
    .map((measure) => isPlainObject(measure)
      ? {
          ...cloneJson(measure),
          defRef: String(measure.defRef || measure.definitionRef || measure.ref || measure.id || ""),
          label: String(measure.label || measure.text || measure.name || "")
        }
      : { defRef: "", label: String(measure || "") })
    .filter((measure) => measure.defRef || measure.label);
}

function normalizeStep7MetricUses(metricUses) {
  if (!Array.isArray(metricUses)) {
    return [];
  }

  return metricUses
    .filter(isPlainObject)
    .map((use) => {
      const localUse = isPlainObject(use.use) ? use.use : {};
      return {
        ...cloneJson(use),
        siteId: String(use.siteId || use.id || ""),
        definitionRef: String(use.definitionRef || use.defRef || use.ref || ""),
        target: String(use.target ?? localUse.target ?? ""),
        frequency: String(use.frequency ?? use.freq ?? localUse.frequency ?? localUse.freq ?? ""),
        source: String(use.source ?? localUse.source ?? ""),
        owner: String(use.owner ?? localUse.owner ?? "")
      };
    })
    .filter((use) => use.definitionRef || use.target || use.source || use.owner);
}

function normalizeStep7DecisionRights(rights) {
  if (!Array.isArray(rights)) {
    return [];
  }

  return rights
    .filter(isPlainObject)
    .map((right) => ({
      ...cloneJson(right),
      rightId: String(right.rightId || right.id || ""),
      decision: isPlainObject(right.decision)
        ? cloneJson(right.decision)
        : String(right.decision || right.title || ""),
      ownerVesselId: String(right.ownerVesselId || right.owner || right.vesselId || ""),
      affectedRef: String(right.affectedRef || right.affected || right.scope || "")
    }))
    .filter((right) => {
      const decisionText = isPlainObject(right.decision) ? right.decision.text || right.decision.ref : right.decision;
      return decisionText || right.ownerVesselId || right.affectedRef;
    });
}

function normalizeStep7LoopRefs(loopRefs) {
  if (!Array.isArray(loopRefs)) {
    return [];
  }

  return loopRefs
    .filter((item) => isPlainObject(item) || String(item ?? "").trim())
    .map((item) => isPlainObject(item)
      ? {
          ...cloneJson(item),
          loopRef: String(item.loopRef || item.ref || item.id || ""),
          relation: String(item.relation || "supports")
        }
      : { loopRef: String(item || ""), relation: "supports" })
    .filter((item) => item.loopRef);
}

function normalizeStep7EscalationPath(escalationPath) {
  if (isPlainObject(escalationPath)) {
    return cloneJson(escalationPath);
  }

  if (Array.isArray(escalationPath)) {
    const first = escalationPath.find((item) => isPlainObject(item) || String(item ?? "").trim());
    if (isPlainObject(first)) {
      return cloneJson(first);
    }
    if (first) {
      return { kind: String(first) };
    }
  }

  return null;
}

function normalizeStep7OutputRefs(outputRefs) {
  if (!Array.isArray(outputRefs)) {
    return [];
  }

  return [...new Set(outputRefs
    .map((ref) => isPlainObject(ref) ? ref.id || ref.ref || ref.value || "" : ref)
    .map(String)
    .filter(Boolean))];
}

function formatStep7MeetingLandscapeMeetings(meetings) {
  const formatted = {};
  for (const [meetingId, meeting] of Object.entries(isPlainObject(meetings) ? meetings : {})) {
    if (!isPlainObject(meeting)) {
      continue;
    }

    formatted[meetingId] = {
      ...cloneJson(meeting),
      agenda: normalizeStep7MeetingAgendaItems(meeting.agendaItems ?? meeting.agenda),
      cadence: normalizeStep7MeetingCadence(meeting.cadence ?? meeting.cad),
      participations: normalizeStep7MeetingParticipations(meeting.participations ?? meeting.participants),
      loops: Array.isArray(meeting.loops) ? cloneJson(meeting.loops) : [],
      outputs: normalizeStep7MeetingCollection(meeting.outputs)
    };
  }
  return formatted;
}

function normalizeStep7MeetingLandscapeVessel(vessel) {
  const normalized = cloneJson(vessel);
  if (normalized.state === "draft") {
    normalized.state = "candidate";
  }
  return normalized;
}

function getStep7MeetingLandscapeContributions(workspace) {
  return getStep7SctContributions(workspace).map((contribution) => ({
    ...cloneJson(contribution),
    unitId: contribution.organizationId,
    unitName: contribution.organizationName,
    text: contribution.contribution,
    sys: contribution.vsmSystem
  }));
}

function getStep7EditorUnits(workspace) {
  const organizations = getRecursionOrganizations(workspace);
  const sifUnitId = getStep7EditorSifUnitId(organizations);
  return [
    ...organizations.map((organization) => ({
      ...cloneJson(organization),
      sif: organization.id === sifUnitId,
      parent: getStep7EditorParentUnitId(organization, organizations, sifUnitId)
    })),
    ...(Array.isArray(workspace.step1.operativeUnits) ? workspace.step1.operativeUnits : []).map((unit) => ({
      id: String(unit.id || ""),
      name: String(unit.name || ""),
      kind: "operative",
      level: "S1",
      parent: sifUnitId,
      sif: false
    })).filter((unit) => unit.id)
  ];
}

function getStep7EditorSifUnitId(units) {
  return units.find((unit) => recursionLevelValue(unit.level) === 0)?.id
    || units.find((unit) => unit.sif === true)?.id
    || units[0]?.id
    || "";
}

function getStep7EditorSifName(workspace, units) {
  const explicitName = String(workspace.sif?.name || "").trim();
  if (explicitName) {
    return explicitName;
  }

  const sifUnit = units.find((unit) => unit.id === getStep7EditorSifUnitId(units));
  return sifUnit?.name || "System-in-Focus";
}

function normalizeStep7EditorContextScope(options) {
  const scope = typeof options === "string" ? options : options?.scope;
  const value = String(scope || "").trim().toLowerCase();
  return value === "sif" || value === "r0" || value === "system-in-focus" ? "sif" : "all";
}

function getStep7EditorSifUnitIds(units) {
  const ids = new Set(
    units
      .filter((unit) => unit.sif === true || recursionLevelValue(unit.level) === 0)
      .map((unit) => unit.id)
      .filter(Boolean)
  );
  const fallbackSifId = getStep7EditorSifUnitId(units);
  if (fallbackSifId) {
    ids.add(fallbackSifId);
  }
  return ids;
}

function filterStep7EditorSifContributions(contributions, units) {
  const sifUnitIds = getStep7EditorSifUnitIds(units);
  return contributions.filter((contribution) => (
    sifUnitIds.has(contribution.organizationId || contribution.unit)
    || recursionLevelValue(contribution.recursionLevel || contribution.level) === 0
  ));
}

function getStep7EditorParentUnitId(organization, organizations, sifUnitId) {
  if (organization.parent) {
    return String(organization.parent);
  }

  const levelValue = recursionLevelValue(organization.level);
  if (levelValue < 0) {
    return sifUnitId;
  }

  const parent = organizations.find((candidate) => recursionLevelValue(candidate.level) === levelValue + 1);
  return parent?.id || "";
}

function formatStep7EditorSct(sct) {
  return {
    ...cloneJson(sct),
    sys: formatStep7EditorSystem(sct.sys),
    prio: formatStep7EditorPriority(sct.prio || sct.priority)
  };
}

function formatStep7EditorContribution(contribution) {
  return {
    ...cloneJson(contribution),
    sct: contribution.sctId || contribution.taskId,
    unit: contribution.organizationId,
    text: contribution.contribution || contribution.text || "",
    sys: formatStep7EditorSystem(contribution.vsmSystem),
    accUnit: contribution.accountableOrganizationId || contribution.organizationId
  };
}

function formatStep7EditorVessel(vessel) {
  return {
    ...cloneJson(vessel),
    state: vessel.state === "draft" ? "candidate" : String(vessel.state || "candidate"),
    sys: formatStep7EditorSystem(vessel.sys)
  };
}

function formatStep7EditorSystem(systemId) {
  const value = String(systemId || "").trim().toUpperCase();
  if (!value) {
    return "";
  }

  return value.startsWith("S") ? value : `S${value}`;
}

function parseStep7EditorSystem(systemId) {
  return String(systemId || "").trim().toUpperCase().replace(/^S/, "");
}

function formatStep7EditorPriority(priority) {
  const value = String(priority || "").trim().toLowerCase();
  if (value === "a" || value === "high") {
    return "high";
  }

  if (value === "b" || value === "medium" || value === "med") {
    return "med";
  }

  if (value === "c" || value === "low") {
    return "low";
  }

  return value || "med";
}

function flattenStep7Descriptions(descriptions, vessels) {
  const flat = {};
  const source = isPlainObject(descriptions) ? descriptions : {};
  const vesselById = new Map((Array.isArray(vessels) ? vessels : []).map((vessel) => [vessel.id, vessel]));

  for (const [group, items] of Object.entries(source)) {
    if (!isPlainObject(items)) {
      continue;
    }

    for (const [vesselId, description] of Object.entries(items)) {
      if (isPlainObject(description) && vesselById.has(vesselId)) {
        flat[vesselId] = cloneJson(description);
      }
    }
  }

  return flat;
}

function inflateStep7Descriptions(flatDescriptions, vessels, previousDescriptions = {}) {
  const normalized = {
    roles: {},
    functions: {},
    meetings: {}
  };
  const previous = isPlainObject(previousDescriptions) ? previousDescriptions : {};
  for (const key of Object.keys(normalized)) {
    if (isPlainObject(previous[key])) {
      normalized[key] = cloneJson(previous[key]);
    }
  }

  const validVessels = new Map((Array.isArray(vessels) ? vessels : [])
    .map((vessel) => [vessel.id, vessel]));

  for (const [vesselId, description] of Object.entries(flatDescriptions)) {
    const vessel = validVessels.get(vesselId);
    if (!vessel || !isPlainObject(description)) {
      continue;
    }

    const group = `${normalizeStep7VesselType(vessel.type)}s`;
    normalized[group] ||= {};
    normalized[group][vesselId] = cloneJson(description);
  }

  for (const [group, items] of Object.entries(normalized)) {
    const type = group.replace(/s$/, "");
    for (const vesselId of Object.keys(items)) {
      const vessel = validVessels.get(vesselId);
      if (!vessel || normalizeStep7VesselType(vessel.type) !== type) {
        delete items[vesselId];
      }
    }
  }

  return normalized;
}

function step7MembershipToParticipations(membership, validVesselIds, meetingIds, step7) {
  const existingByPair = new Map();
  const remember = (participation) => {
    if (!isPlainObject(participation)) {
      return;
    }

    const vesselId = String(participation.vesselId || participation.vesselRef || participation.ref || participation.roleId || "");
    const meetingId = String(participation.meetingId || participation.targetId || participation.parentId || "");
    if (vesselId && meetingId) {
      existingByPair.set(`${vesselId}|${meetingId}`, cloneJson(participation));
    }
  };

  for (const participation of Array.isArray(step7.participations) ? step7.participations : []) {
    remember(participation);
  }

  for (const meeting of Object.values(isPlainObject(step7.meetings) ? step7.meetings : {})) {
    for (const participation of Array.isArray(meeting?.participations) ? meeting.participations : []) {
      remember({ ...participation, meetingId: meeting.id });
    }
    for (const participation of Array.isArray(meeting?.participants) ? meeting.participants : []) {
      remember({ ...participation, meetingId: meeting.id });
    }
  }

  const participations = [];
  const seenPairs = new Set();
  for (const [vesselId, rawMeetingIds] of Object.entries(membership)) {
    if (!validVesselIds.has(vesselId) || !Array.isArray(rawMeetingIds)) {
      continue;
    }

    for (const rawMeetingId of rawMeetingIds) {
      const meetingId = String(rawMeetingId || "");
      if (!meetingIds.has(meetingId)) {
        continue;
      }

      const existing = existingByPair.get(`${vesselId}|${meetingId}`) || {};
      seenPairs.add(`${vesselId}|${meetingId}`);
      participations.push({
        ...existing,
        vesselId,
        meetingId,
        roleType: String(existing.roleType || existing.type || "participant")
      });
    }
  }

  for (const [pair, existing] of existingByPair.entries()) {
    if (seenPairs.has(pair)) {
      continue;
    }
    const vesselId = String(existing.vesselId || existing.vesselRef || existing.ref || existing.roleId || "");
    const meetingId = String(existing.meetingId || existing.targetId || existing.parentId || "");
    if (!validVesselIds.has(vesselId) || !meetingIds.has(meetingId)) {
      continue;
    }
    participations.push({
      ...existing,
      vesselId,
      meetingId,
      roleType: String(existing.roleType || existing.type || "participant")
    });
  }

  return participations;
}

function syncStep7MeetingParticipations(step7) {
  const byMeeting = new Map();
  for (const participation of Array.isArray(step7.participations) ? step7.participations : []) {
    const meetingId = String(participation.meetingId || "");
    if (!meetingId) {
      continue;
    }

    if (!byMeeting.has(meetingId)) {
      byMeeting.set(meetingId, []);
    }
    byMeeting.get(meetingId).push(cloneJson(participation));
  }

  const meetingVessels = new Map(
    (Array.isArray(step7.vessels) ? step7.vessels : [])
      .filter((vessel) => vessel?.type === "meeting")
      .map((vessel) => [String(vessel.id || ""), vessel])
  );
  for (const meetingId of byMeeting.keys()) {
    if (!isPlainObject(step7.meetings?.[meetingId]) && meetingVessels.has(meetingId)) {
      step7.meetings[meetingId] = normalizeStep7MeetingRecord({}, meetingId, meetingVessels.get(meetingId));
    }
  }

  for (const [meetingId, meeting] of Object.entries(isPlainObject(step7.meetings) ? step7.meetings : {})) {
    const existingByVessel = new Map(
      (Array.isArray(meeting.participations) ? meeting.participations : [])
        .filter(isPlainObject)
        .map((participation) => [String(participation.vesselId || participation.roleId || ""), participation])
    );

    meeting.participations = (byMeeting.get(meetingId) || []).map((participation) => {
      const previous = existingByVessel.get(participation.vesselId) || {};
      const { meetingId: _meetingId, ...withoutMeetingId } = participation;
      return {
        ...cloneJson(previous),
        ...withoutMeetingId,
        roleType: String(participation.roleType || previous.roleType || "participant")
      };
    });
  }
}

function buildStep7MeetingMembership(meetings, participations) {
  const membership = {};
  const addMembership = (vesselId, meetingId) => {
    const normalizedVesselId = String(vesselId || "");
    const normalizedMeetingId = String(meetingId || "");
    if (!normalizedVesselId || !normalizedMeetingId) {
      return;
    }

    membership[normalizedVesselId] = [...new Set([
      ...(membership[normalizedVesselId] || []),
      normalizedMeetingId
    ])];
  };

  for (const meeting of Object.values(isPlainObject(meetings) ? meetings : {})) {
    if (!isPlainObject(meeting)) {
      continue;
    }

    for (const participation of Array.isArray(meeting.participations) ? meeting.participations : []) {
      addMembership(participation.vesselId || participation.roleId, meeting.id);
    }
    for (const participation of Array.isArray(meeting.participants) ? meeting.participants : []) {
      addMembership(participation.vesselId || participation.vesselRef || participation.ref || participation.roleId, meeting.id);
    }
  }

  for (const participation of Array.isArray(participations) ? participations : []) {
    if (!isPlainObject(participation)) {
      continue;
    }

    addMembership(
      participation.vesselId || participation.roleId,
      participation.meetingId || participation.targetId || participation.parentId
    );
  }

  return membership;
}

function normalizeStep7Rasic(rasic, validContributionIds, validVesselIds) {
  if (!isPlainObject(rasic)) {
    return {};
  }

  const normalized = {};
  for (const [key, value] of Object.entries(rasic)) {
    const parsed = parseStep7RasicKey(key);
    const assignment = String(value || "").trim().toUpperCase();
    if (
      parsed
      && validContributionIds.has(parsed.contributionId)
      && validVesselIds.has(parsed.vesselId)
      && rasicValues.includes(assignment)
    ) {
      normalized[step7RasicKey(parsed.contributionId, parsed.vesselId)] = assignment;
    }
  }

  return normalized;
}

function normalizeStep7Warnings(warnings, validContributionIds) {
  if (!isPlainObject(warnings)) {
    return {};
  }

  const normalized = {};
  for (const [contributionId, items] of Object.entries(warnings)) {
    if (!validContributionIds.has(contributionId) || !Array.isArray(items)) {
      continue;
    }

    normalized[contributionId] = items
      .filter(isPlainObject)
      .map((item) => ({
        code: String(item.code || ""),
        severity: String(item.severity || "info"),
        loud: item.loud === true,
        message: String(item.message || ""),
        ...(item.vesselId ? { vesselId: String(item.vesselId) } : {}),
        ...(item.homeUnitId ? { homeUnitId: String(item.homeUnitId) } : {})
      }))
      .filter((item) => item.code || item.message);
  }

  return normalized;
}

function step7RasicKey(contributionId, vesselId) {
  return `${String(contributionId || "")}|${String(vesselId || "")}`;
}

function parseStep7RasicKey(key) {
  const parts = String(key || "").split("|");
  if (parts.length < 3) {
    return null;
  }

  const vesselId = parts.pop();
  const contributionId = parts.join("|");
  return contributionId && vesselId ? { contributionId, vesselId } : null;
}

function getStep7Scts(workspace) {
  return workspace.step3.successCriticalTasks.map((task) => ({
    id: task.id,
    did: formatSctNumber(task.number),
    name: task.title || "Untitled SCT",
    sys: String(task.system || ""),
    prio: task.priority || "A",
    priority: task.priority || "A"
  }));
}

function duplicateStep7TaskReferences(workspace, sourceTaskId, splitTaskId) {
  normalizeStep7Representation(workspace);
  if (workspace.step7.aspects[sourceTaskId]) {
    workspace.step7.aspects[splitTaskId] = cloneStep7AspectBundle(workspace.step7.aspects[sourceTaskId], true);
  }

  const sourcePrefix = `${sourceTaskId}|`;
  for (const [key, value] of Object.entries({ ...workspace.step7.rasic })) {
    const parsed = parseStep7RasicKey(key);
    if (parsed?.contributionId?.startsWith(sourcePrefix)) {
      const organizationId = parsed.contributionId.slice(sourcePrefix.length);
      workspace.step7.rasic[step7RasicKey(getStep5ContributionKey(splitTaskId, organizationId), parsed.vesselId)] = value;
    }
  }

  for (const [contributionId, warnings] of Object.entries({ ...workspace.step7.warnings })) {
    if (contributionId.startsWith(sourcePrefix)) {
      const organizationId = contributionId.slice(sourcePrefix.length);
      workspace.step7.warnings[getStep5ContributionKey(splitTaskId, organizationId)] = cloneJson(warnings);
    }
  }
}

function mergeStep7TaskReferences(workspace, survivorTaskId, removedIds) {
  normalizeStep7Representation(workspace);
  workspace.step7.aspects[survivorTaskId] = mergeStep7AspectBundles(
    workspace.step7.aspects[survivorTaskId],
    ...[...removedIds].map((taskId) => workspace.step7.aspects[taskId])
  );
  for (const removedId of removedIds) {
    delete workspace.step7.aspects[removedId];
  }

  const nextRasic = {};
  for (const [key, value] of Object.entries(workspace.step7.rasic)) {
    const parsed = parseStep7RasicKey(key);
    if (!parsed) {
      continue;
    }

    const contributionId = rewireStep7ContributionId(parsed.contributionId, survivorTaskId, removedIds);
    nextRasic[step7RasicKey(contributionId, parsed.vesselId)] ||= value;
  }
  workspace.step7.rasic = nextRasic;

  const nextWarnings = {};
  for (const [contributionId, warnings] of Object.entries(workspace.step7.warnings)) {
    const nextContributionId = rewireStep7ContributionId(contributionId, survivorTaskId, removedIds);
    nextWarnings[nextContributionId] = [
      ...(nextWarnings[nextContributionId] || []),
      ...cloneJson(warnings)
    ];
  }
  workspace.step7.warnings = nextWarnings;
  workspace.step7.participations = workspace.step7.participations.map((item) => rewireStep7ReferenceObject(item, survivorTaskId, removedIds));
  workspace.step7.meetingConnections = workspace.step7.meetingConnections.map((item) => rewireStep7ReferenceObject(item, survivorTaskId, removedIds));
}

function cloneStep7AspectBundle(bundle, regenerateIds = false) {
  const normalized = normalizeStep7AspectBundle(bundle || {});
  for (const kind of step7AspectKinds) {
    normalized[kind] = normalized[kind].map((item) => ({
      ...item,
      id: regenerateIds ? createId("aspect-item") : item.id
    }));
  }

  return normalized;
}

function mergeStep7AspectBundles(...bundles) {
  const merged = Object.fromEntries(step7AspectKinds.map((kind) => [kind, []]));
  const seen = new Set();
  for (const bundle of bundles) {
    const normalized = normalizeStep7AspectBundle(bundle || {});
    for (const kind of step7AspectKinds) {
      for (const item of normalized[kind]) {
        const signature = `${kind}|${item.id}|${item.text}`;
        if (seen.has(signature)) {
          continue;
        }
        seen.add(signature);
        merged[kind].push({ ...item });
      }
    }
  }

  return merged;
}

function rewireStep7ContributionId(contributionId, survivorTaskId, removedIds) {
  for (const removedId of removedIds) {
    const prefix = `${removedId}|`;
    if (String(contributionId || "").startsWith(prefix)) {
      return getStep5ContributionKey(survivorTaskId, String(contributionId).slice(prefix.length));
    }
  }

  return contributionId;
}

function rewireStep7ReferenceObject(item, survivorTaskId, removedIds) {
  const next = cloneJson(item);
  if (removedIds.has(next.sctId)) {
    next.sctId = survivorTaskId;
  }
  if (removedIds.has(next.taskId)) {
    next.taskId = survivorTaskId;
  }
  if (next.contributionId) {
    next.contributionId = rewireStep7ContributionId(next.contributionId, survivorTaskId, removedIds);
  }
  return next;
}

function buildStep5DistributionObservation(dominant, assignmentCount) {
  if (!assignmentCount || !dominant?.percentage) {
    return "No VSM-system distribution is visible yet. Map the real SCT contributions to inspect the steering system.";
  }

  const observations = {
    "1": "Strong operative focus. Discuss whether the steering system leaves sufficient coordination, control, future, and policy capacity.",
    "2": "Coordination is the strongest visible focus. Check whether dependencies between operative units genuinely require this emphasis.",
    "3": "Control and resource-bargain work dominates. Inspect whether this is necessary cohesion or excessive intervention.",
    "3*": "Independent monitoring is the strongest visible focus. Check whether audit and real-life feedback are proportionate.",
    "4": "Future and environmental work dominates. Check whether strategic insight is translated into operative decisions.",
    "5": "Policy, identity, and normative work dominates. Check whether this provides useful orientation without over-centralizing."
  };

  return `${observations[dominant.systemId]} S${dominant.systemId} represents ${dominant.percentage}% of current assignments.`;
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
