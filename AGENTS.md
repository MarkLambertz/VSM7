# AGENTS.md

Guidance for Codex and other coding agents working on VSM7.

## Collaboration Contract

- Discuss first when the user is exploring, aligning, or asking design/product questions.
- Ask for permission before implementing when the user has not explicitly said to code, implement, fix, refactor, or push.
- When the user explicitly says "implement", "fix", "refactor", or "push", proceed and verify the result.
- Keep explanations non-technical unless the user asks for technical detail.
- Prefer short progress updates while working, especially before file edits.
- Do not spend effort "for the cat": clarify uncertain product decisions before building.

## Product Intent

VSM7 is a workshop application for VSM experts. It guides users through a VSM-from-scratch approach and captures the essence of physical or virtual workshop work in one canonical place.

Core hierarchy:

`Organization -> Project -> VSM Steps I-VII -> Structured artifacts -> Exports`

The app is the single source of truth. Teams may brainstorm in Miro, Teams, whiteboards, or with Post-its, but the consolidated results belong in VSM7.

The app must not feel like a naked data collector or generic SAP/Bootstrap template. It should feel like a serious workshop cockpit: structured, focused, and facilitation-friendly.

## Runtime Boundary

- The app must be shareable with stakeholders who only have a browser.
- Do not introduce a required Node.js backend for normal app usage.
- Browser localStorage is currently the persistence mechanism.
- Node.js is allowed only for developer activities such as tests or local tooling.
- Keep `start.command` aligned with the static/local serving approach if it changes.
- When frontend JS or CSS changes should be visible in the browser, update the cache-busting labels in both `index.html` and `start.command`. Otherwise Safari may keep loading an older app module even though the source files changed.

## Architecture Principles

- Keep the existing clean architecture direction:
  - `src/domain`: VSM entities, policies, and method logic.
  - `src/application`: workspace orchestration.
  - `src/infrastructure`: browser persistence and exports.
  - `src/presentation`: UI rendering and interaction.
  - `tests`: domain and behavior checks.
- Preserve a Solid/onion architecture mindset and avoid mixing domain rules into UI rendering when they belong in domain/application code.
- Use DDD language from the product: organization, project, System-in-Focus, recursion level, segmentation option, SCT, accountability, meeting, channel, representation.
- Keep code DRY, but do not add abstractions before they reduce real duplication or clarify boundaries.
- Add or update tests when domain behavior, method rules, scoring rules, or data-shaping changes.

## UX Direction

- VSM7 is used live in workshops, often on a projected or shared screen.
- Design for distance reading:
  - higher contrast text,
  - larger type in facilitation surfaces,
  - fewer words per block,
  - bigger bullets,
  - deliberate whitespace.
- Use two typography modes:
  - Capture mode: denser tables/forms for data entry.
  - Facilitation mode: presentation-grade fullscreen tiles.
- Fullscreen/focus mode should let users move across tiles and across steps without pressing Escape.
- Escape must exit fullscreen/focus mode.
- In normal view, in-place actions such as opening, editing, adding, splitting, merging, or closing an SCT must preserve the user's viewport and relevant internal scroll positions. Do not make facilitators find their place again after a local action.
- Fullscreen explanation tiles should generally contain:
  - big title,
  - one strong explanation sentence,
  - outcome block,
  - three guiding prompts,
  - optional quieter coach note.
- Normal step pages should keep a strong hero/workshop stage, but avoid oversized sparse placeholders.
- Left navigation belongs only when a project is open, not on the start page.
- Keep buttons compact and button-like. Avoid oversized button heights.
- Use `VSM7` as the app/product logo text.
- Preserve viewport continuity for in-place capture actions in normal view. Adding, editing, selecting, or removing rows must not unexpectedly jump the facilitator back to the top of the page. Fullscreen/focus mode may use its own navigation behavior.
- Require an explicit confirmation immediately before every destructive action, from deleting an SCT or supporting attachment to deleting a project or organization. Name the affected artifact or scope in the dialogue when available.

## Visual Language

Use method-specific visual placeholders rather than generic decoration. They should help the facilitator explain what happens in the current VSM step.

VSM7 supports interface skins:

