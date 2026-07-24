import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("host mounts the Claude export panel through window.EXPORT api:1", () => {
  const app = readProjectFile("src/presentation/app.js");
  const styles = readProjectFile("src/presentation/styles.css");
  const index = readProjectFile("index.html");
  const starter = readProjectFile("start.command");

  assert.match(app, /handleExportBridgeMessage/);
  assert.match(app, /design-previews\/export-panel\.html\?host=vsm7&embed=1&v=20260724-pptxgenjs/);
  assert.match(app, /getExportViewModel\(workspace, getExportAppState\(\)/);
  assert.match(app, /function normalizeExportTileId/);
  assert.match(app, /tileId: normalizedTileId/);
  assert.match(app, /data-export-step="app"/);
  assert.match(app, /data-export-origin="app"/);
  assert.match(app, /function isStep6PanelExportIntent/);
  assert.match(app, /buildStep6PanelExport\(intent\)/);
  assert.match(app, /e2eRouteExportCoordinator\.request/);
  assert.match(app, /channelVarietyExportCoordinator\.request/);
  assert.match(app, /buildE2ERouteDocument/);
  assert.match(app, /exportExportIntent\(workspace, intent\)/);
  assert.doesNotMatch(app, /exportProjectReport/);
  assert.doesNotMatch(app, /exportProjectJson/);
  assert.match(app, /message\.api !== 1/);
  assert.match(styles, /\.export-panel-host-frame/);
  assert.match(styles, /\.tile-export-button/);
  assert.match(index, /app\.js\?v=20260724-pptxgenjs/);
  assert.match(starter, /VERSION="20260724-pptxgenjs"/);
});

test("host relays Step VII nested export panel events back through the Step VII frame", () => {
  const app = readProjectFile("src/presentation/app.js");
  const step7Host = readProjectFile("src/presentation/steps/step7.js");
  const step7ExportHandler = app.match(/function handleStep7ExportIntent[\s\S]*?\n}\n\nfunction findStep7FrameForSource/)?.[0] || "";

  // Export is tile-level only (PO decision 2026-07-22): the Step VII host renders NO step-level ⬇;
  // the editor's own export buttons inside the iframe are the export path.
  assert.doesNotMatch(step7Host, /data-action="open-step7-export"/);
  assert.match(app, /function handleStep7ExportBridgeMessage/);
  assert.match(app, /message\.api === 1[\s\S]*message\.evt === "export"/);
  assert.match(app, /sendStep7ExportViewModel\(frame, message\.stepId \|\| "step7", message\.tileId \|\| "all"\)/);
  assert.match(app, /exportExportIntent\(workspace, intent\)/);
  assert.match(app, /postToStep7Frame\(frame, \{\s*cmd: "exportReady"/);
  assert.match(app, /postToStep7Frame\(frame, \{\s*cmd: "exportError"/);
  assert.match(app, /cmd: "openExport"/);
  assert.doesNotMatch(step7ExportHandler, /postToExportPanel/);
});

test("host downloads client-rendered Step VII org-chart artifacts and replies to the frame", () => {
  const app = readProjectFile("src/presentation/app.js");
  const step7ExportHandler = app.match(/async function handleStep7ExportIntent[\s\S]*?\n}\n\nfunction isStep7OrgChartArtifactExportIntent/)?.[0] || "";
  const orgChartArtifactHandler = app.match(/function isStep7OrgChartArtifactExportIntent[\s\S]*?\n}\n\nfunction findStep7FrameForSource/)?.[0] || "";

  assert.match(app, /function isStep7OrgChartArtifactExportIntent/);
  assert.match(app, /intent\.stepId === "step7"/);
  assert.match(app, /intent\.tileId === "org-chart"/);
  assert.match(app, /intent\.artifact\?\.dataUrl/);
  assert.match(app, /buildStep7OrgChartArtifactExport\(intent\)/);
  assert.match(app, /fetch\(intent\.artifact\.dataUrl\)/);
  assert.match(app, /intent\.format \|\| ""\)\.toLowerCase\(\) === "pptx"/);
  assert.match(app, /buildE2ERouteDocument\("pptx", blob/);
  assert.match(app, /routeName: "Organizational Representation"/);
  assert.match(app, /downloadBrowserBlob\(artifact\.blob, artifact\.filename\)/);
  assert.match(app, /downloadName: artifact\.filename/);
  assert.match(orgChartArtifactHandler, /filename: intent\.filename \|\| intent\.artifact\.suggestedName/);
  assert.match(step7ExportHandler, /postToStep7Frame\(frame, \{\s*cmd: "exportReady"/);
  assert.match(step7ExportHandler, /requestId: intent\.requestId/);
  assert.doesNotMatch(orgChartArtifactHandler, /exportExportIntent/);
  assert.doesNotMatch(orgChartArtifactHandler, /getExportViewModel/);
});
