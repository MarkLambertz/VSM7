import assert from "node:assert/strict";
import test from "node:test";
import {
  createNumberedSuccessCriticalTask,
  createStep7MeetingRecord,
  createStep7Vessel,
  createWorkspace,
  ensureWorkspaceShape,
  getRecursionOrganizations,
  getStep5ContributionKey,
  getStep7EditorContext,
  getStep7EditorModel,
  getStep7MeetingLandscapeContext,
  getStep7OrgChartContext,
  getStep7RasicAssignment,
  getStep7SctContributions,
  mergeSuccessCriticalTasks,
  setStep7RasicAssignment,
  setStep7EditorModel,
  splitSuccessCriticalTask,
  syncAllocations,
  toggleStep5ContributionAssignment
} from "../src/domain/vsm.js";

function addTaskWithContribution(workspace, title, organization, contribution) {
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = title;
  task.explanation = `${title} description`;
  workspace.step3.successCriticalTasks.push(task);
  syncAllocations(workspace);
  workspace.step4.allocations[task.id].contributions[organization.id] = contribution;
  return task;
}

test("Step VII starts with canonical containers and legacy fields", () => {
  const workspace = createWorkspace();

  assert.deepEqual(workspace.step7.vessels, []);
  assert.deepEqual(workspace.step7.roles, []);
  assert.deepEqual(Object.keys(workspace.step7.descriptions), ["roles", "functions", "meetings"]);
  assert.deepEqual(workspace.step7.rasic, {});
  assert.deepEqual(workspace.step7.orgHierarchy, {});
});

test("Step VII migration turns legacy roles into organizational vessels", () => {
  const workspace = ensureWorkspaceShape({
    step7: {
      roles: [
        {
          id: "role-strategy",
          name: "Strategy Owner",
          type: "Leadership role",
          purpose: "Carry future-oriented SCTs"
        }
      ],
      orgChartNotes: "Keep the chart readable."
    }
  });

  assert.equal(workspace.step7.roles[0].id, "role-strategy");
  assert.deepEqual(
    workspace.step7.vessels.find((vessel) => vessel.id === "role-strategy"),
    {
      id: "role-strategy",
      type: "role",
      name: "Strategy Owner",
      purpose: "Carry future-oriented SCTs",
      scope: "",
      prov: "legacy-role",
      state: "draft",
      sys: "",
      alg: false,
      legacyRoleId: "role-strategy"
    }
  );
  assert.equal(workspace.step7.orgChart.notes, "Keep the chart readable.");
  assert.deepEqual(workspace.step7.orgHierarchy, {});
});

test("Step VII drops nameless role and vessel artifacts", () => {
  const workspace = ensureWorkspaceShape({
    step7: {
      roles: [
        {
          id: "role-empty",
          name: "",
          type: "Leadership role",
          purpose: ""
        },
        {
          id: "role-linked",
          name: "",
          type: "Leadership role",
          purpose: "",
          linkedTaskIds: ["legacy-sct-id"]
        },
        {
          id: "role-named",
          name: "Named Legacy Role",
          type: "Leadership role",
          purpose: "Keep the legacy migration useful"
        }
      ],
      vessels: [
        {
          id: "vessel-empty",
          type: "role",
          name: "   ",
          state: "accepted"
        },
        {
          id: "vessel-named",
          type: "role",
          name: "Named Vessel",
          state: "accepted"
        }
      ],
      vesselAspects: {
        "vessel-empty": {
          kpis: [{ id: "empty-kpi", text: "Should be removed" }],
          artifacts: [],
          tools: []
        },
        "vessel-named": {
          kpis: [{ id: "named-kpi", text: "Should remain" }],
          artifacts: [],
          tools: []
        }
      }
    }
  });

  assert.equal(workspace.step7.roles.some((role) => role.id === "role-empty"), false);
  assert.deepEqual(workspace.step7.roles.find((role) => role.id === "role-linked")?.linkedTaskIds, ["legacy-sct-id"]);
  assert.equal(workspace.step7.vessels.some((vessel) => vessel.id === "role-empty"), false);
  assert.equal(workspace.step7.vessels.some((vessel) => vessel.id === "role-linked"), false);
  assert.equal(workspace.step7.vessels.some((vessel) => vessel.id === "vessel-empty"), false);
  assert.equal(workspace.step7.vesselAspects["vessel-empty"], undefined);
  assert.ok(workspace.step7.vessels.find((vessel) => vessel.id === "role-named"));
  assert.ok(workspace.step7.vessels.find((vessel) => vessel.id === "vessel-named"));
  assert.equal(workspace.step7.vesselAspects["vessel-named"].kpis[0].text, "Should remain");
});

