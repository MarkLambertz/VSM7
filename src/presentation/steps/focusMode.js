import { formatSctNumber, getManageabilityLeverSignals, getWeakSegmentationSignals } from "../../domain/vsm.js";
import {
  cellInput,
  cellSelect,
  emptyState,
  escapeAttr,
  escapeHtml,
  removeButton,
  tableHeader,
  taskMultiSelect,
  textarea
} from "../shared/renderHelpers.js";
import { renderMethodVisual } from "../shared/methodVisuals.js";
import { renderStep2Assessment, renderStep2Remedies } from "./step2.js";
import { renderStep3Register } from "./step3.js";
import { renderStep4ContributionMatrix, renderStep4DecisionGuide } from "./step4.js";
import { renderStep5Mapping } from "./step5.js?v=20260618-step5-copy-remove";
import { renderStep6Channels, renderStep6E2ECheck } from "./step6.js?v=20260620-channel-loop-detail-fields";
import { renderImplementationWorkspace } from "./implementation.js?v=20260619-e2e-findings";

const focusStepMetadata = {
  step2: {
    token: "Step II",
    title: "Manageability & Flattening",
    description: "Evaluate horizontal and vertical variety using common wisdom and capture manageability levers.",
    artifact: "Steerability Assessment.",
    visual: "Variety balance",
    visualKind: "variety",
    visualItems: ["Horizontal variety", "Vertical variety", "Flattening risk", "Levers"],
    coachNote: "Use Ashby's law pragmatically: only variety can absorb variety. You do not need exact calculation, but the group must judge whether horizontal and vertical variety are in balance.",
    prompts: ["Is the System-in-Focus still manageable?", "Where does variety overload appear?", "Which lever creates the most robust management model?"]
  },
  step3: {
    token: "Step III",
    title: "Success-Critical Tasks",
    description: "Derive permanent organizational tasks from complexity drivers, overlaps, dependencies, and weak segmentation scores.",
    artifact: "Success-critical task register.",
    visual: "SCT spine",
    visualKind: "sct",
    visualItems: ["Drivers", "Overlaps", "Dependencies", "Weak scores", "SCTs"],
    coachNote: "SCTs are the permanent tasks that must be organized first. Derive them from complexity drivers, overlaps, dependencies, and weak segmentation scores.",
    prompts: ["Which issues require permanent management attention?", "Which SCTs are triggered by weak segmentation scores?", "Which tasks must later drive roles and meetings?"]
  },
  step4: {
    token: "Step IV",
    title: "Central/Decentral",
    description: "Decide where each SCT should be accountable, then decompose its contributions across the actual recursion structure.",
    artifact: "SCT contribution matrix across the recursion structure.",
    visual: "Central / decentral decision path",
    visualKind: "accountability",
    visualItems: ["Afford decentralization?", "Key buying criterion?", "Relevant synergy?", "Central", "Decentral"],
    decisionGuide: true,
    coachNote: "Centralize only when decentralization is unaffordable or when a relevant synergy outweighs the required autonomy. Otherwise, follow subsidiarity and keep accountability as close to the operative work as possible.",
    prompts: ["What makes decentralization unaffordable or non-compliant?", "Does the SCT directly shape a customer buying criterion?", "Which claimed synergy is relevant enough to justify central accountability?"]
  },
  step5: {
    token: "Step V",
    title: "Design Steering System",
    description: "Map the real R0 SCT contributions of the System-in-Focus to the systems of the VSM.",
    artifact: "SCT-to-VSM-system map and steering-system signals.",
    visual: "VSM system map",
    visualKind: "vsm",
    visualItems: ["S1", "S2", "S3", "S3*", "S4", "S5"],
    coachNote: "The mapping is an inspection aid, not a mathematical proof. Look for patterns, omissions, and disproportionate steering responses.",
    prompts: ["Which VSM function performs each real contribution?", "Which contributions need more than one VSM system?", "Is the mapped steering response proportionate to the variety found in Step II?"]
  },
  step6: {
    token: "Step VI",
    title: "Robust Flows & Channels",
    description: "Trace success-critical work across recursion levels, then evaluate whether the communication loops can carry the required variety.",
    artifact: "E2E robustness routes and communication variety checks.",
    visual: "Closed-loop route map",
    visualKind: "channels",
    visualItems: ["Trigger", "Contributions", "Hand-offs", "Result", "Closed loops"],
    coachNote: "The SCT is the what; the route is the how. Follow real hand-offs across recursion levels, capture transition risks, and then inspect whether the supporting communication loops are robust enough.",
    prompts: ["Where does the route cross recursion levels?", "Which hand-offs create robustness risks?", "Can the communication loops carry the required variety?"]
  },
  step7: {
    token: "Step VII",
    title: "Representation",
    description: "Represent roles, entities, reporting, and accountability based on the SCT spine.",
    artifact: "Roles, representation, and one-pager input.",
    visual: "Role constellation",
    visualKind: "roles",
    visualItems: ["Roles", "Entities", "Meetings", "SCTs", "RASIC"],
    coachNote: "Representation is more than an org chart. Use the SCT spine and RASIC logic to define roles, entities, reporting lines, and decision authority.",
    prompts: ["Which roles or entities represent the system?", "How are SCTs embodied in roles and functions?", "What belongs in the target organization one-pager?"]
  },
  implementation: {
    token: "Implementation",
    title: "Target Organization Roadmap",
    description: "Turn the target picture into implementation items, owners, and timing.",
    artifact: "Transformation backlog.",
    visual: "Transformation roadmap",
    visualKind: "roadmap",
    visualItems: ["Now", "Next", "Later", "Owners", "Dependencies"],
    coachNote: "Translate the target picture into implementation epics, owners, milestones, and dependencies. Leadership support and a project team one step ahead are decisive.",
    prompts: ["Which steering challenges must be implemented first?", "Who owns each implementation item?", "Which dependencies or requirements block progress?"]
  }
};

