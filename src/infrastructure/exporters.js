import {
  formatSctNumber,
  getRecursionOrganizations,
  getStep5InScopeContributions,
  getStep5MappingDiagnostics
} from "../domain/vsm.js";

export function exportProjectJson(workspace) {
  const artifact = buildProjectJson(workspace);
  downloadBlob(artifact.filename, artifact.content, artifact.mimeType);
}

export function exportProjectReport(workspace) {
  const artifact = buildProjectReport(workspace);
  downloadBlob(artifact.filename, artifact.content, artifact.mimeType);
}

export function buildProjectJson(workspace) {
  const name = safeFileName(workspace.project.name || "vsm-project");
  return {
    filename: `${name}.json`,
    content: JSON.stringify(workspace, null, 2),
    mimeType: "application/json"
  };
}

export function buildProjectReport(workspace) {
  const name = safeFileName(workspace.project.name || "vsm-project");
  const html = documentShell(workspace, `
    <h1>${escapeHtml(workspace.project.name)}</h1>
    <p><strong>Organization:</strong> ${escapeHtml(workspace.organization.name)}</p>
    <p><strong>System-in-Focus:</strong> ${escapeHtml(workspace.sif.name || "Open")}</p>
    ${section("Purpose", paragraph(workspace.sif.purpose))}
    ${section("Customers / Stakeholders", paragraph(workspace.sif.customers))}
    ${section("Selected Segmentation", selectedSegmentation(workspace))}
    ${section("Success-Critical Tasks", taskTable(workspace))}
    ${section("SCT Contributions Across the Recursion Structure", allocationTable(workspace))}
    ${section("SCT-to-VSM-System Map", systemMappingTable(workspace))}
  `);

  return {
    filename: `${name}-report.doc`,
    content: html,
    mimeType: "application/msword"
  };
}

export function exportStepOutcome(workspace, stepId) {
  const artifact = buildStepOutcome(workspace, stepId);
  if (!artifact) {
    return;
  }

  downloadBlob(artifact.filename, artifact.content, artifact.mimeType);
}

export function buildStepOutcome(workspace, stepId) {
  const name = safeFileName(`${workspace.project.name}-${stepId}`);

  if (stepId === "step1") {
    return {
      filename: `${name}-operative-units.doc`,
      content: step1Doc(workspace),
      mimeType: "application/msword"
    };
  }

  if (stepId === "step2") {
    return {
      filename: `${name}-manageability.doc`,
      content: step2Doc(workspace),
      mimeType: "application/msword"
    };
  }

  if (stepId === "step3") {
    return {
      filename: `${name}-success-critical-tasks.xls`,
      content: excelShell(taskTable(workspace)),
      mimeType: "application/vnd.ms-excel"
    };
  }

  if (stepId === "step4") {
    return {
      filename: `${name}-sct-contribution-matrix.xls`,
      content: excelShell(allocationTable(workspace)),
      mimeType: "application/vnd.ms-excel"
    };
  }

  if (stepId === "step5") {
    return {
      filename: `${name}-sct-vsm-system-map.xls`,
      content: excelShell(systemMappingTable(workspace)),
      mimeType: "application/vnd.ms-excel"
    };
  }

  if (stepId === "step6") {
    return {
      filename: `${name}-communication-checks.xls`,
      content: excelShell(channelTable(workspace)),
      mimeType: "application/vnd.ms-excel"
    };
  }

  if (stepId === "step7") {
    return {
      filename: `${name}-representation.doc`,
      content: step7Doc(workspace),
      mimeType: "application/msword"
    };
  }

  if (stepId === "implementation") {
    return {
      filename: `${name}-implementation-backlog.xls`,
      content: excelShell(implementationTable(workspace)),
      mimeType: "application/vnd.ms-excel"
    };
  }

  return null;
}

export function toCsv(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => (Array.isArray(row) ? row : [row]).map(csvCell).join(","))
    .join("\n");
}

function step1Doc(workspace) {
  return documentShell(workspace, `
    <h1>Step I: Operative Units</h1>
    ${section("System-in-Focus", `
      <p><strong>Name:</strong> ${escapeHtml(workspace.sif.name)}</p>
      <p><strong>Purpose:</strong> ${escapeHtml(workspace.sif.purpose)}</p>
      <p><strong>Customers:</strong> ${escapeHtml(workspace.sif.customers)}</p>
    `)}
    ${section("Recursion Levels", simpleTable(["Level", "Name", "Description"], workspace.step1.recursionLevels.map((level) => [level.level, level.name, level.description])))}
    ${section("Segmentation Options", simpleTable(["Option", "Description", "Notes"], workspace.step1.segmentationOptions.map((option) => [option.name, option.description, option.decisionNotes])))}
    ${section("Key Buying Criteria", simpleTable(["Criterion", "Explanation", "Weight", "Relative Position to Competition"], workspace.step1.keyBuyingCriteria.map((criterion) => [criterion.name, criterion.explanation, criterion.weight, criterion.relativePosition])))}
    ${section("Strategic Fields", strategicFieldsTable(workspace))}
    ${section("Segmentation Evaluation", segmentationEvaluationTable(workspace))}
    ${section("Decision Rationale", paragraph(workspace.step1.decisionRationale))}
    ${section("Real Operative Units / S1", simpleTable(["Operative unit", "Scope or kind", "Notes"], (workspace.step1.operativeUnits || []).map((unit) => [unit.name, unit.description, unit.notes])))}
  `);
}

