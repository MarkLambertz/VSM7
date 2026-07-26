import {
  formatSctNumber,
  getStep6ChannelVarietyContext,
  getStep6RouteContext
} from "../../domain/vsm.js?v=20260725-step3-aspects-org-units";
import {
  emptyState,
  escapeAttr,
  escapeHtml,
  fullscreenTile,
  stepHeader,
  tileExportButton,
  tileFullscreenButton
} from "../shared/renderHelpers.js?v=20260725-step3-aspects-org-units";

export const step6Subpages = [
  { id: "e2e", label: "E2E Robustness Check" },
  { id: "channels", label: "Communication Variety Checks" }
];

export function getActiveStep6SctId(workspace, selectedSctId = "") {
  const tasks = Array.isArray(workspace?.step3?.successCriticalTasks)
    ? workspace.step3.successCriticalTasks
    : [];
  return tasks.some((task) => task.id === selectedSctId) ? selectedSctId : (tasks[0]?.id || "");
}

export function renderStep6(workspace, options = {}) {
  const activeSubpage = step6Subpages.some((item) => item.id === options.activeSubpage)
    ? options.activeSubpage
    : "e2e";
  const selectedSctId = getActiveStep6SctId(workspace, options.selectedSctId);

  return `
    ${stepHeader(
      "Step VI",
      "Robust Flows & Channels",
      "Test how success-critical work travels end to end, then assess the communication loops that keep the organization viable."
    )}
    ${renderStep6Subnav(activeSubpage)}
    ${activeSubpage === "channels"
      ? renderStep6Channels(workspace)
      : renderStep6E2ECheck(workspace, { selectedSctId })}
  `;
}

export function renderStep6Subnav(activeSubpage) {
  return `
    <section class="substep-bar step6-substep-bar" aria-label="Step VI substeps">
      ${step6Subpages.map((subpage, index) => `
        <button
          class="substep-button ${activeSubpage === subpage.id ? "is-active" : ""}"
          data-action="step6-subpage"
          data-subpage="${escapeAttr(subpage.id)}"
        >
          <span>${String(index + 1).padStart(2, "0")}</span>
          ${escapeHtml(subpage.label)}
        </button>
      `).join("")}
    </section>
  `;
}

