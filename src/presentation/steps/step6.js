import { cellInput, cellSelect, escapeHtml, stepHeader } from "../shared/renderHelpers.js?v=20260613-hero-cleanup";

export function renderStep6(workspace) {
  return `
    ${stepHeader("Step VI", "Communication Channels", "Evaluate robustness of communication loops through variety checks.")}
    <section class="work-section">
      <div class="section-heading">
        <h2>Variety Checks</h2>
        <button class="ghost-button" data-action="export-step" data-step="step6">Download Outcome</button>
      </div>
      <div class="table-wrap wide">
        <table>
          <thead><tr><th>Loop</th><th>Channels used</th><th>Capacity</th><th>Intelligibility</th><th>Synchronicity</th><th>Security</th><th>Observation</th></tr></thead>
          <tbody>${workspace.step6.communicationChannels.map((channel) => `
            <tr>
              <td><strong>${escapeHtml(channel.loop)}</strong></td>
              <td>${cellInput("step6.communicationChannels", channel.id, "channelsUsed", channel.channelsUsed)}</td>
              <td>${cellSelect("step6.communicationChannels", channel.id, "capacity", channel.capacity, ["", "Strong", "Adequate", "Weak"])}</td>
              <td>${cellSelect("step6.communicationChannels", channel.id, "intelligibility", channel.intelligibility, ["", "Strong", "Adequate", "Weak"])}</td>
              <td>${cellSelect("step6.communicationChannels", channel.id, "synchronicity", channel.synchronicity, ["", "Strong", "Adequate", "Weak"])}</td>
              <td>${cellSelect("step6.communicationChannels", channel.id, "security", channel.security, ["", "Strong", "Adequate", "Weak"])}</td>
              <td>${cellInput("step6.communicationChannels", channel.id, "observation", channel.observation)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}
