# VSM7 On Debian/Linux

Use `start.sh` to run VSM7 with local file-backed workspace storage.

## Start

From the VSM7 folder:

```sh
chmod +x ./start.sh
./start.sh
```

The script starts VSM7 at:

```text
http://localhost:4173/
```

If `xdg-open` is available, your browser opens automatically. Otherwise the script prints the URL.

## Workspace Files

By default, projects are saved under:

```text
VSM7-Workspaces/
```

To use another folder, start VSM7 like this:

```sh
VSM7_WORKSPACE_DIR="$HOME/Documents/VSM7-Workspaces" ./start.sh
```

`workspace.vsm7.json` is the source of truth for each project. The Markdown files are generated readable views.

## Stop

Keep the terminal window open while using VSM7.

To stop the local server, press `Ctrl+C` in that terminal.

## Port 4173

VSM7 uses `localhost:4173`. If that port is already used, the script shows the current listener and stops without closing anything automatically.
