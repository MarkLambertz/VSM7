import { ensureWorkspaceShape } from "../domain/vsm.js";
import { projectMetadata, sortProjectMetadata } from "../domain/workspaceMetadata.js";

export async function createApiWorkspaceRepository(fallbackRepository) {
  const state = {
    activeProjectId: "",
    workspaces: new Map()
  };

  const serverState = await requestJson("/api/workspaces/state");
  hydrateState(state, serverState);
  await migrateLocalProjectsIfNeeded(state, fallbackRepository);

  return {
    load() {
      return loadActiveWorkspace(state);
    },
    save(workspace) {
      const shapedWorkspace = ensureWorkspaceShape(workspace);
      state.workspaces.set(shapedWorkspace.project.id, shapedWorkspace);
      state.activeProjectId = shapedWorkspace.project.id;
      fallbackRepository?.save?.(shapedWorkspace);
      void persistWorkspace(shapedWorkspace, true);
    },
    loadProject(projectId) {
      const workspace = state.workspaces.get(projectId) || fallbackRepository?.loadProject?.(projectId);
      if (!workspace) {
        return null;
      }

      const shapedWorkspace = ensureWorkspaceShape(workspace);
      state.workspaces.set(projectId, shapedWorkspace);
      state.activeProjectId = projectId;
      fallbackRepository?.save?.(shapedWorkspace);
      void setActiveProject(projectId);
      return shapedWorkspace;
    },
    listProjects() {
      return sortProjectMetadata(Array.from(state.workspaces.values()).map(projectMetadata));
    },
    renameProject(projectId, name) {
      const workspace = state.workspaces.get(projectId);
      if (!workspace) {
        fallbackRepository?.renameProject?.(projectId, name);
        return;
      }

      workspace.project.name = name;
      workspace.project.updatedAt = new Date().toISOString();
      fallbackRepository?.renameProject?.(projectId, name);
      void persistWorkspace(workspace, state.activeProjectId === projectId);
    },
    deleteProject(projectId) {
      state.workspaces.delete(projectId);
      if (state.activeProjectId === projectId) {
        state.activeProjectId = this.listProjects()[0]?.id || "";
      }

      fallbackRepository?.deleteProject?.(projectId);
      void requestJson(`/api/workspaces/${encodeURIComponent(projectId)}`, { method: "DELETE" });
    },
    clear() {
      state.activeProjectId = "";
      state.workspaces.clear();
      fallbackRepository?.clear?.();
      void requestJson("/api/workspaces", { method: "DELETE" });
    }
  };
}

async function migrateLocalProjectsIfNeeded(state, fallbackRepository) {
  if (!fallbackRepository || state.workspaces.size > 0) {
    return;
  }

  const localProjects = fallbackRepository.listProjects?.() || [];
  if (localProjects.length === 0) {
    return;
  }

  for (const project of localProjects) {
    const workspace = fallbackRepository.loadProject?.(project.id);
    if (workspace) {
      const shapedWorkspace = ensureWorkspaceShape(workspace);
      state.workspaces.set(shapedWorkspace.project.id, shapedWorkspace);
    }
  }

  const activeWorkspace = fallbackRepository.load?.();
  state.activeProjectId = activeWorkspace?.project?.id || localProjects[0]?.id || "";
  await requestJson("/api/workspaces/state", {
    method: "PUT",
    body: JSON.stringify({
      activeProjectId: state.activeProjectId,
      workspaces: Array.from(state.workspaces.values())
    })
  });
}

function hydrateState(state, serverState) {
  state.activeProjectId = serverState?.activeProjectId || "";
  state.workspaces.clear();

  for (const workspace of serverState?.workspaces || []) {
    const shapedWorkspace = ensureWorkspaceShape(workspace);
    state.workspaces.set(shapedWorkspace.project.id, shapedWorkspace);
  }
}

function loadActiveWorkspace(state) {
  if (state.activeProjectId && state.workspaces.has(state.activeProjectId)) {
    return state.workspaces.get(state.activeProjectId);
  }

  return Array.from(state.workspaces.values())[0] || null;
}

function persistWorkspace(workspace, activate) {
  return requestJson(`/api/workspaces/${encodeURIComponent(workspace.project.id)}`, {
    method: "PUT",
    body: JSON.stringify({ workspace, activate })
  });
}

function setActiveProject(projectId) {
  return requestJson("/api/workspaces/active", {
    method: "PUT",
    body: JSON.stringify({ projectId })
  });
}

async function requestJson(path, options = {}) {
  if (typeof fetch !== "function") {
    return requestJsonWithXhr(path, options);
  }

  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function requestJsonWithXhr(path, options = {}) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(options.method || "GET", path);
    request.setRequestHeader("content-type", "application/json");

    for (const [header, value] of Object.entries(options.headers || {})) {
      request.setRequestHeader(header, value);
    }

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`API request failed: ${request.status}`));
        return;
      }

      if (request.status === 204 || !request.responseText) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(request.responseText));
      } catch (error) {
        reject(error);
      }
    };

    request.onerror = () => reject(new Error("API request failed"));
    request.send(options.body || null);
  });
}
