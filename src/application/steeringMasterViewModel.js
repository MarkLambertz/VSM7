import {
  formatSctNumber,
  getStep5AssignedSystem,
  getStep5InScopeContributions,
  getStep6ChannelVarietyContext,
  getStep7MeetingLandscapeContext,
  getStep7RasicAssignment,
  getStep7SctContributions,
  getStep7Vessels
} from "../domain/vsm.js?v=20260729-brand-home-link";

const steeringSystems = new Set(["S2", "S3", "S3*", "S4", "S5"]);

export function getSteeringMasterViewModel(workspace) {
  const taskById = new Map(
    (Array.isArray(workspace?.step3?.successCriticalTasks) ? workspace.step3.successCriticalTasks : [])
      .map((task) => [String(task?.id || ""), task])
      .filter(([taskId]) => taskId)
  );
  const mappedEntries = buildMappedScts(workspace, taskById);
  const modelIdByContribution = new Map();
  const modelIdsByTask = new Map();

  for (const entry of mappedEntries) {
    for (const contributionId of entry.contributionIds) {
      modelIdByContribution.set(contributionId, entry.id);
    }
    const ids = modelIdsByTask.get(entry.taskId) || [];
    ids.push(entry.id);
    modelIdsByTask.set(entry.taskId, ids);
  }

  const meetingContext = getStep7MeetingLandscapeContext(workspace);

  return {
    context: {
      sif: String(workspace?.sif?.name || workspace?.project?.name || "System-in-Focus"),
      level: "R0",
      units: (Array.isArray(workspace?.step1?.operativeUnits) ? workspace.step1.operativeUnits : [])
        .map((unit) => String(unit?.name || "").trim())
        .filter(Boolean)
    },
    model: {
      scts: mappedEntries.map(({ contributionIds: _contributionIds, taskId: _taskId, ...entry }) => entry),
      organs: buildSteeringMeetings(
        workspace,
        meetingContext,
        mappedEntries,
        modelIdByContribution,
        modelIdsByTask
      ),
      aspects: buildAspects(workspace, mappedEntries),
      accountable: buildAccountability(workspace, mappedEntries),
      loops: buildLoops(workspace)
    }
  };
}

function buildMappedScts(workspace, taskById) {
  const grouped = new Map();

  for (const contribution of getStep5InScopeContributions(workspace)) {
    const system = normalizeSystem(getStep5AssignedSystem(workspace, contribution.key));
    if (!system) {
      continue;
    }

    const groupKey = `${contribution.taskId}|${system}`;
    const current = grouped.get(groupKey) || {
      taskId: contribution.taskId,
      system,
      contributionIds: []
    };
    current.contributionIds.push(contribution.key);
    grouped.set(groupKey, current);
  }

  const systemsByTask = new Map();
  for (const group of grouped.values()) {
    const systems = systemsByTask.get(group.taskId) || new Set();
    systems.add(group.system);
    systemsByTask.set(group.taskId, systems);
  }

  return [...grouped.values()]
    .map((group) => {
      const task = taskById.get(group.taskId) || {};
      const hasSeveralSystems = (systemsByTask.get(group.taskId)?.size || 0) > 1;
      return {
        id: hasSeveralSystems ? `${group.taskId}|${group.system}` : group.taskId,
        did: formatSctNumber(task.number),
        name: String(task.title || "Untitled SCT"),
        sys: group.system,
        state: task.state === "candidate" ? "candidate" : "accepted",
        taskId: group.taskId,
        contributionIds: [...new Set(group.contributionIds)]
      };
    })
    .sort((left, right) => (
      Number(left.did.replace(/\D/g, "")) - Number(right.did.replace(/\D/g, ""))
      || left.sys.localeCompare(right.sys)
    ));
}

function buildAspects(workspace, mappedEntries) {
  const source = workspace?.step7?.aspects || {};
  return Object.fromEntries(mappedEntries.map((entry) => {
    const bundle = source[entry.taskId] || {};
    return [entry.id, {
      kpis: aspectLabels(bundle.kpis),
      artifacts: aspectLabels(bundle.artifacts),
      tools: aspectLabels(bundle.tools)
    }];
  }));
}

function buildAccountability(workspace, mappedEntries) {
  const vessels = getStep7Vessels(workspace);
  return Object.fromEntries(mappedEntries.map((entry) => {
    const names = new Set();
    for (const contributionId of entry.contributionIds) {
      for (const vessel of vessels) {
        if (getStep7RasicAssignment(workspace, contributionId, vessel.id) === "A") {
          const name = String(vessel.name || "").trim();
          if (name) {
            names.add(name);
          }
        }
      }
    }
    return [entry.id, names.size > 0 ? [...names].join(" / ") : null];
  }));
}

