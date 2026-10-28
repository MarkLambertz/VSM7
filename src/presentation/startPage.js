import { escapeAttr, escapeHtml } from "./shared/renderHelpers.js?v=20260729-steering-master-nav-audit";

export function renderStartPage(workspace, projects) {
  const organizations = groupOrganizations(projects);
  const recentProject = projects[0];

  return `
    <section class="start-hero suite-welcome">
      <div class="suite-welcome-copy">
        <p class="eyebrow">Organizational steering, made explicit</p>
        <h1>Make the organization steerable.</h1>
        <p>Shape the operative units, tasks, and steering system. Bring the workshop together in one shared picture.</p>
        <div class="start-actions">
          <button class="primary-button" data-action="add-organization">New Organization <span aria-hidden="true">→</span></button>
          <button class="ghost-button" data-action="add-project">New Project</button>
        </div>
        <div class="suite-welcome-notes" aria-label="Workspace capabilities">
          <span>Seven VSM steps</span>
          <span>One project record</span>
          <span>Workshop exports</span>
        </div>
      </div>
      ${recentProject ? renderRecentProject(recentProject) : `
        <aside class="suite-recent-project suite-first-project">
          ${projectSymbol()}
          <p class="eyebrow">Your workshop starts here</p>
          <h2>From shared understanding to a viable system.</h2>
          <p>Create an organization, define your project, and work through the seven VSM steps.</p>
        </aside>
      `}
    </section>
    <section class="start-grid">
      <div class="work-section">
        <div class="section-heading">
          <div><p class="eyebrow">Your workspace</p><h2>Organizations</h2></div>
          <span class="suite-section-count">${organizations.length} saved</span>
        </div>
        <div class="start-card-list">
          ${organizations.length > 0
            ? organizations.map((organization) => renderOrganizationCard(organization, workspace.organization.id)).join("")
            : `<p class="empty-state">No organizations saved yet.</p>`}
        </div>
      </div>
      <div class="work-section">
        <div class="section-heading">
          <div><p class="eyebrow">Continue the work</p><h2>Projects</h2></div>
          <span class="suite-section-count">${projects.length} saved</span>
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

function renderRecentProject(project) {
  return `
    <aside class="suite-recent-project">
      <span class="suite-recent-label">Recent project</span>
      ${projectSymbol()}
      <div class="suite-recent-copy">
        <p class="eyebrow">Pick up where you left off</p>
        <h2>${escapeHtml(project.name || "Untitled project")}</h2>
        <p>${escapeHtml(project.sifName || "System-in-Focus not named yet")}</p>
      </div>
      <div class="suite-recent-meta">${escapeHtml(project.organizationName || "No organization")}</div>
      <button class="ghost-button" data-action="open-project" data-project-id="${escapeAttr(project.id)}">Continue project <span aria-hidden="true">→</span></button>
    </aside>
  `;
}

function projectSymbol() {
  return `<span class="suite-card-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h7l2 2h9v11H3z"/><path d="M3 7V4h7l2 3h6v2M7 13h10M7 16h7"/></svg></span>`;
}

function renderOrganizationCard(organization, activeOrganizationId) {
  const isActive = organization.id && organization.id === activeOrganizationId;

  return `
    <article class="start-card ${isActive ? "is-active" : ""}">
      <div class="suite-list-copy">
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
      <div class="suite-list-copy">
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
