import PptxGenJS from "../vendor/pptxgen.bundle.js?v=20260725-step3-aspects-org-units";

const pdfMimeType = "application/pdf";
const pptxMimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const encoder = new TextEncoder();

export async function buildE2ERouteDocument(format, imageBlob, context = {}, options = {}) {
  const normalizedFormat = format === "ppt" ? "pptx" : format;
  if (!imageBlob || typeof imageBlob.arrayBuffer !== "function") {
    throw new TypeError("A PNG route illustration is required.");
  }

  if (normalizedFormat === "pdf") {
    const convert = options.convertPngToJpeg || convertPngBlobToJpeg;
    const jpeg = await convert(imageBlob);
    const bytes = buildE2ERoutePdfBytes(jpeg.bytes, jpeg.width, jpeg.height, context);
    return {
      blob: new Blob([bytes], { type: pdfMimeType }),
      filename: buildFilename(context, "pdf"),
      mimeType: pdfMimeType,
      format: "pdf"
    };
  }

  if (normalizedFormat === "pptx") {
    const pngBytes = new Uint8Array(await imageBlob.arrayBuffer());
    const { width, height } = readPngDimensions(pngBytes);
    const bytes = await buildE2ERoutePptxBytes(pngBytes, width, height, context);
    return {
      blob: new Blob([bytes], { type: pptxMimeType }),
      filename: buildFilename(context, "pptx"),
      mimeType: pptxMimeType,
      format: "pptx"
    };
  }

  throw new Error(`Unsupported route document format: ${format}`);
}

export function buildE2ERoutePdfBytes(jpegBytes, imageWidth, imageHeight, context = {}) {
  const image = toUint8Array(jpegBytes);
  assertPositiveDimensions(imageWidth, imageHeight);
  const data = normalizeContext(context);
  const findingsPages = chunk(data.findings, 6);
  const pageCount = 1 + findingsPages.length;
  const pageIds = Array.from({ length: pageCount }, (_, index) => 6 + (index * 2));
  const objects = new Map();

  objects.set(1, ascii("<< /Type /Catalog /Pages 2 0 R >>"));
  objects.set(2, ascii(`<< /Type /Pages /Count ${pageCount} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`));
  objects.set(3, ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"));
  objects.set(4, joinBytes(
    ascii(`<< /Type /XObject /Subtype /Image /Width ${Math.round(imageWidth)} /Height ${Math.round(imageHeight)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),
    image,
    ascii("\nendstream")
  ));

  const routeContent = ascii(buildPdfRoutePage(data, imageWidth, imageHeight));
  objects.set(5, pdfStream(routeContent));
  objects.set(6, ascii("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> /XObject << /Route 4 0 R >> >> /Contents 5 0 R >>"));

  findingsPages.forEach((findings, index) => {
    const contentId = 7 + (index * 2);
    const pageId = 8 + (index * 2);
    const content = ascii(buildPdfFindingsPage(data, findings, index + 1, findingsPages.length));
    objects.set(contentId, pdfStream(content));
    objects.set(pageId, ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`));
  });

  return buildPdf(objects);
}

export async function buildE2ERoutePptxBytes(pngBytes, imageWidth, imageHeight, context = {}) {
  const image = toUint8Array(pngBytes);
  assertPositiveDimensions(imageWidth, imageHeight);
  const data = normalizeContext(context);
  const presentation = new PptxGenJS();
  presentation.layout = "LAYOUT_WIDE";
  presentation.author = "VSM7";
  presentation.company = String(context.organizationName || "VSM7").trim() || "VSM7";
  presentation.subject = data.subtitle;
  presentation.title = data.title;
  presentation.lang = "en-US";
  presentation.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: "en-US"
  };

  addRouteImageSlide(presentation, image, imageWidth, imageHeight, data);
  chunk(data.findings, 6).forEach((findings, index, pages) => {
    addFindingsSlide(presentation, data, findings, index + 1, pages.length);
  });

  const output = await presentation.write({ outputType: "uint8array", compression: true });
  return toUint8Array(output);
}

