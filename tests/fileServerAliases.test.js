import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("local file server maps the embedded VSM route to vsm.html", () => {
  const script = [
    "import importlib.util",
    "spec = importlib.util.spec_from_file_location('vsm7_file_server', 'scripts/vsm7_file_server.py')",
    "module = importlib.util.module_from_spec(spec)",
    "spec.loader.exec_module(module)",
    "print(module.resolve_static_alias('/vsm?pane=hidden&chrome=min'))",
    "print(module.resolve_static_alias('/vsm/?pane=hidden&chrome=min'))",
    "print(module.resolve_static_alias('/vsm.html?pane=hidden&chrome=min'))",
  ].join("; ");

  const result = spawnSync("python3", ["-c", script], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split("\n"), [
    "/vsm.html?pane=hidden&chrome=min",
    "/vsm.html?pane=hidden&chrome=min",
    "/vsm.html?pane=hidden&chrome=min",
  ]);
});
