export function stepHeader(token, title, description) {
  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">${escapeHtml(token)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </div>
    </section>
  `;
}

export function tableHeader(title, action) {
  return `
    <div class="section-heading">
      <h2>${escapeHtml(title)}</h2>
      <button class="ghost-button" data-action="${escapeAttr(action)}">Add Row</button>
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
        <option value="${escapeAttr(task.id)}" ${selectedIds.includes(task.id) ? "selected" : ""}>${escapeHtml(task.title || "Untitled SCT")}</option>
      `).join("")}
    </select>
  `;
}

export function removeButton(collection, id) {
  return `<button class="icon-button" title="Remove row" data-action="remove-item" data-collection="${escapeAttr(collection)}" data-id="${escapeAttr(id)}">x</button>`;
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
