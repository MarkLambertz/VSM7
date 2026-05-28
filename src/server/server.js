import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFileWorkspaceStore } from "./fileWorkspaceStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const port = Number(process.env.PORT || 4173);
const store = createFileWorkspaceStore({
  filePath: process.env.VSM7_DATA_FILE || path.join(projectRoot, "data", "workspaces.json")
});

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    await serveStaticFile(request, response, url);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Unexpected server error" });
  }
});

server.listen(port, () => {
  console.log(`VSM7 app running at http://localhost:${port}`);
});

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/workspaces/state") {
    sendJson(response, 200, await store.getState());
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/workspaces/state") {
    sendJson(response, 200, await store.replaceState(await readJsonBody(request)));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/workspaces") {
    sendJson(response, 200, await store.listProjects());
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/api/workspaces") {
    sendJson(response, 200, await store.clear());
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/workspaces/active") {
    sendJson(response, 200, await store.getActiveWorkspace());
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/workspaces/active") {
    const body = await readJsonBody(request);
    sendJson(response, 200, { activeProjectId: await store.setActiveProject(body.projectId) });
    return;
  }

  const workspaceMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)$/);
  if (workspaceMatch) {
    const projectId = decodeURIComponent(workspaceMatch[1]);
    await handleWorkspaceRequest(request, response, projectId);
    return;
  }

  sendJson(response, 404, { error: "API route not found" });
}

async function handleWorkspaceRequest(request, response, projectId) {
  if (request.method === "GET") {
    const workspace = await store.getWorkspace(projectId);
    sendJson(response, workspace ? 200 : 404, workspace || { error: "Workspace not found" });
    return;
  }

  if (request.method === "PUT") {
    const body = await readJsonBody(request);
    const workspace = body.workspace || body;
    if (!workspace?.project?.id || workspace.project.id !== projectId) {
      sendJson(response, 400, { error: "Workspace id does not match route" });
      return;
    }

    sendJson(response, 200, await store.saveWorkspace(workspace, { activate: body.activate !== false }));
    return;
  }

  if (request.method === "DELETE") {
    sendJson(response, 200, await store.deleteWorkspace(projectId));
    return;
  }

  sendJson(response, 405, { error: "Method not allowed" });
}

async function serveStaticFile(request, response, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(projectRoot, requestedPath);

  if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${path.sep}`)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": contentType(filePath),
      "cache-control": "no-store"
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendText(response, 404, "Not found");
      return;
    }

    throw error;
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 12_000_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(text);
}

function contentType(filePath) {
  const extension = path.extname(filePath);
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
  };

  return types[extension] || "application/octet-stream";
}
