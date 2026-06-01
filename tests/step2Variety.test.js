import test from "node:test";
import assert from "node:assert/strict";
import {
  createOperativeUnit,
  createSegmentationOption,
  createWorkspace,
  evaluateStep2Variety,
  isStep2SliderAssessed,
  resetStep2SlidersToNeutral
} from "../src/domain/vsm.js";
import { renderStep2Assessment } from "../src/presentation/steps/step2.js";

function workspaceWithStep2({ horizontal = {}, vertical = {}, unitCount = 3 } = {}) {
  const workspace = createWorkspace();
  const option = createSegmentationOption("Business Models", "Segment by business model.");
  workspace.step1.segmentationOptions = [option];
  workspace.step1.selectedSegmentationOptionId = option.id;
  workspace.step1.operativeUnits = Array.from({ length: unitCount }, (_, index) => createOperativeUnit(`S1-${index + 1}`));
  Object.assign(workspace.step2.horizontalAssessment, horizontal);
  Object.assign(workspace.step2.verticalAssessment, vertical);
  return workspace;
}

function metrics(overrides) {
  return evaluateStep2Variety(workspaceWithStep2(overrides));
}

test("Step II 01 neutral sliders produce a neutral variety fit", () => {
  const result = metrics();

  assert.equal(result.horizontalPressure, 50);
  assert.equal(result.verticalDemand, 50);
  assert.equal(result.verticalCapacity, 50);
  assert.equal(result.verticalFit, 50);
  assert.equal(result.fitGap, 0);
  assert.equal(result.fitPosition, 50);
});

test("Step II 02 missing slider values default to neutral 50", () => {
  const result = evaluateStep2Variety({ step1: {}, step2: { horizontalAssessment: {}, verticalAssessment: {} } });

  assert.equal(result.horizontalPressure, 50);
  assert.equal(result.verticalDemand, 50);
  assert.equal(result.verticalCapacity, 50);
  assert.equal(result.fitPosition, 50);
});

test("Step II 03 invalid slider values default to neutral 50", () => {
  const result = metrics({
    horizontal: { operativeUnitsAmount: "not-a-number", dissimilarity: "", selfControl: undefined },
    vertical: {
      environmentalOverlaps: "bad",
      operationalDependencies: "",
      system3Star: null,
      resourceBargain: undefined,
      corporateIntervention: "x",
      system2: "?"
    }
  });

  assert.equal(result.horizontalPressure, 50);
  assert.equal(result.verticalDemand, 50);
  assert.equal(result.verticalCapacity, 50);
});

test("Step II 04 slider values are clamped into the 0 to 100 range", () => {
  const result = metrics({
    horizontal: { operativeUnitsAmount: "140", dissimilarity: "-20", selfControl: "1000" },
    vertical: {
      environmentalOverlaps: "130",
      operationalDependencies: "-10",
      system3Star: "200",
      resourceBargain: "-20",
      corporateIntervention: "60",
      system2: "40"
    }
  });

  assert.equal(result.drivers.operativeUnitsAmount, 100);
  assert.equal(result.drivers.dissimilarity, 0);
  assert.equal(result.drivers.selfControl, 100);
  assert.equal(result.drivers.environmentalOverlaps, 100);
  assert.equal(result.drivers.operationalDependencies, 0);
  assert.equal(result.drivers.system3Star, 100);
});

test("Step II 05 more operative units increase horizontal variety pressure", () => {
  const low = metrics({ horizontal: { operativeUnitsAmount: "10" } });
  const high = metrics({ horizontal: { operativeUnitsAmount: "90" } });

  assert.ok(high.horizontalPressure > low.horizontalPressure);
});

test("Step II 06 higher dissimilarity increases horizontal variety pressure", () => {
  const low = metrics({ horizontal: { dissimilarity: "10" } });
  const high = metrics({ horizontal: { dissimilarity: "90" } });

  assert.ok(high.horizontalPressure > low.horizontalPressure);
});