function step2Doc(workspace) {
  const horizontal = workspace.step2.horizontalAssessment;
  const vertical = workspace.step2.verticalAssessment;

  return documentShell(workspace, `
    <h1>Step II: Manageability & Flattening</h1>
    ${section("Selected Segmentation", selectedSegmentation(workspace))}
    ${section("Operative Units / S1", simpleTable(["Operative unit", "Scope or kind", "Notes"], (workspace.step1.operativeUnits || []).map((unit) => [unit.name, unit.description, unit.notes])))}
    ${section("Horizontal Variety", simpleTable(["Dimension", "Assessment"], [
      ["Amount of operative units", horizontal.operativeUnitsAmount],
      ["Dissimilarity", horizontal.dissimilarity],
      ["Self-control capability", horizontal.selfControl],
      ["Notes", horizontal.notes]
    ]))}
    ${section("Vertical Variety", simpleTable(["Dimension", "Assessment"], [
      ["Environmental overlaps", vertical.environmentalOverlaps],
      ["System 3*", vertical.system3Star],
      ["Operational dependencies", vertical.operationalDependencies],
      ["Resource bargain", vertical.resourceBargain],
      ["Corporate intervention", vertical.corporateIntervention],
      ["System 2", vertical.system2],
      ["Notes", vertical.notes]
    ]))}
    ${section("How to master steering challenges", simpleTable(["Selected", "Option", "Time to effect", "Robustness", "Pros", "Cons", "Challenges"], workspace.step2.options.map((option) => [(workspace.step2.selectedOptionIds || []).includes(option.id) ? "Yes" : "", option.name, option.timeToEffect, option.robustness, option.pros, option.cons, option.challenges])))}
  `);
}

function step7Doc(workspace) {
  return documentShell(workspace, `
    <h1>Step VII: Representation</h1>
    ${section("Roles and Entities", roleTable(workspace))}
    ${section("Org Chart Notes", paragraph(workspace.step7.orgChartNotes))}
    ${section("Representation Notes", paragraph(workspace.step7.representationNotes))}
    ${section("SCT Contribution Matrix", allocationTable(workspace))}
  `);
}

function selectedSegmentation(workspace) {
  const selected = workspace.step1.segmentationOptions.find((option) => option.id === workspace.step1.selectedSegmentationOptionId);
  return selected
    ? `<p><strong>${escapeHtml(selected.name)}</strong></p><p>${escapeHtml(selected.description)}</p><p>${escapeHtml(workspace.step1.decisionRationale)}</p>`
    : "<p>No segmentation option selected yet.</p>";
}

function strategicFieldsTable(workspace) {
  return simpleTable(
    ["Variable", "Direction", "Links", "Files"],
    workspace.step1.strategicFields.map((field) => [
      field.variable,
      field.direction,
      (field.links || []).map((link) => `${link.label || "Link"}: ${link.url}`).join("\n"),
      (field.files || []).map((file) => `${file.name || "File"} (${formatBytes(file.size)})`).join("\n")
    ])
  );
}

function formatBytes(value) {
  const size = Number(value || 0);
  if (!size) {
    return "size unknown";
  }

  return `${Math.round(size / 1024)} KB`;
}

function segmentationEvaluationTable(workspace) {
  const options = workspace.step1.segmentationOptions;
  const rows = [
    ...workspace.step1.keyBuyingCriteria.map((criterion, index) => ({
      id: criterion.id,
      group: "Key Buying Criteria",
      label: criterion.name || `Criterion ${index + 1}`,
      weight: criterion.weight ? `${criterion.weight}%` : "",
      relativePosition: criterion.relativePosition || ""
    })),
    ...workspace.step1.strategicFields.map((field) => ({
      id: field.id,
      group: field.variable,
      label: field.direction || "Describe the strategic ambition and targets for this Six Pack variable.",
      weight: "",
      relativePosition: ""
    }))
  ];
  const totals = Object.fromEntries(options.map((option) => [option.id, 0]));
  const tableRows = rows.map((row) => {
    const values = options.map((option) => {
      const value = Number(workspace.step1.evaluation?.scores?.[row.id]?.[option.id] || 0);
      totals[option.id] += value;
      return value || "";
    });
    return [
      row.group,
      row.label,
      row.weight,
      row.relativePosition,
      ...values,
      workspace.step1.evaluation?.comments?.[row.id] || ""
    ];
  });

  tableRows.push(["Total", "", "", "", ...options.map((option) => totals[option.id]), ""]);

  return simpleTable(
    ["Group", "Criterion", "Weight", "Relative Position to Competition", ...options.map((option) => option.name || "Unnamed option"), "Comments"],
    tableRows
  );
}

