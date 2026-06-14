# VSM7 Workshop Workspace

A first working slice for a generic Viable System Model workshop app that runs in the browser.

The app treats workshop files as generated outputs, while the canonical project data stays in browser localStorage:

`Organization -> VSM Project -> Steps I-VII -> Structured Artifacts -> Exports`

## Run

Open `index.html` in a browser, or on macOS double-click:

```sh
./start.command
```

For sharing with stakeholders, publish the folder to any static web host. No Node.js backend is required for app usage.

Node.js is only needed for developer activities such as running unit tests.

## Scope

This slice focuses on the canonical VSM data model and the SCT-centered flow:

- Step I: Operative units and segmentation decision
- Step II: manageability assessment
- Step III: success-critical tasks
- Step IV: central/decentral allocation and accountability
- Step V-VII: structured capture for meetings, communication checks, representation, and implementation
- Downloadable Word/Excel-compatible outcomes plus project JSON
- Browser localStorage persistence for workshop/project data

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
