import { renderVsmHostFrame } from "./shared/vsmHostBridge.js";
import { escapeHtml } from "./shared/renderHelpers.js";

export function renderVsmStandalone(workspace) {
  const sifName = workspace.sif?.name || workspace.project?.name || "System-in-Focus";

  return `
    <section class="vsm-standalone-page" aria-label="Standalone VSM view">
      <div class="vsm-standalone-header">
        <div>
          <p class="eyebrow">VSM7 system map</p>
          <h1>${escapeHtml(sifName)}</h1>
          <p>Explore the System-in-Focus and its recursion structure in the shared VSM diagram.</p>
        </div>
      </div>
      <div class="vsm-standalone-frame-shell">
        ${renderVsmHostFrame("standalone", "Standalone VSM7 system map")}
      </div>
    </section>
  `;
}
