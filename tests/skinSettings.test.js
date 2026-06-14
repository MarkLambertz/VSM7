import test from "node:test";
import assert from "node:assert/strict";
import {
  applySkinPreference,
  defaultSkin,
  normalizeSkin,
  readSkinPreference,
  saveSkinPreference,
  skinPreferenceKey
} from "../src/presentation/skinSettings.js";

function createStorage(initialValue = null, { throwOnRead = false, throwOnWrite = false } = {}) {
  let value = initialValue;

  return {
    getItem(key) {
      assert.equal(key, skinPreferenceKey);
      if (throwOnRead) throw new Error("storage blocked");
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, skinPreferenceKey);
      if (throwOnWrite) throw new Error("storage blocked");
      value = nextValue;
    },
    value() {
      return value;
    }
  };
}

test("skin settings accept only supported skins", () => {
  assert.equal(normalizeSkin("workshop"), "workshop");
  assert.equal(normalizeSkin("command-deck"), "command-deck");
  assert.equal(normalizeSkin("unknown"), defaultSkin);
  assert.equal(normalizeSkin(null), defaultSkin);
});

test("skin settings read and save a separate user preference", () => {
  const storage = createStorage("command-deck");

  assert.equal(readSkinPreference(storage), "command-deck");
  assert.equal(saveSkinPreference("workshop", storage), "workshop");
  assert.equal(storage.value(), "workshop");
});

test("skin settings gracefully recover when browser storage is unavailable", () => {
  assert.equal(readSkinPreference(createStorage(null, { throwOnRead: true })), defaultSkin);
  assert.equal(saveSkinPreference("command-deck", createStorage(null, { throwOnWrite: true })), "command-deck");
});

test("applying a skin updates the root and normalizes invalid values", () => {
  const root = { dataset: {} };
  const storage = createStorage();

  assert.equal(applySkinPreference("command-deck", root, storage), "command-deck");
  assert.equal(root.dataset.skin, "command-deck");
  assert.equal(storage.value(), "command-deck");

  assert.equal(applySkinPreference("invalid", root, storage), defaultSkin);
  assert.equal(root.dataset.skin, defaultSkin);
});
