import test from "node:test";
import assert from "node:assert/strict";
import { renderRenameDialog } from "../src/presentation/renameDialog.js";

test("rename dialog renders a project name and reliable actions", () => {
  const html = renderRenameDialog({
    type: "project",
    id: "project-1",
    currentName: "Current project",
    draftName: "Current project"
  });

  assert.match(html, /Rename project/);
  assert.match(html, /data-rename-draft/);
  assert.match(html, /value="Current project"/);
  assert.match(html, /data-action="confirm-rename"/);
  assert.match(html, /data-action="cancel-rename"/);
});

test("rename dialog safely escapes organization names", () => {
  const html = renderRenameDialog({
    type: "organization",
    id: "organization-1",
    currentName: "A & B",
    draftName: "\"A & B\""
  });

  assert.match(html, /Rename organization/);
  assert.match(html, /value="&quot;A &amp; B&quot;"/);
  assert.equal(renderRenameDialog(null), "");
});
