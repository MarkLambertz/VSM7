import {
  cellInput,
  cellSelect,
  emptyState,
  escapeAttr,
  escapeHtml,
  field,
  removeButton,
  tableHeader,
  textarea
} from "../shared/renderHelpers.js?v=20260530-step2-neutral";
import { renderMethodVisual } from "../shared/methodVisuals.js?v=20260530-step2-neutral";

export const step1Subpages = [
  {
    id: "sif",
    label: "SIF & Recursion",
    title: "Set the system boundary",
    focus: "Create a shared picture of the System-in-Focus and the recursion levels around it.",
    artifact: "Named System-in-Focus with purpose, stakeholders, and recursion context.",
    visual: "Boundary map",
    visualKind: "boundary",
    visualItems: ["R+1 parent system", "R0 System-in-Focus", "R-1 nested systems"],
    coachNote: "Start with the recursion context and distinguish purpose-fulfilling operative units from support units. The org chart is evidence, not the answer.",
    prompts: ["What exactly is inside the System-in-Focus?", "Which parent and child systems frame the discussion?", "Which stakeholders must recognize themselves in the boundary?"]
  },
  {
    id: "segmentation",
    label: "Segmentation Options",
    title: "Open the segmentation space",
    focus: "Capture the plausible ways the business could be decomposed before evaluating them.",
    artifact: "Candidate segmentation options with decision notes.",
    visual: "Segmentation option cards",
    visualKind: "segmentation",
    visualItems: ["Regional", "Product", "Customer", "Function"],
    coachNote: "Make each option tangible: what operative units would exist, how would they be steered, and what customer value would this structure privilege?",
    prompts: ["Which segmentation logic is currently used?", "Which alternatives could create more effective management attention?", "What decision notes explain each option?"]
  },
  {
    id: "criteria",
    label: "Key Buying Criteria",
    title: "Make market logic explicit",
    focus: "Translate customer choice and competitive pressure into weighted criteria.",
    artifact: "Weighted key buying criteria with relative position to competition.",
    visual: "Customer value lens",
    visualKind: "criteria",
    visualItems: ["Criterion", "Weight", "Competition", "Priority"],
    coachNote: "Stay with the customer perspective. A short list of decisive buying criteria is stronger than a long catalogue of internal wishes.",
    prompts: ["Why do customers choose one offer over another?", "Which criteria truly decide the purchase?", "Do the weights add up to 100 percent?"]
  },
  {
    id: "six-pack",
    label: "Six Pack Fields",
    title: "Translate strategy into ambition",
    focus: "Describe priorities, targets, and ambitions along the Six Pack of Control.",
    artifact: "Strategic fields of action with supporting links and files.",
    visual: "Six Pack compass",
    visualKind: "sixpack",
    visualItems: ["Market", "Innovation", "Productivity", "People", "Profit", "Cash"],
    coachNote: "Focus on direction before precision. Capture the strategic ambition clearly enough that it can later shape SCTs, roles, and meetings.",
    prompts: ["What must change for each control variable?", "Which ambition needs top management attention?", "Which evidence or source material should stay connected?"]
  },
  {
    id: "evaluation",
    label: "Evaluation",
    title: "Force the segmentation decision",
    focus: "Compare the options row by row and select the segmentation that best fits the system.",
    artifact: "Prioritized segmentation matrix and decision rationale.",
    visual: "Decision heatmap",
    visualKind: "heatmap",
    visualItems: ["Option A", "Option B", "Option C", "Weak fields", "Pattern"],
    coachNote: "Use the numbers to reveal a pattern, not to outsource judgment. If two options are close, choose change only when the benefit is clear.",
    prompts: ["Where does each option clearly win or lose?", "Are weak fields visible enough for later SCT work?", "Can the group explain the selected option?"]
  }
];

