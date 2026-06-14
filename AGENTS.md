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
- Step V: meeting architecture, meeting value filter, input-output meeting chain, VSM system map.
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
- Step V allocates VSM system numbers to those contributions: **Which steering function performs each contribution?**
- Step VI connects contributions through communication channels and later E2E process routes: **How must information and work flow?**
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
- Allocate the VSM system number in Step V per SCT contribution, not only once for the entire SCT. The same SCT can represent different VSM systems at different recursion levels.
- Step V analysis should make visible:
  - whether all VSM systems are sufficiently covered,
  - and how the proportion of tasks per VSM system differs across recursion levels.
- Step VI has two distinct scopes:
  - variety checks between VSM systems,
  - and a later robustness check for E2E processes based on SCTs and their contributions, inspired by a Flight Levels flight-route simulation.
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
- Step V: Design S2-S5.
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
