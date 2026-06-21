#!/bin/zsh
set -e

cd "$(dirname "$0")"

PORT=4173
HOST="localhost"
URL="http://${HOST}:${PORT}/"
VERSION="20260621-channel-variety-eight"
EXPECTED_TITLE="VSM7 Workshop Workspace"

server_pids() {
  lsof -tiTCP:${PORT} -sTCP:LISTEN 2>/dev/null || true
}

serves_vsm7() {
  command -v curl >/dev/null 2>&1 || return 1
  curl -fsS --max-time 2 "${URL}?health=$(date +%s)" 2>/dev/null | grep -q "${EXPECTED_TITLE}"
}

if [ -n "$(server_pids)" ]; then
  if serves_vsm7; then
    echo "VSM7 is already running on ${URL}"
    open "${URL}?v=${VERSION}"
    exit 0
  fi

  echo "Port ${PORT} is occupied by another local app. Stopping it..."
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

echo "Starting VSM7 from: $(pwd)"
echo "Opening ${URL}?v=${VERSION}"
open "${URL}?v=${VERSION}"
python3 -m http.server "${PORT}" --bind "${HOST}"
