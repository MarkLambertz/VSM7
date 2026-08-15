import test from "node:test";
import assert from "node:assert/strict";
import { getNextFlowAction } from "../src/presentation/shared/flowNavigation.js";

test("flow footer keeps transitions within the current step on sub-navigation", () => {
  const cases = [
    [{ view: "step1", step1Subpage: "sif" }, "step1-subpage", "Continue with Segmentation Options", "segmentation"],
    [{ view: "step1", step1Subpage: "segmentation" }, "step1-subpage", "Continue with Key Buying Criteria", "criteria"],
    [{ view: "step1", step1Subpage: "criteria" }, "step1-subpage", "Continue with Six Pack Fields", "six-pack"],
    [{ view: "step1", step1Subpage: "six-pack" }, "step1-subpage", "Continue with Evaluation", "evaluation"],
    [{ view: "step2", step2Subpage: "assessment" }, "step2-subpage", "Continue with Steering Challenges", "challenges"],
    [{ view: "step3", step3Subpage: "signals" }, "step3-subpage", "Continue with Complexity Drivers", "drivers"],
    [{ view: "step3", step3Subpage: "drivers" }, "step3-subpage", "Continue with SCT Register", "register"]
  ];

  for (const [state, action, label, subpage] of cases) {
    assert.deepEqual(getNextFlowAction(state), { action, label, subpage });
  }
});

test("flow footer uses the main router when the destination belongs to another step", () => {
  assert.deepEqual(getNextFlowAction({ view: "step1", step1Subpage: "evaluation" }), {
    action: "navigate",
    label: "Continue with Variety Assessment",
    view: "step2",
    subpage: "assessment"
  });
  assert.deepEqual(getNextFlowAction({ view: "step2", step2Subpage: "challenges" }), {
    action: "navigate",
    label: "Continue with SCT Input Signals",
    view: "step3",
    subpage: "signals"
  });
  assert.deepEqual(getNextFlowAction({ view: "step3", step3Subpage: "register" }), {
    action: "navigate",
    label: "Continue with Central/Decentral",
    view: "step4"
  });
});

test("flow footer continues through the remaining workshop steps", () => {
  assert.deepEqual(getNextFlowAction({ view: "step4" }), {
    action: "navigate",
    label: "Continue with Design Steering System",
    view: "step5",
    system: "3"
  });
  assert.deepEqual(getNextFlowAction({ view: "step5" }), {
    action: "navigate",
    label: "Continue with Channels",
    view: "step6",
    subpage: "e2e"
  });
  assert.deepEqual(getNextFlowAction({ view: "step6" }), {
    action: "navigate",
    label: "Continue with Representation",
    view: "step7",
    subpage: "7.1"
  });
  assert.deepEqual(getNextFlowAction({ view: "step7" }), {
    action: "navigate",
    label: "Continue with Implementation",
    view: "implementation"
  });
  assert.equal(getNextFlowAction({ view: "implementation" }), null);
});

test("left-rail Home targets the open project's overview, not project selection", async () => {
  const { readFile } = await import("node:fs/promises");
  const appSource = await readFile(new URL("../src/presentation/app.js", import.meta.url), "utf8");

  assert.match(appSource, /data-view="\$\{step\.id\}"/);
  assert.doesNotMatch(appSource, /step\.id === "overview" \? "start"/);
});

test("direct hash navigation resets the destination viewport", async () => {
  const { readFile } = await import("node:fs/promises");
  const appSource = await readFile(new URL("../src/presentation/app.js", import.meta.url), "utf8");

  assert.match(
    appSource,
    /function handleRouteHashChange\(\) \{[\s\S]*?applyRouteState\(parseAppHash\(window\.location\.hash\)\);[\s\S]*?renderAfterNavigation\(\);/
  );
});
