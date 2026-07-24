# VSM7 Workshop Workspace

A first working slice for a generic Viable System Model workshop app that runs in the browser.

The app treats workshop files as generated outputs, while the canonical project data stays in one structured workspace record:

`Organization -> VSM Project -> Steps I-VII -> Structured Artifacts -> Exports`

## Run

Open `index.html` in a browser, or on macOS double-click:

```sh
./start.command
```

`start.command` runs a small local Python server on `localhost:4173`. In that mode VSM7 saves projects as local files under `VSM7-Workspaces/`:

```text
VSM7-Workspaces/
  Organization/
    Project--shortid/
      workspace.vsm7.json
      project.md
      steps/
      snapshots/
      exports/
      attachments/
```

`workspace.vsm7.json` is the source of truth. The Markdown files are generated readable views for review, backup, and search. To place the workspace folder somewhere else, set `VSM7_WORKSPACE_DIR` before launching, for example to a corporate backup or sync folder.

For sharing with stakeholders, publish the folder to any static web host. No Node.js backend is required for app usage.

If the local file server is not available, VSM7 falls back to browser localStorage. Node.js is only needed for developer activities such as running unit tests.

## Scope

This slice focuses on the canonical VSM data model and the SCT-centered flow:

- Step I: Operative units and segmentation decision
- Step II: manageability assessment
- Step III: success-critical tasks
- Step IV: central/decentral allocation and accountability
- Step V: R0/SIF contribution mapping to VSM systems
- Step VI: E2E robustness routes anchored to one primary SCT, with optional related SCTs for real cross-task processes, plus a canonical per-SIF variety check covering all seven vertical VSM loops and downloadable route/check outcomes
- Step VII: roles, meetings, RASIC accountability, and representation
- Downloadable Word/Excel-compatible outcomes plus project JSON
- Local file-backed persistence when launched through `start.command`, with browser localStorage fallback

## Architecture

- `src/domain`: VSM entities, factory functions, and method policies
- `src/application`: workspace repository coordination
- `src/infrastructure`: browser localStorage and export adapters
- `src/presentation`: browser UI
- `tests`: domain-level checks

## Tests

```sh
npm test
```