test("Step II 07 stronger S1 self-control reduces horizontal variety pressure", () => {
  const weakSelfControl = metrics({ horizontal: { selfControl: "10" } });
  const strongSelfControl = metrics({ horizontal: { selfControl: "90" } });

  assert.ok(strongSelfControl.horizontalPressure < weakSelfControl.horizontalPressure);
});

test("Step II 08 maximum self-control can offset otherwise neutral horizontal pressure", () => {
  const result = metrics({ horizontal: { operativeUnitsAmount: "50", dissimilarity: "50", selfControl: "100" } });

  assert.equal(result.horizontalPressure, 33);
});

test("Step II 09 environmental overlaps increase vertical demand and reduce vertical fit when capacity is unchanged", () => {
  const low = metrics({ vertical: { environmentalOverlaps: "10", operationalDependencies: "50" } });
  const high = metrics({ vertical: { environmentalOverlaps: "90", operationalDependencies: "50" } });

  assert.ok(high.verticalDemand > low.verticalDemand);
  assert.ok(high.verticalFit < low.verticalFit);
});

test("Step II 10 operational dependencies increase vertical demand and reduce vertical fit when capacity is unchanged", () => {
  const low = metrics({ vertical: { environmentalOverlaps: "50", operationalDependencies: "10" } });
  const high = metrics({ vertical: { environmentalOverlaps: "50", operationalDependencies: "90" } });

  assert.ok(high.verticalDemand > low.verticalDemand);
  assert.ok(high.verticalFit < low.verticalFit);
});

test("Step II 11 stronger System 3* raises available vertical steering variety", () => {
  const low = metrics({ vertical: { system3Star: "10" } });
  const high = metrics({ vertical: { system3Star: "90" } });

  assert.ok(high.verticalCapacity > low.verticalCapacity);
  assert.ok(high.verticalFit > low.verticalFit);
});

test("Step II 12 stronger resource bargain raises available vertical steering variety", () => {
  const low = metrics({ vertical: { resourceBargain: "10" } });
  const high = metrics({ vertical: { resourceBargain: "90" } });

  assert.ok(high.verticalCapacity > low.verticalCapacity);
  assert.ok(high.verticalFit > low.verticalFit);
});

test("Step II 13 stronger corporate intervention raises available vertical steering variety", () => {
  const low = metrics({ vertical: { corporateIntervention: "10" } });
  const high = metrics({ vertical: { corporateIntervention: "90" } });

  assert.ok(high.verticalCapacity > low.verticalCapacity);
  assert.ok(high.verticalFit > low.verticalFit);
});

test("Step II 14 stronger System 2 raises available vertical steering variety", () => {
  const low = metrics({ vertical: { system2: "10" } });
  const high = metrics({ vertical: { system2: "90" } });

  assert.ok(high.verticalCapacity > low.verticalCapacity);
  assert.ok(high.verticalFit > low.verticalFit);
});

test("Step II 15 required cohesion variety uses the stronger pressure driver", () => {
  const horizontalDominates = metrics({
    horizontal: { operativeUnitsAmount: "90", dissimilarity: "90", selfControl: "10" },
    vertical: { environmentalOverlaps: "20", operationalDependencies: "20" }
  });
  const verticalDemandDominates = metrics({
    horizontal: { operativeUnitsAmount: "20", dissimilarity: "20", selfControl: "90" },
    vertical: { environmentalOverlaps: "90", operationalDependencies: "90" }
  });

  assert.equal(horizontalDominates.requiredCohesionVariety, horizontalDominates.horizontalPressure);
  assert.equal(verticalDemandDominates.requiredCohesionVariety, verticalDemandDominates.verticalDemand);
});

test("Step II 16 an under-absorbed pattern moves the fit marker left and explains the fit gap", () => {
  const result = metrics({
    horizontal: { operativeUnitsAmount: "90", dissimilarity: "85", selfControl: "20" },
    vertical: {
      environmentalOverlaps: "80",
      operationalDependencies: "85",
      system3Star: "35",
      resourceBargain: "35",
      corporateIntervention: "30",
      system2: "40"
    }
  });

  assert.ok(result.fitGap < -20);
  assert.ok(result.fitPosition < 40);
  assert.equal(result.interpretationCards[0].title, "Variety fit gap");
});

