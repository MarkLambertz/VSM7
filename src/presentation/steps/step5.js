import {
  getStep5AssignedSystem,
  getStep5InScopeContributions,
  getStep5MappingDiagnostics,
  isStep5ContributionAssigned,
  vsmSystems
} from "../../domain/vsm.js";
import { emptyState, escapeAttr, escapeHtml, stepHeader } from "../shared/renderHelpers.js";
import { renderVsmHostFrame } from "../shared/vsmHostBridge.js";

export function renderStep5(workspace, context = {}) {
  return `
    ${stepHeader("Step V", "Design Steering System", "Map the real R0 SCT contributions of the System-in-Focus to the systems of the VSM.")}
    ${renderStep5Mapping(workspace, context)}
  `;
}

export function renderStep5Mapping(workspace, context = {}) {
  const diagnostics = getStep5MappingDiagnostics(workspace);
  const activeSystem = normalizeActiveSystem(workspace, context.activeStep5System);
  const counts = Object.fromEntries(diagnostics.distribution.map((item) => [item.systemId, item.count]));
  const allContributions = getStep5InScopeContributions(workspace);
  const filteredContributions = filterContributions(allContributions, context.sctPriorityFilter, context.sctSourceFilter);
  const visibleSystemIds = getVisibleStep5Systems(workspace);
  const isPaneVisible = context.vsmPaneVisible === true;

  return `
    <section class="work-section step5-mapping-section">
      <div class="section-heading">
        <div>
          <h2>SCT-to-VSM-System Mapping</h2>
          <p>Select a VSM system, then assign each real R0/SIF contribution to exactly one VSM system. If one contribution seems to serve several systems, split or decompose it upstream first.</p>
        </div>
        <button class="ghost-button" data-action="export-step" data-step="step5">Download Outcome</button>
      </div>

      <div class="step5-doctrine-switch step5-lens-switch" aria-label="Step V mapping lens">
        <div>
          <strong>Mapping lens</strong>
          <span>Choose how strictly the VSM systems are interpreted for this workshop.</span>
        </div>
        <div class="step5-lens-options">
          <button
            class="step5-lens-option ${workspace.step5.includeSystem1 === false ? "is-active" : ""}"
            data-action="set-step5-doctrine"
            data-include-system1="false"
          >
            <span>Doctrine</span>
            <strong>S2-S5 steering only</strong>
            <small>Treat S1 as self-organizing black boxes.</small>
          </button>
          <button
            class="step5-lens-option ${workspace.step5.includeSystem1 !== false ? "is-active" : ""}"
            data-action="set-step5-doctrine"
            data-include-system1="true"
          >
            <span>Pragmatic</span>
            <strong>Include operative S1</strong>
            <small>Use when SCTs also describe operative work.</small>
          </button>
        </div>
      </div>

      ${renderStep5FilterBar(allContributions, context)}

      <div class="step5-tri-pane-layout">
        ${renderUnmappedPanel(workspace, activeSystem, filteredContributions, visibleSystemIds)}
        <div class="step5-diagram-panel step5-iframe-panel">
          <div class="step5-iframe-heading">
            <div>
              <p class="eyebrow">Clickable VSM map</p>
              <h3>${escapeHtml(getVsmSystemLabel(activeSystem))}</h3>
              <p>Click a VSM system in the diagram to make it the active mapping target.</p>
            </div>
            <div class="step5-iframe-heading-actions">
              <span class="step5-map-count">${counts[activeSystem] || 0} mapped</span>
              <button
                class="ghost-button compact-button step5-pane-toggle"
                data-action="toggle-vsm-details-pane"
                data-vsm-context="step5"
                aria-pressed="${isPaneVisible ? "true" : "false"}"
              >${isPaneVisible ? "Hide pane" : "Show pane"}</button>
            </div>
          </div>
          ${renderVsmHostFrame("step5", "Step V VSM system mapping")}
        </div>
        ${renderMappedPanel(workspace, activeSystem, filteredContributions, visibleSystemIds, diagnostics)}
      </div>
    </section>
    ${renderSteeringSignals(diagnostics)}
  `;
}