- `Workshop` is the calm, bright default.
- `Command Deck` is the high-contrast, segmented alternative.
- Keep skin preferences separate from organizations, projects, and VSM method data.
- Apply skins through shared presentation tokens and targeted CSS overrides; do not duplicate page markup per skin.
- Skin changes must affect the interface only. Exports, method scoring, and canonical workshop data must remain unchanged.

Consistent color grammar:

- Blue: VSM systems, steering, control logic.
- Green/teal: viable, robust, good fit.
- Amber: tension, prioritization, decision.
- Red: overload, weak scores, risk.

Suggested visual placeholders:

- Step I: boundary map, segmentation option cards, customer value lens, Six Pack compass, decision heatmap.
- Step II: variety balance scale, flattening simulator, remedy triangle, six vertical channels.
- Step III: complexity funnel, SCT spine, overlap map, weak-score radar.
- Step IV: subsidiarity ladder, accountability map, centralization tension, split-ownership warning.
- Step V: code-native VSM system map, SCT-contribution distribution, unmapped-contribution signals, and Step II variety comparison.
- Step VI: closed-loop diagram, channel robustness radar, bottleneck map, strategic-operative planning loop.
- Step VII: role constellation, RASIC core, value-enhanced org chart, one-pager stack.
- Implementation: transformation roadmap, epic board, dependency map, project team triangle.

## VSM Method Boundaries

- The app is for VSM experts; do not over-explain basic theory in the UI.
- Do not calculate, display, or export step or project completeness percentages. VSM workshop experts decide when a step is sufficiently complete.
- Business and support functions should be treated the same in the app. The user is responsible for applying virtual S1 theory correctly.
- SCTs are the canonical backbone of the steering-system design. They later drive organizational contributions, VSM-system allocation, communication, processes, roles, meetings, agendas, accountability, and representation.
- Step VII includes hierarchy/representation derivation, but it is only one part of the full seven-step VSM process.
- Implementation support is in scope through backlog, roadmap, owners, milestones, dependencies, and follow-up artifacts.

## SCT Canonical Backbone

Treat every Success-Critical Task as one persistent canonical entity that is referenced and enriched throughout the later VSM steps. Never create disconnected copies of an SCT for each step.

The SCT lifecycle answers progressively richer steering questions:

- Step III defines the SCT: **What must permanently be done?**
- Step IV decomposes the SCT into contributions by recursion level and organizational unit: **Where are contributions required?**
- Step V allocates VSM system numbers to the R0/System-in-Focus contributions: **Which steering function performs each SIF contribution?**
- Step VI connects contributions through communication channels and E2E process routes: **How must information and work flow?**
- Step VII allocates roles, responsibilities, and RASIC relationships: **Who is accountable and involved?**

Important modeling boundaries:

- Introduce an `SCT Contribution` concept that references:
  - the canonical SCT,
  - a recursion-level entry,
  - the organizational unit represented by that entry,
  - a free-text contribution description,
  - and later enrichments such as VSM system number, channels, roles, RASIC, meetings, and processes.
- Step IV must reuse the actual recursion structure and organizational units defined in Step I. Do not show only generic `R-1`, `R0`, and `R+1` columns.
- Each SCT/organizational-unit intersection needs a free-text field to describe that unit's contribution. An empty field means no contribution has been identified yet.
- Allocate the VSM system number in Step V per R0 SCT contribution, not only once for the entire SCT.
- Step V is a tri-pane, one-to-one mapping workflow: unmapped R0/SIF contributions on the left, the code-native clickable VSM diagram in the middle, and mapped contributions grouped by VSM system on the right.
- A Step V contribution can be assigned to exactly one VSM system. If a contribution appears to serve multiple systems, split or decompose the SCT/contribution upstream before mapping it.
- Step V is system-first: select a VSM system, then assign the actual Step IV SCT contributions that perform its function.
- Step V includes only real, non-empty SCT contributions at R0, the System-in-Focus. Do not map lower recursion levels in Step V, and do not invent candidates, recommendations, or "eligible SCTs" that are not supported by canonical workshop data.
- Step V analysis should make visible the distribution of mapped contributions across VSM systems, unmapped contributions, and a human-led comparison with the Step II variety assessment. Do not present these patterns as organizational truth.
- The interactive Step V VSM diagram must be built as a precise code-native visual. Do not use the bitmap/pixel VSM graphic for interactive mapping. Preserve the original VSM color grammar: S1 neutral/navy, S2 amber, S3/S3* red, S4 green, and S5 light blue.
- **Front-end pointer:** that code-native diagram ships as `vsm.html` (front-end-owned); its data model, events, and `postMessage`/API integration contract are documented in **`VSM-VISUALIZATION-BRIEFING.md` §12**. It is a reusable component with its own standalone entry point in the main navigation **in addition to** Step V (Step V is not the only entry point). Request visual/interaction changes from the front-end designer rather than editing `vsm.html` directly.
- The Step V mapping lens should distinguish the doctrinal view (S2-S5 steering systems, S1 treated as self-organizing) from the pragmatic view (S1 can be mapped when the R0 SCT contribution describes operative work).
- Meeting landscapes and roles belong in Step VII, not Step V.
- Step VI has two distinct scopes:
  - `6.1 E2E Process Robustness Check`: a Flight Levels-inspired route editor based on the selected SCT and its actual Step IV contributions,
  - `6.2 Communication Variety Checks`: robustness checks between VSM systems.