const complexityDriverExamples = {
  environmentOperation: {
    label: "Environment - Operation",
    example: "Example: Many customer segments with different value expectations, product variants, local regulations, or service promises. Possible SCT signal: variant management, customer promise governance, or market interface steering."
  },
  operationManagement: {
    label: "Operation - Management",
    example: "Example: S1 units need different steering rhythms, decision rights, KPIs, or capability levels. Possible SCT signal: decision-rights design, escalation rules, capability building, or performance transparency."
  },
  environmentalOverlaps: {
    label: "Environmental overlaps",
    example: "Example: Several S1s share customers, suppliers, brand, channels, technology, or architecture. Possible SCT signal: shared customer interface, platform standards, or supplier strategy."
  },
  operationalDependencies: {
    label: "Operational dependencies",
    example: "Example: S1s depend on common resources, production assets, platforms, experts, or delivery capacity. Possible SCT signal: resource bargain, dependency resolution cadence, or shared capacity planning."
  }
};

export const focusStepOrder = Object.keys(focusStepMetadata);

export function hasGenericFocusMode(viewId) {
  return Boolean(focusStepMetadata[viewId]);
}

export function getGenericFocusTileCount(workspace, viewId, context) {
  return getGenericFocusTiles(workspace, viewId, context).length;
}

