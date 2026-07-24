import { evaluateStep2Variety } from "../../domain/vsm.js?v=20260724-pptxgenjs";
import { escapeAttr, escapeHtml, fullscreenTile, removeButton, stepExportButton, stepHeader, textarea, tileExportButton, tileFullscreenButton } from "../shared/renderHelpers.js?v=20260724-pptxgenjs";

export const step2Subpages = [
  {
    id: "assessment",
    label: "Variety Assessment for Steerability"
  },
  {
    id: "challenges",
    label: "How to master steering challenges"
  }
];

export function renderStep2(workspace, activeSubpage = "assessment") {
  const activeStep2Subpage = normalizeStep2Subpage(activeSubpage);

  return `
    ${stepHeader(
      "Step II",
      "Manageability & Flattening",
      "Evaluate horizontal and vertical variety using common wisdom and capture manageability levers.",
      ""
    )}
    ${renderStep2Subnav(activeStep2Subpage)}
    ${activeStep2Subpage === "challenges"
      ? renderStep2Remedies(workspace)
      : renderStep2Assessment(workspace)}
  `;
}

export function normalizeStep2Subpage(subpage) {
  return step2Subpages.some((item) => item.id === subpage) ? subpage : "assessment";
}

export function renderStep2Subnav(activeSubpage = "assessment") {
  const normalizedSubpage = normalizeStep2Subpage(activeSubpage);

  return `
    <section class="substep-bar step2-substep-bar" aria-label="Step II substeps">
      ${step2Subpages.map((subpage, index) => `
        <button
          class="substep-button ${normalizedSubpage === subpage.id ? "is-active" : ""}"
          data-action="step2-subpage"
          data-subpage="${escapeAttr(subpage.id)}"
        >
          <span>${String(index + 1).padStart(2, "0")}</span>
          ${escapeHtml(subpage.label)}
        </button>
      `).join("")}
    </section>
  `;
}

export function renderStep2Remedies(workspace, { fullscreen = false } = {}) {
  const selectedOptionIds = new Set(workspace.step2.selectedOptionIds || []);

  return `
    <section class="work-section manageability-options-section ${fullscreen ? "fullscreen-matrix-section" : ""}">
      <div class="section-heading">
        <h2>How to master steering challenges</h2>
        <div class="section-actions">
          ${tileExportButton("step2", "step2-remedies", "Export manageability levers")}
          ${fullscreen ? "" : tileFullscreenButton("step2-remedies", "Open manageability levers fullscreen")}
          <button class="ghost-button" data-action="add-manageability-option">Add Option</button>
        </div>
      </div>
      <p class="section-note">Select the remedies that should be carried forward as inspiration for Step III.</p>
      <div class="manageability-option-overview-header" aria-hidden="true">
        <span>Select</span>
        <span>Option</span>
        <span>Time to effect</span>
        <span>Robustness</span>
        <span>Actions</span>
      </div>
      <div class="manageability-option-list">
        ${workspace.step2.options.map((item) => renderManageabilityOption(item, selectedOptionIds.has(item.id))).join("")}
      </div>
    </section>
  `;
}

function renderManageabilityOption(item, isSelected) {
  return `
    <article class="manageability-option-card ${isSelected ? "is-selected" : ""}">
      <div class="manageability-option-overview">
        <button
          type="button"
          class="manageability-select-button ${isSelected ? "is-selected" : ""}"
          data-action="toggle-manageability-option"
          data-option-id="${escapeAttr(item.id)}"
          aria-pressed="${isSelected}"
        >${isSelected ? "Selected" : "Select"}</button>
        ${manageabilityPreview(item.name, "Untitled steering option", "manageability-option-name")}
        ${manageabilityPreview(item.timeToEffect, "Not assessed yet")}
        ${manageabilityPreview(item.robustness, "Not assessed yet")}
        <div class="manageability-option-actions">
          ${removeButton("step2.options", item.id)}
        </div>
      </div>
      <details class="manageability-option-details">
        <summary>Read and edit details</summary>
        <div class="manageability-option-editor">
          ${manageabilityField("Option", item, "name")}
          ${manageabilityField("Time to effect", item, "timeToEffect")}
          ${manageabilityTextarea("Robustness", item, "robustness")}
          ${manageabilityTextarea("Pros", item, "pros")}
          ${manageabilityTextarea("Cons", item, "cons")}
          ${manageabilityTextarea("Challenges", item, "challenges")}
        </div>
      </details>
    </article>
  `;
}

function manageabilityPreview(value, fallback, className = "") {
  return `
    <span class="manageability-option-preview ${escapeAttr(className)}" title="${escapeAttr(value || fallback)}">
      ${escapeHtml(value || fallback)}
    </span>
  `;
}

function manageabilityField(label, item, fieldName) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input
        data-collection="step2.options"
        data-id="${escapeAttr(item.id)}"
        data-field="${escapeAttr(fieldName)}"
        value="${escapeAttr(item[fieldName])}"
      >
    </label>
  `;
}

function manageabilityTextarea(label, item, fieldName) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <textarea
        data-collection="step2.options"
        data-id="${escapeAttr(item.id)}"
        data-field="${escapeAttr(fieldName)}"
        rows="4"
      >${escapeHtml(item[fieldName])}</textarea>
    </label>
  `;
}

export function renderStep2Assessment(workspace, { fullscreen = false } = {}) {
  const selectedOption = workspace.step1.segmentationOptions.find((option) => option.id === workspace.step1.selectedSegmentationOptionId);
  const units = workspace.step1.operativeUnits || [];
  const varietyDiagnostics = evaluateStep2Variety(workspace);

  return `
    <section class="work-section step2-variety-section ${fullscreen ? "fullscreen-matrix-section" : ""}">
      <div class="section-heading">
        <h2>Variety Assessment for Steerability</h2>
        <div class="section-actions">
          ${tileExportButton("step2", "step2-assessment", "Export variety assessment")}
          ${fullscreen ? "" : tileFullscreenButton("step2-assessment", "Open variety assessment fullscreen")}
          <button class="ghost-button" data-action="reset-step2-sliders">Reset sliders</button>
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

export function renderStep2FullscreenTile(workspace, tileId = "step2-assessment") {
  if (tileId === "step2-remedies") {
    return fullscreenTile({
      kicker: "Step II · Manageability",
      title: "Manageability Levers",
      description: "Select the remedies that should feed Step III as real SCT source material.",
      counter: "Levers",
      variant: "is-table",
      tileClass: "step2-fullscreen-tile",
      actions: tileExportButton("step2", "step2-remedies", "Export manageability levers"),
      content: renderStep2Remedies(workspace, { fullscreen: true })
    });
  }

  return fullscreenTile({
    kicker: "Step II · Manageability",
    title: "Variety Assessment",
    description: "Use the larger surface to compare operative variety pressure with available steering variety.",
    counter: "Assessment",
    variant: "is-matrix",
    tileClass: "step2-fullscreen-tile",
    actions: tileExportButton("step2", "step2-assessment", "Export variety assessment"),
    content: renderStep2Assessment(workspace, { fullscreen: true })
  });
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