const sixPackGuidance = {
  "Market Position": {
    meaning: "Priorities and targets for market share, customer segments, competitive positioning, and growth focus.",
    example: "Example: Reach a top-three position in priority markets while defending premium customers."
  },
  Innovation: {
    meaning: "Ambitions for product, service, business model, technology, and learning speed.",
    example: "Example: Launch two modular platform innovations per year with faster customer validation."
  },
  Productivity: {
    meaning: "Targets for efficiency, throughput, quality, standardization, and resource leverage.",
    example: "Example: Reduce engineering rework by 20% through shared architecture and clearer ownership."
  },
  "Attractiveness for good people": {
    meaning: "Priorities for talent attraction, development, leadership quality, and meaningful work.",
    example: "Example: Build product-owner roles that attract senior entrepreneurial leaders."
  },
  Profitability: {
    meaning: "Ambitions for margin, return, pricing power, cost position, and profitable growth.",
    example: "Example: Improve contribution margin by shifting volume toward configurable premium offers."
  },
  "Liquidity / Cash Flow": {
    meaning: "Targets for cash conversion, working capital, investment discipline, and funding resilience.",
    example: "Example: Shorten order-to-cash cycle by aligning delivery milestones with customer payments."
  }
};
export function renderStep1(workspace, activeStep1Subpage) {
  const activeSubpage = getStep1Subpage(activeStep1Subpage);

  return `
    <div class="step1-workshop-shell">
      ${renderStep1Stage(workspace, activeSubpage)}
      ${renderStep1Progress(activeSubpage)}
    </div>
    ${renderStep1Subnav(activeStep1Subpage)}
    ${renderStep1Subpage(workspace, activeStep1Subpage)}
  `;
}

export function getStep1FullscreenTileCount(workspace, activeStep1Subpage) {
  return getStep1FullscreenTiles(workspace, activeStep1Subpage).length;
}

export function renderStep1Fullscreen(workspace, activeStep1Subpage, activeTileIndex) {
  const tiles = getStep1FullscreenTiles(workspace, activeStep1Subpage);
  const safeIndex = clampTileIndex(activeTileIndex, tiles.length);
  const tile = tiles[safeIndex];

  return `
    <div class="step1-fullscreen-shell" aria-label="Step I fullscreen workshop mode">
      <div class="step1-fullscreen-progress" aria-label="Fullscreen tile progress">
        ${tiles.map((item, index) => `
          <span class="${index < safeIndex ? "is-done" : ""} ${index === safeIndex ? "is-current" : ""}">
            ${escapeHtml(item.shortLabel)}
          </span>
        `).join("")}
      </div>
      <article class="step1-fullscreen-tile ${escapeAttr(tile.variant || "")}">
        ${tile.variant === "is-explanation" ? "" : renderFullscreenTileHeader(tile, safeIndex, tiles.length)}
        <div class="fullscreen-tile-body">
          ${tile.content}
        </div>
      </article>
    </div>
  `;
}

function renderFullscreenTileHeader(tile, safeIndex, tileCount) {
  return `
    <div class="fullscreen-tile-header">
      <div>
        <p class="eyebrow">${escapeHtml(tile.kicker)}</p>
        <h1>${escapeHtml(tile.title)}</h1>
        <p>${escapeHtml(tile.description)}</p>
      </div>
      <span class="fullscreen-tile-counter">${safeIndex + 1} / ${tileCount}</span>
    </div>
  `;
}

function clampTileIndex(activeTileIndex, tileCount) {
  return Math.min(Math.max(Number(activeTileIndex) || 0, 0), Math.max(tileCount - 1, 0));
}

function getStep1Subpage(activeStep1Subpage) {
  return step1Subpages.find((subpage) => subpage.id === activeStep1Subpage) || step1Subpages[0];
}

function renderStep1Stage(workspace, activeSubpage) {
  const selectedOption = workspace.step1.segmentationOptions
    .find((option) => option.id === workspace.step1.selectedSegmentationOptionId);

  return `
    <section class="step1-stage" aria-label="Step I workshop focus">
      <div class="step1-stage-copy">
        <p class="eyebrow">Step I · Operative Units</p>
        <h1>${escapeHtml(activeSubpage.title)}</h1>
        <p>${escapeHtml(activeSubpage.focus)}</p>
        <div class="stage-context-strip">
          <span><strong>SIF</strong>${escapeHtml(workspace.sif.name || "Not named yet")}</span>
          <span><strong>Selected segmentation</strong>${escapeHtml(selectedOption?.name || "Open decision")}</span>
          <span><strong>Outcome</strong>${escapeHtml(activeSubpage.artifact)}</span>
        </div>
      </div>
      ${renderMethodVisual(activeSubpage)}
    </section>
  `;
}

