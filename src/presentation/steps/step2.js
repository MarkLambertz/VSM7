import { cellInput, escapeAttr, escapeHtml, stepHeader, textarea } from "../shared/renderHelpers.js?v=20260530-step2-neutral";

export function renderStep2(workspace) {
  return `
    ${stepHeader("Step II", "Manageability & Flattening", "Evaluate horizontal and vertical variety using common wisdom and capture the selected remedy.")}
    ${renderStep2Assessment(workspace)}
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

export function renderStep2Assessment(workspace) {
  const selectedOption = workspace.step1.segmentationOptions.find((option) => option.id === workspace.step1.selectedSegmentationOptionId);
  const units = workspace.step1.operativeUnits || [];

  return `
    <section class="work-section step2-variety-section">
      <div class="section-heading">
        <h2>Variety Assessment for Steerability</h2>
        <button class="ghost-button" data-action="export-step" data-step="step2">Download Outcome</button>
      </div>
      <div class="selected-segmentation-panel">
        <div>
          <span>Selected segmentation</span>
          <strong>${escapeHtml(selectedOption?.name || "No segmentation selected yet")}</strong>
          <p>${escapeHtml(selectedOption?.description || "Select the preferred segmentation in Step I and define its real S1 units.")}</p>
        </div>
        <div class="operative-unit-list" aria-label="Operative units from Step I">
          ${units.length
            ? units.map((unit) => `<span>${escapeHtml(unit.name || "Unnamed S1")}</span>`).join("")
            : `<em>Add real operative units in Step I Evaluation.</em>`}
        </div>
      </div>
      <div class="variety-assessment-grid">
        <article class="variety-assessment-card is-horizontal">
          <h3>Horizontal Variety</h3>
          <p class="section-note">Assess the complexity created by the real operative units / S1.</p>
          ${sliderRow("... the amount of operative units", "step2.horizontalAssessment.operativeUnitsAmount", workspace.step2.horizontalAssessment.operativeUnitsAmount)}
          ${sliderRow("... their dissimilarity", "step2.horizontalAssessment.dissimilarity", workspace.step2.horizontalAssessment.dissimilarity)}
          ${sliderRow("... their ability to control themselves", "step2.horizontalAssessment.selfControl", workspace.step2.horizontalAssessment.selfControl)}
          ${textarea("Assessment", "step2.horizontalAssessment.notes", workspace.step2.horizontalAssessment.notes)}
        </article>
        <article class="variety-assessment-card is-vertical">
          <h3>Vertical Variety</h3>
          <p class="section-note">Assess the steering variety available to manage the chosen segmentation.</p>
          ${sliderRow("Environmental overlaps", "step2.verticalAssessment.environmentalOverlaps", workspace.step2.verticalAssessment.environmentalOverlaps)}
          ${sliderRow("System 3*", "step2.verticalAssessment.system3Star", workspace.step2.verticalAssessment.system3Star)}
          ${sliderRow("Operational dependencies", "step2.verticalAssessment.operationalDependencies", workspace.step2.verticalAssessment.operationalDependencies)}
          ${sliderRow("Resource bargain and accountability", "step2.verticalAssessment.resourceBargain", workspace.step2.verticalAssessment.resourceBargain)}
          ${sliderRow("Corporate intervention", "step2.verticalAssessment.corporateIntervention", workspace.step2.verticalAssessment.corporateIntervention)}
          ${sliderRow("System 2", "step2.verticalAssessment.system2", workspace.step2.verticalAssessment.system2)}
          ${textarea("Assessment", "step2.verticalAssessment.notes", workspace.step2.verticalAssessment.notes)}
        </article>
      </div>
    </section>
  `;
}

function sliderRow(label, path, value) {
  return `
    <label class="variety-slider-row">
      <span>${escapeHtml(label)}</span>
      <div class="variety-slider-control">
        <small>Small</small>
        <input type="range" min="0" max="100" step="1" data-path="${escapeAttr(path)}" value="${escapeAttr(sliderValue(value))}" aria-label="${escapeAttr(label)}">
        <small>Large</small>
      </div>
    </label>
  `;
}

function sliderValue(value) {
  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return Math.max(0, Math.min(100, numericValue));
  }

  return 50;
}
