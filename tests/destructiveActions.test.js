import test from "node:test";
import assert from "node:assert/strict";
import { destructiveActionMessage } from "../src/presentation/shared/destructiveActions.js";

test("destructive item confirmations name the relevant VSM artifact", () => {
  assert.equal(
    destructiveActionMessage({
      action: "remove-item",
      collection: "step3.successCriticalTasks"
    }),
    "Delete this success-critical task? This cannot be undone."
  );

  assert.equal(
    destructiveActionMessage({
      action: "remove-item",
      collection: "step1.segmentationOptions"
    }),
    "Delete this segmentation option? This cannot be undone."
  );
});

test("destructive item confirmations use a safe generic fallback", () => {
  assert.equal(
    destructiveActionMessage({
      action: "remove-item",
      collection: "future.collection"
    }),
    "Delete this item? This cannot be undone."
  );
});

test("supporting links and files require explicit confirmation", () => {
  assert.equal(
    destructiveActionMessage({ action: "remove-strategic-link" }),
    "Delete this supporting link? This cannot be undone."
  );
  assert.equal(
    destructiveActionMessage({ action: "remove-strategic-file" }),
    "Delete this attached file? This cannot be undone."
  );
});

test("project and organization confirmations include their scope", () => {
  assert.equal(
    destructiveActionMessage({
      action: "delete-project",
      itemName: "Transformation"
    }),
    'Delete "Transformation"? This cannot be undone.'
  );
  assert.equal(
    destructiveActionMessage({
      action: "delete-organization",
      itemName: "Automotive AG",
      projectCount: 2
    }),
    'Delete "Automotive AG" and 2 projects? This cannot be undone.'
  );
});

test("non-destructive actions do not request confirmation", () => {
  assert.equal(destructiveActionMessage({ action: "add-sct" }), "");
});

test("merging SCTs requires explicit confirmation", () => {
  assert.match(
    destructiveActionMessage({ action: "merge-selected-scts" }),
    /Merge the selected SCTs/
  );
});
