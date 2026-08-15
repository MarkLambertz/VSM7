export function calculateSegmentationEvaluationTotals(workspace) {
  const options = Array.isArray(workspace?.step1?.segmentationOptions)
    ? workspace.step1.segmentationOptions
    : [];
  const criteria = Array.isArray(workspace?.step1?.keyBuyingCriteria)
    ? workspace.step1.keyBuyingCriteria
    : [];
  const strategicFields = Array.isArray(workspace?.step1?.strategicFields)
    ? workspace.step1.strategicFields
    : [];
  const scores = workspace?.step1?.evaluation?.scores || {};

  return Object.fromEntries(options.map((option) => {
    let unweighted = 0;
    let weighted = 0;

    for (const criterion of criteria) {
      const score = evaluationScore(scores, criterion.id, option.id);
      unweighted += score;
      weighted += score * criterionWeight(criterion.weight);
    }

    for (const field of strategicFields) {
      const score = evaluationScore(scores, field.id, option.id);
      unweighted += score;
      weighted += score;
    }

    return [option.id, {
      unweighted: roundTotal(unweighted),
      weighted: roundTotal(weighted)
    }];
  }));
}

function evaluationScore(scores, rowId, optionId) {
  const value = Number(scores?.[rowId]?.[optionId] || 0);
  return Number.isFinite(value) ? value : 0;
}

function criterionWeight(value) {
  const weight = Number(value);
  if (!Number.isFinite(weight)) {
    return 0;
  }

  return Math.max(0, Math.min(100, weight)) / 100;
}

function roundTotal(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
