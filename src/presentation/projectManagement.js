import { escapeAttr, escapeHtml } from "./shared/renderHelpers.js?v=20260530-step2-neutral";

export function renderProjectManagement(workspace, projects, selectedOrganizationId) {
  const organizations = groupOrganizations(projects);
  const activeOrganizationId = selectedOrganizationId
    || workspace.organization.id
    || organizations[0]?.id
    || "";
  const selectedOrganization = organizations.find((organization) => organization.id === activeOrganizationId)
    || organizations.find((organization) => organization.id === workspace.organization.id)
    || organizations[0];
  const visibleProjects = selectedOrganization?.projects || [];

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Workspace manager</p>
        <h1>Organizations & Projects</h1>
        <p>Choose the organization first, then create, open, rename, or remove the projects that belong to it.</p>
      </div>
      <div class="header-actions">
        <button class="ghost-button" data-action="add-organization">New Organization</button>
        <button class="primary-button" data-action="add-project">New Project</button>
      </div>
    </section>
    <section class="workspace-manager-grid">
      <div class="manager-pane">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Organizations</p>
            <h2>${organizations.length} saved</h2>
          </div>
        </div>
        <div class="manager-list">
          ${organizations.length > 0
            ? organizations.map((organization) => renderOrganizationRow(organization, activeOrganizationId)).join("")
            : `<p class="empty-state">No organizations saved yet.</p>`}
        </div>
      </div>
      <div class="manager-pane">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Projects</p>
            <h2>${escapeHtml(selectedOrganization?.name || "Select an organization")}</h2>
          </div>
          ${selectedOrganization ? `<span class="manager-count">${visibleProjects.length} project${visibleProjects.length === 1 ? "" : "s"}</span>` : ""}
        </div>
        <div class="project-card-grid">
          ${visibleProjects.length > 0
            ? visibleProjects.map((project) => renderProjectCard(project, workspace.project.id)).join("")
            : `<p class="empty-state">No projects in this organization yet. Create one to start the workshop capture.</p>`}
        </div>
      </div>
    </section>
  `;
}

function renderOrganizationRow(organization, activeOrganizationId) {
  const isSelected = organization.id === activeOrganizationId;

  return `
    <article class="organization-row ${isSelected ? "is-active" : ""}">
      <button
        class="organization-select"
        data-action="select-organization"
        data-organization-id="${escapeAttr(organization.id)}"
        data-organization-name="${escapeAttr(organization.name)}"
      >
        <span class="organization-avatar" aria-hidden="true">${escapeHtml(initials(organization.name))}</span>
        <span class="organization-copy">
          <strong>${escapeHtml(organization.name)}</strong>
          <small>${organization.projects.length} project${organization.projects.length === 1 ? "" : "s"} · Updated ${escapeHtml(formatProjectDate(organization.updatedAt))}</small>
        </span>
      </button>
      <div class="manager-actions">
        ${actionButton("rename-organization", "Rename organization", "edit", {
          "organization-id": organization.id,
          "organization-name": organization.name
        })}
        ${actionButton("delete-organization", "Delete organization", "delete", {
          "organization-id": organization.id,
          "organization-name": organization.name,
          "project-count": String(organization.projects.length)
        })}
      </div>
    </article>
  `;
}

function renderProjectCard(project, activeProjectId) {
  const isActive = project.id === activeProjectId;

  return `
    <article class="project-card ${isActive ? "is-active" : ""}">
      <div class="project-card-main">
        <div>
          <p class="eyebrow">${isActive ? "Open project" : "Project"}</p>
          <h3>${escapeHtml(project.name || "Untitled project")}</h3>
        </div>
        <div class="project-meta">
          <span>${escapeHtml(project.sifName || "No SIF yet")}</span>
          <span>${escapeHtml(project.status || "Workshop capture")}</span>
          <span>Updated ${escapeHtml(formatProjectDate(project.updatedAt))}</span>
        </div>
      </div>
      <div class="project-card-actions">
        ${actionButton("open-project", isActive ? "Continue project" : "Open project", "open", {
          "project-id": project.id
        }, true)}
        ${actionButton("rename-project", "Rename project", "edit", {
          "project-id": project.id,
          "project-name": project.name || "Untitled project"
        })}
        ${actionButton("delete-project", "Delete project", "delete", {
          "project-id": project.id,
          "project-name": project.name || "Untitled project"
        })}
      </div>
    </article>
  `;
}

function actionButton(action, label, icon, dataset, isPrimary = false) {
  const attributes = Object.entries(dataset)
    .map(([key, value]) => `data-${key}="${escapeAttr(value)}"`)
    .join(" ");

  return `
    <button class="manager-icon-button ${isPrimary ? "is-primary" : ""}" data-action="${escapeAttr(action)}" ${attributes} title="${escapeAttr(label)}" aria-label="${escapeAttr(label)}">
      <span class="manager-icon manager-icon-${escapeAttr(icon)}" aria-hidden="true"></span>
    </button>
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

function initials(name) {
  const parts = String(name || "Organization")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "O";
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
