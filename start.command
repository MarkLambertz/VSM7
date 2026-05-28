#!/bin/zsh
set -e

cd "$(dirname "$0")"

PORT="${PORT:-4174}"
APP_URL="http://localhost:${PORT}"

if lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "VSM7 is already running at ${APP_URL}"
  open "${APP_URL}"
  exit 0
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Please install Node.js or add npm to your PATH."
  exit 1
fi

echo "Starting VSM7 at ${APP_URL}"
(sleep 1 && open "${APP_URL}") &
PORT="${PORT}" npm run dev