export function renderGenericFocusFullscreen(workspace, viewId, activeTileIndex, context) {
  const tiles = getGenericFocusTiles(workspace, viewId, context);
  const safeIndex = clampTileIndex(activeTileIndex, tiles.length);
  const tile = tiles[safeIndex];

  return `
    <div class="step1-fullscreen-shell" aria-label="${escapeAttr(tile.stepTitle)} fullscreen workshop mode">
      <div class="step1-fullscreen-progress" aria-label="Fullscreen tile progress">
        ${tiles.map((item, index) => `
          <span class="${index < safeIndex ? "is-done" : ""} ${index === safeIndex ? "is-current" : ""}">
            ${escapeHtml(item.shortLabel)}
          </span>
        `).join("")}
      </div>
      <article class="step1-fullscreen-tile ${escapeAttr(tile.variant || "")}">
        ${["is-explanation", "is-embedded-tool"].includes(tile.variant) ? "" : renderFullscreenTileHeader(tile, safeIndex, tiles.length)}
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

export function getGenericFocusStepTitle(viewId) {
  return focusStepMetadata[viewId]?.title || "Focus mode";
}

function getGenericFocusTiles(workspace, viewId, context) {
  const metadata = focusStepMetadata[viewId];
  if (!metadata) {
    return [];
  }

  const briefTile = createTile(
    `${metadata.token} · Explanation`,
    metadata.title,
    metadata.description,
    renderBriefContent(workspace, metadata),
    "is-explanation",
    "Brief",
    metadata.title
  );

  const workTiles = {
    step2: () => [
      createTile("Assessment", "Horizontal and Vertical Variety", "Capture the variety assessment for the System-in-Focus.", renderStep2Assessment(workspace), "is-form", "Assess", metadata.title),
      createTile("Levers", "How to master steering challenges", "Compare steering levers and capture the selected manageability levers.", renderStep2Remedies(workspace), "is-table", "Levers", metadata.title)
    ],
    step3: () => [
      createTile("Hints", "SCT Hints", "Use weak segmentation scores as signals for top-management attention.", renderManagementAttentionHints(workspace), "is-form", "Hints", metadata.title),
      createTile("Drivers", "Complexity Drivers", "Capture the drivers, overlaps, and dependencies that explain required SCTs.", renderStep3Drivers(workspace), "is-form", "Drivers", metadata.title),
      createTile("SCT Register", "Success-Critical Task Register", "Build the canonical register that later drives allocation, meetings, and roles.", renderStep3Register(workspace, context.taskSources, {
        fullscreen: true,
        selectedSctId: context.selectedSctId,
        selectedSctMergeIds: context.selectedSctMergeIds,
        sctPriorityFilter: context.sctPriorityFilter,
        sctSourceFilter: context.sctSourceFilter
      }), "is-matrix", "SCTs", metadata.title)
    ],
    step4: () => [
      createTile("Contributions", "SCT Contribution Matrix", "Decompose every SCT across the actual recursion structure.", renderStep4ContributionMatrix(workspace, {
        fullscreen: true,
        sctPriorityFilter: context.sctPriorityFilter,
        sctSourceFilter: context.sctSourceFilter
      }), "is-matrix", "Matrix", metadata.title)
    ],
  step5: () => [
      createTile("Mapping", "SCT-to-VSM-System Mapping", "Map each real R0/SIF contribution to exactly one VSM system.", renderStep5Mapping(workspace, {
        fullscreen: true,
        activeStep5System: context.activeStep5System,
        sctPriorityFilter: context.sctPriorityFilter,
        sctSourceFilter: context.sctSourceFilter,
        vsmPaneVisible: context.vsmPaneVisible
      }), "is-matrix", "Map", metadata.title)
    ],
    step6: () => [
      createTile("Route", "E2E Process Robustness Check", "Trace how the selected SCT travels from trigger to result across the recursion structure.", renderStep6E2ECheck(workspace, {
        fullscreen: true,
        selectedSctId: context.selectedStep6SctId
      }), "is-embedded-tool", "E2E Route", metadata.title),
      createTile("Channels", "Communication Variety Checks", "Evaluate communication-loop robustness across capacity, clarity, synchronicity, and feedback.", renderStep6Channels(workspace, { fullscreen: true }), "is-embedded-tool", "Channels", metadata.title)
    ],
    step7: () => [
      createTile("Roles", "Roles, Functions, and Organizational Entities", "Represent the target organization through roles, entities, and linked SCTs.", renderStep7Roles(workspace), "is-matrix", "Roles", metadata.title),
      createTile("Notes", "Representation Notes", "Capture org chart notes and role one-pager input.", renderStep7Notes(workspace), "is-form", "Notes", metadata.title)
    ],
    implementation: () => [
      createTile("Backlog", "Transformation Backlog", "Turn the target picture into concrete implementation items.", renderImplementationBacklog(workspace), "is-matrix", "Backlog", metadata.title)
    ]
  };

  return [briefTile, ...(workTiles[viewId]?.() || [])];
}

function createTile(kicker, title, description, content, variant, shortLabel, stepTitle) {
  return { kicker, title, description, content, variant, shortLabel, stepTitle };
}

function clampTileIndex(activeTileIndex, tileCount) {
  return Math.min(Math.max(Number(activeTileIndex) || 0, 0), Math.max(tileCount - 1, 0));
}

function renderBriefContent(_workspace, metadata) {
  return `
    <div class="fullscreen-brief-layout">
      <div class="fullscreen-brief-copy workshop-brief-panel">
        <span class="brief-index">${escapeHtml(metadata.token === "Implementation" ? "Impl" : metadata.token.replace("Step ", ""))}</span>
        <p class="eyebrow">${escapeHtml(metadata.token)}</p>
        <h2>${escapeHtml(metadata.title)}</h2>
        <p>${escapeHtml(metadata.description)}</p>
        ${metadata.decisionGuide ? renderStep4DecisionGuide({ fullscreen: true }) : ""}
        <div class="brief-outcome">
          <span>Workshop outcome</span>
          <strong>${escapeHtml(metadata.artifact)}</strong>
        </div>
        <p class="fullscreen-coach-note">${escapeHtml(metadata.coachNote)}</p>
        <ul class="brief-prompts fullscreen-prompts">
          ${metadata.prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}
        </ul>
      </div>
      ${renderMethodVisual(metadata, "fullscreen")}
    </div>
  `;
}

function renderManagementAttentionHints(workspace) {
  const selectedOption = workspace.step1.segmentationOptions.find((option) => option.id === workspace.step1.selectedSegmentationOptionId);
  const hints = selectedOption ? getWeakSegmentationSignals(workspace, selectedOption.id) : [];
  const leverSignals = getManageabilityLeverSignals(workspace);

  return `
    <section class="work-section attention-hints">
      <div class="section-heading">
        <h2>SCT Input Signals</h2>
      </div>
      <p class="section-note">Use weak segmentation scores and selected Step II manageability levers as source material for success-critical tasks.</p>
      <div class="nested-work-section">
        <h3>From selected segmentation</h3>
        ${selectedOption
          ? `<p class="section-note">Weak scores for ${escapeHtml(selectedOption.name || "the selected segmentation")} indicate fields that may need top-level management attention.</p>`
          : ""}
        ${hints.length > 0
          ? `<div class="hint-list">${hints.map((hint) => `
            <div class="hint-pill">
              <strong>${escapeHtml(hint.group)}</strong>
              <span>${escapeHtml(hint.label)}</span>
              <small>Score ${escapeHtml(hint.score)}</small>
            </div>
          `).join("")}</div>`
          : emptyState(selectedOption ? "No red, orange, or yellow scores are visible for the selected segmentation option yet." : "Select a segmentation option in Step I to see segmentation-based SCT hints.")}
      </div>
      <div class="nested-work-section">
        <h3>From manageability levers</h3>
        ${leverSignals.length > 0
          ? `<div class="hint-list">${leverSignals.map((signal) => `
            <div class="hint-pill">
              <strong>${escapeHtml(signal.title)}</strong>
              <span>${escapeHtml(signal.detail)}</span>
              <small>${escapeHtml(signal.meta)}</small>
            </div>
          `).join("")}</div>`
          : emptyState("Select one or more manageability levers in Step II to use them as SCT source material.")}
      </div>
    </section>
  `;
}

function renderStep3Drivers(workspace) {
  return `
    <section class="work-section">
      <div class="section-heading">
        <h2>Complexity Drivers</h2>
        <button class="ghost-button" data-action="export-step" data-step="step3">Download Outcome</button>
      </div>
      <div class="field-grid two">
        ${driverTextarea("environmentOperation", workspace.step3.complexityDrivers.environmentOperation)}
        ${driverTextarea("operationManagement", workspace.step3.complexityDrivers.operationManagement)}
        ${driverTextarea("environmentalOverlaps", workspace.step3.complexityDrivers.environmentalOverlaps)}
        ${driverTextarea("operationalDependencies", workspace.step3.complexityDrivers.operationalDependencies)}
      </div>
    </section>
  `;
}

function driverTextarea(key, value) {
  const guidance = complexityDriverExamples[key];

  return `
    <label class="field complexity-driver-field">
      <span>${escapeHtml(guidance.label)}</span>
      <textarea
        data-path="${escapeAttr(`step3.complexityDrivers.${key}`)}"
        rows="4"
        placeholder="${escapeAttr(guidance.example)}"
      >${escapeHtml(value)}</textarea>
      <small>${escapeHtml(guidance.example)}</small>
    </label>
  `;
}

function renderStep7Roles(workspace) {
  return `
    <section class="work-section fullscreen-matrix-section">
      ${tableHeader("Roles, Functions, and Organizational Entities", "add-role")}
      <div class="table-wrap wide evaluation-wrap">
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
  `;
}

function renderStep7Notes(workspace) {
  return `
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

function renderImplementationBacklog(workspace) {
  return renderImplementationWorkspace(workspace, { fullscreen: true });
}
