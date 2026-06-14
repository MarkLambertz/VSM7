import { escapeAttr, escapeHtml } from "./shared/renderHelpers.js?v=20260613-sct-tool-method2";

export function renderRenameDialog(target) {
  if (!target) {
    return "";
  }

  const typeLabel = target.type === "organization" ? "organization" : "project";
  const title = `Rename ${typeLabel}`;

  return `
    <div class="dialog-backdrop">
      <section class="rename-dialog" role="dialog" aria-modal="true" aria-labelledby="rename-dialog-title">
        <div class="rename-dialog-header">
          <div>
            <p class="eyebrow">Workspace manager</p>
            <h2 id="rename-dialog-title">${escapeHtml(title)}</h2>
          </div>
          <button class="icon-button" data-action="cancel-rename" title="Close" aria-label="Close rename dialog">x</button>
        </div>
        <label class="rename-dialog-field">
          <span>${escapeHtml(typeLabel)} name</span>
          <input data-rename-draft value="${escapeAttr(target.draftName)}" maxlength="120">
        </label>
        <div class="rename-dialog-actions">
          <button class="ghost-button" data-action="cancel-rename">Cancel</button>
          <button class="primary-button" data-action="confirm-rename">Rename</button>
        </div>
      </section>
    </div>
  `;
}
