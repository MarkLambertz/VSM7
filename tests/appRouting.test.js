import assert from "node:assert/strict";
import test from "node:test";
import { buildAppHash, parseAppHash } from "../src/presentation/shared/appRouting.js";

test("app route parser restores top-level views", () => {
  assert.deepEqual(parseAppHash("#/start"), { view: "start" });
  assert.deepEqual(parseAppHash("#/projects"), { view: "projects" });
  assert.deepEqual(parseAppHash("#/overview"), { view: "overview" });
  assert.deepEqual(parseAppHash(""), { view: "start" });
});

test("app route parser restores workshop subviews", () => {
  assert.deepEqual(parseAppHash("#/step1/evaluation"), {
    view: "step1",
    step1Subpage: "evaluation"
  });
  assert.deepEqual(parseAppHash("#/step2/challenges"), {
    view: "step2",
    step2Subpage: "challenges"
  });
  assert.deepEqual(parseAppHash("#/step3/register"), {
    view: "step3",
    step3Subpage: "register"
  });
  assert.deepEqual(parseAppHash("#/step5/S4"), {
    view: "step5",
    step5System: "4"
  });
  assert.deepEqual(parseAppHash("#/step6/channels"), {
    view: "step6",
    step6Subpage: "channels"
  });
  assert.deepEqual(parseAppHash("#/step7/7.2"), {
    view: "step7",
    step7Substep: "7.2"
  });
});

test("app route parser falls back safely for unknown values", () => {
  assert.deepEqual(parseAppHash("#/missing"), { view: "start" });
  assert.deepEqual(parseAppHash("#/step1/missing"), {
    view: "step1",
    step1Subpage: "sif"
  });
  assert.deepEqual(parseAppHash("#/step2/missing"), {
    view: "step2",
    step2Subpage: "assessment"
  });
  assert.deepEqual(parseAppHash("#/step3/missing"), {
    view: "step3",
    step3Subpage: "signals"
  });
  assert.deepEqual(parseAppHash("#/step6/missing"), {
    view: "step6",
    step6Subpage: "e2e"
  });
  assert.deepEqual(parseAppHash("#/step7/9.9"), {
    view: "step7",
    step7Substep: "7.1"
  });
});

test("app route builder produces reloadable workshop hashes", () => {
  assert.equal(buildAppHash({ view: "step1", step1Subpage: "six-pack" }), "#/step1/six-pack");
  assert.equal(buildAppHash({ view: "step2", step2Subpage: "challenges" }), "#/step2/challenges");
  assert.equal(buildAppHash({ view: "step3", step3Subpage: "drivers" }), "#/step3/drivers");
  assert.equal(buildAppHash({ view: "step5", step5System: "3*" }), "#/step5/S3*");
  assert.equal(buildAppHash({ view: "step6", step6Subpage: "channels" }), "#/step6/channels");
  assert.equal(buildAppHash({ view: "step7", step7Substep: "7.2" }), "#/step7/7.2");
  assert.equal(buildAppHash({ view: "implementation" }), "#/implementation");
});