test("Step VII contributions reuse the real recursion organizations", () => {
  const workspace = createWorkspace();
  const organizations = getRecursionOrganizations(workspace);
  const r0 = organizations.find((organization) => organization.level === "R0");
  const rMinus1 = organizations.find((organization) => organization.level === "R-1");
  const task = createNumberedSuccessCriticalTask(workspace);
  task.title = "Customer Promise";
  workspace.step3.successCriticalTasks.push(task);
  syncAllocations(workspace);
  workspace.step4.allocations[task.id].contributions[r0.id] = "Define promise logic";
  workspace.step4.allocations[task.id].contributions[rMinus1.id] = "Deliver promise locally";
  toggleStep5ContributionAssignment(workspace, "3", getStep5ContributionKey(task.id, r0.id));

  const contributions = getStep7SctContributions(workspace);

  assert.equal(contributions.length, 2);
  assert.equal(contributions.find((item) => item.organizationId === r0.id).vsmSystem, "3");
  assert.equal(contributions.find((item) => item.organizationId === rMinus1.id).vsmSystem, "");
});

test("Step VII RASIC assignments validate contribution and vessel references", () => {
  const workspace = createWorkspace();
  const r0 = getRecursionOrganizations(workspace).find((organization) => organization.level === "R0");
  const task = addTaskWithContribution(workspace, "Normative Management", r0, "Set principles");
  const vessel = createStep7Vessel("meeting", "Policy Council");
  workspace.step7.vessels.push(vessel);
  const contributionId = getStep5ContributionKey(task.id, r0.id);

  assert.equal(setStep7RasicAssignment(workspace, contributionId, vessel.id, "A"), true);
  assert.equal(getStep7RasicAssignment(workspace, contributionId, vessel.id), "A");
  assert.equal(setStep7RasicAssignment(workspace, contributionId, vessel.id, "X"), false);
  assert.equal(setStep7RasicAssignment(workspace, "missing", vessel.id, "A"), false);
  assert.equal(setStep7RasicAssignment(workspace, contributionId, vessel.id, ""), true);
  assert.equal(getStep7RasicAssignment(workspace, contributionId, vessel.id), "");
});

test("Step VII aspect items migrate to stable item records", () => {
  const workspace = ensureWorkspaceShape({
    step3: {
      nextSctNumber: 2,
      successCriticalTasks: [
        {
          id: "sct-a",
          number: 1,
          priority: "A",
          system: "3",
          title: "Build Market Interface",
          explanation: "",
          source: "Workshop Decision",
          kpi: "",
          requiredArtifacts: "",
          toolOrMethodologicalApproach: ""
        }
      ]
    },
    step7: {
      aspects: {
        "sct-a": {
          kpis: ["Lead time"],
          artifacts: [{ id: "artifact-roadmap", text: "Market roadmap", owner: "S4 team" }],
          tools: "Scenario planning"
        }
      }
    }
  });

  assert.match(workspace.step7.aspects["sct-a"].kpis[0].id, /^aspect-item-/);
  assert.equal(workspace.step7.aspects["sct-a"].artifacts[0].id, "artifact-roadmap");
  assert.equal(workspace.step7.aspects["sct-a"].tools[0].text, "Scenario planning");
});

