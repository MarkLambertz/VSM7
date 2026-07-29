import { escapeAttr } from "./renderHelpers.js?v=20260729-steering-master-nav-audit";

const cacheLabel = "20260729-steering-master-nav-audit";
const nestedVsmSource = `../vsm.html?v=${cacheLabel}`;

export const steeringMasterFrameSource = `./design-previews/steering-master.html?host=vsm7&v=${cacheLabel}&vsm=${encodeURIComponent(nestedVsmSource)}`;

export function renderSteeringMasterFrame(title = "VSM7 Steering Master") {
  return `
    <iframe
      class="steering-master-frame"
      data-steering-master-frame
      src="${escapeAttr(steeringMasterFrameSource)}"
      title="${escapeAttr(title)}"
      allow="fullscreen"
    ></iframe>
  `;
}
