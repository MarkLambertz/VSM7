import { cellInput, cellSelect, escapeAttr, escapeHtml, removeButton, stepHeader, tableHeader } from "../shared/renderHelpers.js";
import { formatSctNumber, getManageabilityLeverSignals, getWeakSegmentationSignals } from "../../domain/vsm.js";

const complexityDriverExamples = {
  environmentOperation: {
    label: "Environment - Operation",
    example: "Example: Many customer segments with different value expectations, product variants, local regulations, or service promises. Possible SCT signal: variant management, customer promise governance, or market interface steering."
  },
  operationManagement: {
    label: "Operation - Management",
    example: "Example: S1 units need different steering rhythms, decision rights, KPIs, or capability levels. Possible SCT signal: decision-rights design, escalation rules, capability building, or performance transparency."
  },
  environmentalOverlaps: {
    label: "Environmental overlaps",
    example: "Example: Several S1s share customers, suppliers, brand, channels, technology, or architecture. Possible SCT signal: shared customer interface, platform standards, or supplier strategy."
  },
  operationalDependencies: {
    label: "Operational dependencies",
    example: "Example: S1s depend on common resources, production assets, platforms, experts, or delivery capacity. Possible SCT signal: resource bargain, dependency resolution cadence, or shared capacity planning."
  }
};

export function renderStep3(workspace, taskSources, vsmSystems, {
  selectedSctId = "",
  selectedSctMergeIds = [],
  sctPriorityFilter = "",
  sctSourceFilter = ""
} = {}) {
  return `
    ${stepHeader("Step III", "Success-Critical Tasks", "Derive permanent organizational tasks from complexity drivers, overlaps, and dependencies.")}
    ${renderManagementAttentionHints(workspace)}
    <section class="work-section">
      <div class="section-heading">
        <h2>Complexity Drivers</h2>
        <button class="ghost-button" data-action="export-step" data-step="step3">Download Outcome</button>
      </div>
      <div class="field-grid two">
        ${driverTextarea("environmentOperation", workspace.step3.complexityDrivers.environmentOperation)}
        ${driverTextarea("operationManagement", workspace.step3.complexityDrivers.operationManagement)}
        ${driverTextarea("environmentalOverlaps", workspace.step3.complexityDrivers.environmentalOverlaps)}
        ${driverTextarea("operationalDependencies", workspace.step3.complexityDrivers.operationalDependencies)}
      </div>
    </section>
    ${renderStep3Register(workspace, taskSources, { selectedSctId, selectedSctMergeIds, sctPriorityFilter, sctSourceFilter })}
  `;
}

export function renderStep3Register(workspace, taskSources, {
  fullscreen = false,
  selectedSctId = "",
  selectedSctMergeIds = [],
  sctPriorityFilter = "",
  sctSourceFilter = ""
} = {}) {
  const tasks = workspace.step3.successCriticalTasks;
  const filteredTasks = filterScts(tasks, sctPriorityFilter, sctSourceFilter);
  const selectedTask = workspace.step3.successCriticalTasks.find((task) => task.id === selectedSctId);

  return `
    <section class="work-section sct-register-section ${fullscreen ? "fullscreen-matrix-section" : ""}">
      ${tableHeader("Success-Critical Task Register", "add-sct", "Add SCT")}
      <p class="section-note">Scan the register, then select an SCT to edit its full description and optional details.</p>
      ${tasks.length ? `
        ${renderSctFilters(tasks, sctPriorityFilter, sctSourceFilter)}
        <div class="sct-register-actions">
          <span>Select one SCT to split it, or two or more to combine them.</span>
          <div class="sct-register-action-buttons">
            <button class="ghost-button" data-action="split-selected-sct" ${selectedSctMergeIds.length === 1 ? "" : "disabled"}>
              Split selected
            </button>
            <button class="ghost-button" data-action="merge-selected-scts" ${selectedSctMergeIds.length >= 2 ? "" : "disabled"}>
              Merge selected (${selectedSctMergeIds.length})
            </button>
          </div>
        </div>
      ` : ""}
      <div class="sct-register-workspace ${selectedTask ? "has-inspector" : ""}">
        <div class="sct-table-panel">
        ${tasks.length
          ? renderSctTable(filteredTasks, selectedSctId, selectedSctMergeIds, tasks.length)
          : `<p class="empty-state">Add the first success-critical task.</p>`}
        </div>
        ${selectedTask ? renderSctInspector(selectedTask, taskSources) : ""}
      </div>
    </section>
  `;
}

export function filterScts(tasks, priorityFilter = "", sourceFilter = "") {
  return tasks.filter((task) => (
    (!priorityFilter || String(task.priority || "C") === priorityFilter)
    && (!sourceFilter || String(task.source || "Workshop Decision") === sourceFilter)
  ));
}

