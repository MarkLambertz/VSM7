export function evaluateCompleteness(workspace) {
  const byStep = [
    evaluateStep1(workspace),
    evaluateStep2(workspace),
    evaluateStep3(workspace),
    evaluateStep4(workspace),
    evaluateStep5(workspace),
    evaluateStep6(workspace),
    evaluateStep7(workspace),
    evaluateImplementation(workspace)
  ];

  const score = Math.round(byStep.reduce((sum, step) => sum + step.score, 0) / byStep.length);

  return {
    score,
    byStep,
    blockers: byStep.flatMap((step) => step.missing.map((message) => ({ stepId: step.stepId, message }))),
    nudges: byStep.flatMap((step) => step.warnings.map((message) => ({ stepId: step.stepId, message })))
  };
}

function evaluateStep1(workspace) {
  const missing = [];
  const warnings = [];
  const criteria = workspace.step1.keyBuyingCriteria;
  const segmentationOptions = workspace.step1.segmentationOptions;
  const meaningfulOptions = segmentationOptions.filter((option) => option.name.trim() && option.description.trim());
  const meaningfulCriteria = criteria.filter((criterion) => criterion.name.trim() && criterion.explanation.trim() && criterion.weight !== "");
  const completedSixPack = workspace.step1.strategicFields.filter((field) => field.variable.trim() && field.direction.trim());
  const evaluationRows = [...criteria, ...workspace.step1.strategicFields];
  const matrixRowsComplete = evaluationRows.filter((row) => {
    const scores = workspace.step1.evaluation?.scores?.[row.id] || {};
    return segmentationOptions.length > 0 && segmentationOptions.every((option) => scores[option.id]);
  });
  const hasAnyStep1Input = [
    workspace.sif.name,
    workspace.sif.purpose,
    workspace.sif.customers,
    ...segmentationOptions.flatMap((option) => [option.name, option.description]),
    ...criteria.flatMap((criterion) => [criterion.name, criterion.explanation, criterion.weight]),
    ...workspace.step1.strategicFields.map((field) => field.direction),
    workspace.step1.decisionRationale
  ].some((value) => String(value || "").trim());
  const totalWeight = criteria.reduce((sum, criterion) => sum + Number(criterion.weight || 0), 0);

  if (!hasAnyStep1Input) {
    return hardOpenStep("step1", [
      "Start by naming the System-in-Focus and entering real workshop content."
    ], warnings);
  }

  requireText(workspace.sif.name, missing, "Name the System-in-Focus.");
  requireText(workspace.sif.purpose, missing, "Capture the purpose of the System-in-Focus.");
  requireText(workspace.sif.customers, missing, "Capture customers or primary stakeholders.");
  requireCount(meaningfulOptions, 2, missing, "Add at least two described segmentation options.");
  requireCount(meaningfulCriteria, 3, missing, "Add at least three complete key buying criteria.");
  requireCount(completedSixPack, 6, missing, "Complete the Six Pack strategic fields of action.");
  requireCount(matrixRowsComplete, evaluationRows.length, missing, "Complete the segmentation evaluation matrix.");
  requireText(workspace.step1.selectedSegmentationOptionId, missing, "Select the preferred segmentation option.");
  requireText(workspace.step1.decisionRationale, missing, "Document the decision rationale.");

  if (criteria.length > 7) {
    warnings.push("Key buying criteria exceed the recommended maximum of seven.");
  }

  if (criteria.length > 0 && totalWeight !== 100) {
    warnings.push(`Key buying criteria currently sum to ${totalWeight}%, not 100%.`);
  }

  if (findDuplicateEvaluationScores(workspace).length > 0) {
    missing.push("Resolve duplicate scores in evaluation rows.");
  }

  return stepResult("step1", missing, warnings, 8);
}

function evaluateStep2(workspace) {
  const missing = [];
  const warnings = [];
  const horizontal = workspace.step2.horizontalAssessment;
  const vertical = workspace.step2.verticalAssessment;

  requireText(horizontal.operativeUnitsAmount, missing, "Assess the amount of operative units.");
  requireText(horizontal.dissimilarity, missing, "Assess the dissimilarity of operative units.");
  requireText(horizontal.selfControl, missing, "Assess the self-control capability of operative units.");
  requireText(vertical.resourceBargain, missing, "Assess resource bargain and accountability.");
  requireText(vertical.system2, missing, "Assess System 2 coordination strength.");
  requireText(workspace.step2.conclusion, missing, "Write the manageability conclusion.");

  const selected = workspace.step2.selectedOption;
  if (!selected) {
    warnings.push("No preferred manageability remedy has been selected yet.");
  }

  return stepResult("step2", missing, warnings, 6);
}

function evaluateStep3(workspace) {
  const missing = [];
  const warnings = [];
  const tasks = workspace.step3.successCriticalTasks;
  const drivers = workspace.step3.complexityDrivers;

  requireText(drivers.environmentOperation, missing, "Capture environment-operation complexity drivers.");
  requireText(drivers.operationManagement, missing, "Capture operation-management complexity drivers.");
  requireCount(tasks, 1, missing, "Add success-critical tasks.");

  if (tasks.length === 0) {
    return hardOpenStep("step3", missing, warnings);
  }

  const incompleteTasks = tasks.filter((task) => !task.title.trim() || !task.explanation.trim());
  if (incompleteTasks.length > 0) {
    missing.push(`${incompleteTasks.length} success-critical task(s) need title and explanation.`);
  }

  if (tasks.length > 30) {
    warnings.push("There are more than 30 SCTs. This may indicate skipped recursion or too much detail.");
  }

  return stepResult("step3", missing, warnings, 4);
}

