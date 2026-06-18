import {
  createAllocation,
  createImplementationItem,
  createKeyBuyingCriterion,
  createManageabilityOption,
  createOperativeUnit,
  createRecursionLevel,
  createRole,
  createSegmentationOption,
  createStrategicFile,
  createStrategicField,
  createStrategicLink,
  createNumberedSuccessCriticalTask,
  createWorkspace,
  canCompleteStep,
  evaluateStep2Variety,
  isStepComplete,
  markStep2SliderAssessed,
  mergeSuccessCriticalTasks,
  removeStep5TaskAssignments,
  resetStep2SlidersToNeutral,
  setStepCompletion,
  splitSuccessCriticalTask,
  stepDefinitions,
  syncAllocations,
  taskSources,
  toggleStep5ContributionAssignment,
  vsmSystems,
  workflowStepOrder
} from "../domain/vsm.js";
import {
  deleteOrganization,
  deleteWorkspace,
  listWorkspaces,
  loadWorkspace,
  openWorkspace,
  renameOrganization,
  renameWorkspace,
  replaceWorkspace,
  saveWorkspace
} from "../application/workspaceService.js";
import { createSampleWorkspace } from "../application/sampleWorkspaceFactory.js";
import { createLocalStorageRepository } from "../infrastructure/localStorageRepository.js";
import { exportProjectJson, exportProjectReport, exportStepOutcome } from "../infrastructure/exporters.js";
import { renderRenameDialog } from "./renameDialog.js";
import { destructiveActionMessage } from "./shared/destructiveActions.js";
import { escapeAttr, escapeHtml } from "./shared/renderHelpers.js";
import { renderProjectManagement } from "./projectManagement.js";
import { applySkinPreference, defaultSkin, readSkinPreference } from "./skinSettings.js";
import { renderStartPage } from "./startPage.js";
import { renderOverview } from "./steps/overview.js";
import { renderImplementation } from "./steps/implementation.js";
import {
  focusStepOrder,
  getGenericFocusStepTitle,
  getGenericFocusTileCount,
  hasGenericFocusMode,
  renderGenericFocusFullscreen
} from "./steps/focusMode.js?v=20260618-step5-copy-remove";
import { getStep1FullscreenTileCount, renderStep1, renderStep1Fullscreen, step1Subpages } from "./steps/step1.js";
import { renderStep2 } from "./steps/step2.js";
import { filterScts, renderStep3 } from "./steps/step3.js";
import { renderStep4 } from "./steps/step4.js";
import { renderStep5 } from "./steps/step5.js?v=20260618-step5-copy-remove";
import { renderStep6 } from "./steps/step6.js";
import { renderStep7 } from "./steps/step7.js";
import { renderVsmStandalone } from "./vsmStandalone.js";
import {
  buildVsmHostTree,
  getVsmSystemType,
  recursionLevelLabel,
  recursionLevelValue
} from "./shared/vsmHostBridge.js";

const app = document.querySelector("#app");
const repository = createLocalStorageRepository();
const maxEmbeddedFileSize = 1_000_000;
let workspace = loadWorkspace(repository);
if (listWorkspaces(repository).length === 0) {
  saveWorkspace(repository, workspace);
}
let activeView = "start";
let selectedOrganizationId = workspace.organization.id || "";
let activeStep1Subpage = "sif";
let isFocusFullscreen = false;
let activeStep1FullscreenTile = 0;
let activeGenericFocusTile = 0;
let selectedSctId = "";
let selectedSctMergeIds = new Set();
let sctPriorityFilter = "";
let sctSourceFilter = "";
let activeStep5System = "3";
let isSettingsOpen = false;
let renameTarget = null;
let isNavCollapsed = false;
let activeSkin = applySkinPreference(readSkinPreference());
let saveStatus = "Saved";
let saveTimer = null;
let lastAction = { button: null, at: 0 };
const vsmFramePaths = {
  standalone: [],
  step5: []
};
const vsmFramePaneVisibility = {
  standalone: undefined,
  step5: false
};

window.addEventListener("message", handleVsmBridgeMessage);
render();

app.addEventListener("input", (event) => {
  void handleInput(event.target);
  if (event.target instanceof HTMLElement && event.target.dataset.renameDraft !== undefined) {
    return;
  }
  updateVarietyPreview(event.target);
  updateCharacterCounter(event.target);
  scheduleSave();
});

app.addEventListener("change", async (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.sctFilter) {
    updateSctFilter(event.target.dataset.sctFilter, event.target.value);
    renderAfterInPlaceAction();
    return;
  }

  await handleInput(event.target);
  if (event.target instanceof HTMLElement && event.target.dataset.renameDraft !== undefined) {
    return;
  }
  saveNow();
  renderAfterInPlaceAction(selectedSctId);
});

app.addEventListener("click", dispatchAction);

app.addEventListener("keydown", (event) => {
  if (renameTarget && event.key === "Enter" && event.target instanceof HTMLElement && event.target.dataset.renameDraft !== undefined) {
    event.preventDefault();
    confirmRename();
    return;
  }

  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  dispatchAction(event);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (renameTarget) {
    event.preventDefault();
    renameTarget = null;
    render();
    return;
  }

  if (!isFocusFullscreen) {
    return;
  }

  event.preventDefault();
  isFocusFullscreen = false;
  render();
});

function render() {
  syncAllocations(workspace);
  const taskIds = new Set(workspace.step3.successCriticalTasks.map((task) => task.id));
  selectedSctMergeIds = new Set([...selectedSctMergeIds].filter((taskId) => taskIds.has(taskId)));
  if (selectedSctId && !workspace.step3.successCriticalTasks.some((task) => task.id === selectedSctId)) {
    selectedSctId = "";
  }
  document.body.classList.toggle("has-fullscreen-workshop", isFocusFullscreen);
  const projects = listWorkspaces(repository);
  selectedOrganizationId = normalizeSelectedOrganization(projects);
  const showStepNavigation = activeView !== "start" && activeView !== "projects" && activeView !== "vsm";

  app.innerHTML = `
    <header class="topbar">
      <div class="brand-block">
        ${renderBrandMark()}
        <strong class="brand-name">VSM7</strong>
      </div>
      <div class="topbar-context">
        ${headerContextItem("Organization", workspace.organization.name || "New Organization")}
        ${headerContextItem("Project", workspace.project.name || "New VSM Project")}
        ${headerContextItem("SIF", workspace.sif.name || "System-in-Focus")}
      </div>
      <div class="topbar-actions">
        ${renderSaveIndicator()}
        ${renderTopbarVsmButton()}
        ${renderTopbarFocusButton()}
        ${renderTopbarMenu()}
        ${renderSettingsTrigger()}
      </div>
      ${isSettingsOpen ? renderSettingsLayer() : ""}
    </header>
    <div class="workspace-layout ${showStepNavigation ? "" : "no-rail"} ${isNavCollapsed ? "nav-collapsed" : ""}">
      ${showStepNavigation ? renderNavigation() : ""}
      <main class="main-surface">
        ${renderActiveView(projects)}
        ${renderFlowFooter()}
      </main>
    </div>
    ${renderFocusFullscreenLayer()}
    ${renderRenameDialog(renameTarget)}
  `;
  syncVisibleVsmFrames();
}

function renderPreservingViewport(anchorSctId = "") {
  const scrollPosition = { x: window.scrollX, y: window.scrollY };
  const preservedScrollRegions = capturePreservedScrollRegions();
  const anchorTop = findSctRow(anchorSctId)?.getBoundingClientRect().top;
  render();

  restorePreservedScrollRegions(preservedScrollRegions);
  window.scrollTo(scrollPosition.x, scrollPosition.y);
  window.requestAnimationFrame(() => {
    restorePreservedScrollRegions(preservedScrollRegions);
    const renderedAnchor = findSctRow(anchorSctId);
    const anchorOffset = renderedAnchor && Number.isFinite(anchorTop)
      ? renderedAnchor.getBoundingClientRect().top - anchorTop
      : 0;
    window.scrollTo(scrollPosition.x, scrollPosition.y + anchorOffset);
  });
}