export function renderStep6E2ECheck(workspace, options = {}) {
  const tasks = Array.isArray(workspace?.step3?.successCriticalTasks)
    ? workspace.step3.successCriticalTasks
    : [];
  const selectedSctId = getActiveStep6SctId(workspace, options.selectedSctId);
  const selectedTask = tasks.find((task) => task.id === selectedSctId);
  const context = selectedTask ? getStep6RouteContext(workspace, selectedTask.id) : null;
  const availableRelatedTasks = tasks.filter((task) => task.id !== selectedSctId);

  if (!selectedTask || !context) {
    return `
      <section class="work-section e2e-route-section">
        <div class="section-heading"><h2>E2E Process Robustness Check</h2></div>
        ${emptyState("Capture at least one SCT in Step III before authoring an E2E route.")}
      </section>
    `;
  }

  return `
    <section class="work-section e2e-route-section ${options.fullscreen ? "is-fullscreen" : ""}">
      <div class="section-heading e2e-route-heading">
        <div>
          <h2>E2E Process Robustness Check</h2>
          <p class="section-note">The SCT defines what must be done. Build the route to inspect how work and information cross recursion levels from trigger to result.</p>
        </div>
        <div class="e2e-route-controls">
          ${tileExportButton("step6", "step6-e2e", "Export E2E route")}
          ${options.fullscreen ? "" : tileFullscreenButton("step6-e2e", "Open E2E route fullscreen")}
          <label class="field e2e-sct-picker">
            <span>Primary Success-Critical Task</span>
            <select data-step6-sct-select>
              ${tasks.map((task) => `
                <option value="${escapeAttr(task.id)}" ${task.id === selectedTask.id ? "selected" : ""}>
                  ${escapeHtml(`${formatSctNumber(task.number)} · ${task.title || "Untitled SCT"}`)}
                </option>
              `).join("")}
            </select>
          </label>
          <details class="e2e-related-sct-picker" data-e2e-related-picker>
            <summary class="ghost-button">
              Related SCTs
              <span class="e2e-related-sct-count" data-e2e-related-count>${context.relatedScts.length}</span>
            </summary>
            <div class="e2e-related-sct-options" aria-label="Related SCTs included in this route">
              <p>Add other SCTs only when the route genuinely crosses task boundaries.</p>
              ${availableRelatedTasks.length
                ? availableRelatedTasks.map((task) => `
                    <label class="e2e-related-sct-option">
                      <input
                        type="checkbox"
                        value="${escapeAttr(task.id)}"
                        data-step6-related-sct
                        data-primary-sct-id="${escapeAttr(selectedTask.id)}"
                        ${context.relatedSctIds.includes(task.id) ? "checked" : ""}
                      >
                      <span>
                        <strong>${escapeHtml(formatSctNumber(task.number))}</strong>
                        ${escapeHtml(task.title || "Untitled SCT")}
                      </span>
                    </label>
                  `).join("")
                : `<span class="e2e-related-sct-empty">No other SCTs are available.</span>`}
            </div>
          </details>
        </div>
      </div>
      <div class="e2e-route-context" aria-label="Selected SCT route context">
        <strong>${escapeHtml(`${context.primarySct.displayId} · ${context.primarySct.name}`)}</strong>
        <span data-e2e-related-summary>${context.relatedScts.length} related SCT${context.relatedScts.length === 1 ? "" : "s"}</span>
        <span>${context.lanes.length} recursion lane${context.lanes.length === 1 ? "" : "s"}</span>
        <span data-e2e-contribution-summary>${context.contributions.length} contribution${context.contributions.length === 1 ? "" : "s"} available to place</span>
        ${context.unavailableRelatedSctIds.length
          ? `<span class="e2e-route-context-warning">${context.unavailableRelatedSctIds.length} related SCT source${context.unavailableRelatedSctIds.length === 1 ? " is" : "s are"} unavailable; placed steps remain preserved.</span>`
          : ""}
      </div>
      <iframe
        class="e2e-robustness-frame"
        src="./e2e-robustness-check.html?v=20260725-step3-aspects-org-units"
        title="E2E robustness route editor for ${escapeAttr(`${context.primarySct.displayId} · ${context.primarySct.name}`)}"
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-downloads"
        data-e2e-frame
        data-e2e-sct-id="${escapeAttr(selectedTask.id)}"
      ></iframe>
    </section>
  `;
}

export function renderStep6Channels(workspace, options = {}) {
  const context = getStep6ChannelVarietyContext(workspace);
  return `
    <section class="work-section channel-variety-section ${options.fullscreen ? "is-fullscreen" : ""}">
      <div class="channel-variety-hostbar">
        <div class="channel-variety-context" aria-label="Communication variety check context">
          <strong>${escapeHtml(context.meta.sifName)}</strong>
          <span>${context.loops.length} canonical vertical loops</span>
          <span>Ratings: weak · caution · pass</span>
        </div>
        <div class="channel-variety-controls">
          ${tileExportButton("step6", "step6-channels", "Export communication checks")}
          ${options.fullscreen ? "" : tileFullscreenButton("step6-channels", "Open communication checks fullscreen")}
        </div>
      </div>
      <div class="channel-variety-frame-shell">
        <iframe
          class="channel-variety-frame"
          src="./channel-variety-check.html?vsm=/vsm.html%3Fv%3D20260725-step3-aspects-org-units&assetVersion=20260725-step3-aspects-org-units"
          title="Communication variety checks for ${escapeAttr(context.meta.sifName)}"
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-downloads"
          data-channel-variety-frame
        ></iframe>
      </div>
    </section>
  `;
}

export function renderStep6FullscreenTile(workspace, options = {}, tileId = "step6-e2e") {
  if (tileId === "step6-channels") {
    return fullscreenTile({
      kicker: "Step VI · Channels",
      title: "Communication Variety Checks",
      description: "Use the larger surface to assess canonical vertical loops and export the check when needed.",
      counter: "Channels",
      variant: "is-embedded-tool",
      tileClass: "step6-fullscreen-tile",
      content: renderStep6Channels(workspace, { fullscreen: true })
    });
  }

  return fullscreenTile({
    kicker: "Step VI · Flows",
    title: "E2E Process Robustness Check",
    description: "Author and inspect the route for the selected SCT with maximum working space.",
    counter: "E2E",
    variant: "is-embedded-tool",
    tileClass: "step6-fullscreen-tile",
    content: renderStep6E2ECheck(workspace, {
      selectedSctId: options.selectedSctId,
      fullscreen: true
    })
  });
}
