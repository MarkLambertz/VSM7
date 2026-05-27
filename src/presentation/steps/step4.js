import { createAllocation } from "../../domain/vsm.js";
import { allocationCheckbox, allocationInput, emptyState, escapeHtml, stepHeader } from "../shared/renderHelpers.js";

export function renderStep4(workspace) {
  return `
    ${stepHeader("Step IV", "Central/Decentral", "Allocate SCTs to R-1, R0, and R+1, including partial allocations and accountable entities.")}
    <section class="work-section">
      <div class="section-heading">
        <h2>Central/Decentral Accountability</h2>
        <button class="ghost-button" data-action="export-step" data-step="step4">Download Outcome</button>
      </div>
      <div class="table-wrap wide">
        <table>
          <thead><tr><th>Priority</th><th>System</th><th>SCT</th><th>R-1</th><th>R0</th><th>R+1</th><th>Accountable entity</th><th>Rationale</th><th>Partial allocation notes</th></tr></thead>
          <tbody>${workspace.step3.successCriticalTasks.map((task) => {
            const allocation = workspace.step4.allocations[task.id] || createAllocation(task.id);
            return `
              <tr>
                <td>${escapeHtml(task.priority)}</td>
                <td>${escapeHtml(task.system)}</td>
                <td><strong>${escapeHtml(task.title || "Untitled SCT")}</strong><small>${escapeHtml(task.explanation)}</small></td>
                <td>${allocationCheckbox(task.id, "R-1", allocation.levels["R-1"])}</td>
                <td>${allocationCheckbox(task.id, "R0", allocation.levels.R0)}</td>
                <td>${allocationCheckbox(task.id, "R+1", allocation.levels["R+1"])}</td>
                <td>${allocationInput(task.id, "accountableEntity", allocation.accountableEntity)}</td>
                <td>${allocationInput(task.id, "rationale", allocation.rationale)}</td>
                <td>${allocationInput(task.id, "partialAllocationNotes", allocation.partialAllocationNotes)}</td>
              </tr>
            `;
          }).join("")}</tbody>
        </table>
      </div>
      ${workspace.step3.successCriticalTasks.length === 0 ? emptyState("Create success-critical tasks in Step III first.") : ""}
    </section>
  `;
}