function renderAfterInPlaceAction(anchorSctId = "") {
  if (isFocusFullscreen) {
    render();
  } else {
    renderPreservingViewport(anchorSctId);
  }
}

function syncVisibleVsmFrames() {
  document.querySelectorAll("[data-vsm-frame]").forEach((frame) => {
    if (!(frame instanceof HTMLIFrameElement)) {
      return;
    }

    if (!frame.dataset.vsmHostWired) {
      frame.dataset.vsmHostWired = "true";
      frame.addEventListener("load", () => syncVsmFrame(frame));
    }
  });
}

function handleVsmBridgeMessage(event) {
  const frame = findVsmFrameForSource(event.source);
  const message = event.data;

  if (!frame || !message || typeof message !== "object" || !message.evt) {
    return;
  }

  const context = getVsmFrameContext(frame);

  if (message.evt === "ready") {
    syncVsmFrame(frame);
    return;
  }

  if (message.evt === "paneVisibilityChanged") {
    if ((message.pane || "details") === "details" && typeof message.visible === "boolean") {
      vsmFramePaneVisibility[context] = message.visible;
      updateVsmPaneToggleButtons(context);
    }
    return;
  }

  if (message.evt === "elementClick") {
    handleVsmElementClick(message, context);
    return;
  }

  if (message.evt === "mutate") {
    handleVsmMutation(message, frame, context);
    return;
  }

  if (message.evt === "drill" || message.evt === "zoom") {
    vsmFramePaths[context] = Array.isArray(message.path) ? message.path : [];
  }
}

function findVsmFrameForSource(source) {
  return [...document.querySelectorAll("[data-vsm-frame]")]
    .find((frame) => frame instanceof HTMLIFrameElement && frame.contentWindow === source) || null;
}

function getVsmFrameContext(frame) {
  return frame.dataset.vsmContext === "step5" ? "step5" : "standalone";
}

function syncVsmFrame(frame) {
  const { tree, pathIds } = buildVsmHostTree(workspace);
  const context = getVsmFrameContext(frame);
  const path = vsmFramePaths[context]?.length ? vsmFramePaths[context] : pathIds;

  postToVsmFrame(frame, { cmd: "loadTree", tree });
  postToVsmFrame(frame, { cmd: "setPath", ids: path });
  postToVsmFrame(frame, {
    cmd: "setChannels",
    shown: { a: true, b: true, c: true, d: true, e: true, f: true, g: false, env: true, meta: true }
  });

  if (context === "step5") {
    postToVsmFrame(frame, { cmd: "select", type: activeStep5System });
  }

  if (typeof vsmFramePaneVisibility[context] === "boolean") {
    postToVsmFrame(frame, {
      cmd: "setPaneVisibility",
      pane: "details",
      visible: vsmFramePaneVisibility[context]
    });
    updateVsmPaneToggleButtons(context);
  }
}

function postToVsmFrame(frame, message) {
  frame.contentWindow?.postMessage(message, "*");
}

function syncVsmPaneVisibility(context) {
  document.querySelectorAll(`[data-vsm-frame][data-vsm-context="${context}"]`).forEach((frame) => {
    if (frame instanceof HTMLIFrameElement) {
      postToVsmFrame(frame, {
        cmd: "setPaneVisibility",
        pane: "details",
        visible: vsmFramePaneVisibility[context] === true
      });
    }
  });
  updateVsmPaneToggleButtons(context);
}

function updateVsmPaneToggleButtons(context) {
  const visible = vsmFramePaneVisibility[context] === true;
  document.querySelectorAll(`[data-action="toggle-vsm-details-pane"][data-vsm-context="${context}"]`).forEach((button) => {
    button.setAttribute("aria-pressed", String(visible));
    button.textContent = visible ? "Hide pane" : "Show pane";
  });
}

function handleVsmElementClick(message, context) {
  const systemId = getVsmSystemType(message.type);

  if (context !== "step5" || !systemId) {
    return;
  }

  if (systemId === "1" && workspace.step5.includeSystem1 === false) {
    return;
  }

  activeStep5System = systemId;
  renderAfterInPlaceAction();
}

function handleVsmMutation(message, frame, context) {
  if (message.op === "rename") {
    if (renameVsmHostUnit(message.hostId, message.name)) {
      saveNow();
      renderAfterInPlaceAction();
    } else {
      syncVsmFrame(frame);
    }
    return;
  }

  if (message.op === "add") {
    addRecursionOrganizationFromVsm(message.parentId, message.name);
    vsmFramePaths[context] = Array.isArray(message.path) ? message.path : [];
    saveNow();
    renderAfterInPlaceAction();
    return;
  }

  if (message.op === "remove") {
    const unit = findVsmHostUnitById(message.hostId);
    if (!unit) {
      syncVsmFrame(frame);
      return;
    }

    const confirmed = window.confirm(`Delete "${unit.item.name || unit.item.level || "this unit"}" from the VSM structure? Existing workshop notes that reference this unit stay in the project data, but the unit will no longer be shown.`);
    if (!confirmed) {
      syncVsmFrame(frame);
      return;
    }

    if (unit.kind === "operative") {
      workspace.step1.operativeUnits = workspace.step1.operativeUnits.filter((item) => item.id !== unit.item.id);
    } else {
      workspace.step1.recursionLevels = workspace.step1.recursionLevels.filter((item) => item.id !== unit.item.id);
    }
    saveNow();
    renderAfterInPlaceAction();
    return;
  }

  if (message.op === "reorder") {
    reorderVsmHostUnits(message.order);
    vsmFramePaths[context] = Array.isArray(message.path) ? message.path : [];
    saveNow();
    renderAfterInPlaceAction();
  }
}

function renameVsmHostUnit(hostId, name) {
  const unit = findVsmHostUnitById(hostId);
  if (!unit) {
    return false;
  }

  unit.item.name = String(name || "").trim() || unit.item.name;
  return true;
}

function renameRecursionOrganization(organizationId, name) {
  const organization = findRecursionOrganizationById(organizationId);
  if (!organization) {
    return false;
  }

  organization.name = String(name || "").trim() || organization.name;
  return true;
}

function addRecursionOrganizationFromVsm(parentId, name) {
  const parent = findRecursionOrganizationById(parentId);
  if (!parent || recursionLevelValue(parent.level) === 0) {
    workspace.step1.operativeUnits.push(createOperativeUnit(String(name || "New S1").trim() || "New S1", ""));
    return;
  }

  const parentLevel = parent ? recursionLevelValue(parent.level) : 0;
  const childLevel = recursionLevelLabel(parentLevel - 1);
  workspace.step1.recursionLevels.push(createRecursionLevel(childLevel, String(name || "New unit").trim() || "New unit", ""));
  workspace.step1.recursionLevels.sort((left, right) => recursionRank(left.level) - recursionRank(right.level));
}

function reorderVsmHostUnits(order) {
  if (reorderOperativeUnits(order)) {
    return;
  }

  reorderRecursionOrganizations(order);
}

