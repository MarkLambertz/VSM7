import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspace } from "../src/domain/vsm.js";
import { createWorkspaceRepository } from "../src/infrastructure/fileBackedRepository.js";

function installLocalStorageMock() {
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
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

function installFileApiMock({ available = true } = {}) {
  const state = {
    activeProjectId: "",
    projects: [],
    workspaces: {}
  };
  const requests = [];

  globalThis.XMLHttpRequest = class MockXMLHttpRequest {
    open(method, url, async) {
      this.method = method;
      this.url = url;
      this.async = async;
      this.status = 0;
      this.responseText = "";
    }

    setRequestHeader() {}

    send(body) {
      requests.push({ method: this.method, url: this.url, body });
      if (!available) {
        throw new Error("server unavailable");
      }

      const payload = body ? JSON.parse(body) : null;
      const response = handleRequest(this.method, this.url, payload, state);
      this.status = response.status || 200;
      this.responseText = JSON.stringify(response.body || {});
    }
  };

  return { requests, state };
}

function handleRequest(method, url, payload, state) {
  if (method === "GET" && url === "/api/storage/health") {
    return { body: { ok: true, mode: "file", workspaceRoot: "/tmp/VSM7-Workspaces" } };
  }

  if (method === "GET" && url === "/api/storage/projects") {
    return { body: { projects: state.projects } };
  }

  if (method === "GET" && url === "/api/storage/workspace") {
    return { body: { workspace: state.workspaces[state.activeProjectId] || null } };
  }

  if (method === "GET" && url.startsWith("/api/storage/project?id=")) {
    const id = decodeURIComponent(url.split("=").at(-1));
    return { body: { workspace: state.workspaces[id] || null } };
  }

  if (method === "POST" && url === "/api/storage/workspace") {
    const workspace = payload.workspace;
    const project = workspace.project;
    const organization = workspace.organization;
    state.workspaces[project.id] = workspace;
    if (payload.activate !== false) {
      state.activeProjectId = project.id;
    }
    const metadata = {
      id: project.id,
      name: project.name,
      organizationId: organization.id,
      organizationName: organization.name,
      sifName: workspace.sif?.name || "",
      status: project.status || "",
      createdAt: project.createdAt || "",
      updatedAt: project.updatedAt || ""
    };
    const existingIndex = state.projects.findIndex((item) => item.id === project.id);
    if (existingIndex >= 0) {
      state.projects[existingIndex] = metadata;
    } else {
      state.projects.push(metadata);
    }
    return { body: { ok: true, project: metadata } };
  }

  if (method === "POST" && url === "/api/storage/rename-project") {
    const workspace = state.workspaces[payload.projectId];
    if (workspace) {
      workspace.project.name = payload.name;
      state.projects.find((item) => item.id === payload.projectId).name = payload.name;
    }
    return { body: { ok: Boolean(workspace) } };
  }

  return { status: 404, body: { error: "missing mock route" } };
}

test("workspace repository falls back to browser storage when the file server is unavailable", () => {
  installLocalStorageMock();
  installFileApiMock({ available: false });
  const repository = createWorkspaceRepository();
  const workspace = createWorkspace();
  workspace.project.name = "Browser fallback";

  repository.save(workspace);

  assert.equal(repository.mode, "browser");
  assert.equal(repository.load().project.name, "Browser fallback");
});

test("workspace repository uses file API and migrates existing browser projects", () => {
  installLocalStorageMock();
  delete globalThis.XMLHttpRequest;
  const browserWorkspace = createWorkspace();
  browserWorkspace.project.name = "Browser project";
  const fallbackRepository = createWorkspaceRepository({ apiBase: "/missing-api" });
  fallbackRepository.save(browserWorkspace);

  const { state } = installFileApiMock();
  const repository = createWorkspaceRepository();

  assert.equal(repository.mode, "file");
  assert.equal(repository.workspaceRoot, "/tmp/VSM7-Workspaces");
  assert.equal(state.projects.length, 1);
  assert.equal(repository.load().project.name, "Browser project");

  const fileWorkspace = createWorkspace();
  fileWorkspace.project.name = "File project";
  repository.save(fileWorkspace);
  repository.renameProject(fileWorkspace.project.id, "Renamed file project");

  assert.equal(repository.loadProject(fileWorkspace.project.id).project.name, "Renamed file project");
  assert.deepEqual(repository.listProjects().map((project) => project.name).sort(), [
    "Browser project",
    "Renamed file project"
  ]);
});
