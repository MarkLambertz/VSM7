import { escapeAttr, escapeHtml, field } from "./shared/renderHelpers.js";

export function renderProjectManagement(workspace, projects) {
  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Project management</p>
        <h1>Projects</h1>
        <p>Create, open, rename, and delete VSM workshop projects from one place.</p>
      </div>
      <div class="header-actions">
        <button class="primary-button" data-action="add-project">Add Project</button>
      </div>
    </section>
    <section class="work-section">
      <div class="section-heading">
        <h2>Open Project</h2>
      </div>
      <div class="field-grid three">
        ${field("Organization", "organization.name", workspace.organization.name)}
        ${field("Project", "project.name", workspace.project.name)}
        ${field("System-in-Focus", "sif.name", workspace.sif.name, "text")}
      </div>
    </section>
    <section class="work-section">
      <div class="section-heading">
        <h2>Project Library</h2>
      </div>
      <div class="project-list">
        ${projects.map((project) => renderProjectRow(project, workspace.project.id)).join("")}
      </div>
    </section>
  `;
}

function renderProjectRow(project, activeProjectId) {
  const isActive = project.id === activeProjectId;

  return `
    <article class="project-row ${isActive ? "is-active" : ""}">
      <div class="project-row-main">
        <label class="field project-name-field">
          <span>${isActive ? "Open project" : "Project"}</span>
          <input data-project-rename="${escapeAttr(project.id)}" value="${escapeAttr(project.name)}">
        </label>
        <div class="project-meta">
          <span>${escapeHtml(project.organizationName || "No organization yet")}</span>
          <span>${escapeHtml(project.sifName || "No SIF yet")}</span>
          <span>Updated ${escapeHtml(formatProjectDate(project.updatedAt))}</span>
        </div>
      </div>
      <div class="project-row-actions">
        <button class="ghost-button" data-action="open-project" data-project-id="${escapeAttr(project.id)}" ${isActive ? "disabled" : ""}>Open</button>
        <button class="icon-button" title="Delete project" data-action="delete-project" data-project-id="${escapeAttr(project.id)}">x</button>
      </div>
    </article>
  `;
}

function formatProjectDate(value) {
  if (!value) {
    return "not saved yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "not saved yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
