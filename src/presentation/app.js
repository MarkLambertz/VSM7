import {
  createAllocation,
  createImplementationItem,
  createKeyBuyingCriterion,
  createMeeting,
  createOperativeUnit,
  createRecursionLevel,
  createRole,
  createSegmentationOption,
  createStrategicFile,
  createStrategicField,
  createStrategicLink,
  createSuccessCriticalTask,
  createWorkspace,
  stepDefinitions,
  syncAllocations,
  taskSources,
  vsmSystems
} from "../domain/vsm.js?v=20260530-step2-neutral";
import { evaluateCompleteness } from "../domain/completeness.js?v=20260530-step2-neutral";
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
} from "../application/workspaceService.js?v=20260530-step2-neutral";
import { createSampleWorkspace } from "../application/sampleWorkspaceFactory.js?v=20260530-step2-neutral";
import { createLocalStorageRepository } from "../infrastructure/localStorageRepository.js?v=20260530-step2-neutral";
import { exportProjectJson, exportProjectReport, exportStepOutcome } from "../infrastructure/exporters.js?v=20260530-step2-neutral";
import { escapeAttr, escapeHtml } from "./shared/renderHelpers.js?v=20260530-step2-neutral";
import { renderProjectManagement } from "./projectManagement.js?v=20260530-step2-neutral";
import { renderStartPage } from "./startPage.js?v=20260530-step2-neutral";
import { renderOverview } from "./steps/overview.js?v=20260530-step2-neutral";
import { renderImplementation } from "./steps/implementation.js?v=20260530-step2-neutral";
import {
  focusStepOrder,
  getGenericFocusStepTitle,
  getGenericFocusTileCount,
  hasGenericFocusMode,
  renderGenericFocusFullscreen
} from "./steps/focusMode.js?v=20260530-step2-neutral";
import { getStep1FullscreenTileCount, renderStep1, renderStep1Fullscreen, step1Subpages } from "./steps/step1.js?v=20260530-step2-neutral";
import { renderStep2 } from "./steps/step2.js?v=20260530-step2-neutral";
import { renderStep3 } from "./steps/step3.js?v=20260530-step2-neutral";
import { renderStep4 } from "./steps/step4.js?v=20260530-step2-neutral";
import { renderStep5 } from "./steps/step5.js?v=20260530-step2-neutral";
import { renderStep6 } from "./steps/step6.js?v=20260530-step2-neutral";
import { renderStep7 } from "./steps/step7.js?v=20260530-step2-neutral";

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
let isCompletenessOpen = false;
let isNavCollapsed = false;
let saveStatus = "Saved";
let saveTimer = null;
let lastAction = { button: null, at: 0 };

render();

app.addEventListener("input", (event) => {
  void handleInput(event.target);
  scheduleSave();
});

app.addEventListener("change", async (event) => {
  await handleInput(event.target);
  saveNow();
  render();
});

app.addEventListener("click", dispatchAction);

app.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  dispatchAction(event);
});

document.addEventListener("keydown", (event) => {
  if (!isFocusFullscreen || event.key !== "Escape") {
    return;
  }

  event.preventDefault();
  isFocusFullscreen = false;
  render();
});