function reorderOperativeUnits(order) {
  if (!Array.isArray(order) || order.length === 0 || !Array.isArray(workspace.step1.operativeUnits)) {
    return false;
  }

  const orderedIds = order.map(String);
  const operativeIds = new Set(workspace.step1.operativeUnits.map((item) => String(item.id)));
  const matchingIds = orderedIds.filter((id) => operativeIds.has(id));
  if (matchingIds.length === 0) {
    return false;
  }

  const orderedSet = new Set(matchingIds);
  const orderedItems = matchingIds
    .map((id) => workspace.step1.operativeUnits.find((item) => String(item.id) === id))
    .filter(Boolean);
  let cursor = 0;

  workspace.step1.operativeUnits = workspace.step1.operativeUnits.map((item) => {
    if (!orderedSet.has(String(item.id))) {
      return item;
    }

    return orderedItems[cursor++] || item;
  });
  return true;
}

function reorderRecursionOrganizations(order) {
  if (!Array.isArray(order) || order.length === 0) {
    return;
  }

  const orderedIds = order.map(String);
  const orderedSet = new Set(orderedIds);
  const orderedItems = orderedIds
    .map((id) => workspace.step1.recursionLevels.find((item) => String(item.id) === id))
    .filter(Boolean);
  let cursor = 0;

  workspace.step1.recursionLevels = workspace.step1.recursionLevels.map((item) => {
    if (!orderedSet.has(String(item.id))) {
      return item;
    }

    return orderedItems[cursor++] || item;
  });
}

function findRecursionOrganizationById(organizationId) {
  return workspace.step1.recursionLevels.find((item) => String(item.id) === String(organizationId)) || null;
}

function findOperativeUnitById(unitId) {
  return (workspace.step1.operativeUnits || []).find((item) => String(item.id) === String(unitId)) || null;
}

function findVsmHostUnitById(hostId) {
  const operativeUnit = findOperativeUnitById(hostId);
  if (operativeUnit) {
    return { kind: "operative", item: operativeUnit };
  }

  const organization = findRecursionOrganizationById(hostId);
  if (organization) {
    return { kind: "recursion", item: organization };
  }

  return null;
}

function capturePreservedScrollRegions() {
  return [...document.querySelectorAll("[data-preserve-scroll]")].map((element, index) => ({
    key: element.dataset.preserveScroll,
    index,
    left: element.scrollLeft,
    top: element.scrollTop
  }));
}

function restorePreservedScrollRegions(regions) {
  const elements = [...document.querySelectorAll("[data-preserve-scroll]")];
  regions.forEach((region) => {
    const element = elements.find((candidate, index) => (
      candidate.dataset.preserveScroll === region.key && index === region.index
    ));
    if (element) {
      element.scrollLeft = region.left;
      element.scrollTop = region.top;
    }
  });
}

function findSctRow(taskId) {
  if (!taskId) {
    return null;
  }

  return [...document.querySelectorAll(".sct-compact-row")]
    .find((row) => row.dataset.sctId === taskId) || null;
}

function renderTopbarMenu() {
  return `
    <details class="topbar-menu">
      <summary class="ghost-button" role="button" aria-label="Open workspace menu">More</summary>
      <div class="topbar-menu-panel">
        <button class="ghost-button ${activeView === "start" ? "is-active" : ""}" data-action="navigate" data-view="start">Start</button>
        <button class="ghost-button ${activeView === "projects" ? "is-active" : ""}" data-action="navigate" data-view="projects">Projects</button>
        <button class="ghost-button" data-action="export-project-report">Report</button>
        <button class="ghost-button" data-action="export-project-json">Archive</button>
      </div>
    </details>
  `;
}

function renderTopbarVsmButton() {
  return `
    <button
      class="ghost-button topbar-vsm-button ${activeView === "vsm" ? "is-active" : ""}"
      data-action="navigate"
      data-view="vsm"
      title="Open VSM system map"
      aria-label="Open standalone VSM system map"
    >VSM</button>
  `;
}

function renderSettingsTrigger() {
  return `
    <button
      class="topbar-settings-button ${isSettingsOpen ? "is-active" : ""}"
      data-action="toggle-settings"
      title="Interface settings"
      aria-label="Open interface settings"
      aria-expanded="${isSettingsOpen ? "true" : "false"}"
    >
      <span aria-hidden="true">⚙</span>
    </button>
  `;
}

function renderSettingsLayer() {
  return `
    <section class="settings-layer" aria-label="Interface settings">
      <div class="settings-layer-header">
        <div>
          <p class="eyebrow">Interface settings</p>
          <h2>Choose your VSM7 skin</h2>
        </div>
        <button class="icon-button" data-action="close-settings" title="Close" aria-label="Close interface settings">x</button>
      </div>
      <div class="skin-choice-grid" role="radiogroup" aria-label="VSM7 interface skin">
        ${renderSkinChoice("workshop", "Workshop", "Bright, calm, facilitation-first")}
        ${renderSkinChoice("command-deck", "Command Deck", "High-contrast, segmented, focused")}
      </div>
      <div class="settings-layer-footer">
        <span>Applied across VSM7</span>
        <button class="ghost-button small" data-action="reset-skin">Reset default</button>
      </div>
    </section>
  `;
}

function renderSkinChoice(skin, name, description) {
  const isActive = activeSkin === skin;

  return `
    <button
      class="skin-choice skin-choice-${skin} ${isActive ? "is-active" : ""}"
      data-action="select-skin"
      data-skin="${skin}"
      role="radio"
      aria-checked="${isActive ? "true" : "false"}"
    >
      <span class="skin-preview" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </span>
      <span class="skin-choice-copy">
        <strong>${name}</strong>
        <small>${description}</small>
      </span>
      <span class="skin-choice-check" aria-hidden="true">${isActive ? "✓" : ""}</span>
    </button>
  `;
}

function renderBrandMark() {
  return `
    <span class="brand-mark" role="img" aria-label="VSM7 viable system diagram">
      <img src="./src/presentation/assets/vsm-system-logo.png?v=20260530" alt="">
    </span>
  `;
}

function renderFocusFullscreenLayer() {
  if (!isFocusFullscreen) {
    return "";
  }

  if (activeView === "step1") {
    return renderStep1FullscreenLayer();
  }

  if (hasGenericFocusMode(activeView)) {
    return renderGenericFocusFullscreenLayer();
  }

  return "";
}

function renderStep1FullscreenLayer() {
  const tileCount = getStep1FullscreenTileCount(workspace, activeStep1Subpage);
  const safeTileIndex = clampStep1FullscreenTile(activeStep1FullscreenTile, tileCount);
  const canMoveBack = canMoveStep1Fullscreen("prev", safeTileIndex, tileCount);
  const canMoveForward = canMoveStep1Fullscreen("next", safeTileIndex, tileCount);

  return `
    <section class="step1-fullscreen-overlay" aria-label="Step I fullscreen focus mode">
      <button class="fullscreen-exit-button" data-action="step1-fullscreen-close" title="Exit fullscreen focus mode" aria-label="Exit fullscreen focus mode">x</button>
      ${renderStep1Fullscreen(workspace, activeStep1Subpage, safeTileIndex)}
      <div class="fullscreen-nav-controls" aria-label="Fullscreen tile navigation">
        <button class="ghost-button" data-action="step1-fullscreen-prev" ${canMoveBack ? "" : "disabled"}>Back</button>
        <span>${safeTileIndex + 1} / ${tileCount}</span>
        <button class="primary-button" data-action="step1-fullscreen-next" ${canMoveForward ? "" : "disabled"}>Forward</button>
      </div>
    </section>
  `;
}

