export function projectMetadata(workspace) {
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

export function sortProjectMetadata(projects) {
  return [...projects].sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));
}
