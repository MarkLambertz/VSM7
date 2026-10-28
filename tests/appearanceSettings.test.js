import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  applyColorModePreference,
  colorModePreferenceKey,
  defaultColorMode,
  normalizeColorMode,
  readColorModePreference,
  saveColorModePreference
} from "../src/presentation/appearanceSettings.js";

function createStorage(values = {}, { blocked = false } = {}) {
  const entries = new Map(Object.entries(values));
  return {
    getItem(key) {
      if (blocked) throw new Error("storage blocked");
      return entries.get(key) ?? null;
    },
    setItem(key, value) {
      if (blocked) throw new Error("storage blocked");
      entries.set(key, value);
    },
    entries
  };
}

test("the shared design offers only white and black modes", () => {
  assert.equal(defaultColorMode, "white");
  assert.equal(normalizeColorMode("white"), "white");
  assert.equal(normalizeColorMode("black"), "black");
  for (const value of [null, "studio", "workshop", "command-deck", "invalid"]) {
    assert.equal(normalizeColorMode(value), "white");
  }
});

test("appearance is saved separately without changing any workshop records", () => {
  const storage = createStorage({ "workshop-project": '{"name":"Example"}' });
  assert.equal(saveColorModePreference("black", storage), "black");
  assert.equal(readColorModePreference(storage), "black");
  assert.equal(storage.entries.get("workshop-project"), '{"name":"Example"}');
  assert.deepEqual([...storage.entries.keys()], ["workshop-project", colorModePreferenceKey]);
});

test("upgrading retains dark preference and explicit mode takes precedence", () => {
  for (const [legacy, expected] of [["command-deck", "black"], ["workshop", "white"], ["studio", "white"], ["invalid", "white"]]) {
    const storage = createStorage({ "vsm7-interface-skin": legacy });
    assert.equal(readColorModePreference(storage), expected);
    saveColorModePreference("white", storage);
    assert.equal(readColorModePreference(storage), "white");
  }
});

test("blocked storage never prevents applying either color mode", () => {
  const storage = createStorage({}, { blocked: true });
  assert.equal(readColorModePreference(storage), "white");
  const root = { dataset: { skin: "command-deck" } };
  assert.equal(applyColorModePreference("black", root, storage), "black");
  assert.deepEqual(root.dataset, { mode: "black" });
  assert.equal(saveColorModePreference("invalid", storage), "white");
});

test("the first-paint loader and application resolve saved appearance identically", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const source = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source);
  const savedValues = [null, "white", "black", "invalid"];
  const legacyValues = [null, "workshop", "command-deck", "studio"];
  for (const saved of savedValues) {
    for (const legacy of legacyValues) {
      const localStorage = createStorage({ [colorModePreferenceKey]: saved, "vsm7-interface-skin": legacy });
      const document = { documentElement: { dataset: {} } };
      runInNewContext(source, { document, localStorage });
      assert.equal(document.documentElement.dataset.mode, readColorModePreference(localStorage));
    }
  }
  const localStorage = createStorage({}, { blocked: true });
  const document = { documentElement: { dataset: {} } };
  runInNewContext(source, { document, localStorage });
  assert.equal(document.documentElement.dataset.mode, "white");
});

test("appearance toggle updates colors without rebuilding editor models or the app", () => {
  const app = readFileSync(new URL("../src/presentation/app.js", import.meta.url), "utf8");
  const toggle = app.match(/function toggleColorMode\(button\) \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(toggle);
  assert.match(toggle, /applyColorModePreference/);
  assert.match(toggle, /preventScroll: true/);
  assert.doesNotMatch(toggle, /render\(|renderAfter|setModel|loadModel|saveNow/);
  assert.doesNotMatch(app, /select-skin|reset-skin|Choose your VSM7 skin/);
});
