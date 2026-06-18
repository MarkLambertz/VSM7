const boundaryVisualImage = "./src/presentation/assets/step1-recursion-segmentation.jpg?v=20260530";

const visualCaptions = {
  boundary: "Define the system boundary and identify candidate S1 units.",
  segmentation: "Compare the most common segmentation logics before evaluating them.",
  criteria: "Translate customer choice into weighted buying criteria.",
  sixpack: "Connect strategic ambitions to the six control variables.",
  heatmap: "Make strong and weak segmentation patterns visible.",
  variety: "Compare horizontal and vertical variety for overload risk.",
  sct: "Turn complexity drivers into permanent success-critical tasks.",
  accountability: "Test affordability, customer value, synergy, and subsidiarity.",
  vsm: "Design the steering system through real R0 SCT contributions.",
  channels: "Evaluate whether communication loops are robust enough.",
  roles: "Connect roles, entities, meetings, and SCT accountability.",
  roadmap: "Stage implementation work across now, next, and later."
};

export function renderMethodVisual(visual, mode = "normal") {
  const kind = visual.visualKind || visual.kind || "generic";
  const title = visual.visual || visual.title || "Method visual";
  const items = (visual.visualItems || visual.items || []).slice(0, 6);
  const caption = visual.caption || visualCaptions[kind] || "Workshop method visual.";
  const modeClass = mode === "fullscreen" ? "fullscreen-visual-slot fullscreen-visual-card" : "";

  if (kind === "boundary") {
    return `
      <aside class="step1-visual-slot method-visual method-visual-image ${modeClass}" aria-label="${escapeAttr(title)} method visual">
        <img
          src="${escapeAttr(boundaryVisualImage)}"
          alt="Recursion and segmentation method visual showing R+1 parent system, R0 System-in-Focus, S1 units, and R-1 nested systems."
        >
      </aside>
    `;
  }

  return `
    <aside class="step1-visual-slot method-visual ${modeClass} method-visual--${escapeAttr(kind)}" aria-label="${escapeAttr(title)} method visual">
      ${renderVisualBody(kind, items)}
      <div class="method-visual-caption">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(caption)}</small>
      </div>
    </aside>
  `;
}

function renderVisualBody(kind, items) {
  const renderers = {
    segmentation: renderSegmentationVisual,
    criteria: renderCriteriaVisual,
    sixpack: renderSixPackVisual,
    heatmap: renderHeatmapVisual,
    variety: renderVarietyVisual,
    sct: renderSctVisual,
    accountability: renderAccountabilityVisual,
    vsm: renderVsmMapVisual,
    channels: renderChannelsVisual,
    roles: renderRolesVisual,
    roadmap: renderRoadmapVisual
  };

  return renderers[kind]?.(items) || renderGenericVisual(items);
}