function taskTable(workspace) {
  return simpleTable(
    ["SCT ID", "Priority", "Task", "Description", "Source", "KPI/Success Metric", "Required Artifact", "Tool or Methodological Approach"],
    workspace.step3.successCriticalTasks.map((task) => [
      formatSctNumber(task.number),
      task.priority,
      task.title,
      task.explanation,
      task.source,
      task.kpi,
      task.requiredArtifacts,
      task.toolOrMethodologicalApproach
    ])
  );
}

function allocationTable(workspace) {
  const organizations = getRecursionOrganizations(workspace);
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));

  return simpleTable(
    [
      "SCT ID",
      "Priority",
      "Success-critical Task",
      "Description",
      "Accountable organization",
      ...organizations.map((organization) => `${organization.level} · ${organization.name}`)
    ],
    workspace.step3.successCriticalTasks.map((task) => {
      const allocation = workspace.step4.allocations[task.id];
      const accountableOrganization = organizationById.get(allocation?.accountableOrganizationId);
      return [
        formatSctNumber(task.number),
        task.priority,
        task.title,
        task.explanation,
        accountableOrganization ? `${accountableOrganization.level} · ${accountableOrganization.name}` : "",
        ...organizations.map((organization) => allocation?.contributions?.[organization.id] || "")
      ];
    })
  );
}

function systemMappingTable(workspace) {
  const contributionsByKey = new Map(getStep5InScopeContributions(workspace).map((contribution) => [contribution.key, contribution]));
  const diagnostics = getStep5MappingDiagnostics(workspace);
  const rows = diagnostics.distribution.flatMap(({ systemId }) => (
    (workspace.step5.assignments?.[systemId] || [])
      .map((key) => ({ systemId, contribution: contributionsByKey.get(key) }))
      .filter((item) => item.contribution)
      .map(({ contribution }) => [
        `S${systemId}`,
        contribution.sctNumber,
        contribution.priority,
        contribution.title,
        contribution.level,
        contribution.organizationName,
        contribution.contribution,
        contribution.source
      ])
  ));

  return simpleTable(
    ["VSM System", "SCT ID", "Priority", "Task", "Recursion Level", "Organizational Unit", "Contribution", "Source"],
    rows
  );
}

function channelTable(workspace) {
  return simpleTable(
    ["Loop", "Channels Used", "Capacity", "Intelligibility", "Synchronicity", "Security", "Observation"],
    workspace.step6.communicationChannels.map((channel) => [
      channel.loop,
      channel.channelsUsed,
      channel.capacity,
      channel.intelligibility,
      channel.synchronicity,
      channel.security,
      channel.observation
    ])
  );
}

function roleTable(workspace) {
  return simpleTable(
    ["Name", "Type", "Purpose", "Reports To", "Decision Authority", "Linked SCTs"],
    workspace.step7.roles.map((role) => [
      role.name,
      role.type,
      role.purpose,
      role.reportsTo,
      role.decisionAuthority,
      linkedTaskTitles(workspace, role.linkedTaskIds)
    ])
  );
}

function implementationTable(workspace) {
  return simpleTable(
    ["Challenge", "Dependency / Requirement", "Responsible", "Due Date", "Status"],
    workspace.implementation.items.map((item) => [item.challenge, item.requirement, item.responsible, item.dueDate, item.status])
  );
}

function linkedTaskTitles(workspace, ids) {
  const titles = ids
    .map((id) => workspace.step3.successCriticalTasks.find((task) => task.id === id)?.title)
    .filter(Boolean);

  return titles.join("; ");
}

function section(title, body) {
  return `<h2>${escapeHtml(title)}</h2>${body || "<p></p>"}`;
}

function paragraph(value) {
  return `<p>${escapeHtml(value || "")}</p>`;
}

function simpleTable(headers, rows) {
  const body = rows.length > 0
    ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${headers.length}">No entries yet.</td></tr>`;

  return `
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function documentShell(workspace, body) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(workspace.project.name)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2933; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          h2 { font-size: 16px; margin-top: 22px; }
          p { font-size: 11px; line-height: 1.4; }
          table { border-collapse: collapse; width: 100%; margin-top: 8px; }
          th, td { border: 1px solid #a7b0ba; padding: 6px; font-size: 10px; vertical-align: top; }
          th { background: #e8eef2; text-align: left; }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `;
}

function excelShell(tableHtml) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #777; padding: 6px; mso-number-format:"\\@"; vertical-align: top; }
          th { background: #dfe7ec; font-weight: bold; }
        </style>
      </head>
      <body>${tableHtml}</body>
    </html>
  `;
}

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function safeFileName(value) {
  return String(value || "vsm-project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
