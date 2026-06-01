import { ensureWorkspaceShape, syncAllocations } from "../domain/vsm.js";

export function loadWorkspace(repository) {
  return ensureWorkspaceShape(repository.load());
}

export function saveWorkspace(repository, workspace) {
  workspace.project.updatedAt = new Date().toISOString();
  syncAllocations(workspace);
  repository.save(workspace);
}

export function replaceWorkspace(repository, nextWorkspace) {
  const workspace = ensureWorkspaceShape(nextWorkspace);
  saveWorkspace(repository, workspace);
  return workspace;
}

export function listWorkspaces(repository) {
  return repository.listProjects?.() || [];
}

export function openWorkspace(repository, workspaceId) {
  const workspace = ensureWorkspaceShape(repository.loadProject?.(workspaceId));
  saveWorkspace(repository, workspace);
  return workspace;
}

export function deleteWorkspace(repository, workspaceId) {
  repository.deleteProject?.(workspaceId);
  return loadWorkspace(repository);
}

export function renameWorkspace(repository, workspaceId, name) {
  repository.renameProject?.(workspaceId, name);
}

export function renameOrganization(repository, organizationId, name) {
  repository.renameOrganization?.(organizationId, name);
}

export function deleteOrganization(repository, organizationId) {
  repository.deleteOrganization?.(organizationId);
  return loadWorkspace(repository);
}
