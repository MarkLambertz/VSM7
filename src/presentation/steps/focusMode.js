import {
  formatSctNumber,
  getManageabilityLeverSignals,
  getStep7EditorContext,
  getStep7EditorModel,
  getStep7SctContributions,
  getWeakSegmentationSignals
} from "../../domain/vsm.js?v=20260729-steering-master-nav-audit";
import {
  emptyState,
  escapeAttr,
  escapeHtml,
  stepExportButton,
  textarea
} from "../shared/renderHelpers.js?v=20260729-steering-master-nav-audit";
import { renderMethodVisual } from "../shared/methodVisuals.js?v=20260729-steering-master-nav-audit";
import { renderStep2Assessment, renderStep2Remedies } from "./step2.js?v=20260729-steering-master-nav-audit";
import { renderStep3Register } from "./step3.js?v=20260729-steering-master-nav-audit";
import { renderStep4ContributionMatrix, renderStep4DecisionGuide } from "./step4.js?v=20260729-steering-master-nav-audit";
import { renderStep5Mapping } from "./step5.js?v=20260729-steering-master-nav-audit";
import { renderStep6Channels, renderStep6E2ECheck } from "./step6.js?v=20260729-steering-master-nav-audit";
import { renderImplementationWorkspace } from "./implementation.js?v=20260729-steering-master-nav-audit";

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
    description: "Represent the target organization through vessels, RASIC accountability, meeting links, and reusable SCT evidence.",
    artifact: "Representation spine, reuse graph, and one-pager input.",
    visual: "Role constellation",
    visualKind: "roles",
    visualItems: ["Roles", "Entities", "Meetings", "SCTs", "RASIC"],
    coachNote: "Representation is more than an org chart. Use the SCT contribution spine, RASIC logic, meetings, and reusable metrics/artifacts/tools to define what the organization must embody.",
    prompts: ["Which vessels carry the R0/SIF accountability?", "Which SCT contributions still lack clear accountability?", "Where can meetings, KPIs, artifacts, and tools be reused instead of duplicated?"]
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
  const actions = renderFocusStepExportActions(tile.viewId);
  return `
    <div class="fullscreen-tile-header">
      <div>
        <p class="eyebrow">${escapeHtml(tile.kicker)}</p>
        <h1>${escapeHtml(tile.title)}</h1>
        <p>${escapeHtml(tile.description)}</p>
      </div>
      <div class="fullscreen-tile-header-side">
        ${actions ? `<div class="fullscreen-tile-actions">${actions}</div>` : ""}
        <span class="fullscreen-tile-counter">${safeIndex + 1} / ${tileCount}</span>
      </div>
    </div>
  `;
}

function renderFocusStepExportActions() {
  // Export is tile-level only (PO decision 2026-07-22): no step-level ⬇ in Focus Mode.
  // Tile-level export affordances inside the focus surfaces remain the export path.
  return "";
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
      createTile("Spine", "Step VII Representation Spine", "Read the current organizational vessels and RASIC coverage from the Step VII editor model.", renderStep7RepresentationSpine(workspace), "is-matrix", "Spine", metadata.title),
      createTile("Reuse", "Meetings, KPIs, Artifacts, and Tools", "Check how reusable workshop evidence is connected to roles, functions, meetings, and SCTs.", renderStep7ReuseGraph(workspace), "is-matrix", "Reuse", metadata.title),
      createTile("Notes", "Representation Notes", "Capture org chart notes and role one-pager input.", renderStep7Notes(workspace), "is-form", "Notes", metadata.title)
    ],
    implementation: () => [
      createTile("Backlog", "Transformation Backlog", "Turn the target picture into concrete implementation items.", renderImplementationBacklog(workspace), "is-matrix", "Backlog", metadata.title)
    ]
  };

  return [briefTile, ...(workTiles[viewId]?.() || [])].map((tile) => ({ ...tile, viewId }));
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
        <h3>From selected segmentation of Operative Units</h3>
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

