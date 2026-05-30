import { cellInput, cellSelect, removeButton, stepHeader, tableHeader, taskMultiSelect, textarea } from "../shared/renderHelpers.js?v=20260530-step2-neutral";

export function renderStep7(workspace) {
  return `
    ${stepHeader("Step VII", "Representation", "Represent roles, entities, reporting, and accountability based on the SCT spine.")}
    <section class="work-section">
      ${tableHeader("Roles, Functions, and Organizational Entities", "add-role")}
      <div class="table-wrap wide">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Reports to</th><th>Decision authority</th><th>Linked SCTs</th><th></th></tr></thead>
          <tbody>${workspace.step7.roles.map((role) => `
            <tr>
              <td>${cellInput("step7.roles", role.id, "name", role.name)}</td>
              <td>${cellSelect("step7.roles", role.id, "type", role.type, ["Leadership role", "Support function", "Operative unit", "Committee", "Meeting", "Process"])}</td>
              <td>${cellInput("step7.roles", role.id, "purpose", role.purpose)}</td>
              <td>${cellInput("step7.roles", role.id, "reportsTo", role.reportsTo)}</td>
              <td>${cellInput("step7.roles", role.id, "decisionAuthority", role.decisionAuthority)}</td>
              <td>${taskMultiSelect(workspace, "step7.roles", role.id, role.linkedTaskIds)}</td>
              <td>${removeButton("step7.roles", role.id)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
    </section>
    <section class="work-section">
      <div class="section-heading">
        <h2>Representation Notes</h2>
        <button class="ghost-button" data-action="export-step" data-step="step7">Download Outcome</button>
      </div>
      <div class="field-grid two">
        ${textarea("Org chart notes", "step7.orgChartNotes", workspace.step7.orgChartNotes)}
        ${textarea("Role one-pager and representation notes", "step7.representationNotes", workspace.step7.representationNotes)}
      </div>
    </section>
  `;
}
