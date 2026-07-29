import { getStep5MappingDiagnostics } from "../../domain/vsm.js?v=20260729-steering-master-nav-audit";
import { field, fullscreenTile, metric, textarea, tileExportButton, tileFullscreenButton } from "../shared/renderHelpers.js?v=20260729-steering-master-nav-audit";

export function renderOverview(workspace) {
  const step5Diagnostics = getStep5MappingDiagnostics(workspace);
  const roleCount = getStep7RoleCount(workspace);
  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Single source of truth</p>
        <h1>VSM project workspace</h1>
        <p>The app captures the consolidated essence of the workshop and generates the downstream files from canonical project data.</p>
      </div>
      <div class="header-actions">
        <button class="primary-button" data-action="load-sample">Load sample</button>
        <button class="ghost-button" data-action="new-workspace">New blank project</button>
      </div>
    </section>
    <section class="summary-strip">
      ${metric("SCTs", workspace.step3.successCriticalTasks.length, "Success-critical tasks")}
      ${metric("VSM mappings", step5Diagnostics.assignmentCount, "SCT contribution assignments")}
      ${metric("Roles", roleCount, "Representation entities")}
    </section>
    <section class="work-section">
      <div class="section-heading">
        <h2>Project Frame</h2>
        <div class="section-actions">
          ${tileExportButton("overview", "overview-project-frame", "Export project frame")}
          ${tileFullscreenButton("overview-project-frame", "Open project frame fullscreen")}
        </div>
      </div>
      ${renderProjectFrameFields(workspace)}
    </section>
  `;
}

function getStep7RoleCount(workspace) {
  const vessels = Array.isArray(workspace?.step7?.vessels) ? workspace.step7.vessels : [];
  const roleVessels = vessels.filter((vessel) => vessel?.type === "role" && String(vessel.name || "").trim());
  if (roleVessels.length) {
    return roleVessels.length;
  }

  return Array.isArray(workspace?.step7?.roles)
    ? workspace.step7.roles.filter((role) => String(role?.name || "").trim()).length
    : 0;
}

export function renderOverviewFullscreenTile(workspace, tileId = "overview-project-frame") {
  return fullscreenTile({
    kicker: "Overview",
    title: "Project Frame",
    description: "Keep project status, recursion framing, purpose, and stakeholder context visible.",
    counter: "Frame",
    variant: "is-form",
    tileClass: "overview-fullscreen-tile",
    actions: tileExportButton("overview", "overview-project-frame", "Export project frame"),
    content: `<section class="work-section fullscreen-matrix-section">${renderProjectFrameFields(workspace)}</section>`
  });
}

function renderProjectFrameFields(workspace) {
  return `
    <div class="field-grid three">
      ${field("Project status", "project.status", workspace.project.status)}
      ${field("Recursion level", "sif.recursionLevel", workspace.sif.recursionLevel)}
      ${field("Parent level", "sif.parentLevel", workspace.sif.parentLevel)}
    </div>
    <div class="field-grid two">
      ${textarea("System purpose", "sif.purpose", workspace.sif.purpose)}
      ${textarea("Customers and stakeholders", "sif.customers", workspace.sif.customers)}
    </div>
  `;
}
