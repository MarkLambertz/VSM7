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
    output: "Manageability assessment"
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
    output: "Central/decentral accountability matrix"
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

export const vsmSystems = ["1", "2", "3", "3*", "4", "5"];
export const taskSources = [
  "Environment-Operation",
  "Operation-Management",
  "Environmental Overlap",
  "Operational Dependency",
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
      decisionRationale: ""
    },
    step2: {
      horizontalAssessment: {
        operativeUnitsAmount: "",
        dissimilarity: "",
        selfControl: "",
        notes: ""
      },
      verticalAssessment: {
        environmentalOverlaps: "",
        system3Star: "",
        operationalDependencies: "",
        resourceBargain: "",
        corporateIntervention: "",
        system2: "",
        notes: ""
      },
      options: [
        createManageabilityOption("Strengthen control functions"),
        createManageabilityOption("Reduce or compress S1"),
        createManageabilityOption("Add management level")
      ],
      conclusion: "",
      selectedOption: ""
    },
    step3: {
      complexityDrivers: {
        environmentOperation: "",
        operationManagement: "",
        environmentalOverlaps: "",
        operationalDependencies: ""
      },
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

export function createSuccessCriticalTask() {
  return {
    id: createId("sct"),
    priority: "A",
    system: "3",
    title: "",
    explanation: "",
    source: "Workshop Decision",
    kpi: "",
    requiredArtifacts: ""
  };
}

export function createAllocation(taskId) {
  return {
    taskId,
    levels: {
      "R-1": false,
      R0: false,
      "R+1": false
    },
    accountableEntity: "",
    rationale: "",
    partialAllocationNotes: ""
  };
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
  const taskIds = new Set(merged.step3.successCriticalTasks.map((task) => task.id));

  if (!merged.step1.evaluation) {
    merged.step1.evaluation = { scores: {}, comments: {} };
  }

  ensureSixPackFields(merged);

  for (const taskId of taskIds) {
    if (!merged.step4.allocations[taskId]) {
      merged.step4.allocations[taskId] = createAllocation(taskId);
    }
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

  for (const task of workspace.step3.successCriticalTasks) {
    if (!workspace.step4.allocations[task.id]) {
      workspace.step4.allocations[task.id] = createAllocation(task.id);
    }
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

  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
      result[key] = mergeDeep(result[key], value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