function render() {
  syncAllocations(workspace);
  document.body.classList.toggle("has-fullscreen-workshop", isFocusFullscreen);
  const completeness = evaluateCompleteness(workspace);
  const projects = listWorkspaces(repository);
  selectedOrganizationId = normalizeSelectedOrganization(projects);
  const showStepNavigation = activeView !== "start" && activeView !== "projects";

  app.innerHTML = `
    <header class="topbar">
      <div class="brand-block">
        ${renderBrandMark()}
        <div>
          <div class="eyebrow">Workshop workspace</div>
          <strong>${escapeHtml(workspace.project.name || "New VSM Project")}</strong>
        </div>
      </div>
      <div class="topbar-context">
        ${headerContextItem("Organization", workspace.organization.name || "New Organization")}
        ${headerContextItem("Project", workspace.project.name || "New VSM Project")}
        ${headerContextItem("SIF", workspace.sif.name || "System-in-Focus")}
      </div>
      <div class="topbar-actions">
        ${renderSaveIndicator()}
        ${renderCompletenessTrigger(completeness)}
        <button class="ghost-button ${activeView === "start" ? "is-active" : ""}" data-action="navigate" data-view="start">Start</button>
        <button class="ghost-button ${activeView === "projects" ? "is-active" : ""}" data-action="navigate" data-view="projects">Projects</button>
        <button class="ghost-button" data-action="export-project-report">Report</button>
        <button class="ghost-button" data-action="export-project-json">Archive</button>
        ${renderTopbarFocusButton()}
      </div>
      ${isCompletenessOpen ? renderCompletenessLayer(completeness) : ""}
    </header>
    <div class="workspace-layout ${showStepNavigation ? "" : "no-rail"} ${isNavCollapsed ? "nav-collapsed" : ""}">
      ${showStepNavigation ? renderNavigation(completeness) : ""}
      <main class="main-surface">
        ${renderActiveView(completeness, projects)}
        ${renderFlowFooter()}
      </main>
    </div>
    ${renderFocusFullscreenLayer()}
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
  return { taskSources, vsmSystems };
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

function renderNavigation(completeness) {
  const scores = new Map(completeness.byStep.map((step) => [step.stepId, step.score]));

  return `
    <nav class="step-rail ${isNavCollapsed ? "is-collapsed" : ""}" aria-label="VSM steps">
      ${stepDefinitions.map((step) => `
        <button
          class="step-button ${step.id === "overview" ? "is-home" : ""} ${activeView === step.id ? "is-active" : ""}"
          data-action="navigate"
          data-view="${step.id === "overview" ? "start" : step.id}"
          aria-label="${escapeAttr(step.id === "overview" ? "Home" : navLabel(step))}"
        >
          ${renderStepToken(step)}
          ${step.id === "overview" ? "" : `
            <span>
              <strong>${escapeHtml(navLabel(step))}</strong>
            </span>
          `}
          ${step.id === "overview" ? "" : `<span class="step-score">${scores.get(step.id) ?? 0}%</span>`}
        </button>
      `).join("")}
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

function renderActiveView(completeness, projects) {
  const views = {
    start: () => renderStartPage(workspace, projects),
    projects: () => renderProjectManagement(workspace, projects, selectedOrganizationId),
    overview: () => renderOverview(workspace, completeness, stepDefinitions),
    step1: () => renderStep1(workspace, activeStep1Subpage),
    step2: () => renderStep2(workspace),
    step3: () => renderStep3(workspace, taskSources, vsmSystems),
    step4: () => renderStep4(workspace),
    step5: () => renderStep5(workspace),
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
  if (!nextAction) {
    return "";
  }

  return `
    <section class="flow-footer">
      <button
        class="primary-button"
        data-action="${escapeAttr(nextAction.action)}"
        ${nextAction.view ? `data-view="${escapeAttr(nextAction.view)}"` : ""}
        ${nextAction.subpage ? `data-subpage="${escapeAttr(nextAction.subpage)}"` : ""}
      >
        ${escapeHtml(nextAction.label)}
      </button>
    </section>
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
    step4: { label: "Continue with Design S2-S5", view: "step5" },
    step5: { label: "Continue with Channels", view: "step6" },
    step6: { label: "Continue with Representation", view: "step7" },
    step7: { label: "Continue with Implementation", view: "implementation" }
  };

  return nextByView[activeView] ? { action: "navigate", ...nextByView[activeView] } : null;
}

function renderCompletenessTrigger(completeness) {
  const activeStep = completeness.byStep.find((step) => step.stepId === activeView);
  const score = activeStep ? activeStep.score : completeness.score;

  return `
    <button
      class="completeness-trigger"
      data-action="toggle-completeness"
      aria-expanded="${isCompletenessOpen ? "true" : "false"}"
    >
      <span>Check</span>
      <strong>${score}%</strong>
    </button>
  `;
}

function renderCompletenessLayer(completeness) {
  const activeStep = completeness.byStep.find((step) => step.stepId === activeView);
  const activeNotes = activeStep
    ? [...activeStep.missing, ...activeStep.warnings]
    : completeness.blockers.slice(0, 5).map((item) => item.message);

  return `
    <section class="completeness-layer" aria-label="Completeness Check per Step">
      <div class="completeness-layer-header">
        <div>
          <p class="eyebrow">Completeness Check</p>
          <h2>${activeStep ? escapeHtml(stepLabel(activeStep.stepId)) : "Project"} ${activeStep ? `${activeStep.score}%` : `${completeness.score}%`}</h2>
        </div>
        <button class="icon-button" data-action="close-completeness" title="Close">x</button>
      </div>
      <div class="completeness-summary">
        <strong>${completeness.score}%</strong>
        <span>Overall project completeness</span>
      </div>
      <div class="completeness-step-list">
        ${completeness.byStep.map((step) => renderCompletenessStep(step)).join("")}
      </div>
      <ul class="completeness-notes">
        ${activeNotes.length > 0
          ? activeNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")
          : "<li>No open completeness notes for this view.</li>"}
      </ul>
    </section>
  `;
}

function renderCompletenessStep(step) {
  const openItems = step.missing.length + step.warnings.length;

  return `
    <button class="completeness-step ${activeView === step.stepId ? "is-active" : ""}" data-action="navigate" data-view="${escapeAttr(step.stepId)}">
      <span>${escapeHtml(stepLabel(step.stepId))}</span>
      <small>${openItems === 0 ? "Complete for now" : `${openItems} open item${openItems === 1 ? "" : "s"}`}</small>
      <strong>${step.score}%</strong>
    </button>
  `;
}

function stepLabel(stepId, field = "label") {
  return stepDefinitions.find((step) => step.id === stepId)?.[field] || stepId;
}

async function handleInput(target) {
  if (!(target instanceof HTMLElement)) {
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

  if (target.dataset.allocationLevel) {
    const [taskId, level] = target.dataset.allocationLevel.split("|");
    workspace.step4.allocations[taskId] ||= createAllocation(taskId);
    workspace.step4.allocations[taskId].levels[level] = target.checked;
  }

  if (target.dataset.allocationField) {
    const [taskId, fieldName] = target.dataset.allocationField.split("|");
    workspace.step4.allocations[taskId] ||= createAllocation(taskId);
    workspace.step4.allocations[taskId][fieldName] = target.value;
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

  if (action === "toggle-completeness") {
    isCompletenessOpen = !isCompletenessOpen;
    render();
    return;
  }

  if (action === "toggle-nav") {
    isNavCollapsed = !isNavCollapsed;
    render();
    return;
  }

  if (action === "close-completeness") {
    isCompletenessOpen = false;
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
    isCompletenessOpen = false;
    if (activeView !== "step1" && !hasGenericFocusMode(activeView)) {
      isFocusFullscreen = false;
    }
    render();
    return;
  }

  if (action === "step1-fullscreen-open") {
    activeStep1FullscreenTile = 0;
    isFocusFullscreen = true;
    isCompletenessOpen = false;
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
    isCompletenessOpen = false;
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

  if (action === "new-workspace") {
    workspace = replaceWorkspace(repository, createWorkspace());
    selectedOrganizationId = workspace.organization.id || "";
    activeView = "start";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    isCompletenessOpen = false;
    render();
    return;
  }

  if (action === "load-sample") {
    workspace = replaceWorkspace(repository, createSampleWorkspace());
    selectedOrganizationId = workspace.organization.id || "";
    activeView = "overview";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    isCompletenessOpen = false;
    render();
    return;
  }

  if (action === "add-project") {
    workspace = replaceWorkspace(repository, createProjectWorkspace(selectedOrganizationId));
    selectedOrganizationId = workspace.organization.id || "";
    activeView = "overview";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    isCompletenessOpen = false;
    render();
    return;
  }

  if (action === "add-organization") {
    workspace = replaceWorkspace(repository, createWorkspace());
    selectedOrganizationId = workspace.organization.id || "";
    activeView = "projects";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    isCompletenessOpen = false;
    render();
    return;
  }

  if (action === "open-project") {
    workspace = openWorkspace(repository, button.dataset.projectId);
    selectedOrganizationId = workspace.organization.id || "";
    activeView = "overview";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    isCompletenessOpen = false;
    render();
    return;
  }

  if (action === "open-organization") {
    selectedOrganizationId = button.dataset.organizationId || button.dataset.organizationName || selectedOrganizationId;
    activeView = "projects";
    activeStep1Subpage = "sif";
    isFocusFullscreen = false;
    isCompletenessOpen = false;
    render();
    return;
  }

  if (action === "select-organization") {
    selectedOrganizationId = button.dataset.organizationId || selectedOrganizationId;
    activeView = "projects";
    isCompletenessOpen = false;
    render();
    return;
  }

  if (action === "rename-project") {
    renameProjectFromButton(button);
    return;
  }

  if (action === "rename-organization") {
    renameOrganizationFromButton(button);
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
    render();
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
    render();
    return;
  }

  if (action === "remove-strategic-file") {
    removeStrategicFile(button.dataset.fieldId, button.dataset.fileId);
    saveNow();
    render();
    return;
  }

  addItem(action);
  saveNow();
  render();
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
    "add-sct": () => {
      const task = createSuccessCriticalTask();
      workspace.step3.successCriticalTasks.push(task);
      workspace.step4.allocations[task.id] = createAllocation(task.id);
    },
    "add-meeting": () => workspace.step5.meetings.push(createMeeting()),
    "add-role": () => workspace.step7.roles.push(createRole()),
    "add-implementation": () => workspace.implementation.items.push(createImplementationItem())
  };

  additions[action]?.();
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

function renameProjectFromButton(button) {
  const projectId = button.dataset.projectId;
  const currentName = button.dataset.projectName || "Untitled project";
  const name = window.prompt("Rename project", currentName)?.trim();

  if (!projectId || !name || name === currentName) {
    return;
  }

  if (projectId === workspace.project.id) {
    workspace.project.name = name;
    saveNow();
  } else {
    renameWorkspace(repository, projectId, name);
    setSaveStatus("Saved just now");
  }

  render();
}

function renameOrganizationFromButton(button) {
  const organizationId = button.dataset.organizationId;
  const currentName = button.dataset.organizationName || "Unnamed Organization";
  const name = window.prompt("Rename organization", currentName)?.trim();

  if (!organizationId || !name || name === currentName) {
    return;
  }

  saveNow();
  renameOrganization(repository, organizationId, name);

  if (projectBelongsToOrganization({
    organizationId: workspace.organization.id,
    organizationName: currentName
  }, organizationId)) {
    workspace = openWorkspace(repository, workspace.project.id);
  }

  selectedOrganizationId = organizationId;
  setSaveStatus("Saved just now");
  render();
}

function deleteProjectFromButton(button) {
  const projectId = button.dataset.projectId;
  const projectName = button.dataset.projectName || "this project";

  if (!projectId || !window.confirm(`Delete "${projectName}"? This cannot be undone.`)) {
    return;
  }

  workspace = deleteWorkspace(repository, projectId);
  activeView = "projects";
  activeStep1Subpage = "sif";
  isFocusFullscreen = false;
  isCompletenessOpen = false;

  if (!listWorkspaces(repository).length) {
    workspace = replaceWorkspace(repository, createWorkspace());
  }

  selectedOrganizationId = workspace.organization.id || "";
  setSaveStatus("Saved just now");
  render();
}

function deleteOrganizationFromButton(button) {
  const organizationId = button.dataset.organizationId;
  const organizationName = button.dataset.organizationName || "this organization";
  const projectCount = Number(button.dataset.projectCount || 0);
  const projectText = `${projectCount} project${projectCount === 1 ? "" : "s"}`;

  if (!organizationId || !window.confirm(`Delete "${organizationName}" and ${projectText}? This cannot be undone.`)) {
    return;
  }

  workspace = deleteOrganization(repository, organizationId);
  activeView = "projects";
  activeStep1Subpage = "sif";
  isFocusFullscreen = false;
  isCompletenessOpen = false;

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
  saveWorkspace(repository, workspace);
  setSaveStatus("Saved just now");
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

  if (collectionPath === "step3.successCriticalTasks") {
    delete workspace.step4.allocations[id];
    removeTaskReferences(id);
  }
}

function removeTaskReferences(taskId) {
  for (const item of [...workspace.step5.meetings, ...workspace.step7.roles]) {
    item.linkedTaskIds = item.linkedTaskIds.filter((id) => id !== taskId);
  }
}