function addRouteImageSlide(presentation, image, imageWidth, imageHeight, data) {
  const slide = presentation.addSlide();
  slide.background = { color: "F4F7F8" };
  slide.addText(data.title, {
    x: 0.5, y: 0.28, w: 12.33, h: 0.44,
    fontFace: "Aptos Display", fontSize: 26, bold: true, color: "17212B", margin: 0,
    breakLine: false, fit: "shrink"
  });
  slide.addText(data.subtitle, {
    x: 0.5, y: 0.78, w: 12.33, h: 0.28,
    fontFace: "Aptos", fontSize: 11, color: "586777", margin: 0,
    breakLine: false, fit: "shrink"
  });

  const frame = { x: 0.5, y: 1.2, w: 12.33, h: 5.72 };
  const fitted = fitRect(imageWidth, imageHeight, frame.w, frame.h);
  slide.addImage({
    data: `data:image/png;base64,${bytesToBase64(image)}`,
    x: frame.x + ((frame.w - fitted.width) / 2),
    y: frame.y + ((frame.h - fitted.height) / 2),
    w: fitted.width,
    h: fitted.height
  });
  slide.addText(data.footer, {
    x: 0.5, y: 7.12, w: 12.33, h: 0.18,
    fontFace: "Aptos", fontSize: 8, color: "70808D", margin: 0,
    align: "right", breakLine: false, fit: "shrink"
  });
}

function addFindingsSlide(presentation, data, findings, page, pageCount) {
  const slide = presentation.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addText("E2E Robustness Findings", {
    x: 0.5, y: 0.3, w: 9.5, h: 0.42,
    fontFace: "Aptos Display", fontSize: 25, bold: true, color: "17212B", margin: 0,
    fit: "shrink"
  });
  slide.addText(`${data.subtitle} | ${page}/${pageCount}`, {
    x: 0.5, y: 0.8, w: 12.33, h: 0.24,
    fontFace: "Aptos", fontSize: 10, color: "586777", margin: 0,
    fit: "shrink"
  });

  findings.forEach((item, index) => {
    const y = 1.25 + (index * 0.92);
    const heading = [item.category, item.severity].filter(Boolean).join(" / ");
    slide.addText(`${heading} | ${item.affectedElement}`, {
      x: 0.68, y, w: 11.95, h: 0.26,
      fontFace: "Aptos", fontSize: 14, bold: true, color: "2E82B7", margin: 0,
      fit: "shrink"
    });
    slide.addText(item.note || "No note recorded.", {
      x: 0.92, y: y + 0.31, w: 11.7, h: 0.42,
      fontFace: "Aptos", fontSize: 11, color: "33404D", margin: 0,
      valign: "top", fit: "shrink"
    });
  });
}

function bytesToBase64(bytes) {
  const source = toUint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < source.length; offset += chunkSize) {
    binary += String.fromCharCode(...source.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export function readPngDimensions(bytes) {
  const source = toUint8Array(bytes);
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (source.length < 24 || !signature.every((byte, index) => source[index] === byte)) {
    throw new Error("The route editor did not return a valid PNG illustration.");
  }

  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  assertPositiveDimensions(width, height);
  return { width, height };
}

async function convertPngBlobToJpeg(blob) {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error("PNG conversion is only available in the browser.");
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("The browser could not prepare the PDF image.");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.92);
    return {
      bytes: new Uint8Array(await jpegBlob.arrayBuffer()),
      width: canvas.width,
      height: canvas.height
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The route illustration could not be read."));
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("The route illustration could not be converted for PDF export."));
      }
    }, type, quality);
  });
}

function buildPdfRoutePage(data, imageWidth, imageHeight) {
  const imageBox = fitRect(imageWidth, imageHeight, 770, 455);
  const x = 36 + ((770 - imageBox.width) / 2);
  const y = 42 + ((455 - imageBox.height) / 2);
  return [
    "0.09 0.13 0.18 rg",
    pdfTextLine(data.title, 36, 556, 22, true),
    "0.32 0.38 0.45 rg",
    pdfTextLine(data.subtitle, 36, 531, 10, false),
    "0.75 0.78 0.81 RG 0.7 w",
    `36 36 770 470 re S`,
    "q",
    `${imageBox.width.toFixed(2)} 0 0 ${imageBox.height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm`,
    "/Route Do",
    "Q",
    "0.32 0.38 0.45 rg",
    pdfTextLine(data.footer, 36, 20, 8, false)
  ].join("\n");
}

