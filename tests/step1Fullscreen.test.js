import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSampleWorkspace } from "../src/application/sampleWorkspaceFactory.js";
import { createRecursionLevel } from "../src/domain/vsm.js";
import { getStep1FullscreenTileCount, renderStep1, renderStep1Fullscreen, renderStep1FullscreenTile } from "../src/presentation/steps/step1.js";

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

test("Step I evaluation opens fullscreen from the matrix tile, not the global header", () => {
  const workspace = createSampleWorkspace();
  const embeddedHtml = renderStep1(workspace, "evaluation");
  const tileHtml = renderStep1FullscreenTile(workspace, "evaluation", 1);
  const appSource = readFileSync(new URL("../src/presentation/app.js", import.meta.url), "utf8");
  const stylesSource = readFileSync(new URL("../src/presentation/styles.css", import.meta.url), "utf8");

  assert.match(embeddedHtml, /data-action="step1-tile-fullscreen-open"/);
  assert.match(embeddedHtml, /data-subpage="evaluation"/);
  assert.match(embeddedHtml, /data-tile="1"/);
  assert.match(tileHtml, /step1-fullscreen-shell is-single-tile/);
  assert.match(tileHtml, /Segmentation Evaluation/);
  assert.match(tileHtml, /evaluation-table/);
  assert.doesNotMatch(tileHtml, /step1-fullscreen-progress/);
  assert.doesNotMatch(appSource, /\$\{renderTopbarFocusButton\(\)\}/);
  assert.doesNotMatch(appSource, /function renderTopbarFocusButton/);
  assert.doesNotMatch(appSource, /focus-fullscreen-/);
  assert.doesNotMatch(appSource, /step1-fullscreen-(open|prev|next)/);
  assert.match(appSource, /steps\/step1\.js\?v=20260724-pptxgenjs/);
  assert.doesNotMatch(stylesSource, /topbar-focus-button/);
});

test("Step I exposes a shared step-level export from normal and fullscreen views", () => {
  const workspace = createSampleWorkspace();
  const embeddedHtml = renderStep1(workspace, "sif");
  const tileHtml = renderStep1FullscreenTile(workspace, "evaluation", 1);

  assert.match(embeddedHtml, /data-action="open-export-panel"/);
  assert.match(embeddedHtml, /data-export-step="step1"/);
  assert.match(embeddedHtml, /data-export-scope="step"/);
  assert.match(tileHtml, /data-action="open-export-panel"/);
  assert.match(tileHtml, /data-export-step="step1"/);
  assert.match(tileHtml, /data-export-scope="step"/);
  assert.doesNotMatch(embeddedHtml, /Download Outcome/);
});

test("every Step I substep exposes a scoped tile export", () => {
  const workspace = createSampleWorkspace();
  const expectedTiles = {
    sif: ["step1-sif", "step1-recursion"],
    segmentation: ["step1-segmentation"],
    criteria: ["step1-criteria"],
    "six-pack": ["step1-six-pack"],
    evaluation: ["step1-evaluation"]
  };

  for (const [subpage, tileIds] of Object.entries(expectedTiles)) {
    const html = renderStep1(workspace, subpage);
    for (const tileId of tileIds) {
      assert.match(html, new RegExp(`data-export-tile="${tileId}"`));
    }
  }
});

test("Step I host-owned capture tiles expose local fullscreen affordances", () => {
  const workspace = createSampleWorkspace();

  const sifHtml = renderStep1(workspace, "sif");
  assert.match(sifHtml, /data-action="step1-tile-fullscreen-open"/);
  assert.match(sifHtml, /data-subpage="sif"[\s\S]*data-tile="1"/);
  assert.match(sifHtml, /data-subpage="sif"[\s\S]*data-tile="2"/);

  const segmentationHtml = renderStep1(workspace, "segmentation");
  assert.match(segmentationHtml, /data-subpage="segmentation"[\s\S]*data-tile="1"/);

  const criteriaHtml = renderStep1(workspace, "criteria");
  assert.match(criteriaHtml, /data-subpage="criteria"[\s\S]*data-tile="1"/);

  const sixPackHtml = renderStep1(workspace, "six-pack");
  assert.equal(
    (sixPackHtml.match(/data-action="step1-tile-fullscreen-open"[\s\S]*?data-subpage="six-pack"/g) || []).length,
    workspace.step1.strategicFields.length
  );

  assert.doesNotMatch(renderStep1FullscreenTile(workspace, "sif", 1), /step1-tile-fullscreen-open/);
  assert.doesNotMatch(renderStep1FullscreenTile(workspace, "six-pack", 1), /step1-tile-fullscreen-open/);
});

test("recursion fullscreen allows additional organizations on an existing level", () => {
  const workspace = createSampleWorkspace();
  workspace.step1.recursionLevels.push(createRecursionLevel("R0", "Peer organization", ""));

  const html = renderStep1Fullscreen(workspace, "sif", 2);
  const sameLevelActions = html.match(/data-action="add-recursion-same-level"/g) || [];

  assert.equal(sameLevelActions.length, workspace.step1.recursionLevels.length);
  assert.match(html, /Peer organization/);
  assert.match(html, /title="Add organization on R0"/);
  assert.match(html, /aria-label="Add organization on R0"/);
});
