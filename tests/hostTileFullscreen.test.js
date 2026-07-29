import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSampleWorkspace } from "../src/application/sampleWorkspaceFactory.js";
import { taskSources, vsmSystems } from "../src/domain/vsm.js";
import { renderOverview, renderOverviewFullscreenTile } from "../src/presentation/steps/overview.js";
import { renderStep2, renderStep2FullscreenTile } from "../src/presentation/steps/step2.js";
import { renderStep3, renderStep3FullscreenTile } from "../src/presentation/steps/step3.js";
import { renderStep5, renderStep5FullscreenTile } from "../src/presentation/steps/step5.js";
import { renderStep6, renderStep6FullscreenTile } from "../src/presentation/steps/step6.js";
import { renderImplementation, renderImplementationFullscreenTile } from "../src/presentation/steps/implementation.js";

function assertHostTileButton(html, tileId) {
  assert.match(html, /data-action="host-tile-fullscreen-open"/);
  assert.match(html, new RegExp(`data-tile="${tileId}"`));
}

function assertFullscreenTile(html, title) {
  assert.match(html, /step1-fullscreen-shell is-single-tile/);
  assert.match(html, /step1-fullscreen-tile/);
  assert.match(html, new RegExp(title));
  assert.doesNotMatch(html, /step1-fullscreen-progress/);
}

function assertTileExportButton(html, stepId, tileId) {
  assert.match(html, /data-action="open-export-panel"/);
  assert.match(html, new RegExp(`data-export-step="${stepId}"`));
  assert.match(html, new RegExp(`data-export-tile="${tileId}"`));
}

test("host-owned overview tiles expose local fullscreen surfaces", () => {
  const workspace = createSampleWorkspace();
  const html = renderOverview(workspace);
  const projectFrameFullscreen = renderOverviewFullscreenTile(workspace, "overview-project-frame");

  assertHostTileButton(html, "overview-project-frame");
  assertTileExportButton(html, "overview", "overview-project-frame");
  assertTileExportButton(projectFrameFullscreen, "overview", "overview-project-frame");
  assertFullscreenTile(projectFrameFullscreen, "Project Frame");
  assert.doesNotMatch(html, /overview-step-outcomes/);
  assert.doesNotMatch(html, /data-action="export-step"/);
});

test("host-owned Step II tiles expose local fullscreen surfaces", () => {
  const workspace = createSampleWorkspace();
  const assessmentFullscreen = renderStep2FullscreenTile(workspace, "step2-assessment");
  const remediesFullscreen = renderStep2FullscreenTile(workspace, "step2-remedies");

  assertHostTileButton(renderStep2(workspace), "step2-assessment");
  assertHostTileButton(renderStep2(workspace, "challenges"), "step2-remedies");
  assertTileExportButton(renderStep2(workspace), "step2", "step2-assessment");
  assertTileExportButton(renderStep2(workspace, "challenges"), "step2", "step2-remedies");
  assertTileExportButton(assessmentFullscreen, "step2", "step2-assessment");
  assertTileExportButton(remediesFullscreen, "step2", "step2-remedies");
  assertFullscreenTile(assessmentFullscreen, "Variety Assessment");
  assertFullscreenTile(remediesFullscreen, "Manageability Levers");
});

test("host-owned Step III tiles expose local fullscreen surfaces", () => {
  const workspace = createSampleWorkspace();

  assertHostTileButton(renderStep3(workspace, taskSources, vsmSystems), "step3-hints");
  assertHostTileButton(renderStep3(workspace, taskSources, vsmSystems, { activeSubpage: "drivers" }), "step3-drivers");
  assertHostTileButton(renderStep3(workspace, taskSources, vsmSystems, { activeSubpage: "register" }), "step3-register");
  assertFullscreenTile(renderStep3FullscreenTile(workspace, taskSources, {}, "step3-hints"), "SCT Input Signals");
  assertFullscreenTile(renderStep3FullscreenTile(workspace, taskSources, {}, "step3-drivers"), "Complexity Drivers");
  assertFullscreenTile(renderStep3FullscreenTile(workspace, taskSources, {}, "step3-register"), "Success-Critical Task Register");
});

test("host-owned Step V tiles expose local fullscreen surfaces", () => {
  const workspace = createSampleWorkspace();
  const html = renderStep5(workspace, { activeStep5System: "3" });

  assertHostTileButton(html, "step5-mapping");
  assertHostTileButton(html, "step5-signals");
  assertFullscreenTile(renderStep5FullscreenTile(workspace, { activeStep5System: "3" }, "step5-mapping"), "SCT-to-VSM-System Mapping");
  assertFullscreenTile(renderStep5FullscreenTile(workspace, { activeStep5System: "3" }, "step5-signals"), "Steering-System Signals");
});

test("host-owned Step VI containers expose local fullscreen surfaces without changing embedded files", () => {
  const workspace = createSampleWorkspace();
  const e2eHtml = renderStep6(workspace, { activeSubpage: "e2e" });
  const channelsHtml = renderStep6(workspace, { activeSubpage: "channels" });
  const e2eFullscreen = renderStep6FullscreenTile(workspace, {}, "step6-e2e");
  const channelsFullscreen = renderStep6FullscreenTile(workspace, {}, "step6-channels");

  assertHostTileButton(e2eHtml, "step6-e2e");
  assertHostTileButton(channelsHtml, "step6-channels");
  assertTileExportButton(e2eHtml, "step6", "step6-e2e");
  assertTileExportButton(channelsHtml, "step6", "step6-channels");
  assertTileExportButton(e2eFullscreen, "step6", "step6-e2e");
  assertTileExportButton(channelsFullscreen, "step6", "step6-channels");
  assertFullscreenTile(e2eFullscreen, "E2E Process Robustness Check");
  assertFullscreenTile(channelsFullscreen, "Communication Variety Checks");
});

test("host-owned implementation tiles expose local fullscreen surfaces", () => {
  const workspace = createSampleWorkspace();
  const html = renderImplementation(workspace);
  const backlogFullscreen = renderImplementationFullscreenTile(workspace, "implementation-backlog");

  assertHostTileButton(html, "implementation-findings");
  assertHostTileButton(html, "implementation-channel-weaknesses");
  assertHostTileButton(html, "implementation-backlog");
  assertTileExportButton(html, "implementation", "implementation-backlog");
  assertTileExportButton(backlogFullscreen, "implementation", "implementation-backlog");
  assertFullscreenTile(renderImplementationFullscreenTile(workspace, "implementation-findings"), "E2E Finding Candidates");
  assertFullscreenTile(renderImplementationFullscreenTile(workspace, "implementation-channel-weaknesses"), "Communication Weakness Candidates");
  assertFullscreenTile(backlogFullscreen, "Transformation Backlog");
});

test("host fullscreen modules use one cache label", () => {
  const appSource = readFileSync(new URL("../src/presentation/app.js", import.meta.url), "utf8");
  const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const starter = readFileSync(new URL("../start.command", import.meta.url), "utf8");

  assert.match(appSource, /renderHostTileFullscreenLayer/);
  assert.match(appSource, /20260729-steering-master-nav-audit/);
  assert.match(index, /app\.js\?v=20260729-steering-master-nav-audit/);
  assert.match(starter, /VERSION="20260729-steering-master-nav-audit"/);
});