test("Step VII contexts expose org chart and meeting landscape payloads", () => {
  const workspace = createWorkspace();
  const r0 = getRecursionOrganizations(workspace).find((organization) => organization.level === "R0");
  const task = addTaskWithContribution(workspace, "Resource Bargain", r0, "Balance resources");
  const vessel = createStep7Vessel("role", "S3 Lead");
  workspace.step7.vessels.push(vessel);
  workspace.step7.aspects[task.id] = {
    kpis: [{ id: "kpi-1", text: "Budget cycle time" }],
    artifacts: [],
    tools: []
  };

  const orgChart = getStep7OrgChartContext(workspace);
  const meetings = getStep7MeetingLandscapeContext(workspace);

  assert.equal(orgChart.contributions[0].sctId, task.id);
  assert.equal(orgChart.vessels[0].name, "S3 Lead");
  assert.equal(meetings.aspects[task.id].kpis[0].id, "kpi-1");
  assert.ok(meetings.loops.length >= 8);
  assert.deepEqual(meetings.model, {
    meetings: {},
    connections: []
  });
});

test("Step VII editor bridge round-trips Claude surface model shape", () => {
  const workspace = createWorkspace();
  const r0 = getRecursionOrganizations(workspace).find((organization) => organization.level === "R0");
  const task = addTaskWithContribution(workspace, "Strategy", r0, "Set strategic priorities");
  const contributionId = getStep5ContributionKey(task.id, r0.id);
  toggleStep5ContributionAssignment(workspace, "4", contributionId);
  const role = createStep7Vessel("role", "Strategy Lead");
  role.sys = "4";
  workspace.step7.vessels.push(role);
  workspace.step7.descriptions.roles[role.id] = {
    purpose: "Own the strategy cycle",
    interfaces: "S4 and S3"
  };

  const context = getStep7EditorContext(workspace);
  const model = getStep7EditorModel(workspace);

  assert.equal(context.meta.sif, r0.id);
  assert.equal(context.units.find((unit) => unit.id === r0.id)?.sif, true);
  assert.equal(context.scts[0].did, "SCT-001");
  assert.equal(context.scts[0].sys, "S3");
  assert.equal(context.contribs[0].sct, task.id);
  assert.equal(context.contribs[0].unit, r0.id);
  assert.equal(context.contribs[0].sys, "S4");
  assert.equal(model.vessels[0].sys, "S4");
  assert.equal(model.vessels[0].state, "candidate");
  assert.equal(model.descriptions[role.id].purpose, "Own the strategy cycle");

  model.vessels.push({
    id: "meeting-strategy",
    type: "meeting",
    name: "Strategy Review",
    purpose: "Steer strategic priorities",
    scope: r0.id,
    prov: "workshop",
    state: "accepted",
    sys: "S4",
    alg: false
  });
  model.vessels.push({
    id: "blank-role",
    type: "role",
    name: "",
    purpose: "",
    scope: r0.id,
    prov: "workshop",
    state: "accepted",
    sys: "",
    alg: false
  });
  model.rasic[`${contributionId}|${role.id}`] = "A";
  model.membership = {
    [role.id]: ["meeting-strategy"]
  };
  model.descriptions[role.id].interfaces = "S4, S3, and the board";

  assert.equal(setStep7EditorModel(workspace, model), true);
  assert.equal(getStep7RasicAssignment(workspace, contributionId, role.id), "A");
  assert.equal(workspace.step7.vessels.find((vessel) => vessel.id === role.id).sys, "4");
  assert.equal(workspace.step7.vessels.some((vessel) => vessel.id === "blank-role"), false);
  assert.equal(workspace.step7.descriptions.roles[role.id].interfaces, "S4, S3, and the board");
  assert.deepEqual(workspace.step7.participations, [
    {
      vesselId: role.id,
      meetingId: "meeting-strategy",
      roleType: "participant"
    }
  ]);
  assert.deepEqual(workspace.step7.meetings["meeting-strategy"].participations, [
    {
      vesselId: role.id,
      roleType: "participant"
    }
  ]);
});

