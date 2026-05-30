import { cellInput, cellSelect, removeButton, stepHeader, tableHeader } from "../shared/renderHelpers.js?v=20260530-step2-neutral";

export function renderImplementation(workspace) {
  return `
    ${stepHeader("Implementation", "Target Organization Roadmap", "Turn the target picture into implementation items, owners, and timing.")}
    <section class="work-section">
      ${tableHeader("Transformation Backlog", "add-implementation")}
      <div class="table-wrap wide">
        <table>
          <thead><tr><th>Steering challenge</th><th>Dependency / requirement</th><th>Responsible</th><th>Due date</th><th>Status</th><th></th></tr></thead>
          <tbody>${workspace.implementation.items.map((item) => `
            <tr>
              <td>${cellInput("implementation.items", item.id, "challenge", item.challenge)}</td>
              <td>${cellInput("implementation.items", item.id, "requirement", item.requirement)}</td>
              <td>${cellInput("implementation.items", item.id, "responsible", item.responsible)}</td>
              <td>${cellInput("implementation.items", item.id, "dueDate", item.dueDate, "date")}</td>
              <td>${cellSelect("implementation.items", item.id, "status", item.status, ["Open", "In progress", "Decided", "Done"])}</td>
              <td>${removeButton("implementation.items", item.id)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}
