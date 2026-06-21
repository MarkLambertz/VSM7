import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalChannelVarietyLoops,
  createImplementationItemFromChannelWeakness,
  createOperativeUnit,
  createWorkspace,
  ensureWorkspaceShape,
  getStep6ChannelVarietyContext,
  getStep6ChannelVarietyWeaknessCandidates,
  setStep6ChannelVarietyModel
} from "../src/domain/vsm.js";
import { renderImplementationWorkspace } from "../src/presentation/steps/implementation.js";
import { buildStepOutcome } from "../src/infrastructure/exporters.js";

test("Step VI instantiates the complete canonical vertical loop checklist for every SIF", () => {
  const workspace = createWorkspace();
  workspace.sif.name = "Mobility Division";
  workspace.step1.operativeUnits = [
    createOperativeUnit("Vehicle Platforms"),
    createOperativeUnit("Mobility Services")
  ];

  const context = getStep6ChannelVarietyContext(workspace);

  assert.deepEqual(
    context.loops.map(({ id, sys, vsmChannel }) => ({ id, sys, vsmChannel })),
    canonicalChannelVarietyLoops.map(({ id, sys, vsmChannel }) => ({ id, sys, vsmChannel }))
  );
  assert.equal(context.loops.length, 8);
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
  assert.equal(context.meta.sifName, "Mobility Division");
  assert.equal(context.loops.find((loop) => loop.id === "vsm-loop-s2-s1-coordination").label, "S2-S1 coordination");
  assert.equal(context.loops.find((loop) => loop.id === "vsm-loop-s4-environment-sensing").label, "S4-environment sensing");
  assert.equal(context.loops.find((loop) => loop.id === "vsm-loop-s4-s3-homeostat").sys, "S4/S3");
  assert.deepEqual(
    Object.fromEntries(context.loops.map((loop) => [loop.id, loop.vsmChannel])),
    {
      "vsm-loop-s5-s1-algedonic": "g",
      "vsm-loop-s3-s1-command": "e",
      "vsm-loop-s3-s1-resource-bargain": "d",
      "vsm-loop-s3star-s1-audit": "b",
      "vsm-loop-s2-s1-coordination": "f",
      "vsm-loop-s4-environment-sensing": "s4env",
      "vsm-loop-s4-s3-homeostat": "h34",
      "vsm-loop-s5-s4-s3-normative": "h5"
    }
  );
  assert.ok(context.loops.every((loop) => loop.label.length < 50));
});

test("saved ratings and notes survive SIF and operative-unit renames through stable loop ids", () => {
  const workspace = createWorkspace();
  workspace.sif.name = "Old SIF";
  workspace.step1.operativeUnits = [createOperativeUnit("Old Unit")];
  const model = getStep6ChannelVarietyContext(workspace).model;
  const audit = model.loops.find((loop) => loop.id === "vsm-loop-s3star-s1-audit");
  audit.communication = "Monthly independent review";
  audit.artifact = "Independent audit report";
  audit.role = "Internal auditor";
  audit.ratings = [3, 2, 1, 3];
  audit.note = "Evidence reaches the SIF too slowly.";

  assert.equal(setStep6ChannelVarietyModel(workspace, model), true);
  workspace.sif.name = "Renamed SIF";
  workspace.step1.operativeUnits[0].name = "Renamed Unit";
  const restored = getStep6ChannelVarietyContext(workspace).model;
  const restoredAudit = restored.loops.find((loop) => loop.id === audit.id);

  assert.equal(restoredAudit.id, audit.id);
  assert.equal(restoredAudit.communication, "Monthly independent review");
  assert.equal(restoredAudit.artifact, "Independent audit report");
  assert.equal(restoredAudit.role, "Internal auditor");
  assert.deepEqual(restoredAudit.ratings, [3, 2, 1, 3]);
  assert.equal(restoredAudit.note, "Evidence reaches the SIF too slowly.");
  assert.equal(restoredAudit.vsmChannel, "b");
  assert.equal(restored.meta.sifName, "Renamed SIF");
  assert.equal(restoredAudit.label, "S3*-S1 independent real-life information");
});

test("legacy communication checks migrate into the matching canonical loops", () => {
  const workspace = ensureWorkspaceShape({
    sif: { name: "Legacy SIF" },
    step6: {
      communicationChannels: [{
        id: "legacy-audit",
        loop: "S3*-S1 real-life information",
        channelsUsed: "Site visits and audit reports",
        capacity: "Strong",
        intelligibility: "Adequate",
        synchronicity: "Weak",
        security: "Strong",
        observation: "Audit reports arrive late."
      }]
    }
  });
  const audit = getStep6ChannelVarietyContext(workspace).model.loops
    .find((loop) => loop.id === "vsm-loop-s3star-s1-audit");

  assert.equal(audit.communication, "Site visits and audit reports");
  assert.equal(audit.artifact, "");
  assert.equal(audit.role, "");
  assert.deepEqual(audit.ratings, [3, 2, 1, 3]);
  assert.equal(audit.note, "Audit reports arrive late.");
});

