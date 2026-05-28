import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createWorkspace, ensureWorkspaceShape, syncAllocations } from "../domain/vsm.js";
import { projectMetadata, sortProjectMetadata } from "../domain/workspaceMetadata.js";

export function createFileWorkspaceStore({ filePath } = {}) {
  const resolvedFilePath = filePath || path.join(process.cwd(), "data", "workspaces.json");

  return {
    async getState() {
      return readState(resolvedFilePath);
    },
    async replaceState(nextState) {
      const state = normalizeState(nextState);
      await writeState(resolvedFilePath, state);
      return state;
    },
    async listProjects() {
      const state = await this.getState();
      return sortProjectMetadata(state.workspaces.map(projectMetadata));
    },
    async getActiveWorkspace() {
      const state = await this.getState();
      if (state.workspaces.length === 0) {
        const workspace = createWorkspace();
        state.workspaces.push(workspace);
        state.activeProjectId = workspace.project.id;
        await writeState(resolvedFilePath, state);
      }

      return findWorkspace(state, state.activeProjectId) || state.workspaces[0] || null;
    },
    async setActiveProject(projectId) {
      const state = await this.getState();
      if (findWorkspace(state, projectId)) {
        state.activeProjectId = projectId;
        await writeState(resolvedFilePath, state);
      }
      return state.activeProjectId;
    },
    async getWorkspace(projectId) {
      const state = await this.getState();
      return findWorkspace(state, projectId);
    },
    async saveWorkspace(workspace, { activate = true } = {}) {
      const state = await this.getState();
      const shapedWorkspace = ensureWorkspaceShape(workspace);
      shapedWorkspace.project.updatedAt ||= new Date().toISOString();
      syncAllocations(shapedWorkspace);

      const index = state.workspaces.findIndex((item) => item.project.id === shapedWorkspace.project.id);
      if (index >= 0) {
        state.workspaces[index] = shapedWorkspace;
      } else {
        state.workspaces.push(shapedWorkspace);
      }

      if (activate) {
        state.activeProjectId = shapedWorkspace.project.id;
      }

      await writeState(resolvedFilePath, state);
      return shapedWorkspace;
    },
    async deleteWorkspace(projectId) {
      const state = await this.getState();
      state.workspaces = state.workspaces.filter((workspace) => workspace.project.id !== projectId);
      if (state.activeProjectId === projectId) {
        state.activeProjectId = state.workspaces[0]?.project.id || "";
      }

      await writeState(resolvedFilePath, state);
      return state;
    },
    async clear() {
      const state = { activeProjectId: "", workspaces: [] };
      await writeState(resolvedFilePath, state);
      return state;
    }
  };
}

async function readState(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    if (error.code === "ENOENT") {
      return { activeProjectId: "", workspaces: [] };
    }

    throw error;
  }
}

async function writeState(filePath, state) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(normalizeState(state), null, 2));
  await rename(temporaryPath, filePath);
}

function normalizeState(candidate) {
  const workspaces = Array.isArray(candidate?.workspaces)
    ? candidate.workspaces.map((workspace) => {
      const shapedWorkspace = ensureWorkspaceShape(workspace);
      syncAllocations(shapedWorkspace);
      return shapedWorkspace;
    })
    : [];

  const activeProjectId = workspaces.some((workspace) => workspace.project.id === candidate?.activeProjectId)
    ? candidate.activeProjectId
    : workspaces[0]?.project.id || "";

  return { activeProjectId, workspaces };
}

function findWorkspace(state, projectId) {
  return state.workspaces.find((workspace) => workspace.project.id === projectId) || null;
}
