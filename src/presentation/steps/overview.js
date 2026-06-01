import { escapeHtml, field, metric, textarea } from "../shared/renderHelpers.js";

export function renderOverview(workspace, completeness, stepDefinitions) {
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
      ${metric("Completeness", `${completeness.score}%`, "Across VSM steps")}
      ${metric("SCTs", workspace.step3.successCriticalTasks.length, "Success-critical tasks")}
      ${metric("Meetings", workspace.step5.meetings.length, "Boards, committees, meetings")}
      ${metric("Roles", workspace.step7.roles.length, "Representation entities")}
    </section>
    <section class="work-section">
      <div class="section-heading">
        <h2>Project Frame</h2>
        <button class="ghost-button" data-action="export-project-report">Download Report</button>
      </div>
      <div class="field-grid three">
        ${field("Project status", "project.status", workspace.project.status)}
        ${field("Recursion level", "sif.recursionLevel", workspace.sif.recursionLevel)}
        ${field("Parent level", "sif.parentLevel", workspace.sif.parentLevel)}
      </div>
      <div class="field-grid two">
        ${textarea("System purpose", "sif.purpose", workspace.sif.purpose)}
        ${textarea("Customers and stakeholders", "sif.customers", workspace.sif.customers)}
      </div>
    </section>
    <section class="work-section">
      <div class="section-heading">
        <h2>Step Outcomes</h2>
      </div>
      <div class="outcome-grid">
        ${stepDefinitions.filter((step) => step.id !== "overview").map((step) => `
          <div class="outcome-row">
            <div>
              <strong>${escapeHtml(step.label)}</strong>
              <span>${escapeHtml(step.output)}</span>
            </div>
            <button class="ghost-button" data-action="export-step" data-step="${step.id}">Download</button>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}