test("Step II 17 a steering surplus pattern moves the fit marker right and asks about over-steering", () => {
  const result = metrics({
    horizontal: { operativeUnitsAmount: "20", dissimilarity: "20", selfControl: "90" },
    vertical: {
      environmentalOverlaps: "20",
      operationalDependencies: "20",
      system3Star: "90",
      resourceBargain: "90",
      corporateIntervention: "90",
      system2: "90"
    }
  });

  assert.ok(result.fitGap > 25);
  assert.ok(result.fitPosition > 60);
  assert.equal(result.interpretationCards[0].title, "Steering capacity surplus");
});

test("Step II 18 high but matched variety is treated as demanding, not falsely safe", () => {
  const result = metrics({
    horizontal: { operativeUnitsAmount: "85", dissimilarity: "85", selfControl: "15" },
    vertical: {
      environmentalOverlaps: "80",
      operationalDependencies: "80",
      system3Star: "90",
      resourceBargain: "85",
      corporateIntervention: "80",
      system2: "85"
    }
  });

  assert.ok(Math.abs(result.fitGap) <= 20);
  assert.equal(result.interpretationCards[0].title, "Demanding variety fit");
});

test("Step II 19 many S1s with high operative variety generate a recursion-level bundling question", () => {
  const result = metrics({
    unitCount: 5,
    horizontal: { operativeUnitsAmount: "90", dissimilarity: "80", selfControl: "20" }
  });

  assert.ok(result.interpretationCards.some((card) => card.question.includes("additional recursion level")));
});

test("Step II 20 rendered assessment exposes all nine sliders and computed gauges", () => {
  const workspace = workspaceWithStep2({
    horizontal: { operativeUnitsAmount: "90", dissimilarity: "80", selfControl: "20" },
    vertical: {
      environmentalOverlaps: "60",
      system3Star: "70",
      operationalDependencies: "80",
      resourceBargain: "50",
      corporateIntervention: "40",
      system2: "90"
    }
  });
  const html = renderStep2Assessment(workspace);

  assert.equal((html.match(/type="range"/g) || []).length, 9);
  assert.equal((html.match(/data-action="reset-variety-slider"/g) || []).length, 9);
  assert.match(html, /data-action="reset-step2-sliders"/);
  assert.match(html, /Reset sliders/);
  assert.equal((html.match(/data-variety-driver="horizontal"/g) || []).length, 3);
  assert.equal((html.match(/data-variety-driver="vertical"/g) || []).length, 6);
  assert.match(html, /--variety-pressure: 83%/);
  assert.match(html, /--vertical-variety: 46%/);
  assert.match(html, /--variety-fit-position: 40%/);
  assert.match(html, /pattern reading/);
});

test("Step II 21 reset all sliders returns assessment to neutral middle position", () => {
  const workspace = workspaceWithStep2({
    horizontal: { operativeUnitsAmount: "90", dissimilarity: "80", selfControl: "20" },
    vertical: {
      environmentalOverlaps: "60",
      system3Star: "70",
      operationalDependencies: "80",
      resourceBargain: "40",
      corporateIntervention: "30",
      system2: "90"
    }
  });

  resetStep2SlidersToNeutral(workspace);

  assert.deepEqual(
    [
      workspace.step2.horizontalAssessment.operativeUnitsAmount,
      workspace.step2.horizontalAssessment.dissimilarity,
      workspace.step2.horizontalAssessment.selfControl,
      workspace.step2.verticalAssessment.environmentalOverlaps,
      workspace.step2.verticalAssessment.system3Star,
      workspace.step2.verticalAssessment.operationalDependencies,
      workspace.step2.verticalAssessment.resourceBargain,
      workspace.step2.verticalAssessment.corporateIntervention,
      workspace.step2.verticalAssessment.system2
    ],
    Array(9).fill("50")
  );
  assert.equal(isStep2SliderAssessed(workspace, "horizontalAssessment", "operativeUnitsAmount"), true);
  assert.equal(evaluateStep2Variety(workspace).fitPosition, 50);
});