test("Step VII editor hierarchy persists canonical vessel and unit placement", () => {
  const workspace = createWorkspace();
  const rMinus = getRecursionOrganizations(workspace).find((organization) => organization.level === "R-1");
  const operativeUnit = {
    id: "unit-delivery",
    name: "Delivery Team",
    description: "Nested operative unit",
    notes: ""
  };
  workspace.step1.operativeUnits.push(operativeUnit);
  const role = createStep7Vessel("role", "Delivery Lead");
  workspace.step7.vessels.push(role);

  const model = getStep7EditorModel(workspace);
  model.orgHierarchy = {
    [rMinus.id]: { parent: "root", order: "1", slot: "leader" },
    [operativeUnit.id]: { parent: rMinus.id, order: 2 },
    [role.id]: { parent: "decision-group", order: "3", slot: "member" },
    "decision-group": { parent: "root", order: "not-a-number" },
    "orphan-artifact": { parent: "root", order: 4 },
    root: { parent: "root", order: 0 },
    malformed: "drop me"
  };

  assert.equal(setStep7EditorModel(workspace, model), true);
  const reloadedWorkspace = ensureWorkspaceShape(JSON.parse(JSON.stringify(workspace)));
  const roundTrip = getStep7EditorModel(reloadedWorkspace).orgHierarchy;

  assert.deepEqual(roundTrip[rMinus.id], { parent: "root", order: 1, slot: "leader" });
  assert.deepEqual(roundTrip[operativeUnit.id], { parent: rMinus.id, order: 2 });
  assert.deepEqual(roundTrip[role.id], { parent: "decision-group", order: 3, slot: "member" });
  assert.deepEqual(roundTrip["decision-group"], { parent: "root", order: 0 });
  assert.deepEqual(roundTrip.root, { parent: "root", order: 0 });
  assert.equal("orphan-artifact" in roundTrip, false);
  assert.equal("malformed" in roundTrip, false);
});

test("Step VII role FTE survives the editor and project-file round trip", () => {
  const workspace = createWorkspace();
  const role = createStep7Vessel("role", "Delivery Lead");
  const meeting = createStep7Vessel("meeting", "Delivery Review");
  assert.equal(role.fte, 0);
  assert.equal("fte" in meeting, false);
  workspace.step7.vessels.push(role, meeting);

  const model = getStep7EditorModel(workspace);
  model.vessels.find((vessel) => vessel.id === role.id).fte = "2.5";
  model.vessels.find((vessel) => vessel.id === meeting.id).fte = 4;

  assert.equal(setStep7EditorModel(workspace, model), true);
  const reloadedWorkspace = ensureWorkspaceShape(JSON.parse(JSON.stringify(workspace)));
  const roundTrip = getStep7EditorModel(reloadedWorkspace);
  assert.equal(roundTrip.vessels.find((vessel) => vessel.id === role.id).fte, 2.5);
  assert.equal("fte" in roundTrip.vessels.find((vessel) => vessel.id === meeting.id), false);

  roundTrip.vessels.find((vessel) => vessel.id === role.id).fte = 0;
  assert.equal(setStep7EditorModel(reloadedWorkspace, roundTrip), true);
  assert.equal("fte" in getStep7EditorModel(reloadedWorkspace).vessels.find((vessel) => vessel.id === role.id), false);
});

