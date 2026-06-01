import { cellInput, cellSelect, escapeAttr, escapeHtml, removeButton, stepHeader, tableHeader } from "../shared/renderHelpers.js";
import { getManageabilityLeverSignals, getWeakSegmentationSignals } from "../../domain/vsm.js";

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

export function renderStep3(workspace, taskSources, vsmSystems) {
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
    <section class="work-section">
      ${tableHeader("Success-Critical Task Register", "add-sct")}
      <div class="table-wrap wide">
        <table>
          <thead><tr><th>Priority</th><th>Task (Mandatory)</th><th>Description (Mandatory)</th><th>Source</th><th>KPI/Success Metric</th><th>Required Artifact</th><th></th></tr></thead>
          <tbody>${workspace.step3.successCriticalTasks.map((task) => `
            <tr>
              <td>${cellSelect("step3.successCriticalTasks", task.id, "priority", task.priority, ["A", "B", "C"])}</td>
              <td>${cellInput("step3.successCriticalTasks", task.id, "title", task.title)}</td>
              <td>${cellInput("step3.successCriticalTasks", task.id, "explanation", task.explanation)}</td>
              <td>${cellSelect("step3.successCriticalTasks", task.id, "source", task.source, taskSources)}</td>
              <td>${cellInput("step3.successCriticalTasks", task.id, "kpi", task.kpi)}</td>
              <td>${cellInput("step3.successCriticalTasks", task.id, "requiredArtifacts", task.requiredArtifacts)}</td>
              <td>${removeButton("step3.successCriticalTasks", task.id)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
    </section>
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
      <p class="section-note">Use weak segmentation scores and Step II manageability levers as source material for success-critical tasks.</p>
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
          : `<p class="empty-state">Capture manageability levers in Step II to use them as SCT source material.</p>`}
      </div>
    </section>
  `;
}
