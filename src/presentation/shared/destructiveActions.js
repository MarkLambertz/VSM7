const collectionLabels = {
  "step1.recursionLevels": "recursion-level entry",
  "step1.segmentationOptions": "segmentation option",
  "step1.keyBuyingCriteria": "key buying criterion",
  "step1.operativeUnits": "operative unit / S1",
  "step2.options": "manageability option",
  "step3.successCriticalTasks": "success-critical task",
  "step7.roles": "role or representation entity",
  "implementation.items": "implementation item"
};

export function destructiveActionMessage({
  action = "",
  collection = "",
  itemName = "",
  projectCount = 0
} = {}) {
  if (action === "remove-item") {
    return `Delete this ${collectionLabels[collection] || "item"}? This cannot be undone.`;
  }

  if (action === "remove-strategic-link") {
    return "Delete this supporting link? This cannot be undone.";
  }

  if (action === "remove-strategic-file") {
    return "Delete this attached file? This cannot be undone.";
  }

  if (action === "merge-selected-scts") {
    return "Merge the selected SCTs into one canonical task? The separate SCTs will be removed and their downstream references combined.";
  }

  if (action === "delete-project") {
    return `Delete ${formatNamedItem(itemName, "this project")}? This cannot be undone.`;
  }

  if (action === "delete-organization") {
    const count = Number(projectCount || 0);
    const projectText = `${count} project${count === 1 ? "" : "s"}`;
    return `Delete ${formatNamedItem(itemName, "this organization")} and ${projectText}? This cannot be undone.`;
  }

  return "";
}

function formatNamedItem(itemName, fallback) {
  return itemName ? `"${itemName}"` : fallback;
}
