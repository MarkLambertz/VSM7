import {
  channelVarietyCriteria,
  getStep6ChannelVarietyContext,
  getStep6ChannelVarietyWeaknessCandidates,
  getStep6FindingCandidates
} from "../../domain/vsm.js";
import { cellInput, cellSelect, escapeAttr, escapeHtml, removeButton, stepHeader, tableHeader } from "../shared/renderHelpers.js";

export function renderImplementation(workspace) {
  return `
    ${stepHeader("Implementation", "Target Organization Roadmap", "Turn the target picture into implementation items, owners, and timing.")}
    ${renderImplementationWorkspace(workspace)}
  `;
}

export function renderImplementationWorkspace(workspace, options = {}) {
  const findings = getStep6FindingCandidates(workspace);
  const findingsBySource = new Map(findings.map((candidate) => [
    `${candidate.routeId}|${candidate.finding.id}`,
    candidate
  ]));
  const channelWeaknesses = getStep6ChannelVarietyWeaknessCandidates(workspace);
  const channelSources = buildChannelSourceMap(workspace);
  return `
    <section class="work-section e2e-finding-candidates ${options.fullscreen ? "fullscreen-matrix-section" : ""}">
      <div class="section-heading">
        <div>
          <h2>E2E Finding Candidates</h2>
          <p class="section-note">Workshop observations from Step VI. A human decides which findings become transformation work.</p>
        </div>
      </div>
      ${findings.length ? `
        <div class="finding-candidate-list">
          ${findings.map((candidate) => renderFindingCandidate(candidate)).join("")}
        </div>
      ` : `<p class="empty-state">No structured E2E findings have been captured yet.</p>`}
    </section>
    <section class="work-section channel-weakness-candidates ${options.fullscreen ? "fullscreen-matrix-section" : ""}">
      <div class="section-heading">
        <div>
          <h2>Communication Weakness Candidates</h2>
          <p class="section-note">Red criteria from Step VI. A human decides which weaknesses become transformation work.</p>
        </div>
      </div>
      ${channelWeaknesses.length ? `
        <div class="finding-candidate-list">
          ${channelWeaknesses.map((candidate) => renderChannelWeaknessCandidate(candidate)).join("")}
        </div>
      ` : `<p class="empty-state">No communication criterion is currently assessed as weak.</p>`}
    </section>
    <section class="work-section ${options.fullscreen ? "fullscreen-matrix-section" : ""}">
      ${tableHeader("Transformation Backlog", "add-implementation")}
      <div class="table-wrap wide">
        <table>
          <thead><tr><th>Steering challenge / action</th><th>Dependency / requirement</th><th>Source</th><th>Responsible</th><th>Due date</th><th>Status</th><th></th></tr></thead>
          <tbody>${workspace.implementation.items.map((item) => `
            <tr>
              <td>${cellInput("implementation.items", item.id, "challenge", item.challenge)}</td>
              <td>${cellInput("implementation.items", item.id, "requirement", item.requirement)}</td>
              <td>${renderImplementationSource(item, findingsBySource, channelSources)}</td>
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

function renderChannelWeaknessCandidate(candidate) {
  const context = [
    candidate.observation,
    candidate.communication ? `Communication & meetings: ${candidate.communication}` : "",
    candidate.artifact ? `Artifact: ${candidate.artifact}` : "",
    candidate.role ? `Role: ${candidate.role}` : ""
  ].filter(Boolean).join(" · ");
  return `
    <article class="finding-candidate severity-high">
      <div class="finding-candidate-main">
        <p class="finding-meta">
          <strong>${escapeHtml(candidate.system)}</strong>
          <span>${escapeHtml(candidate.loopLabel)}</span>
          <span>Weak criterion</span>
        </p>
        <h3>${escapeHtml(candidate.criterionLabel)}</h3>
        <p>${escapeHtml(context || "No supporting observation has been captured yet.")}</p>
      </div>
      <div class="finding-candidate-actions">
        <button
          class="${candidate.converted ? "ghost-button" : "primary-button"} small"
          data-action="create-backlog-from-channel-weakness"
          data-loop-id="${escapeAttr(candidate.loopId)}"
          data-criterion-index="${candidate.criterionIndex}"
          ${candidate.converted ? "disabled" : ""}
        >${candidate.converted ? "Added to backlog" : "Create backlog item"}</button>
        <button class="ghost-button small" data-action="open-channel-weakness-source">Open check</button>
      </div>
    </article>
  `;
}

function renderFindingCandidate(candidate) {
  const finding = candidate.finding;
  return `
    <article class="finding-candidate severity-${escapeAttr(finding.severity || "medium")}">
      <div class="finding-candidate-main">
        <p class="finding-meta">
          <strong>${escapeHtml(candidate.sctNumber)} · ${escapeHtml(candidate.sctTitle)}</strong>
          <span>${escapeHtml(formatFindingCategory(finding.category))}</span>
          <span>${escapeHtml(finding.severity || "medium")} severity</span>
        </p>
        <h3>${escapeHtml(finding.note || "Finding without an observation note")}</h3>
        <p>${escapeHtml(candidate.affectedElement)} · ${escapeHtml(candidate.routeName)}</p>
      </div>
      <div class="finding-candidate-actions">
        <button
          class="${candidate.converted ? "ghost-button" : "primary-button"} small"
          data-action="create-backlog-from-finding"
          data-route-id="${escapeAttr(candidate.routeId)}"
          data-finding-id="${escapeAttr(finding.id)}"
          ${candidate.converted ? "disabled" : ""}
        >${candidate.converted ? "Added to backlog" : "Create backlog item"}</button>
        <button
          class="ghost-button small"
          data-action="open-e2e-finding-source"
          data-task-id="${escapeAttr(candidate.taskId)}"
        >Open route</button>
      </div>
    </article>
  `;
}

function renderImplementationSource(item, findingsBySource, channelSources) {
  if (item?.source?.kind === "channel-variety-weakness") {
    const sourceKey = `${item.source.loopId}|${Number(item.source.criterionIndex)}`;
    const source = channelSources.get(sourceKey);
    const status = item.sourceStatus === "source-resolved" ? "Source no longer weak" : "Communication weakness";
    return `
      <span class="source-reference ${item.sourceStatus === "source-resolved" ? "has-warning" : ""}">
        <strong>${escapeHtml(status)}</strong>
        <small>${escapeHtml(source ? `${source.loopLabel} / ${source.criterionLabel}` : sourceKey)}</small>
        <button class="text-button" data-action="open-channel-weakness-source">Open check</button>
      </span>
    `;
  }
  if (item?.source?.kind !== "e2e-finding") {
    return `<span class="source-reference">Workshop decision</span>`;
  }
  const candidate = findingsBySource.get(`${item.source.routeId}|${item.source.findingId}`);
  const status = item.sourceStatus === "source-removed"
    ? "Source removed"
    : item.sourceStatus === "source-detached"
      ? "Source retained from merged SCT"
      : "E2E finding";
  return `
    <span class="source-reference ${item.sourceStatus && item.sourceStatus !== "active" ? "has-warning" : ""}">
      <strong>${escapeHtml(status)}</strong>
      <small>${escapeHtml(`${item.source.routeId} / ${item.source.findingId}`)}</small>
      ${candidate ? `
        <button
          class="text-button"
          data-action="open-e2e-finding-source"
          data-task-id="${escapeAttr(candidate.taskId)}"
        >Open route</button>
      ` : ""}
    </span>
  `;
}

function buildChannelSourceMap(workspace) {
  const sources = new Map();
  for (const loop of getStep6ChannelVarietyContext(workspace).model.loops) {
    channelVarietyCriteria.forEach((criterion, criterionIndex) => {
      sources.set(`${loop.id}|${criterionIndex}`, {
        loopLabel: loop.label,
        criterionLabel: criterion.label
      });
    });
  }
  return sources;
}

function formatFindingCategory(category) {
  return String(category || "finding")
    .split("-")
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : "")
    .join(" ");
}
