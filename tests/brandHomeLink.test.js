import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("VSM7 brand logo and name link to the start page", () => {
  const app = readFileSync(new URL("../src/presentation/app.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/presentation/styles.css", import.meta.url), "utf8");

  assert.match(app, /<a class="brand-block" href="#\/start"/);
  assert.match(app, /aria-label="Go to the VSM7 start page"/);
  assert.match(app, /<strong class="brand-name">VSM7<\/strong>\s*<\/a>/);
  assert.match(styles, /\.brand-block:focus-visible/);
});
