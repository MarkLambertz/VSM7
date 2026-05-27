import { cellInput, escapeAttr, selectField, stepHeader, textarea } from "../shared/renderHelpers.js";

export function renderStep2(workspace) {
  return `
    ${stepHeader("Step II", "Manageability & Flattening", "Evaluate horizontal and vertical variety using common wisdom and capture the selected remedy.")}
    <section class="work-section">
      <div class="section-heading">
        <h2>Horizontal and Vertical Variety</h2>
        <button class="ghost-button" data-action="export-step" data-step="step2">Download Outcome</button>
      </div>
      <div class="field-grid three">
        ${selectField("Amount of operative units", "step2.horizontalAssessment.operativeUnitsAmount", workspace.step2.horizontalAssessment.operativeUnitsAmount, ["", "Small", "Medium", "Large"])}
        ${selectField("Dissimilarity", "step2.horizontalAssessment.dissimilarity", workspace.step2.horizontalAssessment.dissimilarity, ["", "Low", "Medium", "High"])}
        ${selectField("Self-control capability", "step2.horizontalAssessment.selfControl", workspace.step2.horizontalAssessment.selfControl, ["", "Weak", "Adequate", "Strong"])}
      </div>
      ${textarea("Horizontal assessment notes", "step2.horizontalAssessment.notes", workspace.step2.horizontalAssessment.notes)}
      <div class="field-grid three">
        ${selectField("Environmental overlaps", "step2.verticalAssessment.environmentalOverlaps", workspace.step2.verticalAssessment.environmentalOverlaps, ["", "Low", "Medium", "High"])}
        ${selectField("System 3*", "step2.verticalAssessment.system3Star", workspace.step2.verticalAssessment.system3Star, ["", "Weak", "Adequate", "Strong"])}
        ${selectField("Operational dependencies", "step2.verticalAssessment.operationalDependencies", workspace.step2.verticalAssessment.operationalDependencies, ["", "Low", "Medium", "High"])}
        ${selectField("Resource bargain", "step2.verticalAssessment.resourceBargain", workspace.step2.verticalAssessment.resourceBargain, ["", "Weak", "Adequate", "Strong"])}
        ${selectField("Corporate intervention", "step2.verticalAssessment.corporateIntervention", workspace.step2.verticalAssessment.corporateIntervention, ["", "Weak", "Adequate", "Strong"])}
        ${selectField("System 2", "step2.verticalAssessment.system2", workspace.step2.verticalAssessment.system2, ["", "Weak", "Adequate", "Strong"])}
      </div>
      ${textarea("Vertical assessment notes", "step2.verticalAssessment.notes", workspace.step2.verticalAssessment.notes)}
    </section>
    <section class="work-section">
      <div class="section-heading">
        <h2>Manageability Remedies</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Chosen</th><th>Option</th><th>Time to effect</th><th>Robustness</th><th>Pros</th><th>Cons</th><th>Challenges</th></tr></thead>
          <tbody>${workspace.step2.options.map((item) => `
            <tr>
              <td><input type="radio" name="selectedManageability" data-path="step2.selectedOption" value="${escapeAttr(item.id)}" ${workspace.step2.selectedOption === item.id ? "checked" : ""}></td>
              <td>${cellInput("step2.options", item.id, "name", item.name)}</td>
              <td>${cellInput("step2.options", item.id, "timeToEffect", item.timeToEffect)}</td>
              <td>${cellInput("step2.options", item.id, "robustness", item.robustness)}</td>
              <td>${cellInput("step2.options", item.id, "pros", item.pros)}</td>
              <td>${cellInput("step2.options", item.id, "cons", item.cons)}</td>
              <td>${cellInput("step2.options", item.id, "challenges", item.challenges)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
      ${textarea("Conclusion", "step2.conclusion", workspace.step2.conclusion)}
    </section>
  `;
}
