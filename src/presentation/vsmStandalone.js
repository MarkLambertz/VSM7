import { renderVsmHostFrame } from "./shared/vsmHostBridge.js?v=20260725-step3-aspects-org-units";
import { escapeHtml } from "./shared/renderHelpers.js?v=20260725-step3-aspects-org-units";

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
