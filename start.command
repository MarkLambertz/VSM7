#!/bin/zsh
set -e

cd "$(dirname "$0")"

PORT="${PORT:-4174}"
VERSION="step2-neutral"
APP_URL="http://localhost:${PORT}"
EXPECTED_TITLE="VSM7 Workshop Workspace"

# Check if port is already in use
if lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "VSM7 is already running at ${APP_URL}"
  open "${APP_URL}"
  exit 0
fi

# Try Python 3 first (built-in on macOS)
if command -v python3 >/dev/null 2>&1; then
  echo "Starting VSM7 at ${APP_URL} (using Python HTTP server)"
  (sleep 2 && open "${APP_URL}") &
  python3 -m http.server ${PORT}
  exit 0
fi

# Fallback to Node.js http-server if available
if command -v npx >/dev/null 2>&1; then
  echo "Starting VSM7 at ${APP_URL} (using Node.js http-server)"
  (sleep 2 && open "${APP_URL}") &
  npx http-server -p ${PORT} -c-1
  exit 0
fi

# Last resort: just open the file directly (may have CORS issues)
echo "No HTTP server found. Opening VSM7 directly (CORS warnings may appear)"
echo "For best results, install Python or Node.js"
open "index.html"
