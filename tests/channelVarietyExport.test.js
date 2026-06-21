import test from "node:test";
import assert from "node:assert/strict";
import { createChannelVarietyExportCoordinator } from "../src/presentation/shared/channelVarietyExport.js";

function exportBlob(type = "image/png") {
  return { type, async arrayBuffer() { return new ArrayBuffer(0); } };
}

test("communication variety export sends the exact bridge command and resolves the matching response", async () => {
  const sent = [];
  const frame = { id: "frame-a" };
  const coordinator = createChannelVarietyExportCoordinator({
    createRequestId: () => "request-1",
    send(target, message) { sent.push({ target, message }); }
  });
  const pending = coordinator.request(frame, "png", "variety-check.png");

  assert.deepEqual(sent, [{
    target: frame,
    message: { cmd: "export", format: "png", requestId: "request-1", filename: "variety-check.png" }
  }]);
  assert.equal(coordinator.handle({ id: "other-frame" }, {
    evt: "exportReady",
    requestId: "request-1",
    blob: exportBlob()
  }), false);

  const response = {
    evt: "exportReady",
    requestId: "request-1",
    format: "png",
    filename: "variety-check.png",
    mimeType: "image/png",
    blob: exportBlob()
  };
  assert.equal(coordinator.handle(frame, response), true);
  assert.equal(await pending, response);
});

test("communication variety export rejects frame errors, invalid files, and unsupported formats", async () => {
  const frame = {};
  let request = 0;
  const coordinator = createChannelVarietyExportCoordinator({
    createRequestId: () => `request-${++request}`,
    send() {}
  });

  await assert.rejects(coordinator.request(frame, "pdf"), /Unsupported/);

  const failed = coordinator.request(frame, "svg");
  coordinator.handle(frame, { evt: "exportError", requestId: "request-1", message: "Renderer unavailable" });
  await assert.rejects(failed, /Renderer unavailable/);

  const invalid = coordinator.request(frame, "png");
  coordinator.handle(frame, { evt: "exportReady", requestId: "request-2", blob: "not-a-blob" });
  await assert.rejects(invalid, /invalid export file/);
});

