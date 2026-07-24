import { createLocalStorageRepository } from "./localStorageRepository.js?v=20260724-pptxgenjs";

export class FileRepositoryError extends Error {
  constructor(message) {
    super(message);
    this.name = "FileRepositoryError";
  }
}

export function createWorkspaceRepository(options = {}) {
  const fallback = options.fallback || createLocalStorageRepository();
  const apiBase = options.apiBase || "/api/storage";
  const api = createFileApi(apiBase);
  const health = api.health();

  if (!health?.ok) {
    return decorateRepository(fallback, {
      mode: "browser",
      label: "Browser storage",
      description: "Projects are stored in this browser profile. Use export/import for backup."
    });
  }

  const repository = createFileBackedRepository({ api, fallback, health });
  repository.migrateFallbackProjects();
  return repository;
}

export function createFileBackedRepository({ api, fallback, health }) {
  let migrated = false;

  return decorateRepository({
    load() {
      const response = api.get("/workspace");
      return response.workspace || null;
    },
    save(workspace) {
      api.post("/workspace", { workspace, activate: true });
    },
    loadProject(projectId) {
      const response = api.get(`/project?id=${encodeURIComponent(projectId)}`);
      return response.workspace || null;
    },
    listProjects() {
      const response = api.get("/projects");
      return Array.isArray(response.projects) ? response.projects : [];
    },
    renameProject(projectId, name) {
      api.post("/rename-project", { projectId, name });
    },
    renameOrganization(organizationId, name) {
      api.post("/rename-organization", { organizationId, name });
    },
    deleteProject(projectId) {
      api.post("/delete-project", { projectId });
    },
    deleteOrganization(organizationId) {
      api.post("/delete-organization", { organizationId });
    },
    clear() {
      fallback.clear?.();
    },
    migrateFallbackProjects() {
      if (migrated) {
        return;
      }
      migrated = true;

      const fileProjects = this.listProjects();
      const browserProjects = fallback.listProjects?.() || [];
      if (fileProjects.length || !browserProjects.length) {
        return;
      }

      const activeWorkspace = fallback.load?.();
      const activeProjectId = activeWorkspace?.project?.id || "";
      for (const project of browserProjects) {
        const workspace = fallback.loadProject?.(project.id);
        if (workspace?.project?.id) {
          api.post("/workspace", {
            workspace,
            activate: workspace.project.id === activeProjectId
          });
        }
      }
    }
  }, {
    mode: "file",
    label: "File-backed storage",
    description: `Projects are saved as local files in ${health.workspaceRoot || "the VSM7 workspace folder"}.`,
    workspaceRoot: health.workspaceRoot || ""
  });
}

function decorateRepository(repository, metadata) {
  return Object.assign(repository, metadata, {
    isFileBacked: metadata.mode === "file"
  });
}

function createFileApi(apiBase) {
  return {
    health() {
      try {
        return request("GET", `${apiBase}/health`);
      } catch (_error) {
        return null;
      }
    },
    get(path) {
      return request("GET", `${apiBase}${path}`);
    },
    post(path, payload) {
      return request("POST", `${apiBase}${path}`, payload);
    }
  };
}

function request(method, url, payload) {
  if (typeof XMLHttpRequest === "undefined") {
    throw new FileRepositoryError("Browser file storage API is not available here.");
  }

  const request = new XMLHttpRequest();
  request.open(method, url, false);
  request.setRequestHeader("Accept", "application/json");
  if (payload !== undefined) {
    request.setRequestHeader("Content-Type", "application/json");
  }

  try {
    request.send(payload === undefined ? null : JSON.stringify(payload));
  } catch (error) {
    throw new FileRepositoryError(error?.message || "Could not reach the local VSM7 file server.");
  }

  if (request.status < 200 || request.status >= 300) {
    const message = parseJson(request.responseText)?.error || `Storage request failed (${request.status}).`;
    throw new FileRepositoryError(message);
  }

  return parseJson(request.responseText) || {};
}

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    return null;
  }
}
