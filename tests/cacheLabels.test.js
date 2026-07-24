import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = fileURLToPath(new URL("../src", import.meta.url));
const indexPath = fileURLToPath(new URL("../index.html", import.meta.url));

test("local source modules are versioned and never imported under conflicting cache identities", () => {
  const labelsByModule = new Map();
  const unversionedImports = [];

  for (const file of sourceFiles(sourceRoot)) {
    const source = readFileSync(file, "utf8");

    for (const specifier of moduleSpecifiers(source).filter(isLocalJavaScript)) {
      const { path, label } = versionedReference(specifier);
      const modulePath = resolve(dirname(file), path);
      const labels = labelsByModule.get(modulePath) || new Set();
      labels.add(label);
      labelsByModule.set(modulePath, labels);
      if (label === "<unversioned>") {
        unversionedImports.push({ file, specifier });
      }
    }
  }

  const conflicts = [...labelsByModule.entries()]
    .filter(([, labels]) => labels.size > 1)
    .map(([modulePath, labels]) => ({ modulePath, labels: [...labels].sort() }));

  assert.deepEqual(unversionedImports, []);
  assert.deepEqual(conflicts, []);
});

test("local HTML and script asset references carry a cache label", () => {
  const files = [...sourceFiles(sourceRoot), indexPath];
  const unversionedAssets = [];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const reference of localAssetReferences(source)) {
      const url = new URL(reference, "http://vsm7.local/");
      if (!url.searchParams.has("v") && !url.searchParams.has("assetVersion")) {
        unversionedAssets.push({ file, reference });
      }
    }
  }

  assert.deepEqual(unversionedAssets, []);
});

test("cache-label scanner recognizes every supported import spelling", () => {
  const source = `
    import "./side-effect.js?v=one";
    import './single-quoted.js?v=two';
    import("./dynamic.js?v=three");
    export { value } from './re-export.js?v=four';
  `;

  assert.deepEqual(moduleSpecifiers(source).sort(), [
    "./dynamic.js?v=three",
    "./re-export.js?v=four",
    "./side-effect.js?v=one",
    "./single-quoted.js?v=two"
  ]);
});

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(path);
    }
    return path.endsWith(".js") ? [path] : [];
  });
}

function moduleSpecifiers(source) {
  const patterns = [
    /from\s+(["'])([^"']+\.js(?:\?[^"']*)?)\1/g,
    /import\s*\(\s*(["'])([^"']+\.js(?:\?[^"']*)?)\1\s*\)/g,
    /import\s+(["'])([^"']+\.js(?:\?[^"']*)?)\1/g
  ];

  return [...new Set(patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[2])))];
}

function localAssetReferences(source) {
  const pattern = /(["'])(\.\.?\/[^"']+\.(?:html|js)(?:\?[^"']*)?)\1/g;
  return [...new Set([...source.matchAll(pattern)].map((match) => match[2]))];
}

function isLocalJavaScript(specifier) {
  return /^\.\.?\//.test(specifier);
}

function versionedReference(reference) {
  const [path, query = ""] = reference.split("?", 2);
  const searchParams = new URLSearchParams(query);
  return {
    path,
    label: searchParams.get("v") || "<unversioned>"
  };
}
