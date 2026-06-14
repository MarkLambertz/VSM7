import { renderMethodVisual } from "./methodVisuals.js";
import { formatSctNumber } from "../../domain/vsm.js?v=20260613-manual-step-status";

export function stepHeader(token, title, description) {
  const visual = getStepVisual(token, title);

  return `
    <section class="step1-stage generic-step-stage" aria-label="${escapeAttr(title)} workshop focus">
      <div class="step1-stage-copy">
        <p class="eyebrow">${escapeHtml(token)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </div>
      ${renderMethodVisual(visual)}
    </section>
  `;
}

function getStepVisual(token, title) {
  const visuals = {
    "Step II": {
      title: "Variety balance",
      kind: "variety",
      caption: "Horizontal and vertical variety compared for overload risk",
      items: ["Horizontal variety", "Vertical variety", "Flattening risk", "Remedy"]
    },
    "Step III": {
      title: "SCT spine",
      kind: "sct",
      caption: "Complexity drivers feeding the success-critical task spine",
      items: ["Drivers", "Overlaps", "Dependencies", "Weak scores", "SCTs"]
    },
    "Step IV": {
      title: "Accountability map",
      kind: "accountability",
      caption: "SCTs connected to recursion levels and accountable entities",
      items: ["SCT", "R-1", "R0", "R+1", "Entity"]
    },
    "Step V": {
      title: "Meeting architecture",
      kind: "meetings",
      caption: "S2-S5 meeting layers organized by VSM function",
      items: ["S2", "S3", "S3*", "S4", "S5"]
    },
    "Step VI": {
      title: "Channel robustness radar",
      kind: "channels",
      caption: "Closed-loop robustness across the channel criteria",
      items: ["Capacity", "Intelligibility", "Synchronicity", "Security"]
    },
    "Step VII": {
      title: "Role constellation",
      kind: "roles",
      caption: "Roles, entities, meetings, and SCTs connected",
      items: ["Roles", "Entities", "Meetings", "SCTs", "RASIC"]
    },
    Implementation: {
      title: "Transformation roadmap",
      kind: "roadmap",
      caption: "Implementation epics staged across now, next, and later",
      items: ["Now", "Next", "Later", "Owners", "Dependencies"]
    }
  };

  return visuals[token] || {
    title,
    kind: "generic",
    caption: "Illustration · icon · photo · workshop canvas",
    items: ["Focus", "Inputs", "Decisions", "Outcome"]
  };
}

export function tableHeader(title, action, actionLabel = "Add Row") {
  return `
    <div class="section-heading">
      <h2>${escapeHtml(title)}</h2>
      <button class="ghost-button" data-action="${escapeAttr(action)}">${escapeHtml(actionLabel)}</button>
    </div>
  `;
}

export function field(label, path, value, type = "text") {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input type="${escapeAttr(type)}" data-path="${escapeAttr(path)}" value="${escapeAttr(value)}">
    </label>
  `;
}

export function textarea(label, path, value) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <textarea data-path="${escapeAttr(path)}" rows="4">${escapeHtml(value)}</textarea>
    </label>
  `;
}

export function selectField(label, path, value, options) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <select data-path="${escapeAttr(path)}">
        ${options.map((option) => `<option value="${escapeAttr(option)}" ${String(value) === String(option) ? "selected" : ""}>${escapeHtml(option || "Select")}</option>`).join("")}
      </select>
    </label>
  `;
}

export function cellInput(collection, id, fieldName, value, type = "text") {
  return `<input type="${escapeAttr(type)}" data-collection="${escapeAttr(collection)}" data-id="${escapeAttr(id)}" data-field="${escapeAttr(fieldName)}" value="${escapeAttr(value)}">`;
}

export function cellSelect(collection, id, fieldName, value, options) {
  return `
    <select data-collection="${escapeAttr(collection)}" data-id="${escapeAttr(id)}" data-field="${escapeAttr(fieldName)}">
      ${options.map((option) => `<option value="${escapeAttr(option)}" ${String(value) === String(option) ? "selected" : ""}>${escapeHtml(option || "Select")}</option>`).join("")}
    </select>
  `;
}

export function taskMultiSelect(workspace, collection, id, selectedIds) {
  return `
    <select multiple class="task-select" data-task-links="${escapeAttr(collection)}" data-id="${escapeAttr(id)}">
      ${workspace.step3.successCriticalTasks.map((task) => `
        <option value="${escapeAttr(task.id)}" ${selectedIds.includes(task.id) ? "selected" : ""}>${escapeHtml(`${formatSctNumber(task.number)} · ${task.title || "Untitled SCT"}`)}</option>
      `).join("")}
    </select>
  `;
}

export function removeButton(collection, id) {
  return `<button class="icon-button" title="Delete item" aria-label="Delete item" data-action="remove-item" data-collection="${escapeAttr(collection)}" data-id="${escapeAttr(id)}">x</button>`;
}

export function allocationCheckbox(taskId, level, checked) {
  return `<input type="checkbox" data-allocation-level="${escapeAttr(`${taskId}|${level}`)}" ${checked ? "checked" : ""}>`;
}

export function allocationInput(taskId, fieldName, value) {
  return `<input data-allocation-field="${escapeAttr(`${taskId}|${fieldName}`)}" value="${escapeAttr(value)}">`;
}

export function metric(label, value, caption) {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(caption)}</small>
    </div>
  `;
}

export function emptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function escapeAttr(value) {
  return escapeHtml(value);
}
