import {
  cellInput,
  cellSelect,
  emptyState,
  escapeAttr,
  escapeHtml,
  field,
  removeButton,
  stepHeader,
  tableHeader,
  textarea
} from "../shared/renderHelpers.js";

export const step1Subpages = [
  { id: "sif", label: "SIF & Recursion" },
  { id: "segmentation", label: "Segmentation Options" },
  { id: "criteria", label: "Key Buying Criteria" },
  { id: "six-pack", label: "Six Pack Fields" },
  { id: "evaluation", label: "Evaluation" }
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
  return `
    ${stepHeader("Step I", "Operative Units", "Define the System-in-Focus, recursion context, segmentation options, key buying criteria, Six Pack fields, and final segmentation evaluation.")}
    ${renderStep1Subnav(activeStep1Subpage)}
    ${renderStep1Subpage(workspace, activeStep1Subpage)}
  `;
}

function renderStep1Subnav(activeStep1Subpage) {
  return `
    <section class="substep-bar" aria-label="Step I subpages">
      ${step1Subpages.map((subpage) => `
        <button
          class="substep-button ${activeStep1Subpage === subpage.id ? "is-active" : ""}"
          data-action="step1-subpage"
          data-subpage="${escapeAttr(subpage.id)}"
        >
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
  return `
    <section class="work-section">
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
    <section class="work-section">
      <div class="section-heading">
        <div>
          <h2>Recursion Levels</h2>
          <p class="section-note inline">Levels are fixed. You can change only name and description.</p>
        </div>
        <div class="header-actions">
          <button class="ghost-button" data-action="add-recursion-above">One level above (${escapeHtml(nextRecursionLevel(workspace, "above"))})</button>
          <button class="ghost-button" data-action="add-recursion-below">One level below (${escapeHtml(nextRecursionLevel(workspace, "below"))})</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Level</th><th>Name</th><th>Description</th><th></th></tr></thead>
          <tbody>${sortRecursionLevels(workspace.step1.recursionLevels).map((item) => `
            <tr>
              <td><span class="recursion-level-token">${escapeHtml(item.level)}</span></td>
              <td>${cellInput("step1.recursionLevels", item.id, "name", item.name)}</td>
              <td>${cellInput("step1.recursionLevels", item.id, "description", item.description)}</td>
              <td>${isBaseRecursionLevel(item.level) ? "" : removeButton("step1.recursionLevels", item.id)}</td>
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

function renderStep1SegmentationOptions(workspace) {
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
