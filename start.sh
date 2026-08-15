#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${APP_DIR}"

PORT=4173
HOST="localhost"
URL="http://${HOST}:${PORT}/"
VERSION="20260814-step1-weighted-evaluation"
EXPECTED_TITLE="VSM7 Workshop Workspace"
SERVER_SCRIPT="scripts/vsm7_file_server.py"
WORKSPACE_DIR="${VSM7_WORKSPACE_DIR:-${APP_DIR}/VSM7-Workspaces}"
TARGET_URL="${URL}?v=${VERSION}"

fetch_url() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 2 "$1"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -q -T 2 -O - "$1"
    return
  fi

  python3 - "$1" <<'PY'
import sys
import urllib.request

with urllib.request.urlopen(sys.argv[1], timeout=2) as response:
    sys.stdout.buffer.write(response.read())
PY
}

serves_vsm7() {
  fetch_url "${URL}?health=$(date +%s)" 2>/dev/null | grep -q "${EXPECTED_TITLE}"
}

serves_file_backed_vsm7() {
  fetch_url "${URL}api/storage/health" 2>/dev/null | grep -q '"mode": "file"'
}

port_is_occupied() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :${PORT}" 2>/dev/null | awk 'NR > 1 { found = 1 } END { exit found ? 0 : 1 }'
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1
    return
  fi

  if command -v fuser >/dev/null 2>&1; then
    fuser -n tcp "${PORT}" >/dev/null 2>&1
    return
  fi

  python3 - "$HOST" "$PORT" <<'PY'
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    try:
        sock.bind((host, port))
    except OSError:
        raise SystemExit(0)

raise SystemExit(1)
PY
}

show_port_owner() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :${PORT}" 2>/dev/null || true
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null || true
    return
  fi

  if command -v fuser >/dev/null 2>&1; then
    fuser -v -n tcp "${PORT}" 2>/dev/null || true
  fi
}

open_browser() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${TARGET_URL}" >/dev/null 2>&1 || true
    return
  fi

  echo "Open this URL in your browser: ${TARGET_URL}"
}

if [ ! -f "${SERVER_SCRIPT}" ]; then
  echo "Missing ${SERVER_SCRIPT}. Cannot start VSM7."
  exit 1
fi

if serves_vsm7 && serves_file_backed_vsm7; then
  echo "VSM7 is already running on ${URL}"
  open_browser
  exit 0
fi

if port_is_occupied; then
  echo "Port ${PORT} is already in use."
  echo "Close the application using it, then run ./start.sh again."
  echo
  echo "Current listener details:"
  show_port_owner
  exit 1
fi

echo "Starting VSM7 from: ${APP_DIR}"
echo "Saving workspaces to: ${WORKSPACE_DIR}"
echo "Opening ${TARGET_URL}"
echo "Keep this terminal open while using VSM7. Press Ctrl+C to stop the server."
echo

(sleep 0.9; open_browser) &
python3 "${SERVER_SCRIPT}" --port "${PORT}" --host "${HOST}" --root "${APP_DIR}" --workspace-dir "${WORKSPACE_DIR}"