function renderGenericFocusFullscreenLayer() {
  const tileCount = getGenericFocusTileCount(workspace, activeView, getGenericFocusContext());
  const safeTileIndex = clampFocusTile(activeGenericFocusTile, tileCount);
  const canMoveBack = canMoveGenericFocus("prev", safeTileIndex, tileCount);
  const canMoveForward = canMoveGenericFocus("next", safeTileIndex, tileCount);

  return `
    <section class="step1-fullscreen-overlay" aria-label="${escapeAttr(getGenericFocusStepTitle(activeView))} fullscreen focus mode">
      <button class="fullscreen-exit-button" data-action="focus-fullscreen-close" title="Exit fullscreen focus mode" aria-label="Exit fullscreen focus mode">x</button>
      ${renderGenericFocusFullscreen(workspace, activeView, safeTileIndex, getGenericFocusContext())}
      <div class="fullscreen-nav-controls" aria-label="Fullscreen tile navigation">
        <button class="ghost-button" data-action="focus-fullscreen-prev" ${canMoveBack ? "" : "disabled"}>Back</button>
        <span>${safeTileIndex + 1} / ${tileCount}</span>
        <button class="primary-button" data-action="focus-fullscreen-next" ${canMoveForward ? "" : "disabled"}>Forward</button>
      </div>
    </section>
  `;
}

function clampStep1FullscreenTile(tileIndex, tileCount) {
  return Math.min(Math.max(Number(tileIndex) || 0, 0), Math.max(tileCount - 1, 0));
}

function clampFocusTile(tileIndex, tileCount) {
  return Math.min(Math.max(Number(tileIndex) || 0, 0), Math.max(tileCount - 1, 0));
}

function getGenericFocusContext() {
  return {
    taskSources,
    vsmSystems,
    selectedSctId,
    selectedSctMergeIds: [...selectedSctMergeIds],
    sctPriorityFilter,
    sctSourceFilter,
    activeStep5System,
    vsmPaneVisible: vsmFramePaneVisibility.step5
  };
}

function canMoveStep1Fullscreen(direction, tileIndex, tileCount) {
  const subpageIndex = getActiveStep1SubpageIndex();

  if (direction === "prev") {
    return tileIndex > 0 || subpageIndex > 0;
  }

  return tileIndex < tileCount - 1 || subpageIndex < step1Subpages.length - 1 || focusStepOrder.length > 0;
}

function getActiveStep1SubpageIndex() {
  return Math.max(0, step1Subpages.findIndex((subpage) => subpage.id === activeStep1Subpage));
}

function canMoveGenericFocus(direction, tileIndex, tileCount) {
  const stepIndex = getActiveGenericFocusIndex();

  if (direction === "prev") {
    return tileIndex > 0 || stepIndex > 0 || activeView === focusStepOrder[0];
  }

  return tileIndex < tileCount - 1 || stepIndex < focusStepOrder.length - 1;
}

function getActiveGenericFocusIndex() {
  return Math.max(0, focusStepOrder.findIndex((viewId) => viewId === activeView));
}