- Step VI communication variety checks use one fixed canonical vertical-loop checklist for every System-in-Focus. Instantiate all seven loops per SIF; do not infer, filter, or remove loops from existing workshop data. The checklist covers S5-S1 algedonic, S3-S1 command, S3-S1 resource bargain, S3*-S1 audit, S2-S1 coordination, S4-S3 homeostat, and S5-S4/S3 normative communication.
- The communication variety editor ships as front-end-owned `channel-variety-check.html`; its bridge and model contract are documented in front-end-owned `CHANNEL-VARIETY-BRIEFING.md`. Host code owns embedding, stable per-SIF loop identities, persistence, legacy migration, reports, and export orchestration. Request visual or bridge changes from the front-end owner instead of editing either file.
- Preserve canonical communication-loop ids and ratings across SIF or organizational renames. Missing or informal loops remain visible and rateable; absence is a diagnostic result, not a reason to filter a loop out.
- The Step VI E2E editor ships as `e2e-robustness-check.html` and is front-end-owned. Its bridge contract is documented in `FLIGHT-ROUTE-BRIEFING.md` section 8. Host-side agents must not edit either file; request front-end changes from the front-end owner.
- Persist each authored E2E route in the canonical workspace by its primary SCT id. The host owns recursion levels and SCT contribution context; the editor owns route nodes, links, call-outs, and findings. Restore the host copy through `loadModel` and reconcile lanes through stable Step I ids.
- An E2E route describes the **HOW** for a primary SCT's **WHAT**. The facilitator may explicitly add related SCTs when a real process crosses SCT boundaries. Store only stable references in `meta.primarySctId` and `meta.relatedSctIds`; never duplicate SCTs or their contributions into route-owned domain records.
- Send cross-SCT context to the editor through `setSCTContext`. Every primary/related SCT object carries its canonical `id`, human-readable `displayId` (for example `SCT-001`), and mutable `name`; canonical contribution references continue to use `sctId` and `sctName`. `displayId` is runtime context only and must never replace stable ids in persisted relationships. Preserve the editor's optional `node.contribSctId` origin hint and the canonical `contribId` verbatim.
- Related SCT names must resolve live from canonical SCT data. Removing a related SCT must not delete placed route steps; preserve the route evidence and let the editor flag the source as unavailable. SCT splits and merges must rewire valid SCT/contribution references through stable ids.
- Transition call-outs on cross-lane links capture robustness observations and hand-off risks.
- Step VI E2E routes may contain structured human-authored findings on a route step or connection. Preserve the frame-minted route, node, link, callout, and finding ids verbatim; legacy routes without a `findings` collection migrate to `findings: []`.
- E2E findings are workshop observations, not automatic organizational truth. They become transformation-backlog candidates only and require an explicit human action before a backlog item is created.
- A backlog item created from an E2E finding must retain `source: { kind: "e2e-finding", routeId, findingId }`. If the finding or route later disappears, keep the backlog item and visibly flag its source as removed or detached rather than silently deleting work.
- SCT split and merge operations must preserve route evidence through stable route identities. A split receives a new route identity while preserving the copied route's internal element/finding ids; a merge keeps one active route and archives additional routes as detached evidence.
- Step VII enriches the same SCTs and contributions with roles and RASIC accountability. Meeting landscapes and organizational charts are additional Step VII derivations, not replacements for SCT-based accountability.
- Renaming or moving a Step I organizational unit must preserve its downstream SCT contributions through stable references.
- Deleting a referenced organizational unit must never silently delete downstream SCT contributions. Require explicit confirmation and preserve or clearly flag affected contribution data.

