import { escapeAttr, escapeHtml } from "./shared/renderHelpers.js?v=20260530-step2-neutral";

export function renderStartPage(workspace, projects) {
  const organizations = groupOrganizations(projects);

  return `
    <section class="start-hero">
      <div>
        <p class="eyebrow">VSM workspace</p>
        <h1>Start a VSM project</h1>
        <p>Create a new organization or project, or continue an existing workspace.</p>
      </div>
      <div class="start-actions">
        <button class="primary-button" data-action="add-organization">New Organization</button>
        <button class="ghost-button" data-action="add-project">New Project</button>
      </div>
    </section>
    <section class="start-grid">
      <div class="work-section">
        <div class="section-heading">
          <h2>Open Organization</h2>
        </div>
        <div class="start-card-list">
          ${organizations.length > 0
            ? organizations.map((organization) => renderOrganizationCard(organization, workspace.organization.id)).join("")
            : `<p class="empty-state">No organizations saved yet.</p>`}
        </div>
      </div>
      <div class="work-section">
        <div class="section-heading">
          <h2>Open Project</h2>
        </div>
        <div class="start-card-list">
          ${projects.length > 0
            ? projects.map((project) => renderProjectCard(project, workspace.project.id)).join("")
            : `<p class="empty-state">No projects saved yet.</p>`}
        </div>
      </div>
    </section>
  `;
}

function renderOrganizationCard(organization, activeOrganizationId) {
  const isActive = organization.id && organization.id === activeOrganizationId;

  return `
    <article class="start-card ${isActive ? "is-active" : ""}">
      <div>
        <strong>${escapeHtml(organization.name)}</strong>
        <small>${organization.projects.length} project${organization.projects.length === 1 ? "" : "s"}</small>
      </div>
      <button class="ghost-button" data-action="open-organization" data-organization-id="${escapeAttr(organization.id)}" data-organization-name="${escapeAttr(organization.name)}">Open</button>
    </article>
  `;
}

function renderProjectCard(project, activeProjectId) {
  const isActive = project.id === activeProjectId;

  return `
    <article class="start-card ${isActive ? "is-active" : ""}">
      <div>
        <strong>${escapeHtml(project.name || "Untitled project")}</strong>
        <small>${escapeHtml(project.organizationName || "No organization")} · ${escapeHtml(project.sifName || "No SIF")}</small>
      </div>
      <button class="ghost-button" data-action="open-project" data-project-id="${escapeAttr(project.id)}">${isActive ? "Continue" : "Open"}</button>
    </article>
  `;
}

function groupOrganizations(projects) {
  const organizations = new Map();

  for (const project of projects) {
    const id = project.organizationId || project.organizationName || "unknown";
    if (!organizations.has(id)) {
      organizations.set(id, {
        id,
        name: project.organizationName || "Unnamed Organization",
        updatedAt: project.updatedAt || "",
        projects: []
      });
    }

    const organization = organizations.get(id);
    organization.projects.push(project);
    if (String(project.updatedAt || "") > String(organization.updatedAt || "")) {
      organization.updatedAt = project.updatedAt;
    }
  }

  return Array.from(organizations.values())
    .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));
}