test("Step VII editor context can scope dropdown candidates to the R0 System-in-Focus", () => {
  const workspace = createWorkspace();
  const organizations = getRecursionOrganizations(workspace);
  const rPlus = organizations.find((organization) => organization.level === "R+1");
  const r0 = organizations.find((organization) => organization.level === "R0");
  const rMinus = organizations.find((organization) => organization.level === "R-1");
  const primary = addTaskWithContribution(workspace, "Strategy", r0, "Set strategic priorities");
  workspace.step4.allocations[primary.id].contributions[rPlus.id] = "Approve strategic priorities";
  workspace.step4.allocations[primary.id].contributions[rMinus.id] = "Execute strategic priorities";
  const nestedOnly = addTaskWithContribution(workspace, "Team Learning", rMinus, "Improve team practice");
  workspace.step7.metricDefs = [
    { id: "kpi-r0", text: "R0 decision cycle", reuseCount: 2 },
    { id: "kpi-nested", text: "Nested team learning", reuseCount: 1 },
    { id: "kpi-global", text: "Global metric" }
  ];
  workspace.step7.aspects[primary.id] = {
    kpis: [{ id: "kpi-r0", text: "R0 decision cycle" }],
    artifacts: [{ id: "artifact-r0", text: "R0 decision log" }],
    tools: [{ id: "tool-r0", text: "R0 planning board" }]
  };
  workspace.step7.aspects[nestedOnly.id] = {
    kpis: [{ id: "kpi-nested", text: "Nested team learning" }],
    artifacts: [{ id: "artifact-nested", text: "Nested practice board" }],
    tools: [{ id: "tool-nested", text: "Nested retrospective" }]
  };

  const full = getStep7EditorContext(workspace);
  const scoped = getStep7EditorContext(workspace, { scope: "sif" });

  assert.equal(full.meta.contextScope, "all");
  assert.equal(scoped.meta.contextScope, "sif");
  assert.equal(full.contribs.length, 4);
  assert.deepEqual(
    scoped.contribs.map((contribution) => contribution.id),
    [getStep5ContributionKey(primary.id, r0.id)]
  );
  assert.deepEqual(scoped.scts.map((sct) => sct.id), [primary.id]);
  assert.equal(scoped.scts.some((sct) => sct.id === nestedOnly.id), false);
  assert.deepEqual(scoped.metricDefs.map((definition) => definition.id), ["kpi-r0"]);
  assert.deepEqual(scoped.artifactDefs.map((definition) => definition.id), ["artifact-r0"]);
  assert.deepEqual(scoped.toolDefs.map((definition) => definition.id), ["tool-r0"]);
});

test("Step VII aspect owners and KPI details round-trip through the editor model", () => {
  const workspace = createWorkspace();
  const r0 = getRecursionOrganizations(workspace).find((organization) => organization.level === "R0");
  const task = addTaskWithContribution(workspace, "Strategy", r0, "Set strategic priorities");
  const role = createStep7Vessel("role", "Strategy Lead");
  const meeting = createStep7Vessel("meeting", "Strategy Review");
  workspace.step7.vessels.push(role, meeting);

  const model = getStep7EditorModel(workspace);
  model.aspects[task.id] = {
    kpis: [{
      id: "kpi-cycle",
      text: "Decision cycle time",
      owner: meeting.id,
      target: "< 10 days",
      frequency: "Quarterly",
      source: "portfolio review"
    }],
    artifacts: [{ id: "artifact-log", text: "Decision log", owner: role.id }],
    tools: [{ id: "tool-review", text: "Quarterly review", owner: "legacy owner text" }]
  };

  assert.equal(setStep7EditorModel(workspace, model), true);
  assert.equal(workspace.step7.aspects[task.id].kpis[0].owner, meeting.id);
  assert.equal(workspace.step7.aspects[task.id].kpis[0].target, "< 10 days");
  assert.equal(workspace.step7.aspects[task.id].kpis[0].frequency, "Quarterly");
  assert.equal(workspace.step7.aspects[task.id].kpis[0].source, "portfolio review");
  assert.equal(workspace.step7.aspects[task.id].artifacts[0].owner, role.id);
  assert.equal(workspace.step7.aspects[task.id].tools[0].owner, "legacy owner text");

  const reloaded = getStep7EditorModel(workspace);
  assert.equal(reloaded.aspects[task.id].kpis[0].owner, meeting.id);
  assert.equal(reloaded.aspects[task.id].kpis[0].target, "< 10 days");
  assert.equal(reloaded.aspects[task.id].kpis[0].frequency, "Quarterly");
  assert.equal(reloaded.aspects[task.id].kpis[0].source, "portfolio review");
  delete reloaded.aspects[task.id].kpis[0].owner;
  reloaded.aspects[task.id].kpis[0].target = "";
  reloaded.aspects[task.id].kpis[0].frequency = "";
  reloaded.aspects[task.id].kpis[0].source = "";
  reloaded.aspects[task.id].artifacts[0].owner = "";

  assert.equal(setStep7EditorModel(workspace, reloaded), true);
  assert.equal(Object.hasOwn(workspace.step7.aspects[task.id].kpis[0], "owner"), false);
  assert.equal(Object.hasOwn(workspace.step7.aspects[task.id].kpis[0], "target"), false);
  assert.equal(Object.hasOwn(workspace.step7.aspects[task.id].kpis[0], "frequency"), false);
  assert.equal(Object.hasOwn(workspace.step7.aspects[task.id].kpis[0], "source"), false);
  assert.equal(Object.hasOwn(workspace.step7.aspects[task.id].artifacts[0], "owner"), false);
});

