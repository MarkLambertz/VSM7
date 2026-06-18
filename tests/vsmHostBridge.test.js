import test from "node:test";
import assert from "node:assert/strict";
import { createOperativeUnit, createRecursionLevel, createWorkspace } from "../src/domain/vsm.js";
import {
  buildVsmHostTree,
  getVsmSystemType,
  recursionLevelLabel,
  recursionLevelValue,
  renderVsmHostFrame
} from "../src/presentation/shared/vsmHostBridge.js";

test("VSM iframe host frame renders the shared vsm.html entry point", () => {
  const html = renderVsmHostFrame("step5", "Step V map");

  assert.match(html, /data-vsm-frame/);
  assert.match(html, /data-vsm-context="step5"/);
  assert.match(html, /src="\.\/vsm\.html"/);
});

test("VSM host tree uses stable recursion organization ids", () => {
  const workspace = createWorkspace();
  const parent = workspace.step1.recursionLevels.find((item) => item.level === "R+1");
  const sif = workspace.step1.recursionLevels.find((item) => item.level === "R0");
  const child = workspace.step1.recursionLevels.find((item) => item.level === "R-1");
  parent.name = "Parent system";
  sif.name = "System-in-Focus";
  child.name = "Operative unit";

  const { tree, pathIds, sifId } = buildVsmHostTree(workspace);

  assert.equal(tree.id, parent.id);
  assert.equal(tree.name, "Parent system");
  assert.deepEqual(pathIds, [parent.id, sif.id]);
  assert.equal(sifId, sif.id);
  assert.equal(tree.children[0].id, sif.id);
  assert.equal(tree.children[0].children[0].id, child.id);
});

test("VSM host tree uses real Step I operative units as S1 children when available", () => {
  const workspace = createWorkspace();
  const sif = workspace.step1.recursionLevels.find((item) => item.level === "R0");
  workspace.step1.operativeUnits = [
    createOperativeUnit("Sovereign AI Assistant Platform", "Product S1"),
    createOperativeUnit("Industrial AI Copilot", "Product S1")
  ];

  const { tree, pathIds, sifId } = buildVsmHostTree(workspace);
  const sifNode = tree.children[0];

  assert.equal(sifId, sif.id);
  assert.deepEqual(pathIds.slice(-1), [sif.id]);
  assert.deepEqual(
    sifNode.children.map((item) => item.name),
    ["Sovereign AI Assistant Platform", "Industrial AI Copilot"]
  );
  assert.deepEqual(
    sifNode.children.map((item) => item.id),
    workspace.step1.operativeUnits.map((unit) => unit.id)
  );
});

test("VSM host tree supports parent chains above R+1", () => {
  const workspace = createWorkspace();
  const topParent = createRecursionLevel("R+2", "Holding", "");
  workspace.step1.recursionLevels.push(topParent);
  const parent = workspace.step1.recursionLevels.find((item) => item.level === "R+1");
  const sif = workspace.step1.recursionLevels.find((item) => item.level === "R0");

  const { tree, pathIds } = buildVsmHostTree(workspace);

  assert.equal(tree.id, topParent.id);
  assert.deepEqual(pathIds, [topParent.id, parent.id, sif.id]);
  assert.equal(tree.children[0].id, parent.id);
  assert.equal(tree.children[0].children[0].id, sif.id);
});

test("VSM bridge helpers normalize VSM system types and recursion labels", () => {
  assert.equal(getVsmSystemType("3*"), "3*");
  assert.equal(getVsmSystemType("unit"), "");
  assert.equal(recursionLevelValue("R-2"), -2);
  assert.equal(recursionLevelValue("R+3"), 3);
  assert.equal(recursionLevelLabel(0), "R0");
  assert.equal(recursionLevelLabel(2), "R+2");
  assert.equal(recursionLevelLabel(-1), "R-1");
});
