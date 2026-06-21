import test from "node:test";
import assert from "node:assert/strict";
import {
  createAllocation,
  createImplementationItemFromFinding,
  createNumberedSuccessCriticalTask,
  createStep6RouteModel,
  createWorkspace,
  ensureWorkspaceShape,
  formatSctNumber,
  getStep6RouteContext,
  getStep6RelatedSctIds,
  getStep6FindingCandidates,
  getStep6RouteId,
  getStep6RouteModel,
  reconcileStep6RouteModel,
  setStep6RelatedSctIds,
  setStep6RouteModel
} from "../src/domain/vsm.js";
import {
  getActiveStep6SctId,
  renderStep6
} from "../src/presentation/steps/step6.js";
import {
  getGenericFocusTileCount,
  renderGenericFocusFullscreen
} from "../src/presentation/steps/focusMode.js";
import { renderImplementationWorkspace } from "../src/presentation/steps/implementation.js";
import { buildStepOutcome } from "../src/infrastructure/exporters.js";

function createRouteWorkspace() {
  const workspace = createWorkspace();
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = "Keep the customer promise";
  workspace.step3.successCriticalTasks.push(task);

  const allocation = createAllocation(task.id);
  const parent = workspace.step1.recursionLevels.find((item) => item.level === "R+1");
  const sif = workspace.step1.recursionLevels.find((item) => item.level === "R0");
  const nested = workspace.step1.recursionLevels.find((item) => item.level === "R-1");
  parent.name = "Group";
  sif.name = "Mobility Division";
  nested.name = "Product Unit";
  allocation.contributions[sif.id] = "Translate the promise into portfolio priorities.";
  allocation.contributions[nested.id] = "Deliver the agreed product and service promise.";
  workspace.step4.allocations[task.id] = allocation;

  return { workspace, task, parent, sif, nested };
}

test("Step VI route context uses stable Step I lane ids and actual SCT contributions", () => {
  const { workspace, task, parent, sif, nested } = createRouteWorkspace();
  const context = getStep6RouteContext(workspace, task.id);

  assert.deepEqual(context.lanes, [
    { id: parent.id, name: "Group", sub: "R+1" },
    { id: sif.id, name: "Mobility Division", sub: "R0" },
    { id: nested.id, name: "Product Unit", sub: "R-1" }
  ]);
  assert.deepEqual(context.contributions, [
    {
      id: `${task.id}|${sif.id}`,
      laneId: sif.id,
      label: "Translate the promise into portfolio priorities.",
      sctId: task.id,
      sctName: context.sct.name
    },
    {
      id: `${task.id}|${nested.id}`,
      laneId: nested.id,
      label: "Deliver the agreed product and service promise.",
      sctId: task.id,
      sctName: context.sct.name
    }
  ]);
  assert.equal(context.sct.id, task.id);
  assert.equal(context.sct.displayId, "SCT-001");
  assert.equal(context.sct.name, "Keep the customer promise");
});

test("a new SCT route starts empty instead of inheriting the editor demo", () => {
  const { workspace, task } = createRouteWorkspace();
  const model = createStep6RouteModel(workspace, task.id);

  assert.deepEqual(model.nodes, []);
  assert.deepEqual(model.links, []);
  assert.deepEqual(model.callouts, []);
  assert.deepEqual(model.findings, []);
  assert.equal(model.meta.sctId, task.id);
  assert.equal(model.meta.primarySctId, task.id);
  assert.deepEqual(model.meta.relatedSctIds, []);
  assert.equal(model.lanes.length, 3);
});

test("Step VI combines explicitly related SCT contributions without duplicating SCTs", () => {
  const { workspace, task, sif } = createRouteWorkspace();
  const related = createNumberedSuccessCriticalTask(workspace);
  related.title = "Coordinate shared capacity";
  workspace.step3.successCriticalTasks.push(related);
  const relatedAllocation = createAllocation(related.id);
  relatedAllocation.contributions[sif.id] = "Resolve capacity dependencies across the route.";
  workspace.step4.allocations[related.id] = relatedAllocation;

  assert.equal(setStep6RelatedSctIds(workspace, task.id, [related.id, related.id, task.id]), true);
  const context = getStep6RouteContext(workspace, task.id);

  assert.deepEqual(getStep6RelatedSctIds(workspace, task.id), [related.id]);
  assert.deepEqual(context.relatedScts, [{
    id: related.id,
    displayId: formatSctNumber(related.number),
    name: "Coordinate shared capacity"
  }]);
  assert.deepEqual(context.contributions.at(-1), {
    id: `${related.id}|${sif.id}`,
    laneId: sif.id,
    label: "Resolve capacity dependencies across the route.",
    sctId: related.id,
    sctName: context.relatedScts[0].name
  });
});