test("Step VII editor context exposes reuse definition pools and canonical Step VI loop ids", () => {
  const workspace = createWorkspace();
  const r0 = getRecursionOrganizations(workspace).find((organization) => organization.level === "R0");
  const task = addTaskWithContribution(workspace, "Strategy", r0, "Set strategic priorities");
  const vessel = createStep7Vessel("function", "Strategy Office");
  workspace.step7.vessels.push(vessel);
  workspace.step7.aspects[task.id] = {
    kpis: [{ id: "kpi-cycle", text: "Decision cycle time" }],
    artifacts: [{ id: "artifact-log", text: "Decision log" }],
    tools: [{ id: "tool-review", text: "Quarterly review" }]
  };
  workspace.step7.vesselAspects[vessel.id] = {
    kpis: [{ id: "kpi-cycle", text: "Decision cycle time" }],
    artifacts: [],
    tools: []
  };

  const context = getStep7EditorContext(workspace);

  assert.deepEqual(
    context.metricDefs.find((definition) => definition.id === "kpi-cycle"),
    {
      id: "kpi-cycle",
      text: "Decision cycle time",
      reuseCount: 2
    }
  );
  assert.equal(context.artifactDefs.find((definition) => definition.id === "artifact-log")?.text, "Decision log");
  assert.equal(context.toolDefs.find((definition) => definition.id === "tool-review")?.text, "Quarterly review");
  assert.deepEqual(
    context.loops.map((loop) => loop.id),
    [
      "vsm-loop-s2-s1-coordination",
      "vsm-loop-s3-s1-command",
      "vsm-loop-s3-s1-resource-bargain",
      "vsm-loop-s3star-s1-audit",
      "vsm-loop-s4-environment-sensing",
      "vsm-loop-s4-s3-homeostat",
      "vsm-loop-s5-s4-s3-normative",
      "vsm-loop-s5-s1-algedonic"
    ]
  );
});