function renderStep7RepresentationSpine(workspace) {
  const summary = getStep7FocusSummary(workspace);
  const attentionCount = summary.contributionsWithoutAccountable.length + summary.contributionsWithDoubleAccountable.length;

  return `
    <section class="work-section fullscreen-matrix-section step7-focus-section">
      <div class="step7-focus-dashboard">
        <div class="step7-focus-stat-grid">
          ${step7FocusStat("SCT contributions", summary.contributions.length, `${summary.r0Contributions.length} R0 / SIF`, "blue")}
          ${step7FocusStat("Organizational vessels", summary.vessels.length, `${summary.roles.length} roles · ${summary.functions.length} functions · ${summary.meetings.length} meetings`, "teal")}
          ${step7FocusStat("RASIC assignments", summary.assignments.length, `${summary.accountableContributionIds.size}/${summary.contributions.length} with A`, "amber")}
          ${step7FocusStat("Needs attention", attentionCount, `${summary.contributionsWithoutAccountable.length} without A · ${summary.contributionsWithDoubleAccountable.length} double A`, attentionCount ? "red" : "teal")}
        </div>
        <div class="step7-focus-columns">
          <div class="step7-focus-panel">
            <h2>Organizational Vessels</h2>
            ${renderStep7VesselGroups(summary)}
          </div>
          <div class="step7-focus-panel">
            <h2>Accountability Coverage</h2>
            ${renderStep7AccountabilityCoverage(summary)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderStep7ReuseGraph(workspace) {
  const summary = getStep7FocusSummary(workspace);
  const artifactToolCount = summary.artifacts.length + summary.tools.length;

  return `
    <section class="work-section fullscreen-matrix-section step7-focus-section">
      <div class="step7-focus-dashboard">
        <div class="step7-focus-stat-grid">
          ${step7FocusStat("Meetings", summary.meetings.length, `${summary.acceptedMeetings.length} accepted`, "blue")}
          ${step7FocusStat("Participation links", summary.membershipLinks, "role/function to meeting", "teal")}
          ${step7FocusStat("KPI / metric reuse", summary.kpis.length, "shared wording available", "amber")}
          ${step7FocusStat("Artifacts & tools", artifactToolCount, `${summary.artifacts.length} artifacts · ${summary.tools.length} tools`, "teal")}
        </div>
        <div class="step7-focus-columns">
          <div class="step7-focus-panel">
            <h2>Meetings and Participants</h2>
            ${renderStep7MeetingLinks(summary)}
          </div>
          <div class="step7-focus-panel">
            <h2>Reusable Workshop Evidence</h2>
            ${renderStep7ReuseChips("KPIs & metrics", summary.kpis)}
            ${renderStep7ReuseChips("Artifacts & result types", summary.artifacts)}
            ${renderStep7ReuseChips("Tools & methods", summary.tools)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function getStep7FocusSummary(workspace) {
  const contributions = getStep7SctContributions(workspace);
  const context = getStep7EditorContext(workspace);
  const unitById = new Map((Array.isArray(context.units) ? context.units : []).map((unit) => [String(unit.id), unit]));
  const model = getStep7EditorModel(workspace);
  const vessels = Array.isArray(model.vessels)
    ? model.vessels
      .filter((vessel) => String(vessel?.name || "").trim())
      .map((vessel) => ({
        ...vessel,
        displayScope: formatStep7FocusScope(vessel.scope, unitById)
      }))
    : [];
  const vesselsById = new Map(vessels.map((vessel) => [String(vessel.id), vessel]));
  const contributionsById = new Map(contributions.map((contribution) => [String(contribution.id), contribution]));
  const assignments = Object.entries(model.rasic || {})
    .map(([key, value]) => {
      const parsed = parseStep7FocusRasicKey(key);
      if (!parsed || !contributionsById.has(parsed.contributionId) || !vesselsById.has(parsed.vesselId)) {
        return null;
      }

      return {
        contributionId: parsed.contributionId,
        vesselId: parsed.vesselId,
        value: String(value || "").trim().toUpperCase()
      };
    })
    .filter(Boolean);
  const accountableCounts = new Map();
  const accountableContributionIds = new Set();
  const assignedContributionIds = new Set();
  const assignmentCountByVesselId = new Map();

  for (const assignment of assignments) {
    assignedContributionIds.add(assignment.contributionId);
    assignmentCountByVesselId.set(
      assignment.vesselId,
      (assignmentCountByVesselId.get(assignment.vesselId) || 0) + 1
    );
    if (assignment.value === "A") {
      accountableContributionIds.add(assignment.contributionId);
      accountableCounts.set(assignment.contributionId, (accountableCounts.get(assignment.contributionId) || 0) + 1);
    }
  }

  const roles = vessels.filter((vessel) => vessel.type === "role");
  const functions = vessels.filter((vessel) => vessel.type === "function");
  const meetings = vessels.filter((vessel) => vessel.type === "meeting");
  const membership = isObjectRecord(model.membership) ? model.membership : {};
  const membershipLinks = Object.values(membership).reduce((total, meetingIds) => (
    total + (Array.isArray(meetingIds) ? meetingIds.filter(Boolean).length : 0)
  ), 0);
  const connectedVessels = vessels
    .map((vessel) => ({
      ...vessel,
      assignmentCount: assignmentCountByVesselId.get(String(vessel.id)) || 0,
      meetingCount: Array.isArray(membership[vessel.id]) ? membership[vessel.id].length : 0
    }))
    .sort((left, right) => (
      right.assignmentCount - left.assignmentCount
      || right.meetingCount - left.meetingCount
      || String(left.name).localeCompare(String(right.name))
    ));

  return {
    contributions,
    r0Contributions: contributions.filter((contribution) => contribution.recursionLevel === "R0"),
    vessels,
    roles,
    functions,
    meetings,
    acceptedMeetings: meetings.filter((meeting) => meeting.state === "accepted"),
    assignments,
    assignedContributionIds,
    accountableContributionIds,
    contributionsWithoutAccountable: contributions.filter((contribution) => !(accountableCounts.get(contribution.id) > 0)),
    contributionsWithDoubleAccountable: contributions.filter((contribution) => (accountableCounts.get(contribution.id) || 0) > 1),
    membership,
    membershipLinks,
    connectedVessels,
    kpis: collectStep7AspectTexts([model.aspects, model.vesselAspects], "kpis"),
    artifacts: collectStep7AspectTexts([model.aspects, model.vesselAspects], "artifacts"),
    tools: collectStep7AspectTexts([model.aspects, model.vesselAspects], "tools")
  };
}

function parseStep7FocusRasicKey(key) {
  const parts = String(key || "").split("|");
  if (parts.length < 3) {
    return null;
  }

  const vesselId = parts.pop();
  const contributionId = parts.join("|");
  return contributionId && vesselId ? { contributionId, vesselId } : null;
}

function collectStep7AspectTexts(collections, kind) {
  const seen = new Set();
  const values = [];
  for (const collection of collections) {
    if (!isObjectRecord(collection)) {
      continue;
    }

    for (const bundle of Object.values(collection)) {
      const items = Array.isArray(bundle?.[kind]) ? bundle[kind] : [];
      for (const item of items) {
        const text = String(item?.text ?? item ?? "").trim();
        const key = text.toLowerCase();
        if (text && !seen.has(key)) {
          seen.add(key);
          values.push(text);
        }
      }
    }
  }

  return values.sort((left, right) => left.localeCompare(right));
}

function isObjectRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatStep7FocusScope(scope, unitById) {
  const value = String(scope || "").trim();
  if (!value) {
    return "";
  }

  const unit = unitById.get(value);
  return unit ? `${unit.name} · ${unit.level}` : value;
}

function step7FocusStat(label, value, detail, tone = "blue") {
  return `
    <div class="step7-focus-stat is-${escapeAttr(tone)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function renderStep7VesselGroups(summary) {
  const groups = [
    ["Roles", summary.roles],
    ["Functions", summary.functions],
    ["Meetings", summary.meetings]
  ];

  if (!summary.vessels.length) {
    return emptyState("No Step VII vessels yet.");
  }

  return groups.map(([label, vessels]) => `
    <div class="step7-focus-type-group">
      <h3>${escapeHtml(label)} <span>${escapeHtml(String(vessels.length))}</span></h3>
      ${vessels.length
        ? `<ul class="step7-focus-list">${vessels.slice(0, 8).map(renderStep7VesselItem).join("")}</ul>`
        : `<p class="step7-focus-muted">None yet.</p>`}
      ${vessels.length > 8 ? `<p class="step7-focus-muted">+ ${escapeHtml(String(vessels.length - 8))} more</p>` : ""}
    </div>
  `).join("");
}

function renderStep7VesselItem(vessel) {
  const detail = [
    vessel.state === "accepted" ? "accepted" : "candidate",
    vessel.sys ? vessel.sys : "",
    vessel.displayScope ? vessel.displayScope : ""
  ].filter(Boolean).join(" · ");

  return `
    <li>
      <strong>${escapeHtml(vessel.name || "Unnamed vessel")}</strong>
      <span>${escapeHtml(detail || "workshop vessel")}</span>
    </li>
  `;
}

function renderStep7AccountabilityCoverage(summary) {
  if (!summary.contributions.length) {
    return emptyState("No SCT contributions are available for Step VII yet.");
  }

  const riskRows = [
    ...summary.contributionsWithoutAccountable.map((contribution) => ({ contribution, label: "No accountable vessel" })),
    ...summary.contributionsWithDoubleAccountable.map((contribution) => ({ contribution, label: "Double accountability" }))
  ];

  return `
    <div class="step7-focus-coverage">
      ${riskRows.length
        ? `<ul class="step7-focus-risk-list">${riskRows.slice(0, 10).map(renderStep7RiskItem).join("")}</ul>`
        : `<div class="step7-focus-good">Every visible contribution has one accountable vessel.</div>`}
      ${riskRows.length > 10 ? `<p class="step7-focus-muted">+ ${escapeHtml(String(riskRows.length - 10))} more accountability signals</p>` : ""}
      <div class="step7-focus-subpanel">
        <h3>Most connected vessels</h3>
        ${summary.connectedVessels.some((vessel) => vessel.assignmentCount || vessel.meetingCount)
          ? `<ul class="step7-focus-list compact">${summary.connectedVessels.slice(0, 8).map(renderStep7ConnectedVessel).join("")}</ul>`
          : `<p class="step7-focus-muted">No RASIC or meeting links yet.</p>`}
      </div>
    </div>
  `;
}

function renderStep7RiskItem({ contribution, label }) {
  return `
    <li>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(`${contribution.sctNumber} · ${contribution.organizationName}`)}</strong>
      <small>${escapeHtml(truncateText(contribution.contribution || contribution.title, 120))}</small>
    </li>
  `;
}

function renderStep7ConnectedVessel(vessel) {
  return `
    <li>
      <strong>${escapeHtml(vessel.name || "Unnamed vessel")}</strong>
      <span>${escapeHtml(`${vessel.assignmentCount} RASIC · ${vessel.meetingCount} meetings`)}</span>
    </li>
  `;
}

function renderStep7MeetingLinks(summary) {
  if (!summary.meetings.length) {
    return emptyState("No meetings have been accepted yet.");
  }

  return `
    <ul class="step7-focus-list">
      ${summary.meetings.slice(0, 10).map((meeting) => {
        const participantCount = Object.values(summary.membership).filter((meetingIds) => (
          Array.isArray(meetingIds) && meetingIds.includes(meeting.id)
        )).length;
        return `
          <li>
            <strong>${escapeHtml(meeting.name || "Unnamed meeting")}</strong>
            <span>${escapeHtml(`${participantCount} participants · ${meeting.state === "accepted" ? "accepted" : "candidate"}`)}</span>
          </li>
        `;
      }).join("")}
    </ul>
    ${summary.meetings.length > 10 ? `<p class="step7-focus-muted">+ ${escapeHtml(String(summary.meetings.length - 10))} more meetings</p>` : ""}
  `;
}

function renderStep7ReuseChips(label, values) {
  return `
    <div class="step7-focus-reuse-block">
      <h3>${escapeHtml(label)}</h3>
      ${values.length
        ? `<div class="step7-focus-chip-row">${values.slice(0, 18).map((value) => `<span class="step7-focus-chip">${escapeHtml(value)}</span>`).join("")}</div>`
        : `<p class="step7-focus-muted">No reusable entries yet.</p>`}
      ${values.length > 18 ? `<p class="step7-focus-muted">+ ${escapeHtml(String(values.length - 18))} more</p>` : ""}
    </div>
  `;
}

function truncateText(value, maxLength) {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1)).trim()}...` : text;
}

function renderStep7Notes(workspace) {
  return `
    <section class="work-section">
      <div class="section-heading">
        <h2>Representation Notes</h2>
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
