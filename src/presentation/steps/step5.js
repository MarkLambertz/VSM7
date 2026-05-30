import { cellInput, cellSelect, escapeAttr, removeButton, stepHeader, tableHeader, taskMultiSelect } from "../shared/renderHelpers.js?v=20260530-step2-neutral";

export function renderStep5(workspace) {
  return `
    ${stepHeader("Step V", "Design S2-S5", "Capture boards, committees, meetings, their VSM system, and links to SCTs.")}
    <section class="work-section">
      ${tableHeader("Board, Committee, and Meeting Landscape", "add-meeting")}
      <div class="table-wrap wide">
        <table>
          <thead><tr><th>Keep</th><th>Name</th><th>Purpose</th><th>Participants</th><th>Cadence</th><th>Decision type</th><th>System</th><th>Linked SCTs</th><th></th></tr></thead>
          <tbody>${workspace.step5.meetings.map((meeting) => `
            <tr>
              <td><input type="checkbox" data-collection="step5.meetings" data-id="${escapeAttr(meeting.id)}" data-field="keep" ${meeting.keep ? "checked" : ""}></td>
              <td>${cellInput("step5.meetings", meeting.id, "name", meeting.name)}</td>
              <td>${cellInput("step5.meetings", meeting.id, "purpose", meeting.purpose)}</td>
              <td>${cellInput("step5.meetings", meeting.id, "participants", meeting.participants)}</td>
              <td>${cellInput("step5.meetings", meeting.id, "cadence", meeting.cadence)}</td>
              <td>${cellInput("step5.meetings", meeting.id, "decisionType", meeting.decisionType)}</td>
              <td>${cellSelect("step5.meetings", meeting.id, "vsmSystem", meeting.vsmSystem, ["2", "3", "3*", "4", "5"])}</td>
              <td>${taskMultiSelect(workspace, "step5.meetings", meeting.id, meeting.linkedTaskIds)}</td>
              <td>${removeButton("step5.meetings", meeting.id)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}
