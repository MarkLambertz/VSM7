import { createAllocation, formatSctNumber, getRecursionOrganizations } from "../../domain/vsm.js";
import { emptyState, escapeAttr, escapeHtml, stepHeader } from "../shared/renderHelpers.js";
import { filterScts, renderSctFilters } from "./step3.js";

export const step4DecisionGuide = [
  {
    number: "1",
    question: "Can we afford decentralization?",
    yes: "Continue the test",
    no: "Central · R0 or R+1"
  },
  {
    number: "2",
    question: "Does the SCT influence a key buying criterion?",
    yes: "Decentral · R-1 or lower",
    no: "Continue the test"
  },
  {
    number: "3",
    question: "Can central assignment create relevant synergy without restricting needed autonomy?",
    yes: "Central · R0 or R+1",
    no: "Decentral by subsidiarity"
  }
];

export function renderStep4(workspace, {
  sctPriorityFilter = "",
  sctSourceFilter = ""
} = {}) {
  return `
    ${stepHeader(
      "Step IV",
      "Central/Decentral",
      "Decide where each SCT should be accountable, then decompose the contributions required across the actual recursion structure.",
      renderStep4DecisionGuide()
    )}
    ${renderStep4ContributionMatrix(workspace, { sctPriorityFilter, sctSourceFilter })}
  `;
}

export function renderStep4DecisionGuide({ fullscreen = false } = {}) {
  return `
    <ol class="step-decision-guide ${fullscreen ? "is-fullscreen" : ""}" aria-label="Central or decentral decision guidance">
      ${step4DecisionGuide.map((item) => `
        <li class="step-decision-card">
          <span class="step-decision-number">${escapeHtml(item.number)}</span>
          <strong>${escapeHtml(item.question)}</strong>
          <span class="step-decision-outcomes">
            <span class="is-yes"><b>Yes</b>${escapeHtml(item.yes)}</span>
            <span class="is-no"><b>No</b>${escapeHtml(item.no)}</span>
          </span>
        </li>
      `).join("")}
    </ol>
  `;
}

export function renderStep4ContributionMatrix(workspace, {
  fullscreen = false,
  sctPriorityFilter = "",
  sctSourceFilter = ""
} = {}) {
  const organizations = getRecursionOrganizations(workspace);
  const tasks = workspace.step3.successCriticalTasks;
  const filteredTasks = filterScts(tasks, sctPriorityFilter, sctSourceFilter);

  return `
    <section class="work-section step4-contribution-section ${fullscreen ? "fullscreen-matrix-section" : ""}">
      ${fullscreen ? `
        <div class="step4-matrix-toolbar">
          <p>Describe what each organizational unit must contribute so the SCT works across the recursion structure.</p>
          <button class="ghost-button" data-action="export-step" data-step="step4">Download Outcome</button>
        </div>
      ` : `
        <div class="section-heading">
          <div>
            <h2>SCT Contribution Matrix</h2>
            <p>Describe what each organizational unit must contribute. Apply subsidiarity: move work upward only when it cannot be done better at the next lower recursion level.</p>
          </div>
          <button class="ghost-button" data-action="export-step" data-step="step4">Download Outcome</button>
        </div>
      `}
      ${tasks.length > 0 ? renderSctFilters(
        tasks,
        sctPriorityFilter,
        sctSourceFilter,
        "Filter SCT Contribution Matrix"
      ) : ""}
      ${organizations.length > 0 && tasks.length > 0 ? `
        ${filteredTasks.length > 0 ? `
          <div class="table-wrap wide step4-contribution-wrap" data-preserve-scroll="step4-contribution-matrix">
            <table class="step4-contribution-matrix">
              <thead>
                <tr>
                  <th class="step4-sct-id-column">SCT ID</th>
                  <th class="step4-priority-column">Priority</th>
                  <th class="step4-task-column">Success-Critical Task</th>
                  ${organizations.map(renderOrganizationHeader).join("")}
                </tr>
              </thead>
              <tbody>
                ${filteredTasks.map((task) => renderTaskContributionRow(workspace, task, organizations)).join("")}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="sct-filter-empty">
            ${emptyState("No SCTs match the selected filters.")}
            <button class="ghost-button compact-button" data-action="clear-sct-filters">Clear filters</button>
          </div>
        `}
      ` : ""}
      ${tasks.length === 0 ? emptyState("Create success-critical tasks in Step III first.") : ""}
      ${tasks.length > 0 && organizations.length === 0 ? emptyState("Define the recursion structure and organizational units in Step I first.") : ""}
    </section>
  `;
}

function renderOrganizationHeader(organization) {
  return `
    <th class="step4-organization-column">
      <span class="step4-recursion-level">${escapeHtml(organization.level || "Level")}</span>
      <strong>${escapeHtml(organization.name)}</strong>
      ${organization.description ? `<small>${escapeHtml(organization.description)}</small>` : ""}
    </th>
  `;
}

function renderTaskContributionRow(workspace, task, organizations) {
  const allocation = workspace.step4.allocations[task.id] || createAllocation(task.id);

  return `
    <tr data-sct-row="${escapeAttr(task.id)}">
      <td class="step4-sct-id-column"><strong>${escapeHtml(formatSctNumber(task.number))}</strong></td>
      <td class="step4-priority-column"><span class="sct-priority-badge priority-${escapeAttr(String(task.priority || "A").toLowerCase())}">${escapeHtml(task.priority)}</span></td>
      <td class="step4-task-column">
        <strong>${escapeHtml(task.title || "Untitled SCT")}</strong>
        ${task.explanation ? `<small>${escapeHtml(task.explanation)}</small>` : ""}
      </td>
      ${organizations.map((organization) => contributionCell(
        task,
        organization,
        allocation.contributions?.[organization.id] || "",
        allocation.accountableOrganizationId
      )).join("")}
    </tr>
  `;
}

function contributionCell(task, organization, value, accountableOrganizationId) {
  const label = `${formatSctNumber(task.number)} contribution of ${organization.name}`;
  const isAccountable = accountableOrganizationId === organization.id;

  return `
    <td class="step4-contribution-cell">
      <div class="step4-cell-toolbar">
        <button
          class="step4-accountability-button ${isAccountable ? "is-selected" : ""}"
          data-action="set-accountable-organization"
          data-task-id="${escapeAttr(task.id)}"
          data-organization-id="${escapeAttr(organization.id)}"
          aria-pressed="${isAccountable}"
          title="${isAccountable ? "Accountable organization" : `Set ${escapeAttr(organization.name)} accountable for this SCT`}"
          ${isAccountable ? "disabled" : ""}
        >
          <span class="step4-accountability-token">A</span>
          <span>${isAccountable ? "Accountable" : "Select A"}</span>
        </button>
      </div>
      <label>
        <textarea
          rows="4"
          data-allocation-contribution="${escapeAttr(`${task.id}|${organization.id}`)}"
          placeholder="Describe the contribution of ${escapeAttr(organization.name)}"
          aria-label="${escapeAttr(label)}"
        >${escapeHtml(value)}</textarea>
      </label>
    </td>
  `;
}