function renderSegmentationVisual() {
  const cards = [
    ["01", "Regional", "Decompose by geography", "map", "blue"],
    ["02", "Product", "Decompose by product / service", "cube", "green"],
    ["03", "Customer", "Decompose by customer segment", "users", "amber"],
    ["04", "Function", "Decompose by business function", "gear", "red"]
  ];

  return `
    <div class="visual-card-grid visual-card-grid-two">
      ${cards.map(([number, title, subtitle, icon, tone]) => `
        <div class="visual-method-card is-${tone}">
          <span class="visual-number">${number}</span>
          <div>
            <strong>${escapeHtml(title)}</strong>
            <small>${escapeHtml(subtitle)}</small>
          </div>
          <span class="visual-icon visual-icon-${icon}" aria-hidden="true"></span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderCriteriaVisual() {
  const criteria = [
    ["Quality", "30%", "82"],
    ["Speed", "25%", "66"],
    ["Service", "20%", "74"],
    ["Cost", "25%", "54"]
  ];

  return `
    <div class="visual-slider-stack">
      ${criteria.map(([label, weight, value], index) => `
        <div class="visual-slider-row is-${toneName(index)}">
          <div><strong>${escapeHtml(label)}</strong><small>${escapeHtml(weight)} weight</small></div>
          <span class="visual-slider-track"><span style="width: ${escapeAttr(value)}%"></span></span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSixPackVisual() {
  const variables = ["Market", "Innovation", "Productivity", "People", "Profit", "Cash"];

  return `
    <div class="visual-compass">
      <span class="visual-compass-center">SIF</span>
      ${variables.map((variable, index) => `
        <span class="visual-compass-node is-${toneName(index)}" style="--i: ${index}">${escapeHtml(variable)}</span>
      `).join("")}
    </div>
  `;
}

function renderHeatmapVisual() {
  const cells = [
    "high", "mid", "low", "high",
    "mid", "high", "mid", "low",
    "low", "mid", "high", "high"
  ];

  return `
    <div class="visual-heatmap">
      <div class="visual-heatmap-header"><span>Option A</span><span>Option B</span><span>Option C</span><span>Option D</span></div>
      <div class="visual-heatmap-cells">
        ${cells.map((cell, index) => `<span class="is-${cell}">${index % 4 === 0 ? String(Math.floor(index / 4) + 1) : ""}</span>`).join("")}
      </div>
      <div class="visual-total-bar"><span></span><span></span><span></span><span></span></div>
    </div>
  `;
}

function renderVarietyVisual() {
  return `
    <div class="visual-balance">
      <div class="visual-balance-pan is-blue"><strong>Horizontal</strong><small>operative variety</small></div>
      <span class="visual-balance-beam"></span>
      <span class="visual-balance-stand"></span>
      <span class="visual-balance-base"></span>
      <div class="visual-balance-pan is-amber"><strong>Vertical</strong><small>management variety</small></div>
      <div class="visual-remedy-triangle"><strong>Levers</strong><small>reduce · absorb · recurse</small></div>
    </div>
  `;
}

function renderSctVisual() {
  const drivers = ["Drivers", "Overlaps", "Dependencies", "Weak scores"];

  return `
    <div class="visual-sct">
      <div class="visual-funnel">
        ${drivers.map((driver, index) => `<span class="is-${toneName(index)}">${escapeHtml(driver)}</span>`).join("")}
      </div>
      <div class="visual-sct-spine">
        <span>SCT 01</span><span>SCT 02</span><span>SCT 03</span>
      </div>
    </div>
  `;
}

function renderAccountabilityVisual() {
  const decisions = [
    ["1", "Afford decentralization?", "No", "Central"],
    ["2", "Key buying criterion?", "Yes", "Decentral"],
    ["3", "Relevant synergy?", "Yes", "Central"]
  ];

  return `
    <div class="visual-central-decentral-flow">
      ${decisions.map(([number, question, answer, result], index) => `
        <div class="visual-decision-row is-${toneName(index)}">
          <span class="visual-decision-number">${escapeHtml(number)}</span>
          <strong>${escapeHtml(question)}</strong>
          <span class="visual-decision-route">
            <b>${escapeHtml(answer)}</b>
            <small class="${result === "Central" ? "is-central" : "is-decentral"}">${escapeHtml(result)}</small>
          </span>
        </div>
      `).join("")}
      <p><strong>Default:</strong> Decentral by subsidiarity</p>
    </div>
  `;
}

function renderVsmMapVisual() {
  const layers = ["S5 Policy", "S4 Future", "S3 Control", "S3* Monitor", "S2 Coordinate", "S1 Operate"];

  return `
    <div class="visual-meeting-layers">
      ${layers.map((layer, index) => `
        <div class="visual-meeting-layer is-${toneName(index)}">
          <strong>${escapeHtml(layer)}</strong>
          <span></span><span></span><span></span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderChannelsVisual() {
  return `
    <div class="visual-channel-loop">
      <div class="visual-loop-ring"><span>Loop</span></div>
      <div class="visual-channel-radar">
        ${["Capacity", "Intelligibility", "Synchronicity", "Security"].map((item, index) => `
          <span class="is-${toneName(index)}">${escapeHtml(item)}</span>
        `).join("")}
      </div>
    </div>
  `;
}

function renderRolesVisual() {
  const nodes = ["Role", "Entity", "Meeting", "RASIC"];

  return `
    <div class="visual-constellation">
      <span class="visual-constellation-center">SCT</span>
      ${nodes.map((node, index) => `
        <span class="visual-constellation-node is-${toneName(index)}" style="--i: ${index}">${escapeHtml(node)}</span>
      `).join("")}
    </div>
  `;
}

function renderRoadmapVisual() {
  return `
    <div class="visual-roadmap">
      ${["Now", "Next", "Later"].map((phase, index) => `
        <div class="visual-roadmap-phase is-${toneName(index)}">
          <strong>${escapeHtml(phase)}</strong>
          <span></span><span></span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderGenericVisual(items) {
  const safeItems = items.length > 0 ? items : ["Focus", "Inputs", "Decisions", "Outcome"];

  return `
    <div class="method-visual-map">
      ${safeItems.map((item, index) => `
        <span class="method-node is-${toneName(index)}">${escapeHtml(item)}</span>
      `).join("")}
    </div>
  `;
}

function toneName(index) {
  return ["blue", "green", "amber", "red", "teal", "neutral"][index % 6];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
