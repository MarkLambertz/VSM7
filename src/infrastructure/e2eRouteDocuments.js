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
    const bytes = buildE2ERoutePptxBytes(pngBytes, width, height, context);
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

export function buildE2ERoutePptxBytes(pngBytes, imageWidth, imageHeight, context = {}) {
  const image = toUint8Array(pngBytes);
  assertPositiveDimensions(imageWidth, imageHeight);
  const data = normalizeContext(context);
  const includeFindingsSlide = data.findings.length > 0;
  const slideCount = includeFindingsSlide ? 2 : 1;
  const entries = [
    ["[Content_Types].xml", contentTypesXml(slideCount)],
    ["_rels/.rels", rootRelationshipsXml()],
    ["docProps/app.xml", appPropertiesXml(slideCount)],
    ["docProps/core.xml", corePropertiesXml(data)],
    ["ppt/presentation.xml", presentationXml(slideCount)],
    ["ppt/_rels/presentation.xml.rels", presentationRelationshipsXml(slideCount)],
    ["ppt/presProps.xml", presentationPropertiesXml()],
    ["ppt/viewProps.xml", viewPropertiesXml()],
    ["ppt/tableStyles.xml", tableStylesXml()],
    ["ppt/slideMasters/slideMaster1.xml", slideMasterXml()],
    ["ppt/slideMasters/_rels/slideMaster1.xml.rels", slideMasterRelationshipsXml()],
    ["ppt/slideLayouts/slideLayout1.xml", slideLayoutXml()],
    ["ppt/slideLayouts/_rels/slideLayout1.xml.rels", slideLayoutRelationshipsXml()],
    ["ppt/theme/theme1.xml", themeXml()],
    ["ppt/slides/slide1.xml", routeSlideXml(data, imageWidth, imageHeight)],
    ["ppt/slides/_rels/slide1.xml.rels", routeSlideRelationshipsXml()],
    ["ppt/media/route.png", image]
  ];

  if (includeFindingsSlide) {
    entries.push(
      ["ppt/slides/slide2.xml", findingsSlideXml(data)],
      ["ppt/slides/_rels/slide2.xml.rels", slideRelationshipsXml()]
    );
  }

  return createStoredZip(entries);
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

function routeSlideXml(data, imageWidth, imageHeight) {
  const slideWidth = 12192000;
  const imageArea = { x: 457200, y: 1220000, width: 11277600, height: 5150000 };
  const fit = fitRect(imageWidth, imageHeight, imageArea.width, imageArea.height);
  const x = imageArea.x + ((imageArea.width - fit.width) / 2);
  const y = imageArea.y + ((imageArea.height - fit.height) / 2);
  return slideXml([
    textShapeXml(2, "Route title", 457200, 254000, 11277600, 520000, data.title, 3000, true, "17212B"),
    textShapeXml(3, "Route context", 457200, 780000, 11277600, 300000, data.subtitle, 1300, false, "586777"),
    pictureXml(4, x, y, fit.width, fit.height)
  ].join(""));
}

function findingsSlideXml(data) {
  const items = data.findings.slice(0, 8).map((finding) => ({
    title: `${finding.category} / ${finding.severity} - ${finding.affectedElement}`,
    note: finding.note || "No observation captured."
  }));
  const shapes = [
    textShapeXml(2, "Findings title", 457200, 254000, 11277600, 520000, "E2E Robustness Findings", 3000, true, "17212B"),
    textShapeXml(3, "Findings context", 457200, 780000, 11277600, 300000, data.subtitle, 1300, false, "586777")
  ];
  let y = 1250000;
  items.forEach((item, index) => {
    shapes.push(textShapeXml(4 + (index * 2), `Finding ${index + 1}`, 600000, y, 10900000, 300000, item.title, 1600, true, "2E82B7"));
    shapes.push(textShapeXml(5 + (index * 2), `Finding note ${index + 1}`, 850000, y + 300000, 10650000, 360000, item.note, 1250, false, "33404D"));
    y += 650000;
  });
  return slideXml(shapes.join(""));
}

function slideXml(shapes) {
  return `${xmlHeader()}<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree>${groupShapeXml()}${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

function textShapeXml(id, name, x, y, cx, cy, text, size, bold, color) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${xmlEscape(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${Math.round(x)}" y="${Math.round(y)}"/><a:ext cx="${Math.round(cx)}" cy="${Math.round(cy)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="${size}" b="${bold ? 1 : 0}" dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Aptos"/></a:rPr><a:t>${xmlEscape(text)}</a:t></a:r><a:endParaRPr lang="en-US" sz="${size}"/></a:p></p:txBody></p:sp>`;
}

function pictureXml(id, x, y, cx, cy) {
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="E2E route illustration"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${Math.round(x)}" y="${Math.round(y)}"/><a:ext cx="${Math.round(cx)}" cy="${Math.round(cy)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}

function groupShapeXml() {
  return `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`;
}

function contentTypesXml(slideCount) {
  const slides = Array.from({ length: slideCount }, (_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("");
  return `${xmlHeader()}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slides}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
}

function rootRelationshipsXml() {
  return `${xmlHeader()}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
}

function presentationXml(slideCount) {
  const slides = Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${2 + index}"/>`).join("");
  return `${xmlHeader()}<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle/></p:presentation>`;
}

function presentationRelationshipsXml(slideCount) {
  const slides = Array.from({ length: slideCount }, (_, index) => `<Relationship Id="rId${2 + index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join("");
  return `${xmlHeader()}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slides}<Relationship Id="rId${2 + slideCount}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/><Relationship Id="rId${3 + slideCount}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/><Relationship Id="rId${4 + slideCount}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/></Relationships>`;
}

function slideMasterXml() {
  return `${xmlHeader()}<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree>${groupShapeXml()}</p:spTree></p:cSld><p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`;
}

function slideMasterRelationshipsXml() {
  return `${xmlHeader()}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`;
}

function slideLayoutXml() {
  return `${xmlHeader()}<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${groupShapeXml()}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
}

function slideLayoutRelationshipsXml() {
  return `${xmlHeader()}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;
}

function routeSlideRelationshipsXml() {
  return `${xmlHeader()}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/route.png"/></Relationships>`;
}

function slideRelationshipsXml() {
  return `${xmlHeader()}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`;
}

function themeXml() {
  return `${xmlHeader()}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="VSM7"><a:themeElements><a:clrScheme name="VSM7"><a:dk1><a:srgbClr val="17212B"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="33404D"/></a:dk2><a:lt2><a:srgbClr val="F4F7F8"/></a:lt2><a:accent1><a:srgbClr val="2E82B7"/></a:accent1><a:accent2><a:srgbClr val="238477"/></a:accent2><a:accent3><a:srgbClr val="F4BE3C"/></a:accent3><a:accent4><a:srgbClr val="E5614F"/></a:accent4><a:accent5><a:srgbClr val="73B66E"/></a:accent5><a:accent6><a:srgbClr val="9EC2D8"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="VSM7"><a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="VSM7"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;
}

function appPropertiesXml(slideCount) {
  return `${xmlHeader()}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>VSM7</Application><PresentationFormat>Widescreen</PresentationFormat><Slides>${slideCount}</Slides><Notes>0</Notes><HiddenSlides>0</HiddenSlides><ScaleCrop>false</ScaleCrop><AppVersion>1.0</AppVersion></Properties>`;
}

function corePropertiesXml(data) {
  const now = new Date().toISOString();
  return `${xmlHeader()}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEscape(data.title)}</dc:title><dc:creator>VSM7</dc:creator><cp:lastModifiedBy>VSM7</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
}

function presentationPropertiesXml() {
  return `${xmlHeader()}<p:presentationPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`;
}

function viewPropertiesXml() {
  return `${xmlHeader()}<p:viewPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:normalViewPr/><p:slideViewPr/><p:notesTextViewPr/><p:gridSpacing cx="72008" cy="72008"/></p:viewPr>`;
}

function tableStylesXml() {
  return `${xmlHeader()}<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`;
}

function createStoredZip(entries) {
  const now = new Date();
  const { date, time } = dosDateTime(now);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, value] of entries) {
    const nameBytes = encoder.encode(name);
    const data = typeof value === "string" ? encoder.encode(value) : toUint8Array(value);
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, time, true);
    localView.setUint16(12, date, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralDirectory = joinBytes(...centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, offset, true);
  return joinBytes(...localParts, centralDirectory, end);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  };
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

function xmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
  })[character]);
}

function xmlHeader() {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
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