This coherent model should support later analysis of missing contributions, missing VSM-system coverage, task distribution by recursion level, over-centralization, missing communication routes, E2E process robustness, and SCTs without clear accountability.

## Step I Specifics

Step I is "Operative Units" and is split into:

1. System-in-Focus and Recursion Levels.
2. Segmentation Options.
3. Key Buying Criteria.
4. Strategic Fields of Action based on the Six Pack of Control.
5. Evaluation.

Important Step I rules:

- Recursion levels are fixed by level label. Users may change only names/descriptions.
- Adding recursion levels must ask whether to add one level above the current top level or below the current bottom level.
- Users must also be able to add another organization on an existing recursion level.
- Key Buying Criteria should represent customer-facing purchase-deciding criteria, usually five to seven, with weights summing to 100 percent.
- "Relative Position" should be worded as "Relative Position to Competition".
- Six Pack fields need enough space for priorities, targets, ambitions, supporting files, and links.
- Evaluation uses forced prioritization:
  - For `n` segmentation options, each row uses the scale `1..n+1`.
  - Within a row, each numeric score may appear only once.
  - This enforces prioritization instead of allowing equal ranking.
  - Calculate column sums per segmentation option.
- The selected segmentation option becomes the foundation for later steps.
- Weak scores in Step I are signals for SCTs that may need top management attention.

## Data And Exports

- Every step should have at least one downloadable outcome where meaningful.
- Exports can be Word/Excel/PPT-compatible depending on the artifact.
- Canonical data stays in the app model; exported files are generated outputs, not the source of truth.
- Avoid fragmented PPT/Excel data as the primary storage model.

## Step Naming

Current step labels:

- Step I: Operative Units.
- Step II: Manageability.
- Step III: SCTs.
- Step IV: Central/Decentral.
- Step V: Design Steering System.
- Step VI: Channels.
- Step VII: Representation.
- Implementation.

## Git And Verification

- Check whether the current workspace is actually a git repository before claiming anything has been pushed.
- Run `npm test` after behavior-relevant changes.
- For frontend changes, verify in the browser when practical and check for layout overflow.
- Do not claim a GitHub push succeeded unless the push command or GitHub connector confirms it.

### GitHub Push Procedure

The canonical local project folder is `/Users/mark/Documents/VSM7`. It has repeatedly been a plain project folder, not a git checkout. Do not waste time trying `git push` from that folder unless `git rev-parse --show-toplevel` proves it is a repository.

Use this procedure for pushing to `MarkLambertz/VSM7`:

1. Verify the local state first:
   - Run `npm test`.
   - Check the app still targets port `4173` via `start.command`.
   - If browser verification is practical, open `http://localhost:4173/?v=<current-cache-version>`.
2. Check GitHub CLI explicitly:
   - Use `/opt/homebrew/bin/gh --version`.
   - Use `/opt/homebrew/bin/gh auth status`.
   - If the token is invalid, stop and ask the user to run:
     `/opt/homebrew/bin/gh auth login -h github.com -s repo -w`
3. If `/Users/mark/Documents/VSM7` is not a git repo, use a temporary checkout:
   - Create a temp folder under `/private/tmp`, for example `/private/tmp/vsm7-push.<id>`.
   - Clone the repo with `/opt/homebrew/bin/gh repo clone MarkLambertz/VSM7 <temp-folder>`.
   - Mirror the local project into the temp checkout with `rsync`, excluding `.git`, `node_modules`, and system junk files.
   - Inspect `git status -sb` in the temp checkout before committing.
4. Commit and push from the temporary checkout:
   - `git add -A`
   - `git commit -m "<clear change summary>"`
   - `git push origin main`
5. Report the result:
   - Mention the commit hash or GitHub confirmation.
   - Mention tests run.
   - If push is blocked by auth or network, say exactly which blocker occurred and do not imply it succeeded.

Important: do not reintroduce a Node backend for normal app usage just to make pushing or persistence easier. VSM7 must remain static/browser-shareable; Node is only for development activities like tests.
