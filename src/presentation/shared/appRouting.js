const routeViews = new Set([
  "start",
  "projects",
  "vsm",
  "overview",
  "step1",
  "step2",
  "step3",
  "step4",
  "step5",
  "step6",
  "step7",
  "implementation"
]);

const step1Routes = new Set(["sif", "segmentation", "criteria", "six-pack", "evaluation"]);
const step2Routes = new Set(["assessment", "challenges"]);
const step3Routes = new Set(["signals", "drivers", "register"]);
const step5Systems = new Set(["1", "2", "3", "3*", "4", "5"]);
const step6Routes = new Set(["e2e", "channels"]);
const step7Routes = new Set(["7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7"]);

export function parseAppHash(hash) {
  const parts = normalizeHashParts(hash);
  const view = parts[0] || "start";

  if (!routeViews.has(view)) {
    return { view: "start" };
  }

  const route = { view };
  if (view === "step1") {
    route.step1Subpage = step1Routes.has(parts[1]) ? parts[1] : "sif";
  }
  if (view === "step2") {
    route.step2Subpage = step2Routes.has(parts[1]) ? parts[1] : "assessment";
  }
  if (view === "step3") {
    route.step3Subpage = step3Routes.has(parts[1]) ? parts[1] : "signals";
  }
  if (view === "step5") {
    route.step5System = normalizeStep5System(parts[1]);
  }
  if (view === "step6") {
    route.step6Subpage = step6Routes.has(parts[1]) ? parts[1] : "e2e";
  }
  if (view === "step7") {
    route.step7Substep = step7Routes.has(parts[1]) ? parts[1] : "7.1";
  }

  return route;
}

export function buildAppHash(state = {}) {
  const view = routeViews.has(state.view) ? state.view : "start";

  if (view === "step1") {
    return `#/step1/${encodeURIComponent(step1Routes.has(state.step1Subpage) ? state.step1Subpage : "sif")}`;
  }

  if (view === "step2") {
    return `#/step2/${encodeURIComponent(step2Routes.has(state.step2Subpage) ? state.step2Subpage : "assessment")}`;
  }

  if (view === "step3") {
    return `#/step3/${encodeURIComponent(step3Routes.has(state.step3Subpage) ? state.step3Subpage : "signals")}`;
  }

  if (view === "step5") {
    return `#/step5/${encodeURIComponent(formatStep5System(state.step5System))}`;
  }

  if (view === "step6") {
    return `#/step6/${encodeURIComponent(step6Routes.has(state.step6Subpage) ? state.step6Subpage : "e2e")}`;
  }

  if (view === "step7") {
    return `#/step7/${encodeURIComponent(step7Routes.has(state.step7Substep) ? state.step7Substep : "7.1")}`;
  }

  return `#/${view}`;
}

function normalizeHashParts(hash) {
  return String(hash || "")
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch (_) {
        return part;
      }
    });
}

function normalizeStep5System(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/^SYSTEM-?/, "")
    .replace(/^S/, "");
  return step5Systems.has(normalized) ? normalized : "3";
}

function formatStep5System(value) {
  const normalized = normalizeStep5System(value);
  return `S${normalized}`;
}