function buildSteeringMeetings(
  workspace,
  meetingContext,
  mappedEntries,
  modelIdByContribution,
  modelIdsByTask
) {
  const allContributions = getStep7SctContributions(workspace);
  const taskIdByContribution = new Map(allContributions.map((contribution) => [contribution.id, contribution.taskId]));
  const modelById = new Map(mappedEntries.map((entry) => [entry.id, entry]));
  const rawMeetings = workspace?.step7?.meetings || {};

  return Object.values(meetingContext.meetings || {}).map((meeting) => {
    const rawMeeting = rawMeetings[meeting.id];
    const hasExplicitCoverage = isRecord(rawMeeting)
      && (hasOwn(rawMeeting, "contribs") || hasOwn(rawMeeting, "steering"));
    const references = hasExplicitCoverage ? meetingCoverageReferences(meeting) : [];
    const covers = hasExplicitCoverage
      ? resolveMeetingCoverage(references, modelIdByContribution, modelIdsByTask, taskIdByContribution)
      : null;
    const coveredSystems = new Set((covers || [])
      .map((modelId) => modelById.get(modelId)?.sys)
      .filter(Boolean));
    const explicitSystem = normalizeSystem(meeting.sys);
    const system = explicitSystem || (coveredSystems.size === 1 ? [...coveredSystems][0] : null);

    return {
      id: String(meeting.id || ""),
      name: String(meeting.name || "Unnamed meeting"),
      sys: system,
      cad: meetingCadenceLabel(meeting),
      people: meetingParticipantCount(meeting),
      covers,
      alg: meeting.alg === true
    };
  }).filter((meeting) => meeting.id);
}

function buildLoops(workspace) {
  return getStep6ChannelVarietyContext(workspace).model.loops.map((loop) => ({
    id: String(loop.id || ""),
    sys: loopSystems(loop.sys),
    name: String(loop.label || ""),
    ratings: (Array.isArray(loop.ratings) ? loop.ratings : [])
      .slice(0, 4)
      .map((rating) => Number.isFinite(Number(rating)) ? Number(rating) : 0),
    note: String(loop.note || ""),
    ch: String(loop.vsmChannel || "")
  }));
}

function meetingCoverageReferences(meeting) {
  const references = [];
  for (const contribution of Array.isArray(meeting.contribs) ? meeting.contribs : []) {
    references.push(typeof contribution === "object" ? contribution.ref || contribution.id : contribution);
  }
  for (const steering of Array.isArray(meeting.steering) ? meeting.steering : []) {
    references.push(typeof steering === "object" ? steering.ref || steering.id : steering);
  }
  return [...new Set(references.map((reference) => String(reference || "")).filter(Boolean))];
}

function resolveMeetingCoverage(references, modelIdByContribution, modelIdsByTask, taskIdByContribution) {
  const covers = new Set();
  for (const reference of references) {
    const exactModelId = modelIdByContribution.get(reference);
    if (exactModelId) {
      covers.add(exactModelId);
      continue;
    }

    const taskId = taskIdByContribution.get(reference) || reference;
    for (const modelId of modelIdsByTask.get(taskId) || []) {
      covers.add(modelId);
    }
  }
  return [...covers];
}

function meetingParticipantCount(meeting) {
  const participants = new Set();
  for (const item of [
    ...(Array.isArray(meeting.participations) ? meeting.participations : []),
    ...(Array.isArray(meeting.participants) ? meeting.participants : [])
  ]) {
    const id = typeof item === "object"
      ? item.vesselId || item.vesselRef || item.ref || item.roleId
      : item;
    if (id) {
      participants.add(String(id));
    }
  }
  return participants.size;
}

function meetingCadenceLabel(meeting) {
  if (typeof meeting.cadence === "string") {
    return meeting.cadence;
  }
  return String(meeting.cadence?.label || meeting.cad?.f || "");
}

function aspectLabels(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => typeof item === "object" ? item.text || item.label || item.name : item)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeSystem(value) {
  const normalized = String(value || "").trim().toUpperCase();
  const system = normalized.startsWith("S") ? normalized : normalized ? `S${normalized}` : "";
  return steeringSystems.has(system) ? system : null;
}

function loopSystems(value) {
  return [...new Set(String(value || "")
    .split(/[\/,]/)
    .map(normalizeSystem)
    .filter(Boolean))];
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
}