test("related SCT names resolve live while removed sources remain traceable", () => {
  const { workspace, task, sif } = createRouteWorkspace();
  const related = createNumberedSuccessCriticalTask(workspace);
  related.title = "Coordinate capacity";
  workspace.step3.successCriticalTasks.push(related);
  const allocation = createAllocation(related.id);
  allocation.contributions[sif.id] = "Share capacity.";
  workspace.step4.allocations[related.id] = allocation;
  setStep6RelatedSctIds(workspace, task.id, [related.id]);

  related.title = "Coordinate scarce capacity";
  assert.match(getStep6RouteContext(workspace, task.id).relatedScts[0].name, /Coordinate scarce capacity/);

  const model = getStep6RouteModel(workspace, task.id);
  model.nodes.push({
    id: "s-related",
    kind: "step",
    laneId: sif.id,
    col: 1,
    label: "Share capacity",
    contribId: `${related.id}|${sif.id}`,
    contribSctId: related.id
  });
  setStep6RouteModel(workspace, task.id, model);
  workspace.step3.successCriticalTasks = workspace.step3.successCriticalTasks.filter((candidate) => candidate.id !== related.id);

  const context = getStep6RouteContext(workspace, task.id);
  const restored = getStep6RouteModel(workspace, task.id);
  assert.deepEqual(context.relatedScts, []);
  assert.deepEqual(context.unavailableRelatedSctIds, [related.id]);
  assert.equal(restored.nodes[0].contribSctId, related.id);
  assert.equal(restored.nodes[0].contribId, `${related.id}|${sif.id}`);
});

test("Step VI persists findings while reconciling host-owned lanes", () => {
  const { workspace, task, sif } = createRouteWorkspace();
  const model = {
    meta: { name: "Customer promise route", sct: "Keep the customer promise", sctId: task.id },
    lanes: [{ id: sif.id, name: sif.name, sub: sif.level }],
    nodes: [{ id: "node:trigger", kind: "trigger", laneId: sif.id, col: 0, label: "Contract signed" }],
    links: [],
    callouts: [{ id: "callout:1", kind: "context", target: { type: "node", id: "node:trigger" }, text: "Start", dx: 1, dy: 2 }],
    findings: [{
      id: "fd9",
      target: { type: "node", id: "node:trigger" },
      category: "bottleneck",
      severity: "high",
      note: "Approval waits for one specialist."
    }]
  };

  assert.equal(setStep6RouteModel(workspace, task.id, model), true);
  assert.deepEqual(workspace.step6.e2eRoutes[task.id].findings, model.findings);
  assert.deepEqual(workspace.step6.e2eRoutes[task.id].lanes, getStep6RouteContext(workspace, task.id).lanes);
  model.nodes[0].label = "Mutated outside the workspace";
  assert.equal(workspace.step6.e2eRoutes[task.id].nodes[0].label, "Contract signed");
});

test("legacy routes receive findings and a stable host route identity", () => {
  const { workspace, task } = createRouteWorkspace();
  workspace.step6.e2eRoutes[task.id] = {
    meta: { name: "Legacy route", sctId: task.id },
    lanes: [],
    nodes: [],
    links: [],
    callouts: []
  };

  const model = getStep6RouteModel(workspace, task.id);
  const firstId = getStep6RouteId(workspace, task.id);

  assert.deepEqual(model.findings, []);
  assert.equal(model.meta.primarySctId, task.id);
  assert.deepEqual(model.meta.relatedSctIds, []);
  assert.match(firstId, /^e2e-route-/);
  assert.equal(getStep6RouteId(workspace, task.id), firstId);
});

test("workspace repair detaches orphaned routes instead of deleting their findings", () => {
  const { workspace, task, sif } = createRouteWorkspace();
  const model = createStep6RouteModel(workspace, task.id);
  model.nodes.push({ id: "n1", kind: "step", laneId: sif.id, col: 1, label: "Inspect" });
  model.findings.push({ id: "fd1", target: { type: "node", id: "n1" }, category: "bottleneck", severity: "high", note: "Queue" });
  setStep6RouteModel(workspace, task.id, model);
  const routeId = getStep6RouteId(workspace, task.id);
  workspace.step3.successCriticalTasks = [];

  const repaired = ensureWorkspaceShape(workspace);

  assert.equal(repaired.step6.e2eRoutes[task.id], undefined);
  assert.equal(repaired.step6.detachedRoutes[routeId].model.findings[0].id, "fd1");
  assert.equal(repaired.step6.detachedRoutes[routeId].reason, "missing-sct");
});