export function renderSctFilters(tasks, priorityFilter, sourceFilter, ariaLabel = "Filter Success-Critical Task Register") {
  const sources = [...new Set([
    ...tasks.map((task) => String(task.source || "Workshop Decision")),
    sourceFilter
  ].filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
  const filteredCount = filterScts(tasks, priorityFilter, sourceFilter).length;
  const hasFilters = Boolean(priorityFilter || sourceFilter);

  return `
    <div class="sct-filter-bar" aria-label="${escapeAttr(ariaLabel)}">
      <div class="sct-filter-controls">
        <label class="sct-filter-field">
          <span>Priority</span>
          <select data-sct-filter="priority">
            ${filterOption("", "All priorities", priorityFilter)}
            ${["A", "B", "C"].map((priority) => filterOption(priority, `Priority ${priority}`, priorityFilter)).join("")}
          </select>
        </label>
        <label class="sct-filter-field">
          <span>Source</span>
          <select data-sct-filter="source">
            ${filterOption("", "All sources", sourceFilter)}
            ${sources.map((source) => filterOption(source, source, sourceFilter)).join("")}
          </select>
        </label>
      </div>
      <div class="sct-filter-summary">
        <span>${filteredCount} of ${tasks.length} SCTs</span>
        <button class="ghost-button compact-button" data-action="clear-sct-filters" ${hasFilters ? "" : "disabled"}>Clear filters</button>
      </div>
    </div>
  `;
}

function filterOption(value, label, selectedValue) {
  return `<option value="${escapeAttr(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function renderSctTable(tasks, selectedSctId, selectedSctMergeIds, totalTaskCount) {
  if (!tasks.length) {
    return `
      <div class="sct-filter-empty">
        <p class="empty-state">No SCTs match the selected filters.</p>
        <button class="ghost-button compact-button" data-action="clear-sct-filters">Clear filters</button>
      </div>
    `;
  }

  return `
    <div class="table-wrap sct-table-wrap" data-preserve-scroll="sct-register">
      <table class="sct-compact-table" aria-label="Showing ${tasks.length} of ${totalTaskCount} Success-Critical Tasks">
        <thead>
          <tr>
            <th><span class="visually-hidden">Select for SCT actions</span></th>
            <th>SCT ID</th>
            <th>Priority</th>
            <th>Task</th>
            <th>Description preview</th>
            <th>Source</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map((task) => renderSctTableRow(task, task.id === selectedSctId, selectedSctMergeIds.includes(task.id))).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSctTableRow(task, isSelected, isSelectedForMerge) {
  const description = String(task.explanation || "").trim();

  return `
    <tr
      class="sct-compact-row ${isSelected ? "is-selected" : ""}"
      data-action="open-sct-inspector"
      data-sct-id="${escapeAttr(task.id)}"
      tabindex="0"
      aria-selected="${isSelected}"
    >
      <td>
        <input
          type="checkbox"
          data-action="toggle-sct-merge-selection"
          data-sct-id="${escapeAttr(task.id)}"
          title="Select ${escapeAttr(formatSctNumber(task.number))} for split or merge"
          aria-label="Select ${escapeAttr(formatSctNumber(task.number))} for split or merge"
          ${isSelectedForMerge ? "checked" : ""}
        >
      </td>
      <td><strong class="sct-number">${escapeHtml(formatSctNumber(task.number))}</strong></td>
      <td><span class="sct-priority-badge priority-${escapeAttr(String(task.priority || "C").toLowerCase())}">${escapeHtml(task.priority || "C")}</span></td>
      <td><strong>${escapeHtml(task.title || "Untitled SCT")}</strong></td>
      <td><span class="sct-description-preview">${escapeHtml(description || "No description captured yet.")}</span></td>
      <td>${escapeHtml(task.source || "Workshop Decision")}</td>
      <td class="sct-row-actions">
        <div class="sct-row-actions-inner">
          <button class="ghost-button compact-button" data-action="open-sct-inspector" data-sct-id="${escapeAttr(task.id)}">Edit</button>
          ${removeButton("step3.successCriticalTasks", task.id)}
        </div>
      </td>
    </tr>
  `;
}

function renderSctInspector(task, taskSources) {
  const descriptionLength = String(task.explanation || "").length;
  const hasOptionalDetails = Boolean(
    String(task.kpi || "").trim()
      || String(task.requiredArtifacts || "").trim()
      || String(task.toolOrMethodologicalApproach || "").trim()
  );

  return `
    <aside class="sct-inspector" data-sct-inspector="${escapeAttr(task.id)}" aria-label="Edit ${escapeAttr(task.title || "SCT")}">
      <div class="sct-inspector-header">
        <div>
          <span class="panel-kicker">SCT detail · ${escapeHtml(formatSctNumber(task.number))}</span>
          <h3>${escapeHtml(task.title || "New success-critical task")}</h3>
        </div>
        <div class="sct-inspector-header-actions">
          <button class="ghost-button compact-button" data-action="split-sct" data-sct-id="${escapeAttr(task.id)}">Split SCT</button>
          <button class="icon-button" data-action="close-sct-inspector" title="Close SCT detail" aria-label="Close SCT detail">x</button>
        </div>
      </div>
      <div class="sct-inspector-fields">
        <label class="field sct-priority-field">
          <span>Priority</span>
          ${cellSelect("step3.successCriticalTasks", task.id, "priority", task.priority, ["A", "B", "C"])}
        </label>
        <label class="field sct-task-field">
          <span>Task <em>Mandatory</em></span>
          ${cellInput("step3.successCriticalTasks", task.id, "title", task.title)}
        </label>
        <label class="field sct-source-field">
          <span>Source</span>
          ${cellSelect("step3.successCriticalTasks", task.id, "source", task.source, taskSources)}
        </label>
      </div>
      <label class="field sct-description-field">
        <span>
          Description <em>Mandatory</em>
          <small data-character-counter="${escapeAttr(task.id)}">${descriptionLength} / 1000</small>
        </span>
        <textarea
          data-collection="step3.successCriticalTasks"
          data-id="${escapeAttr(task.id)}"
          data-field="explanation"
          data-character-count="${escapeAttr(task.id)}"
          maxlength="1000"
          rows="10"
        >${escapeHtml(task.explanation)}</textarea>
      </label>
      <details class="sct-optional-details" ${hasOptionalDetails ? "open" : ""}>
        <summary>
          <span>Optional details</span>
          <small>KPI / Success Metric, Required Artifact, and Tool or Methodological Approach</small>
        </summary>
        <div class="field-grid two">
          <label class="field">
            <span>KPI / Success Metric</span>
            ${cellInput("step3.successCriticalTasks", task.id, "kpi", task.kpi)}
          </label>
          <label class="field">
            <span>Required Artifact</span>
            ${cellInput("step3.successCriticalTasks", task.id, "requiredArtifacts", task.requiredArtifacts)}
          </label>
          <label class="field sct-method-approach-field">
            <span>Tool or Methodological Approach</span>
            ${cellInput("step3.successCriticalTasks", task.id, "toolOrMethodologicalApproach", task.toolOrMethodologicalApproach)}
          </label>
        </div>
      </details>
    </aside>
  `;
}

function driverTextarea(key, value) {
  const guidance = complexityDriverExamples[key];

  return `
    <label class="field complexity-driver-field">
      <span>${escapeHtml(guidance.label)}</span>
      <textarea
        data-path="${escapeAttr(`step3.complexityDrivers.${key}`)}"
        rows="4"
        placeholder="${escapeAttr(guidance.example)}"
      >${escapeHtml(value)}</textarea>
      <small>${escapeHtml(guidance.example)}</small>
    </label>
  `;
}

function renderManagementAttentionHints(workspace) {
  const selectedOption = workspace.step1.segmentationOptions.find((option) => option.id === workspace.step1.selectedSegmentationOptionId);
  const hints = selectedOption ? getWeakSegmentationSignals(workspace, selectedOption.id) : [];
  const leverSignals = getManageabilityLeverSignals(workspace);

  return `
    <section class="work-section attention-hints">
      <div class="section-heading">
        <h2>SCT Input Signals</h2>
      </div>
      <p class="section-note">Use weak segmentation scores and selected Step II manageability levers as source material for success-critical tasks.</p>
      <div class="nested-work-section">
        <h3>From selected segmentation</h3>
        ${selectedOption
          ? `<p class="section-note">Weak scores for ${escapeHtml(selectedOption.name || "the selected segmentation")} indicate fields that may need top-level management attention.</p>`
          : ""}
        ${hints.length > 0
          ? `<div class="hint-list">${hints.map((hint) => `
            <div class="hint-pill">
              <strong>${escapeHtml(hint.group)}</strong>
              <span>${escapeHtml(hint.label)}</span>
              <small>Score ${escapeHtml(hint.score)}</small>
            </div>
          `).join("")}</div>`
          : `<p class="empty-state">${selectedOption ? "No red, orange, or yellow scores are visible for the selected segmentation option yet." : "Select a segmentation option in Step I to see segmentation-based SCT hints."}</p>`}
      </div>
      <div class="nested-work-section">
        <h3>From manageability levers</h3>
        ${leverSignals.length > 0
          ? `<div class="hint-list">${leverSignals.map((signal) => `
            <div class="hint-pill">
              <strong>${escapeHtml(signal.title)}</strong>
              <span>${escapeHtml(signal.detail)}</span>
              <small>${escapeHtml(signal.meta)}</small>
            </div>
          `).join("")}</div>`
          : `<p class="empty-state">Select one or more manageability levers in Step II to use them as SCT source material.</p>`}
      </div>
    </section>
  `;
}