function buildPdfFindingsPage(data, findings, page, pageCount) {
  const lines = [
    "0.09 0.13 0.18 rg",
    pdfTextLine("E2E Robustness Findings", 36, 556, 22, true),
    "0.32 0.38 0.45 rg",
    pdfTextLine(`${data.subtitle} - findings ${page}/${pageCount}`, 36, 531, 10, false)
  ];
  let y = 492;

  findings.forEach((finding) => {
    lines.push("0.18 0.51 0.72 rg");
    lines.push(pdfTextLine(`${finding.category} / ${finding.severity}`, 46, y, 12, true));
    y -= 18;
    lines.push("0.19 0.24 0.30 rg");
    const description = `${finding.affectedElement}${finding.note ? `: ${finding.note}` : ""}`;
    wrapText(description, 104).slice(0, 4).forEach((line) => {
      lines.push(pdfTextLine(line, 46, y, 10, false));
      y -= 14;
    });
    y -= 12;
    lines.push("0.82 0.84 0.85 RG 0.5 w");
    lines.push(`46 ${y + 5} 750 0 re S`);
  });

  lines.push("0.32 0.38 0.45 rg");
  lines.push(pdfTextLine(data.footer, 36, 20, 8, false));
  return lines.join("\n");
}

function pdfTextLine(value, x, y, size, bold) {
  const safe = escapePdfText(value);
  return `BT /F1 ${size} Tf ${bold ? "0.25" : "0"} Tc 1 0 0 1 ${x} ${y} Tm (${safe}) Tj ET`;
}

function escapePdfText(value) {
  return sanitizeLatinText(value).replace(/([\\()])/g, "\\$1");
}

function pdfStream(content) {
  return joinBytes(ascii(`<< /Length ${content.length} >>\nstream\n`), content, ascii("\nendstream"));
}

function buildPdf(objects) {
  const maxId = Math.max(...objects.keys());
  const chunks = [ascii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  const offsets = Array(maxId + 1).fill(0);
  let length = chunks[0].length;

  for (let id = 1; id <= maxId; id += 1) {
    const body = objects.get(id);
    if (!body) {
      throw new Error(`Missing PDF object ${id}.`);
    }
    offsets[id] = length;
    const object = joinBytes(ascii(`${id} 0 obj\n`), body, ascii("\nendobj\n"));
    chunks.push(object);
    length += object.length;
  }

  const xrefOffset = length;
  const xref = [
    `xref\n0 ${maxId + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  ].join("");
  chunks.push(ascii(xref));
  return joinBytes(...chunks);
}

function normalizeContext(context) {
  const findings = Array.isArray(context.findings) ? context.findings : [];
  const sctNumber = String(context.sctNumber || "SCT").trim();
  const sctTitle = String(context.sctTitle || "E2E route").trim();
  const projectName = String(context.projectName || "VSM7 project").trim();
  const routeName = String(context.routeName || `${sctNumber} E2E route`).trim();
  return {
    title: routeName,
    subtitle: `${projectName} | ${sctNumber} | ${sctTitle}`,
    footer: `Generated from VSM7 | ${String(context.organizationName || "").trim()}`,
    filenameBase: slug(`${sctNumber}-${sctTitle}-e2e-route`),
    findings: findings.map((item) => ({
      category: titleCase(item.category || item.finding?.category || "finding"),
      severity: titleCase(item.severity || item.finding?.severity || ""),
      note: String(item.note || item.finding?.note || "").trim(),
      affectedElement: String(item.affectedElement || "Route element").trim()
    }))
  };
}

function buildFilename(context, extension) {
  return `${normalizeContext(context).filenameBase}.${extension}`;
}

function fitRect(width, height, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * scale, height: height * scale };
}

function wrapText(value, maxLength) {
  const words = sanitizeLatinText(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

function titleCase(value) {
  return String(value).replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slug(value) {
  const result = String(value).toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
  return result || "e2e-route";
}

function sanitizeLatinText(value) {
  return String(value ?? "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
}

function ascii(value) {
  return encoder.encode(value);
}

function toUint8Array(value) {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}

function joinBytes(...parts) {
  const bytes = parts.map(toUint8Array);
  const total = bytes.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  bytes.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function assertPositiveDimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("The route illustration has invalid dimensions.");
  }
}
