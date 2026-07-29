import {
  createAllocation,
  createImplementationItem,
  createImplementationItemFromChannelWeakness,
  createImplementationItemFromFinding,
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
  formatSctNumber,
  getStep6ChannelVarietyContext,
  getStep6FindingCandidates,
  getStep6RouteContext,
  getStep6RouteModel,
  getStep7EditorContext,
  getStep7EditorModel,
  isStepComplete,
  markStep2SliderAssessed,
  mergeSuccessCriticalTasks,
  removeStep5TaskAssignments,
  resetStep2SlidersToNeutral,
  setStepCompletion,
  setStep6ChannelVarietyModel,
  setStep6RelatedSctIds,
  setStep6RouteModel,
  setSuccessCriticalTaskOptionalDetail,
  setStep7EditorModel,
  setStep7RasicAssignment,
  splitSuccessCriticalTask,
  stepDefinitions,
  syncAllocations,
  taskSources,
  toggleStep5ContributionAssignment,
  vsmSystems,
  workflowStepOrder
} from "../domain/vsm.js?v=20260729-steering-master-nav-audit";
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
} from "../application/workspaceService.js?v=20260729-steering-master-nav-audit";
import { createSampleWorkspace } from "../application/sampleWorkspaceFactory.js?v=20260729-steering-master-nav-audit";
import { getExportViewModel } from "../application/exportViewModels.js?v=20260729-steering-master-nav-audit";
import { getSteeringMasterViewModel } from "../application/steeringMasterViewModel.js?v=20260729-steering-master-nav-audit";
import { createWorkspaceRepository } from "../infrastructure/fileBackedRepository.js?v=20260717-file-storage";
import { exportExportIntent } from "../infrastructure/exporters.js?v=20260729-steering-master-nav-audit";
import { buildE2ERouteDocument } from "../infrastructure/e2eRouteDocuments.js?v=20260729-steering-master-nav-audit";
import { renderRenameDialog } from "./renameDialog.js?v=20260729-steering-master-nav-audit";
import { destructiveActionMessage } from "./shared/destructiveActions.js?v=20260729-steering-master-nav-audit";
import { createE2ERouteExportCoordinator } from "./shared/e2eRouteExport.js?v=20260729-steering-master-nav-audit";
import { createChannelVarietyExportCoordinator } from "./shared/channelVarietyExport.js?v=20260729-steering-master-nav-audit";
import { buildAppHash, parseAppHash } from "./shared/appRouting.js?v=20260729-steering-master-nav-audit";
import { escapeAttr, escapeHtml } from "./shared/renderHelpers.js?v=20260729-steering-master-nav-audit";
import { resolveSteeringMasterNavigation } from "./shared/steeringMasterNavigation.js?v=20260729-steering-master-nav-audit";
import { renderProjectManagement } from "./projectManagement.js?v=20260729-steering-master-nav-audit";
import { applySkinPreference, defaultSkin, readSkinPreference } from "./skinSettings.js?v=20260729-steering-master-nav-audit";
import { renderStartPage } from "./startPage.js?v=20260729-steering-master-nav-audit";
import { renderOverview, renderOverviewFullscreenTile } from "./steps/overview.js?v=20260729-steering-master-nav-audit";
import { renderImplementation, renderImplementationFullscreenTile } from "./steps/implementation.js?v=20260729-steering-master-nav-audit";
import { getStep1FullscreenTileCount, renderStep1, renderStep1FullscreenTile } from "./steps/step1.js?v=20260729-steering-master-nav-audit";
import { normalizeStep2Subpage, renderStep2, renderStep2FullscreenTile } from "./steps/step2.js?v=20260729-steering-master-nav-audit";
import { filterScts, normalizeStep3Subpage, renderStep3, renderStep3FullscreenTile } from "./steps/step3.js?v=20260729-steering-master-nav-audit";
import { renderStep4, renderStep4FullscreenTile } from "./steps/step4.js?v=20260729-steering-master-nav-audit";
import { renderStep5, renderStep5FullscreenTile } from "./steps/step5.js?v=20260729-steering-master-nav-audit";
import { getActiveStep6SctId, renderStep6, renderStep6FullscreenTile } from "./steps/step6.js?v=20260729-steering-master-nav-audit";
import { renderStep7 } from "./steps/step7.js?v=20260729-step7-starting-tile";
import { renderVsmStandalone } from "./vsmStandalone.js?v=20260729-steering-master-nav-audit";
import {
  buildVsmHostTree,
  getVsmSystemType,
  recursionLevelLabel,
  recursionLevelValue
} from "./shared/vsmHostBridge.js?v=20260729-steering-master-nav-audit";

const app = document.querySelector("#app");
const repository = createWorkspaceRepository();
const maxEmbeddedFileSize = 1_000_000;
let workspace = loadWorkspace(repository);
if (listWorkspaces(repository).length === 0) {
  saveWorkspace(repository, workspace);
}
let activeView = "start";
let selectedOrganizationId = workspace.organization.id || "";
let activeStep1Subpage = "sif";
let activeStep2Subpage = "assessment";
let activeStep3Subpage = "signals";
let isFocusFullscreen = false;
let activeStep1FullscreenTile = 0;
let activeHostFullscreenTile = "";
let selectedSctId = "";
let selectedSctMergeIds = new Set();
let sctPriorityFilter = "";
let sctSourceFilter = "";
let activeStep5System = "3";
let activeStep6Subpage = "e2e";
let selectedStep6SctId = "";
let activeStep7Substep = "7.1";
let activeSteeringMasterSystem = null;
let activeSteeringMasterView = "2d";
let isSteeringMasterFullscreen = false;
let pendingStep7Selection = null;
let isSettingsOpen = false;
let renameTarget = null;
let isNavCollapsed = false;
let activeSkin = applySkinPreference(readSkinPreference());
let saveStatus = repository.isFileBacked ? "File saved" : "Saved";
let saveTimer = null;
let e2eRouteSaveTimer = null;
let channelVarietySaveTimer = null;
let isApplyingRouteHash = false;
let lastAction = { button: null, at: 0 };
const vsmFramePaths = {
  standalone: [],
  step5: []
};
const vsmFramePaneVisibility = {
  standalone: undefined,
  step5: false
};
let exportPanelFrame = null;
let exportPanelReady = false;
const exportPanelQueue = [];
const e2eRouteExportCoordinator = createE2ERouteExportCoordinator({ send: postToE2EFrame });
const channelVarietyExportCoordinator = createChannelVarietyExportCoordinator({ send: postToChannelVarietyFrame });