function renderStep1Progress(activeSubpage) {
  const currentIndex = step1Subpages.findIndex((subpage) => subpage.id === activeSubpage.id);

  return `
    <div class="step1-progress-strip" aria-label="Step I progress">
      ${step1Subpages.map((subpage, index) => `
        <span class="${index < currentIndex ? "is-done" : ""} ${subpage.id === activeSubpage.id ? "is-current" : ""}">
          ${String(index + 1).padStart(2, "0")}
        </span>
      `).join("")}
    </div>
  `;
}

function renderStep1Subnav(activeStep1Subpage) {
  return `
    <section class="substep-bar step1-substep-bar" aria-label="Step I subpages">
      ${step1Subpages.map((subpage, index) => `
        <button
          class="substep-button ${activeStep1Subpage === subpage.id ? "is-active" : ""}"
          data-action="step1-subpage"
          data-subpage="${escapeAttr(subpage.id)}"
        >
          <span>${String(index + 1).padStart(2, "0")}</span>
          ${escapeHtml(subpage.label)}
        </button>
      `).join("")}
    </section>
  `;
}

function renderStep1Subpage(workspace, activeStep1Subpage) {
  if (activeStep1Subpage === "segmentation") {
    return renderStep1SegmentationOptions(workspace);
  }

  if (activeStep1Subpage === "criteria") {
    return renderStep1KeyBuyingCriteria(workspace);
  }

  if (activeStep1Subpage === "six-pack") {
    return renderStep1SixPack(workspace);
  }

  if (activeStep1Subpage === "evaluation") {
    return renderStep1Evaluation(workspace);
  }

  return renderStep1Sif(workspace);
}

function renderStep1Sif(workspace) {
  return renderWorkshopTaskFrame("sif", `
    ${renderSifSection(workspace)}
    ${renderRecursionSection(workspace)}
  `);
}

function renderSifSection(workspace) {
  return `
    <section class="work-section sif-capture-section">
      <div class="section-heading">
        <h2>System-in-Focus</h2>
        <button class="ghost-button" data-action="export-step" data-step="step1">Download Outcome</button>
      </div>
      <div class="field-grid one">
        ${field("Name", "sif.name", workspace.sif.name)}
      </div>
      <div class="field-grid two">
        ${textarea("Purpose", "sif.purpose", workspace.sif.purpose)}
        ${textarea("Customers and stakeholders", "sif.customers", workspace.sif.customers)}
      </div>
    </section>
  `;
}

function renderRecursionSection(workspace) {
  const sortedLevels = sortRecursionLevels(workspace.step1.recursionLevels);

  return `
    <section class="work-section recursion-capture-section">
      <div class="section-heading">
        <div>
          <h2>Recursion Levels</h2>
          <p class="section-note inline">Levels are fixed. Add organizations on an existing level, or extend one level above or below.</p>
        </div>
        <div class="header-actions">
          <button class="ghost-button" data-action="add-recursion-above">One level above (${escapeHtml(nextRecursionLevel(workspace, "above"))})</button>
          <button class="ghost-button" data-action="add-recursion-below">One level below (${escapeHtml(nextRecursionLevel(workspace, "below"))})</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Level</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>${sortedLevels.map((item, index) => `
            <tr>
              <td><span class="recursion-level-token">${escapeHtml(item.level)}</span></td>
              <td>${cellInput("step1.recursionLevels", item.id, "name", item.name)}</td>
              <td>${cellInput("step1.recursionLevels", item.id, "description", item.description)}</td>
              <td class="recursion-actions">
                <button
                  class="ghost-button small"
                  data-action="add-recursion-same-level"
                  data-level="${escapeAttr(item.level)}"
                >Add org.</button>
                ${isProtectedBaseRecursionRow(sortedLevels, item, index) ? "" : removeButton("step1.recursionLevels", item.id)}
              </td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}

