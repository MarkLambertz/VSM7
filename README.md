# VSM7 Design MVP

VSM7 is a browser-based workspace for designing organizations with the Viable System Model. It supports facilitators through a structured VSM workshop series, keeps the consolidated project record in one place, and turns workshop results into reusable corporate documents.

The canonical project structure is:

`Organization -> VSM Project -> System-in-Focus -> Steps I-VII -> Implementation -> Exports`

Success-Critical Tasks (SCTs) form the backbone of the model. They are defined once and progressively enriched with organizational contributions, VSM-system assignments, communication routes, roles, RASIC accountability, meetings, and representation.

## Current Capabilities

- Guided VSM workflow across Steps I-VII, plus an implementation backlog
- Explicit recursion levels with R0/System-in-Focus as the default workshop scope
- File-backed project storage with readable Markdown views, snapshots, exports, and attachments
- Step and tile views suited to both workshop capture and focused facilitation
- Steering Master for reviewing systems, accountability, meetings, instruments, and channel health across the design
- Context-aware exports to Word, Excel, PowerPoint, PDF, SVG, PNG, and JSON where the underlying artifact supports the format
- Workshop and Command Deck interface skins
- Browser-local fallback when the file-backed server is unavailable
- Static, browser-shareable application with no required Node.js backend

## Run Locally

VSM7 requires Python 3 for its local file-backed server. Anaconda Python is supported on Windows. Node.js is only required for development and tests.

### macOS

Double-click `start.command`, or run:

```sh
./start.command
```

### Windows 11

Double-click `start.bat`, or run it from Command Prompt or an Anaconda Prompt:

```bat
start.bat
```

### Debian/Linux

On first use, make the launcher executable and start it:

```sh
chmod +x ./start.sh
./start.sh
```

Additional Linux notes are available in [README-LINUX.md](README-LINUX.md).

All launchers open VSM7 at:

```text
http://localhost:4173/
```

Keep the launcher window open while using the app. It is the local file service that reads and writes project workspaces.

## Project Storage

By default, projects are stored under `VSM7-Workspaces/`:

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

`workspace.vsm7.json` is the source of truth. Markdown files are generated readable views for review, backup, and search; exported Word, Excel, PowerPoint, PDF, and image files are outputs, not primary storage.

To store workspaces in a corporate backup or synchronized folder, set `VSM7_WORKSPACE_DIR` before starting VSM7.

macOS or Linux example:

```sh
VSM7_WORKSPACE_DIR="$HOME/Documents/VSM7-Workspaces" ./start.sh
```

Windows Command Prompt example:

```bat
set VSM7_WORKSPACE_DIR=C:\Users\YourName\Documents\VSM7-Workspaces
start.bat
```

If the local file service is unavailable, VSM7 falls back to browser `localStorage`. File-backed mode is recommended for important projects because its workspace folders can be backed up, synchronized, archived, and versioned independently of the browser cache.

## Workshop Flow

1. **Operative Units**: define the System-in-Focus and recursion levels, compare segmentation options, weight Key Buying Criteria, assess Six Pack fields, and make the segmentation decision.
2. **Manageability**: assess organizational variety and capture how steering challenges will be mastered.
3. **SCTs**: derive input signals and complexity drivers, then maintain the canonical Success-Critical Task register.
4. **Central/Decentral**: describe SCT contributions by recursion level and organizational unit, preserving the real organizational structure from Step I.
5. **Design Steering System**: map real R0/SIF contributions to VSM systems and review the distribution of steering work.
6. **Channels**: model end-to-end robustness routes and assess the seven canonical vertical VSM communication loops.
7. **Representation**: define organizational vessels, RASIC accountability, metrics and artifacts, role and function descriptions, meetings, and organizational representation.
8. **Implementation**: turn confirmed findings and design topics into a transformation backlog with owners, dependencies, and follow-up artifacts.

The **Steering Master** provides a cross-cutting view of the resulting control organization and links findings back to their relevant workshop steps.

## Deployment

VSM7 is a static browser application. For stakeholder access, publish the repository contents to a static web host. The hosted version can use browser-local persistence; the supplied Python launcher adds local file-backed storage for workshop and desktop use.

No Node.js backend or database is required for normal app usage.

## Architecture

- `src/domain`: VSM entities, policies, calculations, and normalization
- `src/application`: workspace orchestration and view-model composition
- `src/infrastructure`: file/localStorage repositories and export generation
- `src/presentation`: browser interface, steps, routing, and embedded-tool bridges
- `design-previews`: embedded visualization and specialist workshop surfaces
- `scripts`: local file-backed server
- `tests`: domain, integration, export, routing, launcher, and bridge checks

## Technical Stack

VSM7 is implemented as a browser-first application with a deliberately small runtime footprint:

- **HTML5 and CSS3** provide the application shell, responsive workshop layouts, interface skins, tile-level fullscreen views, and print/export presentation rules.
- **Modern JavaScript with native ES modules** implements the domain model, application services, routing, rendering, persistence adapters, embedded-tool bridges, and export orchestration. The current interface is framework-free and uses browser-native DOM and event APIs.
- **Python 3 standard library** powers the optional local file service. It uses the built-in HTTP server and filesystem APIs, so normal workshop use does not require a Python package installation, database, or cloud service.
- **Vite 5** is used for local development and production bundling. It is a development dependency only; the application itself remains deployable as static browser assets.
- **Node.js's built-in test runner** executes the automated domain, integration, routing, persistence, bridge, launcher, and export tests without introducing a separate test framework.
- **PptxGenJS 4** is vendored locally for genuine PowerPoint generation. Word and Excel exports use lightweight OOXML writers, while PDF, SVG, PNG, and JSON generation is selected only where the underlying artifact supports the format.

The code follows a clean/onion architecture. Method rules and canonical VSM data live in the domain layer; application services coordinate use cases and build view models; infrastructure adapters handle persistence and document generation; presentation modules render the workshop experience. This keeps the same structured workspace record reusable across normal views, fullscreen tiles, the Steering Master, exports, and embedded specialist tools.

Embedded visual editors communicate with the host through versioned `postMessage` bridge contracts. Stable entity IDs are used across steps so that SCTs, contributions, roles, meetings, communication routes, and organizational placements are referenced and enriched instead of copied into disconnected records.

The runtime relies on standard browser capabilities including `localStorage`, `fetch`, `Blob` downloads, the Fullscreen API, hash-based routing, and iframe messaging. The local file-backed repository and browser-local repository implement the same application boundary, allowing the app to degrade gracefully when the Python service is unavailable.

## Development

Install the development dependencies and run the test suite:

```sh
npm install
npm test
```

The normal application remains browser-based; the Node.js toolchain is used only for development, testing, and optional local preview tooling.

## Project Status

VSM7 is under active development. The core workshop flow, local workspace persistence, Steering Master, implementation backlog, and context-aware export system are working. Continue to validate important projects through regular workspace backups and exported snapshots.
