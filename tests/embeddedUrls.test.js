import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createSampleWorkspace } from "../src/application/sampleWorkspaceFactory.js";
import { renderVsmHostFrame } from "../src/presentation/shared/vsmHostBridge.js";
import { renderSteeringMasterFrame } from "../src/presentation/shared/steeringMasterBridge.js";
import { renderStep6Channels, renderStep6E2ECheck } from "../src/presentation/steps/step6.js";
import { renderStep7 } from "../src/presentation/steps/step7.js";

const projectFile = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFileSync(projectFile(path), "utf8");
const mounts = ["/", "/vsm7/", "/bpc/tools/vsm7/"];

function frameSource(html) {
  const source = html.match(/<iframe\b[^>]*\bsrc="([^"]+)"/i)?.[1];
  assert.ok(source, "the rendered iframe has a source");
  return source.replaceAll("&amp;", "&");
}

function nestedVsmSource(path, search = "") {
  const declaration = read(path).match(/const VSM_SRC=\(\(\)=>\{[^\n]+?\}\)\(\);/)?.[0];
  assert.ok(declaration, `${path} defines its nested diagram URL`);
  return runInNewContext(`${declaration}; VSM_SRC`, { URLSearchParams, location: { search } });
}

test("all host iframe URLs retain root, application and BPC prefixes", () => {
  const workspace = createSampleWorkspace();
  const frames = [
    [renderVsmHostFrame("step5"), "vsm.html"],
    [renderSteeringMasterFrame(), "embedded/steering-master.html"],
    [renderStep6E2ECheck(workspace), "e2e-robustness-check.html"],
    [renderStep6Channels(workspace), "channel-variety-check.html"],
    [renderStep7(), "embedded/step7-ux.html"]
  ];

  for (const mount of mounts) {
    for (const entry of ["?v=host#/step7/7.7", "index.html?v=host#/step6/channels"]) {
      const base = `https://vsm7.example${mount}${entry}`;
      for (const [html, path] of frames) {
        const url = new URL(frameSource(html), base);
        assert.equal(url.origin, "https://vsm7.example");
        assert.equal(url.pathname, `${mount}${path}`);
        assert.ok(existsSync(projectFile(path)), `${path} ships with the application`);
      }
    }
  }
});

test("the Channels host and its nested VSM diagram stay under the same application prefix", () => {
  const html = renderStep6Channels(createSampleWorkspace());
  for (const mount of mounts) {
    const outer = new URL(frameSource(html), `https://vsm7.example${mount}index.html`);
    const nested = new URL(nestedVsmSource("channel-variety-check.html", outer.search), outer);
    assert.equal(nested.pathname, `${mount}vsm.html`);
    assert.equal(nested.origin, outer.origin);
    assert.equal(nested.searchParams.get("v"), "20261028-app-relative-embeds");
    assert.equal(nested.searchParams.get("pane"), "hidden");
    assert.equal(nested.searchParams.get("chrome"), "min");
  }
});

test("standalone nested diagrams use explicit HTML files without server aliases", () => {
  for (const mount of mounts) {
    for (const path of [
      "channel-variety-check.html",
      "embedded/steering-master.html",
      "embedded/org-chart.html",
      "design-previews/steering-master.html",
      "design-previews/org-chart.html"
    ]) {
      const outer = new URL(`https://vsm7.example${mount}${path}`);
      const nested = new URL(nestedVsmSource(path), outer);
      assert.equal(nested.pathname, `${mount}vsm.html`, path);
      assert.equal(nested.origin, outer.origin);
    }
  }
});

test("the app export panel uses production assets relative to the application entry", () => {
  const app = read("src/presentation/app.js");
  const source = app.match(/frame\.src = "([^\"]+export-panel\.html[^\"]*)"/)?.[1];
  assert.ok(source);
  for (const mount of mounts) {
    const url = new URL(source, `https://vsm7.example${mount}index.html?v=host#/vsm`);
    assert.equal(url.pathname, `${mount}embedded/export-panel.html`);
    assert.equal(url.origin, "https://vsm7.example");
  }
  assert.doesNotMatch(app, /design-previews\//);
});