test("findings become explicit backlog candidates with navigable source ids", () => {
  const { workspace, task, sif } = createRouteWorkspace();
  const model = createStep6RouteModel(workspace, task.id);
  model.nodes.push({ id: "n1", kind: "step", laneId: sif.id, col: 1, label: "Validate release" });
  model.findings.push({
    id: "fd1",
    target: { type: "node", id: "n1" },
    category: "quality-risk",
    severity: "high",
    note: "Validation depends on manual evidence."
  });
  setStep6RouteModel(workspace, task.id, model);
  const routeId = getStep6RouteId(workspace, task.id);
  const candidate = getStep6FindingCandidates(workspace)[0];

  assert.equal(candidate.routeId, routeId);
  assert.equal(candidate.affectedElement, "Validate release");
  assert.equal(candidate.converted, false);

  const item = createImplementationItemFromFinding(workspace, routeId, "fd1");
  assert.deepEqual(item.source, { kind: "e2e-finding", routeId, findingId: "fd1" });
  assert.equal(item.sourceStatus, "active");
  assert.equal(getStep6FindingCandidates(workspace)[0].converted, true);
  assert.equal(createImplementationItemFromFinding(workspace, routeId, "fd1"), null);
});

test("finding candidates render explicit backlog and source-navigation actions", () => {
  const { workspace, task, sif } = createRouteWorkspace();
  const model = createStep6RouteModel(workspace, task.id);
  model.nodes.push({ id: "n1", kind: "step", laneId: sif.id, col: 1, label: "Validate release" });
  model.findings.push({ id: "fd1", target: { type: "node", id: "n1" }, category: "quality-risk", severity: "high", note: "Manual evidence" });
  setStep6RouteModel(workspace, task.id, model);
  const routeId = getStep6RouteId(workspace, task.id);

  const candidateHtml = renderImplementationWorkspace(workspace);
  assert.match(candidateHtml, /Create backlog item/);
  assert.match(candidateHtml, /data-action="open-e2e-finding-source"/);
  assert.match(candidateHtml, new RegExp(`data-route-id="${routeId}"`));

  createImplementationItemFromFinding(workspace, routeId, "fd1");
  const backlogHtml = renderImplementationWorkspace(workspace);
  assert.match(backlogHtml, /Added to backlog/);
  assert.match(backlogHtml, /E2E finding/);
  assert.match(backlogHtml, /Open route/);
});

test("Step VI export lists structured findings and their affected elements", () => {
  const { workspace, task, sif } = createRouteWorkspace();
  const model = createStep6RouteModel(workspace, task.id);
  model.nodes.push({ id: "n1", kind: "step", laneId: sif.id, col: 1, label: "Release approval" });
  model.findings.push({ id: "fd1", target: { type: "node", id: "n1" }, category: "delay", severity: "high", note: "Waiting for approval" });
  setStep6RouteModel(workspace, task.id, model);

  const artifact = buildStepOutcome(workspace, "step6");
  assert.match(artifact.content, /Waiting for approval/);
  assert.match(artifact.content, /Release approval/);
  assert.match(artifact.content, /fd1/);
});

test("removing a finding keeps linked backlog work and flags its source", () => {
  const { workspace, task, sif } = createRouteWorkspace();
  const model = createStep6RouteModel(workspace, task.id);
  model.nodes.push({ id: "n1", kind: "step", laneId: sif.id, col: 1, label: "Approve" });
  model.findings.push({ id: "fd1", target: { type: "node", id: "n1" }, category: "delay", severity: "medium", note: "Wait" });
  setStep6RouteModel(workspace, task.id, model);
  const routeId = getStep6RouteId(workspace, task.id);
  const item = createImplementationItemFromFinding(workspace, routeId, "fd1");

  model.findings = [];
  setStep6RouteModel(workspace, task.id, model);

  assert.equal(workspace.implementation.items.includes(item), true);
  assert.equal(item.sourceStatus, "source-removed");
});

test("route reconciliation preserves authored ids and moves orphaned nodes to a current lane", () => {
  const { workspace, task, parent, sif } = createRouteWorkspace();
  const model = {
    meta: { name: "Route", sct: "Old", sctId: task.id },
    lanes: [{ id: "removed-lane", name: "Removed", sub: "R-9" }],
    nodes: [
      { id: "node:1", kind: "trigger", laneId: "removed-lane", col: 0, label: "Trigger" },
      { id: "node:2", kind: "result", laneId: sif.id, col: 2, label: "Result" }
    ],
    links: [{ id: "link:1", from: "node:1", to: "node:2" }],
    callouts: [{ id: "callout:1", kind: "transition", target: { type: "link", id: "link:1" }, text: "Risk", dx: 0, dy: 0 }]
  };
  const reconciled = reconcileStep6RouteModel(workspace, task.id, model);

  assert.equal(reconciled.nodes[0].laneId, parent.id);
  assert.equal(reconciled.nodes[1].laneId, sif.id);
  assert.equal(reconciled.links[0].id, "link:1");
  assert.equal(reconciled.callouts[0].target.id, "link:1");
  assert.deepEqual(reconciled.lanes, getStep6RouteContext(workspace, task.id).lanes);
  assert.equal(reconciled.meta.sctId, task.id);
});

