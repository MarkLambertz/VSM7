const legacyStorageKey = "vsm-workshop-workspace:v1";
const activeProjectKey = "vsm-workshop-active-project:v1";
const projectIndexKey = "vsm-workshop-project-index:v1";
const projectStoragePrefix = "vsm-workshop-project:v1:";

export class StorageQuotaError extends Error {
  constructor() {
    super("The workspace is too large for browser storage.");
    this.name = "StorageQuotaError";
  }
}

export function createLocalStorageRepository() {
  return {
    load() {
      try {
        migrateLegacyWorkspace();
        const activeProjectId = localStorage.getItem(activeProjectKey);
        const activeWorkspace = activeProjectId ? loadProject(activeProjectId) : null;
        if (activeWorkspace) {
          return activeWorkspace;
        }

        const [firstProject] = readProjectIndex();
        return firstProject ? loadProject(firstProject.id) : null;
      } catch {
        return null;
      }
    },
    save(workspace) {
      persistProject(workspace, { activate: true });
    },
    loadProject(projectId) {
      return loadProject(projectId);
    },
    listProjects() {
      migrateLegacyWorkspace();
      return readProjectIndex();
    },
    renameProject(projectId, name) {
      const workspace = loadProject(projectId);
      if (!workspace) {
        return;
      }

      workspace.project.name = name;
      workspace.project.updatedAt = new Date().toISOString();
      persistProject(workspace, { activate: localStorage.getItem(activeProjectKey) === projectId });
    },
    renameOrganization(organizationId, name) {
      const projects = readProjectIndex().filter((project) => projectBelongsToOrganization(project, organizationId));
      const activeProjectId = localStorage.getItem(activeProjectKey);

      for (const project of projects) {
        const workspace = loadProject(project.id);
        if (!workspace) {
          continue;
        }

        workspace.organization ||= {};
        workspace.organization.id ||= project.organizationId || organizationId;
        workspace.organization.name = name;
        workspace.project.updatedAt = new Date().toISOString();
        persistProject(workspace, { activate: activeProjectId === project.id });
      }
    },
    deleteProject(projectId) {
      localStorage.removeItem(projectStorageKey(projectId));
      const nextIndex = readProjectIndex().filter((project) => project.id !== projectId);
      writeProjectIndex(nextIndex);

      if (localStorage.getItem(activeProjectKey) === projectId) {
        const [nextProject] = nextIndex;
        if (nextProject) {
          localStorage.setItem(activeProjectKey, nextProject.id);
        } else {
          localStorage.removeItem(activeProjectKey);
        }
      }
    },
    deleteOrganization(organizationId) {
      const projects = readProjectIndex();
      const projectIdsToDelete = new Set(
        projects
          .filter((project) => projectBelongsToOrganization(project, organizationId))
          .map((project) => project.id)
      );

      for (const projectId of projectIdsToDelete) {
        localStorage.removeItem(projectStorageKey(projectId));
      }

      const nextIndex = projects.filter((project) => !projectIdsToDelete.has(project.id));
      writeProjectIndex(nextIndex);

      if (projectIdsToDelete.has(localStorage.getItem(activeProjectKey))) {
        const [nextProject] = nextIndex;
        if (nextProject) {
          localStorage.setItem(activeProjectKey, nextProject.id);
        } else {
          localStorage.removeItem(activeProjectKey);
        }
      }
    },
    clear() {
      const projects = readProjectIndex();
      for (const project of projects) {
        localStorage.removeItem(projectStorageKey(project.id));
      }

      localStorage.removeItem(legacyStorageKey);
      localStorage.removeItem(activeProjectKey);
      localStorage.removeItem(projectIndexKey);
    }
  };
}

function migrateLegacyWorkspace() {
  const projects = readProjectIndex();
  if (projects.length > 0) {
    return;
  }

  const raw = localStorage.getItem(legacyStorageKey);
  if (!raw) {
    return;
  }

  try {
    const workspace = JSON.parse(raw);
    if (workspace?.project?.id) {
      persistProject(workspace, { activate: true });
    }
  } catch {
    localStorage.removeItem(legacyStorageKey);
  }
}

function persistProject(workspace, { activate }) {
  try {
    localStorage.setItem(projectStorageKey(workspace.project.id), JSON.stringify(workspace));
    upsertProjectMetadata(workspace);

    if (activate) {
      localStorage.setItem(activeProjectKey, workspace.project.id);
    }
  } catch (error) {
    if (isStorageQuotaError(error)) {
      throw new StorageQuotaError();
    }

    throw error;
  }
}

function loadProject(projectId) {
  try {
    const raw = localStorage.getItem(projectStorageKey(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readProjectIndex() {
  try {
    const raw = localStorage.getItem(projectIndexKey);
    const projects = raw ? JSON.parse(raw) : [];
    return Array.isArray(projects)
      ? projects.sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")))
      : [];
  } catch {
    return [];
  }
}

function writeProjectIndex(projects) {
  localStorage.setItem(projectIndexKey, JSON.stringify(projects));
}

function upsertProjectMetadata(workspace) {
  const projects = readProjectIndex();
  const nextProject = projectMetadata(workspace);
  const existingIndex = projects.findIndex((project) => project.id === nextProject.id);

  if (existingIndex >= 0) {
    projects[existingIndex] = nextProject;
  } else {
    projects.push(nextProject);
  }

  writeProjectIndex(projects);
}

function projectMetadata(workspace) {
  return {
    id: workspace.project.id,
    name: workspace.project.name || "Untitled project",
    organizationId: workspace.organization?.id || "",
    organizationName: workspace.organization?.name || "",
    sifName: workspace.sif?.name || "",
    status: workspace.project.status || "",
    createdAt: workspace.project.createdAt || "",
    updatedAt: workspace.project.updatedAt || ""
  };
}

function projectStorageKey(projectId) {
  return `${projectStoragePrefix}${projectId}`;
}

function projectBelongsToOrganization(project, organizationId) {
  return project.organizationId === organizationId
    || (!project.organizationId && project.organizationName === organizationId)
    || project.organizationName === organizationId;
}

function isStorageQuotaError(error) {
  return error?.name === "QuotaExceededError"
    || error?.name === "NS_ERROR_DOM_QUOTA_REACHED"
    || error?.code === 22
    || error?.code === 1014;
}
