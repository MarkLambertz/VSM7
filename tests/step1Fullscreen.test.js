import test from "node:test";
import assert from "node:assert/strict";
import { createSampleWorkspace } from "../src/application/sampleWorkspaceFactory.js";
import { createRecursionLevel } from "../src/domain/vsm.js";
import { getStep1FullscreenTileCount, renderStep1, renderStep1Fullscreen } from "../src/presentation/steps/step1.js";

test("Step I normal hero stays focused without context chips", () => {
  const html = renderStep1(createSampleWorkspace(), "sif");

  assert.doesNotMatch(html, /stage-context-strip/);
  assert.doesNotMatch(html, /Selected segmentation/);
});

test("Step I fullscreen mode splits SIF into explanation, SIF, and recursion tiles", () => {
  const workspace = createSampleWorkspace();

  assert.equal(getStep1FullscreenTileCount(workspace, "sif"), 3);
  assert.match(renderStep1Fullscreen(workspace, "sif", 1), /System-in-Focus/);
  assert.match(renderStep1Fullscreen(workspace, "sif", 2), /Recursion Levels/);
});

test("Step I fullscreen evaluation renders the giant matrix tile", () => {
  const workspace = createSampleWorkspace();
  const longDirection = "Long strategic direction ".repeat(20);
  workspace.step1.strategicFields[0].direction = longDirection;
  const html = renderStep1Fullscreen(workspace, "evaluation", 1);

  assert.equal(getStep1FullscreenTileCount(workspace, "evaluation"), 3);
  assert.match(html, /Segmentation Evaluation/);
  assert.match(html, /evaluation-table/);
  assert.match(html, /evaluation-row-strategic/);
  assert.match(html, /strategic-direction-detail-row/);
  assert.match(html, /strategic-direction-detail-cell/);
  assert.match(html, /Segmentation fit/);
  assert.match(html, /strategic-direction-preview/);
  assert.match(html, /Show full strategic direction/);
  assert.equal(
    (html.match(/strategic-direction-preview/g) || []).length,
    workspace.step1.strategicFields.length
  );
  assert.equal(html.split(longDirection).length - 1, 2);
});

test("recursion fullscreen allows additional organizations on an existing level", () => {
  const workspace = createSampleWorkspace();
  workspace.step1.recursionLevels.push(createRecursionLevel("R0", "Peer organization", ""));

  const html = renderStep1Fullscreen(workspace, "sif", 2);
  const sameLevelActions = html.match(/data-action="add-recursion-same-level"/g) || [];

  assert.equal(sameLevelActions.length, workspace.step1.recursionLevels.length);
  assert.match(html, /Peer organization/);
});
