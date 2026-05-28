import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createWorkspace } from "../src/domain/vsm.js";
import { createFileWorkspaceStore } from "../src/server/fileWorkspaceStore.js";

test("file workspace store saves, lists, activates, and deletes projects", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "vsm7-store-"));
  const store = createFileWorkspaceStore({ filePath: path.join(directory, "workspaces.json") });

  try {
    assert.deepEqual(await store.listProjects(), []);

    const first = createWorkspace();
    first.project.name = "First project";
    await store.saveWorkspace(first);

    const second = createWorkspace();
    second.project.name = "Second project";
    await store.saveWorkspace(second);

    const projects = await store.listProjects();
    assert.equal(projects.length, 2);
    assert.equal((await store.getActiveWorkspace()).project.id, second.project.id);

    await store.setActiveProject(first.project.id);
    assert.equal((await store.getActiveWorkspace()).project.id, first.project.id);

    await store.deleteWorkspace(first.project.id);
    assert.equal((await store.getActiveWorkspace()).project.id, second.project.id);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