function sortRecursionLevels(levels) {
  return [...levels].sort((left, right) => recursionRank(left.level) - recursionRank(right.level));
}

function recursionRank(level) {
  const match = String(level || "").match(/^R([+-]\d+|0)$/);
  if (!match) {
    return 0;
  }

  return -Number(match[1]);
}

function nextRecursionLevel(workspace, direction) {
  const values = workspace.step1.recursionLevels
    .map((item) => String(item.level || "").match(/^R([+-]\d+|0)$/)?.[1])
    .filter(Boolean)
    .map(Number);

  if (direction === "above") {
    return `R+${Math.max(1, ...values.filter((value) => value > 0)) + 1}`;
  }

  return `R${Math.min(-1, ...values.filter((value) => value < 0)) - 1}`;
}

function isBaseRecursionLevel(level) {
  return ["R+1", "R0", "R-1"].includes(level);
}

function isProtectedBaseRecursionRow(sortedLevels, item, index) {
  if (!isBaseRecursionLevel(item.level)) {
    return false;
  }

  return sortedLevels.findIndex((candidate) => candidate.level === item.level) === index;
}

function renderStep1SegmentationOptions(workspace) {
  return renderWorkshopTaskFrame("segmentation", renderSegmentationOptionsSection(workspace));
}

function renderSegmentationOptionsSection(workspace) {
  return `
    <section class="work-section">
      ${tableHeader("Segmentation Options", "add-segmentation")}
      <p class="section-note">Create the candidate business segmentations that will later become columns in the evaluation matrix.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Option</th><th>Description</th><th>Decision notes</th><th></th></tr></thead>
          <tbody>${workspace.step1.segmentationOptions.map((item) => `
            <tr>
              <td>${cellInput("step1.segmentationOptions", item.id, "name", item.name)}</td>
              <td>${cellInput("step1.segmentationOptions", item.id, "description", item.description)}</td>
              <td>${cellInput("step1.segmentationOptions", item.id, "decisionNotes", item.decisionNotes)}</td>
              <td>${removeButton("step1.segmentationOptions", item.id)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
      ${workspace.step1.segmentationOptions.length === 0 ? emptyState("Add at least two segmentation options before evaluating.") : ""}
    </section>
  `;
}

function renderStep1KeyBuyingCriteria(workspace) {
  return renderWorkshopTaskFrame("criteria", renderKeyBuyingCriteriaSection(workspace));
}

function renderKeyBuyingCriteriaSection(workspace) {
  return `
    <section class="work-section">
      ${tableHeader("Key Buying Criteria", "add-criterion")}
      <p class="section-note">Use customer-facing, purchase-deciding criteria. Keep the list sharp: usually five to seven, with weights summing to 100%.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Criterion</th><th>Explanation</th><th>Weight</th><th>Relative Position to Competition</th><th></th></tr></thead>
          <tbody>${workspace.step1.keyBuyingCriteria.map((item) => `
            <tr>
              <td>${cellInput("step1.keyBuyingCriteria", item.id, "name", item.name)}</td>
              <td>${cellInput("step1.keyBuyingCriteria", item.id, "explanation", item.explanation)}</td>
              <td>${cellInput("step1.keyBuyingCriteria", item.id, "weight", item.weight, "number")}</td>
              <td>${cellSelect("step1.keyBuyingCriteria", item.id, "relativePosition", item.relativePosition, ["Unknown", "Better", "Equal", "Worse"])}</td>
              <td>${removeButton("step1.keyBuyingCriteria", item.id)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderStep1SixPack(workspace) {
  return renderWorkshopTaskFrame("six-pack", renderSixPackSection(workspace));
}

function renderSixPackSection(workspace) {
  return `
    <section class="work-section strategic-fields-section">
      <div class="section-heading">
        <h2>Strategic Fields of Action</h2>
      </div>
      <p class="section-note">Capture directions and initiatives along the Six Pack of Control. These rows feed directly into the final segmentation evaluation.</p>
      <div class="strategic-field-list">
        ${workspace.step1.strategicFields.map((item) => renderStrategicField(item)).join("")}
      </div>
    </section>
  `;
}

function renderStrategicField(item) {
  const links = item.links || [];
  const files = item.files || [];
  const guidance = sixPackGuidance[item.variable] || {
    meaning: "Describe the strategic priorities, targets, and ambitions for this field.",
    example: "Example: State a concrete target and what it means for the System-in-Focus."
  };

  return `
    <article class="strategic-field-row">
      <div class="strategic-field-heading">
        <span>Six Pack variable</span>
        <h3>${escapeHtml(item.variable)}</h3>
        <p>${escapeHtml(guidance.meaning)}</p>
        <small>${escapeHtml(guidance.example)}</small>
      </div>
      <label class="field strategic-direction-field">
        <span>Priorities, targets, and ambitions for the System-in-Focus</span>
        <textarea
          data-collection="step1.strategicFields"
          data-id="${escapeAttr(item.id)}"
          data-field="direction"
          rows="8"
        >${escapeHtml(item.direction)}</textarea>
      </label>
      <div class="strategic-reference-area">
        <div class="strategic-reference-block">
          <div class="reference-heading">
            <strong>Links</strong>
            <button class="ghost-button small" data-action="add-strategic-link" data-field-id="${escapeAttr(item.id)}">Add Link</button>
          </div>
          <div class="strategic-link-list">
            ${links.length > 0
              ? links.map((link) => renderStrategicLink(item.id, link)).join("")
              : `<p class="empty-state compact">No links captured yet.</p>`}
          </div>
        </div>
        <div class="strategic-reference-block">
          <div class="reference-heading">
            <strong>Files</strong>
            <label class="ghost-button small file-upload-button">
              Upload Files
              <input type="file" multiple data-strategic-files="${escapeAttr(item.id)}">
            </label>
          </div>
          <div class="strategic-file-list">
            ${files.length > 0
              ? files.map((file) => renderStrategicFile(item.id, file)).join("")
              : `<p class="empty-state compact">No files uploaded yet.</p>`}
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderStrategicLink(fieldId, link) {
  return `
    <div class="strategic-link-row">
      <input
        aria-label="Link label"
        placeholder="Label"
        data-strategic-link="${escapeAttr(`${fieldId}|${link.id}`)}"
        data-field="label"
        value="${escapeAttr(link.label)}"
      >
      <input
        aria-label="URL"
        placeholder="https://..."
        data-strategic-link="${escapeAttr(`${fieldId}|${link.id}`)}"
        data-field="url"
        value="${escapeAttr(link.url)}"
      >
      <button
        class="icon-button"
        title="Remove link"
        data-action="remove-strategic-link"
        data-field-id="${escapeAttr(fieldId)}"
        data-link-id="${escapeAttr(link.id)}"
      >x</button>
    </div>
  `;
}

function renderStrategicFile(fieldId, file) {
  const fileName = file.name || "Uploaded file";

  return `
    <div class="strategic-file-row">
      <div>
        ${file.dataUrl
          ? `<a href="${escapeAttr(file.dataUrl)}" download="${escapeAttr(fileName)}">${escapeHtml(fileName)}</a>`
          : `<strong>${escapeHtml(fileName)}</strong>`}
        <small>${escapeHtml(formatFileMeta(file))}</small>
      </div>
      <button
        class="icon-button"
        title="Remove file"
        data-action="remove-strategic-file"
        data-field-id="${escapeAttr(fieldId)}"
        data-file-id="${escapeAttr(file.id)}"
      >x</button>
    </div>
  `;
}

function formatFileMeta(file) {
  const size = Number(file.size || 0);
  const formattedSize = size > 0 ? `${Math.round(size / 1024)} KB` : "size unknown";
  const mode = file.storageMode === "reference" ? "reference only" : "stored";
  return `${formattedSize} · ${mode}`;
}

function renderStep1Evaluation(workspace) {
  return renderWorkshopTaskFrame("evaluation", renderEvaluationSection(workspace));
}

function renderEvaluationSection(workspace) {
  const options = workspace.step1.segmentationOptions;
  const rows = getStep1EvaluationRows(workspace);
  const totals = calculateSegmentationTotals(workspace, rows, options);

  return `
    <section class="work-section">
      <div class="section-heading">
        <h2>Segmentation Evaluation</h2>
        <button class="ghost-button" data-action="export-step" data-step="step1">Download Outcome</button>
      </div>
      <p class="section-note">Use forced prioritization per row. With ${options.length || "n"} segmentation option(s), each row uses a score scale of 1 to n+1; the same number can only appear once in that row.</p>
      ${options.length < 2
        ? emptyState("Add at least two segmentation options before evaluating.")
        : renderSegmentationEvaluationMatrix(workspace, rows, options, totals)}
      ${renderSegmentationDecisionFields(workspace, options)}
      ${renderOperativeUnitsSection(workspace)}
    </section>
  `;
}

function renderSegmentationDecisionFields(workspace, options) {
  return `
    <div class="field-grid two step1-decision-fields">
      <label class="field decision-field-select">
        <span>Preferred segmentation option</span>
        <select data-path="step1.selectedSegmentationOptionId">
          <option value="">Select</option>
          ${options.map((option) => `<option value="${escapeAttr(option.id)}" ${workspace.step1.selectedSegmentationOptionId === option.id ? "selected" : ""}>${escapeHtml(option.name || "Unnamed option")}</option>`).join("")}
        </select>
      </label>
      ${textarea("Decision rationale", "step1.decisionRationale", workspace.step1.decisionRationale)}
    </div>
  `;
}

function renderOperativeUnitsSection(workspace) {
  const units = workspace.step1.operativeUnits || [];
  const selectedOption = workspace.step1.segmentationOptions.find((option) => option.id === workspace.step1.selectedSegmentationOptionId);

  return `
    <section class="nested-work-section operative-units-section">
      ${tableHeader("Real Operative Units / S1", "add-operative-unit")}
      <p class="section-note">
        Translate the selected segmentation${selectedOption?.name ? ` (${escapeHtml(selectedOption.name)})` : ""} into the real operative units that Step II will assess.
      </p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Operative unit / S1</th><th>Scope or kind</th><th>Notes</th><th></th></tr></thead>
          <tbody>${units.map((unit) => `
            <tr>
              <td>${cellInput("step1.operativeUnits", unit.id, "name", unit.name)}</td>
              <td>${cellInput("step1.operativeUnits", unit.id, "description", unit.description)}</td>
              <td>${cellInput("step1.operativeUnits", unit.id, "notes", unit.notes)}</td>
              <td>${removeButton("step1.operativeUnits", unit.id)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
      ${units.length === 0 ? emptyState("Add the real S1 units implied by the selected segmentation.") : ""}
    </section>
  `;
}

function getStep1FullscreenTiles(workspace, activeStep1Subpage) {
  const subpage = getStep1Subpage(activeStep1Subpage);
  const index = step1Subpages.findIndex((item) => item.id === subpage.id) + 1;
  const briefTile = createFullscreenTile(
    `${String(index).padStart(2, "0")} · Explanation`,
    subpage.title,
    subpage.focus,
    renderFullscreenBriefContent(workspace, subpage),
    "is-explanation",
    "Brief"
  );

  if (subpage.id === "sif") {
    return [
      briefTile,
      createFullscreenTile("System-in-Focus", "System-in-Focus", "Name the system, its purpose, and its relevant customers or stakeholders.", renderSifSection(workspace), "is-form", "SIF"),
      createFullscreenTile("Recursion Levels", "Recursion Levels", "Adjust the names and descriptions of the fixed recursion levels around the System-in-Focus.", renderRecursionSection(workspace), "is-table", "Rec")
    ];
  }

  if (subpage.id === "segmentation") {
    return [
      briefTile,
      createFullscreenTile("Segmentation Options", "Segmentation Options", "Capture the candidate segmentation logics that later become columns in the evaluation matrix.", renderSegmentationOptionsSection(workspace), "is-table", "Options")
    ];
  }

  if (subpage.id === "criteria") {
    return [
      briefTile,
      createFullscreenTile("Key Buying Criteria", "Key Buying Criteria", "Capture the customer-facing criteria and their relative weight.", renderKeyBuyingCriteriaSection(workspace), "is-table", "KBC")
    ];
  }

  if (subpage.id === "six-pack") {
    const fieldTiles = workspace.step1.strategicFields.map((fieldItem, fieldIndex) => createFullscreenTile(
      fieldItem.variable,
      fieldItem.variable,
      sixPackGuidance[fieldItem.variable]?.meaning || "Describe strategic priorities, targets, and ambitions for this field.",
      `<section class="work-section strategic-fields-section fullscreen-single-field">${renderStrategicField(fieldItem)}</section>`,
      "is-form",
      String(fieldIndex + 1).padStart(2, "0")
    ));

    return [
      briefTile,
      ...fieldTiles
    ];
  }

  return [
    briefTile,
    createFullscreenTile("Evaluation Matrix", "Segmentation Evaluation", "Use the giant matrix view to keep the group oriented while scores and totals change.", renderFullscreenEvaluationMatrix(workspace), "is-matrix", "Matrix"),
    createFullscreenTile("Decision", "Decision Rationale", "Select the preferred segmentation and capture the rationale while the workshop memory is fresh.", renderFullscreenDecision(workspace), "is-form", "Decision")
  ];
}

function createFullscreenTile(kicker, title, description, content, variant, shortLabel) {
  return { kicker, title, description, content, variant, shortLabel };
}

function renderFullscreenBriefContent(_workspace, subpage) {
  return `
    <div class="fullscreen-brief-layout">
      <div class="fullscreen-brief-copy workshop-brief-panel">
        <span class="brief-index">${String(step1Subpages.findIndex((item) => item.id === subpage.id) + 1).padStart(2, "0")}</span>
        <p class="eyebrow">Step I · Operative Units</p>
        <h2>${escapeHtml(subpage.title)}</h2>
        <p>${escapeHtml(subpage.focus)}</p>
        <div class="brief-outcome">
          <span>Workshop outcome</span>
          <strong>${escapeHtml(subpage.artifact)}</strong>
        </div>
        <p class="fullscreen-coach-note">${escapeHtml(subpage.coachNote)}</p>
        <ul class="brief-prompts fullscreen-prompts">
          ${subpage.prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}
        </ul>
      </div>
      ${renderMethodVisual(subpage, "fullscreen")}
    </div>
  `;
}

function renderFullscreenEvaluationMatrix(workspace) {
  const options = workspace.step1.segmentationOptions;
  const rows = getStep1EvaluationRows(workspace);
  const totals = calculateSegmentationTotals(workspace, rows, options);

  return `
    <section class="work-section fullscreen-matrix-section">
      <p class="section-note">Use forced prioritization per row. With ${options.length || "n"} segmentation option(s), each row uses a score scale of 1 to n+1; the same number can only appear once in that row.</p>
      ${options.length < 2
        ? emptyState("Add at least two segmentation options before evaluating.")
        : renderSegmentationEvaluationMatrix(workspace, rows, options, totals)}
    </section>
  `;
}

function renderFullscreenDecision(workspace) {
  return `
    <section class="work-section fullscreen-decision-section">
      ${renderSegmentationDecisionFields(workspace, workspace.step1.segmentationOptions)}
      ${renderOperativeUnitsSection(workspace)}
    </section>
  `;
}

function renderWorkshopTaskFrame(subpageId, content) {
  const subpage = getStep1Subpage(subpageId);
  const index = step1Subpages.findIndex((item) => item.id === subpage.id) + 1;

  return `
    <section class="workshop-task-frame">
      <aside class="workshop-brief-panel">
        <span class="brief-index">${String(index).padStart(2, "0")}</span>
        <h2>${escapeHtml(subpage.title)}</h2>
        <p>${escapeHtml(subpage.focus)}</p>
        <div class="brief-outcome">
          <span>Workshop outcome</span>
          <strong>${escapeHtml(subpage.artifact)}</strong>
        </div>
        <ul class="brief-prompts">
          ${subpage.prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}
        </ul>
      </aside>
      <div class="workshop-capture-panel">
        ${content}
      </div>
    </section>
  `;
}

function renderSegmentationEvaluationMatrix(workspace, rows, options, totals) {
  return `
    <div class="table-wrap wide evaluation-wrap">
      <table class="evaluation-table">
        <thead>
          <tr>
            <th class="section-column">Group</th>
            <th class="criterion-column">Criterion</th>
            <th>Weight</th>
            <th>Relative Position to Competition</th>
            ${options.map((option) => `<th>${escapeHtml(option.name || "Unnamed option")}</th>`).join("")}
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => renderEvaluationRow(workspace, row, options)).join("")}
          <tr class="evaluation-total-row">
            <td colspan="4">Total</td>
            ${options.map((option) => `<td>${totals[option.id] || 0}</td>`).join("")}
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderEvaluationRow(workspace, row, options) {
  return `
    <tr>
      <td class="row-group">${escapeHtml(row.group)}</td>
      <td class="criterion-cell">${escapeHtml(row.label)}</td>
      <td>${escapeHtml(row.weight)}</td>
      <td>${escapeHtml(row.relativePosition)}</td>
      ${options.map((option) => {
        const value = getEvaluationScore(workspace, row.id, option.id);
        return `<td class="score-cell ${scoreClass(value, options.length + 1)}">${evaluationScoreSelect(workspace, row.id, option.id, value, options)}</td>`;
      }).join("")}
      <td>${evaluationCommentInput(workspace, row.id)}</td>
    </tr>
  `;
}

function getStep1EvaluationRows(workspace) {
  const criteriaRows = workspace.step1.keyBuyingCriteria.map((criterion, index) => ({
    id: criterion.id,
    group: "Key Buying Criteria",
    label: criterion.name || `Criterion ${index + 1}`,
    weight: criterion.weight ? `${criterion.weight}%` : "",
    relativePosition: criterion.relativePosition || ""
  }));

  const strategicRows = workspace.step1.strategicFields.map((field) => ({
    id: field.id,
    group: field.variable,
    label: field.direction || "Describe the strategic ambition and targets for this Six Pack variable.",
    weight: "",
    relativePosition: ""
  }));

  return [...criteriaRows, ...strategicRows];
}

function calculateSegmentationTotals(workspace, rows, options) {
  const totals = Object.fromEntries(options.map((option) => [option.id, 0]));

  for (const row of rows) {
    for (const option of options) {
      totals[option.id] += Number(getEvaluationScore(workspace, row.id, option.id) || 0);
    }
  }

  return totals;
}

function getEvaluationScore(workspace, rowId, optionId) {
  return workspace.step1.evaluation?.scores?.[rowId]?.[optionId] || "";
}

function evaluationScoreSelect(workspace, rowId, optionId, value, options) {
  const maxScore = options.length + 1;
  const usedScores = new Set(Object.entries(workspace.step1.evaluation.scores[rowId] || {})
    .filter(([existingOptionId]) => existingOptionId !== optionId)
    .map(([, score]) => String(score)));

  return `
    <select data-evaluation-score="${escapeAttr(`${rowId}|${optionId}`)}">
      <option value="">-</option>
      ${Array.from({ length: maxScore }, (_, index) => String(index + 1)).map((score) => `
        <option value="${score}" ${String(value) === score ? "selected" : ""} ${usedScores.has(score) ? "disabled" : ""}>${score}</option>
      `).join("")}
    </select>
  `;
}

function evaluationCommentInput(workspace, rowId) {
  return `<input data-evaluation-comment="${escapeAttr(rowId)}" value="${escapeAttr(workspace.step1.evaluation.comments[rowId] || "")}">`;
}

function scoreClass(value, maxScore) {
  const score = Number(value || 0);
  if (!score) {
    return "";
  }

  if (score / maxScore <= 0.45) {
    return "score-low";
  }

  if (score / maxScore <= 0.7) {
    return "score-mid";
  }

  return "score-high";
}
