#!/usr/bin/env python3
"""Serve VSM7 locally with optional file-backed workspace persistence.

The server intentionally stays small and conservative:
- no external Python packages,
- no database server,
- same-origin JSON API under /api/storage,
- static file serving for the existing browser application.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import tempfile
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse, urlunparse


INDEX_VERSION = 1
SNAPSHOT_INTERVAL_SECONDS = 300
MAX_REQUEST_BYTES = 50 * 1024 * 1024
STATIC_FILE_ALIASES = {
    "/vsm": "/vsm.html",
    "/vsm/": "/vsm.html",
}


def resolve_static_alias(path: str) -> str:
    parsed = urlparse(path)
    alias = STATIC_FILE_ALIASES.get(parsed.path)
    if not alias:
        return path
    return urlunparse(parsed._replace(path=alias))


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def safe_segment(value: str, fallback: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._ -]+", "-", value or "").strip(" .-_")
    cleaned = re.sub(r"[- ]{2,}", "-", cleaned)
    return (cleaned or fallback)[:80]


def short_id(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]+", "", value or "")
    return cleaned[:8] or "project"


def read_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default
    except json.JSONDecodeError:
        return default


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=str(path.parent), delete=False) as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temp_name = handle.name
    os.replace(temp_name, path)


def write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=str(path.parent), delete=False) as handle:
        handle.write(value)
        temp_name = handle.name
    os.replace(temp_name, path)


def as_text(value, fallback: str = "") -> str:
    return str(value if value is not None else fallback)


def md_escape(value) -> str:
    return as_text(value).replace("|", "\\|").replace("\n", " ").strip()


def bullet(items) -> str:
    rows = [f"- {md_escape(item)}" for item in items if md_escape(item)]
    return "\n".join(rows) if rows else "- Not captured yet."


def table(headers, rows) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(md_escape(cell) for cell in row) + " |")
    return "\n".join(lines) if rows else "_No entries yet._"


class WorkspaceStore:
    def __init__(self, root: Path):
        self.root = root
        self.index_path = root / "index.json"
        self.root.mkdir(parents=True, exist_ok=True)
        self.write_workspace_readme()

    def write_workspace_readme(self) -> None:
        readme = (
            "# VSM7 Workspaces\n\n"
            "This folder is managed by the local VSM7 file server.\n\n"
            "- `workspace.vsm7.json` is the canonical project data.\n"
            "- `project.md` and `steps/*.md` are generated readable views.\n"
            "- `snapshots/*.vsm7.json` are rolling backups.\n"
            "- `exports/` and `attachments/` are reserved project folders.\n\n"
            "Edit project data in VSM7, not directly in the generated Markdown files.\n"
        )
        readme_path = self.root / "README.md"
        if not readme_path.exists():
            write_text(readme_path, readme)

    def read_index(self):
        index = read_json(self.index_path, {"schemaVersion": INDEX_VERSION, "activeProjectId": "", "projects": []})
        if not isinstance(index, dict):
            index = {}
        projects = index.get("projects") if isinstance(index.get("projects"), list) else []
        return {
            "schemaVersion": INDEX_VERSION,
            "activeProjectId": as_text(index.get("activeProjectId")),
            "projects": [project for project in projects if isinstance(project, dict) and project.get("id")],
        }

    def write_index(self, index) -> None:
        index["schemaVersion"] = INDEX_VERSION
        index["projects"] = sorted(
            index.get("projects", []),
            key=lambda project: as_text(project.get("updatedAt")),
            reverse=True,
        )
        write_json(self.index_path, index)

    def list_projects(self):
        return [
            {key: value for key, value in project.items() if key != "path"}
            for project in self.read_index()["projects"]
        ]

    def load_active(self):
        index = self.read_index()
        active_id = index.get("activeProjectId") or (index["projects"][0]["id"] if index["projects"] else "")
        return self.load_project(active_id) if active_id else None

    def load_project(self, project_id: str):
        entry = self.project_entry(project_id)
        if not entry:
            return None
        return read_json(self.root / entry["path"] / "workspace.vsm7.json", None)

    def save_workspace(self, workspace, activate: bool = True):
        if not isinstance(workspace, dict):
            raise ValueError("workspace must be a JSON object")
        project = workspace.get("project") if isinstance(workspace.get("project"), dict) else {}
        organization = workspace.get("organization") if isinstance(workspace.get("organization"), dict) else {}
        project_id = as_text(project.get("id"))
        if not project_id:
            raise ValueError("workspace.project.id is required")

        index = self.read_index()
        entry = self.project_entry(project_id, index)
        if not entry:
            entry = {
                "id": project_id,
                "path": self.unique_project_path(workspace, index),
                "createdAt": as_text(project.get("createdAt")) or utc_now_iso(),
            }
            index["projects"].append(entry)

        metadata = self.metadata_for(workspace, entry)
        entry.update(metadata)
        project_dir = self.root / entry["path"]
        project_dir.mkdir(parents=True, exist_ok=True)
        for child in ["snapshots", "exports", "attachments", "steps"]:
            (project_dir / child).mkdir(parents=True, exist_ok=True)

        canonical_path = project_dir / "workspace.vsm7.json"
        previous = read_json(canonical_path, None)
        write_json(canonical_path, workspace)
        self.write_snapshot(project_dir, workspace, previous)
        self.write_markdown_files(project_dir, workspace)
        if activate:
            index["activeProjectId"] = project_id
        self.write_index(index)
        return metadata

    def rename_project(self, project_id: str, name: str):
        workspace = self.load_project(project_id)
        if not workspace:
            return False
        workspace.setdefault("project", {})["name"] = as_text(name)
        workspace["project"]["updatedAt"] = utc_now_iso()
        self.save_workspace(workspace, activate=self.read_index().get("activeProjectId") == project_id)
        return True

    def rename_organization(self, organization_id: str, name: str):
        changed = False
        for project in list(self.read_index()["projects"]):
            if self.project_belongs_to_organization(project, organization_id):
                workspace = self.load_project(project["id"])
                if not workspace:
                    continue
                workspace.setdefault("organization", {})["id"] = workspace["organization"].get("id") or organization_id
                workspace["organization"]["name"] = as_text(name)
                workspace.setdefault("project", {})["updatedAt"] = utc_now_iso()
                self.save_workspace(workspace, activate=self.read_index().get("activeProjectId") == project["id"])
                changed = True
        return changed

    def delete_project(self, project_id: str):
        index = self.read_index()
        next_projects = []
        removed = []
        for project in index["projects"]:
            if project["id"] == project_id:
                removed.append(project)
            else:
                next_projects.append(project)
        for project in removed:
            shutil.rmtree(self.root / project["path"], ignore_errors=True)
        index["projects"] = next_projects
        if index.get("activeProjectId") == project_id:
            index["activeProjectId"] = next_projects[0]["id"] if next_projects else ""
        self.write_index(index)
        self.prune_empty_directories()
        return bool(removed)

    def delete_organization(self, organization_id: str):
        project_ids = [
            project["id"]
            for project in self.read_index()["projects"]
            if self.project_belongs_to_organization(project, organization_id)
        ]
        for project_id in project_ids:
            self.delete_project(project_id)
        return bool(project_ids)

    def project_entry(self, project_id: str, index=None):
        index = index or self.read_index()
        for project in index["projects"]:
            if project.get("id") == project_id:
                return project
        return None

    def metadata_for(self, workspace, entry):
        project = workspace.get("project") if isinstance(workspace.get("project"), dict) else {}
        organization = workspace.get("organization") if isinstance(workspace.get("organization"), dict) else {}
        sif = workspace.get("sif") if isinstance(workspace.get("sif"), dict) else {}
        return {
            "id": as_text(project.get("id")),
            "name": as_text(project.get("name"), "Untitled project") or "Untitled project",
            "organizationId": as_text(organization.get("id")),
            "organizationName": as_text(organization.get("name")),
            "sifName": as_text(sif.get("name")),
            "status": as_text(project.get("status")),
            "createdAt": as_text(entry.get("createdAt") or project.get("createdAt") or utc_now_iso()),
            "updatedAt": as_text(project.get("updatedAt") or utc_now_iso()),
            "path": entry["path"],
        }

    def unique_project_path(self, workspace, index):
        project = workspace.get("project") if isinstance(workspace.get("project"), dict) else {}
        organization = workspace.get("organization") if isinstance(workspace.get("organization"), dict) else {}
        org_segment = safe_segment(as_text(organization.get("name")), "Organization")
        project_segment = safe_segment(as_text(project.get("name")), "Project")
        base = Path(org_segment) / f"{project_segment}--{short_id(as_text(project.get('id')))}"
        used = {as_text(project.get("path")) for project in index.get("projects", [])}
        candidate = base
        suffix = 2
        while candidate.as_posix() in used or (self.root / candidate).exists():
            candidate = Path(org_segment) / f"{project_segment}-{suffix}--{short_id(as_text(project.get('id')))}"
            suffix += 1
        return candidate.as_posix()

    def write_snapshot(self, project_dir: Path, workspace, previous) -> None:
        if previous == workspace:
            return
        snapshots_dir = project_dir / "snapshots"
        snapshots = sorted(snapshots_dir.glob("*.vsm7.json"), key=lambda path: path.stat().st_mtime, reverse=True)
        if snapshots and time.time() - snapshots[0].stat().st_mtime < SNAPSHOT_INTERVAL_SECONDS:
            return
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        write_json(snapshots_dir / f"{stamp}.vsm7.json", workspace)

    def write_markdown_files(self, project_dir: Path, workspace) -> None:
        write_text(project_dir / "project.md", project_markdown(workspace))
        step_dir = project_dir / "steps"
        for filename, content in step_markdowns(workspace).items():
            write_text(step_dir / filename, content)

    def project_belongs_to_organization(self, project, organization_id: str) -> bool:
        return bool(organization_id) and (
            project.get("organizationId") == organization_id
            or (not project.get("organizationId") and project.get("organizationName") == organization_id)
            or project.get("organizationName") == organization_id
        )

    def prune_empty_directories(self) -> None:
        for path in sorted(self.root.glob("*"), key=lambda item: len(item.parts), reverse=True):
            if path.is_dir():
                try:
                    path.rmdir()
                except OSError:
                    pass


def project_markdown(workspace) -> str:
    project = workspace.get("project", {})
    organization = workspace.get("organization", {})
    sif = workspace.get("sif", {})
    step3 = workspace.get("step3", {})
    step7 = workspace.get("step7", {})
    implementation = workspace.get("implementation", {})
    tasks = step3.get("successCriticalTasks") if isinstance(step3.get("successCriticalTasks"), list) else []
    vessels = step7.get("vessels") if isinstance(step7.get("vessels"), list) else []
    items = implementation.get("items") if isinstance(implementation.get("items"), list) else []
    generated = utc_now_iso()

    return (
        f"# {md_escape(project.get('name') or 'VSM7 Project')}\n\n"
        f"- Organization: {md_escape(organization.get('name'))}\n"
        f"- System-in-Focus: {md_escape(sif.get('name') or 'Not named')}\n"
        f"- Status: {md_escape(project.get('status'))}\n"
        f"- Last saved: {md_escape(project.get('updatedAt'))}\n"
        f"- Markdown generated: {generated}\n\n"
        "## Purpose\n\n"
        f"{md_escape(sif.get('purpose')) or 'Not captured yet.'}\n\n"
        "## Current Backbone\n\n"
        f"- Success-Critical Tasks: {len(tasks)}\n"
        f"- Step VII vessels: {len(vessels)}\n"
        f"- Implementation backlog items: {len(items)}\n\n"
        "## Success-Critical Tasks\n\n"
        f"{table(['ID', 'Priority', 'VSM system', 'Title'], [[format_sct(task), task.get('priority', ''), task.get('system', ''), task.get('title', '')] for task in tasks])}\n\n"
        "## Step VII Vessels\n\n"
        f"{table(['Type', 'Name', 'State', 'Scope'], [[vessel.get('type', ''), vessel.get('name', ''), vessel.get('state', ''), vessel.get('scope', '')] for vessel in vessels])}\n\n"
        "## Implementation Backlog\n\n"
        f"{table(['Challenge', 'Responsible', 'Status', 'Due'], [[item.get('challenge', ''), item.get('responsible', ''), item.get('status', ''), item.get('dueDate', '')] for item in items])}\n"
    )


def step_markdowns(workspace) -> dict[str, str]:
    return {
        "step-1-operative-units.md": step1_markdown(workspace),
        "step-2-manageability.md": step2_markdown(workspace),
        "step-3-scts.md": step3_markdown(workspace),
        "step-4-central-decentral.md": step4_markdown(workspace),
        "step-5-design-steering-system.md": step5_markdown(workspace),
        "step-6-channels.md": step6_markdown(workspace),
        "step-7-representation.md": step7_markdown(workspace),
        "implementation.md": implementation_markdown(workspace),
    }


def step1_markdown(workspace) -> str:
    step1 = workspace.get("step1", {})
    levels = step1.get("recursionLevels") if isinstance(step1.get("recursionLevels"), list) else []
    options = step1.get("segmentationOptions") if isinstance(step1.get("segmentationOptions"), list) else []
    return (
        "# Step I · Operative Units\n\n"
        "## Recursion Levels\n\n"
        f"{table(['Level', 'Name', 'Description'], [[level.get('level', ''), level.get('name', ''), level.get('description', '')] for level in levels])}\n\n"
        "## Segmentation Options\n\n"
        f"{table(['Name', 'Rationale'], [[option.get('name', ''), option.get('description', '')] for option in options])}\n\n"
        f"Selected option id: `{md_escape(step1.get('selectedSegmentationOptionId'))}`\n"
    )


def step2_markdown(workspace) -> str:
    step2 = workspace.get("step2", {})
    horizontal = step2.get("horizontalAssessment", {})
    vertical = step2.get("verticalAssessment", {})
    return (
        "# Step II · Manageability\n\n"
        "## Horizontal Variety\n\n"
        f"{table(['Driver', 'Value'], [[key, value] for key, value in horizontal.items()])}\n\n"
        "## Vertical Variety\n\n"
        f"{table(['Driver', 'Value'], [[key, value] for key, value in vertical.items()])}\n"
    )


def step3_markdown(workspace) -> str:
    tasks = workspace.get("step3", {}).get("successCriticalTasks", [])
    return (
        "# Step III · SCTs\n\n"
        f"{table(['ID', 'Priority', 'Source', 'Title', 'Explanation'], [[format_sct(task), task.get('priority', ''), task.get('source', ''), task.get('title', ''), task.get('explanation', '')] for task in tasks if isinstance(task, dict)])}\n"
    )


def step4_markdown(workspace) -> str:
    allocations = workspace.get("step4", {}).get("allocations", {})
    rows = []
    if isinstance(allocations, dict):
        for task_id, allocation in allocations.items():
            if not isinstance(allocation, dict):
                continue
            contributions = allocation.get("contributions") if isinstance(allocation.get("contributions"), dict) else {}
            for organization_id, contribution in contributions.items():
                if md_escape(contribution):
                    rows.append([task_id, organization_id, contribution, allocation.get("accountableOrganizationId", "")])
    return "# Step IV · Central/Decentral\n\n" + table(["SCT id", "Organization id", "Contribution", "Accountable organization id"], rows) + "\n"


def step5_markdown(workspace) -> str:
    assignments = workspace.get("step5", {}).get("assignments", {})
    rows = []
    if isinstance(assignments, dict):
        for system, keys in assignments.items():
            for key in keys if isinstance(keys, list) else []:
                rows.append([system, key])
    return "# Step V · Design Steering System\n\n" + table(["VSM system", "Contribution key"], rows) + "\n"


def step6_markdown(workspace) -> str:
    step6 = workspace.get("step6", {})
    channels = step6.get("channelVariety", {})
    routes = step6.get("e2eRoutes", {})
    loops = channels.get("loops") if isinstance(channels, dict) and isinstance(channels.get("loops"), list) else []
    return (
        "# Step VI · Channels\n\n"
        f"- Communication loops: {len(loops)}\n"
        f"- E2E routes: {len(routes) if isinstance(routes, dict) else 0}\n\n"
        f"{table(['Loop', 'System'], [[loop.get('label', loop.get('id', '')), loop.get('sys', '')] for loop in loops if isinstance(loop, dict)])}\n"
    )


def step7_markdown(workspace) -> str:
    step7 = workspace.get("step7", {})
    vessels = step7.get("vessels") if isinstance(step7.get("vessels"), list) else []
    rasic = step7.get("rasic") if isinstance(step7.get("rasic"), dict) else {}
    return (
        "# Step VII · Representation\n\n"
        "## Vessels\n\n"
        f"{table(['Type', 'Name', 'Purpose', 'State'], [[vessel.get('type', ''), vessel.get('name', ''), vessel.get('purpose', ''), vessel.get('state', '')] for vessel in vessels])}\n\n"
        "## RASIC Assignments\n\n"
        f"{table(['Contribution | Vessel', 'Letter'], [[key, value] for key, value in rasic.items()])}\n"
    )


def implementation_markdown(workspace) -> str:
    items = workspace.get("implementation", {}).get("items", [])
    return "# Implementation\n\n" + table(
        ["Challenge", "Requirement", "Responsible", "Due", "Status"],
        [[item.get("challenge", ""), item.get("requirement", ""), item.get("responsible", ""), item.get("dueDate", ""), item.get("status", "")] for item in items if isinstance(item, dict)],
    ) + "\n"


def format_sct(task) -> str:
    try:
        return f"SCT-{int(task.get('number', 0)):03d}"
    except (TypeError, ValueError):
        return "SCT"


class VSM7RequestHandler(SimpleHTTPRequestHandler):
    server_version = "VSM7FileServer/1.0"

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    @property
    def store(self) -> WorkspaceStore:
        return self.server.store

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/storage"):
            self.handle_api_get(parsed)
            return
        super().do_GET()

    def translate_path(self, path):
        return super().translate_path(resolve_static_alias(path))

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/storage"):
            self.handle_api_post(parsed)
            return
        self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def handle_api_get(self, parsed):
        query = parse_qs(parsed.query)
        if parsed.path == "/api/storage/health":
            self.send_json({
                "ok": True,
                "mode": "file",
                "workspaceRoot": str(self.store.root),
                "schemaVersion": INDEX_VERSION,
            })
            return
        if parsed.path == "/api/storage/projects":
            self.send_json({"projects": self.store.list_projects()})
            return
        if parsed.path == "/api/storage/workspace":
            self.send_json({"workspace": self.store.load_active()})
            return
        if parsed.path == "/api/storage/project":
            project_id = query.get("id", [""])[0]
            self.send_json({"workspace": self.store.load_project(project_id)})
            return
        self.send_json({"error": "Unknown storage endpoint"}, HTTPStatus.NOT_FOUND)

    def handle_api_post(self, parsed):
        try:
            payload = self.read_json_body()
            if parsed.path == "/api/storage/workspace":
                metadata = self.store.save_workspace(payload.get("workspace", payload), activate=payload.get("activate", True))
                self.send_json({"ok": True, "project": metadata})
                return
            if parsed.path == "/api/storage/rename-project":
                self.send_json({"ok": self.store.rename_project(as_text(payload.get("projectId")), as_text(payload.get("name")))})
                return
            if parsed.path == "/api/storage/rename-organization":
                self.send_json({"ok": self.store.rename_organization(as_text(payload.get("organizationId")), as_text(payload.get("name")))})
                return
            if parsed.path == "/api/storage/delete-project":
                self.send_json({"ok": self.store.delete_project(as_text(payload.get("projectId")))})
                return
            if parsed.path == "/api/storage/delete-organization":
                self.send_json({"ok": self.store.delete_organization(as_text(payload.get("organizationId")))})
                return
            self.send_json({"error": "Unknown storage endpoint"}, HTTPStatus.NOT_FOUND)
        except Exception as error:  # noqa: BLE001 - API boundary should return a readable message.
            self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length > MAX_REQUEST_BYTES:
            raise ValueError("Request too large")
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8") or "{}")

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class VSM7Server(ThreadingHTTPServer):
    def __init__(self, address, handler, store: WorkspaceStore):
        super().__init__(address, handler)
        self.store = store


def handler_for(directory: Path):
    class Handler(VSM7RequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(directory), **kwargs)

    return Handler


def main():
    parser = argparse.ArgumentParser(description="Serve VSM7 with local file-backed storage.")
    parser.add_argument("--host", default=os.environ.get("VSM7_HOST", "localhost"))
    parser.add_argument("--port", default=int(os.environ.get("VSM7_PORT", "4173")), type=int)
    parser.add_argument("--root", default=Path.cwd(), type=Path, help="Static VSM7 application root.")
    parser.add_argument(
        "--workspace-dir",
        default=os.environ.get("VSM7_WORKSPACE_DIR"),
        type=Path,
        help="Folder for VSM7 workspace files. Defaults to ./VSM7-Workspaces.",
    )
    args = parser.parse_args()
    static_root = args.root.resolve()
    workspace_root = (args.workspace_dir or (static_root / "VSM7-Workspaces")).expanduser().resolve()
    store = WorkspaceStore(workspace_root)
    server = VSM7Server((args.host, args.port), handler_for(static_root), store)
    print(f"Serving VSM7 on http://{args.host}:{args.port}/")
    print(f"File-backed workspaces: {workspace_root}")
    server.serve_forever()


if __name__ == "__main__":
    main()
