# Step 8 Implementation Candidate Sources

Date: 2026-07-17

Purpose: capture the agreed direction for reusing open design-phase topics in the Implementation step, and define how Codex and Claude should split the work later.

## Product Direction

Step 8 should act as the governed handover from VSM design into implementation. It should not blindly turn every warning into backlog work. Instead, it should collect implementation candidates with clear source evidence, let the facilitator promote, reject, merge, or defer them, and preserve the link back to the design-phase artifact that created the candidate.

The core pattern is an Implementation Candidate Inbox:

- Collect unresolved design topics from Steps III-VII.
- Keep the source evidence visible and stable.
- Allow human triage before anything becomes a roadmap or backlog item.
- Preserve rejected or deferred decisions where they matter, without polluting the active backlog.
- Avoid duplicating SCTs, roles, meetings, KPIs, or artifacts as disconnected implementation text.

## Candidate Sources

### Step 7 RASIC And Representation

- Accepted exceptional double-A RASIC cases.
- Contributions with no Accountable vessel.
- Responsible assignment without an Accountable vessel.
- Roles or functions without clear purpose.
- Roles or functions without decision authority.
- Meetings without charter, participants, outputs, KPIs, or escalation path.
- Org-chart/reporting ambiguities from Step 7.7.

Important distinction: a double-A warning should become a Step 8 candidate only when the facilitator accepts it as an intentional exception or marks it as unresolved. Ordinary warnings should remain diagnostic until explicitly promoted.

### SCT Backbone, Steps 3-5

- High-priority SCTs with weak or missing downstream design.
- SCTs that were split or merged and still need organizational cleanup.
- R0/SIF SCT contributions not mapped to a VSM system in Step 5.
- Overloaded or under-covered VSM systems, especially too much S3/S3* pressure or weak S4/S5 coverage.
- Contributions that appear to require upstream decomposition before implementation can be planned.

### Central / Decentral, Step 4

- Missing contribution descriptions.
- Unclear accountable organizational unit.
- Centralization or decentralization tensions that were left open.
- Contributions apparently assigned to the wrong recursion level.
- Deleted or changed organizational units with downstream contribution impact.

### Channels, Step 6

- Weak communication-loop ratings.
- Missing or weak algedonic paths.
- E2E route findings.
- Handoff risks between units.
- Unresolved escalation paths.
- Communication variety issues already promoted by the facilitator.

### Metrics, Artifacts, Tools

- Roles, meetings, or SCT contributions without useful KPIs.
- Duplicate KPI/metric wording that should become a reusable metric definition.
- Artifacts mentioned but not owned.
- Required tools or methods that are not institutionalized.
- Missing source systems, cadence, targets, or decision rights around metrics.

## Codex / Host Ownership

Codex should own the data and behavior layer:

- Define candidate source types and source references.
- Implement accepted double-A RASIC exceptions as candidate sources.
- Preserve source links back to Step 7.2, Step 6 findings, Step 5 mappings, Step 4 contributions, and SCT ids.
- Implement promotion, rejection, merge, and defer behavior.
- Deduplicate candidates where several signals point to the same implementation issue.
- Persist candidates and decisions across reloads.
- Keep exports and implementation backlog references aligned.
- Add tests for candidate generation, source stability, deduplication, and promotion behavior.

## Claude / UX Ownership

Claude should own the Step 8 user experience concept:

- Design the Implementation Candidate Inbox.
- Decide how candidates are grouped, filtered, prioritized, and inspected.
- Show clear states: warning, accepted exception, candidate, promoted backlog item, rejected, deferred.
- Design the candidate detail drawer/card with source evidence and recommended action.
- Improve the roadmap/backlog interaction once the host contract is stable.
- Support Workshop and Command Deck skins.
- Design tile-level fullscreen views for Step 8 only where a specific surface benefits from focus.

## Suggested Order

1. Codex defines and implements the candidate model and source contracts.
2. Claude designs the Step 8 candidate inbox and triage experience against that contract.
3. Codex wires Claude-owned surfaces into persistence, exports, and tests if needed.
4. Claude polishes layout and interaction.
5. Codex runs regression checks and ensures no design-phase data gets duplicated.

## Reminder

Mark asked to be reminded later to return to this Step 8 candidate-source concept after the current tile/fullscreen work. Timing is not yet specified.
