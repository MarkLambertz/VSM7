import { createAllocation } from "../../domain/vsm.js";
import {
  allocationCheckbox,
  allocationInput,
  cellInput,
  cellSelect,
  emptyState,
  escapeAttr,
  escapeHtml,
  removeButton,
  selectField,
  tableHeader,
  taskMultiSelect,
  textarea
} from "../shared/renderHelpers.js";

const focusStepMetadata = {
  step2: {
    token: "Step II",
    title: "Manageability & Flattening",
    description: "Evaluate horizontal and vertical variety using common wisdom and capture the selected remedy.",
    artifact: "Manageability assessment and selected remedy.",
    visual: "Variety balance",
    visualKind: "variety",
    visualItems: ["Horizontal variety", "Vertical variety", "Flattening risk", "Remedy"],
    coachNote: "Use Ashby's law pragmatically: only variety can absorb variety. You do not need exact calculation, but the group must judge whether horizontal and vertical variety are in balance.",
    prompts: ["Is the System-in-Focus still manageable?", "Where does variety overload appear?", "Which remedy creates the most robust management model?"]
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
    description: "Allocate success-critical tasks to recursion levels and accountable entities.",
    artifact: "Central/decentral accountability matrix.",
    visual: "Accountability map",
    visualKind: "accountability",
    visualItems: ["SCT", "R-1", "R0", "R+1", "Entity"],
    coachNote: "Apply subsidiarity: allocate a task upward only when it cannot be done better at the next lower recursion level. Customer value comes before abstract synergy.",
    prompts: ["Where must each SCT be owned?", "Which allocations are partial or shared?", "Who is accountable in the System-in-Focus?"]
  },
  step5: {
    token: "Step V",
    title: "Design S2-S5",
    description: "Design the meeting and committee landscape across VSM systems.",
    artifact: "Meeting and committee landscape.",
    visual: "Meeting architecture",
    visualKind: "meetings",
    visualItems: ["S2", "S3", "S3*", "S4", "S5"],
    coachNote: "Start with the current meeting landscape, but challenge every entity by its value contribution to SCTs and its VSM function.",
    prompts: ["Which meetings are needed for coordination, control, strategy, and policy?", "Which meetings should be kept or changed?", "Which SCTs must each meeting serve?"]
  },
  step6: {
    token: "Step VI",
    title: "Communication Channels",
    description: "Evaluate the robustness of communication loops through variety checks.",
    artifact: "Communication variety checks.",
    visual: "Channel robustness radar",
    visualKind: "channels",
    visualItems: ["Capacity", "Clarity", "Synchronicity", "Security"],
    coachNote: "Think in closed loops, not linear messages. Diagnose only the channels in doubt, then test capacity, comprehensibility, synchronicity, and security.",
    prompts: ["Which loops are too weak for the required variety?", "Where do capacity or intelligibility gaps appear?", "Which communication channels must be strengthened?"]
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
      createTile("Remedies", "Manageability Remedies", "Compare remedy options and capture the selected conclusion.", renderStep2Remedies(workspace), "is-table", "Remedy", metadata.title)
    ],
    step3: () => [
      createTile("Hints", "SCT Hints", "Use weak segmentation scores as signals for top-management attention.", renderManagementAttentionHints(workspace), "is-form", "Hints", metadata.title),
      createTile("Drivers", "Complexity Drivers", "Capture the drivers, overlaps, and dependencies that explain required SCTs.", renderStep3Drivers(workspace), "is-form", "Drivers", metadata.title),
      createTile("SCT Register", "Success-Critical Task Register", "Build the canonical register that later drives allocation, meetings, and roles.", renderStep3Register(workspace, context.taskSources, context.vsmSystems), "is-matrix", "SCTs", metadata.title)
    ],
    step4: () => [
      createTile("Accountability", "Central/Decentral Accountability", "Allocate every SCT to the right recursion level and accountable entity.", renderStep4Accountability(workspace), "is-matrix", "Matrix", metadata.title)
    ],
    step5: () => [
      createTile("Meetings", "Board, Committee, and Meeting Landscape", "Capture the meeting pattern across VSM systems and link it to SCTs.", renderStep5Meetings(workspace), "is-matrix", "Meetings", metadata.title)
    ],
    step6: () => [
      createTile("Channels", "Variety Checks", "Evaluate communication-loop robustness across capacity, intelligibility, synchronicity, and security.", renderStep6Channels(workspace), "is-matrix", "Checks", metadata.title)
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
        <div class="brief-outcome">
          <span>Workshop outcome</span>
          <strong>${escapeHtml(metadata.artifact)}</strong>
        </div>
        <p class="fullscreen-coach-note">${escapeHtml(metadata.coachNote)}</p>
        <ul class="brief-prompts fullscreen-prompts">
          ${metadata.prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}
        </ul>
      </div>
      ${renderMethodVisual(metadata)}
    </div>
  `;
}

function renderMethodVisual(visual) {
  const visualItems = (visual.visualItems || []).slice(0, 6);

  return `
    <aside class="step1-visual-slot method-visual fullscreen-visual-slot fullscreen-visual-card method-visual--${escapeAttr(visual.visualKind || "generic")}" aria-label="${escapeAttr(visual.visual)} visual placeholder">
      <div class="method-visual-map">
        ${visualItems.map((item, index) => `
          <span class="method-node ${getVisualTone(index)}">${escapeHtml(item)}</span>
        `).join("")}
      </div>
      <div class="method-visual-caption">
        <span>Method visual placeholder</span>
        <strong>${escapeHtml(visual.visual)}</strong>
        <small>${escapeHtml(getVisualCaption(visual.visualKind))}</small>
      </div>
    </aside>
  `;
}

function getVisualTone(index) {
  return ["is-blue", "is-green", "is-amber", "is-red", "is-teal", "is-neutral"][index % 6];
}

function getVisualCaption(visualKind) {
  const captions = {
    variety: "Horizontal and vertical variety compared for overload risk",
    sct: "Complexity drivers feeding the success-critical task spine",
    accountability: "SCTs connected to recursion levels and accountable entities",
    meetings: "S2-S5 meeting layers organized by VSM function",
    channels: "Closed-loop robustness across the channel criteria",
    roles: "Roles, entities, meetings, and SCTs connected",
    roadmap: "Implementation epics staged across now, next, and later"
  };

  return captions[visualKind] || "Illustration · icon · photo · workshop canvas";
}

function renderStep2Assessment(workspace) {
  return `
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
  `;
}

function renderStep2Remedies(workspace) {
  return `
    <section class="work-section">
      <div class="section-heading">
        <h2>Manageability Remedies</h2>
      </div>
      <div class="table-wrap wide">
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

function renderManagementAttentionHints(workspace) {
  const selectedOption = workspace.step1.segmentationOptions.find((option) => option.id === workspace.step1.selectedSegmentationOptionId);
  if (!selectedOption) {
    return `<section class="work-section attention-hints">${emptyState("Select a segmentation option in Step I to see SCT hints.")}</section>`;
  }

  const hints = getWeakScoreHints(workspace, selectedOption.id);

  return `
    <section class="work-section attention-hints">
      <div class="section-heading">
        <h2>SCT Hints from Selected Segmentation</h2>
      </div>
      <p class="section-note">Weak scores for ${escapeHtml(selectedOption.name || "the selected segmentation")} indicate fields that may need top-level management attention.</p>
      ${hints.length > 0
        ? `<div class="hint-list">${hints.map((hint) => `
          <div class="hint-pill">
            <strong>${escapeHtml(hint.group)}</strong>
            <span>${escapeHtml(hint.label)}</span>
            <small>Score ${escapeHtml(hint.score)}</small>
          </div>
        `).join("")}</div>`
        : emptyState("No weak scores are visible for the selected segmentation option yet.")}
    </section>
  `;
}

function getWeakScoreHints(workspace, selectedOptionId) {
  const maxScore = workspace.step1.segmentationOptions.length + 1;
  const threshold = Math.max(1, Math.floor(maxScore / 2));
  const rows = [
    ...workspace.step1.keyBuyingCriteria.map((criterion, index) => ({
      id: criterion.id,
      group: "Key Buying Criteria",
      label: criterion.name || `Criterion ${index + 1}`
    })),
    ...workspace.step1.strategicFields.map((field) => ({
      id: field.id,
      group: field.variable,
      label: field.direction || "Strategic ambition not described yet"
    }))
  ];

  return rows
    .map((row) => ({
      ...row,
      score: Number(workspace.step1.evaluation?.scores?.[row.id]?.[selectedOptionId] || 0)
    }))
    .filter((row) => row.score > 0 && row.score <= threshold)
    .sort((left, right) => left.score - right.score);
}

function renderStep3Drivers(workspace) {
  return `
    <section class="work-section">
      <div class="section-heading">
        <h2>Complexity Drivers</h2>
        <button class="ghost-button" data-action="export-step" data-step="step3">Download Outcome</button>
      </div>
      <div class="field-grid two">
        ${textarea("Environment - Operation", "step3.complexityDrivers.environmentOperation", workspace.step3.complexityDrivers.environmentOperation)}
        ${textarea("Operation - Management", "step3.complexityDrivers.operationManagement", workspace.step3.complexityDrivers.operationManagement)}
        ${textarea("Environmental overlaps", "step3.complexityDrivers.environmentalOverlaps", workspace.step3.complexityDrivers.environmentalOverlaps)}
        ${textarea("Operational dependencies", "step3.complexityDrivers.operationalDependencies", workspace.step3.complexityDrivers.operationalDependencies)}
      </div>
    </section>
  `;
}

function renderStep3Register(workspace, taskSources, vsmSystems) {
  return `
    <section class="work-section fullscreen-matrix-section">
      ${tableHeader("Success-Critical Task Register", "add-sct")}
      <div class="table-wrap wide evaluation-wrap">
        <table>
          <thead><tr><th>Priority</th><th>System</th><th>Task</th><th>Explanation</th><th>Source</th><th>KPI / Metric</th><th>Required artifact</th><th></th></tr></thead>
          <tbody>${workspace.step3.successCriticalTasks.map((task) => `
            <tr>
              <td>${cellSelect("step3.successCriticalTasks", task.id, "priority", task.priority, ["A", "B", "C"])}</td>
              <td>${cellSelect("step3.successCriticalTasks", task.id, "system", task.system, vsmSystems)}</td>
              <td>${cellInput("step3.successCriticalTasks", task.id, "title", task.title)}</td>
              <td>${cellInput("step3.successCriticalTasks", task.id, "explanation", task.explanation)}</td>
              <td>${cellSelect("step3.successCriticalTasks", task.id, "source", task.source, taskSources)}</td>
              <td>${cellInput("step3.successCriticalTasks", task.id, "kpi", task.kpi)}</td>
              <td>${cellInput("step3.successCriticalTasks", task.id, "requiredArtifacts", task.requiredArtifacts)}</td>
              <td>${removeButton("step3.successCriticalTasks", task.id)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderStep4Accountability(workspace) {
  return `
    <section class="work-section fullscreen-matrix-section">
      <div class="section-heading">
        <h2>Central/Decentral Accountability</h2>
        <button class="ghost-button" data-action="export-step" data-step="step4">Download Outcome</button>
      </div>
      <div class="table-wrap wide evaluation-wrap">
        <table>
          <thead><tr><th>Priority</th><th>System</th><th>SCT</th><th>R-1</th><th>R0</th><th>R+1</th><th>Accountable entity</th><th>Rationale</th><th>Partial allocation notes</th></tr></thead>
          <tbody>${workspace.step3.successCriticalTasks.map((task) => {
            const allocation = workspace.step4.allocations[task.id] || createAllocation(task.id);
            return `
              <tr>
                <td>${escapeHtml(task.priority)}</td>
                <td>${escapeHtml(task.system)}</td>
                <td><strong>${escapeHtml(task.title || "Untitled SCT")}</strong><small>${escapeHtml(task.explanation)}</small></td>
                <td>${allocationCheckbox(task.id, "R-1", allocation.levels["R-1"])}</td>
                <td>${allocationCheckbox(task.id, "R0", allocation.levels.R0)}</td>
                <td>${allocationCheckbox(task.id, "R+1", allocation.levels["R+1"])}</td>
                <td>${allocationInput(task.id, "accountableEntity", allocation.accountableEntity)}</td>
                <td>${allocationInput(task.id, "rationale", allocation.rationale)}</td>
                <td>${allocationInput(task.id, "partialAllocationNotes", allocation.partialAllocationNotes)}</td>
              </tr>
            `;
          }).join("")}</tbody>
        </table>
      </div>
      ${workspace.step3.successCriticalTasks.length === 0 ? emptyState("Create success-critical tasks in Step III first.") : ""}
    </section>
  `;
}

function renderStep5Meetings(workspace) {
  return `
    <section class="work-section fullscreen-matrix-section">
      ${tableHeader("Board, Committee, and Meeting Landscape", "add-meeting")}
      <div class="table-wrap wide evaluation-wrap">
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

function renderStep6Channels(workspace) {
  return `
    <section class="work-section fullscreen-matrix-section">
      <div class="section-heading">
        <h2>Variety Checks</h2>
        <button class="ghost-button" data-action="export-step" data-step="step6">Download Outcome</button>
      </div>
      <div class="table-wrap wide evaluation-wrap">
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
  return `
    <section class="work-section fullscreen-matrix-section">
      ${tableHeader("Transformation Backlog", "add-implementation")}
      <div class="table-wrap wide evaluation-wrap">
        <table>
          <thead><tr><th>Steering challenge</th><th>Dependency / requirement</th><th>Responsible</th><th>Due date</th><th>Status</th><th></th></tr></thead>
          <tbody>${workspace.implementation.items.map((item) => `
            <tr>
              <td>${cellInput("implementation.items", item.id, "challenge", item.challenge)}</td>
              <td>${cellInput("implementation.items", item.id, "requirement", item.requirement)}</td>
              <td>${cellInput("implementation.items", item.id, "responsible", item.responsible)}</td>
              <td>${cellInput("implementation.items", item.id, "dueDate", item.dueDate, "date")}</td>
              <td>${cellSelect("implementation.items", item.id, "status", item.status, ["Open", "In progress", "Decided", "Done"])}</td>
              <td>${removeButton("implementation.items", item.id)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}
