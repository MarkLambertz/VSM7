const exportFormats = new Set(["png", "svg"]);

export function createE2ERouteExportCoordinator(options = {}) {
  const pending = new Map();
  const send = options.send;
  const createRequestId = options.createRequestId || defaultRequestId;

  if (typeof send !== "function") {
    throw new TypeError("An E2E export send function is required.");
  }

  return {
    request(frame, format, filename = "") {
      if (!exportFormats.has(format)) {
        return Promise.reject(new Error(`Unsupported route export format: ${format}`));
      }

      const requestId = createRequestId();
      const message = { cmd: "export", format, requestId };
      if (filename) {
        message.filename = filename;
      }

      return new Promise((resolve, reject) => {
        pending.set(requestId, { frame, resolve, reject });
        try {
          send(frame, message);
        } catch (error) {
          pending.delete(requestId);
          reject(error);
        }
      });
    },

    handle(frame, message) {
      if (!message || !["exportReady", "exportError"].includes(message.evt)) {
        return false;
      }

      const request = pending.get(message.requestId);
      if (!request || request.frame !== frame) {
        return false;
      }

      pending.delete(message.requestId);
      if (message.evt === "exportError") {
        request.reject(new Error(message.message || "The route export failed."));
        return true;
      }

      if (!isBlobLike(message.blob)) {
        request.reject(new Error("The route editor returned an invalid export file."));
        return true;
      }

      request.resolve(message);
      return true;
    },

    pendingCount(frame) {
      return [...pending.values()].filter((request) => !frame || request.frame === frame).length;
    }
  };
}

function isBlobLike(value) {
  return Boolean(value)
    && typeof value.arrayBuffer === "function"
    && typeof value.type === "string";
}

function defaultRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `e2e-export-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
