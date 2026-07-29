#!/bin/zsh
set -e

cd "$(dirname "$0")"

PORT=4173
HOST="localhost"
URL="http://${HOST}:${PORT}/"
VERSION="20260729-brand-home-link"
EXPECTED_TITLE="VSM7 Workshop Workspace"
SERVER_SCRIPT="scripts/vsm7_file_server.py"
WORKSPACE_DIR="${VSM7_WORKSPACE_DIR:-$(pwd)/VSM7-Workspaces}"

server_pids() {
  lsof -tiTCP:${PORT} -sTCP:LISTEN 2>/dev/null || true
}

serves_vsm7() {
  command -v curl >/dev/null 2>&1 || return 1
  curl -fsS --max-time 2 "${URL}?health=$(date +%s)" 2>/dev/null | grep -q "${EXPECTED_TITLE}"
}

serves_vsm7_file_server() {
  command -v curl >/dev/null 2>&1 || return 1
  curl -fsS --max-time 2 "${URL}api/storage/health" 2>/dev/null | grep -q '"mode": "file"'
}

if [ -n "$(server_pids)" ]; then
  if serves_vsm7 && serves_vsm7_file_server; then
    echo "VSM7 is already running in file-backed mode on ${URL}"
    open "${URL}?v=${VERSION}"
    exit 0
  fi

  echo "Port ${PORT} is occupied by another local app or an older VSM7 server. Stopping it..."
  PIDS="$(server_pids)"
  echo "Stopping process id(s): ${PIDS}"
  kill ${=PIDS} 2>/dev/null || true
  sleep 1

  if [ -n "$(server_pids)" ]; then
    echo "Still occupied. Forcing stop..."
    PIDS="$(server_pids)"
    kill -9 ${=PIDS} 2>/dev/null || true
    sleep 1
  fi

  if [ -n "$(server_pids)" ]; then
    echo "Could not free port ${PORT}. Please run this once in Terminal:"
    echo "lsof -tiTCP:${PORT} -sTCP:LISTEN | xargs kill -9"
    exit 1
  fi
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required to run VSM7 locally on a fixed port."
  exit 1
fi

if [ ! -f "${SERVER_SCRIPT}" ]; then
  echo "Missing ${SERVER_SCRIPT}. Cannot start file-backed VSM7."
  exit 1
fi

echo "Starting VSM7 from: $(pwd)"
echo "Saving workspaces to: ${WORKSPACE_DIR}"
echo "Opening ${URL}?v=${VERSION}"
open "${URL}?v=${VERSION}"
python3 "${SERVER_SCRIPT}" --port "${PORT}" --host "${HOST}" --root "$(pwd)" --workspace-dir "${WORKSPACE_DIR}"