test("Step VII persists the populated 7.6 meeting charter layer without fabricating unopened charters", () => {
  const workspace = createWorkspace();
  const r0 = getRecursionOrganizations(workspace).find((organization) => organization.level === "R0");
  const task = addTaskWithContribution(workspace, "Strategy", r0, "Set strategic priorities");
  const contributionId = getStep5ContributionKey(task.id, r0.id);
  const role = createStep7Vessel("role", "Strategy Lead");
  const openedMeeting = createStep7Vessel("meeting", "Strategy Review");
  openedMeeting.id = "meeting-strategy";
  const unopenedMeeting = createStep7Vessel("meeting", "Risk Review");
  unopenedMeeting.id = "meeting-risk";
  workspace.step7.vessels.push(role, openedMeeting, unopenedMeeting);

  const model = getStep7EditorModel(workspace);
  model.meetings = {
    "meeting-strategy": {
      cad: { f: "Quarterly", n: 1, d: 120 },
      agenda: "Review strategic bets\n• Decide escalations",
      steering: [{ ref: contributionId, label: "SCT-001 Strategy", sys: "S4" }],
      participants: [{ ref: role.id, label: "Strategy Lead", roleType: "chair", origin: "auth" }],
      measures: [{ defRef: "kpi-cycle", label: "Decision cycle time", use: { target: "< 10 days", freq: "Quarterly", source: "workshop notes", owner: role.id } }],
      inputs: [{ ref: "artifact-roadmap", label: "Roadmap", kind: "artifact" }],
      outputs: [{ ref: "meeting-risk", label: "Risk Review", kind: "meeting" }],
      rights: [{ decision: "Approve priorities", owner: role.id, affected: contributionId }],
      loops: [{ ref: "vsm-loop-s4-s3-homeostat", label: "S4-S3 homeostat", relation: "closes" }],
      escalation: [{ kind: "algedonic", targetVesselRef: role.id }]
    }
  };

  assert.equal(setStep7EditorModel(workspace, model), true);

  assert.equal(Object.keys(workspace.step7.meetings).includes("meeting-risk"), false);
  const meeting = workspace.step7.meetings["meeting-strategy"];
  assert.equal(meeting.agenda, "Review strategic bets\n• Decide escalations");
  assert.deepEqual(meeting.agendaItems, ["Review strategic bets", "Decide escalations"]);
  assert.deepEqual(meeting.cad, { f: "Quarterly", n: 1, d: 120 });
  assert.equal(meeting.cadence.label, "Quarterly");
  assert.deepEqual(meeting.contribs, [contributionId]);
  assert.equal(meeting.participants[0].vesselRef, role.id);
  assert.equal(meeting.participations[0].vesselId, role.id);
  assert.equal(meeting.metricUses[0].definitionRef, "kpi-cycle");
  assert.equal(meeting.metricUses[0].target, "< 10 days");
  assert.equal(meeting.outputs[0].kind, "meeting");
  assert.equal(meeting.decisionRights[0].ownerVesselId, role.id);
  assert.deepEqual(meeting.loopRefs[0], {
    ref: "vsm-loop-s4-s3-homeostat",
    label: "S4-S3 homeostat",
    relation: "closes",
    loopRef: "vsm-loop-s4-s3-homeostat"
  });
  assert.deepEqual(workspace.step7.participations, [
    {
      ref: role.id,
      label: "Strategy Lead",
      roleType: "chair",
      origin: "auth",
      vesselRef: role.id,
      derivedFromRASIC: false,
      meetingId: "meeting-strategy",
      vesselId: role.id
    }
  ]);

  const roundTrip = getStep7EditorModel(workspace);
  assert.equal(roundTrip.meetings["meeting-strategy"].agenda, meeting.agenda);
  assert.equal(roundTrip.membership[role.id][0], "meeting-strategy");
});

test("Step VII meeting records use the structured meeting landscape shape", () => {
  const record = createStep7MeetingRecord("meeting-policy");

  assert.equal(record.id, "meeting-policy");
  assert.deepEqual(record.scope, { level: "", unitId: "shared" });
  assert.equal(record.cadence.kind, "rhythmic");
  assert.equal(record.agenda, "");
  assert.deepEqual(record.agendaItems, []);
  assert.deepEqual(record.outputs, []);
  assert.deepEqual(record.participants, []);
  assert.deepEqual(record.participations, []);
  assert.deepEqual(record.decisionModes, []);
  assert.deepEqual(record.loops, []);
});

