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
  - `src/domain`: VSM entities, policies, and completeness logic.
  - `src/application`: workspace orchestration.
  - `src/infrastructure`: browser persistence and exports.
  - `src/presentation`: UI rendering and interaction.
  - `tests`: domain and behavior checks.
- Preserve a Solid/onion architecture mindset and avoid mixing domain rules into UI rendering when they belong in domain/application code.
- Use DDD language from the product: organization, project, System-in-Focus, recursion level, segmentation option, SCT, accountability, meeting, channel, representation.
- Keep code DRY, but do not add abstractions before they reduce real duplication or clarify boundaries.
- Add or update tests when domain behavior, completeness logic, scoring rules, or data-shaping changes.

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

## Visual Language

Use method-specific visual placeholders rather than generic decoration. They should help the facilitator explain what happens in the current VSM step.

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
- The completeness assistant is a service for completeness, not a challenge or grading mechanism.
- Business and support functions should be treated the same in the app. The user is responsible for applying virtual S1 theory correctly.
- SCTs are central. They later drive roles, meetings, agendas, accountability, and representation.
- Step VII includes hierarchy/representation derivation, but it is only one part of the full seven-step VSM process.
- Implementation support is in scope through backlog, roadmap, owners, milestones, dependencies, and follow-up artifacts.

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
