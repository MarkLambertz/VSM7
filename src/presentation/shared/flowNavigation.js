const subpageTransitions = {
  step1: {
    action: "step1-subpage",
    stateKey: "step1Subpage",
    destinations: {
      sif: { label: "Continue with Segmentation Options", subpage: "segmentation" },
      segmentation: { label: "Continue with Key Buying Criteria", subpage: "criteria" },
      criteria: { label: "Continue with Six Pack Fields", subpage: "six-pack" },
      "six-pack": { label: "Continue with Evaluation", subpage: "evaluation" },
      evaluation: { label: "Continue with Variety Assessment", view: "step2", subpage: "assessment" }
    }
  },
  step2: {
    action: "step2-subpage",
    stateKey: "step2Subpage",
    destinations: {
      assessment: { label: "Continue with Steering Challenges", subpage: "challenges" },
      challenges: { label: "Continue with SCT Input Signals", view: "step3", subpage: "signals" }
    }
  },
  step3: {
    action: "step3-subpage",
    stateKey: "step3Subpage",
    destinations: {
      signals: { label: "Continue with Complexity Drivers", subpage: "drivers" },
      drivers: { label: "Continue with SCT Register", subpage: "register" },
      register: { label: "Continue with Central/Decentral", view: "step4" }
    }
  }
};

const stepTransitions = {
  step4: { label: "Continue with Design Steering System", view: "step5", system: "3" },
  step5: { label: "Continue with Channels", view: "step6", subpage: "e2e" },
  step6: { label: "Continue with Representation", view: "step7", subpage: "7.1" },
  step7: { label: "Continue with Implementation", view: "implementation" }
};

export function getNextFlowAction(state = {}) {
  const view = state.view;
  const transitionGroup = subpageTransitions[view];
  if (transitionGroup) {
    const destination = transitionGroup.destinations[state[transitionGroup.stateKey]];
    return resolveDestination(destination, transitionGroup.action);
  }

  return resolveDestination(stepTransitions[view], "navigate");
}

function resolveDestination(destination, sameStepAction) {
  if (!destination) {
    return null;
  }

  return {
    action: destination.view ? "navigate" : sameStepAction,
    ...destination
  };
}
