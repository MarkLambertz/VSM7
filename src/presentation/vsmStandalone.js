import { renderSteeringMasterFrame } from "./shared/steeringMasterBridge.js?v=20260729-brand-home-link";

export function renderVsmStandalone(_workspace) {
  return `
    <section class="steering-master-page" aria-label="Steering Master">
      <div class="steering-master-frame-shell">
        ${renderSteeringMasterFrame()}
      </div>
    </section>
  `;
}
