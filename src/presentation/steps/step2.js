import { evaluateStep2Variety } from "../../domain/vsm.js?v=20260613-sct-tool-method2";
import { cellInput, escapeAttr, escapeHtml, removeButton, stepHeader, tableHeader, textarea } from "../shared/renderHelpers.js?v=20260613-hero-cleanup";

export function renderStep2(workspace) {
  return `
    ${stepHeader("Step II", "Manageability & Flattening", "Evaluate horizontal and vertical variety using common wisdom and capture manageability levers.")}
    ${renderStep2Assessment(workspace)}
    ${renderStep2Remedies(workspace)}
  `;
}

export function renderStep2Remedies(workspace) {
  const selectedOptionIds = new Set(workspace.step2.selectedOptionIds || []);

  return `
    <section class="work-section">
      ${tableHeader("How to master steering challenges", "add-manageability-option", "Add Option")}
      <p class="section-note">Select the remedies that should be carried forward as inspiration for Step III.</p>
      <div class="table-wrap wide">
        <table class="manageability-options-table">
          <thead><tr><th>Select</th><th>Option</th><th>Time to effect</th><th>Robustness</th><th>Pros</th><th>Cons</th><th>Challenges</th><th></th></tr></thead>
          <tbody>${workspace.step2.options.map((item) => {
            const isSelected = selectedOptionIds.has(item.id);
            return `
              <tr class="manageability-option-row ${isSelected ? "is-selected" : ""}">
                <td>
                  <button
                    type="button"
                    class="manageability-select-button ${isSelected ? "is-selected" : ""}"
                    data-action="toggle-manageability-option"
                    data-option-id="${escapeAttr(item.id)}"
                    aria-pressed="${isSelected}"
                  >${isSelected ? "Selected" : "Select"}</button>
                </td>
                <td>${cellInput("step2.options", item.id, "name", item.name)}</td>
                <td>${cellInput("step2.options", item.id, "timeToEffect", item.timeToEffect)}</td>
                <td>${cellInput("step2.options", item.id, "robustness", item.robustness)}</td>
                <td>${cellInput("step2.options", item.id, "pros", item.pros)}</td>
                <td>${cellInput("step2.options", item.id, "cons", item.cons)}</td>
                <td>${cellInput("step2.options", item.id, "challenges", item.challenges)}</td>
                <td>${removeButton("step2.options", item.id)}</td>
              </tr>
            `;
          }).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderStep2Assessment(workspace) {
  const selectedOption = workspace.step1.segmentationOptions.find((option) => option.id === workspace.step1.selectedSegmentationOptionId);
  const units = workspace.step1.operativeUnits || [];
  const varietyDiagnostics = evaluateStep2Variety(workspace);

  return `
    <section class="work-section step2-variety-section">
      <div class="section-heading">
        <h2>Variety Assessment for Steerability</h2>
        <div class="section-actions">
          <button class="ghost-button" data-action="reset-step2-sliders">Reset sliders</button>
          <button class="ghost-button" data-action="export-step" data-step="step2">Download Outcome</button>
        </div>
      </div>
      <div class="step2-context-panel">
        <div class="selected-segmentation-card">
          <span>Selected segmentation</span>
          <strong>${escapeHtml(selectedOption?.name || "No segmentation selected yet")}</strong>
          <p>${escapeHtml(selectedOption?.description || "Select the preferred segmentation in Step I and define its real S1 units.")}</p>
        </div>
        <div class="s1-unit-cluster" aria-label="Operative units from Step I">
          <span class="s1-unit-cluster-label">Defined S1 / operative units</span>
          <div class="s1-unit-circles">
            ${units.length
              ? units.map((unit, index) => renderS1Circle(unit, index)).join("")
              : `<em>Add real operative units in Step I Evaluation.</em>`}
          </div>
        </div>
      </div>
      <div class="variety-assessment-grid">
        <article class="variety-assessment-card is-horizontal">
          <div class="variety-card-header">
            <div>
              <h3>Horizontal Variety</h3>
              <p class="section-note">Assess the complexity created by the real operative units / S1.</p>
            </div>
            ${renderHorizontalPressureGauge(varietyDiagnostics.horizontalPressure)}
          </div>
          <div class="horizontal-variety-layout">
            <div class="horizontal-variety-sliders">
              ${sliderRow("... the amount of operative units", "step2.horizontalAssessment.operativeUnitsAmount", workspace.step2.horizontalAssessment.operativeUnitsAmount, "horizontal")}
              ${sliderRow("... their dissimilarity", "step2.horizontalAssessment.dissimilarity", workspace.step2.horizontalAssessment.dissimilarity, "horizontal")}
              ${sliderRow("... their ability to control themselves", "step2.horizontalAssessment.selfControl", workspace.step2.horizontalAssessment.selfControl, "horizontal")}
            </div>
            <aside class="variety-pressure-note">
              <strong>Ashby's Law</strong>
              <span>More variety in the operative system requires enough management variety to absorb it. Strong S1 self-control reduces the pressure.</span>
            </aside>
          </div>
          ${textarea("Assessment", "step2.horizontalAssessment.notes", workspace.step2.horizontalAssessment.notes)}
        </article>
        <article class="variety-assessment-card is-vertical">
          <div class="variety-card-header">
            <div>
              <h3>Vertical Variety</h3>
              <p class="section-note">Assess the steering variety available to manage the chosen segmentation.</p>
            </div>
            ${renderVerticalVarietyGauge(varietyDiagnostics.verticalFit)}
          </div>
          ${sliderRow("Environmental overlaps", "step2.verticalAssessment.environmentalOverlaps", workspace.step2.verticalAssessment.environmentalOverlaps, "vertical")}
          ${sliderRow("System 3*", "step2.verticalAssessment.system3Star", workspace.step2.verticalAssessment.system3Star, "vertical")}
          ${sliderRow("Operational dependencies", "step2.verticalAssessment.operationalDependencies", workspace.step2.verticalAssessment.operationalDependencies, "vertical")}
          ${sliderRow("Resource bargain and accountability", "step2.verticalAssessment.resourceBargain", workspace.step2.verticalAssessment.resourceBargain, "vertical")}
          ${sliderRow("Corporate intervention", "step2.verticalAssessment.corporateIntervention", workspace.step2.verticalAssessment.corporateIntervention, "vertical")}
          ${sliderRow("System 2", "step2.verticalAssessment.system2", workspace.step2.verticalAssessment.system2, "vertical")}
          ${textarea("Assessment", "step2.verticalAssessment.notes", workspace.step2.verticalAssessment.notes)}
        </article>
      </div>
      ${renderVarietyFitPanel(varietyDiagnostics)}
    </section>
  `;
}

function renderS1Circle(unit, index) {
  return `
    <span class="s1-unit-circle" title="${escapeAttr(unit.description || unit.notes || unit.name || "S1 unit")}">
      <small>S1-${index + 1}</small>
      <strong>${escapeHtml(unit.name || "Unnamed S1")}</strong>
    </span>
  `;
}

function renderHorizontalPressureGauge(value) {
  return `
    <div
      class="horizontal-variety-gauge"
      data-horizontal-variety-gauge
      style="--variety-pressure: ${escapeAttr(String(value))}%;"
      aria-label="Horizontal variety pressure indicator"
    >
      <span class="horizontal-variety-gauge-track">
        <span class="horizontal-variety-gauge-marker"></span>
      </span>
    </div>
  `;
}

function renderVerticalVarietyGauge(value) {
  return `
    <div
      class="horizontal-variety-gauge vertical-variety-gauge"
      data-vertical-variety-gauge
      style="--vertical-variety: ${escapeAttr(String(value))}%;"
      aria-label="Vertical variety indicator"
    >
      <span class="horizontal-variety-gauge-track vertical-variety-gauge-track">
        <span class="horizontal-variety-gauge-marker vertical-variety-gauge-marker"></span>
      </span>
    </div>
  `;
}

function renderVarietyFitPanel(diagnostics) {
  return `
    <article class="variety-fit-panel">
      <div class="variety-fit-header">
        <div>
          <span class="panel-kicker">Computed pattern support</span>
          <h3>Variety Fit Indicator</h3>
          <p>Compare operative variety pressure with available steering variety. This is pattern reading, not a truth machine.</p>
        </div>
        ${renderVarietyFitGauge(diagnostics.fitPosition)}
      </div>
      <div class="variety-fit-columns">
        <section class="variety-interpretation-group">
          <h4>Interpretation help</h4>
          <div class="variety-interpretation-cards">
            ${diagnostics.interpretationCards.map(renderInterpretationCard).join("")}
          </div>
        </section>
        <section class="variety-interpretation-group">
          <h4>SCT signals for Step III</h4>
          <ul class="sct-signal-list">
            ${diagnostics.sctSignals.length
              ? diagnostics.sctSignals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")
              : `<li>No strong SCT signal yet. Re-check after the workshop discussion.</li>`}
          </ul>
        </section>
      </div>
    </article>
  `;
}

function renderVarietyFitGauge(position) {
  return `
    <div
      class="variety-fit-gauge"
      data-variety-fit-gauge
      style="--variety-fit-position: ${escapeAttr(String(position))}%;"
      aria-label="Variety fit indicator"
    >
      <span class="variety-fit-track">
        <span class="variety-fit-zone"></span>
        <span class="variety-fit-marker"></span>
      </span>
      <div class="variety-fit-labels" aria-hidden="true">
        <span>Under-absorbed</span>
        <span>Fit zone</span>
        <span>Over-steered</span>
      </div>
    </div>
  `;
}

function renderInterpretationCard(card) {
  return `
    <article class="variety-interpretation-card tone-${escapeAttr(card.tone)}">
      <strong>${escapeHtml(card.title)}</strong>
      <p>${escapeHtml(card.observation)}</p>
      <small>${escapeHtml(card.question)}</small>
      <em>${escapeHtml(card.implication)}</em>
    </article>
  `;
}

function sliderRow(label, path, value, driver = "") {
  return `
    <div class="variety-slider-row">
      <div class="variety-slider-row-header">
        <span>${escapeHtml(label)}</span>
        <button
          class="slider-reset-button"
          type="button"
          data-action="reset-variety-slider"
          data-path="${escapeAttr(path)}"
          title="Reset to neutral"
          aria-label="Reset ${escapeAttr(label)} to neutral"
        ><span aria-hidden="true"></span></button>
      </div>
      <div class="variety-slider-control">
        <small>Small</small>
        <input type="range" min="0" max="100" step="1" data-path="${escapeAttr(path)}" ${driver ? `data-variety-driver="${escapeAttr(driver)}"` : ""} value="${escapeAttr(sliderValue(value))}" aria-label="${escapeAttr(label)}">
        <small>Large</small>
      </div>
    </div>
  `;
}

function sliderValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return 50;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return Math.max(0, Math.min(100, numericValue));
  }

  return 50;
}