window.addEventListener("message", handleVsmBridgeMessage);
window.addEventListener("message", handleSteeringMasterBridgeMessage);
window.addEventListener("message", handleE2EBridgeMessage);
window.addEventListener("message", handleChannelVarietyBridgeMessage);
window.addEventListener("message", handleStep7BridgeMessage);
window.addEventListener("message", handleExportBridgeMessage);
window.addEventListener("hashchange", handleRouteHashChange);
ensureExportPanelFrame();
applyRouteState(parseAppHash(window.location.hash));
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
  if (event.target instanceof HTMLElement && event.target.dataset.step6SctSelect !== undefined) {
    selectedStep6SctId = event.target.value;
    renderAfterInPlaceAction();
    return;
  }

  if (event.target instanceof HTMLElement && event.target.dataset.step6RelatedSct !== undefined) {
    updateStep6RelatedScts(event.target);
    return;
  }

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
  activeHostFullscreenTile = "";
  render();
});

function handleRouteHashChange() {
  isApplyingRouteHash = true;
  applyRouteState(parseAppHash(window.location.hash));
  render();
  isApplyingRouteHash = false;
  syncRouteHashToState();
}

function applyRouteState(route) {
  activeView = route?.view || "start";
  if (route?.step1Subpage) {
    activeStep1Subpage = route.step1Subpage;
    activeStep1FullscreenTile = 0;
  }
  if (route?.step2Subpage) {
    activeStep2Subpage = normalizeStep2Subpage(route.step2Subpage);
  }
  if (route?.step3Subpage) {
    activeStep3Subpage = normalizeStep3Subpage(route.step3Subpage);
  }
  if (route?.step5System) {
    activeStep5System = route.step5System;
  }
  if (route?.step6Subpage) {
    activeStep6Subpage = route.step6Subpage;
  }
  if (route?.step7Substep) {
    activeStep7Substep = normalizeStep7Substep(route.step7Substep);
  }

  isSettingsOpen = false;
  if (!supportsHostTileFullscreen(activeView)) {
    isFocusFullscreen = false;
    activeHostFullscreenTile = "";
  }
}

function getRouteState() {
  return {
    view: activeView,
    step1Subpage: activeStep1Subpage,
    step2Subpage: activeStep2Subpage,
    step3Subpage: activeStep3Subpage,
    step5System: activeStep5System,
    step6Subpage: activeStep6Subpage,
    step7Substep: activeStep7Substep
  };
}

function syncRouteHashToState() {
  if (isApplyingRouteHash) {
    return;
  }

  const nextHash = buildAppHash(getRouteState());
  if (window.location.hash === nextHash) {
    return;
  }

  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
}

