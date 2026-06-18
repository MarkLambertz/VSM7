import { getRecursionOrganizations, vsmSystems } from "../../domain/vsm.js";
import { escapeAttr } from "./renderHelpers.js";

export const vsmFrameSource = "./vsm.html";

export function renderVsmHostFrame(context, title = "VSM7 system map") {
  return `
    <iframe
      class="vsm-host-frame"
      data-vsm-frame
      data-vsm-context="${escapeAttr(context || "standalone")}"
      src="${vsmFrameSource}"
      title="${escapeAttr(title)}"
    ></iframe>
  `;
}

export function buildVsmHostTree(workspace) {
  const organizations = getRecursionOrganizations(workspace);
  const primarySif = organizations.find((organization) => recursionLevelValue(organization.level) === 0)
    || createSyntheticSif(workspace);
  const realOperativeUnits = getRealOperativeUnitNodes(workspace);
  const lowerUnits = realOperativeUnits.length > 0
    ? realOperativeUnits
    : organizations
      .filter((organization) => recursionLevelValue(organization.level) === -1)
      .map(toTreeNode);
  const sifNode = toTreeNode(primarySif, lowerUnits);
  const parents = organizations
    .filter((organization) => recursionLevelValue(organization.level) > 0)
    .sort((left, right) => recursionLevelValue(right.level) - recursionLevelValue(left.level));

  const pathIds = [primarySif.id];
  let tree = sifNode;

  for (const parent of parents.slice().reverse()) {
    tree = toTreeNode(parent, [tree]);
    pathIds.unshift(parent.id);
  }

  return { tree, pathIds, sifId: primarySif.id };
}

export function getRealOperativeUnitNodes(workspace) {
  return (Array.isArray(workspace?.step1?.operativeUnits) ? workspace.step1.operativeUnits : [])
    .filter((unit) => unit?.id)
    .map((unit, index) => ({
      id: unit.id,
      name: unit.name || `S1-${index + 1}`,
      description: unit.description || unit.notes || ""
    }));
}

export function getVsmSystemType(type) {
  const normalized = String(type || "");
  return vsmSystems.includes(normalized) ? normalized : "";
}

export function recursionLevelValue(level) {
  const match = String(level || "").match(/^R([+-]\d+|0)$/);
  return match ? Number(match[1]) : 0;
}

export function recursionLevelLabel(value) {
  if (value === 0) {
    return "R0";
  }

  return value > 0 ? `R+${value}` : `R${value}`;
}

function toTreeNode(organization, children = []) {
  const node = {
    id: organization.id,
    name: organization.name || organization.level || "Unnamed unit"
  };

  if (children.length > 0) {
    node.children = children;
  }

  return node;
}

function createSyntheticSif(workspace) {
  return {
    id: workspace.sif?.id || workspace.project?.id || "vsm7-sif",
    level: "R0",
    name: workspace.sif?.name || workspace.project?.name || "System-in-Focus",
    description: workspace.sif?.purpose || ""
  };
}
