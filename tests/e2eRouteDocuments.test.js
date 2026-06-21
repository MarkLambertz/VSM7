import test from "node:test";
import assert from "node:assert/strict";
import {
  buildE2ERouteDocument,
  buildE2ERoutePdfBytes,
  buildE2ERoutePptxBytes,
  readPngDimensions
} from "../src/infrastructure/e2eRouteDocuments.js";

const tinyPng = Uint8Array.from(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZJ0sAAAAASUVORK5CYII=",
  "base64"
));

const context = {
  organizationName: "Example Organization",
  projectName: "Transformation 2026",
  sctNumber: "SCT-007",
  sctTitle: "Keep promises end to end",
  routeName: "Order-to-delivery robustness route",
  findings: [{
    category: "bottleneck",
    severity: "high",
    affectedElement: "Validate customer promise",
    note: "Approval queue exceeds the agreed response time."
  }]
};

test("PNG route dimensions are read from the IHDR chunk", () => {
  assert.deepEqual(readPngDimensions(tinyPng), { width: 1, height: 1 });
  assert.throws(() => readPngDimensions(new Uint8Array([1, 2, 3])), /valid PNG/);
});

test("PDF export builds a real image-backed document with findings", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const bytes = buildE2ERoutePdfBytes(jpeg, 1200, 700, context);
  const text = Buffer.from(bytes).toString("latin1");

  assert.match(text, /^%PDF-1\.4/);
  assert.match(text, /\/Filter \/DCTDecode/);
  assert.match(text, /Order-to-delivery robustness route/);
  assert.match(text, /E2E Robustness Findings/);
  assert.match(text, /Bottleneck \/ High/);
  assert.match(text, /xref\n0 /);
  assert.match(text, /%%EOF\n$/);
});

test("PowerPoint export contains the route image and a findings slide", () => {
  const bytes = buildE2ERoutePptxBytes(tinyPng, 1, 1, context);
  const entries = readStoredZip(bytes);

  assert.ok(entries.has("[Content_Types].xml"));
  assert.ok(entries.has("ppt/presentation.xml"));
  assert.ok(entries.has("ppt/slides/slide1.xml"));
  assert.ok(entries.has("ppt/slides/slide2.xml"));
  assert.deepEqual(entries.get("ppt/media/route.png"), tinyPng);
  assert.match(decode(entries.get("ppt/slides/slide1.xml")), /Order-to-delivery robustness route/);
  assert.match(decode(entries.get("ppt/slides/slide2.xml")), /Bottleneck \/ High/);
  assert.match(decode(entries.get("ppt/slides/slide2.xml")), /Approval queue exceeds/);
});

test("PowerPoint export omits the findings slide when the route has none", () => {
  const bytes = buildE2ERoutePptxBytes(tinyPng, 1, 1, { ...context, findings: [] });
  const entries = readStoredZip(bytes);

  assert.equal(entries.has("ppt/slides/slide2.xml"), false);
  assert.match(decode(entries.get("ppt/presentation.xml")), /<p:sldIdLst><p:sldId /);
});

test("browser document orchestration returns correct MIME types and filenames", async () => {
  const pngBlob = new Blob([tinyPng], { type: "image/png" });
  const pptx = await buildE2ERouteDocument("pptx", pngBlob, context);
  assert.equal(pptx.mimeType, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  assert.equal(pptx.filename, "sct-007-keep-promises-end-to-end-e2e-route.pptx");

  const pdf = await buildE2ERouteDocument("pdf", pngBlob, context, {
    convertPngToJpeg: async () => ({
      bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
      width: 1,
      height: 1
    })
  });
  assert.equal(pdf.mimeType, "application/pdf");
  assert.equal(pdf.filename, "sct-007-keep-promises-end-to-end-e2e-route.pdf");
  assert.match(Buffer.from(await pdf.blob.arrayBuffer()).toString("latin1"), /^%PDF-1\.4/);

  await assert.rejects(buildE2ERouteDocument("docx", pngBlob, context), /Unsupported route document format/);
});

function readStoredZip(bytes) {
  const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const entries = new Map();
  const decoder = new TextDecoder();
  let offset = 0;

  while (offset + 4 <= source.length) {
    const view = new DataView(source.buffer, source.byteOffset + offset, source.byteLength - offset);
    if (view.getUint32(0, true) !== 0x04034b50) {
      break;
    }
    const compressedSize = view.getUint32(18, true);
    const nameLength = view.getUint16(26, true);
    const extraLength = view.getUint16(28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(source.slice(nameStart, nameStart + nameLength));
    entries.set(name, source.slice(dataStart, dataStart + compressedSize));
    offset = dataStart + compressedSize;
  }

  return entries;
}

function decode(bytes) {
  return new TextDecoder().decode(bytes);
}
