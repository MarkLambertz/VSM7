import test from "node:test";
import assert from "node:assert/strict";
import {
  canCompleteStep,
  createWorkspace,
  ensureWorkspaceShape,
  isStepComplete,
  setStepCompletion,
  workflowStepOrder
} from "../src/domain/vsm.js";

test("new workspaces start with human workflow completion unmarked", () => {
  const workspace = createWorkspace();

  for (const stepId of workflowStepOrder) {
    assert.equal(isStepComplete(workspace, stepId), false);
  }
  assert.equal(canCompleteStep(workspace, "step1"), true);
  assert.equal(canCompleteStep(workspace, "step2"), false);
});

test("workflow steps can only be marked done in sequence", () => {
  const workspace = createWorkspace();

  assert.equal(setStepCompletion(workspace, "step2", true), false);
  assert.equal(isStepComplete(workspace, "step2"), false);
  assert.equal(setStepCompletion(workspace, "step1", true), true);
  assert.equal(canCompleteStep(workspace, "step2"), true);
  assert.equal(setStepCompletion(workspace, "step2", true), true);
  assert.equal(isStepComplete(workspace, "step2"), true);
});

test("unmarking an earlier workflow step clears all downstream checks", () => {
  const workspace = createWorkspace();
  setStepCompletion(workspace, "step1", true);
  setStepCompletion(workspace, "step2", true);
  setStepCompletion(workspace, "step3", true);

  setStepCompletion(workspace, "step2", false);

  assert.equal(isStepComplete(workspace, "step1"), true);
  assert.equal(isStepComplete(workspace, "step2"), false);
  assert.equal(isStepComplete(workspace, "step3"), false);
});

test("workspace repair removes impossible workflow completion gaps", () => {
  const workspace = ensureWorkspaceShape({
    workflow: {
      completedSteps: {
        step1: true,
        step2: false,
        step3: true,
        step4: true
      }
    }
  });

  assert.equal(isStepComplete(workspace, "step1"), true);
  assert.equal(isStepComplete(workspace, "step2"), false);
  assert.equal(isStepComplete(workspace, "step3"), false);
  assert.equal(isStepComplete(workspace, "step4"), false);
});
