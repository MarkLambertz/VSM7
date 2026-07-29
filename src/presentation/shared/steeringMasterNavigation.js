const step5Systems = new Set(["1", "2", "3", "3*", "4", "5"]);

export function resolveSteeringMasterNavigation(message) {
  if (!message || message.api !== 1 || message.evt !== "navigate") {
    return null;
  }

  if (message.stepId === "step5") {
    return {
      view: "step5",
      step5System: normalizeStep5System(message.system),
      sctId: stringId(message.sctId || message.ref?.id)
    };
  }

  if (message.stepId === "step7" && (message.substep === "7.6" || message.substep === "meetings")) {
    const meetingId = stringId(message.meetingId || message.ref?.id);
    return meetingId
      ? {
          view: "step7",
          step7Substep: "7.6",
          selection: { kind: "meeting", id: meetingId }
        }
      : null;
  }

  return null;
}

function normalizeStep5System(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/^SYSTEM-?/, "")
    .replace(/^S/, "");
  return step5Systems.has(normalized) ? normalized : "3";
}

function stringId(value) {
  return typeof value === "string" ? value.trim() : "";
}
