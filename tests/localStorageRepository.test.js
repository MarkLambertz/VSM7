import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspace } from "../src/domain/vsm.js";
import { createLocalStorageRepository, StorageQuotaError } from "../src/infrastructure/localStorageRepository.js";

function installLocalStorageMock({ throwOnSet = false } = {}) {
  const store = new Map();

  globalThis.localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      if (throwOnSet) {
        const error = new Error("quota");
        error.name = "QuotaExceededError";
        throw error;
      }

      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };

  return store;
}

test("localStorage repository saves, indexes, and reloads workspaces", () => {
  installLocalStorageMock();
  const repository = createLocalStorageRepository();
  const workspace = createWorkspace();
  workspace.project.name = "Saved project";

  repository.save(workspace);

  assert.equal(repository.load().project.name, "Saved project");
  assert.equal(repository.listProjects()[0].name, "Saved project");
});

test("localStorage repository turns quota failures into a clear storage error", () => {
  installLocalStorageMock({ throwOnSet: true });
  const repository = createLocalStorageRepository();
  const workspace = createWorkspace();

  assert.throws(() => repository.save(workspace), StorageQuotaError);
});
