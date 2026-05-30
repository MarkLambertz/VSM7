import { cellInput, cellSelect, escapeHtml, removeButton, stepHeader, tableHeader, textarea } from "../shared/renderHelpers.js?v=20260530-step2-neutral";

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
        ${textarea("Environment - Operation", "step3.complexityDrivers.environmentOperation", workspace.step3.complexityDrivers.environmentOperation)}
        ${textarea("Operation - Management", "step3.complexityDrivers.operationManagement", workspace.step3.complexityDrivers.operationManagement)}
        ${textarea("Environmental overlaps", "step3.complexityDrivers.environmentalOverlaps", workspace.step3.complexityDrivers.environmentalOverlaps)}
        ${textarea("Operational dependencies", "step3.complexityDrivers.operationalDependencies", workspace.step3.complexityDrivers.operationalDependencies)}
      </div>
    </section>
    <section class="work-section">
      ${tableHeader("Success-Critical Task Register", "add-sct")}
      <div class="table-wrap wide">
        <table>
          <thead><tr><th>Priority</th><th>System</th><th>Task</th><th>Explanation</th><th>Source</th><th>KPI / Metric</th><th>Required artifact</th><th></th></tr></thead>
          <tbody>${workspace.step3.successCriticalTasks.map((task) => `
            <tr>
              <td>${cellSelect("step3.successCriticalTasks", task.id, "priority", task.priority, ["A", "B", "C"])}</td>
              <td>${cellSelect("step3.successCriticalTasks", task.id, "system", task.system, vsmSystems)}</td>
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

function renderManagementAttentionHints(workspace) {
  const selectedOption = workspace.step1.segmentationOptions.find((option) => option.id === workspace.step1.selectedSegmentationOptionId);
  if (!selectedOption) {
    return "";
  }

  const hints = getWeakScoreHints(workspace, selectedOption.id);

  return `
    <section class="work-section attention-hints">
      <div class="section-heading">
        <h2>SCT Hints from Selected Segmentation</h2>
      </div>
      <p class="section-note">Weak scores for ${escapeHtml(selectedOption.name || "the selected segmentation")} indicate fields that may need top-level management attention.</p>
      ${hints.length > 0
        ? `<div class="hint-list">${hints.map((hint) => `
          <div class="hint-pill">
            <strong>${escapeHtml(hint.group)}</strong>
            <span>${escapeHtml(hint.label)}</span>
            <small>Score ${escapeHtml(hint.score)}</small>
          </div>
        `).join("")}</div>`
        : `<p class="empty-state">No weak scores are visible for the selected segmentation option yet.</p>`}
    </section>
  `;
}

function getWeakScoreHints(workspace, selectedOptionId) {
  const maxScore = workspace.step1.segmentationOptions.length + 1;
  const threshold = Math.max(1, Math.floor(maxScore / 2));
  const rows = [
    ...workspace.step1.keyBuyingCriteria.map((criterion, index) => ({
      id: criterion.id,
      group: "Key Buying Criteria",
      label: criterion.name || `Criterion ${index + 1}`
    })),
    ...workspace.step1.strategicFields.map((field) => ({
      id: field.id,
      group: field.variable,
      label: field.direction || "Strategic ambition not described yet"
    }))
  ];

  return rows
    .map((row) => ({
      ...row,
      score: Number(workspace.step1.evaluation?.scores?.[row.id]?.[selectedOptionId] || 0)
    }))
    .filter((row) => row.score > 0 && row.score <= threshold)
    .sort((left, right) => left.score - right.score);
}
