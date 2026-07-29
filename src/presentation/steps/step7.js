import { stepHeader } from "../shared/renderHelpers.js?v=20260729-steering-master-nav-audit";

export function renderStep7() {
  return `
    ${stepHeader(
      "Step VII",
      "Representation & Accountability",
      "Connect SCT contributions to roles, functions, meetings, RASIC accountability, and the organizational representation of the System-in-Focus."
    )}
    <section class="step7-claude-host" aria-label="Step VII Representation">
      <!-- Export is tile-level only (PO decision 2026-07-22): the editor's own ⬇ inside the iframe
           (#exportBtn / 7.7 #orgExportBtn) is the export path; no duplicate host-level step ⬇. -->
      <iframe
        class="step7-claude-frame"
        data-step7-frame
        src="./design-previews/step7-ux.html?host=vsm7&v=20260729-step7-starting-tile"
        title="Step VII Representation editor"
        allow="fullscreen"
      ></iframe>
    </section>
  `;
}