function evaluateStep4(workspace) {
  const missing = [];
  const warnings = [];
  const tasks = workspace.step3.successCriticalTasks;
  const allocations = workspace.step4.allocations;

  if (tasks.length === 0) {
    missing.push("Step IV needs success-critical tasks from Step III.");
    return hardOpenStep("step4", missing, warnings);
  }

  const unallocated = tasks.filter((task) => {
    const allocation = allocations[task.id];
    return !allocation || !Object.values(allocation.levels).some(Boolean);
  });

  const noAccountableEntity = tasks.filter((task) => {
    const allocation = allocations[task.id];
    return allocation && Object.values(allocation.levels).some(Boolean) && !allocation.accountableEntity.trim();
  });

  if (unallocated.length > 0) {
    missing.push(`${unallocated.length} SCT(s) still need R-1/R0/R+1 allocation.`);
  }

  if (noAccountableEntity.length > 0) {
    warnings.push(`${noAccountableEntity.length} allocated SCT(s) do not yet name an accountable entity.`);
  }

  return stepResult("step4", missing, warnings, Math.max(1, tasks.length));
}

function evaluateStep5(workspace) {
  const missing = [];
  const warnings = [];
  const meetings = workspace.step5.meetings;

  requireCount(meetings, 1, missing, "Capture at least one board, committee, or meeting.");

  if (meetings.length === 0) {
    return hardOpenStep("step5", missing, warnings);
  }

  const incomplete = meetings.filter((meeting) => !meeting.name.trim() || !meeting.purpose.trim() || !meeting.vsmSystem);
  if (incomplete.length > 0) {
    missing.push(`${incomplete.length} meeting(s) need name, purpose, and VSM system.`);
  }

  const unlinked = meetings.filter((meeting) => meeting.keep && meeting.linkedTaskIds.length === 0);
  if (unlinked.length > 0) {
    warnings.push(`${unlinked.length} kept meeting(s) are not linked to SCTs yet.`);
  }

  return stepResult("step5", missing, warnings, 3);
}

function evaluateStep6(workspace) {
  const missing = [];
  const warnings = [];
  const channels = workspace.step6.communicationChannels;
  const assessed = channels.filter((channel) => channel.capacity || channel.intelligibility || channel.synchronicity || channel.security || channel.observation);

  requireCount(assessed, 1, missing, "Assess at least one communication loop.");

  if (assessed.length === 0) {
    return hardOpenStep("step6", missing, warnings);
  }

  const incomplete = assessed.filter((channel) => !channel.capacity || !channel.intelligibility || !channel.synchronicity || !channel.security);
  if (incomplete.length > 0) {
    warnings.push(`${incomplete.length} assessed loop(s) need all four variety checks.`);
  }

  return stepResult("step6", missing, warnings, 2);
}

function evaluateStep7(workspace) {
  const missing = [];
  const warnings = [];
  const roles = workspace.step7.roles;

  requireCount(roles, 1, missing, "Capture at least one role, function, or organizational entity.");

  if (roles.length === 0) {
    return hardOpenStep("step7", missing, warnings);
  }

  const incomplete = roles.filter((role) => !role.name.trim() || !role.purpose.trim());
  if (incomplete.length > 0) {
    missing.push(`${incomplete.length} role(s) need name and purpose.`);
  }

  const linkedTaskIds = new Set(roles.flatMap((role) => role.linkedTaskIds));
  const unrepresentedTasks = workspace.step3.successCriticalTasks.filter((task) => !linkedTaskIds.has(task.id));
  if (workspace.step3.successCriticalTasks.length > 0 && unrepresentedTasks.length > 0) {
    warnings.push(`${unrepresentedTasks.length} SCT(s) are not linked to a role or entity in representation.`);
  }

  return stepResult("step7", missing, warnings, 3);
}

function evaluateImplementation(workspace) {
  const missing = [];
  const warnings = [];
  const items = workspace.implementation.items;

  requireCount(items, 1, missing, "Capture at least one implementation item or decision.");

  if (items.length === 0) {
    return hardOpenStep("implementation", missing, warnings);
  }

  const incomplete = items.filter((item) => !item.challenge.trim() || !item.responsible.trim());
  if (incomplete.length > 0) {
    warnings.push(`${incomplete.length} implementation item(s) need responsibility.`);
  }

  return stepResult("implementation", missing, warnings, 2);
}

function findDuplicateEvaluationScores(workspace) {
  const rows = [...workspace.step1.keyBuyingCriteria, ...workspace.step1.strategicFields];
  const duplicates = [];

  for (const row of rows) {
    const scores = Object.values(workspace.step1.evaluation?.scores?.[row.id] || {}).filter(Boolean);
    if (new Set(scores).size !== scores.length) {
      duplicates.push(row.id);
    }
  }

  return duplicates;
}

function hardOpenStep(stepId, missing, warnings) {
  return {
    stepId,
    score: 0,
    missing,
    warnings
  };
}

function stepResult(stepId, missing, warnings, expectedSignals) {
  const penalty = missing.length + warnings.length * 0.35;
  const score = Math.max(0, Math.min(100, Math.round(((expectedSignals - penalty) / expectedSignals) * 100)));

  return {
    stepId,
    score,
    missing,
    warnings
  };
}

function requireText(value, missing, message) {
  if (!String(value || "").trim()) {
    missing.push(message);
  }
}

function requireCount(items, minimum, missing, message) {
  if (!Array.isArray(items) || items.length < minimum) {
    missing.push(message);
  }
}
