import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script, runInNewContext } from "node:vm";
import { renderStep7 } from "../src/presentation/steps/step7.js";

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

for (const directory of ["embedded", "design-previews"]) {
  test(`Step VII ${directory} retains its standalone editors and host bridges`, () => {
    for (const [filename, bridge, commands] of [
      ["step7-ux.html", "STEP7", ["setContext", "loadModel", "goto", "openExport", "getState"]],
      ["org-chart.html", "ORG", ["setContext", "loadModel", "renderExport", "getState"]],
      ["export-panel.html", "EXPORT", ["setViewModel", "open", "setBundle", "exportReady", "exportError"]],
      ["meeting-landscape.html", "MTL", ["setContext", "loadModel", "setHorizon", "getState"]]
    ]) {
      const html = readProjectFile(`${directory}/${filename}`);
      const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
      assert.ok(scripts.length, `${filename} keeps its implementation`);
      for (const source of scripts) {
        assert.doesNotThrow(() => new Script(source, { filename: `${directory}/${filename}` }));
      }
      assert.match(html, new RegExp(`window\\.${bridge}\\s*=`));
      for (const command of commands) {
        assert.ok(html.includes(command), `${filename} keeps ${command}`);
      }
      assert.doesNotMatch(html, /(?:src|href)\s*=\s*["'][^"']*design-previews\//i);
    }
  });

  test(`Step VII ${directory} relays Command Deck skin to embedded frames`, () => {
    const html = readProjectFile(`${directory}/step7-ux.html`);

    assert.match(html, /function sendSkinToEmbeddedFrame/);
    assert.match(html, /postMessage\(\{cmd:'setSkin',skin\},'\*'\)/);
    assert.match(html, /postMessage\(\{cmd:'skin',skin\},'\*'\)/);
    assert.match(html, /function armEmbeddedSkinBridge/);
    assert.match(html, /frame\.addEventListener\('load',\(\)=>sendSkinToEmbeddedFrame\(frame\)\)/);
    assert.match(html, /setSkin:setStep7Skin/);
    assert.match(html, /function orgSendSkin\(\)/);
    assert.match(html, /orgSendSkin\(\); \}/);
  });

  test(`Step VII ${directory} preserves RASIC scroll when local cells re-render`, () => {
    const html = readProjectFile(`${directory}/step7-ux.html`);

    assert.match(html, /function captureScrollState/);
    assert.match(html, /function renderPreservingScroll/);
    assert.match(html, /matrixTop:matrix\?matrix\.scrollTop:0/);
    assert.match(html, /requestAnimationFrame\(\(\)=>applyScrollState\(pos\)\)/);
    assert.match(html, /state\.selContrib=a\.dataset\.c;.*renderPreservingScroll\(\);emit\('rasic'/);
    assert.match(html, /state\.selContrib=a\.dataset\.c;renderPreservingScroll\(\);emit\('select'/);
  });
}

test("Step VII opens with the same workshop-stage tile pattern as the other steps", () => {
  const html = renderStep7();

  assert.match(html, /generic-step-stage/);
  assert.match(html, /Step VII/);
  assert.match(html, /Representation &amp; Accountability/);
  assert.match(html, /Connect SCT contributions to roles, functions, meetings, RASIC accountability/);
  assert.match(html, /Role constellation/);
  assert.match(html, /data-step7-frame/);
});

test("Step VII host loads the production editor beneath the application path", () => {
  const html = renderStep7();
  const source = html.match(/\bsrc="([^"]+)"/)?.[1];
  assert.ok(source);
  const url = new URL(source, "https://vsm7.example/vsm7/?v=host#/step7");

  assert.equal(url.pathname, "/vsm7/embedded/step7-ux.html");
  assert.equal(url.searchParams.get("host"), "vsm7");
  assert.equal(url.searchParams.get("v"), "20261028-app-relative-embeds");
  assert.doesNotMatch(source, /design-previews|localhost|127\.0\.0\.1/);
});

for (const directory of ["embedded", "design-previews"]) {
  test(`Step VII ${directory} nested chart and export URLs retain the application prefix and cache label`, () => {
    const html = readProjectFile(`${directory}/step7-ux.html`);
    const base = `https://vsm7.example/vsm7/${directory}/step7-ux.html?v=cache-label`;
    for (const [name, filename] of [["orgSrc", "org-chart.html"], ["expSrc", "export-panel.html"]]) {
      const fn = html.match(new RegExp(`function ${name}\\(\\)\\{[^\\n]+?\\}`))?.[0];
      assert.ok(fn, `${name} remains available`);
      const source = runInNewContext(`${fn}; ${name}()`, {
        URLSearchParams,
        location: { search: new URL(base).search }
      });
      const url = new URL(source, base);
      assert.equal(url.pathname, `/vsm7/${directory}/${filename}`);
      assert.equal(url.searchParams.get("v"), "cache-label");
      assert.equal(url.origin, "https://vsm7.example");
      assert.match(readProjectFile(`${directory}/${filename}`), /<!doctype html>/i);
    }
  });

  test(`Step VII ${directory} nested VSM uses the real HTML asset beneath the application prefix`, () => {
    const html = readProjectFile(`${directory}/org-chart.html`);
    const declaration = html.match(/const VSM_SRC=\(\(\)=>\{[^\n]+?\}\)\(\);/)?.[0];
    assert.ok(declaration);
    const source = runInNewContext(`${declaration}; VSM_SRC`, {
      URLSearchParams,
      location: { search: "" }
    });
    const url = new URL(source, `https://vsm7.example/vsm7/${directory}/org-chart.html`);
    assert.equal(url.pathname, "/vsm7/vsm.html");
    assert.equal(url.searchParams.get("pane"), "hidden");
    assert.equal(url.searchParams.get("chrome"), "min");
    assert.equal(url.origin, "https://vsm7.example");
  });
}