test("workspace repair restores missing loops, removes unknown loops, and normalizes invalid ratings", () => {
  const workspace = ensureWorkspaceShape({
    step6: {
      channelVarietyModel: {
        meta: { workshopNote: "Keep this host-owned metadata." },
        loops: [
          {
            id: "vsm-loop-s3-s1-command",
            sys: "S3",
            label: "Old label",
            channels: "Weekly review",
            ratings: [3, 8, -1, "2"],
            note: "Review intervention quality."
          },
          { id: "invented-horizontal-loop", sys: "S1", ratings: [3, 3, 3, 3] }
        ]
      }
    }
  });
  const model = getStep6ChannelVarietyContext(workspace).model;
  const command = model.loops.find((loop) => loop.id === "vsm-loop-s3-s1-command");

  assert.equal(model.loops.length, 8);
  assert.equal(model.loops.some((loop) => loop.id === "invented-horizontal-loop"), false);
  assert.deepEqual(command.ratings, [3, 0, 0, 2]);
  assert.equal(command.communication, "Weekly review");
  assert.equal(command.artifact, "");
  assert.equal(command.role, "");
  assert.equal(Object.hasOwn(command, "channels"), false);
  assert.equal(command.note, "Review intervention quality.");
  assert.equal(command.vsmChannel, "e");
  assert.equal(model.meta.workshopNote, "Keep this host-owned metadata.");
});

test("only weak communication criteria become implementation candidates", () => {
  const workspace = createWorkspace();
  const model = getStep6ChannelVarietyContext(workspace).model;
  const coordination = model.loops.find((loop) => loop.id === "vsm-loop-s2-s1-coordination");
  coordination.ratings = [1, 2, 3, 0];
  coordination.note = "Capacity is insufficient for the current coordination load.";
  coordination.communication = "Weekly coordination meeting";
  setStep6ChannelVarietyModel(workspace, model);

  const candidates = getStep6ChannelVarietyWeaknessCandidates(workspace);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].loopId, coordination.id);
  assert.equal(candidates[0].criterionIndex, 0);
  assert.equal(candidates[0].criterionLabel, "Capacity");
  assert.equal(candidates[0].converted, false);
});

test("a communication weakness requires explicit promotion and preserves its precise source", () => {
  const workspace = createWorkspace();
  const model = getStep6ChannelVarietyContext(workspace).model;
  const audit = model.loops.find((loop) => loop.id === "vsm-loop-s3star-s1-audit");
  audit.ratings = [3, 1, 2, 3];
  audit.note = "Independent evidence is difficult to interpret.";
  setStep6ChannelVarietyModel(workspace, model);

  assert.equal(workspace.implementation.items.length, 0);
  const item = createImplementationItemFromChannelWeakness(workspace, audit.id, 1);

  assert.deepEqual(item.source, {
    kind: "channel-variety-weakness",
    loopId: audit.id,
    criterionIndex: 1
  });
  assert.equal(item.sourceStatus, "active");
  assert.match(item.challenge, /Clarity weakness/);
  assert.equal(getStep6ChannelVarietyWeaknessCandidates(workspace)[0].converted, true);
  assert.equal(createImplementationItemFromChannelWeakness(workspace, audit.id, 1), null);
});

test("improving a promoted weak criterion retains the backlog item and marks its source resolved", () => {
  const workspace = createWorkspace();
  const model = getStep6ChannelVarietyContext(workspace).model;
  const normative = model.loops.find((loop) => loop.id === "vsm-loop-s5-s4-s3-normative");
  normative.ratings = [3, 1, 3, 3];
  setStep6ChannelVarietyModel(workspace, model);
  const item = createImplementationItemFromChannelWeakness(workspace, normative.id, 1);

  normative.ratings[1] = 3;
  setStep6ChannelVarietyModel(workspace, model);

  assert.equal(workspace.implementation.items.includes(item), true);
  assert.equal(item.sourceStatus, "source-resolved");
  assert.equal(getStep6ChannelVarietyWeaknessCandidates(workspace).length, 0);
});

test("communication weakness candidates render explicit promotion and source navigation actions", () => {
  const workspace = createWorkspace();
  const model = getStep6ChannelVarietyContext(workspace).model;
  const command = model.loops.find((loop) => loop.id === "vsm-loop-s3-s1-command");
  command.ratings = [1, 3, 3, 3];
  setStep6ChannelVarietyModel(workspace, model);

  const candidateHtml = renderImplementationWorkspace(workspace);
  assert.match(candidateHtml, /Communication Weakness Candidates/);
  assert.match(candidateHtml, /Capacity/);
  assert.match(candidateHtml, /data-action="create-backlog-from-channel-weakness"/);
  assert.match(candidateHtml, /data-action="open-channel-weakness-source"/);

  createImplementationItemFromChannelWeakness(workspace, command.id, 0);
  const backlogHtml = renderImplementationWorkspace(workspace);
  assert.match(backlogHtml, /Added to backlog/);
  assert.match(backlogHtml, /Communication weakness/);
});

test("implementation export retains channel weakness source references", () => {
  const workspace = createWorkspace();
  const model = getStep6ChannelVarietyContext(workspace).model;
  const loop = model.loops.find((candidate) => candidate.id === "vsm-loop-s3-s1-resource-bargain");
  loop.ratings = [1, 3, 3, 3];
  setStep6ChannelVarietyModel(workspace, model);
  createImplementationItemFromChannelWeakness(workspace, loop.id, 0);

  const artifact = buildStepOutcome(workspace, "implementation");
  assert.match(artifact.content, /channel-variety-weakness/);
  assert.match(artifact.content, /vsm-loop-s3-s1-resource-bargain/);
  assert.match(artifact.content, />0</);
});