function render() {
  syncAllocations(workspace);
  const taskIds = new Set(workspace.step3.successCriticalTasks.map((task) => task.id));
  selectedSctMergeIds = new Set([...selectedSctMergeIds].filter((taskId) => taskIds.has(taskId)));
  if (selectedSctId && !workspace.step3.successCriticalTasks.some((task) => task.id === selectedSctId)) {
    selectedSctId = "";
  }
  selectedStep6SctId = getActiveStep6SctId(workspace, selectedStep6SctId);
  document.body.classList.toggle("has-fullscreen-workshop", isFocusFullscreen);
  const projects = listWorkspaces(repository);
  selectedOrganizationId = normalizeSelectedOrganization(projects);
  syncRouteHashToState();
  const showStepNavigation = activeView !== "start" && activeView !== "projects" && activeView !== "vsm";

  app.innerHTML = `
    <header class="topbar">
      <a class="brand-block" href="#/start" aria-label="Go to the VSM7 start page" title="Go to start page">
        ${renderBrandMark()}
        <strong class="brand-name">VSM7</strong>
      </a>
      <div class="topbar-context">
        ${headerContextItem("Organization", workspace.organization.name || "New Organization")}
        ${headerContextItem("Project", workspace.project.name || "New VSM Project")}
        ${headerContextItem("SIF", workspace.sif.name || "System-in-Focus")}
      </div>
      <div class="topbar-actions">
        ${renderSaveIndicator()}
        ${renderTopbarVsmButton()}
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
  syncVisibleSteeringMasterFrames();
  syncVisibleE2EFrames();
  syncVisibleChannelVarietyFrames();
  syncVisibleStep7Frames();
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

function syncVisibleSteeringMasterFrames() {
  document.querySelectorAll("[data-steering-master-frame]").forEach((frame) => {
    if (!(frame instanceof HTMLIFrameElement)) {
      return;
    }

    if (!frame.dataset.steeringMasterHostWired) {
      frame.dataset.steeringMasterHostWired = "true";
      frame.addEventListener("load", () => syncSteeringMasterFrame(frame));
    }
  });
}

function handleSteeringMasterBridgeMessage(event) {
  const frame = findSteeringMasterFrameForSource(event.source);
  const message = event.data;

  if (
    !frame
    || !isTrustedFrameMessage(event, frame)
    || !message
    || typeof message !== "object"
    || message.api !== 1
    || !message.evt
  ) {
    return;
  }

  if (message.evt === "ready") {
    syncSteeringMasterFrame(frame);
    return;
  }

  if (message.evt === "select") {
    activeSteeringMasterSystem = message.system || null;
    return;
  }

  if (message.evt === "view") {
    activeSteeringMasterView = message.view === "3d" ? "3d" : "2d";
    return;
  }

  if (message.evt === "requestExportPanel") {
    openExportPanel("app", null, "step", "app");
    return;
  }

  if (message.evt === "navigate") {
    navigateFromSteeringMaster(message);
    return;
  }

  if (message.evt === "fullscreenchange") {
    isSteeringMasterFullscreen = message.fullscreen === true;
  }
}

function navigateFromSteeringMaster(message) {
  const target = resolveSteeringMasterNavigation(message);
  if (!target) {
    return;
  }

  activeView = target.view;
  isSettingsOpen = false;
  isFocusFullscreen = false;
  activeHostFullscreenTile = "";

  if (target.view === "step5") {
    activeStep5System = target.step5System;
  }

  if (target.view === "step7") {
    activeStep7Substep = target.step7Substep;
    pendingStep7Selection = target.selection;
  }

  render();
  window.requestAnimationFrame(() => window.scrollTo(0, 0));
}

function findSteeringMasterFrameForSource(source) {
  return [...document.querySelectorAll("[data-steering-master-frame]")]
    .find((frame) => frame instanceof HTMLIFrameElement && frame.contentWindow === source) || null;
}

function syncSteeringMasterFrame(frame) {
  const vm = getSteeringMasterViewModel(workspace);
  postToSteeringMasterFrame(frame, { cmd: "setContext", ...vm.context });
  postToSteeringMasterFrame(frame, { cmd: "setModel", model: vm.model });
  postToSteeringMasterFrame(frame, {
    cmd: "skin",
    skin: activeSkin === "command-deck" ? "deck" : "workshop"
  });
  postToSteeringMasterFrame(frame, { cmd: "select", system: activeSteeringMasterSystem });
}

function postToSteeringMasterFrame(frame, message) {
  const targetOrigin = getFrameTargetOrigin(frame);
  frame.contentWindow?.postMessage(message, targetOrigin);
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

function syncVisibleE2EFrames() {
  document.querySelectorAll("[data-e2e-frame]").forEach((frame) => {
    if (!(frame instanceof HTMLIFrameElement) || frame.dataset.e2eHostWired) {
      return;
    }

    frame.dataset.e2eHostWired = "true";
    frame.addEventListener("load", () => syncE2EFrame(frame));
  });
}

function syncVisibleChannelVarietyFrames() {
  document.querySelectorAll("[data-channel-variety-frame]").forEach((frame) => {
    if (!(frame instanceof HTMLIFrameElement) || frame.dataset.channelVarietyHostWired) {
      return;
    }

    frame.dataset.channelVarietyHostWired = "true";
    frame.addEventListener("load", () => syncChannelVarietyFrame(frame));
  });
}

function syncVisibleStep7Frames() {
  document.querySelectorAll("[data-step7-frame]").forEach((frame) => {
    if (!(frame instanceof HTMLIFrameElement) || frame.dataset.step7HostWired) {
      return;
    }

    frame.dataset.step7HostWired = "true";
    frame.addEventListener("load", () => syncStep7Frame(frame));
  });
}

function handleStep7BridgeMessage(event) {
  const frame = findStep7FrameForSource(event.source);
  const message = event.data;

  if (!frame || !isTrustedFrameMessage(event, frame) || !message || typeof message !== "object" || !message.evt) {
    return;
  }

  if (message.evt === "ready") {
    syncStep7Frame(frame);
    if (activeStep7Substep === "7.6") {
      pendingStep7Selection = null;
    }
    return;
  }

  if (
    message.api === 1
    && (message.evt === "export" || message.evt === "needViewModel" || message.evt === "cancel")
  ) {
    handleStep7ExportBridgeMessage(frame, message);
    return;
  }

  if (message.evt === "goto") {
    activeStep7Substep = normalizeStep7Substep(message.substep);
    syncRouteHashToState();
    syncStep7Frame(frame);
    return;
  }

  if (message.evt === "change") {
    if (setStep7EditorModel(workspace, message.model)) {
      scheduleSave();
    }
    return;
  }

  if (message.evt === "rasic") {
    if (setStep7RasicAssignment(workspace, message.contribId, message.vesselId, message.letter || "")) {
      scheduleSave();
    }
  }
}

function handleStep7ExportBridgeMessage(frame, message) {
  if (message.evt === "needViewModel") {
    sendStep7ExportViewModel(frame, message.stepId || "step7", message.tileId || "all");
    return;
  }

  if (message.evt === "export") {
    void handleStep7ExportIntent(frame, message);
    return;
  }

  if (message.evt === "cancel") {
    postToStep7Frame(frame, { cmd: "closeExport" });
  }
}

function sendStep7ExportViewModel(frame, stepId, tileId) {
  const vm = buildExportViewModel(stepId, tileId, {
    origin: "step",
    scope: "step"
  });

  if (!vm) {
    postToStep7Frame(frame, {
      cmd: "exportError",
      message: "This Step VII export target is not available yet."
    });
    return;
  }

  postToStep7Frame(frame, {
    cmd: "setViewModel",
    stepId,
    tileId,
    vm
  });
}

async function handleStep7ExportIntent(frame, intent) {
  try {
    saveNow();
    if (isStep7OrgChartArtifactExportIntent(intent)) {
      const artifact = await buildStep7OrgChartArtifactExport(intent);
      downloadBrowserBlob(artifact.blob, artifact.filename);
      postToStep7Frame(frame, {
        cmd: "exportReady",
        requestId: intent.requestId,
        downloadName: artifact.filename
      });
      return;
    }

    const artifact = exportExportIntent(workspace, intent);
    postToStep7Frame(frame, {
      cmd: "exportReady",
      requestId: intent.requestId,
      downloadName: artifact.filename
    });
  } catch (error) {
    postToStep7Frame(frame, {
      cmd: "exportError",
      requestId: intent?.requestId,
      message: error?.message || "The export failed."
    });
  }
}

function isStep7OrgChartArtifactExportIntent(intent) {
  return intent?.api === 1
    && intent.evt === "export"
    && intent.stepId === "step7"
    && intent.tileId === "org-chart"
    && intent.artifact?.dataUrl;
}

async function buildStep7OrgChartArtifactExport(intent) {
  const response = await fetch(intent.artifact.dataUrl);
  if (!response.ok) {
    throw new Error("The org chart export could not be read.");
  }

  const blob = await response.blob();
  if (String(intent.format || "").toLowerCase() === "pptx") {
    const deck = await buildE2ERouteDocument("pptx", blob, {
      routeName: "Organizational Representation",
      projectName: workspace.project?.name || "VSM7 project",
      sctNumber: "SIF",
      sctTitle: workspace.sif?.name || "System-in-Focus",
      organizationName: workspace.organization?.name || "",
      findings: []
    });
    const requestedName = String(intent.filename || intent.artifact.suggestedName || "org-chart.pptx");
    return {
      blob: deck.blob,
      filename: /\.pptx$/i.test(requestedName)
        ? requestedName
        : `${requestedName.replace(/\.[^.]+$/, "")}.pptx`
    };
  }

  return {
    blob,
    filename: intent.filename || intent.artifact.suggestedName || `org-chart.${intent.format || "png"}`
  };
}

function findStep7FrameForSource(source) {
  return [...document.querySelectorAll("[data-step7-frame]")]
    .find((frame) => frame instanceof HTMLIFrameElement && frame.contentWindow === source) || null;
}

function syncStep7Frame(frame) {
  const context = getStep7EditorContext(workspace, {
    scope: getStep7EditorContextScope()
  });
  const model = getStep7EditorModel(workspace);
  postToStep7Frame(frame, {
    cmd: "setContext",
    ...context,
    vessels: model.vessels
  });
  postToStep7Frame(frame, { cmd: "loadModel", model });
  postToStep7Frame(frame, {
    cmd: "setSkin",
    skin: activeSkin === "command-deck" ? "deck" : "workshop"
  });
  postToStep7Frame(frame, {
    cmd: "goto",
    substep: normalizeStep7Substep(activeStep7Substep)
  });
  if (activeStep7Substep === "7.6" && pendingStep7Selection) {
    postToStep7Frame(frame, { cmd: "select", ref: pendingStep7Selection });
  }
}

function getStep7EditorContextScope() {
  return normalizeStep7Substep(activeStep7Substep) === "7.6" ? "sif" : "all";
}

function postToStep7Frame(frame, message) {
  const targetOrigin = getFrameTargetOrigin(frame);
  frame.contentWindow?.postMessage(message, targetOrigin);
}

function normalizeStep7Substep(substep) {
  const aliases = {
    vessels: "7.1",
    rasic: "7.2",
    aspects: "7.3",
    roles: "7.4",
    functions: "7.5",
    meetings: "7.6",
    org: "7.7"
  };
  const value = aliases[substep] || String(substep || "");
  return /^7\.[1-7]$/.test(value) ? value : "7.1";
}

function handleChannelVarietyBridgeMessage(event) {
  const frame = findChannelVarietyFrameForSource(event.source);
  const message = event.data;

  if (!frame || !isTrustedFrameMessage(event, frame) || !message || typeof message !== "object" || !message.evt) {
    return;
  }

  if (message.evt === "ready") {
    syncChannelVarietyFrame(frame);
    return;
  }

  if (message.evt === "exportReady" || message.evt === "exportError") {
    channelVarietyExportCoordinator.handle(frame, message);
    return;
  }

  if (message.evt === "change" && setStep6ChannelVarietyModel(workspace, message.model)) {
    scheduleChannelVarietySave();
  }
}

function findChannelVarietyFrameForSource(source) {
  return [...document.querySelectorAll("[data-channel-variety-frame]")]
    .find((frame) => frame instanceof HTMLIFrameElement && frame.contentWindow === source) || null;
}

function syncChannelVarietyFrame(frame) {
  const context = getStep6ChannelVarietyContext(workspace);
  postToChannelVarietyFrame(frame, { cmd: "loadModel", model: context.model });
  postToChannelVarietyFrame(frame, { cmd: "setLoops", loops: context.loops });
  postToChannelVarietyFrame(frame, { cmd: "setMeta", meta: context.meta });
}

function postToChannelVarietyFrame(frame, message) {
  const targetOrigin = getFrameTargetOrigin(frame);
  frame.contentWindow?.postMessage(message, targetOrigin);
}

function scheduleChannelVarietySave() {
  window.clearTimeout(channelVarietySaveTimer);
  channelVarietySaveTimer = window.setTimeout(() => {
    channelVarietySaveTimer = null;
    saveNow();
  }, 180);
}

function handleE2EBridgeMessage(event) {
  const frame = findE2EFrameForSource(event.source);
  const message = event.data;

  if (!frame || !isTrustedFrameMessage(event, frame) || !message || typeof message !== "object" || !message.evt) {
    return;
  }

  if (message.evt === "ready") {
    syncE2EFrame(frame);
    return;
  }

  if (message.evt === "exportReady" || message.evt === "exportError") {
    e2eRouteExportCoordinator.handle(frame, message);
    return;
  }

  if (message.evt === "change") {
    const taskId = frame.dataset.e2eSctId || "";
    if (setStep6RouteModel(workspace, taskId, message.model)) {
      scheduleE2ERouteSave();
    }
  }
}

function findE2EFrameForSource(source) {
  return [...document.querySelectorAll("[data-e2e-frame]")]
    .find((frame) => frame instanceof HTMLIFrameElement && frame.contentWindow === source) || null;
}

function syncE2EFrame(frame) {
  const taskId = frame.dataset.e2eSctId || "";
  const context = getStep6RouteContext(workspace, taskId);
  const model = getStep6RouteModel(workspace, taskId);
  if (!context || !model) {
    return;
  }

  // Reconciliation keeps authored route ids and call-outs while aligning lanes to current Step I truth.
  setStep6RouteModel(workspace, taskId, model);
  postToE2EFrame(frame, { cmd: "loadModel", model });
  postToE2EFrame(frame, { cmd: "setLanes", lanes: context.lanes });
  postToE2EFrame(frame, {
    cmd: "setSCTContext",
    primarySct: context.primarySct,
    relatedScts: context.relatedScts,
    contributions: context.contributions
  });
  postToE2EFrame(frame, { cmd: "setFit", mode: "full" });
}

function updateStep6RelatedScts(target) {
  const section = target.closest(".e2e-route-section");
  const primarySctId = target.dataset.primarySctId || "";
  if (!section || !primarySctId) {
    return;
  }

  const relatedSctIds = [...section.querySelectorAll("[data-step6-related-sct]:checked")]
    .map((checkbox) => checkbox.value);
  if (!setStep6RelatedSctIds(workspace, primarySctId, relatedSctIds)) {
    return;
  }

  saveNow();
  const context = getStep6RouteContext(workspace, primarySctId);
  const frame = section.querySelector("[data-e2e-frame]");
  if (frame instanceof HTMLIFrameElement) {
    syncE2EFrame(frame);
  }
  if (!context) {
    return;
  }

  section.querySelectorAll("[data-e2e-related-count]").forEach((element) => {
    element.textContent = String(context.relatedScts.length);
  });
  const relatedSummary = section.querySelector("[data-e2e-related-summary]");
  if (relatedSummary) {
    relatedSummary.textContent = `${context.relatedScts.length} related SCT${context.relatedScts.length === 1 ? "" : "s"}`;
  }
  const contributionSummary = section.querySelector("[data-e2e-contribution-summary]");
  if (contributionSummary) {
    contributionSummary.textContent = `${context.contributions.length} contribution${context.contributions.length === 1 ? "" : "s"} available to place`;
  }
}

function postToE2EFrame(frame, message) {
  const targetOrigin = getFrameTargetOrigin(frame);
  frame.contentWindow?.postMessage(message, targetOrigin);
}

function isTrustedFrameMessage(event, frame) {
  if (event.source !== frame.contentWindow) {
    return false;
  }

  const targetOrigin = getFrameTargetOrigin(frame);
  return targetOrigin === "*" ? event.origin === "null" : event.origin === targetOrigin;
}

function getFrameTargetOrigin(frame) {
  try {
    const origin = new URL(frame.getAttribute("src") || "", window.location.href).origin;
    return origin === "null" ? "*" : origin;
  } catch (_error) {
    return window.location.origin === "null" ? "*" : window.location.origin;
  }
}

function ensureExportPanelFrame() {
  if (exportPanelFrame) {
    return exportPanelFrame;
  }

  const frame = document.createElement("iframe");
  frame.className = "export-panel-host-frame";
  frame.dataset.exportPanelFrame = "true";
  frame.title = "VSM7 export panel";
  frame.setAttribute("aria-hidden", "true");
  frame.src = "./design-previews/export-panel.html?host=vsm7&embed=1&v=20260729-steering-master-nav-audit";
  exportPanelFrame = frame;
  document.body.appendChild(frame);
  return frame;
}

function handleExportBridgeMessage(event) {
  const frame = ensureExportPanelFrame();
  const message = event.data;

  if (
    event.source !== frame.contentWindow
    || !message
    || typeof message !== "object"
    || message.api !== 1
    || !message.evt
  ) {
    return;
  }

  if (message.evt === "ready") {
    exportPanelReady = true;
    syncExportPanelSkin();
    flushExportPanelQueue();
    return;
  }

  if (message.evt === "needViewModel") {
    sendExportViewModel(message.stepId, message.tileId);
    return;
  }

  if (message.evt === "export") {
    void handleExportIntent(message);
    return;
  }

  if (message.evt === "cancel") {
    setExportPanelActive(false);
  }
}

function openExportPanel(stepId, tileId, scope = "tile", origin = "tile") {
  const normalizedTileId = normalizeExportTileId(tileId);
  const vm = buildExportViewModel(stepId, normalizedTileId, { origin, scope });
  if (!vm) {
    return;
  }

  setExportPanelActive(true);
  postToExportPanel({ cmd: "setViewModel", stepId, tileId: normalizedTileId, vm });
  syncExportPanelSkin();
  postToExportPanel({ cmd: "open", stepId, tileId: normalizedTileId, scope, origin });
}

function openStep7ExportPanel() {
  const frame = document.querySelector("[data-step7-frame]");
  if (!(frame instanceof HTMLIFrameElement)) {
    return;
  }

  syncStep7Frame(frame);
  const vm = buildExportViewModel("step7", "all", {
    origin: "step",
    scope: "step"
  });
  postToStep7Frame(frame, {
    cmd: "openExport",
    ...(vm ? { vm } : {})
  });
}

function sendExportViewModel(stepId, tileId) {
  const normalizedTileId = normalizeExportTileId(tileId);
  const vm = buildExportViewModel(stepId, normalizedTileId);
  if (!vm) {
    postToExportPanel({
      cmd: "exportError",
      message: "This export target is not available yet."
    });
    return;
  }

  postToExportPanel({ cmd: "setViewModel", stepId, tileId: normalizedTileId, vm });
}

function buildExportViewModel(stepId, tileId, target = {}) {
  return getExportViewModel(workspace, getExportAppState(), {
    stepId,
    tileId,
    ...target
  });
}

function normalizeExportTileId(tileId) {
  return tileId == null || tileId === "" ? null : tileId;
}

function getExportAppState() {
  return {
    selectedSctIds: [...selectedSctMergeIds],
    today: new Date().toISOString().slice(0, 10)
  };
}

async function handleExportIntent(intent) {
  try {
    saveNow();
    if (isStep6PanelExportIntent(intent)) {
      const artifact = await buildStep6PanelExport(intent);
      downloadBrowserBlob(artifact.blob, artifact.filename);
      postToExportPanel({
        cmd: "exportReady",
        requestId: intent.requestId,
        downloadName: artifact.filename
      });
      window.setTimeout(() => setExportPanelActive(false), 120);
      return;
    }

    const artifact = exportExportIntent(workspace, intent);
    postToExportPanel({
      cmd: "exportReady",
      requestId: intent.requestId,
      downloadName: artifact.filename
    });
    window.setTimeout(() => setExportPanelActive(false), 120);
  } catch (error) {
    postToExportPanel({
      cmd: "exportError",
      requestId: intent?.requestId,
      message: error?.message || "The export failed."
    });
  }
}

function isStep6PanelExportIntent(intent) {
  return intent?.api === 1
    && intent.stepId === "step6"
    && ["step6-e2e", "step6-channels"].includes(normalizeExportTileId(intent.tileId));
}

async function buildStep6PanelExport(intent) {
  const tileId = normalizeExportTileId(intent.tileId);

  if (tileId === "step6-e2e") {
    return buildStep6E2EPanelExport(intent);
  }

  if (tileId === "step6-channels") {
    return buildStep6ChannelsPanelExport(intent);
  }

  throw new Error("This Step VI export target is not available yet.");
}

async function buildStep6E2EPanelExport(intent) {
  const requestedFormat = normalizeStep6E2EExportFormat(intent.format);
  const frameFormat = ["pdf", "pptx"].includes(requestedFormat) ? "png" : requestedFormat;
  const frame = findPreferredFrame("[data-e2e-frame]");
  if (!(frame instanceof HTMLIFrameElement)) {
    throw new Error("The E2E route editor is not ready.");
  }

  const result = await e2eRouteExportCoordinator.request(
    frame,
    frameFormat,
    ["svg", "png"].includes(requestedFormat) ? intent.filename || "" : ""
  );

  if (requestedFormat === "pdf" || requestedFormat === "pptx") {
    const document = await buildE2ERouteDocument(
      requestedFormat,
      result.blob,
      getE2ERouteDocumentContext(frame.dataset.e2eSctId || "")
    );
    return {
      blob: document.blob,
      filename: exportIntentFilename(intent, document.filename, requestedFormat)
    };
  }

  return {
    blob: result.blob,
    filename: result.filename || exportIntentFilename(intent, `e2e-route.${requestedFormat}`, requestedFormat)
  };
}

async function buildStep6ChannelsPanelExport(intent) {
  const requestedFormat = normalizeStep6ChannelExportFormat(intent.format);
  const frame = findPreferredFrame("[data-channel-variety-frame]");
  if (!(frame instanceof HTMLIFrameElement)) {
    throw new Error("The communication variety editor is not ready.");
  }

  const result = await channelVarietyExportCoordinator.request(frame, requestedFormat, intent.filename || "");
  return {
    blob: result.blob,
    filename: result.filename || exportIntentFilename(intent, `communication-variety-check.${requestedFormat}`, requestedFormat)
  };
}

function normalizeStep6E2EExportFormat(format) {
  const value = String(format || "").toLowerCase();
  if (["svg", "png", "pdf", "pptx"].includes(value)) {
    return value;
  }

  throw new Error(`Unsupported E2E route export format: ${format || "unknown"}`);
}

function normalizeStep6ChannelExportFormat(format) {
  const value = String(format || "").toLowerCase();
  if (["svg", "png"].includes(value)) {
    return value;
  }

  throw new Error(`Unsupported communication variety export format: ${format || "unknown"}`);
}

function findPreferredFrame(selector) {
  const frames = [...document.querySelectorAll(selector)]
    .filter((frame) => frame instanceof HTMLIFrameElement);
  return frames.find((frame) => frame.closest(".step1-fullscreen-shell"))
    || frames.find(isVisibleFrame)
    || frames[0]
    || null;
}

function isVisibleFrame(frame) {
  return Boolean(frame.getClientRects().length);
}

function exportIntentFilename(intent, fallback, extension) {
  const value = String(intent?.filename || "").trim();
  if (!value) {
    return fallback;
  }

  return value.toLowerCase().endsWith(`.${extension}`) ? value : `${value}.${extension}`;
}

function syncExportPanelSkin() {
  postToExportPanel({
    cmd: "setSkin",
    skin: activeSkin === "command-deck" ? "deck" : "workshop"
  });
}

function postToExportPanel(message) {
  const frame = ensureExportPanelFrame();
  if (!exportPanelReady) {
    exportPanelQueue.push(message);
    return;
  }

  frame.contentWindow?.postMessage(message, "*");
}

function flushExportPanelQueue() {
  const frame = ensureExportPanelFrame();
  while (exportPanelQueue.length) {
    frame.contentWindow?.postMessage(exportPanelQueue.shift(), "*");
  }
}

function setExportPanelActive(isActive) {
  const frame = ensureExportPanelFrame();
  frame.classList.toggle("is-active", Boolean(isActive));
  frame.setAttribute("aria-hidden", isActive ? "false" : "true");

  if (isActive) {
    syncExportPanelFrameSize(frame);
  } else {
    frame.style.width = "";
    frame.style.height = "";
  }
}

/* Safari heal (belt-and-braces on top of the visibility-based hiding in styles.css): release Safari can
   leave a previously-hidden iframe's internal viewport at a stale size, so on every open we pin the frame
   to the LIVE viewport in px — an actual size change forces WebKit to resize the child FrameView — and
   force a synchronous layout. Kept in sync while open so a mid-open window resize can't go stale either. */
function syncExportPanelFrameSize(frame) {
  const root = document.documentElement;
  frame.style.width = `${root.clientWidth}px`;
  frame.style.height = `${root.clientHeight}px`;
  void frame.getBoundingClientRect();
}

window.addEventListener("resize", () => {
  if (exportPanelFrame && exportPanelFrame.classList.contains("is-active")) {
    syncExportPanelFrameSize(exportPanelFrame);
  }
});

function scheduleE2ERouteSave() {
  window.clearTimeout(e2eRouteSaveTimer);
  e2eRouteSaveTimer = window.setTimeout(() => {
    e2eRouteSaveTimer = null;
    saveNow();
  }, 180);
}

function getE2ERouteDocumentContext(taskId) {
  const task = workspace.step3.successCriticalTasks.find((candidate) => candidate.id === taskId);
  const model = getStep6RouteModel(workspace, taskId);
  const findings = getStep6FindingCandidates(workspace)
    .filter((candidate) => candidate.taskId === taskId)
    .map((candidate) => ({
      category: candidate.finding.category,
      severity: candidate.finding.severity,
      note: candidate.finding.note,
      affectedElement: candidate.affectedElement
    }));

  return {
    organizationName: workspace.organization.name,
    projectName: workspace.project.name,
    sifName: workspace.sif.name,
    sctNumber: task ? formatSctNumber(task.number) : "SCT",
    sctTitle: task?.title || "E2E route",
    routeName: model?.meta?.name || "E2E Process Robustness Check",
    findings
  };
}

function downloadBrowserBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
        <button
          class="ghost-button topbar-export-button"
          data-action="open-export-panel"
          data-export-step="app"
          data-export-scope="step"
          data-export-origin="app"
          title="Export whole project (Word report / JSON archive)"
          aria-label="Export whole project"
        >⬇ Export project</button>
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
      title="Open Steering Master"
      aria-label="Open Steering Master"
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

  return renderHostTileFullscreenLayer();
}

function renderStep1FullscreenLayer() {
  const tileCount = getStep1FullscreenTileCount(workspace, activeStep1Subpage);
  const safeTileIndex = clampStep1FullscreenTile(activeStep1FullscreenTile, tileCount);

  return `
    <section class="step1-fullscreen-overlay is-tile-fullscreen" aria-label="Fullscreen workshop tile">
      <button class="fullscreen-exit-button" data-action="tile-fullscreen-close" title="Exit fullscreen tile" aria-label="Exit fullscreen tile">x</button>
      ${renderStep1FullscreenTile(workspace, activeStep1Subpage, safeTileIndex)}
    </section>
  `;
}

function renderHostTileFullscreenLayer() {
  const tile = renderHostTileFullscreenContent();

  if (!tile) {
    return "";
  }

  return `
    <section class="step1-fullscreen-overlay is-tile-fullscreen" aria-label="Fullscreen workshop tile">
      <button class="fullscreen-exit-button" data-action="tile-fullscreen-close" title="Exit fullscreen tile" aria-label="Exit fullscreen tile">x</button>
      ${tile}
    </section>
  `;
}

function renderHostTileFullscreenContent() {
  if (activeView === "overview") {
    return renderOverviewFullscreenTile(workspace, activeHostFullscreenTile);
  }

  if (activeView === "step2") {
    return renderStep2FullscreenTile(workspace, activeHostFullscreenTile);
  }

  if (activeView === "step3") {
    return renderStep3FullscreenTile(workspace, taskSources, {
      selectedSctId,
      selectedSctMergeIds: [...selectedSctMergeIds],
      sctPriorityFilter,
      sctSourceFilter
    }, activeHostFullscreenTile);
  }

  if (activeView === "step4" && activeHostFullscreenTile === "contribution-matrix") {
    return renderStep4FullscreenTile(workspace, { sctPriorityFilter, sctSourceFilter });
  }

  if (activeView === "step5") {
    return renderStep5FullscreenTile(workspace, {
      activeStep5System,
      sctPriorityFilter,
      sctSourceFilter,
      vsmPaneVisible: vsmFramePaneVisibility.step5
    }, activeHostFullscreenTile);
  }

  if (activeView === "step6") {
    return renderStep6FullscreenTile(workspace, {
      selectedSctId: selectedStep6SctId
    }, activeHostFullscreenTile);
  }

  if (activeView === "implementation") {
    return renderImplementationFullscreenTile(workspace, activeHostFullscreenTile);
  }

  return "";
}

function clampStep1FullscreenTile(tileIndex, tileCount) {
  return Math.min(Math.max(Number(tileIndex) || 0, 0), Math.max(tileCount - 1, 0));
}

function supportsHostTileFullscreen(viewId) {
  return [
    "overview",
    "step1",
    "step2",
    "step3",
    "step4",
    "step5",
    "step6",
    "implementation"
  ].includes(viewId);
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
  return `<span
    class="save-indicator ${isSavedStatus(saveStatus) ? "is-saved" : "is-saving"}"
    data-save-indicator
    title="${escapeAttr(repository.description || "")}"
  >${escapeHtml(saveStatus)}</span>`;
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
    step2: () => renderStep2(workspace, activeStep2Subpage),
    step3: () => renderStep3(workspace, taskSources, vsmSystems, {
      activeSubpage: activeStep3Subpage,
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
    step6: () => renderStep6(workspace, {
      activeSubpage: activeStep6Subpage,
      selectedSctId: selectedStep6SctId
    }),
    step7: () => renderStep7(workspace),
    implementation: () => renderImplementation(workspace)
  };

  return (views[activeView] || views.overview)();
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
      evaluation: { label: "Continue with Variety Assessment", view: "step2", subpage: "assessment" }
    };
    const next = nextSubpages[activeStep1Subpage];
    return next?.subpage
      ? { action: "step1-subpage", ...next }
      : { action: "navigate", ...next };
  }

  if (activeView === "step3") {
    const nextSubpages = {
      signals: { label: "Continue with Complexity Drivers", subpage: "drivers" },
      drivers: { label: "Continue with SCT Register", subpage: "register" },
      register: { label: "Continue with Central/Decentral", view: "step4" }
    };
    const next = nextSubpages[activeStep3Subpage];
    return next?.subpage
      ? { action: "step3-subpage", ...next }
      : { action: "navigate", ...next };
  }

  if (activeView === "step2") {
    const nextSubpages = {
      assessment: { label: "Continue with Steering Challenges", subpage: "challenges" },
      challenges: { label: "Continue with SCT Input Signals", view: "step3", subpage: "signals" }
    };
    const next = nextSubpages[activeStep2Subpage];
    return next?.subpage
      ? { action: "step2-subpage", ...next }
      : { action: "navigate", ...next };
  }

  const nextByView = {
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
      const value = target.type === "checkbox" ? target.checked : target.value;
      const isStep3OptionalDetail = target.dataset.collection === "step3.successCriticalTasks"
        && ["kpi", "requiredArtifacts", "toolOrMethodologicalApproach"].includes(target.dataset.field);
      if (isStep3OptionalDetail) {
        setSuccessCriticalTaskOptionalDetail(workspace, target.dataset.id, target.dataset.field, value);
      } else {
        item[target.dataset.field] = value;
      }
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
    syncExportPanelSkin();
    render();
    return;
  }

  if (action === "reset-skin") {
    activeSkin = applySkinPreference(defaultSkin);
    syncExportPanelSkin();
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

  if (action === "step2-subpage") {
    activeStep2Subpage = normalizeStep2Subpage(button.dataset.subpage || "assessment");
    isFocusFullscreen = false;
    activeHostFullscreenTile = "";
    render();
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return;
  }

  if (action === "step3-subpage") {
    activeStep3Subpage = normalizeStep3Subpage(button.dataset.subpage || "signals");
    isFocusFullscreen = false;
    activeHostFullscreenTile = "";
    render();
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return;
  }

  if (action === "step6-subpage") {
    activeStep6Subpage = button.dataset.subpage === "channels" ? "channels" : "e2e";
    renderAfterInPlaceAction();
    return;
  }

  if (action === "navigate") {
    activeView = button.dataset.view || "overview";
    const navigatesToStep2Subpage = activeView === "step2" && button.dataset.subpage;
    const navigatesToStep3Subpage = activeView === "step3" && button.dataset.subpage;
    if (activeView === "step2" && button.dataset.subpage) {
      activeStep2Subpage = normalizeStep2Subpage(button.dataset.subpage);
    }
    if (activeView === "step3" && button.dataset.subpage) {
      activeStep3Subpage = normalizeStep3Subpage(button.dataset.subpage);
    }
    isSettingsOpen = false;
    if (!supportsHostTileFullscreen(activeView)) {
      isFocusFullscreen = false;
      activeHostFullscreenTile = "";
    }
    render();
    if (navigatesToStep2Subpage || navigatesToStep3Subpage) {
      window.requestAnimationFrame(() => window.scrollTo(0, 0));
    }
    return;
  }

  if (action === "step1-tile-fullscreen-open") {
    activeStep1Subpage = button.dataset.subpage || activeStep1Subpage;
    activeStep1FullscreenTile = clampStep1FullscreenTile(button.dataset.tile, getStep1FullscreenTileCount(workspace, activeStep1Subpage));
    activeHostFullscreenTile = "";
    isFocusFullscreen = true;
    isSettingsOpen = false;
    render();
    return;
  }

  if (action === "host-tile-fullscreen-open" || action === "step4-tile-fullscreen-open") {
    activeHostFullscreenTile = button.dataset.tile || "contribution-matrix";
    isFocusFullscreen = true;
    isSettingsOpen = false;
    render();
    return;
  }

  if (action === "tile-fullscreen-close" || action === "step1-fullscreen-close") {
    isFocusFullscreen = false;
    activeHostFullscreenTile = "";
    render();
    return;
  }

  if (action === "open-export-panel") {
    openExportPanel(button.dataset.exportStep, button.dataset.exportTile, button.dataset.exportScope || "tile", button.dataset.exportOrigin || "tile");
    return;
  }

  if (action === "open-step7-export") {
    openStep7ExportPanel();
    return;
  }

  if (action === "create-backlog-from-finding") {
    const item = createImplementationItemFromFinding(
      workspace,
      button.dataset.routeId || "",
      button.dataset.findingId || ""
    );
    if (item) {
      saveNow();
      renderAfterInPlaceAction();
    }
    return;
  }

  if (action === "create-backlog-from-channel-weakness") {
    const item = createImplementationItemFromChannelWeakness(
      workspace,
      button.dataset.loopId || "",
      button.dataset.criterionIndex || ""
    );
    if (item) {
      saveNow();
      renderAfterInPlaceAction();
    }
    return;
  }

  if (action === "open-channel-weakness-source") {
    activeView = "step6";
    activeStep6Subpage = "channels";
    isFocusFullscreen = false;
    render();
    return;
  }

  if (action === "open-e2e-finding-source") {
    const taskId = button.dataset.taskId || "";
    if (workspace.step3.successCriticalTasks.some((task) => task.id === taskId)) {
      activeView = "step6";
      activeStep6Subpage = "e2e";
      selectedStep6SctId = taskId;
      isFocusFullscreen = false;
      render();
    }
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
      setSaveStatus(savedStatusText());
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
    setSaveStatus(savedStatusText());
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
  setSaveStatus(savedStatusText());
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
  setSaveStatus(savedStatusText());
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
    setSaveStatus(savedStatusText());
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
    indicator.classList.toggle("is-saved", isSavedStatus(status));
  }
}

function savedStatusText() {
  return repository.isFileBacked ? "File saved" : "Saved just now";
}

function isSavedStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return normalized.startsWith("saved") || normalized.startsWith("file saved");
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