test("saved routes are restored through the reconciled Step I truth", () => {
  const { workspace, task, sif } = createRouteWorkspace();
  const model = createStep6RouteModel(workspace, task.id);
  model.nodes.push({ id: "node:1", kind: "step", laneId: sif.id, col: 1, label: "Decide" });
  setStep6RouteModel(workspace, task.id, model);

  workspace.step1.recursionLevels.find((item) => item.id === sif.id).name = "Renamed Division";
  const restored = getStep6RouteModel(workspace, task.id);

  assert.equal(restored.nodes[0].laneId, sif.id);
  assert.equal(restored.lanes.find((lane) => lane.id === sif.id).name, "Renamed Division");
});

test("unknown SCT ids cannot create or persist routes", () => {
  const workspace = createWorkspace();
  assert.equal(getStep6RouteContext(workspace, "missing"), null);
  assert.equal(createStep6RouteModel(workspace, "missing"), null);
  assert.equal(setStep6RouteModel(workspace, "missing", {}), false);
});

test("Step VI normal view exposes its two substeps and the static route editor", () => {
  const { workspace, task } = createRouteWorkspace();
  const related = createNumberedSuccessCriticalTask(workspace);
  related.title = "Coordinate shared capacity";
  workspace.step3.successCriticalTasks.push(related);
  const html = renderStep6(workspace, { activeSubpage: "e2e", selectedSctId: task.id });

  assert.match(html, /E2E Robustness Check/);
  assert.match(html, /Communication Variety Checks/);
  assert.match(html, /src="\.\/e2e-robustness-check\.html"/);
  assert.match(html, /allow="fullscreen"/);
  assert.match(html, /sandbox="allow-scripts allow-same-origin allow-downloads"/);
  assert.match(html, new RegExp(`data-e2e-sct-id="${task.id}"`));
  assert.match(html, /data-step6-sct-select/);
  assert.match(html, /Primary Success-Critical Task/);
  assert.match(html, /data-e2e-related-picker/);
  assert.match(html, /data-step6-related-sct/);
  assert.match(html, new RegExp(`value="${related.id}"`));
  assert.match(html, /data-action="export-e2e-route" data-format="svg"/);
  assert.match(html, /data-action="export-e2e-route" data-format="png"/);
  assert.match(html, /data-action="export-e2e-route" data-format="pdf"/);
  assert.match(html, /data-action="export-e2e-route" data-format="pptx"/);

  const channels = renderStep6(workspace, { activeSubpage: "channels", selectedSctId: task.id });
  assert.match(channels, /Communication Variety Checks/);
  assert.match(channels, /src="\.\/channel-variety-check\.html\?vsm=\/vsm\.html&assetVersion=20260621-channel-variety-eight"/);
  assert.match(channels, /data-channel-variety-frame/);
  assert.match(channels, /channel-variety-frame-shell/);
  assert.match(channels, /allow="fullscreen"/);
  assert.match(channels, /sandbox="allow-scripts allow-same-origin allow-downloads"/);
  assert.match(channels, /8 canonical vertical loops/);
  assert.match(channels, /data-action="export-channel-variety" data-format="svg"/);
  assert.match(channels, /data-action="export-channel-variety" data-format="png"/);
  assert.doesNotMatch(channels, /<h2>Communication Variety Checks<\/h2>/);
  assert.doesNotMatch(channels, /data-e2e-frame/);
});

test("Step VI route view explains when no SCT is available", () => {
  const workspace = createWorkspace();
  assert.equal(getActiveStep6SctId(workspace, "missing"), "");
  assert.match(renderStep6(workspace), /Capture at least one SCT in Step III/);
});

test("Step VI focus mode contains separate E2E route and communication tiles", () => {
  const { workspace, task } = createRouteWorkspace();
  const related = createNumberedSuccessCriticalTask(workspace);
  related.title = "Coordinate shared capacity";
  workspace.step3.successCriticalTasks.push(related);
  const context = { selectedStep6SctId: task.id };

  assert.equal(getGenericFocusTileCount(workspace, "step6", context), 3);
  assert.match(renderGenericFocusFullscreen(workspace, "step6", 1, context), /data-e2e-frame/);
  assert.match(renderGenericFocusFullscreen(workspace, "step6", 1, context), /data-action="export-e2e-route"/);
  assert.match(renderGenericFocusFullscreen(workspace, "step6", 1, context), /data-e2e-related-picker/);
  const channelTile = renderGenericFocusFullscreen(workspace, "step6", 2, context);
  assert.match(channelTile, /title="Communication variety checks for/);
  assert.doesNotMatch(channelTile, /<h1>Communication Variety Checks<\/h1>/);
  assert.match(channelTile, /data-channel-variety-frame/);
});
