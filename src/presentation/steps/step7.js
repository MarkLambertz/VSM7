export function renderStep7() {
  return `
    <section class="step7-claude-host" aria-label="Step VII Representation">
      <!-- Export is tile-level only (PO decision 2026-07-22): the editor's own ⬇ inside the iframe
           (#exportBtn / 7.7 #orgExportBtn) is the export path; no duplicate host-level step ⬇. -->
      <iframe
        class="step7-claude-frame"
        data-step7-frame
        src="./design-previews/step7-ux.html?host=vsm7&v=20260724-pptxgenjs"
        title="Step VII Representation editor"
        allow="fullscreen"
      ></iframe>
    </section>
  `;
}
