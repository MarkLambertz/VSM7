import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Step VII preview relays Command Deck skin to embedded Claude frames", () => {
  const html = readProjectFile("design-previews/step7-ux.html");

  assert.match(html, /function sendSkinToEmbeddedFrame/);
  assert.match(html, /postMessage\(\{cmd:'setSkin',skin\},'\*'\)/);
  assert.match(html, /postMessage\(\{cmd:'skin',skin\},'\*'\)/);
  assert.match(html, /function armEmbeddedSkinBridge/);
  assert.match(html, /frame\.addEventListener\('load',\(\)=>sendSkinToEmbeddedFrame\(frame\)\)/);
  assert.match(html, /setSkin:setStep7Skin/);
  assert.match(html, /function orgSendSkin\(\)/);
  assert.match(html, /orgSendSkin\(\); \}/);
});

test("Step VII preview preserves RASIC scroll when local cells re-render", () => {
  const html = readProjectFile("design-previews/step7-ux.html");

  assert.match(html, /function captureScrollState/);
  assert.match(html, /function renderPreservingScroll/);
  assert.match(html, /matrixTop:matrix\?matrix\.scrollTop:0/);
  assert.match(html, /requestAnimationFrame\(\(\)=>applyScrollState\(pos\)\)/);
  assert.match(html, /state\.selContrib=a\.dataset\.c;.*renderPreservingScroll\(\);emit\('rasic'/);
  assert.match(html, /state\.selContrib=a\.dataset\.c;renderPreservingScroll\(\);emit\('select'/);
});

test("Step VII host iframe uses the current Step VII cache label", () => {
  const step7Host = readProjectFile("src/presentation/steps/step7.js");
  const app = readProjectFile("src/presentation/app.js");
  const index = readProjectFile("index.html");
  const starter = readProjectFile("start.command");

  assert.match(step7Host, /20260725-step3-aspects-org-units/);
  assert.match(app, /step7\.js\?v=20260725-step3-aspects-org-units/);
  assert.match(app, /domain\/vsm\.js\?v=20260725-step3-aspects-org-units/);
  assert.match(index, /app\.js\?v=20260725-step3-aspects-org-units/);
  assert.match(starter, /VERSION="20260725-step3-aspects-org-units"/);
});
