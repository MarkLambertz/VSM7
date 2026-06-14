import {
  createImplementationItem,
  createKeyBuyingCriterion,
  createMeeting,
  createOperativeUnit,
  createNumberedSuccessCriticalTask,
  createRole,
  createSegmentationOption,
  createStrategicField,
  createWorkspace,
  markAllStep2SlidersAssessed,
  sixPackOfControl,
  syncAllocations
} from "../domain/vsm.js?v=20260614-step4-accountability3";

export function createSampleWorkspace() {
  const sample = createWorkspace();
  sample.organization.name = "Generic Mobility Organization";
  sample.project.name = "Target Organization VSM";
  sample.sif.name = "Product Area X";
  sample.sif.purpose = "Deliver integrated customer value while keeping autonomy and cohesion in balance.";
  sample.sif.customers = "OEM customers, product teams, regional sales, delivery partners";
  sample.step1.segmentationOptions = [
    createSegmentationOption("Function-oriented", "Segments around current functional disciplines."),
    createSegmentationOption("Product-oriented", "Segments around coherent product and platform value streams."),
    createSegmentationOption("Region-oriented", "Segments around regional markets and customer proximity."),
    createSegmentationOption("Customer-oriented", "Segments around major customer groups.")
  ];
  sample.step1.selectedSegmentationOptionId = sample.step1.segmentationOptions[1].id;
  sample.step1.decisionRationale = "Product portfolio segmentation keeps operative units closer to purchase-deciding customer value.";
  sample.step1.operativeUnits = [
    createOperativeUnit("Interior Systems", "Operative unit for cockpit and interior systems."),
    createOperativeUnit("Software Platform", "Operative unit for embedded and platform software."),
    createOperativeUnit("Service & Lifecycle", "Operative unit for service offers and lifecycle value.")
  ];

  const criterion1 = createKeyBuyingCriterion();
  criterion1.name = "Time to market";
  criterion1.explanation = "Ability to deliver relevant features quickly.";
  criterion1.weight = "40";
  criterion1.relativePosition = "Equal";

  const criterion2 = createKeyBuyingCriterion();
  criterion2.name = "System integration";
  criterion2.explanation = "Ability to integrate product, software, and service components.";
  criterion2.weight = "35";
  criterion2.relativePosition = "Better";

  const criterion3 = createKeyBuyingCriterion();
  criterion3.name = "Cost competitiveness";
  criterion3.explanation = "Total value delivered at competitive cost.";
  criterion3.weight = "25";
  criterion3.relativePosition = "Worse";

  sample.step1.keyBuyingCriteria = [criterion1, criterion2, criterion3];

  const fieldDirections = {
    "Market Position": "Market share >25%",
    Innovation: "Modularization and digitization",
    Productivity: "Realization of synergies",
    "Attractiveness for good people": "Hire and develop good people",
    Profitability: "ROI of >5%",
    "Liquidity / Cash Flow": "Cash flow >15%"
  };
  sample.step1.strategicFields = sixPackOfControl.map((variable) => {
    const field = createStrategicField(variable);
    field.direction = fieldDirections[variable] || "";
    return field;
  });

  const evaluationRows = [...sample.step1.keyBuyingCriteria, ...sample.step1.strategicFields];
  const sampleScores = [
    [2, 5, 3, 4],
    [1, 5, 2, 4],
    [2, 5, 3, 4],
    [1, 4, 2, 5],
    [2, 5, 3, 4],
    [4, 2, 3, 1],
    [2, 5, 3, 4],
    [2, 4, 3, 5],
    [3, 5, 2, 4]
  ];
  sample.step1.evaluation = { scores: {}, comments: {} };
  evaluationRows.forEach((row, rowIndex) => {
    sample.step1.evaluation.scores[row.id] = {};
    sample.step1.segmentationOptions.forEach((option, optionIndex) => {
      sample.step1.evaluation.scores[row.id][option.id] = String(sampleScores[rowIndex]?.[optionIndex] || "");
    });
  });
  sample.step1.evaluation.comments[criterion1.id] = "Strong focus on product quality.";
  sample.step1.evaluation.comments[criterion2.id] = "Less bottlenecks through product alignment.";
  sample.step1.evaluation.comments[sample.step1.strategicFields[2].id] = "Central function can realize synergies.";

  sample.step2.horizontalAssessment.operativeUnitsAmount = "50";
  sample.step2.horizontalAssessment.dissimilarity = "50";
  sample.step2.horizontalAssessment.selfControl = "50";
  sample.step2.verticalAssessment.environmentalOverlaps = "50";
  sample.step2.verticalAssessment.system3Star = "50";
  sample.step2.verticalAssessment.operationalDependencies = "50";
  sample.step2.verticalAssessment.resourceBargain = "50";
  sample.step2.verticalAssessment.corporateIntervention = "50";
  sample.step2.verticalAssessment.system2 = "50";
  markAllStep2SlidersAssessed(sample);
  sample.step2.selectedOptionIds = [sample.step2.options[0].id];

  const task1 = createNumberedSuccessCriticalTask(sample);
  task1.priority = "A";
  task1.system = "4";
  task1.title = "Maintain coherent portfolio strategy";
  task1.explanation = "Continuously align market insight, product ambition, and investment focus.";
  task1.source = "Environment-Operation";
  task1.kpi = "Portfolio fit, revenue share in target segments";

  const task2 = createNumberedSuccessCriticalTask(sample);
  task2.priority = "A";
  task2.system = "3";
  task2.title = "Allocate critical engineering capacity";
  task2.explanation = "Negotiate capacity across operative units according to global optimum.";
  task2.source = "Operational Dependency";
  task2.kpi = "Capacity allocation adherence, bottleneck resolution time";

  sample.step3.complexityDrivers.environmentOperation = "Multiple customer segments require different release rhythms and integration depth.";
  sample.step3.complexityDrivers.operationManagement = "Shared engineering capacity creates prioritization pressure across operative units.";
  sample.step3.successCriticalTasks = [task1, task2];
  syncAllocations(sample);
  const parentSystem = sample.step1.recursionLevels.find((organization) => organization.level === "R+1");
  const systemInFocus = sample.step1.recursionLevels.find((organization) => organization.level === "R0");
  const nestedSystems = sample.step1.recursionLevels.find((organization) => organization.level === "R-1");
  sample.step4.allocations[task1.id].contributions[parentSystem.id] = "Set the portfolio guardrails and investment expectations.";
  sample.step4.allocations[task1.id].contributions[systemInFocus.id] = "Translate market insight into a coherent portfolio strategy across S1 units.";
  sample.step4.allocations[task1.id].accountableOrganizationId = systemInFocus.id;
  sample.step4.allocations[task2.id].contributions[systemInFocus.id] = "Set capacity-allocation rules and resolve cross-unit bottlenecks.";
  sample.step4.allocations[task2.id].contributions[nestedSystems.id] = "Provide transparent demand, constraints, and local prioritization proposals.";
  sample.step4.allocations[task2.id].accountableOrganizationId = systemInFocus.id;

  const meeting = createMeeting();
  meeting.name = "Portfolio Board";
  meeting.purpose = "Balance strategic ambition and operative constraints.";
  meeting.participants = "Business leadership, product leads, operations";
  meeting.cadence = "Monthly";
  meeting.vsmSystem = "4";
  meeting.linkedTaskIds = [task1.id];
  sample.step5.meetings = [meeting];

  sample.step6.communicationChannels[5].channelsUsed = "Portfolio board, planning calendar, decision log";
  sample.step6.communicationChannels[5].capacity = "Adequate";
  sample.step6.communicationChannels[5].intelligibility = "Adequate";
  sample.step6.communicationChannels[5].synchronicity = "Weak";
  sample.step6.communicationChannels[5].security = "Strong";
  sample.step6.communicationChannels[5].observation = "Strategic and operative planning need earlier synchronization.";

  const role = createRole();
  role.name = "Portfolio Manager";
  role.type = "Leadership role";
  role.purpose = "Own portfolio coherence and prepare S4 decisions.";
  role.linkedTaskIds = [task1.id];
  sample.step7.roles = [role];

  const item = createImplementationItem();
  item.challenge = "Synchronize strategy and operative planning";
  item.requirement = "Define planning reference points and decision calendar.";
  item.responsible = "VSM Coach and Portfolio Manager";
  item.status = "Open";
  sample.implementation.items = [item];

  return sample;
}