function renderStep5FilterBar(contributions, context) {
  const availablePriorities = [...new Set(contributions.map((item) => item.priority).filter(Boolean))].sort();
  const availableSources = [...new Set(contributions.map((item) => item.source).filter(Boolean))].sort();

  return `
    <div class="sct-filter-bar step5-filter-bar">
      <label>
        <span>Priority</span>
        <select data-sct-filter="priority">
          <option value="">All priorities</option>
          ${availablePriorities.map((priority) => `<option value="${escapeAttr(priority)}" ${context.sctPriorityFilter === priority ? "selected" : ""}>${escapeHtml(priority)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Source</span>
        <select data-sct-filter="source">
          <option value="">All sources</option>
          ${availableSources.map((source) => `<option value="${escapeAttr(source)}" ${context.sctSourceFilter === source ? "selected" : ""}>${escapeHtml(source)}</option>`).join("")}
        </select>
      </label>
      <button class="ghost-button" data-action="clear-sct-filters">Clear filters</button>
    </div>
  `;
}

function renderUnmappedPanel(workspace, activeSystem, contributions, visibleSystemIds) {
  const unmapped = contributions.filter((contribution) => !visibleSystemIds.includes(getStep5AssignedSystem(workspace, contribution.key)));
  const activeSystemLabel = getVsmSystemLabel(activeSystem);
  return `
    <aside class="step5-workbench-panel step5-unmapped-panel">
      <div class="step5-panel-heading">
        <div>
          <p class="eyebrow">Input from Step IV</p>
          <h3>R0/SIF contributions</h3>
        </div>
        <span>${unmapped.length} open</span>
      </div>
      <div class="step5-contribution-list">
        ${unmapped.length > 0
          ? unmapped.map((contribution) => renderContributionCard({
            workspace,
            contribution,
            actionSystem: activeSystem,
            actionLabel: `Map to ${activeSystemLabel}`,
            statusLabel: "Unmapped",
            variant: "unmapped"
          })).join("")
          : emptyState("No unmapped R0/SIF contribution matches the current view.")}
      </div>
    </aside>
  `;
}

function renderMappedPanel(workspace, activeSystem, contributions, visibleSystemIds, diagnostics) {
  const mappedSystem = visibleSystemIds.includes(activeSystem) ? activeSystem : visibleSystemIds[0];
  const activeDistribution = diagnostics.distribution.find((item) => item.systemId === mappedSystem);
  const mappedCount = activeDistribution?.count || 0;
  return `
    <aside class="step5-workbench-panel step5-mapped-panel">
      <div class="step5-panel-heading">
        <div>
          <p class="eyebrow">One contribution, one system</p>
          <h3>Mapped to ${escapeHtml(getVsmSystemLabel(mappedSystem))}</h3>
        </div>
        <span>${mappedCount} mapped</span>
      </div>
      <div class="step5-mapped-systems">
        ${renderMappedSystemGroup(workspace, mappedSystem, activeSystem, contributions, diagnostics)}
      </div>
    </aside>
  `;
}

function renderMappedSystemGroup(workspace, systemId, activeSystem, contributions, diagnostics) {
  const mapped = contributions.filter((contribution) => isStep5ContributionAssigned(workspace, systemId, contribution.key));
  const distribution = diagnostics.distribution.find((item) => item.systemId === systemId);
  return `
    <section class="step5-mapped-system ${systemId === activeSystem ? "is-active" : ""}">
      <div class="step5-mapped-system-heading">
        <div>
          <strong>${escapeHtml(getVsmSystemLabel(systemId))}</strong>
          <span>${escapeHtml(systemPurpose(systemId))}</span>
        </div>
        <b>${distribution?.percentage || 0}%</b>
      </div>
      <div class="step5-mapped-list">
        ${mapped.length > 0
          ? mapped.map((contribution) => renderContributionCard({
            workspace,
            contribution,
            actionSystem: systemId,
            actionLabel: "Unmap",
            statusLabel: `Mapped to S${systemId}`,
            variant: "mapped"
          })).join("")
          : `<p class="step5-empty-system">No contribution mapped here yet.</p>`}
      </div>
    </section>
  `;
}

function renderContributionCard({ contribution, actionSystem, actionLabel, statusLabel, variant }) {
  return `
    <article class="step5-contribution-card step5-contribution-card-${escapeAttr(variant)}">
      <div class="step5-contribution-identity">
        <span class="priority-badge priority-${escapeAttr(contribution.priority.toLowerCase())}">${escapeHtml(contribution.priority)}</span>
        <div>
          <strong>${escapeHtml(`${contribution.sctNumber} · ${contribution.title}`)}</strong>
          <span>${escapeHtml(`${contribution.level} · ${contribution.organizationName}`)}</span>
        </div>
      </div>
      <p>${escapeHtml(contribution.contribution)}</p>
      <div class="step5-contribution-footer">
        <span>${escapeHtml(`${statusLabel} · ${contribution.source}`)}</span>
        <button
          class="ghost-button compact-button step5-action-button"
          data-action="toggle-step5-assignment"
          data-system="${escapeAttr(actionSystem)}"
          data-contribution-key="${escapeAttr(contribution.key)}"
        >${escapeHtml(actionLabel)}</button>
      </div>
    </article>
  `;
}

function getVisibleStep5Systems(workspace) {
  return workspace.step5.includeSystem1 === false ? vsmSystems.filter((systemId) => systemId !== "1") : vsmSystems;
}

function renderSteeringSignals(diagnostics) {
  return `
    <section class="work-section step5-signals">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Computed interpretation help</p>
          <h2>Steering-System Signals</h2>
          <p>Patterns for workshop discussion, not claims of organizational truth.</p>
        </div>
      </div>
      <div class="step5-signal-grid">
        <article class="step5-signal-panel">
          <h3>Distribution of SCT contributions</h3>
          <div class="step5-distribution">
            ${diagnostics.distribution.map((item) => `
              <div class="step5-distribution-item system-${escapeAttr(item.systemId.replace("*", "star"))}">
                <div><strong>S${escapeHtml(item.systemId)}</strong><span>${item.count} assignment${item.count === 1 ? "" : "s"}</span></div>
                <b>${item.percentage}%</b>
                <span class="step5-distribution-bar"><i style="width:${item.percentage}%"></i></span>
              </div>
            `).join("")}
          </div>
          <p class="step5-observation">${escapeHtml(diagnostics.observation)}</p>
        </article>
        <article class="step5-signal-panel">
          <h3>Unmapped contributions</h3>
          ${diagnostics.unmappedContributions.length > 0
            ? `<p><strong>${diagnostics.unmappedContributions.length}</strong> real contribution${diagnostics.unmappedContributions.length === 1 ? " is" : "s are"} not yet located in the steering architecture.</p>
              <ul>${diagnostics.unmappedContributions.slice(0, 5).map((item) => `<li>${escapeHtml(`${item.sctNumber} · ${item.level} · ${item.organizationName}`)}</li>`).join("")}</ul>`
            : `<p>Every captured R0 contribution is mapped to exactly one visible VSM system.</p>`}
        </article>
      </div>
    </section>
  `;
}

function filterContributions(contributions, priority, source) {
  return contributions.filter((contribution) => (
    (!priority || contribution.priority === priority)
    && (!source || contribution.source === source)
  ));
}

function normalizeActiveSystem(workspace, requested) {
  const available = workspace.step5.includeSystem1 === false ? vsmSystems.filter((systemId) => systemId !== "1") : vsmSystems;
  return available.includes(requested) ? requested : "3";
}

function systemPurpose(systemId) {
  return {
    "1": "Performs the operative work and creates value in the environment.",
    "2": "Coordinates operative units and dampens avoidable oscillation.",
    "3": "Controls current operations, negotiates resources, and ensures cohesion.",
    "3*": "Provides independent, direct insight into operational reality.",
    "4": "Connects the organization with its environment and future.",
    "5": "Provides identity, policy, values, and normative balance."
  }[systemId] || "";
}

function getVsmSystemLabel(systemId) {
  return {
    "1": "S1 · Operate",
    "2": "S2 · Coordinate",
    "3": "S3 · Control",
    "3*": "S3* · Monitor",
    "4": "S4 · Future and environment",
    "5": "S5 · Identity and policy"
  }[systemId] || "VSM system";
}