test("Step VII meeting landscape context maps flat legacy meetings to structured records", () => {
  const workspace = ensureWorkspaceShape({
    step7: {
      vessels: [
        {
          id: "role-s3",
          type: "role",
          name: "S3 Lead",
          state: "draft"
        },
        {
          id: "function-strategy",
          type: "function",
          name: "Strategy Office",
          state: "draft"
        },
        {
          id: "meeting-policy",
          type: "meeting",
          name: "Policy Council",
          purpose: "Stabilize policy decisions",
          scope: "R0",
          sys: "5",
          state: "draft"
        }
      ],
      meetings: {
        "meeting-policy": {
          cadence: "Monthly",
          outputs: "Decision log",
          agenda: "Policy topics",
          participations: [
            {
              vesselId: "role-s3",
              roleType: "participant"
            }
          ],
          outputRefs: ["artifact-1", "artifact-1"]
        }
      },
      meetingConnections: [
        {
          id: "connection-1",
          from: "meeting-policy",
          to: "meeting-review"
        }
      ]
    }
  });

  const context = getStep7MeetingLandscapeContext(workspace);
  const meeting = context.meetings["meeting-policy"];

  assert.equal(meeting.id, "meeting-policy");
  assert.equal(meeting.name, "Policy Council");
  assert.equal(meeting.purpose, "Stabilize policy decisions");
  assert.deepEqual(meeting.scope, { level: "R0", unitId: "shared" });
  assert.equal(meeting.sys, "5");
  assert.equal(meeting.cadence.label, "Monthly");
  assert.deepEqual(meeting.outputs, ["Decision log"]);
  assert.deepEqual(meeting.agenda, ["Policy topics"]);
  assert.deepEqual(meeting.outputRefs, ["artifact-1"]);
  assert.deepEqual(context.membership["role-s3"], ["meeting-policy"]);
  assert.equal(context.roles.length, 1);
  assert.equal(context.roles[0].id, "role-s3");
  assert.equal(context.vessels.find((vessel) => vessel.id === "meeting-policy").state, "candidate");
  assert.deepEqual(context.connections[0], {
    id: "connection-1",
    from: "meeting-policy",
    to: "meeting-review"
  });
  assert.equal(context.model.meetings["meeting-policy"].cadence.label, "Monthly");
  assert.equal(context.landscape.schemaVersion, 1);
});

test("Step VII creates default meeting records for meeting vessels", () => {
  const workspace = createWorkspace();
  workspace.step7.vessels.push({
    id: "meeting-weekly",
    type: "meeting",
    name: "Weekly Steering",
    purpose: "Resolve coordination issues",
    scope: "R-1",
    prov: "workshop",
    state: "draft",
    sys: "2",
    alg: false
  });

  const context = getStep7MeetingLandscapeContext(workspace);
  const meeting = context.meetings["meeting-weekly"];

  assert.equal(meeting.id, "meeting-weekly");
  assert.equal(meeting.name, "Weekly Steering");
  assert.equal(meeting.purpose, "Resolve coordination issues");
  assert.deepEqual(meeting.scope, { level: "R-1", unitId: "shared" });
  assert.equal(meeting.sys, "2");
  assert.deepEqual(meeting.outputs, []);
});

test("Step VII references follow SCT split and merge operations", () => {
  const workspace = createWorkspace();
  const r0 = getRecursionOrganizations(workspace).find((organization) => organization.level === "R0");
  const task = addTaskWithContribution(workspace, "Strategy", r0, "Set priorities");
  const vessel = createStep7Vessel("function", "Strategy Office");
  workspace.step7.vessels.push(vessel);
  workspace.step7.aspects[task.id] = {
    kpis: [{ id: "kpi-strategy", text: "Strategy cycle time" }],
    artifacts: [],
    tools: []
  };
  const originalContributionId = getStep5ContributionKey(task.id, r0.id);
  setStep7RasicAssignment(workspace, originalContributionId, vessel.id, "A");

  const splitTask = splitSuccessCriticalTask(workspace, task.id);
  const splitContributionId = getStep5ContributionKey(splitTask.id, r0.id);

  assert.equal(getStep7RasicAssignment(workspace, splitContributionId, vessel.id), "A");
  assert.equal(workspace.step7.aspects[splitTask.id].kpis[0].text, "Strategy cycle time");
  assert.notEqual(workspace.step7.aspects[splitTask.id].kpis[0].id, "kpi-strategy");

  const merged = mergeSuccessCriticalTasks(workspace, [task.id, splitTask.id]);

  assert.equal(merged.id, task.id);
  assert.equal(getStep7RasicAssignment(workspace, originalContributionId, vessel.id), "A");
  assert.equal(workspace.step7.aspects[splitTask.id], undefined);
  assert.ok(workspace.step7.aspects[task.id].kpis.some((item) => item.text === "Strategy cycle time"));
});
