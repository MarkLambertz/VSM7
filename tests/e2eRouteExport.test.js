import test from "node:test";
import assert from "node:assert/strict";
import { createE2ERouteExportCoordinator } from "../src/presentation/shared/e2eRouteExport.js";

function createHarness(ids = ["request-1"]) {
  const sent = [];
  const queue = [...ids];
  const coordinator = createE2ERouteExportCoordinator({
    createRequestId: () => queue.shift(),
    send: (frame, message) => sent.push({ frame, message })
  });
  return { coordinator, sent };
}

test("E2E route export sends the exact host command", () => {
  const frame = {};
  const { coordinator, sent } = createHarness();
  void coordinator.request(frame, "svg", "route.svg");

  assert.deepEqual(sent, [{
    frame,
    message: { cmd: "export", format: "svg", requestId: "request-1", filename: "route.svg" }
  }]);
});

test("E2E route export resolves only for the matching frame and request", async () => {
  const frame = {};
  const otherFrame = {};
  const { coordinator } = createHarness();
  const resultPromise = coordinator.request(frame, "png");
  const message = {
    evt: "exportReady",
    requestId: "request-1",
    format: "png",
    filename: "route.png",
    mimeType: "image/png",
    blob: new Blob(["png"], { type: "image/png" })
  };

  assert.equal(coordinator.handle(otherFrame, message), false);
  assert.equal(coordinator.pendingCount(frame), 1);
  assert.equal(coordinator.handle(frame, message), true);
  assert.equal((await resultPromise).filename, "route.png");
  assert.equal(coordinator.pendingCount(), 0);
});

test("E2E route export rejects frame errors", async () => {
  const frame = {};
  const { coordinator } = createHarness();
  const resultPromise = coordinator.request(frame, "svg");

  coordinator.handle(frame, {
    evt: "exportError",
    requestId: "request-1",
    format: "svg",
    message: "Canvas unavailable"
  });

  await assert.rejects(resultPromise, /Canvas unavailable/);
});

test("concurrent E2E exports resolve by request id instead of response order", async () => {
  const frame = {};
  const { coordinator } = createHarness(["request-svg", "request-png"]);
  const svgPromise = coordinator.request(frame, "svg");
  const pngPromise = coordinator.request(frame, "png");

  coordinator.handle(frame, {
    evt: "exportReady",
    requestId: "request-png",
    format: "png",
    filename: "second.png",
    mimeType: "image/png",
    blob: new Blob(["png"], { type: "image/png" })
  });
  coordinator.handle(frame, {
    evt: "exportReady",
    requestId: "request-svg",
    format: "svg",
    filename: "first.svg",
    mimeType: "image/svg+xml",
    blob: new Blob(["svg"], { type: "image/svg+xml" })
  });

  assert.equal((await svgPromise).filename, "first.svg");
  assert.equal((await pngPromise).filename, "second.png");
});

test("E2E route export rejects unsupported formats and invalid files", async () => {
  const frame = {};
  const { coordinator } = createHarness(["request-1"]);
  await assert.rejects(coordinator.request(frame, "pdf"), /Unsupported route export format/);

  const resultPromise = coordinator.request(frame, "svg");
  coordinator.handle(frame, {
    evt: "exportReady",
    requestId: "request-1",
    format: "svg",
    filename: "route.svg",
    mimeType: "image/svg+xml",
    blob: "not-a-blob"
  });
  await assert.rejects(resultPromise, /invalid export file/);
});