function headerContextItem(label, value) {
  return `
    <div class="context-item">
      <span>${escapeHtml(label)}:</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderSaveIndicator() {
  return `<span class="save-indicator ${saveStatus.toLowerCase().startsWith("saved") ? "is-saved" : "is-saving"}" data-save-indicator>${escapeHtml(saveStatus)}</span>`;
}

function renderNavigation() {
  return `
    <nav class="step-rail ${isNavCollapsed ? "is-collapsed" : ""}" aria-label="VSM steps">
      ${stepDefinitions.map((step) => {
        const isComplete = step.id !== "overview" && isStepComplete(workspace, step.id);
        return `
        <button
          class="step-button ${step.id === "overview" ? "is-home" : ""} ${activeView === step.id ? "is-active" : ""} ${isComplete ? "is-complete" : ""}"
          data-action="navigate"
          data-view="${step.id === "overview" ? "start" : step.id}"
          aria-label="${escapeAttr(step.id === "overview" ? "Home" : `${navLabel(step)}${isComplete ? ", done" : ""}`)}"
        >
          ${renderStepToken(step)}
          ${step.id === "overview" ? "" : `
            <span>
              <strong>${escapeHtml(navLabel(step))}</strong>
            </span>
            <span class="step-complete-check" aria-hidden="true">${isComplete ? "✓" : ""}</span>
          `}
        </button>
      `;
      }).join("")}
      <button class="step-rail-toggle" data-action="toggle-nav">${isNavCollapsed ? "Expand" : "Collapse"}</button>
    </nav>
  `;
}

function renderStepToken(step) {
  if (step.id === "overview") {
    return `
      <span class="home-label">Home</span>
      <span class="home-icon" aria-hidden="true">
        <span></span>
      </span>
    `;
  }

  if (step.id === "implementation") {
    return `
      <span class="step-token step-token-icon" aria-label="Backlog">
        <span class="backlog-icon" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </span>
    `;
  }

  return `<span class="step-token">${escapeHtml(step.shortLabel)}</span>`;
}

function renderActiveView(projects) {
  const views = {
    start: () => renderStartPage(workspace, projects),
    vsm: () => renderVsmStandalone(workspace),
    projects: () => renderProjectManagement(workspace, projects, selectedOrganizationId),
    overview: () => renderOverview(workspace),
    step1: () => renderStep1(workspace, activeStep1Subpage),
    step2: () => renderStep2(workspace),
    step3: () => renderStep3(workspace, taskSources, vsmSystems, {
      selectedSctId: isFocusFullscreen ? "" : selectedSctId,
      selectedSctMergeIds: [...selectedSctMergeIds],
      sctPriorityFilter,
      sctSourceFilter
    }),
    step4: () => renderStep4(workspace, { sctPriorityFilter, sctSourceFilter }),
    step5: () => renderStep5(workspace, {
      activeStep5System,
      sctPriorityFilter,
      sctSourceFilter,
      vsmPaneVisible: vsmFramePaneVisibility.step5
    }),
    step6: () => renderStep6(workspace),
    step7: () => renderStep7(workspace),
    implementation: () => renderImplementation(workspace)
  };

  return (views[activeView] || views.overview)();
}

function renderTopbarFocusButton() {
  const canOpenFocusMode = activeView === "step1" || hasGenericFocusMode(activeView);
  if (!canOpenFocusMode || isFocusFullscreen) {
    return "";
  }

  const action = activeView === "step1" ? "step1-fullscreen-open" : "focus-fullscreen-open";
  const label = activeView === "step1"
    ? "Open fullscreen focus mode for Step I"
    : `Open fullscreen focus mode for ${getGenericFocusStepTitle(activeView)}`;

  return `
    <button
      class="topbar-focus-button"
      data-action="${escapeAttr(action)}"
      title="Open fullscreen focus mode"
      aria-label="${escapeAttr(label)}"
    >
      <span class="fullscreen-corners" aria-hidden="true"><span></span></span>
    </button>
  `;
}

function navLabel(step) {
  if (step.id === "overview") {
    return "Overview";
  }

  if (step.id === "implementation") {
    return "Implementation";
  }

  return step.label.replace(/^Step [IVX]+:\s*/, "");
}

function renderFlowFooter() {
  const nextAction = getNextAction();
  const isWorkflowStep = workflowStepOrder.includes(activeView);
  if (!nextAction && !isWorkflowStep) {
    return "";
  }

  return `
    <section class="flow-footer">
      ${isWorkflowStep ? renderStepCompletionControl(activeView) : ""}
      ${nextAction ? `
        <button
          class="primary-button"
          data-action="${escapeAttr(nextAction.action)}"
          ${nextAction.view ? `data-view="${escapeAttr(nextAction.view)}"` : ""}
          ${nextAction.subpage ? `data-subpage="${escapeAttr(nextAction.subpage)}"` : ""}
        >
          ${escapeHtml(nextAction.label)}
        </button>
      ` : ""}
    </section>
  `;
}

function renderStepCompletionControl(stepId) {
  const isComplete = isStepComplete(workspace, stepId);
  const canComplete = isComplete || canCompleteStep(workspace, stepId);
  const stepIndex = workflowStepOrder.indexOf(stepId);
  const previousStep = stepIndex > 0
    ? stepDefinitions.find((step) => step.id === workflowStepOrder[stepIndex - 1])
    : null;

  return `
    <div class="step-completion-control">
      <button
        class="step-completion-button ${isComplete ? "is-complete" : ""}"
        data-action="toggle-step-complete"
        data-step="${escapeAttr(stepId)}"
        aria-pressed="${isComplete ? "true" : "false"}"
        title="${escapeAttr(isComplete ? "Unmark this step and all following steps" : "Mark this step done")}"
        ${canComplete ? "" : "disabled"}
      >
        <span class="step-completion-button-check" aria-hidden="true">${isComplete ? "✓" : ""}</span>
        ${isComplete ? "Step done" : "Mark step done"}
      </button>
      ${canComplete ? "" : `<small>Mark ${escapeHtml(previousStep ? navLabel(previousStep) : "the previous step")} done first.</small>`}
    </div>
  `;
}

function getNextAction() {
  if (activeView === "step1") {
    const nextSubpages = {
      sif: { label: "Continue with Segmentation Options", subpage: "segmentation" },
      segmentation: { label: "Continue with Key Buying Criteria", subpage: "criteria" },
      criteria: { label: "Continue with Six Pack Fields", subpage: "six-pack" },
      "six-pack": { label: "Continue with Evaluation", subpage: "evaluation" },
      evaluation: { label: "Continue with Manageability", view: "step2" }
    };
    const next = nextSubpages[activeStep1Subpage];
    return next?.subpage
      ? { action: "step1-subpage", ...next }
      : { action: "navigate", ...next };
  }

  const nextByView = {
    step2: { label: "Continue with SCTs", view: "step3" },
    step3: { label: "Continue with Central/Decentral", view: "step4" },
    step4: { label: "Continue with Design Steering System", view: "step5" },
    step5: { label: "Continue with Channels", view: "step6" },
    step6: { label: "Continue with Representation", view: "step7" },
    step7: { label: "Continue with Implementation", view: "implementation" }
  };

  return nextByView[activeView] ? { action: "navigate", ...nextByView[activeView] } : null;
}

async function handleInput(target) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.dataset.renameDraft !== undefined && renameTarget) {
    renameTarget.draftName = target.value;
    return;
  }

  if (target.dataset.evaluationScore) {
    const [rowId, optionId] = target.dataset.evaluationScore.split("|");
    setEvaluationScore(rowId, optionId, target.value);
    return;
  }

  if (target.dataset.evaluationComment) {
    workspace.step1.evaluation.comments[target.dataset.evaluationComment] = target.value;
    return;
  }

  if (target.dataset.projectRename) {
    if (target.dataset.projectRename === workspace.project.id) {
      workspace.project.name = target.value;
    } else {
      renameWorkspace(repository, target.dataset.projectRename, target.value);
    }
    return;
  }

  if (target.dataset.strategicLink) {
    const [fieldId, linkId] = target.dataset.strategicLink.split("|");
    const link = findStrategicLink(fieldId, linkId);
    if (link && target.dataset.field) {
      link[target.dataset.field] = target.value;
    }
    return;
  }

  if (target.dataset.strategicFiles && target instanceof HTMLInputElement && target.files) {
    await addStrategicFiles(target.dataset.strategicFiles, Array.from(target.files));
    target.value = "";
    return;
  }

  if (target.dataset.path) {
    const value = target.type === "checkbox" ? target.checked : target.value;
    setPath(workspace, target.dataset.path, value);
    if (target.dataset.varietyDriver) {
      markStep2SliderAssessed(workspace, target.dataset.path);
    }
  }

  if (target.dataset.collection && target.dataset.id && target.dataset.field) {
    const item = findCollectionItem(target.dataset.collection, target.dataset.id);
    if (item) {
      item[target.dataset.field] = target.type === "checkbox" ? target.checked : target.value;
    }
  }

  if (target.dataset.taskLinks && target.dataset.id) {
    const item = findCollectionItem(target.dataset.taskLinks, target.dataset.id);
    if (item) {
      item.linkedTaskIds = Array.from(target.selectedOptions).map((option) => option.value);
    }
  }

  if (target.dataset.allocationContribution) {
    const [taskId, organizationId] = target.dataset.allocationContribution.split("|");
    workspace.step4.allocations[taskId] ||= createAllocation(taskId);
    workspace.step4.allocations[taskId].contributions ||= {};
    workspace.step4.allocations[taskId].contributions[organizationId] = target.value;
  }
}

function setEvaluationScore(rowId, optionId, value) {
  workspace.step1.evaluation ||= { scores: {}, comments: {} };
  workspace.step1.evaluation.scores[rowId] ||= {};

  if (!value) {
    delete workspace.step1.evaluation.scores[rowId][optionId];
    return;
  }

  const duplicate = Object.entries(workspace.step1.evaluation.scores[rowId])
    .some(([existingOptionId, existingValue]) => existingOptionId !== optionId && String(existingValue) === String(value));

  if (duplicate) {
    delete workspace.step1.evaluation.scores[rowId][optionId];
    return;
  }

  workspace.step1.evaluation.scores[rowId][optionId] = value;
}

function dispatchAction(event) {
  const eventTarget = event.target instanceof Element ? event.target : null;
  const button = eventTarget?.closest("[data-action]");
  if (!button) {
    return;
  }

  const now = performance.now();
  if (lastAction.button === button && now - lastAction.at < 250) {
    return;
  }

  lastAction = { button, at: now };
  event.preventDefault();
  handleAction(button);
}

function handleAction(button) {
  const action = button.dataset.action;
  const confirmationMessage = destructiveActionMessage({
    action,
    collection: button.dataset.collection,
    itemName: button.dataset.projectName || button.dataset.organizationName,
    projectCount: button.dataset.projectCount
  });

  if (confirmationMessage && !window.confirm(confirmationMessage)) {
    return;
  }

  if (action === "toggle-settings") {
    isSettingsOpen = !isSettingsOpen;
    render();
    return;
  }

  if (action === "close-settings") {
    isSettingsOpen = false;
    render();
    return;
  }

  if (action === "select-skin") {
    activeSkin = applySkinPreference(button.dataset.skin);
    render();
    return;
  }

  if (action === "reset-skin") {
    activeSkin = applySkinPreference(defaultSkin);
    render();
    return;
  }

  if (action === "toggle-nav") {
    isNavCollapsed = !isNavCollapsed;
    render();
    return;
  }

  if (action === "step1-subpage") {
    activeStep1Subpage = button.dataset.subpage || "sif";
    activeStep1FullscreenTile = 0;
    render();
    return;
  }

  if (action === "navigate") {
    activeView = button.dataset.view || "overview";
    isSettingsOpen = false;
    if (activeView !== "step1" && !hasGenericFocusMode(activeView)) {
      isFocusFullscreen = false;
    }
    render();
    return;
  }

  if (action === "step1-fullscreen-open") {
    activeStep1FullscreenTile = 0;
    isFocusFullscreen = true;
    isSettingsOpen = false;
    render();
    return;
  }

  if (action === "step1-fullscreen-close") {
    isFocusFullscreen = false;
    render();
    return;
  }

  if (action === "step1-fullscreen-prev") {
    moveStep1Fullscreen("prev");
    render();
    return;
  }

  if (action === "step1-fullscreen-next") {
    moveStep1Fullscreen("next");
    render();
    return;
  }

  if (action === "focus-fullscreen-open") {
    activeGenericFocusTile = 0;
    isFocusFullscreen = true;
    isSettingsOpen = false;
    render();
    return;
  }

  if (action === "focus-fullscreen-close") {
    isFocusFullscreen = false;
    render();
    return;
  }

  if (action === "focus-fullscreen-prev") {
    moveGenericFocus("prev");
    render();
    return;
  }

  if (action === "focus-fullscreen-next") {
    moveGenericFocus("next");
    render();
    return;
  }

  if (action === "export-project-json") {
    saveNow();
    exportProjectJson(workspace);
    return;
  }

  if (action === "export-project-report") {
    saveNow();
    exportProjectReport(workspace);
    return;
  }

  if (action === "export-step") {
    saveNow();
    exportStepOutcome(workspace, button.dataset.step);
    return;
  }

  if (action === "reset-variety-slider" && button.dataset.path) {
    setPath(workspace, button.dataset.path, "50");
    markStep2SliderAssessed(workspace, button.dataset.path);
    saveNow();
    render();
    return;
  }

  if (action === "reset-step2-sliders") {
    resetStep2SlidersToNeutral(workspace);
    saveNow();
    render();
    return;
  }

  if (action === "toggle-manageability-option") {
    toggleManageabilityOption(button.dataset.optionId);
    saveNow();
    render();
    return;
  }

  if (action === "toggle-step-complete") {
    const stepId = button.dataset.step;
    setStepCompletion(workspace, stepId, !isStepComplete(workspace, stepId));
    saveNow();
    renderAfterInPlaceAction();
    return;
  }

  if (action === "set-accountable-organization") {
    const taskId = button.dataset.taskId;
    const organizationId = button.dataset.organizationId;
    const allocation = workspace.step4.allocations[taskId] ||= createAllocation(taskId);
    allocation.accountableOrganizationId = organizationId;
    saveNow();
    renderPreservingViewport();
    return;
  }

  if (action === "select-step5-system") {
    if (button.classList.contains("is-disabled")) {
      return;
    }
    activeStep5System = button.dataset.system || "3";
    renderAfterInPlaceAction();
    return;
  }

  if (action === "set-step5-doctrine") {
    workspace.step5.includeSystem1 = button.dataset.includeSystem1 !== "false";
    if (!workspace.step5.includeSystem1 && activeStep5System === "1") {
      activeStep5System = "2";
    }
    saveNow();
    renderAfterInPlaceAction();
    return;
  }

  if (action === "toggle-vsm-details-pane") {
    const context = button.dataset.vsmContext === "standalone" ? "standalone" : "step5";
    vsmFramePaneVisibility[context] = vsmFramePaneVisibility[context] !== true;
    syncVsmPaneVisibility(context);
    return;
  }

  if (action === "toggle-step5-assignment") {
    if (!toggleStep5ContributionAssignment(workspace, button.dataset.system, button.dataset.contributionKey)) {
      return;
    }
    saveNow();
    renderAfterInPlaceAction();
    return;
  }

  if (action === "toggle-sct-merge-selection") {
    const taskId = button.dataset.sctId;
    selectedSctMergeIds.has(taskId)
      ? selectedSctMergeIds.delete(taskId)
      : selectedSctMergeIds.add(taskId);
    renderAfterInPlaceAction(taskId);
    return;
  }

  if (action === "clear-sct-filters") {
    sctPriorityFilter = "";
    sctSourceFilter = "";
    selectedSctMergeIds.clear();
    renderAfterInPlaceAction();
    return;
  }

  if (action === "merge-selected-scts") {
    const survivor = mergeSuccessCriticalTasks(workspace, [...selectedSctMergeIds]);
    if (!survivor) {
      return;
    }

    selectedSctMergeIds.clear();
    selectedSctId = survivor.id;
    saveNow();
    renderAfterInPlaceAction(survivor.id);
    return;
  }

  if (action === "split-selected-sct") {
    const [taskId] = [...selectedSctMergeIds];
    if (selectedSctMergeIds.size !== 1 || !taskId) {
      return;
    }

    const splitTask = splitSuccessCriticalTask(workspace, taskId);
    if (!splitTask) {
      return;
    }

    selectedSctMergeIds.clear();
    selectedSctId = splitTask.id;
    saveNow();
    renderAfterInPlaceAction(taskId);
    return;
  }

  if (action === "split-sct") {
    const taskId = button.dataset.sctId;
    const splitTask = splitSuccessCriticalTask(workspace, taskId);
    if (!splitTask) {
      return;
    }

    selectedSctMergeIds.clear();
    selectedSctId = splitTask.id;
    saveNow();
    renderAfterInPlaceAction(taskId);
    return;
  }

  if (action === "open-sct-inspector") {
    selectedSctId = button.dataset.sctId || "";
    renderAfterInPlaceAction(selectedSctId);
    return;
  }

  if (action === "close-sct-inspector") {
    const closingSctId = selectedSctId;
    selectedSctId = "";
    renderAfterInPlaceAction(closingSctId);
    return;
  }

  if (action === "add-sct") {
    const task = createNumberedSuccessCriticalTask(workspace);
    workspace.step3.successCriticalTasks.push(task);
    workspace.step4.allocations[task.id] = createAllocation(task.id);
    selectedSctId = task.id;
    selectedSctMergeIds.clear();
    saveNow();
    if (isFocusFullscreen) {
      render();
    } else {
      renderPreservingViewport();
    }
    return;
  }

  if (action === "new-workspace") {
    workspace = replaceWorkspace(repository, createWorkspace());
    selectedOrganizationId = workspace.organization.id || "";
    activeView = "start";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    render();
    return;
  }

  if (action === "load-sample") {
    workspace = replaceWorkspace(repository, createSampleWorkspace());
    selectedOrganizationId = workspace.organization.id || "";
    activeView = "overview";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    render();
    return;
  }

  if (action === "add-project") {
    workspace = replaceWorkspace(repository, createProjectWorkspace(selectedOrganizationId));
    selectedOrganizationId = workspace.organization.id || "";
    activeView = "overview";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    render();
    return;
  }

  if (action === "add-organization") {
    workspace = replaceWorkspace(repository, createWorkspace());
    selectedOrganizationId = workspace.organization.id || "";
    activeView = "projects";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    render();
    return;
  }

  if (action === "open-project") {
    workspace = openWorkspace(repository, button.dataset.projectId);
    selectedOrganizationId = workspace.organization.id || "";
    activeView = "overview";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    render();
    return;
  }

  if (action === "open-organization") {
    selectedOrganizationId = button.dataset.organizationId || button.dataset.organizationName || selectedOrganizationId;
    activeView = "projects";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    render();
    return;
  }

  if (action === "select-organization") {
    selectedOrganizationId = button.dataset.organizationId || selectedOrganizationId;
    activeView = "projects";
    render();
    return;
  }

  if (action === "rename-project") {
    openRenameDialog(button, "project");
    return;
  }

  if (action === "rename-organization") {
    openRenameDialog(button, "organization");
    return;
  }

  if (action === "cancel-rename") {
    renameTarget = null;
    render();
    return;
  }

  if (action === "confirm-rename") {
    confirmRename();
    return;
  }

  if (action === "delete-project") {
    deleteProjectFromButton(button);
    return;
  }

  if (action === "delete-organization") {
    deleteOrganizationFromButton(button);
    return;
  }

  if (action === "remove-item") {
    removeFromCollection(button.dataset.collection, button.dataset.id);
    saveNow();
    renderAfterInPlaceAction();
    return;
  }

  if (action === "add-recursion-same-level") {
    addRecursionSameLevel(button.dataset.level);
    saveNow();
    render();
    return;
  }

  if (action === "add-strategic-link") {
    addStrategicLink(button.dataset.fieldId);
    saveNow();
    render();
    return;
  }

  if (action === "remove-strategic-link") {
    removeStrategicLink(button.dataset.fieldId, button.dataset.linkId);
    saveNow();
    renderAfterInPlaceAction();
    return;
  }

  if (action === "remove-strategic-file") {
    removeStrategicFile(button.dataset.fieldId, button.dataset.fileId);
    saveNow();
    renderAfterInPlaceAction();
    return;
  }

  addItem(action);
  saveNow();
  render();
}

function updateSctFilter(filterName, value) {
  if (filterName === "priority") {
    sctPriorityFilter = value;
  }

  if (filterName === "source") {
    sctSourceFilter = value;
  }

  const visibleTaskIds = new Set(
    filterScts(workspace.step3.successCriticalTasks, sctPriorityFilter, sctSourceFilter)
      .map((task) => task.id)
  );
  selectedSctMergeIds = new Set([...selectedSctMergeIds].filter((taskId) => visibleTaskIds.has(taskId)));

  if (selectedSctId && !visibleTaskIds.has(selectedSctId)) {
    selectedSctId = "";
  }
}

function addItem(action) {
  const additions = {
    "add-recursion-above": () => addRecursionLevel("above"),
    "add-recursion-below": () => addRecursionLevel("below"),
    "add-segmentation": () => workspace.step1.segmentationOptions.push(createSegmentationOption()),
    "add-operative-unit": () => {
      workspace.step1.operativeUnits ||= [];
      workspace.step1.operativeUnits.push(createOperativeUnit());
    },
    "add-criterion": () => workspace.step1.keyBuyingCriteria.push(createKeyBuyingCriterion()),
    "add-strategic-field": () => workspace.step1.strategicFields.push(createStrategicField()),
    "add-manageability-option": () => workspace.step2.options.push(createManageabilityOption()),
    "add-role": () => workspace.step7.roles.push(createRole()),
    "add-implementation": () => workspace.implementation.items.push(createImplementationItem())
  };

  additions[action]?.();
}

function toggleManageabilityOption(optionId) {
  if (!optionId || !workspace.step2.options.some((option) => option.id === optionId)) {
    return;
  }

  workspace.step2.selectedOptionIds ||= [];
  workspace.step2.selectedOptionIds = workspace.step2.selectedOptionIds.includes(optionId)
    ? workspace.step2.selectedOptionIds.filter((id) => id !== optionId)
    : [...workspace.step2.selectedOptionIds, optionId];
}

function addRecursionLevel(direction) {
  const level = nextRecursionLevel(direction);
  workspace.step1.recursionLevels.push(createRecursionLevel(level, "", ""));
  workspace.step1.recursionLevels.sort((left, right) => recursionRank(left.level) - recursionRank(right.level));
}

function addRecursionSameLevel(level) {
  if (!level) {
    return;
  }

  workspace.step1.recursionLevels.push(createRecursionLevel(level, "", ""));
  workspace.step1.recursionLevels.sort((left, right) => recursionRank(left.level) - recursionRank(right.level));
}

function moveStep1Fullscreen(direction) {
  const tileCount = getStep1FullscreenTileCount(workspace, activeStep1Subpage);

  if (direction === "prev") {
    if (activeStep1FullscreenTile > 0) {
      activeStep1FullscreenTile = clampStep1FullscreenTile(activeStep1FullscreenTile - 1, tileCount);
      return;
    }

    const previousSubpage = step1Subpages[getActiveStep1SubpageIndex() - 1];
    if (!previousSubpage) {
      return;
    }

    activeStep1Subpage = previousSubpage.id;
    activeStep1FullscreenTile = getStep1FullscreenTileCount(workspace, activeStep1Subpage) - 1;
    return;
  }

  if (activeStep1FullscreenTile < tileCount - 1) {
    activeStep1FullscreenTile = clampStep1FullscreenTile(activeStep1FullscreenTile + 1, tileCount);
    return;
  }

  const nextSubpage = step1Subpages[getActiveStep1SubpageIndex() + 1];
  if (!nextSubpage) {
    if (focusStepOrder.length > 0) {
      activeView = focusStepOrder[0];
      activeGenericFocusTile = 0;
    }
    return;
  }

  activeStep1Subpage = nextSubpage.id;
  activeStep1FullscreenTile = 0;
}

function moveGenericFocus(direction) {
  const tileCount = getGenericFocusTileCount(workspace, activeView, getGenericFocusContext());

  if (direction === "prev") {
    if (activeGenericFocusTile > 0) {
      activeGenericFocusTile = clampFocusTile(activeGenericFocusTile - 1, tileCount);
      return;
    }

    const previousStep = focusStepOrder[getActiveGenericFocusIndex() - 1];
    if (!previousStep) {
      if (activeView === focusStepOrder[0]) {
        activeView = "step1";
        activeStep1Subpage = step1Subpages.at(-1)?.id || "evaluation";
        activeStep1FullscreenTile = getStep1FullscreenTileCount(workspace, activeStep1Subpage) - 1;
      }
      return;
    }

    activeView = previousStep;
    activeGenericFocusTile = getGenericFocusTileCount(workspace, activeView, getGenericFocusContext()) - 1;
    return;
  }

  if (activeGenericFocusTile < tileCount - 1) {
    activeGenericFocusTile = clampFocusTile(activeGenericFocusTile + 1, tileCount);
    return;
  }

  const nextStep = focusStepOrder[getActiveGenericFocusIndex() + 1];
  if (!nextStep) {
    return;
  }

  activeView = nextStep;
  activeGenericFocusTile = 0;
}

function nextRecursionLevel(direction) {
  const values = workspace.step1.recursionLevels
    .map((item) => String(item.level || "").match(/^R([+-]\d+|0)$/)?.[1])
    .filter(Boolean)
    .map(Number);

  if (direction === "above") {
    return `R+${Math.max(1, ...values.filter((value) => value > 0)) + 1}`;
  }

  return `R${Math.min(-1, ...values.filter((value) => value < 0)) - 1}`;
}

function recursionRank(level) {
  const match = String(level || "").match(/^R([+-]\d+|0)$/);
  return match ? -Number(match[1]) : 0;
}

function createProjectWorkspace(organizationId) {
  const nextWorkspace = createWorkspace();
  const organization = findOrganizationForProjectCreation(organizationId);
  nextWorkspace.organization = {
    id: organization.id,
    name: organization.name,
    description: organization.description || ""
  };
  return nextWorkspace;
}

function findOrganizationForProjectCreation(organizationId) {
  if (!organizationId || projectBelongsToOrganization({
    organizationId: workspace.organization.id,
    organizationName: workspace.organization.name
  }, organizationId)) {
    return {
      id: workspace.organization.id,
      name: workspace.organization.name || "New Organization",
      description: workspace.organization.description || ""
    };
  }

  const project = listWorkspaces(repository).find((item) => projectBelongsToOrganization(item, organizationId));
  return {
    id: project?.organizationId || organizationId,
    name: project?.organizationName || "New Organization",
    description: ""
  };
}

function normalizeSelectedOrganization(projects) {
  if (projects.some((project) => projectBelongsToOrganization(project, selectedOrganizationId))) {
    return selectedOrganizationId;
  }

  if (projects.some((project) => projectBelongsToOrganization(project, workspace.organization.id))) {
    return workspace.organization.id;
  }

  const [firstProject] = projects;
  return firstProject?.organizationId || firstProject?.organizationName || "";
}

function projectBelongsToOrganization(project, organizationId) {
  return Boolean(organizationId) && (
    project.organizationId === organizationId
      || (!project.organizationId && project.organizationName === organizationId)
      || project.organizationName === organizationId
  );
}

function openRenameDialog(button, type) {
  const isOrganization = type === "organization";
  const id = isOrganization ? button.dataset.organizationId : button.dataset.projectId;
  const currentName = isOrganization
    ? button.dataset.organizationName || "Unnamed Organization"
    : button.dataset.projectName || "Untitled project";

  if (!id) {
    return;
  }

  renameTarget = {
    type,
    id,
    currentName,
    draftName: currentName
  };
  isSettingsOpen = false;
  render();

  window.requestAnimationFrame(() => {
    const input = document.querySelector("[data-rename-draft]");
    if (input instanceof HTMLInputElement) {
      input.focus();
      input.select();
    }
  });
}

function confirmRename() {
  if (!renameTarget) {
    return;
  }

  const { type, id, currentName } = renameTarget;
  const name = String(renameTarget.draftName || "").trim();

  if (!name) {
    return;
  }

  if (name === currentName) {
    renameTarget = null;
    render();
    return;
  }

  if (type === "project") {
    if (id === workspace.project.id) {
      workspace.project.name = name;
      saveNow();
    } else {
      renameWorkspace(repository, id, name);
      setSaveStatus("Saved just now");
    }
  } else {
    saveNow();
    renameOrganization(repository, id, name);

    if (projectBelongsToOrganization({
      organizationId: workspace.organization.id,
      organizationName: currentName
    }, id)) {
      workspace = openWorkspace(repository, workspace.project.id);
    }

    selectedOrganizationId = id;
    setSaveStatus("Saved just now");
  }

  renameTarget = null;
  render();
}

function deleteProjectFromButton(button) {
  const projectId = button.dataset.projectId;

  if (!projectId) {
    return;
  }

  workspace = deleteWorkspace(repository, projectId);
  activeView = "projects";
  activeStep1Subpage = "sif";
  isFocusFullscreen = false;

  if (!listWorkspaces(repository).length) {
    workspace = replaceWorkspace(repository, createWorkspace());
  }

  selectedOrganizationId = workspace.organization.id || "";
  setSaveStatus("Saved just now");
  render();
}

function deleteOrganizationFromButton(button) {
  const organizationId = button.dataset.organizationId;

  if (!organizationId) {
    return;
  }

  workspace = deleteOrganization(repository, organizationId);
  activeView = "projects";
  activeStep1Subpage = "sif";
  isFocusFullscreen = false;

  if (!listWorkspaces(repository).length) {
    workspace = replaceWorkspace(repository, createWorkspace());
  }

  selectedOrganizationId = workspace.organization.id || "";
  setSaveStatus("Saved just now");
  render();
}

function scheduleSave() {
  setSaveStatus("Saving...");
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveNow, 250);
}

function saveNow() {
  window.clearTimeout(saveTimer);
  try {
    saveWorkspace(repository, workspace);
    setSaveStatus("Saved just now");
  } catch (error) {
    console.error(error);
    const message = error?.name === "StorageQuotaError"
      ? "Storage limit reached"
      : "Save failed";
    setSaveStatus(message);
  }
}

function setSaveStatus(status) {
  saveStatus = status;
  const indicator = document.querySelector("[data-save-indicator]");
  if (indicator) {
    indicator.textContent = status;
    indicator.classList.toggle("is-saving", status.toLowerCase().startsWith("saving"));
    indicator.classList.toggle("is-saved", status.toLowerCase().startsWith("saved"));
  }
}

function updateVarietyPreview(target) {
  if (!(target instanceof HTMLInputElement) || !target.dataset.varietyDriver) {
    return;
  }

  const diagnostics = evaluateStep2Variety(workspace);
  const horizontalGauge = document.querySelector("[data-horizontal-variety-gauge]");
  const verticalGauge = document.querySelector("[data-vertical-variety-gauge]");
  const fitGauge = document.querySelector("[data-variety-fit-gauge]");

  if (horizontalGauge) {
    horizontalGauge.style.setProperty("--variety-pressure", `${diagnostics.horizontalPressure}%`);
  }

  if (verticalGauge) {
    verticalGauge.style.setProperty("--vertical-variety", `${diagnostics.verticalFit}%`);
  }

  if (fitGauge) {
    fitGauge.style.setProperty("--variety-fit-position", `${diagnostics.fitPosition}%`);
  }
}

function updateCharacterCounter(target) {
  if (!(target instanceof HTMLTextAreaElement) || !target.dataset.characterCount) {
    return;
  }

  const counter = target.closest(".sct-inspector")?.querySelector("[data-character-counter]");
  if (!counter) {
    return;
  }

  counter.textContent = `${target.value.length} / 1000`;
  counter.classList.toggle("is-near-limit", target.value.length >= 900);
}

function setPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;

  for (const part of parts.slice(0, -1)) {
    cursor = cursor[part];
  }

  cursor[parts.at(-1)] = value;
}

function getPath(target, path) {
  return path.split(".").reduce((cursor, part) => cursor?.[part], target);
}

function findCollectionItem(collectionPath, id) {
  const collection = getPath(workspace, collectionPath);
  return Array.isArray(collection) ? collection.find((item) => item.id === id) : null;
}

function findStrategicField(fieldId) {
  return workspace.step1.strategicFields.find((field) => field.id === fieldId);
}

function findStrategicLink(fieldId, linkId) {
  const field = findStrategicField(fieldId);
  return field?.links?.find((link) => link.id === linkId);
}

function addStrategicLink(fieldId) {
  const field = findStrategicField(fieldId);
  if (!field) {
    return;
  }

  field.links ||= [];
  field.links.push(createStrategicLink());
}

function removeStrategicLink(fieldId, linkId) {
  const field = findStrategicField(fieldId);
  if (!field?.links) {
    return;
  }

  field.links = field.links.filter((link) => link.id !== linkId);
}

function removeStrategicFile(fieldId, fileId) {
  const field = findStrategicField(fieldId);
  if (!field?.files) {
    return;
  }

  field.files = field.files.filter((file) => file.id !== fileId);
}

async function addStrategicFiles(fieldId, files) {
  const field = findStrategicField(fieldId);
  if (!field || files.length === 0) {
    return;
  }

  field.files ||= [];
  const fileEntries = await Promise.all(files.map(createStrategicFileEntry));
  field.files.push(...fileEntries);
}

async function createStrategicFileEntry(file) {
  const canEmbed = file.size <= maxEmbeddedFileSize;
  const dataUrl = canEmbed ? await readFileAsDataUrl(file) : "";

  return createStrategicFile({
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl,
    storageMode: canEmbed ? "embedded" : "reference"
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function removeFromCollection(collectionPath, id) {
  const collection = getPath(workspace, collectionPath);
  if (!Array.isArray(collection)) {
    return;
  }

  const index = collection.findIndex((item) => item.id === id);
  if (index >= 0) {
    collection.splice(index, 1);
  }

  if (collectionPath === "step1.segmentationOptions") {
    if (workspace.step1.selectedSegmentationOptionId === id) {
      workspace.step1.selectedSegmentationOptionId = "";
    }

    for (const rowScores of Object.values(workspace.step1.evaluation.scores)) {
      delete rowScores[id];
    }
  }

  if (collectionPath === "step1.keyBuyingCriteria" || collectionPath === "step1.strategicFields") {
    delete workspace.step1.evaluation.scores[id];
    delete workspace.step1.evaluation.comments[id];
  }

  if (collectionPath === "step2.options") {
    workspace.step2.selectedOptionIds = (workspace.step2.selectedOptionIds || []).filter((optionId) => optionId !== id);
  }

  if (collectionPath === "step3.successCriticalTasks") {
    selectedSctMergeIds.delete(id);
    if (selectedSctId === id) {
      selectedSctId = "";
    }
    delete workspace.step4.allocations[id];
    removeTaskReferences(id);
  }
}

function removeTaskReferences(taskId) {
  removeStep5TaskAssignments(workspace, taskId);
  for (const item of workspace.step7.roles) {
    item.linkedTaskIds = item.linkedTaskIds.filter((id) => id !== taskId);
  }
}
