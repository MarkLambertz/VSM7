import { escapeAttr, escapeHtml } from "./renderHelpers.js";

const systemLabels = {
  "1": "S1 · Operations",
  "2": "S2 · Coordination",
  "3": "S3 · Control",
  "3*": "S3* · Independent monitoring",
  "4": "S4 · Future and environment",
  "5": "S5 · Policy and identity"
};

export function renderVsmSystemDiagram(activeSystem = "3", includeSystem1 = true, counts = {}) {
  const activeCount = Number(counts?.[activeSystem] || 0);

  return `
    <div class="vsm-system-diagram-shell">
      <svg class="vsm-system-diagram" viewBox="0 0 640 760" role="img" aria-label="Clickable Viable System Model diagram">
        <defs>
          <marker id="vsm-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L8,4.5 L0,9 Z"></path>
          </marker>
        </defs>

        <path class="vsm-environment" d="M50 92 C20 192 23 560 62 676 C84 741 145 717 148 644 C152 545 126 470 145 374 C162 286 139 205 150 122 C158 67 74 49 50 92 Z"></path>
        <path class="vsm-market" d="M91 127 C105 79 160 75 175 125 C196 193 153 238 96 214 C63 199 68 154 91 127 Z"></path>
        ${[360, 448, 536, 624].map((y) => `
          <path class="vsm-operation" d="M82 ${y - 36} C103 ${y - 64} 139 ${y - 58} 151 ${y - 24} C176 ${y - 2} 161 ${y + 39} 127 ${y + 43} C95 ${y + 54} 69 ${y + 28} 83 ${y + 2} C65 ${y - 7} 65 ${y - 25} 82 ${y - 36} Z"></path>
          <path class="vsm-operation-gap" d="M88 ${y + 15} C111 ${y + 3} 134 ${y + 3} 153 ${y + 18}"></path>
        `).join("")}

        <g class="vsm-channel-lines">
          <path d="M166 155 C211 132 248 135 286 160"></path>
          <path d="M166 182 C214 207 248 204 286 178"></path>
          ${[372, 460, 548, 636].map((y) => `
            <path d="M152 ${y - 20} C196 ${y - 44} 238 ${y - 40} 280 ${y - 8}"></path>
            <path d="M152 ${y + 10} C196 ${y + 38} 239 ${y + 35} 280 ${y + 8}"></path>
          `).join("")}
        </g>

        ${renderSystemGroup("5", activeSystem, counts, `
          <rect class="vsm-hit-area" x="325" y="58" width="230" height="125" rx="22"></rect>
          <path class="vsm-s5-loop" d="M316 106 H502 Q554 106 554 158 V238 H527 V165 Q527 134 496 134 H323 Z"></path>
          <rect class="vsm-s5-block" x="334" y="66" width="194" height="76" rx="15"></rect>
          <text x="431" y="113">5</text>
        `)}

        ${renderSystemGroup("4", activeSystem, counts, `
          <rect class="vsm-hit-area" x="326" y="164" width="248" height="104" rx="22"></rect>
          <rect class="vsm-s4-block" x="334" y="174" width="194" height="76" rx="15"></rect>
          <path class="vsm-s4-loop" d="M529 192 C588 187 597 266 546 293"></path>
          <path class="vsm-s4-arrow" d="M546 270 L544 302 L573 285 Z"></path>
          <text x="431" y="222">4</text>
        `)}

        ${renderSystemGroup("3", activeSystem, counts, `
          <rect class="vsm-hit-area" x="286" y="270" width="272" height="116" rx="22"></rect>
          <path class="vsm-s3-spine" d="M390 360 V658 M458 360 V658"></path>
          <rect class="vsm-s3-block" x="300" y="282" width="248" height="82" rx="15"></rect>
          <path class="vsm-s3-loop" d="M300 305 C244 279 229 352 270 383"></path>
          <path class="vsm-s3-arrow" d="M266 360 L270 392 L296 373 Z"></path>
          <text x="424" y="333">3</text>
        `)}

        ${renderSystemGroup("3*", activeSystem, counts, `
          <rect class="vsm-hit-area" x="182" y="300" width="112" height="390" rx="20"></rect>
          <path class="vsm-s3star-rail" d="M270 355 L214 402 V628 L270 680"></path>
          <path class="vsm-s3star-rail" d="M270 432 L214 478"></path>
          <path class="vsm-s3star-rail" d="M270 516 L214 562"></path>
          <path class="vsm-s3star-rail" d="M270 594 L214 640"></path>
          <path class="vsm-s3star-tag" d="M182 318 L258 318 L220 382 Z"></path>
          <text x="220" y="354">3*</text>
        `)}

        ${renderSystemGroup("2", activeSystem, counts, `
          <rect class="vsm-hit-area" x="532" y="300" width="86" height="390" rx="20"></rect>
          <path class="vsm-s2-rail" d="M548 355 L596 402 V628 L548 680"></path>
          <path class="vsm-s2-rail" d="M548 432 L596 478"></path>
          <path class="vsm-s2-rail" d="M548 516 L596 562"></path>
          <path class="vsm-s2-rail" d="M548 594 L596 640"></path>
          <path class="vsm-s2-tag" d="M535 318 L611 318 L573 382 Z"></path>
          <text x="573" y="354">2</text>
        `)}

        <g class="vsm-operative-context ${includeSystem1 ? "" : "is-muted"}">
          ${[388, 476, 564, 652].map((y, index) => `
            <circle class="vsm-s1-circle" cx="326" cy="${y}" r="35"></circle>
            <path class="vsm-local-loop" d="M363 ${y - 12} C394 ${y - 30} 407 ${y - 18} 411 ${y}"></path>
            <path class="vsm-local-loop" d="M411 ${y} C407 ${y + 20} 390 ${y + 28} 363 ${y + 10}"></path>
            <rect class="vsm-s1-label" x="412" y="${y - 25}" width="64" height="50" rx="10"></rect>
            <text class="vsm-s1-label-text" x="444" y="${y + 7}">1${String.fromCharCode(97 + index)}</text>
          `).join("")}
        </g>

        ${renderSystemGroup("1", activeSystem, counts, `
          <rect class="vsm-hit-area" x="280" y="345" width="206" height="342" rx="28"></rect>
          <text class="vsm-s1-zone-label" x="383" y="718">S1</text>
        `, !includeSystem1)}
      </svg>
      <p class="vsm-diagram-selection">
        <strong>${escapeHtml(systemLabels[activeSystem] || activeSystem)}</strong>
        <span>${activeCount} mapped contribution${activeCount === 1 ? "" : "s"} · Select a system in the diagram.</span>
      </p>
    </div>
  `;
}

export function getVsmSystemLabel(systemId) {
  return systemLabels[systemId] || `S${systemId}`;
}

function renderSystemGroup(systemId, activeSystem, counts, content, disabled = false) {
  const count = Number(counts?.[systemId] || 0);
  return `
    <g
      class="vsm-system-target vsm-system-target-${escapeAttr(systemId.replace("*", "star"))} ${activeSystem === systemId ? "is-active" : ""} ${disabled ? "is-disabled" : ""}"
      data-action="select-step5-system"
      data-system="${escapeAttr(systemId)}"
      role="button"
      tabindex="${disabled ? "-1" : "0"}"
      aria-label="${escapeAttr(`${systemLabels[systemId]}: ${count} mapped contribution${count === 1 ? "" : "s"}`)}"
    >
      ${content}
    </g>
  `;
}
